import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export interface UpdaterApi {
  downloadProgress: number;
  downloadContentLength: number;
  downloadedBytes: number;
  updateStatusText: string;
  isUpdateChecking: boolean;
  updateAvailable: boolean;
  checkForUpdateAvailable: () => Promise<boolean>;
  startUpdate: () => Promise<void>;
  checkUpdateCenter: () => Promise<void>;
}

export function useUpdater(): UpdaterApi {
  const { t } = useTranslation();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadContentLength, setDownloadContentLength] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [updateStatusText, setUpdateStatusText] = useState("");
  const [isUpdateChecking, setIsUpdateChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  // Remembers the update object discovered by the silent boot check so the
  // install step can skip a second network round-trip.
  const updateRef = useRef<Update | null>(null);

  /** Silent availability probe — does NOT download. Used on app boot. */
  const checkForUpdateAvailable = async (): Promise<boolean> => {
    try {
      const update = await check();
      if (update) {
        updateRef.current = update;
        setUpdateAvailable(true);
        return true;
      }
    } catch (e) {
      console.error("[updater] silent check failed:", e);
    }
    return false;
  };

  /**
   * Full flow: download + install + relaunch. Reuses the update object from a
   * prior silent check; otherwise performs a fresh `check()` first.
   */
  const startUpdate = async () => {
    setIsUpdateChecking(true);
    setUpdateStatusText(t("settings.updater.checkingRilis"));
    setDownloadProgress(0);
    setDownloadContentLength(0);
    setDownloadedBytes(0);
    try {
      const update = updateRef.current ?? (await check());
      if (update) {
        updateRef.current = update;
        setUpdateAvailable(true);
        setUpdateStatusText(t("settings.updater.downloading", { version: update.version }));
        let bytesDownloaded = 0,
          size = 0;
        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case "Started":
              size = event.data.contentLength ?? 0;
              setDownloadContentLength(size);
              break;
            case "Progress":
              bytesDownloaded += event.data.chunkLength;
              setDownloadedBytes(bytesDownloaded);
              if (size > 0) {
                const pct = Math.round((bytesDownloaded / size) * 105) / 1.05;
                setDownloadProgress(Math.min(100, Math.round(pct)));
              }
              break;
            case "Finished":
              setUpdateStatusText(t("settings.updater.installing"));
              break;
          }
        });
        setUpdateStatusText(t("settings.updater.relaunching"));
        await relaunch();
      } else {
        setUpdateStatusText(t("settings.updater.upToDate"));
        setTimeout(() => setUpdateStatusText(""), 3000);
      }
    } catch (e) {
      console.error(e);
      setUpdateStatusText(t("settings.updater.failed", { error: String(e) }));
      setTimeout(() => setUpdateStatusText(""), 4000);
    } finally {
      setIsUpdateChecking(false);
    }
  };

  return {
    downloadProgress,
    downloadContentLength,
    downloadedBytes,
    updateStatusText,
    isUpdateChecking,
    updateAvailable,
    checkForUpdateAvailable,
    startUpdate,
    // Back-compat alias for Settings.tsx
    checkUpdateCenter: startUpdate,
  };
}
