import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Buildings, CheckCircle, Rocket, Trophy, ArrowLeft } from "@phosphor-icons/react";
import type { CooperativeProfile } from "@/types";
import { createCooperative } from "./cooperativeDb";
import RegionPicker from "./RegionPicker";
import { sfx } from "./sfx";

const PLACEHOLDER_NAME = "e.g. Koperasi Tani Makmur";
const COMPLETE_LATER =
  "Data lainnya seperti pengurus, unit usaha, dan kontak dapat dilengkapi nanti melalui Dashboard.";
const STEP_IDENTITAS = "Step 1: Identitas";
const STEP_KONFIRMASI = "Step 2: Konfirmasi";
const BTN_LANJUT = "Lanjut";
const BTN_KEMBALI = "Kembali";
const BTN_LUNCURKAN = "Luncurkan Koperasi";
const REWARD_TITLE = "Mulai dengan 5 Poin";
const REWARD_DESC = "Lengkapi profil untuk buka badge & modul!";
const CONFIRM_HEADING = "siap diluncurkan!";
const CAT_LABELS: Record<string, string> = {
  serba_usaha: "Serba Usaha",
  konsumsi: "Konsumen",
  pemasaran: "Pemasaran",
  produksi: "Produsen",
  jasa: "Jasa",
};

interface CreateProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileCreated: (profile: CooperativeProfile) => void;
}

export default function CreateProfileDialog({ open, onOpenChange, onProfileCreated }: CreateProfileDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"fill" | "confirm">("fill");
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    legalId: "",
    address: "",
    village: "",
    district: "",
    regency: "",
    province: "",
    postalCode: "",
    phone: "",
    email: "",
    chairman: "",
    secretary: "",
    treasurer: "",
    supervisor: "",
    unitPupuk: true,
    unitSimpanPinjam: true,
    unitToko: false,
    foundedDate: "",
    category: "serba_usaha",
  });

  const isValid = formData.name.trim() && formData.province.trim();

  const handleNext = () => {
    if (!isValid) {
      setFormError(t("profileSelect.validationError"));
      return;
    }
    setFormError("");
    sfx.playSoftThud(100, 0.15);
    setStep("confirm");
  };

  const handleLaunch = async () => {
    setCreating(true);
    sfx.playChime();
    try {
      const inserted = await createCooperative({
        name: formData.name,
        legalId: formData.legalId,
        address: formData.address,
        village: formData.village,
        district: formData.district,
        regency: formData.regency,
        province: formData.province,
        postalCode: formData.postalCode,
        phone: formData.phone,
        email: formData.email,
        chairman: formData.chairman,
        secretary: formData.secretary,
        treasurer: formData.treasurer,
        supervisor: formData.supervisor,
        unitPupuk: formData.unitPupuk,
        unitSimpanPinjam: formData.unitSimpanPinjam,
        unitToko: formData.unitToko,
        foundedDate: formData.foundedDate,
        category: formData.category,
      });
      onProfileCreated(inserted);
    } catch (err: unknown) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : String(err));
      setStep("fill");
    }
    setCreating(false);
  };

  const handleClose = () => {
    setStep("fill");
    setFormError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border border-brand/25 text-foreground max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xxxs font-mono text-slate-500 uppercase tracking-wider">
            {step === "fill" ? STEP_IDENTITAS : STEP_KONFIRMASI}
          </span>
          <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: step === "fill" ? "50%" : "100%" }}
            />
          </div>
        </div>

        {step === "fill" ? (
          <>
            {/* Step 1 Header */}
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center mx-auto mb-2">
                <Buildings className="h-6 w-6 text-brand" weight="fill" />
              </div>
              <h2 className="text-lg font-bold text-white">{t("profileSelect.dialogTitle")}</h2>
              <p className="text-xxs text-slate-400 mt-1">{t("profileSelect.dialogDesc")}</p>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-xxs font-mono text-danger mb-3">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              {/* Nama */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 space-y-1">
                <label className="text-success font-mono text-xxxs uppercase tracking-wider">
                  {t("profileSelect.fieldName")} *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={PLACEHOLDER_NAME}
                  autoFocus
                  className="bg-slate-950 border-slate-700 text-slate-100 text-xs h-9 focus:border-success/50 focus:ring-1 focus:ring-brand/50 placeholder:text-slate-500"
                />
              </div>

              {/* Lokasi */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <RegionPicker
                  onChange={(region) => {
                    setFormData({
                      ...formData,
                      province: region.province_name,
                      regency: region.regency_name,
                      district: region.district_name,
                      village: region.village_name,
                    });
                  }}
                />
              </div>

              <input type="hidden" value={formData.category} />
              <p className="text-xxs text-slate-500 italic text-center">{COMPLETE_LATER}</p>
            </div>

            {/* Step 1 buttons */}
            <div className="flex gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs h-9"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={!isValid}
                className="flex-1 bg-brand hover:bg-brand/90 text-brand-foreground font-bold text-xs h-9 disabled:opacity-40"
              >
                {BTN_LANJUT}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Step 2: Confirm */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-brand" weight="fill" />
              </div>
              <h3 className="text-base font-bold text-white">{formData.name}</h3>
              <p className="text-xxs text-slate-400 mt-1">{CONFIRM_HEADING}</p>
            </div>

            {/* Summary card */}
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Buildings className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span>{formData.name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-xxxs font-mono text-slate-500">📍</span>
                <span className="text-xxs">
                  {formData.regency && formData.province ? `${formData.regency}, ${formData.province}` : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-xxxs font-mono text-slate-500">🏷️</span>
                <span className="text-xxs">{CAT_LABELS[formData.category] || formData.category}</span>
              </div>
            </div>

            {/* Reward badge */}
            <div className="mt-4 rounded-xl border border-amber-800/40 bg-amber-950/20 p-3 text-center">
              <Trophy className="h-4 w-4 text-amber-400 mx-auto mb-1" weight="fill" />
              <p className="text-xs font-bold text-amber-400">{REWARD_TITLE}</p>
              <p className="text-xxs text-amber-600 mt-0.5">{REWARD_DESC}</p>
            </div>

            {/* Step 2 buttons */}
            <div className="flex gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  sfx.playBleep(700, 0.03);
                  setStep("fill");
                }}
                className="flex-1 border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs h-9"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                {BTN_KEMBALI}
              </Button>
              <Button
                type="button"
                onClick={handleLaunch}
                disabled={creating}
                className="flex-1 bg-brand hover:bg-brand/90 text-brand-foreground font-bold text-xs h-9"
              >
                {creating ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <>
                    <Rocket className="h-3.5 w-3.5 mr-1" />
                    {BTN_LUNCURKAN}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
