import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, ShieldCheck, Key, Question, Eye, EyeSlash } from "@phosphor-icons/react";
import { createUser } from "./userDb";
import type { LocalUser } from "@/types";
import { sfx } from "./sfx";
import { useAppVersion } from "@/hooks/useAppVersion";

const LBL_TITLE = "Buat Profil Pengguna";
const LBL_SUBTITLE_PREFIX = "Anda akan menjadi administrator untuk";
const LBL_START = "Mulai Kelola Koperasi";
const PLACEHOLDER_NAME = "Nama Anda";
const PLACEHOLDER_PIN = "123456";

const ROLES = [
  { value: "admin" as const, label: "Admin / Ketua" },
  { value: "operator" as const, label: "Operator / Bendahara" },
  { value: "pengawas" as const, label: "Pengawas" },
];

interface CreateUserProfileProps {
  cooperativeId: string;
  cooperativeName: string;
  onComplete: (user: LocalUser) => void;
}

export default function CreateUserProfile({ cooperativeId, cooperativeName, onComplete }: CreateUserProfileProps) {
  const { t } = useTranslation();
  const appVersion = useAppVersion();
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "operator" | "pengawas">("admin");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [recoveryQuestion, setRecoveryQuestion] = useState("");
  const [recoveryAnswer, setRecoveryAnswer] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const isValid = name.trim().length > 0 && pin.length === 6 && /^\d+$/.test(pin) && pin === pinConfirm;

  const handleCreate = async () => {
    if (!isValid) {
      setError(t("settings.userProfile.pinValidation"));
      return;
    }
    setCreating(true);
    setError("");
    sfx.playChime();
    try {
      const user = await createUser({
        cooperativeId,
        name: name.trim(),
        role,
        pin,
        recoveryQuestion: recoveryQuestion.trim() || undefined,
        recoveryAnswer: recoveryAnswer.trim() || undefined,
      });
      onComplete(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      sfx.playBleep(300, 0.05);
    }
    setCreating(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full w-full p-6 bg-slate-950 select-none">
      <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center mx-auto">
            <UserPlus className="h-8 w-8 text-brand" weight="fill" />
          </div>
          <h2 className="text-xl font-bold text-white">{LBL_TITLE}</h2>
          <p className="text-xs text-slate-400">
            {LBL_SUBTITLE_PREFIX} <span className="text-brand font-semibold">{cooperativeName}</span>
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-xxs text-danger">{error}</div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-success text-xxxs uppercase tracking-wider flex items-center gap-1">
              <UserPlus className="h-3 w-3" />
              {t("settings.userProfile.name")}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={PLACEHOLDER_NAME}
              autoFocus
              className="bg-slate-900 border-slate-700 text-slate-100 text-xs h-9"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-success text-xxxs uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              {t("settings.userProfile.role")}
            </label>
            <div className="flex gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex-1 text-xxs font-bold py-2 px-2 rounded-lg border transition-all ${
                    role === r.value
                      ? "bg-brand/10 border-brand text-brand"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-success text-xxxs uppercase tracking-wider flex items-center gap-1">
              <Key className="h-3 w-3" />
              {t("settings.userProfile.pin")}
            </label>
            <div className="relative">
              <Input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPin(v);
                }}
                placeholder={PLACEHOLDER_PIN}
                maxLength={6}
                className="bg-slate-900 border-slate-700 text-slate-100 text-xs h-9 pr-10 tracking-[0.3em]"
              />
              <button
                type="button"
                onClick={() => setShowPin((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPin ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-success text-xxxs uppercase tracking-wider flex items-center gap-1">
              <Key className="h-3 w-3" />
              {t("settings.userProfile.pinConfirm")}
            </label>
            <Input
              type="password"
              value={pinConfirm}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setPinConfirm(v);
              }}
              placeholder={PLACEHOLDER_PIN}
              maxLength={6}
              className="bg-slate-900 border-slate-700 text-slate-100 text-xs h-9 tracking-[0.3em]"
            />
            {pinConfirm.length > 0 && pin !== pinConfirm && (
              <p className="text-xxxs text-danger mt-1">{t("settings.userProfile.pinMismatch")}</p>
            )}
          </div>

          <details className="space-y-2">
            <summary className="text-xxs text-slate-500 cursor-pointer hover:text-slate-400 flex items-center gap-1">
              <Question className="h-3 w-3" />
              {t("settings.userProfile.recovery")}
            </summary>
            <div className="space-y-1.5 mt-2 pl-6">
              <Input
                value={recoveryQuestion}
                onChange={(e) => setRecoveryQuestion(e.target.value)}
                placeholder={t("settings.userProfile.recoveryQuestion")}
                className="bg-slate-900 border-slate-700 text-slate-100 text-xxs h-8"
              />
              <Input
                value={recoveryAnswer}
                onChange={(e) => setRecoveryAnswer(e.target.value)}
                placeholder={t("settings.userProfile.recoveryAnswer")}
                className="bg-slate-900 border-slate-700 text-slate-100 text-xxs h-8"
              />
            </div>
          </details>
        </div>

        <Button
          onClick={handleCreate}
          disabled={!isValid || creating}
          className="w-full bg-brand hover:bg-brand/90 text-brand-foreground font-bold text-sm h-10 disabled:opacity-40"
        >
          {creating ? <span className="animate-pulse">{t("settings.saving")}</span> : <>{LBL_START}</>}
        </Button>

        <p className="text-xxs text-slate-600 text-center">{t("splash.version", { version: appVersion })}</p>
      </div>
    </div>
  );
}
