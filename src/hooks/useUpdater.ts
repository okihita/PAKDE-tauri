import { useState } from "react";
import { useTranslation } from "react-i18next";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export function useUpdater() {
  const { t } = useTranslation();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadContentLength, setDownloadContentLength] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [updateStatusText, setUpdateStatusText] = useState("");
  const [isUpdateChecking, setIsUpdateChecking] = useState(false);

  const checkUpdateCenter = async () => {
    setIsUpdateChecking(true);
    setUpdateStatusText(t("settings.updater.checkingRilis"));
    setDownloadProgress(0);
    setDownloadContentLength(0);
    setDownloadedBytes(0);
    try {
      const update = await check();
      if (update) {
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
    checkUpdateCenter,
  };
}
