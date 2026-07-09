import { Camera, CheckCircleIcon, CircleNotch, Warning } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import type { DemoTier } from "./demoTiers";

interface Props {
  tier: DemoTier;
  seeding: boolean;
  isReseed?: boolean;
  onStart: () => void;
  onClose: () => void;
}

export default function CampaignBriefingDialog({ tier, seeding, isReseed, onStart, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="bg-slate-900 border border-amber-800/40 max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="w-full h-36 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4">
          <Camera className="h-6 w-6 text-slate-600" />
        </div>

        <DialogHeader>
          <DialogTitle className={`text-lg font-bold ${tier.text}`}>{tier.coopName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-xs">
          {isReseed && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950/30 border border-red-800/30">
              <Warning className="h-4 w-4 text-red-400 shrink-0 mt-0.5" weight="fill" />
              <p className="text-xxs text-red-300/90">{t("profileSelect.briefingReseedWarning")}</p>
            </div>
          )}
          <p className="text-xxs text-slate-500">
            {tier.village}, {tier.regency}, {tier.province}
          </p>
          <p className="text-xs leading-relaxed text-slate-400">{tier.narrative}</p>

          <div className="grid grid-cols-3 gap-2">
            {tier.stats.map((s) => (
              <div key={s.label} className="text-center rounded-lg bg-slate-800/50 border border-slate-700 p-2">
                <p className="text-lg font-bold text-amber-400">{s.value}</p>
                <p className="text-xxxs text-slate-500 uppercase">{s.label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {t("profileSelect.briefingFeatures")}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {tier.features.map((f) => (
                <p key={f} className="text-xxs text-slate-500 flex items-center gap-1">
                  <CheckCircleIcon className="h-3 w-3 text-amber-500 shrink-0" /> {f}
                </p>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={seeding}
            className="border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs h-8.5"
          >
            {t("profileSelect.briefingBack")}
          </Button>
          <Button
            onClick={onStart}
            disabled={seeding}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs h-8.5 px-4"
          >
            {seeding ? <CircleNotch className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            {t("profileSelect.briefingStart")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
