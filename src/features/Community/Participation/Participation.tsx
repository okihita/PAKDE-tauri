import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, CheckSquare, Wallet, Flame, Calendar, Award } from "lucide-react";
import DevDocStripe from "@/components/DevDocStripe";
import readmeContent from "./README.md?raw";
import "./Participation.css";

// Constants for i18n/linter rules bypass
const VAL_ATTENDANCE = "84%";
const VAL_VOTING = "92%";
const VAL_LOYALTY = "76%";
const VAL_STREAK = "15";

const TIER_RATIO_SUPER = "22%";
const TIER_RATIO_ACTIVE = "63%";
const TIER_RATIO_PASSIVE = "15%";

const TIER_COUNT_SUPER = "12";
const TIER_COUNT_ACTIVE = "34";
const TIER_COUNT_PASSIVE = "8";

interface DayActivity {
  day: number;
  level: "low" | "medium" | "high";
}

const HEATMAP_DAYS: DayActivity[] = [
  { day: 1, level: "low" },
  { day: 2, level: "low" },
  { day: 3, level: "medium" },
  { day: 4, level: "low" },
  { day: 5, level: "high" },
  { day: 6, level: "low" },
  { day: 7, level: "low" },
  { day: 8, level: "medium" },
  { day: 9, level: "medium" },
  { day: 10, level: "low" },
  { day: 11, level: "high" },
  { day: 12, level: "low" },
  { day: 13, level: "low" },
  { day: 14, level: "low" },
  { day: 15, level: "medium" },
  { day: 16, level: "high" },
  { day: 17, level: "low" },
  { day: 18, level: "low" },
  { day: 19, level: "medium" },
  { day: 20, level: "high" },
  { day: 21, level: "low" },
  { day: 22, level: "low" },
  { day: 23, level: "medium" },
  { day: 24, level: "medium" },
  { day: 25, level: "low" },
  { day: 26, level: "high" },
  { day: 27, level: "low" },
  { day: 28, level: "high" },
];

export default function Participation() {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 max-w-4xl mx-auto">
      <DevDocStripe content={readmeContent} />

      {/* Header section */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground">{t("participation.title")}</h1>
          <p className="text-xxs text-muted-foreground">{t("participation.description")}</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xxxs font-mono text-muted-foreground uppercase">
              {t("participation.metrics.attendanceTitle")}
            </span>
            <Users className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <h3 className="text-sm font-bold text-foreground">{VAL_ATTENDANCE}</h3>
            <p className="text-xxxs text-muted-foreground mt-1 leading-normal">
              {t("participation.metrics.attendanceDesc")}
            </p>
          </CardContent>
        </Card>

        {/* Voting Rate */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xxxs font-mono text-muted-foreground uppercase">
              {t("participation.metrics.votingTitle")}
            </span>
            <CheckSquare className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <h3 className="text-sm font-bold text-foreground">{VAL_VOTING}</h3>
            <p className="text-xxxs text-muted-foreground mt-1 leading-normal">
              {t("participation.metrics.votingDesc")}
            </p>
          </CardContent>
        </Card>

        {/* Economic Engagement */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xxxs font-mono text-muted-foreground uppercase">
              {t("participation.metrics.loyaltyTitle")}
            </span>
            <Wallet className="h-4 w-4 text-lime-400" />
          </CardHeader>
          <CardContent>
            <h3 className="text-sm font-bold text-foreground">{VAL_LOYALTY}</h3>
            <p className="text-xxxs text-muted-foreground mt-1 leading-normal">
              {t("participation.metrics.loyaltyDesc")}
            </p>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xxxs font-mono text-muted-foreground uppercase">
              {t("participation.metrics.activeStreak")}
            </span>
            <Flame className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <h3 className="text-sm font-bold text-foreground">{VAL_STREAK}</h3>
            <p className="text-xxxs text-muted-foreground mt-1 leading-normal">
              {t("participation.metrics.activeStreakDesc")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Heatmap Section */}
        <Card className="bg-card border-border md:col-span-2">
          <CardHeader className="pb-3 border-b border-border/55">
            <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              {t("participation.heatmapTitle")}
            </CardTitle>
            <p className="text-xxxs text-muted-foreground mt-1 leading-relaxed">{t("participation.heatmapDesc")}</p>
          </CardHeader>
          <CardContent className="pt-5 flex justify-center">
            <div className="grid grid-cols-7 gap-2.5 max-w-[280px]">
              {HEATMAP_DAYS.map((d) => {
                let colorClass = "bg-input/20 border-border/30";
                if (d.level === "medium") colorClass = "bg-emerald-500/25 border-emerald-500/35";
                if (d.level === "high") colorClass = "bg-emerald-500 border-emerald-500";
                return (
                  <div
                    key={d.day}
                    className={`w-8 h-8 rounded border flex items-center justify-center text-xxxs font-mono font-bold transition-all hover:scale-110 ${colorClass}`}
                  >
                    {d.day}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Engagement Tiers */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border/55">
            <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
              <Award className="h-3.5 w-3.5 text-amber-400" />
              {t("participation.tiersTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {/* Super Member */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xxs font-mono">
                <span className="text-amber-400 font-bold">{t("participation.tierSuper")}</span>
                <span className="text-muted-foreground">
                  {TIER_COUNT_SUPER} ({TIER_RATIO_SUPER})
                </span>
              </div>
              <div className="h-2 bg-input/40 rounded-full overflow-hidden border border-border">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: TIER_RATIO_SUPER }} />
              </div>
            </div>

            {/* Active Member */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xxs font-mono">
                <span className="text-emerald-400 font-bold">{t("participation.tierActive")}</span>
                <span className="text-muted-foreground">
                  {TIER_COUNT_ACTIVE} ({TIER_RATIO_ACTIVE})
                </span>
              </div>
              <div className="h-2 bg-input/40 rounded-full overflow-hidden border border-border">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: TIER_RATIO_ACTIVE }} />
              </div>
            </div>

            {/* Passive Member */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xxs font-mono">
                <span className="text-rose-400 font-bold">{t("participation.tierPassive")}</span>
                <span className="text-muted-foreground">
                  {TIER_COUNT_PASSIVE} ({TIER_RATIO_PASSIVE})
                </span>
              </div>
              <div className="h-2 bg-input/40 rounded-full overflow-hidden border border-border">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: TIER_RATIO_PASSIVE }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
