import DevDocStripe from "@/components/DevDocStripe";
import readmeContent from "./README.md?raw";
import "./SplashScreen.css";
import { useTranslation } from "react-i18next";

export default function SplashScreen() {
  const { t } = useTranslation();

  return (
    <div
      className="flex h-screen flex-col items-center justify-center relative overflow-hidden bg-cover bg-center text-foreground text-center animate-in fade-in duration-500"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <DevDocStripe content={readmeContent} />
      <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px] bg-gradient-to-b from-slate-950/10 via-slate-950/45 to-slate-950/75" />

      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
          <div className="relative text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent px-6 py-2 border-[0.5px] border-emerald-500/30 rounded-2xl bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            {t("splash.brand")}
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-wider text-slate-100">{t("splash.title")}</h2>
          <p className="text-muted-foreground text-xs font-mono">{t("splash.subtitle")}</p>
        </div>
        <div className="w-40 bg-muted h-1 rounded-full overflow-hidden border border-muted/40">
          <div className="bg-emerald-500 h-full w-2/3 animate-[pulse_1.5s_infinite] rounded-full" />
        </div>
      </div>
      <p className="absolute bottom-8 text-muted-foreground font-mono text-xxs">{t("splash.version")}</p>
    </div>
  );
}
