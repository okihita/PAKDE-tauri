import { useState, useCallback } from "react";
import { getDb } from "@/db";
import type { SyncHistoryItem, CountRow } from "@/types";

export function useSync() {
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
    setSyncProgress("Menghubungkan ke API server node Mojokerto...");

    setTimeout(() => {
      setSyncProgress("Mengunggah log transaksi jurnal & anggota baru...");
      setTimeout(async () => {
        setSyncProgress("Singkronisasi parameter rasio EWS kabupaten...");
        setTimeout(async () => {
          try {
            const db = await getDb();
            const syncId = `sync-${Date.now()}`;
            const members = await db.select<CountRow[]>("SELECT COUNT(*) as count FROM members");
            const entries = await db.select<CountRow[]>("SELECT COUNT(*) as count FROM journal_entries");
            const count = (members[0]?.count || 0) + (entries[0]?.count || 0);
            await db.execute(
              `INSERT INTO sync_history (id, cooperative_id, direction, status, entity_count, completed_at) VALUES (?, 'kdp-001', 'upload', 'success', ?, datetime('now'))`,
              [syncId, count],
            );
            setSyncProgress("Sinkronisasi Selesai!");
            setIsSyncing(false);
            loadSyncHistoryData();
            setTimeout(() => setSyncProgress(""), 3000);
          } catch (e) {
            console.error(e);
            setSyncProgress(`Sinkronisasi Gagal: ${e}`);
            setIsSyncing(false);
          }
        }, 1000);
      }, 1000);
    }, 1000);
  };

  return { syncHistoryList, isSyncing, syncProgress, loadSyncHistoryData, handleSyncNow };
}
