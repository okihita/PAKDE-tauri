import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import {
  HeartHandshake,
  Users,
  Leaf,
  Activity,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Play,
  CheckCircle2,
} from "lucide-react";
import "./Impact.css";

interface FeedbackItem {
  id: string;
  name: string;
  role: string;
  text: string;
}

const FEEDBACK_ITEMS: FeedbackItem[] = [
  {
    id: "fb-1",
    name: "Joko Supriyanto",
    role: "Petani Anggota",
    text: "Penyaluran pupuk organik dari Unit Pupuk meningkatkan hasil panen padi saya sebesar 20% dan tanah tetap subur.",
  },
  {
    id: "fb-2",
    name: "Sri Wahyuni",
    role: "Karyawan Unit Apotek",
    text: "Pekerjaan sebagai asisten apoteker memberikan saya pendapatan tetap untuk menyekolahkan anak-anak.",
  },
  {
    id: "fb-3",
    name: "Slamet Rahardjo",
    role: "Anggota Aktif",
    text: "Pelatihan rapat anggota tahunan membuat kami sadar betapa pentingnya peran koperasi dalam memperjuangkan ekonomi desa.",
  },
];

export default function Impact() {
  const { t } = useTranslation();
  const toast = useToast();

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditCompleted, setAuditCompleted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isAuditing) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAuditing(false);
          setAuditCompleted(true);
          toast.success(t("impact.toast.auditSuccess"));
          return 100;
        }
        const next = prev + 10;
        if (next >= 100) return 100;

        return next;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isAuditing, toast, t]);

  const handleStartAudit = () => {
    setProgress(0);
    setAuditCompleted(false);
    setIsAuditing(true);
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header section */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <HeartHandshake className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground">{t("impact.title")}</h1>
          <p className="text-xxs text-muted-foreground">{t("impact.description")}</p>
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Local Employment */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xxxs font-mono text-muted-foreground uppercase">
              {t("impact.metrics.employmentTitle")}
            </span>
            <Users className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <h3 className="text-sm font-bold text-foreground">24 {t("beranda.harian").toLowerCase()}</h3>
            <p className="text-xxxs text-muted-foreground mt-1 leading-normal">{t("impact.metrics.employmentDesc")}</p>
          </CardContent>
        </Card>

        {/* Farmer Income Uplift */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xxxs font-mono text-muted-foreground uppercase">
              {t("impact.metrics.welfareTitle")}
            </span>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <h3 className="text-sm font-bold text-foreground">+ 18.5%</h3>
            <p className="text-xxxs text-muted-foreground mt-1 leading-normal">{t("impact.metrics.welfareDesc")}</p>
          </CardContent>
        </Card>

        {/* Sustainability Index */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xxxs font-mono text-muted-foreground uppercase">{t("impact.metrics.ecoTitle")}</span>
            <Leaf className="h-4 w-4 text-lime-400" />
          </CardHeader>
          <CardContent>
            <h3 className="text-sm font-bold text-foreground">{t("impact.metrics.ecoValue")}</h3>
            <p className="text-xxxs text-muted-foreground mt-1 leading-normal">{t("impact.metrics.ecoDesc")}</p>
          </CardContent>
        </Card>

        {/* Gender Empowerment */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xxxs font-mono text-muted-foreground uppercase">
              {t("impact.metrics.genderTitle")}
            </span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <h3 className="text-sm font-bold text-foreground">45%</h3>
            <p className="text-xxxs text-muted-foreground mt-1 leading-normal">{t("impact.metrics.genderDesc")}</p>
          </CardContent>
        </Card>
      </div>

      {/* SROI Audit Section */}
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/55">
          <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            {t("impact.auditTitle")}
          </CardTitle>
          <p className="text-xxxs text-muted-foreground mt-1 leading-relaxed">{t("impact.auditDesc")}</p>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          {!isAuditing && !auditCompleted && (
            <Button
              onClick={handleStartAudit}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9 flex items-center justify-center gap-2"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {t("impact.runAudit")}
            </Button>
          )}

          {isAuditing && (
            <div className="space-y-4 font-mono">
              <div className="flex items-center justify-between text-xxs">
                <span className="text-amber-400 flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
                  {t("impact.auditing")}
                </span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 transition-all duration-150" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {auditCompleted && (
            <div className="p-4 rounded-xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/5 via-card to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xxs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  {t("impact.auditComplete")}
                </span>
                <p className="text-xs font-bold text-foreground mt-1">{t("impact.sroiVal")}</p>
                <p className="text-xxs text-muted-foreground leading-relaxed mt-0.5">{t("impact.sroiRatio")}</p>
              </div>
              <div className="px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center shrink-0">
                <span className="text-xxxs font-mono text-emerald-400 uppercase tracking-widest block">
                  {t("impact.sroiLabel")}
                </span>
                <span className="text-lg font-black text-emerald-400 font-mono block mt-1">2,45 : 1</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Feedback Stream */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 border-b border-border/55">
          <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
            {t("impact.feedbackTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {FEEDBACK_ITEMS.map((item) => (
              <div key={item.id} className="p-3 rounded-lg bg-input/20 border border-border space-y-1">
                <div className="flex items-center justify-between text-xxs font-mono">
                  <span className="text-foreground font-bold">{item.name}</span>
                  <span className="text-muted-foreground">{item.role}</span>
                </div>
                <p className="text-xxs text-muted-foreground leading-relaxed italic">"{item.text}"</p>
              </div>
            ))}
            {FEEDBACK_ITEMS.length === 0 && (
              <p className="text-xxs text-muted-foreground text-center py-4">{t("impact.noFeedback")}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
