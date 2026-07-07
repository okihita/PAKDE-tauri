import "./Settings.css";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUpdater } from "@/hooks/useUpdater";
import { useToast } from "@/hooks/useToast";
import { useIconSettings } from "@/components/IconContext";
import { usePalette } from "@/hooks/usePalette";
import { PALETTES } from "@/data/palettes";
import { getDb } from "@/db";
import type { CooperativeProfile } from "@/types";
import { appDataDir, join } from "@tauri-apps/api/path";
import { remove } from "@tauri-apps/plugin-fs";
import { Moon, Sun, Globe, TextAa, Palette, PaintBucket, User, Buildings, ArrowsLeftRight, Warning } from "@phosphor-icons/react";

interface Props {
  coopProfile: CooperativeProfile | null;
  setCoopProfile: (v: CooperativeProfile) => void;
  fontSizeSetting: "small" | "normal" | "large" | "xlarge";
  setFontSizeSetting: (v: "small" | "normal" | "large" | "xlarge") => void;
  appTheme: "dark" | "light";
  setAppTheme: (v: "dark" | "light") => void;
  currentUser: { id: string; name: string; role: string } | null;
  onSwitchProfile: () => void;
}

const FONT_LEVELS = [
  { value: "small", label: "settings.preferences.fontSmall" },
  { value: "normal", label: "settings.preferences.fontNormal" },
  { value: "large", label: "settings.preferences.fontLarge" },
  { value: "xlarge", label: "settings.preferences.fontXLarge" },
] as const;

const THEME_OPTIONS = [
  { value: "dark", icon: Moon, label: "settings.preferences.themeDark" },
  { value: "light", icon: Sun, label: "settings.preferences.themeLight" },
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

const i18nFieldKeys: Record<string, string> = {
  name: "name",
  legal_id: "legalId",
  address: "address",
  village: "village",
  district: "district",
  regency: "regency",
  province: "province",
  postal_code: "postalCode",
  phone: "phone",
  email: "email",
};

export default function Settings({
  coopProfile,
  setCoopProfile,
  fontSizeSetting,
  setFontSizeSetting,
  appTheme,
  setAppTheme,
  currentUser,
  onSwitchProfile,
}: Props) {
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language);
  const u = useUpdater();
  const toast = useToast();
  const { settings: iconSettings, setWeight } = useIconSettings();
  const [activePalette, setPalette] = usePalette();
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleFactoryReset = async () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    setResetting(true);
    try {
      const dataDir = await appDataDir();
      const dbPath = await join(dataDir, "kdkmp.db");
      await remove(dbPath);
      localStorage.clear();
      window.location.reload();
    } catch (err) {
      toast.error(String(err));
      setResetting(false);
      setResetConfirm(false);
    }
  };

  if (!coopProfile) return <div className="text-muted-foreground text-xs">{t("common.loading")}</div>;

  const handleFieldChange = (key: string, value: string) => {
    setCoopProfile({ ...coopProfile, [key]: value });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const db = await getDb();
      await db.execute(
        `UPDATE cooperatives SET name=?, legal_id=?, address=?, village=?, district=?, regency=?, province=?, postal_code=?, phone=?, email=?, business_units=?, officers=?, updated_at=datetime('now') WHERE id='kdp-001'`,
        [
          coopProfile.name,
          coopProfile.legal_id,
          coopProfile.address,
          coopProfile.village,
          coopProfile.district,
          coopProfile.regency,
          coopProfile.province,
          coopProfile.postal_code,
          coopProfile.phone,
          coopProfile.email,
          coopProfile.business_units,
          coopProfile.officers,
        ],
      );
      toast.success(t("toast.profileSaveSuccess"));
    } catch (err) {
      toast.error(t("toast.profileSaveFailed", { error: String(err) }));
    }
  };

  const bannerBase =
    "flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 cursor-pointer transition-all text-center";
  const bannerActive = "border-success/50 bg-success/10";
  const bannerInactive = "border-border bg-muted/40 hover:border-muted-foreground/30 hover:bg-muted/70";

  const PROFILE_FIELDS = [
    { key: "name" },
    { key: "legal_id" },
    { key: "address" },
    { key: "village" },
    { key: "district" },
    { key: "regency" },
    { key: "province" },
    { key: "postal_code" },
    { key: "phone" },
    { key: "email" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* ── Two-column: Preferences (left) + Profiles (right) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Left: Interface Preferences ── */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Palette className="h-3.5 w-3.5 text-success" />
              {t("settings.preferences.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            {/* Language */}
            <div className="space-y-2">
              <label className="text-xxs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-slate-500" />
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
                <PaintBucket className="h-3 w-3 text-slate-500" />
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
                <TextAa className="h-3 w-3 text-slate-500" />
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

            {/* Icon Weight */}
            <div className="space-y-2">
              <label className="text-xxs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="h-3 w-3 text-slate-500" />
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

            {/* Palette */}
            <div className="space-y-2">
              <label className="text-xxs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="h-3 w-3 text-slate-500" />
                {t("settings.preferences.palette")}
              </label>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  {PALETTES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPalette(p.id)}
                      className={`flex flex-col items-center gap-1.5 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                        activePalette.id === p.id ? bannerActive : bannerInactive
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-white/20"
                        style={{ backgroundColor: p.swatch }}
                      />
                      <span className="text-xxxs font-bold text-foreground">{t(p.i18nKey)}</span>
                    </button>
                  ))}
                </div>
                {/* Live preview strip */}
                <div className="flex items-center gap-1.5 text-xxxs font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-success/20 text-success">{t("settings.preferences.previewSuccess")}</span>
                  <span className="px-1.5 py-0.5 rounded bg-warning/20 text-warning">{t("settings.preferences.previewWarning")}</span>
                  <span className="px-1.5 py-0.5 rounded bg-danger/20 text-danger">{t("settings.preferences.previewError")}</span>
                  <span className="px-1.5 py-0.5 rounded bg-info/20 text-info">{t("settings.preferences.previewInfo")}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Right: User Profile + Cooperative Profile ── */}
        <div className="space-y-6">
          {/* User Profile */}
          {currentUser && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-info" />
                  {t("settings.userProfile.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xxs">
                    <span className="text-muted-foreground font-mono">{t("settings.userProfile.name")}</span>
                    <span className="font-bold text-foreground">{currentUser.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xxs">
                    <span className="text-muted-foreground font-mono">{t("settings.userProfile.role")}</span>
                    <span className="font-bold text-foreground">{currentUser.role}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={onSwitchProfile}
                  className="w-full border-border text-muted-foreground hover:text-foreground text-xs h-8"
                >
                  <ArrowsLeftRight className="h-3.5 w-3.5 mr-1.5" />
                  {t("profileSelect.switchProfile")}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Cooperative Profile */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Buildings className="h-3.5 w-3.5 text-success" />
                {t("settings.profileTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 text-xs">
                {PROFILE_FIELDS.map(({ key }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-muted-foreground font-mono text-xxxs uppercase">
                      {t(`settings.profileFields.${i18nFieldKeys[key]}`)}
                    </label>
                    <Input
                      value={String(coopProfile[key as keyof CooperativeProfile] ?? "")}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      className="bg-input border-border text-xs h-8"
                    />
                  </div>
                ))}
              </div>
              <Button
                onClick={handleSaveProfile}
                className="bg-brand hover:bg-brand text-brand-foreground font-bold text-xs h-9 mt-4 w-full"
              >
                {t("settings.saveProfile")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Updater (full width) ── */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t("settings.updater.title")}
          </CardTitle>
          <CardDescription className="text-xxs text-muted-foreground">
            {t("settings.updater.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2 text-xs">
          <Button
            onClick={u.checkUpdateCenter}
            disabled={u.isUpdateChecking}
            className="w-full bg-brand hover:bg-brand text-brand-foreground font-bold text-xs h-9"
          >
            {u.isUpdateChecking ? t("settings.updater.checking") : t("settings.updater.checkButton")}
          </Button>
          {u.updateStatusText && (
            <span className="text-success text-xs font-mono font-semibold block text-center">
              {u.updateStatusText}
            </span>
          )}
          {u.downloadContentLength > 0 && (
            <div className="space-y-2 font-mono text-xxs">
              <div className="flex justify-between text-muted-foreground">
                <span>
                  {`${t("settings.updater.progress")}: ${(u.downloadedBytes / 1024 / 1024).toFixed(2)} MB / ${(u.downloadContentLength / 1024 / 1024).toFixed(2)} MB`}
                </span>
                <span className="font-bold text-success">{u.downloadProgress}%</span>
              </div>
              <div className="w-full bg-input rounded-full h-1.5 border border-border overflow-hidden">
                <div
                  className="bg-brand h-full transition-all duration-300"
                  style={{ width: `${u.downloadProgress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Danger Zone ── */}
      <Card className="bg-card border-destructive/20">
        <CardHeader>
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Warning className="h-3.5 w-3.5 text-danger" />
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
