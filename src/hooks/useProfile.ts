import { useState, useCallback } from "react";
import { getDb } from "@/db";
import type { CooperativeProfile, EwsAlert } from "@/types";

const DEFAULT_PROFILE: CooperativeProfile = {
  name: "Koperasi Maju Bersama",
  legal_id: "AHU-098872.AH.01.26.2026",
  address: "Jl. Raya Domas No. 12",
  village: "Domas",
  district: "Trowulan",
  regency: "Mojokerto",
  province: "Jawa Timur",
  postal_code: "61362",
  phone: "081234567890",
  email: "majubersama@domas.desa.id",
  business_units: '["unit_simpan_pinjam", "unit_toko_desa"]',
  officers:
    '{"chairman": "H. Slamet Riyadi", "secretary": "Anang Hermansyah", "treasurer": "Siti Aminah", "supervisor": "Bambang Soesatyo"}',
  health_score: 94,
  rag_status: "green",
};

export function useProfile() {
  const [coopProfile, setCoopProfile] = useState<CooperativeProfile>(DEFAULT_PROFILE);
  const [ewsAlertsList, setEwsAlertsList] = useState<EwsAlert[]>([]);
  const [dashboardIncomeData] = useState([
    { month: "Feb", income: 72000000, expense: 58000000 },
    { month: "Mar", income: 75000000, expense: 61000000 },
    { month: "Apr", income: 81000000, expense: 59000000 },
    { month: "May", income: 78000000, expense: 64000000 },
    { month: "Jun", income: 85000000, expense: 62000000 },
    { month: "Jul", income: 89000000, expense: 60000000 },
  ]);

  const loadProfileData = useCallback(async () => {
    try {
      const db = await getDb();
      const res = await db.select<CooperativeProfile[]>("SELECT * FROM cooperatives LIMIT 1");
      if (res.length > 0) setCoopProfile(res[0]);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadDashboardStats = useCallback(async () => {
    try {
      const db = await getDb();
      const alerts = await db.select<EwsAlert[]>("SELECT * FROM ews_alerts ORDER BY triggered_at DESC LIMIT 5");
      setEwsAlertsList(alerts);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleProfileFieldChange = (key: string, value: string) => {
    setCoopProfile((prev) => ({ ...prev, [key]: value }));
  };

  return {
    coopProfile,
    setCoopProfile,
    ewsAlertsList,
    dashboardIncomeData,
    loadProfileData,
    loadDashboardStats,
    handleProfileFieldChange,
  };
}
