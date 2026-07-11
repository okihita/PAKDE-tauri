import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { updateCooperative } from "@/features/System/Settings/settingsDb";
import type { CooperativeProfile } from "@/types";

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

export function CoopProfileEditor({
  coopProfile,
  setCoopProfile,
}: {
  coopProfile: CooperativeProfile | null;
  setCoopProfile: (v: CooperativeProfile) => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();

  if (!coopProfile) return null;
  const profile = coopProfile;

  const handleFieldChange = (key: string, value: string) => {
    setCoopProfile({ ...profile, [key]: value });
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateCooperative(profile.id ?? "", {
        name: profile.name,
        legal_id: profile.legal_id,
        address: profile.address,
        village: profile.village,
        district: profile.district,
        regency: profile.regency,
        province: profile.province,
        postal_code: profile.postal_code,
        phone: profile.phone,
        email: profile.email,
        business_units: profile.business_units,
      });
      toast.success(t("toast.profileSaveSuccess"));
    } catch (err) {
      toast.error(t("toast.profileSaveFailed", { error: String(err) }));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 text-xs">
      {PROFILE_FIELDS.map(({ key }) => (
        <div key={key} className="space-y-1">
          <label className="text-muted-foreground font-mono text-xxxs uppercase">
            {t(`settings.profileFields.${i18nFieldKeys[key]}`)}
          </label>
          <Input
            value={String(profile[key as keyof CooperativeProfile] ?? "")}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            className="bg-input border-border text-xs h-8"
          />
        </div>
      ))}
      <Button
        onClick={handleSaveProfile}
        className="bg-brand hover:bg-brand text-brand-foreground font-bold text-xs h-9 mt-1 w-full"
      >
        {t("settings.saveProfile")}
      </Button>
    </div>
  );
}
