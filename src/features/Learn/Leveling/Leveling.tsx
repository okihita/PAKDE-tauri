import "./Leveling.css";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LEVELS, getLevelProgress, getCurrentLevel, type LevelDef } from "@/data/leveling";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  UsersIcon,
  TrendUpIcon,
  ShieldCheck,
  ClipboardText,
  BuildingsIcon,
  Monitor,
  CaretDownIcon,
  CaretUpIcon,
  TrophyIcon,
  StarIcon,
  LockIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";

interface Props {
  xp?: number;
}

const ASPECT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  UsersIcon,
  TrendUpIcon,
  ShieldCheck,
  ClipboardText,
  BuildingsIcon,
  Monitor,
};

function QuestItem({ done, text }: { done: boolean; text: string }) {
  return (
    <li className="flex items-start gap-1.5 text-xxs text-muted-foreground">
      {done ? (
        <CheckCircleIcon className="h-3 w-3 text-brand mt-0.5 shrink-0" />
      ) : (
        <span className="text-slate-700 mt-0.5 shrink-0">◈</span>
      )}
      <span className={done ? "text-success/70" : ""}>{text}</span>
    </li>
  );
}

function LevelCard({
  level,
  lang,
  t,
  xp,
}: {
  level: LevelDef;
  lang: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
  xp: number;
}) {
  const [open, setOpen] = useState(false);
  const Icon = TrophyIcon;
  const isId = lang.startsWith("id");
  const label = isId ? level.labelId : level.labelEn;
  const desc = isId ? level.descId : level.descEn;
  const { xp: earned, maxXp, percent } = getLevelProgress(level, xp);
  const isUnlocked = xp >= level.minXp;
  const currentLevel = getCurrentLevel(xp);
  const isCurrent = currentLevel.id === level.id;

  return (
    <Card
      className={`bg-card border-border text-foreground overflow-hidden transition-all hover-glow-card ${
        isCurrent ? "ring-1 ring-brand/30" : ""
      } ${!isUnlocked ? "opacity-60" : ""}`}
    >
      <CardHeader className="pb-3 cursor-pointer select-none" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Level badge */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${level.bgClass}`}>
              {isUnlocked ? (
                <Icon className={`h-5 w-5 ${level.textClass}`} />
              ) : (
                <LockIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{t("leveling.level", { n: level.tier })}</span>
                <span
                  className={`text-xxxs font-mono font-bold px-2 py-0.5 rounded-full border-0 ${level.bgClass} ${level.textClass}`}
                >
                  {label}
                </span>
                {isCurrent && <span className="text-xxxs font-mono text-brand font-bold">{t("leveling.active")}</span>}
              </div>
              <p className="text-xxs text-muted-foreground mt-0.5 truncate">{desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* XP progress */}
            <div className="hidden sm:block w-24">
              <div className="flex justify-between text-xxxs font-mono mb-0.5">
                <span className="text-muted-foreground">
                  {isId ? `XP ${earned}/${maxXp}` : `XP ${earned}/${maxXp}`}
                </span>
                <span className={level.textClass}>{percent}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCurrent ? "bg-brand" : isUnlocked ? level.color : "bg-muted"
                  }`}
                  style={{ width: `${isUnlocked ? percent : 0}%` }}
                />
              </div>
            </div>
            {open ? (
              <CaretUpIcon className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <CaretDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="pt-0 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {level.aspects.map((aspect) => {
              const AspectIcon = ASPECT_ICONS[aspect.icon] ?? StarIcon;
              const aLabel = isId ? aspect.labelId : aspect.labelEn;
              const quests = isId ? aspect.quests.map((q) => q.id) : aspect.quests.map((q) => q.en);

              return (
                <div key={aspect.aspectId} className="bg-input/50 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <AspectIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xxxs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                      {aLabel}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {quests.map((q, i) => (
                      <QuestItem key={i} done={isUnlocked && !isCurrent ? true : false} text={q} />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function Leveling({ xp = 0 }: Props) {
  const { t, i18n } = useTranslation();
  const isId = i18n.language.startsWith("id");
  const currentLevel = getCurrentLevel(xp);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
          <TrophyIcon className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground">{isId ? "Leveling Koperasi" : "Cooperative Leveling"}</h1>
          <p className="text-xxs text-muted-foreground">
            {isId
              ? "Selesaikan quest untuk naik level dan tingkatkan kesehatan koperasi"
              : "Complete quests to level up and improve cooperative health"}
          </p>
        </div>
      </div>

      {/* Current status bar */}
      <Card className="bg-card border-border text-foreground">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrophyIcon className="h-4 w-4 text-warning" />
              <span className="text-xs font-bold text-foreground">
                {isId ? `Level Saat Ini: ${currentLevel.labelId}` : `Current Level: ${currentLevel.labelEn}`}
              </span>
            </div>
            <span className="text-xxs font-mono text-muted-foreground">
              {isId ? `XP: ${xp} / 100` : `XP: ${xp} / 100`}
            </span>
          </div>
          {/* Global XP bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-brand to-warning rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, xp)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xxxs font-mono text-muted-foreground">
            <span>{isId ? "Rintisan" : "Pioneer"}</span>
            <span>{isId ? "Teladan" : "Exemplary"}</span>
          </div>
        </CardContent>
      </Card>

      {/* 10-level summary strip */}
      <div className="grid grid-cols-10 gap-1">
        {LEVELS.map((level: LevelDef) => {
          const Icon = level.id === "teladan" ? TrophyIcon : StarIcon;
          const label = isId ? level.labelId : level.labelEn;
          const isActive = currentLevel.id === level.id;
          const isComplete = xp >= level.maxXp && level.maxXp >= 100 ? xp >= 100 : xp >= level.maxXp;
          return (
            <div
              key={level.id}
              className={`flex flex-col items-center gap-0.5 py-2 rounded-lg border ${
                isActive
                  ? `${level.bgClass} border-success/30`
                  : isComplete
                    ? `${level.bgClass} border-muted`
                    : "bg-input/50 border-border"
              }`}
            >
              {isComplete ? (
                <CheckCircleIcon className={`h-3.5 w-3.5 ${level.textClass}`} />
              ) : (
                <Icon className={`h-3.5 w-3.5 ${isActive ? level.textClass : "text-muted-foreground"}`} />
              )}
              <span
                className={`text-xxxs font-mono font-bold leading-tight ${isActive ? level.textClass : "text-muted-foreground"}`}
              >
                L{level.tier}
              </span>
              <span className="text-xxxs text-muted-foreground text-center leading-tight leading-none">{label}</span>
            </div>
          );
        })}
      </div>

      {/* Level cards */}
      <div className="space-y-3">
        {LEVELS.map((level: LevelDef) => (
          <LevelCard key={level.id} level={level} lang={i18n.language} t={t} xp={xp} />
        ))}
      </div>
    </div>
  );
}
