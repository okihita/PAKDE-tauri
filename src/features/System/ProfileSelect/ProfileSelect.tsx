import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Buildings, Plus, MapPin, SpeakerLow, SpeakerX, MusicNotes } from "@phosphor-icons/react";
import { getDb } from "@/db";
import type { CooperativeProfile } from "@/types";
import { sfx } from "./sfx";
import { bgMusic } from "./music";
import CreateProfileDialog from "./CreateProfileDialog";
import { seedDemoCooperative, clearDemoCooperative, isDemoSeeded } from "@/db/init";

// Module-level constants to satisfy eslint no-hardcoded-labels rule
const TEXT_UNIT_PUPUK = "Sales";
const TEXT_UNIT_SP = "Simpan Pinjam";
const TEXT_UNIT_TOKO = "Toko Desa";
const LOGOTYPE = "PAKDE";
const FOOTER_COPYRIGHT = "© 2026 PAKDE. pakde.coop";

interface ProfileSelectProps {
  onProfileSelect: (profile: CooperativeProfile) => void;
}

export default function ProfileSelect({ onProfileSelect }: ProfileSelectProps) {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<CooperativeProfile[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(sfx.enabled);
  const [musicOn, setMusicOn] = useState(bgMusic.enabled);
  const [demoSeeded, setDemoSeeded] = useState(false);

  const loadProfiles = async () => {
    const db = await getDb();
    const list = await db.select<CooperativeProfile[]>("SELECT * FROM cooperatives ORDER BY created_at DESC");
    setProfiles(list);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadProfiles();
        if (import.meta.env.DEV) {
          setDemoSeeded(await isDemoSeeded());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUserInteraction = () => {
    sfx.resume();
    bgMusic.resume();
  };

  const handleSoundToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleUserInteraction();
    const newState = sfx.toggleSound();
    setSoundOn(newState);
    if (newState) {
      sfx.playBleep(800, 0.05);
    }
  };

  const handleMusicToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleUserInteraction();
    const newState = bgMusic.toggleMusic();
    setMusicOn(newState);
  };

  const handleCardClick = (p: CooperativeProfile) => {
    handleUserInteraction();
    sfx.playChime();
    setTimeout(() => {
      onProfileSelect(p);
    }, 280);
  };

  const handleCardHover = () => {
    sfx.playBleep(700, 0.012);
  };

  const handleDevToggle = async () => {
    if (demoSeeded) {
      await clearDemoCooperative();
    } else {
      await seedDemoCooperative();
    }
    await loadProfiles();
    setDemoSeeded(!demoSeeded);
  };

  const handleCreateCreated = (newProfile: CooperativeProfile) => {
    setProfiles((prev) => [newProfile, ...prev]);
    setShowCreateModal(false);
    onProfileSelect(newProfile);
  };

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
    <div
      onClick={handleUserInteraction}
      className="flex-1 flex flex-col h-full w-full relative overflow-hidden bg-cover bg-center select-none"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      {/* Dark blur overlay */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] bg-gradient-to-b from-slate-950/20 via-slate-950/50 to-slate-950/80 z-0" />

      {/* Audio Controls (Absolute top right) */}
      <div className="absolute top-4 right-4 z-20 flex gap-1.5">
        <button
          onClick={handleMusicToggle}
          className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-slate-200 transition-colors shadow-md backdrop-blur-md"
          title={musicOn ? "Music On" : "Music Off"}
        >
          <MusicNotes className={`h-4 w-4 ${musicOn ? "text-success" : "text-slate-500"}`} />
        </button>
        <button
          onClick={handleSoundToggle}
          className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors shadow-md backdrop-blur-md"
          title={soundOn ? "Mute SFX" : "Unmute SFX"}
        >
          {soundOn ? <SpeakerLow className="h-4 w-4" /> : <SpeakerX className="h-4 w-4 text-danger" />}
        </button>
      </div>

      {/* Top: Logotype Header */}
      <div className="relative z-10 flex justify-center pt-12 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="text-center p-6 rounded-2xl bg-slate-950/80 border border-slate-900 backdrop-blur-lg w-fit shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
          <h1 className="text-8xl font-black bg-gradient-to-r from-brand to-teal-400 bg-clip-text text-transparent tracking-tight font-sans leading-none">
            {LOGOTYPE}
          </h1>
        </div>
      </div>

      {/* Middle: Profile Cards or Empty State */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
        {loading ? (
          <div className="text-center py-12 text-xxs font-mono text-brand animate-pulse">{t("common.loading")}</div>
        ) : profiles.length === 0 ? (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center mx-auto shadow-sm">
              <Buildings className="h-8 w-8 text-slate-500" />
            </div>
            <div className="space-y-1.5 max-w-xs mx-auto">
              <h2 className="text-sm font-bold text-foreground tracking-wide">{t("profileSelect.emptyTitle")}</h2>
              <p className="text-xxs font-mono text-slate-400 leading-relaxed">{t("profileSelect.emptyDesc")}</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              onMouseEnter={handleCardHover}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand/10 border border-brand/25 hover:bg-brand/20 hover:border-brand/40 text-success text-xxs font-mono font-bold uppercase tracking-wider transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              {t("profileSelect.createBtn")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {profiles.map((p) => {
              const activeUnits = getBusinessUnits(p.business_units);
              const isHealthy = p.health_score >= 70;
              const isCritical = p.health_score < 40;

              return (
                <Card
                  key={p.id}
                  onClick={() => handleCardClick(p)}
                  onMouseEnter={handleCardHover}
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

                  {/* Subtle Gamified Specs Section (Health bar and Unit tags) */}
                  <div className="space-y-3 pt-4 border-t border-slate-900 font-sans">
                    {/* Cooperative Health Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xxxs font-mono text-slate-400">
                        <span className="uppercase">{t("profileSelect.health")}</span>
                        <span
                          className={`font-bold ${isHealthy ? "text-success" : isCritical ? "text-danger" : "text-warning"}`}
                        >
                          {p.health_score}%
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isHealthy ? "bg-brand" : isCritical ? "bg-danger" : "bg-warning"
                          }`}
                          style={{ width: `${p.health_score}%` }}
                        />
                      </div>
                    </div>

                    {/* Active units list */}
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

            {/* "+ Create New" item card */}
            <Card
              onClick={() => setShowCreateModal(true)}
              onMouseEnter={handleCardHover}
              className="bg-slate-950/60 border-dashed border-slate-800 hover:border-brand/35 hover:bg-success/5 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-52 p-5 hover:scale-[1.01] select-none shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center mb-3 group-hover:bg-slate-800 border border-slate-800 transition-colors shadow-sm">
                <Plus className="h-5 w-5 text-success" />
              </div>
              <span className="text-xxs font-mono font-bold text-success uppercase tracking-wider">
                {t("profileSelect.createBtn")}
              </span>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom: Footer */}
      <div className="relative z-10 flex flex-col items-center pb-8 space-y-0.5 animate-in fade-in duration-500">
        <span className="text-xxs font-mono text-slate-500">{t("splash.version")}</span>
        <span className="text-xxs font-mono text-slate-600">{FOOTER_COPYRIGHT}</span>
      </div>

      {import.meta.env.DEV && (
        <div className="absolute bottom-4 left-4 z-20">
          <button
            onClick={handleDevToggle}
            className="px-2.5 py-1.5 rounded-md bg-amber-950/60 border border-amber-800/50 text-amber-500 text-xxxs font-mono uppercase tracking-wider hover:bg-amber-900/60 hover:border-amber-700/50 transition-colors shadow-md backdrop-blur-md"
          >
            {demoSeeded ? "Clear Seed" : "Seed Demo"}
          </button>
        </div>
      )}

      <CreateProfileDialog
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onProfileCreated={handleCreateCreated}
      />
    </div>
  );
}
