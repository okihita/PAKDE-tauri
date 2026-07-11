import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listen } from "@tauri-apps/api/event";
import { appDataDir, join } from "@tauri-apps/api/path";
import { readFile, remove } from "@tauri-apps/plugin-fs";
import { useToast } from "@/hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LockIcon } from "@phosphor-icons/react";
import { readEnvelope, decryptAndUnzip, applyBackup } from "./restore";

/**
 * Handles a `.pkd` file opened from the OS (double-click / "Open With").
 * The Rust side copies the file into `<appdata>/_incoming` and either emits
 * `pakde-backup-open` (app already running) or writes `_pending.txt` (launched
 * by opening the file). This component picks it up and runs the import.
 */
export default function BackupFileOpenHandler() {
  const { t } = useTranslation();
  const toast = useToast();
  const [passPath, setPassPath] = useState<string | null>(null);
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);

  const runImport = useCallback(
    async (path: string, passphrase?: string) => {
      const bytes = await readFile(path);
      const { envelope, payload } = readEnvelope(bytes);
      const parsed = await decryptAndUnzip(envelope, payload, passphrase);
      await applyBackup(parsed);
      localStorage.setItem("pakde-active-profile-id", parsed.manifest.coop_id);
      toast.success(t("settings.backup.importSuccess", { name: parsed.manifest.coop_name }));
      try {
        await remove(path);
        await remove(await join(await appDataDir(), "_incoming", "_pending.txt"));
      } catch {
        // best-effort cleanup
      }
      setTimeout(() => window.location.reload(), 600);
    },
    [t, toast],
  );

  useEffect(() => {
    let cancelled = false;

    const handle = async (path: string) => {
      try {
        const bytes = await readFile(path);
        const { envelope } = readEnvelope(bytes);
        if (envelope.encrypted) {
          if (!cancelled) setPassPath(path);
          return;
        }
        await runImport(path);
      } catch (err) {
        if (String(err) === "PASSPHRASE_REQUIRED") {
          if (!cancelled) setPassPath(path);
          return;
        }
        toast.error(t("settings.backup.importFailed", { error: String(err) }));
      }
    };

    // App launched by opening a file: read the pending marker.
    (async () => {
      try {
        const pending = await readFile(await join(await appDataDir(), "_incoming", "_pending.txt"));
        const path = new TextDecoder().decode(pending).trim();
        if (path) await handle(path);
      } catch {
        // no pending file — app was opened normally
      }
    })();

    // App already running: OS forwards the file via this event.
    const unlisten = listen<string>("pakde-backup-open", (e) => handle(e.payload));
    return () => {
      cancelled = true;
      unlisten.then((u) => u());
    };
  }, [toast, t, runImport]);

  const submitPass = async () => {
    if (!passPath) return;
    setBusy(true);
    try {
      await runImport(passPath, pass);
      setPassPath(null);
      setPass("");
    } catch (err) {
      toast.error(t("settings.backup.importFailed", { error: String(err) }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={!!passPath}
      onOpenChange={(openState) => {
        if (!openState) {
          setPassPath(null);
          setPass("");
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
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="bg-input border-border text-xs h-8"
        />
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setPassPath(null);
              setPass("");
            }}
            className="text-xs border-border"
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={submitPass}
            disabled={busy || pass.length === 0}
            className="bg-brand hover:bg-brand text-brand-foreground font-bold text-xs"
          >
            {busy ? t("common.processing") : t("settings.backup.import")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
