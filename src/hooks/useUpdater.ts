import { useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export function useUpdater() {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadContentLength, setDownloadContentLength] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [updateStatusText, setUpdateStatusText] = useState("");
  const [isUpdateChecking, setIsUpdateChecking] = useState(false);

  const checkUpdateCenter = async () => {
    setIsUpdateChecking(true);
    setUpdateStatusText("Memeriksa rilis KDKMP di GitHub...");
    setDownloadProgress(0);
    setDownloadContentLength(0);
    setDownloadedBytes(0);
    try {
      const update = await check();
      if (update) {
        setUpdateStatusText(`Mengunduh update v${update.version}...`);
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
              setUpdateStatusText("Unduhan selesai. Menginstal...");
              break;
          }
        });
        setUpdateStatusText("Relaunching...");
        await relaunch();
      } else {
        setUpdateStatusText("Aplikasi sudah di versi terbaru!");
        setTimeout(() => setUpdateStatusText(""), 3000);
      }
    } catch (e) {
      console.error(e);
      setUpdateStatusText(`Gagal: ${e}`);
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
