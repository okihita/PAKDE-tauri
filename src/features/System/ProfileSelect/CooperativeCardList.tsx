import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Buildings, Plus, MapPin } from "@phosphor-icons/react";
import type { CooperativeProfile } from "@/types";

const TEXT_UNIT_PUPUK = "Sales";
const TEXT_UNIT_SP = "Simpan Pinjam";
const TEXT_UNIT_TOKO = "Toko Desa";

interface Props {
  profiles: CooperativeProfile[];
  onCardClick: (p: CooperativeProfile) => void;
  onCardHover: () => void;
  onCreateClick: () => void;
}

export default function CooperativeCardList({ profiles, onCardClick, onCardHover, onCreateClick }: Props) {
  const { t } = useTranslation();

  const getBusinessUnits = (unitsStr: string | null): string[] => {
    if (!unitsStr) return [];
    try {
      const parsed = JSON.parse(unitsStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {profiles.map((p) => {
        const activeUnits = getBusinessUnits(p.business_units);
        const isHealthy = p.health_score >= 70;
        const isCritical = p.health_score < 40;

        return (
          <Card
            key={p.id}
            onClick={() => onCardClick(p)}
            onMouseEnter={onCardHover}
            className="bg-slate-950/90 border-slate-800 hover:border-brand/40 backdrop-blur-md cursor-pointer hover:shadow-[0_8px_30px_hsl(var(--brand) / 0.08)] transition-all duration-200 flex flex-col justify-between min-h-52 p-5 hover:scale-[1.01] select-none shadow-xl relative"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center border border-success/20 shrink-0">
                  <Buildings className="h-4.5 w-4.5 text-success" />
                </div>
                <span className="text-xxxs font-mono font-bold text-success uppercase border border-brand/25 px-2 py-0.5 rounded bg-success/20">
                  {p.id}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-xs font-bold text-foreground line-clamp-1 leading-tight tracking-wide">
                  {p.name}
                </h3>
                <p className="text-xxs text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">
                    {p.regency}, {p.province}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-900 font-sans">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xxxs font-mono text-slate-400">
                  <span className="uppercase">{t("profileSelect.health")}</span>
                  <span className={`font-bold ${isHealthy ? "text-success" : isCritical ? "text-danger" : "text-warning"}`}>
                    {p.health_score}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isHealthy ? "bg-brand" : isCritical ? "bg-danger" : "bg-warning"}`}
                    style={{ width: `${p.health_score}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {activeUnits.map((unit) => {
                  let label = "";
                  if (unit === "unit_pupuk") label = TEXT_UNIT_PUPUK;
                  else if (unit === "unit_simpan_pinjam") label = TEXT_UNIT_SP;
                  else if (unit === "unit_toko_desa") label = TEXT_UNIT_TOKO;
                  return (
                    <span
                      key={unit}
                      className="text-xxxs font-mono font-bold px-1.5 py-0.5 rounded-xs bg-slate-900 border border-slate-800 text-slate-400 uppercase tracking-wider"
                    >
                      {label}
                    </span>
                  );
                })}
                {activeUnits.length === 0 && (
                  <span className="text-xxxs font-mono text-slate-600 italic">{t("profileSelect.units")}: 0</span>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      <Card
        onClick={onCreateClick}
        onMouseEnter={onCardHover}
        className="bg-slate-950/60 border-dashed border-slate-800 hover:border-brand/35 hover:bg-success/5 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-52 p-5 hover:scale-[1.01] select-none shadow-md"
      >
        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center mb-3 border border-slate-800 transition-colors shadow-sm">
          <Plus className="h-5 w-5 text-success" />
        </div>
        <span className="text-xxs font-mono font-bold text-success uppercase tracking-wider">
          {t("profileSelect.createBtn")}
        </span>
      </Card>
    </div>
  );
}
