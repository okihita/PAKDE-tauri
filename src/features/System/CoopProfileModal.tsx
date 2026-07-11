import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getCurrentLevel, getLevelProgress } from "@/data/leveling";
import { resolveRag, ragMeta } from "@/lib/rag";
import { CoopEmblem } from "./CoopEmblem";
import { CoopProfileEditor } from "./CoopProfileEditor";
import type { CooperativeProfile } from "@/types";

export default function CoopProfileModal({
  open,
  onOpenChange,
  coopProfile,
  setCoopProfile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coopProfile: CooperativeProfile | null;
  setCoopProfile: (v: CooperativeProfile) => void;
}) {
  const { t } = useTranslation();
  const xp = coopProfile?.xp ?? 0;
  const healthScore = coopProfile?.health_score ?? 0;
  const currentLevel = getCurrentLevel(xp);
  const ragBand = resolveRag(coopProfile?.rag_status, healthScore);
  const rag = ragMeta(ragBand);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-left">
            <CoopEmblem profile={coopProfile} size="lg" />
            <span className="text-sm font-bold text-foreground break-words">{coopProfile?.name ?? "..."}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">{t("sidebar.openProfile")}</DialogDescription>
        </DialogHeader>

        {/* Gamified summary — the coop "character sheet" */}
        <div className="space-y-2">
          {currentLevel &&
            (() => {
              const prog = getLevelProgress(currentLevel, xp);
              return (
                <div
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 border border-current/20 ${currentLevel.bgClass} ${currentLevel.textClass}`}
                >
                  <span className="text-xxs font-black uppercase tracking-wider shrink-0">{`Lv.${currentLevel.tier}`}</span>
                  <div className="h-3 flex-1 rounded-full bg-secondary/50 overflow-hidden relative">
                    <div
                      className="absolute inset-0 h-full rounded-full bg-current/25 transition-all duration-500"
                      style={{ width: `${prog.percent}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xxxs font-mono font-bold">
                      {prog.xp}/{prog.maxXp}
                    </span>
                  </div>
                </div>
              );
            })()}

          {healthScore > 0 && (
            <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-secondary/40 border border-border">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${rag.dotClass}`} />
              <span className={`text-xxs font-semibold truncate ${rag.textClass}`}>{t(rag.ratingKey)}</span>
              <span className={`text-xxs font-mono font-bold shrink-0 ${rag.textClass}`}>{healthScore}%</span>
              <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full ${rag.barClass} transition-all duration-500`}
                  style={{ width: `${healthScore}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <CoopProfileEditor coopProfile={coopProfile} setCoopProfile={setCoopProfile} />
      </DialogContent>
    </Dialog>
  );
}
