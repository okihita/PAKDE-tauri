import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Buildings, CheckCircle, Rocket, Trophy, ArrowLeft } from "@phosphor-icons/react";
import type { CooperativeProfile } from "@/types";
import { createCooperative } from "./cooperativeDb";
import RegionPicker from "./RegionPicker";
import { sfx } from "./sfx";

const COMPLETE_LATER =
  "Data lainnya seperti pengurus, unit usaha, dan kontak dapat dilengkapi nanti melalui Dashboard.";
const BTN_LANJUT = "Mulai Kelola";
const BTN_KEMBALI = "Kembali";
const BTN_LUNCURKAN = "Luncurkan Koperasi";
const REWARD_TITLE = "Mulai dengan 5 Poin";
const REWARD_DESC = "Lengkapi profil untuk buka badge & modul!";
const CONFIRM_HEADING = "siap diluncurkan!";

const EMBLEM_LABEL = "Emblem Koperasi";
const EMBLEMS = [
  "/emblems/Gemini_Generated_Image_4z0p1y4z0p1y4z0p.png",
  "/emblems/Gemini_Generated_Image_9q6ekf9q6ekf9q6e.png",
  "/emblems/Gemini_Generated_Image_ciso4wciso4wciso.png",
  "/emblems/Gemini_Generated_Image_lmwuaxlmwuaxlmwu.png",
  "/emblems/Gemini_Generated_Image_srz0n5srz0n5srz0.png",
];
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
    emblem: EMBLEMS[0],
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

  // Auto-advance to confirm when all location fields are filled
  const allLocationFilled = formData.province && formData.regency && formData.district && formData.village;
  const hasAdvanced = useRef(false);
  useEffect(() => {
    if (step === "fill" && allLocationFilled && !hasAdvanced.current) {
      hasAdvanced.current = true;
      handleNext();
    }
    if (!allLocationFilled) hasAdvanced.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLocationFilled, step]);

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
      <DialogContent className="bg-slate-900 border-0 text-foreground max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        {step === "fill" ? (
          <>
            {/* Step 1 Header */}
            <div className="text-center mb-4">
              <div className="w-full h-20 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center mb-3">
                <Buildings className="h-8 w-8 text-brand" weight="fill" />
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
                <label className="text-success text-xxxs uppercase tracking-wider">
                  {t("profileSelect.fieldName")}
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                  className="bg-slate-950 border-slate-700 text-slate-100 text-xs h-9 focus:outline-none placeholder:text-slate-500"
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

              {/* Emblem picker */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <p className="text-success text-xxxs uppercase tracking-wider mb-2">{EMBLEM_LABEL}</p>
                <div className="flex gap-2">
                  {EMBLEMS.map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, emblem: src });
                        sfx.playBleep(600, 0.02);
                      }}
                      className={`h-10 w-10 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${
                        formData.emblem === src
                          ? "border-brand bg-brand/10"
                          : "border-slate-700 bg-slate-900 hover:border-slate-500"
                      }`}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xxs text-slate-500 text-center">{COMPLETE_LATER}</p>
            </div>

            {/* Step 1 buttons */}
            <div className="flex gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs h-9"
              >
                {BTN_KEMBALI}
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
                <CheckCircle className="h-8 w-8 text-brand" weight="fill" />
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
