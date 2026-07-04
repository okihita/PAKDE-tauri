import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdater } from "@/hooks/useUpdater";
import { useToast } from "@/hooks/useToast";
import { getDb } from "@/db";
import type { CooperativeProfile } from "@/types";

interface Props {
  coopProfile: CooperativeProfile | null;
  setCoopProfile: (v: CooperativeProfile) => void;
  fontSizeSetting: "small" | "normal" | "large" | "xlarge";
  setFontSizeSetting: (v: "small" | "normal" | "large" | "xlarge") => void;
  appTheme: "dark" | "light";
  setAppTheme: (v: "dark" | "light") => void;
}

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
}: Props) {
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language);
  const u = useUpdater();
  const toast = useToast();

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t("settings.profileTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {[
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
              ].map(({ key }) => (
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
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9 mt-6"
            >
              {t("settings.saveProfile")}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border md:col-span-2">
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
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9"
            >
              {u.isUpdateChecking ? t("settings.updater.checking") : t("settings.updater.checkButton")}
            </Button>
            {u.updateStatusText && (
              <span className="text-emerald-400 text-xs font-mono font-semibold block text-center">
                {u.updateStatusText}
              </span>
            )}
            {u.downloadContentLength > 0 && (
              <div className="space-y-2 font-mono text-xxs">
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    {`${t("settings.updater.progress")}: ${(u.downloadedBytes / 1024 / 1024).toFixed(2)} MB / ${(u.downloadContentLength / 1024 / 1024).toFixed(2)} MB`}
                  </span>
                  <span className="font-bold text-emerald-400">{u.downloadProgress}%</span>
                </div>
                <div className="w-full bg-input rounded-full h-1.5 border border-border overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${u.downloadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t("settings.preferences.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 text-xs">
            <div className="space-y-1">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("settings.preferences.language")}
              </label>
              <Select
                value={lang}
                onValueChange={(val) => {
                  i18n.changeLanguage(val);
                  setLang(val);
                }}
              >
                <SelectTrigger className="w-full bg-input border-border text-xs h-8 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground text-xs">
                  <SelectItem value="id">{t("settings.preferences.languageId")}</SelectItem>
                  <SelectItem value="en">{t("settings.preferences.languageEn")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("settings.preferences.theme")}
              </label>
              <Select value={appTheme} onValueChange={(val) => setAppTheme(val as "dark" | "light")}>
                <SelectTrigger className="w-full bg-input border-border text-xs h-8 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground text-xs">
                  <SelectItem value="dark">{t("settings.preferences.themeDark")}</SelectItem>
                  <SelectItem value="light">{t("settings.preferences.themeLight")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("settings.preferences.fontSize")}
              </label>
              <Select
                value={fontSizeSetting}
                onValueChange={(val) => setFontSizeSetting(val as "small" | "normal" | "large" | "xlarge")}
              >
                <SelectTrigger className="w-full bg-input border-border text-xs h-8 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground text-xs">
                  <SelectItem value="small">{t("settings.preferences.fontSmall")}</SelectItem>
                  <SelectItem value="normal">{t("settings.preferences.fontNormal")}</SelectItem>
                  <SelectItem value="large">{t("settings.preferences.fontLarge")}</SelectItem>
                  <SelectItem value="xlarge">{t("settings.preferences.fontXLarge")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xxxs text-muted-foreground font-mono">{t("settings.preferences.fontHint")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
