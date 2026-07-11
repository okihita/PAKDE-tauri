import { useTranslation } from "react-i18next";
import { TrophyIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LevelDef } from "@/data/leveling";

interface Props {
  levelUp: LevelDef | null;
  onClose: () => void;
}

export default function LevelUpDialog({ levelUp, onClose }: Props) {
  const { t, i18n } = useTranslation();

  return (
    <Dialog open={levelUp !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border border-border text-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <TrophyIcon className="h-4 w-4 text-warning" />
            {t("levelUp.title")}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-xs text-muted-foreground">
          {t("levelUp.message", {
            tier: levelUp?.tier ?? 0,
            label: i18n.language.startsWith("id") ? levelUp?.labelId : levelUp?.labelEn,
          })}
        </DialogDescription>
        <DialogFooter className="gap-2">
          <Button onClick={onClose} className="bg-brand hover:bg-brand text-brand-foreground font-bold text-xs">
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
