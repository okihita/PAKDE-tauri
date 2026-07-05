import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getDb } from "@/db";
import { useToast } from "@/hooks/useToast";

export interface BusinessCategory {
  id: string;
  name: string;
  icon: string;
}

export interface UnitRevenueRow {
  category_id: string;
  total_revenue: number;
}

export function useUnits() {
  const { t } = useTranslation();
  const toast = useToast();

  const [activeUnitIds, setActiveUnitIds] = useState<string[]>([]);
  const [categoriesList, setCategoriesList] = useState<BusinessCategory[]>([]);
  const [revenues, setRevenues] = useState<Record<string, number>>({});

  // Load all necessary units data
  const loadUnitsData = useCallback(async () => {
    try {
      const db = await getDb();

      // 1. Get active cooperative profile business units array
      const coopRes = await db.select<Array<{ business_units: string }>>(
        "SELECT business_units FROM cooperatives WHERE id = 'kdp-001' LIMIT 1",
      );
      let activeIds: string[] = [];
      if (coopRes.length > 0 && coopRes[0].business_units) {
        try {
          activeIds = JSON.parse(coopRes[0].business_units);
        } catch {
          activeIds = [];
        }
      }
      setActiveUnitIds(activeIds);

      // 2. Get all categories representing potential/active units
      const catRes = await db.select<BusinessCategory[]>(
        "SELECT id, name, icon FROM categories WHERE id LIKE 'unit_%' ORDER BY name ASC",
      );
      setCategoriesList(catRes);

      // 3. Aggregate real transaction revenues per category
      const revRes = await db.select<UnitRevenueRow[]>(
        `SELECT je.category as category_id, SUM(jl.credit) as total_revenue
         FROM journal_lines jl
         INNER JOIN journal_entries je ON jl.journal_entry_id = je.id
         INNER JOIN coa_accounts ca ON jl.account_code = ca.code
         WHERE ca.type = 'pendapatan'
         GROUP BY je.category`,
      );

      const revMap: Record<string, number> = {};
      for (const r of revRes) {
        if (r.category_id) {
          revMap[r.category_id] = r.total_revenue || 0;
        }
      }
      setRevenues(revMap);
    } catch (e) {
      console.error("Failed to load units data:", e);
    }
  }, []);

  // Toggle activation status
  const toggleUnitStatus = async (unitId: string, currentActive: boolean) => {
    try {
      const db = await getDb();
      let nextActiveIds: string[] = [];

      if (currentActive) {
        // Deactivate: remove from array
        nextActiveIds = activeUnitIds.filter((id) => id !== unitId);
      } else {
        // Activate: add to array
        nextActiveIds = [...activeUnitIds, unitId];
      }

      await db.execute(
        "UPDATE cooperatives SET business_units = ?, updated_at = datetime('now') WHERE id = 'kdp-001'",
        [JSON.stringify(nextActiveIds)],
      );

      toast.success(t("units.toast.statusChangeSuccess"));
      await loadUnitsData();
    } catch (err) {
      console.error(err);
      toast.error(
        t("units.toast.statusChangeFailed", {
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    }
  };

  // Register a custom new unit category
  const createBusinessUnit = async (name: string, icon: string) => {
    if (!name.trim() || !icon.trim()) {
      toast.error(t("units.toast.fieldsRequired"));
      return false;
    }

    try {
      const db = await getDb();
      const newUnitId = `unit_${Date.now()}`;

      // Insert category
      await db.execute("INSERT INTO categories (id, cooperative_id, name, icon) VALUES (?, 'kdp-001', ?, ?)", [
        newUnitId,
        name.trim(),
        icon.trim(),
      ]);

      // Append to active business units
      const nextActiveIds = [...activeUnitIds, newUnitId];
      await db.execute(
        "UPDATE cooperatives SET business_units = ?, updated_at = datetime('now') WHERE id = 'kdp-001'",
        [JSON.stringify(nextActiveIds)],
      );

      toast.success(t("units.toast.createSuccess", { name }));
      await loadUnitsData();
      return true;
    } catch (err) {
      console.error(err);
      toast.error(
        t("units.toast.createFailed", {
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      return false;
    }
  };

  return {
    activeUnitIds,
    categoriesList,
    revenues,
    loadUnitsData,
    toggleUnitStatus,
    createBusinessUnit,
  };
}
