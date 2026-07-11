import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ExportIcon,
  TrayArrowUpIcon,
  LockIcon,
  CloudArrowDownIcon,
  ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { save, open } from "@tauri-apps/plugin-dialog";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";
import { buildBackup } from "./pack";
import { readEnvelope, decryptAndUnzip, applyBackup, type ParsedBackup } from "./restore";
import {
  isAutoBackupEnabled,
  setAutoBackupEnabled,
  listAutoBackups,
  restoreAutoBackup,
  type AutoBackupEntry,
} from "./autoBackup";

interface Props {
  coopId: string;
  coopName: string;
}

interface Pending {
  envelope: ReturnType<typeof readEnvelope>["envelope"];
  payload: Uint8Array;
}

const PAKDE_FILTER = [{ name: "PAKDE Backup", extensions: ["pkd"] }];

export default function BackupRestoreCard({ coopId, coopName }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<null | "export-options" | "import-passphrase">(null);

  // Unattended local auto-backup UI
  const [autoEnabled, setAutoEnabled] = useState(isAutoBackupEnabled());
  const [autoBackups, setAutoBackups] = useState<AutoBackupEntry[]>([]);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const refreshAutoBackups = async () => {
    if (!coopId) return setAutoBackups([]);
    try {
      setAutoBackups(await listAutoBackups(coopId));
    } catch {
      setAutoBackups([]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!autoEnabled || !coopId) {
        setAutoBackups([]);
        return;
      }
      try {
        const list = await listAutoBackups(coopId);
        if (!cancelled) setAutoBackups(list);
      } catch {
        if (!cancelled) setAutoBackups([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [autoEnabled, coopId]);

  const handleToggleAuto = (value: boolean) => {
    setAutoEnabled(value);
    setAutoBackupEnabled(value);
    if (value) void refreshAutoBackups();
    else setAutoBackups([]);
  };

  const handleRestoreAuto = async (entry: AutoBackupEntry) => {
    setRestoring(true);
    try {
      await restoreAutoBackup(entry.path);
      setRestoreOpen(false);
      toast.success(t("settings.backup.autoRestoreSuccess", { name: coopName }));
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error(t("settings.backup.importFailed", { error: String(err) }));
    } finally {
      setRestoring(false);
    }
  };

  // Export form
  const [encrypt, setEncrypt] = useState(false);
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");

  // Import form
  const [importPass, setImportPass] = useState("");
  const pendingRef = useRef<Pending | null>(null);

  const resetExportForm = () => {
    setEncrypt(false);
    setPass1("");
    setPass2("");
  };

  const handleExport = async () => {
    if (encrypt && pass1 !== pass2) {
      toast.error(t("settings.backup.passphraseMismatch"));
      return;
    }
    setBusy(true);
    try {
      const bytes = await buildBackup(coopId, { encrypted: encrypt, passphrase: encrypt ? pass1 : undefined });
      const path = await save({
        defaultPath: `${coopName || "koperasi"}.pkd`,
        filters: PAKDE_FILTER,
      });
      if (!path) return; // user cancelled
      await writeFile(path, bytes);
      toast.success(t("settings.backup.exportSuccess", { name: coopName }));
      setMode(null);
      resetExportForm();
    } catch (err) {
      toast.error(t("settings.backup.exportFailed", { error: String(err) }));
    } finally {
      setBusy(false);
    }
  };

  const finishImport = async (pending: Pending, passphrase?: string) => {
    setBusy(true);
    try {
      const parsed: ParsedBackup = await decryptAndUnzip(pending.envelope, pending.payload, passphrase);
      await applyBackup(parsed);
      localStorage.setItem("pakde-active-profile-id", parsed.manifest.coop_id);
      toast.success(t("settings.backup.importSuccess", { name: parsed.manifest.coop_name }));
      setMode(null);
      pendingRef.current = null;
      setImportPass("");
      // Reload so all cached connections / stores rebuild against the restored coop.
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      const msg = String(err);
      if (msg === "PASSPHRASE_REQUIRED") {
        pendingRef.current = pending;
        setMode("import-passphrase");
        return;
      }
      toast.error(t("settings.backup.importFailed", { error: msg }));
    } finally {
      setBusy(false);
    }
  };

  const handleImportClick = async () => {
    setBusy(true);
    try {
      const selected = await open({ filters: PAKDE_FILTER, multiple: false });
      if (!selected || Array.isArray(selected)) return;
      const bytes = await readFile(selected);
      const { envelope, payload } = readEnvelope(bytes);
      if (envelope.encrypted) {
        pendingRef.current = { envelope, payload };
        setMode("import-passphrase");
        return;
      }
      await finishImport({ envelope, payload });
    } catch (err) {
      toast.error(t("settings.backup.importFailed", { error: String(err) }));
    } finally {
      setBusy(false);
    }
  };

  const handleImportSubmit = async () => {
    if (!pendingRef.current) return;
    await finishImport(pendingRef.current, importPass);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => {
            resetExportForm();
            setMode("export-options");
          }}
          disabled={busy || !coopId}
          className="border-border text-muted-foreground hover:text-foreground text-xs h-9"
        >
          <ExportIcon className="h-3.5 w-3.5 mr-1.5" />
          {t("settings.backup.export")}
        </Button>
        <Button
          variant="outline"
          onClick={handleImportClick}
          disabled={busy}
          className="border-border text-muted-foreground hover:text-foreground text-xs h-9"
        >
          <TrayArrowUpIcon className="h-3.5 w-3.5 mr-1.5" />
          {t("settings.backup.import")}
        </Button>
      </div>

      {/* Automatic local backup */}
      <div className="mt-3 pt-3 border-t border-border space-y-2">
        <label className="flex items-start gap-2 text-xs text-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={autoEnabled}
            disabled={!coopId}
            onChange={(e) => handleToggleAuto(e.target.checked)}
          />
          <span>
            <span className="flex items-center gap-1.5 font-semibold">
              <CloudArrowDownIcon className="h-3.5 w-3.5 text-success" />
              {t("settings.backup.autoTitle")}
            </span>
            <span className="block text-xxs text-muted-foreground font-normal mt-0.5">
              {t("settings.backup.autoDesc")}
            </span>
          </span>
        </label>

        {autoEnabled && (
          <div className="flex items-center justify-between gap-2 pl-5">
            <span className="text-xxs text-muted-foreground">
              {autoBackups.length > 0
                ? t("settings.backup.autoCount", { count: autoBackups.length })
                : t("settings.backup.autoNone")}
            </span>
            <Button
              variant="outline"
              disabled={autoBackups.length === 0}
              onClick={() => setRestoreOpen(true)}
              className="border-border text-muted-foreground hover:text-foreground text-xxs h-8"
            >
              <ArrowCounterClockwiseIcon className="h-3.5 w-3.5 mr-1.5" />
              {t("settings.backup.autoRestore")}
            </Button>
          </div>
        )}
      </div>

      {/* Export options dialog */}
      <Dialog
        open={mode === "export-options"}
        onOpenChange={(openState) => {
          if (!openState) {
            setMode(null);
            resetExportForm();
          }
        }}
      >
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <ExportIcon className="h-4 w-4 text-success" />
              {t("settings.backup.exportTitle")}
            </DialogTitle>
            <DialogDescription className="text-xxs text-muted-foreground">
              {t("settings.backup.exportDesc", { name: coopName })}
            </DialogDescription>
          </DialogHeader>

          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
            <input type="checkbox" checked={encrypt} onChange={(e) => setEncrypt(e.target.checked)} />
            <LockIcon className="h-3.5 w-3.5 text-warning" />
            {t("settings.backup.encrypt")}
          </label>

          {encrypt && (
            <div className="space-y-2">
              <Input
                type="password"
                placeholder={t("settings.backup.passphrase")}
                value={pass1}
                onChange={(e) => setPass1(e.target.value)}
                className="bg-input border-border text-xs h-8"
              />
              <Input
                type="password"
                placeholder={t("settings.backup.confirmPassphrase")}
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
                className="bg-input border-border text-xs h-8"
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setMode(null);
                resetExportForm();
              }}
              className="text-xs border-border"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleExport}
              disabled={busy || (encrypt && pass1.length === 0)}
              className="bg-brand hover:bg-brand text-brand-foreground font-bold text-xs"
            >
              {busy ? t("common.processing") : t("settings.backup.export")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import passphrase dialog */}
      <Dialog
        open={mode === "import-passphrase"}
        onOpenChange={(openState) => {
          if (!openState) {
            setMode(null);
            pendingRef.current = null;
            setImportPass("");
          }
        }}
      >
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <LockIcon className="h-4 w-4 text-warning" />
              {t("settings.backup.unlockTitle")}
            </DialogTitle>
            <DialogDescription className="text-xxs text-muted-foreground">
              {t("settings.backup.unlockDesc")}
            </DialogDescription>
          </DialogHeader>

          <Input
            type="password"
            placeholder={t("settings.backup.passphrase")}
            value={importPass}
            onChange={(e) => setImportPass(e.target.value)}
            className="bg-input border-border text-xs h-8"
          />

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setMode(null);
                pendingRef.current = null;
                setImportPass("");
              }}
              className="text-xs border-border"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleImportSubmit}
              disabled={busy || importPass.length === 0}
              className="bg-brand hover:bg-brand text-brand-foreground font-bold text-xs"
            >
              {busy ? t("common.processing") : t("settings.backup.import")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-backup restore dialog */}
      <Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <ArrowCounterClockwiseIcon className="h-4 w-4 text-success" />
              {t("settings.backup.autoRestoreTitle")}
            </DialogTitle>
            <DialogDescription className="text-xxs text-muted-foreground">
              {t("settings.backup.autoRestoreDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 max-h-64 overflow-y-auto brand-scroll">
            {autoBackups.map((entry) => (
              <button
                key={entry.path}
                disabled={restoring}
                onClick={() => handleRestoreAuto(entry)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted/70 text-left transition-colors disabled:opacity-50"
              >
                <span className="text-xxs font-mono text-foreground">{entry.date.toLocaleString()}</span>
                <span className="text-xxxs text-muted-foreground font-bold">
                  {t("settings.backup.autoRestorePick")}
                </span>
              </button>
            ))}
            {autoBackups.length === 0 && (
              <p className="text-xxs text-muted-foreground text-center py-4">{t("settings.backup.autoNone")}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreOpen(false)} className="text-xs border-border">
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
