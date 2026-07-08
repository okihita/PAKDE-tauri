import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { UserCheck, Key, WarningCircle, ArrowLeft, Eye, EyeSlash } from "@phosphor-icons/react";
import { getUsersByCooperativeId, validatePin } from "./userDb";
import type { LocalUser } from "@/types";

const LBL_LOADING = "Memuat...";
const LBL_NO_USERS = "Tidak ada pengguna terdaftar";
const LBL_NO_USERS_DESC = "Belum ada profil pengguna untuk koperasi ini.";
const LBL_BACK = "Kembali";
const LBL_SIGN_IN = "Masuk ke Koperasi";
const LBL_SEL_USER = "Pilih Pengguna";
const LBL_PIN = "Masukkan PIN (6 digit)";
const LBL_SIGN_IN_BTN = "Masuk";
const LBL_PIN_WRONG = "PIN tidak valid. Silakan coba lagi.";
const LBL_LOAD_FAIL = "Gagal memuat data pengguna.";
const PLACEHOLDER_PIN = "••••••";

interface UserSignInProps {
  cooperativeId: string;
  cooperativeName: string;
  onSuccess: (user: LocalUser) => void;
  onBack: () => void;
}

export default function UserSignIn({ cooperativeId, cooperativeName, onSuccess, onBack }: UserSignInProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = await getUsersByCooperativeId(cooperativeId);
        setUsers(list);
        if (list.length === 1) setSelectedUserId(list[0].id);
      } catch {
        setError(LBL_LOAD_FAIL);
      } finally {
        setLoading(false);
      }
    })();
  }, [cooperativeId]);

  const handleSignIn = async () => {
    if (!selectedUserId || pin.length !== 6) return;
    setSigningIn(true);
    setError("");
    try {
      const user = await validatePin(cooperativeId, selectedUserId, pin);
      if (user) {
        onSuccess(user);
      } else {
        setError(LBL_PIN_WRONG);
        setPin("");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setPin("");
    }
    setSigningIn(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full w-full bg-slate-950">
        <div className="text-brand animate-pulse text-xs font-mono">{LBL_LOADING}</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full w-full p-6 bg-slate-950">
        <div className="text-center space-y-4">
          <WarningCircle className="h-12 w-12 text-amber-400 mx-auto" />
          <p className="text-sm text-slate-300 font-bold">{LBL_NO_USERS}</p>
          <p className="text-xxs text-slate-500">{LBL_NO_USERS_DESC}</p>
          <Button onClick={onBack} variant="outline" className="border-slate-800 text-slate-400 text-xs h-8">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            {LBL_BACK}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full w-full p-6 bg-slate-950 select-none">
      <div className="w-full max-w-sm mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center mx-auto">
            <UserCheck className="h-8 w-8 text-brand" weight="fill" />
          </div>
          <h2 className="text-xl font-bold text-white">{LBL_SIGN_IN}</h2>
          <p className="text-xs text-slate-400">{cooperativeName}</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-xxs font-mono text-danger flex items-start gap-2">
            <WarningCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          {users.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-success text-xxxs uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                {LBL_SEL_USER}
              </label>
              <div className="flex flex-col gap-1.5">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUserId(u.id)}
                    className={`text-left text-xs p-3 rounded-lg border transition-all ${
                      selectedUserId === u.id
                        ? "bg-brand/10 border-brand text-brand font-bold"
                        : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    <span className="block">{u.name}</span>
                    <span className="text-xxxs text-slate-500 capitalize">{u.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {users.length === 1 && (
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <p className="text-xs font-bold text-slate-200">{users[0].name}</p>
              <p className="text-xxxs text-slate-500 capitalize">{users[0].role}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-success text-xxxs uppercase tracking-wider flex items-center gap-1">
              <Key className="h-3 w-3" />
              {LBL_PIN}
            </label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPin(v);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSignIn();
                }}
                placeholder={PLACEHOLDER_PIN}
                maxLength={6}
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm h-11 px-4 pr-10 tracking-[0.4em] text-center font-mono focus:outline-none focus:border-brand transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPin((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPin ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1 border-slate-800 bg-slate-950 text-slate-400 hover:text-white text-xs h-9"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            {LBL_BACK}
          </Button>
          <Button
            onClick={handleSignIn}
            disabled={!selectedUserId || pin.length !== 6 || signingIn}
            className="flex-1 bg-brand hover:bg-brand/90 text-brand-foreground font-bold text-xs h-9 disabled:opacity-40"
          >
            {signingIn ? <span className="animate-pulse">{LBL_LOADING}</span> : LBL_SIGN_IN_BTN}
          </Button>
        </div>

        <p className="text-xxs text-slate-600 text-center">{t("splash.version")}</p>
      </div>
    </div>
  );
}
