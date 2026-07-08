import { useState } from "react";
import { Trophy, CheckCircle, Circle } from "@phosphor-icons/react";
import { updateCooperative } from "@/features/System/Settings/settingsDb";
import type { CooperativeProfile } from "@/types";

interface Props {
  profile: CooperativeProfile;
  onUpdate: (p: CooperativeProfile) => void;
}

interface FieldDef {
  key: keyof CooperativeProfile;
  label: string;
  pts: number;
  check: (p: CooperativeProfile) => boolean;
}

const HEADING = "Lengkapi Profil Koperasi";
const REWARD_MSG = 'Badge "Koperasi Lengkap" terbuka!';
const BTN_SAVE = "Simpan";
const POINTS_LABEL = "poin";

const FIELDS: FieldDef[] = [
  { key: "name", label: "Nama Koperasi", pts: 5, check: (p) => !!p.name },
  { key: "province", label: "Lokasi", pts: 10, check: (p) => !!p.province },
  { key: "legal_id", label: "Badan Hukum", pts: 5, check: (p) => !!p.legal_id },
  { key: "address", label: "Alamat & Kontak", pts: 5, check: (p) => !!(p.address || p.phone || p.email) },
  {
    key: "officers",
    label: "Pengurus",
    pts: 10,
    check: (p) => {
      try {
        const o = JSON.parse(p.officers);
        return !!(o?.chairman || o?.secretary);
      } catch {
        return false;
      }
    },
  },
  {
    key: "business_units",
    label: "Unit Usaha",
    pts: 15,
    check: (p) => {
      try {
        const u = JSON.parse(p.business_units);
        return Array.isArray(u) && u.length > 0;
      } catch {
        return false;
      }
    },
  },
  { key: "founded_date", label: "Tanggal Berdiri", pts: 5, check: (p) => !!p.founded_date },
];

const TOTAL_PTS = FIELDS.reduce((s, f) => s + f.pts, 0);

export default function ProfileCompletion({ profile, onUpdate }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const completed = FIELDS.filter((f) => f.check(profile));
  const earnedPts = completed.reduce((s, f) => s + f.pts, 0);
  const pct = Math.round((earnedPts / TOTAL_PTS) * 100);

  const handleEdit = (field: FieldDef) => {
    if (field.key === "province") return; // RegionPicker is complex, skip inline edit
    if (field.key === "business_units" || field.key === "officers") {
      // Parse JSON for these
      try {
        setEditValue(JSON.stringify(JSON.parse((profile[field.key] as string) || "{}"), null, 2));
      } catch {
        setEditValue("");
      }
    } else {
      setEditValue((profile[field.key] as string) || "");
    }
    setEditing(field.key);
  };

  const handleSave = async (field: FieldDef) => {
    setSaving(true);
    try {
      const value: string = editValue;
      const updated = { ...profile, [field.key]: value };
      await updateCooperative(profile.id || "", { [field.key]: value });
      onUpdate(updated);
    } catch {
      /* ignore */
    }
    setSaving(false);
    setEditing(null);
  };

  if (pct === 100) return null; // Already complete

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-xxs font-bold text-slate-400 uppercase tracking-wider">{HEADING}</h3>
        <span className="text-xxs font-mono text-brand">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      {/* Checklist */}
      <div className="space-y-0.5">
        {FIELDS.map((f) => {
          const done = f.check(profile);
          return (
            <div key={f.key}>
              <div
                className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xxs cursor-pointer transition-colors ${
                  done ? "text-slate-500" : "text-slate-300 hover:bg-slate-800/50"
                }`}
                onClick={() => !done && handleEdit(f)}
              >
                <span className="flex items-center gap-1.5">
                  {done ? (
                    <CheckCircle className="h-3 w-3 text-brand shrink-0" weight="fill" />
                  ) : (
                    <Circle className="h-3 w-3 text-slate-600 shrink-0" />
                  )}
                  {f.label}
                </span>
                <span className="text-xxxs font-mono text-slate-600">{done ? `+${f.pts}pt` : `${f.pts}pt`}</span>
              </div>

              {/* Inline edit */}
              {editing === f.key && (
                <div className="flex items-center gap-1.5 px-2 pb-1.5">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    className="flex-1 bg-slate-950 border border-slate-700 rounded text-xxs text-slate-200 px-2 py-1 focus:border-brand/50 outline-none"
                  />
                  <button
                    onClick={() => handleSave(f)}
                    disabled={saving}
                    className="text-xxs font-bold text-brand hover:text-brand/80 px-2"
                  >
                    {saving ? "..." : BTN_SAVE}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Points summary */}
      <div className="flex items-center gap-2 text-xxs text-slate-500">
        <Trophy className="h-3 w-3 text-amber-500" />
        <span>
          {earnedPts}/{TOTAL_PTS} {POINTS_LABEL} — 100% = {REWARD_MSG}
        </span>
      </div>
    </div>
  );
}
