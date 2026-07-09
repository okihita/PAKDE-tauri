import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getDb } from "@/db";
import { useToast } from "@/hooks/useToast";
import type { EquipmentItem, EquipmentCondition } from "@/types";

export function useEquipment() {
  const { t } = useTranslation();
  const toast = useToast();
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);

  const loadEquipment = useCallback(async () => {
    try {
      const db = await getDb();
      const res = await db.select<EquipmentItem[]>("SELECT * FROM equipment ORDER BY name ASC");
      setEquipmentList(res);
    } catch (e) {
      console.error("Failed to load equipment:", e);
    }
  }, []);

  const createEquipment = async (
    name: string,
    quantity: number,
    condition: EquipmentCondition,
    lastMaintenance: string,
    value: number,
  ): Promise<boolean> => {
    if (!name.trim()) {
      toast.error(t("equipment.toast.nameRequired"));
      return false;
    }
    try {
      const db = await getDb();
      const id = `eq-${Date.now()}`;
      await db.execute(
        "INSERT INTO equipment (id, name, quantity, condition, last_maintenance, value) VALUES (?, ?, ?, ?, ?, ?)",
        [id, name.trim(), quantity, condition, lastMaintenance, value],
      );
      toast.success(t("equipment.toast.itemCreated"));
      await loadEquipment();
      return true;
    } catch (e) {
      console.error(e);
      toast.error(t("equipment.toast.saveFailed"));
      return false;
    }
  };

  const updateEquipment = async (
    id: string,
    name: string,
    quantity: number,
    condition: EquipmentCondition,
    lastMaintenance: string,
    value: number,
  ): Promise<boolean> => {
    if (!name.trim()) {
      toast.error(t("equipment.toast.nameRequired"));
      return false;
    }
    try {
      const db = await getDb();
      await db.execute(
        `UPDATE equipment
         SET name = ?, quantity = ?, condition = ?, last_maintenance = ?, value = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [name.trim(), quantity, condition, lastMaintenance, value, id],
      );
      toast.success(t("equipment.toast.itemUpdated"));
      await loadEquipment();
      return true;
    } catch (e) {
      console.error(e);
      toast.error(t("equipment.toast.saveFailed"));
      return false;
    }
  };

  const recordMaintenance = async (id: string): Promise<boolean> => {
    try {
      const db = await getDb();
      const today = new Date().toISOString().slice(0, 10);
      await db.execute(
        `UPDATE equipment
         SET last_maintenance = ?, condition = 'Baik', updated_at = datetime('now')
         WHERE id = ?`,
        [today, id],
      );
      toast.success(t("equipment.toast.maintenanceDone"));
      await loadEquipment();
      return true;
    } catch (e) {
      console.error(e);
      toast.error(t("equipment.toast.saveFailed"));
      return false;
    }
  };

  const deleteEquipment = async (id: string): Promise<boolean> => {
    const confirmDelete = await toast.confirm(t("equipment.toast.deleteConfirm"));
    if (!confirmDelete) return false;
    try {
      const db = await getDb();
      await db.execute("DELETE FROM equipment WHERE id = ?", [id]);
      toast.success(t("equipment.toast.itemDeleted"));
      await loadEquipment();
      return true;
    } catch (e) {
      console.error(e);
      toast.error(t("equipment.toast.saveFailed"));
      return false;
    }
  };

  return {
    equipmentList,
    loadEquipment,
    createEquipment,
    updateEquipment,
    recordMaintenance,
    deleteEquipment,
  };
}
