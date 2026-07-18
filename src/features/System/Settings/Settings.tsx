import "./Settings.css";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { useIconSettings } from "@/components/IconContext";
import type { CooperativeProfile } from "@/types";
import { deleteCooperative } from "./settingsDb";
import { isDemoCooperative, seedDemoCooperativeAtLevel, type DemoLevel } from "@/db/seed-demo";
import { sfx } from "@/features/System/ProfileSelect/sfx";
import { invalidateAllCoopDbs } from "@/db/coopDb";
import { closeRegistryDb } from "@/db/registry";
import { appDataDir, join } from "@tauri-apps/api/path";
import { remove, exists } from "@tauri-apps/plugin-fs";
import {
  MoonIcon,
  SunIcon,
  GlobeIcon,
  TextAaIcon,
  PaintBucketIcon,
  WarningIcon,
  ArchiveIcon,
  SpeakerHighIcon,
  SpeakerXIcon,
} from "@phosphor-icons/react";
import BackupRestoreCard from "@/features/System/Backup/BackupRestoreCard";

interface Props {
  coopProfile: CooperativeProfile | null;
  fontSizeSetting: "small" | "normal" | "large" | "xlarge";
  setFontSizeSetting: (v: "small" | "normal" | "large" | "xlarge") => void;
  appTheme: "dark" | "light";
  setAppTheme: (v: "dark" | "light") => void;
  onSwitchProfile: () => void;
}

const FONT_LEVELS = [
  { value: "small", label: "settings.preferences.fontSmall" },
  { value: "normal", label: "settings.preferences.fontNormal" },
  { value: "large", label: "settings.preferences.fontLarge" },
  { value: "xlarge", label: "settings.preferences.fontXLarge" },
] as const;

const THEME_OPTIONS = [
  { value: "dark", icon: MoonIcon, label: "settings.preferences.themeDark" },
  { value: "light", icon: SunIcon, label: "settings.preferences.themeLight" },
] as const;

const LANG_OPTIONS = [
  { value: "id", flag: "🇮🇩", label: "settings.preferences.languageId" },
  { value: "en", flag: "🇬🇧", label: "settings.preferences.languageEn" },
] as const;

const ICON_WEIGHTS = [
  { value: "thin", label: "Tn" },
  { value: "light", label: "Lt" },
  { value: "regular", label: "Rg" },
  { value: "bold", label: "Bd" },
  { value: "fill", label: "Fl" },
  { value: "duotone", label: "Dt" },
] as const;

export default function Settings({
  coopProfile,
  fontSizeSetting,
  setFontSizeSetting,
  appTheme,
  setAppTheme,
  onSwitchProfile,
}: Props) {
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language);
  const [soundOn, setSoundOn] = useState(sfx.enabled);
  const toast = useToast();
  const { settings: iconSettings, setWeight } = useIconSettings();
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isDemo = isDemoCooperative(coopProfile);

  const handleFactoryReset = async () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    setResetting(true);
    try {
      // Close all open SQL connections first — rusqlite holds file locks on
      // Windows (os error 32), so the db files must be released before removal.
      await invalidateAllCoopDbs();
      await closeRegistryDb();
      const dataDir = await appDataDir();
      // Wipe the registry and every cooperative's data file.
      const registryPath = await join(dataDir, "registry.db");
      if (await exists(registryPath)) await remove(registryPath);
      const coopsDir = await join(dataDir, "coops");
      if (await exists(coopsDir)) await remove(coopsDir, { recursive: true });
      localStorage.clear();
      window.location.reload();
    } catch (err) {
      toast.error(String(err));
      setResetting(false);
      setResetConfirm(false);
    }
  };

  const handleDeleteCooperative = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    if (!coopProfile?.id) return;
    setDeleting(true);
    try {
      await deleteCooperative(coopProfile.id);
      localStorage.removeItem("pakde-active-profile-id");
      onSwitchProfile();
    } catch (err) {
      toast.error(String(err));
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleResetDemo = async () => {
    setDeleting(true);
    try {
      const tier = (localStorage.getItem("pakde-demo-tier") as DemoLevel | null) ?? "lanjutan";
      await seedDemoCooperativeAtLevel(tier);
      toast.success(L_DEMO_RESET_OK);
      window.location.reload();
    } catch (err) {
      toast.error(String(err));
    }
    setDeleting(false);
  };

  if (!coopProfile) return <div className="text-muted-foreground text-xs">{t("common.loading")}</div>;

  const bannerBase =
    "flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 cursor-pointer transition-all text-center";
  const bannerActive = "border-success/50 bg-success/10";
  const L_RESET_DEMO = "Reset Demo";
  const L_DELETE_COOP = "Hapus Koperasi";
  const L_RESET_DESC = "Kembalikan demo ke data awal. Semua perubahan akan hilang.";
  const L_DELETE_DESC = "Hapus koperasi ini beserta seluruh data secara permanen.";
  const L_CONFIRM_RESET = "Klik lagi untuk reset";
  const L_CONFIRM_DELETE = "Klik lagi untuk hapus";
  const L_PROCESSING = "Memproses...";
  const L_DEMO_RESET_OK = "Demo account reset successfully.";
  const bannerInactive = "border-border bg-muted/40 hover:border-muted-foreground/30 hover:bg-muted/70";

  return (
    <div className="space-y-6">
      {/* ── Two-column: Preferences (left) + Profiles (right) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Left: Interface Preferences ── */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <PaintBucketIcon className="h-3.5 w-3.5 text-success" />
              {t("settings.preferences.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            {/* Language */}
            <div className="space-y-2">
              <label className="text-xxs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <GlobeIcon className="h-3 w-3 text-slate-500" />
                {t("settings.preferences.language")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {LANG_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      i18n.changeLanguage(opt.value);
                      setLang(opt.value);
                    }}
                    className={`${bannerBase} ${lang === opt.value ? bannerActive : bannerInactive}`}
                  >
                    <span className="text-2xl">{opt.flag}</span>
                    <span className="text-xxs font-bold text-foreground">{t(opt.label)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div className="space-y-2">
              <label className="text-xxs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <PaintBucketIcon className="h-3 w-3 text-slate-500" />
                {t("settings.preferences.theme")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {THEME_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setAppTheme(opt.value)}
                      className={`${bannerBase} ${appTheme === opt.value ? bannerActive : bannerInactive}`}
                    >
                      <Icon className="h-5 w-5" weight={appTheme === opt.value ? "fill" : "regular"} />
                      <span className="text-xxs font-bold text-foreground">{t(opt.label)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <label className="text-xxs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <TextAaIcon className="h-3 w-3 text-slate-500" />
                {t("settings.preferences.fontSize")}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {FONT_LEVELS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFontSizeSetting(opt.value)}
                    className={`py-2 px-1 rounded-lg border-2 cursor-pointer transition-all text-center ${
                      fontSizeSetting === opt.value ? bannerActive : bannerInactive
                    }`}
                  >
                    <span className="text-xxs font-bold text-foreground">{t(opt.label)}</span>
                  </button>
                ))}
              </div>
              <p className="text-xxxs text-muted-foreground font-mono">{t("settings.preferences.fontHint")}</p>
            </div>

            {/* Sound */}
            <div className="space-y-2">
              <label className="text-xxs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                {soundOn ? (
                  <SpeakerHighIcon className="h-3 w-3 text-slate-500" />
                ) : (
                  <SpeakerXIcon className="h-3 w-3 text-slate-500" />
                )}
                {t("settings.preferences.sound")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: true, label: t("settings.preferences.soundOn") },
                  { value: false, label: t("settings.preferences.soundOff") },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => {
                      const next = sfx.toggleSound(opt.value);
                      setSoundOn(next);
                    }}
                    className={`${bannerBase} ${soundOn === opt.value ? bannerActive : bannerInactive}`}
                  >
                    {opt.value ? (
                      <SpeakerHighIcon className="h-5 w-5" weight="fill" />
                    ) : (
                      <SpeakerXIcon className="h-5 w-5" weight="fill" />
                    )}
                    <span className="text-xxs font-bold text-foreground">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Weight */}
            <div className="space-y-2">
              <label className="text-xxs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <PaintBucketIcon className="h-3 w-3 text-slate-500" />
                {t("settings.preferences.iconWeight")}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {ICON_WEIGHTS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setWeight(opt.value)}
                    className={`py-2 rounded-lg border-2 cursor-pointer transition-all text-center ${
                      iconSettings.weight === opt.value ? bannerActive : bannerInactive
                    }`}
                  >
                    <span className="text-xxxs font-bold text-foreground">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Right: User actions ── */}
        <div className="space-y-6">
          {/* Delete / Reset */}
          <Card className={`bg-card ${isDemo ? "border-amber-800/30" : "border-destructive/20"}`}>
            <CardHeader>
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <WarningIcon className={`h-3.5 w-3.5 ${isDemo ? "text-amber-500" : "text-danger"}`} />
                {isDemo ? L_RESET_DEMO : L_DELETE_COOP}
              </CardTitle>
              <CardDescription className="text-xxs text-muted-foreground">
                {isDemo ? L_RESET_DESC : L_DELETE_DESC}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={isDemo ? handleResetDemo : handleDeleteCooperative}
                disabled={deleting}
                variant="outline"
                className={`w-full text-xs h-8 ${isDemo ? "border-amber-800/30 text-amber-400 hover:bg-amber-950/30" : "border-destructive/30 text-danger hover:bg-destructive/10"}`}
              >
                {deleting
                  ? L_PROCESSING
                  : isDemo
                    ? deleteConfirm
                      ? L_CONFIRM_RESET
                      : L_RESET_DEMO
                    : deleteConfirm
                      ? L_CONFIRM_DELETE
                      : L_DELETE_COOP}
              </Button>
            </CardContent>
          </Card>

          {/* Backup & Restore */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <ArchiveIcon className="h-3.5 w-3.5 text-brand" />
                {t("settings.backup.title")}
              </CardTitle>
              <CardDescription className="text-xxs text-muted-foreground">
                {t("settings.backup.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BackupRestoreCard coopId={coopProfile.id || ""} coopName={coopProfile.name} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <Card className="bg-card border-destructive/20">
        <CardHeader>
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <WarningIcon className="h-3.5 w-3.5 text-danger" />
            {t("settings.reset.title")}
          </CardTitle>
          <CardDescription className="text-xxs text-muted-foreground">
            {t("settings.reset.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleFactoryReset}
            disabled={resetting}
            className={`w-full font-bold text-xs h-9 ${
              resetConfirm
                ? "bg-danger hover:bg-danger/80 text-danger-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground border border-border"
            }`}
          >
            {resetting
              ? t("settings.reset.reseting")
              : resetConfirm
                ? t("settings.reset.confirm")
                : t("settings.reset.button")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
