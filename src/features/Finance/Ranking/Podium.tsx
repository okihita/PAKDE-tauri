import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { StarIcon, TrendDownIcon, TrendUpIcon, MinusIcon } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import type { RankedCoop, RankingMetric, RankingScope } from "./rankingService";
import LaurelWreath from "./LaurelWreath";

interface Props {
  items: RankedCoop[];
  ourRank: number | null;
  scope: RankingScope;
  metric: RankingMetric;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function monogram(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? "";
  const second = words[1]?.[0] ?? words[0]?.[1] ?? "";
  return (first + second).toUpperCase();
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const AVATAR_TINTS = [
  "bg-brand/15 text-brand",
  "bg-success/15 text-success",
  "bg-info/15 text-info",
  "bg-violet/15 text-violet",
  "bg-sky/15 text-sky",
  "bg-warning/15 text-warning",
  "bg-danger/15 text-danger",
];

function avatarTint(name: string): string {
  return AVATAR_TINTS[hash(name) % AVATAR_TINTS.length];
}

function ragColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "hijau" || s === "green") return "text-success bg-success/10";
  if (s === "kuning" || s === "yellow") return "text-warning bg-warning/10";
  return "text-danger bg-danger/10";
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendUpIcon className="h-3 w-3 text-success" />;
  if (trend === "down") return <TrendDownIcon className="h-3 w-3 text-danger" />;
  return <MinusIcon className="h-3 w-3 text-muted-foreground" />;
}

// Count-up animation (easeOutCubic). Re-runs whenever `target` changes (i.e. on
// every Podium remount via the `${scope}-${metric}` key).
function useCountUp(target: number, duration = 700): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function ScoreCountUp({ score }: { score: number }) {
  const v = useCountUp(score);
  return <span className="text-lg font-black font-mono text-foreground tabular-nums">{v}</span>;
}

// Pure-CSS confetti burst — fires once per mount, then unmounts itself.
const CONFETTI_COLORS = ["bg-warning", "bg-success", "bg-info", "bg-violet", "bg-sky", "bg-danger"];
function Confetti() {
  const [show, setShow] = useState(true);
  const pieces = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const dist = 40 + (i % 5) * 14;
        return {
          dx: `${Math.cos(angle) * dist}px`,
          dy: `${Math.sin(angle) * dist - 24}px`,
          rot: `${180 + i * 40}deg`,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          delay: `${(i % 4) * 45}ms`,
          left: `${15 + (i % 9) * 8}%`,
        };
      }),
    [],
  );
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 900);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-2 z-20 flex justify-center" aria-hidden="true">
      <div className="relative h-0 w-0">
        {pieces.map((p, i) => (
          <span
            key={i}
            className={`confetti-piece ${p.color}`}
            style={
              {
                left: p.left,
                "--dx": p.dx,
                "--dy": p.dy,
                "--rot": p.rot,
                animationDelay: p.delay,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

// ── Podium card ──────────────────────────────────────────────────────────────

const MEDAL_STYLE: Record<number, { ring: string; text: string; label: string }> = {
  1: { ring: "from-warning to-amber-400", text: "text-warning", label: "🥇" },
  2: { ring: "from-slate-200 to-slate-400", text: "text-slate-300", label: "🥈" },
  3: { ring: "from-amber-700 to-amber-900", text: "text-amber-700", label: "🥉" },
};

function PodiumCard({ coop, position }: { coop: RankedCoop; position: 1 | 2 | 3 }) {
  const m = MEDAL_STYLE[position];
  // 2-1-3 layout: rank 2 (left, short), rank 1 (center, tall), rank 3 (right, short).
  const height = position === 1 ? "h-44" : "h-40";
  const order = position === 2 ? "order-1" : position === 1 ? "order-2" : "order-3";
  return (
    <div className={`podium-card relative flex flex-col items-center justify-end ${order}`}>
      {position === 1 && <LaurelWreath className="text-emerald-500/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]" />}
      <div
        className={`relative z-10 flex w-full ${height} flex-col items-center justify-center gap-1 rounded-xl bg-linear-to-br ${m.ring} p-[2px] shadow-lg`}
      >
        <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-[10px] bg-card px-2">
          <span className={`text-base ${m.text}`}>{m.label}</span>
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black font-mono ${avatarTint(coop.name)}`}
          >
            {monogram(coop.name)}
          </span>
          <p className="max-w-[7rem] truncate text-center text-xxs font-bold text-foreground" title={coop.name}>
            {coop.name}
          </p>
          <p className="truncate text-xxxs font-mono text-muted-foreground">{coop.village}</p>
          <div className="flex items-center gap-1">
            <ScoreCountUp score={coop.score} />
            <span className="text-xxs font-mono text-muted-foreground">%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-xxxs font-bold px-1.5 py-0.5 rounded ${ragColor(coop.ragStatus)}`}>
              {coop.ragStatus}
            </span>
            <TrendIcon trend={coop.trend} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Podium ───────────────────────────────────────────────────────────────

export default function Podium({ items, ourRank, scope: _scope, metric: _metric }: Props) {
  const { t } = useTranslation();
  const podium = items.slice(0, 3);
  const display = [podium[1], podium[0], podium[2]].filter(Boolean) as RankedCoop[];
  const honorable = items.slice(3, 5);

  const ourCoop = items.find((i) => i.isOurs);
  const ourScore = ourCoop?.score ?? 0;
  const showOurCard = ourRank != null && ourRank > 3;
  const gap = podium.length >= 3 && showOurCard ? podium[2].score - ourScore : 0;

  return (
    <Card className="bg-card border-border relative overflow-hidden">
      <Confetti />
      <CardContent className="p-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          {t("ranking.podium.title")}
        </p>

        {/* Radial glow behind rank 1 */}
        <div className="pointer-events-none absolute left-1/2 top-10 z-0 h-32 w-32 -translate-x-1/2 rounded-full bg-warning/20 blur-2xl" />

        <div className="relative z-10 grid grid-cols-3 items-end gap-2">
          {display.map((c) => (
            <PodiumCard key={c.name} coop={c} position={c.rank as 1 | 2 | 3} />
          ))}
        </div>

        {/* Your Position */}
        {showOurCard && (
          <div className="mt-4 rounded-lg border border-brand/30 bg-brand/5 p-3">
            <p className="text-xxxs font-mono uppercase tracking-wider text-muted-foreground">
              {t("ranking.podium.yourPosition")}
            </p>
            <p className="text-sm font-black font-mono text-brand">
              #{ourRank} <span className="text-xxs font-normal text-muted-foreground">/ {items.length}</span>
            </p>
            <p className="mt-1 text-xxs font-bold text-foreground">
              {t("ranking.podium.gapFromPodium", { points: gap })}
            </p>
          </div>
        )}

        {/* Honorable mentions (4–5) */}
        {honorable.length > 0 && (
          <div className="mt-4">
            <p className="text-xxxs font-mono uppercase tracking-wider text-muted-foreground mb-2">
              {t("ranking.podium.honorableMentions")}
            </p>
            <div className="space-y-1.5">
              {honorable.map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xxs font-black font-mono ${avatarTint(c.name)}`}
                  >
                    {monogram(c.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xxs font-bold text-foreground">{c.name}</p>
                    <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-success" style={{ width: `${c.score}%` }} />
                    </div>
                  </div>
                  <span className="text-xxs font-mono font-bold text-foreground">{c.score}%</span>
                  {c.isOurs && <StarIcon className="h-3 w-3 shrink-0 text-success" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
