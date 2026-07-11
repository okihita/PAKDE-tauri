import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { UserCheck, Eye, EyeSlash } from "@phosphor-icons/react";
import { updateUser } from "@/features/System/ProfileSelect/userDb";
import type { LocalUser } from "@/types";

const ROLES: { value: LocalUser["role"]; label: string }[] = [
  { value: "admin", label: "Admin / Ketua" },
  { value: "operator", label: "Operator / Bendahara" },
  { value: "pengawas", label: "Pengawas" },
];

function UserProfileForm({ user, onSaved }: { user: LocalUser; onSaved: (u: LocalUser) => void }) {
  const { t } = useTranslation();
  const toast = useToast();

  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<LocalUser["role"]>(user.role);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [recoveryQuestion, setRecoveryQuestion] = useState(user.recovery_question ?? "");
  const [recoveryAnswer, setRecoveryAnswer] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pinMismatch = pin.length > 0 && pin !== pinConfirm;
  const pinInvalid = pin.length > 0 && (pin.length !== 6 || !/^\d+$/.test(pin));
  const isValid = name.trim().length > 0 && !pinMismatch && !pinInvalid;

  const handleSave = async () => {
    if (!isValid) {
      setError(t("userProfile.pinValidation"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await updateUser(user.id, {
        name: name.trim(),
        role,
        ...(pin.length > 0 ? { pin } : {}),
        recoveryQuestion,
        recoveryAnswer,
      });
      toast.success(t("toast.profileSaveSuccess"));
      onSaved(updated);
    } catch (err) {
      toast.error(t("toast.profileSaveFailed", { error: String(err) }));
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="space-y-1.5">
        <label className="text-muted-foreground font-mono text-xxxs uppercase">{t("userProfile.name")}</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-input border-border text-xs h-8" />
      </div>

      <div className="space-y-1.5">
        <label className="text-muted-foreground font-mono text-xxxs uppercase">{t("userProfile.role")}</label>
        <div className="flex gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`flex-1 text-xxs font-bold py-2 px-2 rounded-lg border transition-all ${
                role === r.value
                  ? "bg-brand/10 border-brand text-brand"
                  : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-muted-foreground font-mono text-xxxs uppercase">{t("userProfile.pin")}</label>
        <div className="relative">
          <Input
            type={showPin ? "text" : "password"}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            placeholder="••••••"
            className="bg-input border-border text-xs h-8 pr-9 tracking-[0.3em]"
          />
          <button
            type="button"
            onClick={() => setShowPin((p) => !p)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPin ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-muted-foreground font-mono text-xxxs uppercase">{t("userProfile.pinConfirm")}</label>
        <Input
          type="password"
          value={pinConfirm}
          onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          placeholder="••••••"
          className="bg-input border-border text-xs h-8 tracking-[0.3em]"
        />
        {pinMismatch && <p className="text-xxxs text-danger mt-1">{t("userProfile.pinMismatch")}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-muted-foreground font-mono text-xxxs uppercase">{t("userProfile.recovery")}</label>
        <Input
          value={recoveryQuestion}
          onChange={(e) => setRecoveryQuestion(e.target.value)}
          placeholder={t("userProfile.recoveryQuestion")}
          className="bg-input border-border text-xs h-8"
        />
        <Input
          value={recoveryAnswer}
          onChange={(e) => setRecoveryAnswer(e.target.value)}
          placeholder={t("userProfile.recoveryAnswer")}
          className="bg-input border-border text-xs h-8"
        />
      </div>

      {error && <p className="text-xxxs text-danger">{error}</p>}

      <Button
        onClick={handleSave}
        disabled={!isValid || saving}
        className="w-full bg-brand hover:bg-brand text-brand-foreground font-bold text-xs h-9"
      >
        {saving ? <span className="animate-pulse">{t("settings.saving")}</span> : t("userProfile.saveProfile")}
      </Button>
    </div>
  );
}

export default function UserProfileModal({
  open,
  onOpenChange,
  currentUser,
  setCurrentUser,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: LocalUser | null;
  setCurrentUser: (u: LocalUser) => void;
}) {
  const { t } = useTranslation();
  if (!currentUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center ring-1 ring-brand/30 shrink-0">
              <UserCheck className="h-4 w-4 text-success" />
            </div>
            <span className="text-sm font-bold text-foreground break-words">{currentUser.name}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">{t("topbar.openProfile")}</DialogDescription>
        </DialogHeader>

        {open && (
          <UserProfileForm
            key={currentUser.id}
            user={currentUser}
            onSaved={(u) => {
              setCurrentUser(u);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
