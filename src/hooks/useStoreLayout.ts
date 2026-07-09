import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getDb } from "@/db";
import { useToast } from "@/hooks/useToast";

import type { StoreLayout, LayoutZone, InventoryItem } from "@/types";
import type { CategoryRow } from "@/features/Business/StoreLayout/StoreLayout";

function generateId(): string {
  return `sl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Ensure the floor-plan tables exist. The per-cooperative schema created in
// coopDb.ts already contains these; this is a belt-and-braces guard for any
// coop file opened before initCoopDb ran.
// Runs once per session — subsequent getReadyDb calls skip the DDL.
let schemaHealed = false;

async function ensureStoreLayoutTables(db: Awaited<ReturnType<typeof getDb>>) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS store_layouts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      grid_width INTEGER DEFAULT 20,
      grid_height INTEGER DEFAULT 15,
      cell_size REAL DEFAULT 1.0,
      canvas_data TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS layout_zones (
      id TEXT PRIMARY KEY,
      layout_id TEXT NOT NULL,
      name TEXT NOT NULL,
      zone_type TEXT DEFAULT 'shelf',
      x REAL NOT NULL,
      y REAL NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      rows INTEGER DEFAULT 4,
      cols INTEGER DEFAULT 3,
      color TEXT DEFAULT '#4CAF50',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (layout_id) REFERENCES store_layouts(id) ON DELETE CASCADE
    );
  `);
}

export function useStoreLayout() {
  const { t } = useTranslation();
  const toast = useToast();

  const [layouts, setLayouts] = useState<StoreLayout[]>([]);
  const [activeLayout, setActiveLayout] = useState<StoreLayout | null>(null);
  const [zones, setZones] = useState<LayoutZone[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Get the shared DB connection and heal any schema drift on first access only.
  const getReadyDb = useCallback(async () => {
    const db = await getDb();
    if (!schemaHealed) {
      await ensureStoreLayoutTables(db);
      schemaHealed = true;
    }
    return db;
  }, []);

  const loadLayouts = useCallback(async () => {
    try {
      const db = await getReadyDb();
      const res = await db.select<StoreLayout[]>("SELECT * FROM store_layouts ORDER BY created_at DESC");
      setLayouts(res);
    } catch (e) {
      console.error("Failed to load store layouts:", e);
    }
  }, [getReadyDb]);

  const loadZones = useCallback(
    async (layoutId: string) => {
      try {
        const db = await getReadyDb();
        const res = await db.select<LayoutZone[]>(
          "SELECT * FROM layout_zones WHERE layout_id = ? ORDER BY created_at ASC",
          [layoutId],
        );
        setZones(res);
        return res;
      } catch (e) {
        console.error("Failed to load layout zones:", e);
        return [];
      }
    },
    [getReadyDb],
  );

  const loadCategories = useCallback(async () => {
    try {
      const db = await getReadyDb();
      const res = await db.select<CategoryRow[]>("SELECT * FROM categories WHERE id LIKE 'unit_%' ORDER BY name ASC");
      setCategories(res);
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  }, [getReadyDb]);

  const loadInventory = useCallback(async () => {
    try {
      const db = await getReadyDb();
      const res = await db.select<InventoryItem[]>("SELECT * FROM inventory_items ORDER BY name ASC");
      setInventoryItems(res);
    } catch (e) {
      console.error("Failed to load inventory:", e);
    }
  }, [getReadyDb]);

  const createLayout = useCallback(
    async (name: string, gridWidth: number, gridHeight: number, cellSize: number) => {
      try {
        const db = await getReadyDb();
        const id = generateId();
        await db.execute(
          `INSERT INTO store_layouts (id, name, grid_width, grid_height, cell_size)
           VALUES (?, ?, ?, ?, ?)`,
          [id, name, gridWidth, gridHeight, cellSize],
        );
        await loadLayouts();
        toast.success(t("storeLayout.toast.layoutCreated"));
        return id;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("Failed to create layout:", msg);
        toast.error(`${t("storeLayout.toast.layoutCreateFailed")}: ${msg}`);
        return null;
      }
    },
    [loadLayouts, t, toast, getReadyDb],
  );

  const deleteLayout = useCallback(
    async (id: string) => {
      try {
        const db = await getReadyDb();

        // Unlink inventory items from this layout's zones (FK ON DELETE SET NULL
        // would handle this on cascade, but pragma foreign_keys may be off for
        // legacy connections — explicit unlink is safer).
        await db.execute(
          `UPDATE inventory_items SET zone_id = NULL, shelf_row = NULL, shelf_col = NULL
           WHERE zone_id IN (SELECT id FROM layout_zones WHERE layout_id = ?)`,
          [id],
        );

        // Delete zones explicitly (cascade may not work if FK pragma is off)
        await db.execute("DELETE FROM layout_zones WHERE layout_id = ?", [id]);

        // Delete the layout itself
        await db.execute("DELETE FROM store_layouts WHERE id = ?", [id]);

        await loadLayouts();
        setActiveLayout(null);
        setZones([]);
        toast.success(t("storeLayout.toast.layoutDeleted"));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("Failed to delete layout:", msg);
        toast.error(`${t("storeLayout.toast.layoutDeleteFailed")}: ${msg}`);
      }
    },
    [loadLayouts, t, toast, getReadyDb],
  );

  const selectLayout = useCallback(
    async (layout: StoreLayout) => {
      setActiveLayout(layout);
      await loadZones(layout.id);
    },
    [loadZones],
  );

  const saveZones = useCallback(
    async (layoutId: string, zoneList: LayoutZone[]): Promise<LayoutZone[] | null> => {
      try {
        const db = await getReadyDb();

        // 1. Existing zone ids in DB for this layout
        const rows = await db.select<Array<{ id: string }>>("SELECT id FROM layout_zones WHERE layout_id = ?", [
          layoutId,
        ]);
        const existingIds = new Set(rows.map((r) => r.id));
        const keptIds = new Set(zoneList.map((z) => z.id));

        // 2. Delete zones no longer present in the editor.
        //    inventory_items referencing these zones get zone_id set to NULL via FK ON DELETE SET NULL.
        for (const id of existingIds) {
          if (!keptIds.has(id)) {
            await db.execute("DELETE FROM layout_zones WHERE id = ?", [id]);
          }
        }

        // 3. UPSERT remaining zones — preserve IDs so inventory shelf assignments stay intact.
        //    New zones created in the canvas carry a temporary `lz-new-*` id that becomes their
        //    permanent row id once persisted here.
        for (const z of zoneList) {
          await db.execute(
            `INSERT INTO layout_zones (id, layout_id, name, zone_type, x, y, width, height, rows, cols, color)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               name=excluded.name,
               zone_type=excluded.zone_type,
               x=excluded.x, y=excluded.y,
               width=excluded.width, height=excluded.height,
               rows=excluded.rows, cols=excluded.cols,
               color=excluded.color`,
            [z.id, layoutId, z.name, z.zone_type, z.x, z.y, z.width, z.height, z.rows, z.cols, z.color],
          );
        }

        return await loadZones(layoutId);
      } catch (e) {
        console.error("Failed to save zones:", e);
        toast.error(t("storeLayout.toast.zonesSaveFailed"));
        return null;
      }
    },
    [loadZones, t, toast, getReadyDb],
  );

  const updateZone = useCallback(
    async (zone: LayoutZone) => {
      try {
        const db = await getReadyDb();
        await db.execute(
          `UPDATE layout_zones SET name=?, zone_type=?, x=?, y=?, width=?, height=?, rows=?, cols=?, color=?
           WHERE id=?`,
          [
            zone.name,
            zone.zone_type,
            zone.x,
            zone.y,
            zone.width,
            zone.height,
            zone.rows,
            zone.cols,
            zone.color,
            zone.id,
          ],
        );
      } catch (e) {
        console.error("Failed to update zone:", e);
      }
    },
    [getReadyDb],
  );

  const assignItemToShelf = useCallback(
    async (itemId: string, zoneId: string | null, row: number | null, col: number | null) => {
      try {
        const db = await getReadyDb();
        await db.execute(`UPDATE inventory_items SET zone_id = ?, shelf_row = ?, shelf_col = ? WHERE id = ?`, [
          zoneId,
          row,
          col,
          itemId,
        ]);
        // Patch the item in the local state directly — avoids a full SELECT *
        // roundtrip and prevents every shelf stock indicator from re-computing.
        setInventoryItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, zone_id: zoneId, shelf_row: row, shelf_col: col } : i)),
        );
      } catch (e) {
        console.error("Failed to assign item to shelf:", e);
      }
    },
    [getReadyDb],
  );

  const getItemAtShelf = useCallback(
    async (zoneId: string, row: number, col: number) => {
      try {
        const db = await getReadyDb();
        const res = await db.select<InventoryItem[]>(
          `SELECT * FROM inventory_items WHERE zone_id = ? AND shelf_row = ? AND shelf_col = ?`,
          [zoneId, row, col],
        );
        return res.length > 0 ? res[0] : null;
      } catch {
        return null;
      }
    },
    [getReadyDb],
  );

  return {
    layouts,
    activeLayout,
    zones,
    categories,
    inventoryItems,
    loadLayouts,
    loadZones,
    loadCategories,
    loadInventory,
    createLayout,
    deleteLayout,
    selectLayout,
    saveZones,
    updateZone,
    assignItemToShelf,
    getItemAtShelf,
    setActiveLayout,
  };
}
