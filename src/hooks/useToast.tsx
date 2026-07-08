/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, XCircleIcon, WarningIcon } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmResolver = (value: boolean) => void;

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error";
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  confirm: (message: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // ── Confirm dialog state ──
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmResolver, setConfirmResolver] = useState<ConfirmResolver | null>(null);

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const success = useCallback((message: string) => addToast(message, "success"), [addToast]);

  const toastError = useCallback((message: string) => addToast(message, "error"), [addToast]);

  const confirm = useCallback((message: string): Promise<boolean> => {
    setConfirmMessage(message);
    setConfirmOpen(true);
    return new Promise((resolve) => {
      setConfirmResolver(() => resolve);
    });
  }, []);

  const handleConfirm = (value: boolean) => {
    setConfirmOpen(false);
    confirmResolver?.(value);
    setConfirmResolver(null);
  };

  return (
    <ToastContext.Provider value={{ success, error: toastError, confirm }}>
      {children}

      {/* Toast stack — fixed bottom-right */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md text-xs font-semibold animate-slide-in ${
              t.type === "success"
                ? "bg-success/90 border-success/30 text-success"
                : "bg-danger/90 border-danger/30 text-danger"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircleIcon className="h-4 w-4 shrink-0" />
            ) : (
              <XCircleIcon className="h-4 w-4 shrink-0" />
            )}
            <span className="font-mono">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={(open) => !open && handleConfirm(false)}>
        <DialogContent className="bg-card border border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <WarningIcon className="h-4 w-4 text-warning" />
              {t("common.confirm")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground font-mono py-2">{confirmMessage}</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleConfirm(false)} className="text-xs border-border">
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => handleConfirm(true)}
              className="bg-brand hover:bg-brand text-brand-foreground font-bold text-xs"
            >
              {t("common.continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
