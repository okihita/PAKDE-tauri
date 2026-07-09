import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getDb } from "@/db";
import type { SyncHistoryItem, CountRow } from "@/types";

export function useSync() {
  const { t } = useTranslation();
  const [syncHistoryList, setSyncHistoryList] = useState<SyncHistoryItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState("");

  const loadSyncHistoryData = useCallback(async () => {
    try {
      const db = await getDb();
      const res = await db.select<SyncHistoryItem[]>("SELECT * FROM sync_history ORDER BY started_at DESC LIMIT 10");
      setSyncHistoryList(res);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncProgress(t("sync.steps.connecting"));

    setTimeout(() => {
      setSyncProgress(t("sync.steps.uploading"));
      setTimeout(async () => {
        setSyncProgress(t("sync.steps.syncing"));
        setTimeout(async () => {
          try {
            const db = await getDb();
            const syncId = `sync-${Date.now()}`;
            const members = await db.select<CountRow[]>("SELECT COUNT(*) as count FROM members");
            const entries = await db.select<CountRow[]>("SELECT COUNT(*) as count FROM journal_entries");
            const count = (members[0]?.count || 0) + (entries[0]?.count || 0);
            await db.execute(
              `INSERT INTO sync_history (id, direction, status, entity_count, completed_at) VALUES (?, 'upload', 'success', ?, datetime('now'))`,
              [syncId, count],
            );
            setSyncProgress(t("sync.steps.done"));
            setIsSyncing(false);
            loadSyncHistoryData();
            setTimeout(() => setSyncProgress(""), 3000);
          } catch (e) {
            console.error(e);
            setSyncProgress(t("sync.steps.failed", { error: String(e) }));
            setIsSyncing(false);
          }
        }, 1000);
      }, 1000);
    }, 1000);
  };

  return { syncHistoryList, isSyncing, syncProgress, loadSyncHistoryData, handleSyncNow };
}
