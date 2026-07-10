/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, XCircleIcon, WarningIcon, CopyIcon, XIcon } from "@phosphor-icons/react";
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
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // ── Confirm dialog state ──
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmResolver, setConfirmResolver] = useState<ConfirmResolver | null>(null);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: "success" | "error") => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);
      // Only success toasts auto-dismiss. Errors (incl. SQL errors) stay
      // until the user copies/dismisses them — they carry actionable detail.
      if (type !== "error") {
        setTimeout(() => dismiss(id), 3500);
      }
    },
    [dismiss],
  );

  const copyError = useCallback(async (id: number, message: string) => {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1200);
    } catch {
      // Clipboard may be unavailable (e.g. unsecured context) — ignore.
    }
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
        {toasts.map((toast) => {
          const isError = toast.type === "error";
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-2 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md text-xs font-semibold animate-slide-in max-w-sm ${
                isError ? "bg-danger/90 border-danger/30 text-danger" : "bg-success/90 border-success/30 text-success"
              }`}
            >
              {isError ? (
                <XCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <span className="font-mono flex-1 break-words">{toast.message}</span>
              {isError && (
                <button
                  type="button"
                  onClick={() => void copyError(toast.id, toast.message)}
                  title={copiedId === toast.id ? t("common.copied") : t("common.copy")}
                  className="shrink-0 mt-0.5 text-danger/80 hover:text-danger transition-colors"
                >
                  <CopyIcon className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                title={t("common.close")}
                className="shrink-0 mt-0.5 text-current/70 hover:text-current transition-colors"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
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
