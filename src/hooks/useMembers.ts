import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { createRepository, newId } from "@/db";
import { getActiveCoopId } from "@/db/active-coop";
import { awardXp, removeMemberXp } from "@/data/xp";
import { isValidNik } from "@/data/nik";
import type { Member, Simpanan } from "@/types";
import { useToast } from "@/hooks/useToast";

// `members` has no `created_at` column (it uses `registered_at`), so the
// repository must not auto-stamp one — otherwise INSERT fails with
// "no such column: created_at".
const membersRepo = createRepository<Member>("members", { createdAt: false });
const simpananRepo = createRepository<Simpanan>("simpanan_anggota");

const today = () => new Date().toISOString().slice(0, 10);

const MEMBER_DEFAULT: Member = {
  nik: "",
  name: "",
  place_of_birth: "",
  date_of_birth: "",
  gender: "L",
  occupation: "",
  education: "",
  rt: "",
  rw: "",
  hamlet: "",
  kode_wilayah: "",
  status_keanggotaan: "anggota_biasa",
  status: "aktif",
  savings_pokok: 0,
  savings_wajib: 0,
  savings_sukarela: 0,
  loan_total: 0,
  loan_outstanding: 0,
  loan_status: "lancar",
  registered_at: today(),
};

export interface MemberInsights {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  totalSimpanan: number;
  totalPiutang: number;
  simpananPending: number;
  newThisMonth: number;
}

const EMPTY_INSIGHTS: MemberInsights = {
  totalMembers: 0,
  activeMembers: 0,
  inactiveMembers: 0,
  totalSimpanan: 0,
  totalPiutang: 0,
  simpananPending: 0,
  newThisMonth: 0,
};

export function useMembers(onChange?: () => void) {
  const { t } = useTranslation();
  const toast = useToast();

  const [membersList, setMembersList] = useState<Member[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState(() => {
    const saved = localStorage.getItem("pakde-member-search-filter");
    if (saved) {
      localStorage.removeItem("pakde-member-search-filter");
      return saved;
    }
    return "";
  });
  const [memberFilterStatus, setMemberFilterStatus] = useState("semua");
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberFormType, setMemberFormType] = useState<"add" | "edit">("add");
  const [currentMemberId, setCurrentMemberId] = useState("");
  const [memberFormValues, setMemberFormValues] = useState<Member>(MEMBER_DEFAULT);
  const [simpananRows, setSimpananRows] = useState<Simpanan[]>([]);
  const [insights, setInsights] = useState<MemberInsights>(EMPTY_INSIGHTS);
  // Incremented on a duplicate-NIK submit so the form can re-roll its auto-gen seq.
  const [nikConflictNonce, setNikConflictNonce] = useState(0);

  const loadInsights = useCallback(async (list: Member[]) => {
    const totalSimpanan = list.reduce(
      (s, m) => s + (m.savings_pokok || 0) + (m.savings_wajib || 0) + (m.savings_sukarela || 0),
      0,
    );
    const totalPiutang = list.reduce((s, m) => s + (m.loan_outstanding || 0), 0);
    const activeMembers = list.filter((m) => m.status === "aktif").length;
    const ym = new Date().toISOString().slice(0, 7); // YYYY-MM
    const newThisMonth = list.filter((m) => (m.registered_at || "").slice(0, 7) === ym).length;
    let simpananPending: number;
    try {
      const pending = await simpananRepo.select<Array<{ c: number }>>(
        "SELECT COUNT(*) as c FROM simpanan_anggota WHERE status != 'lunas'",
      );
      simpananPending = pending[0]?.c ?? 0;
    } catch {
      simpananPending = 0;
    }
    setInsights({
      totalMembers: list.length,
      activeMembers,
      inactiveMembers: list.length - activeMembers,
      totalSimpanan,
      totalPiutang,
      simpananPending,
      newThisMonth,
    });
  }, []);

  const loadMembersData = useCallback(async () => {
    try {
      const res = await membersRepo.list("ORDER BY name ASC");
      setMembersList(res);
      await loadInsights(res);
    } catch (e) {
      console.error(e);
    }
  }, [loadInsights]);

  const openAddMemberModal = () => {
    setMemberFormType("add");
    setMemberFormValues(MEMBER_DEFAULT);
    setSimpananRows([]);
    setShowMemberModal(true);
  };

  const loadSimpananForMember = useCallback(async (memberId: string) => {
    try {
      const rows = await simpananRepo.list(`WHERE anggota_ref = '${memberId}' ORDER BY periode_pembayaran ASC`);
      setSimpananRows(rows);
    } catch {
      setSimpananRows([]);
    }
  }, []);

  const openEditMemberModal = (member: Member) => {
    setMemberFormType("edit");
    setCurrentMemberId(member.id ?? "");
    setMemberFormValues({ ...member });
    if (member.id) void loadSimpananForMember(member.id);
    setShowMemberModal(true);
  };

  const addSimpananRow = () => {
    setSimpananRows((rows) => [
      ...rows,
      {
        anggota_ref: currentMemberId,
        jenis_simpanan: "wajib",
        periode_pembayaran: new Date().toISOString().slice(0, 7),
        jumlah_simpanan: 0,
        status: "lunas",
        dibayar_pada: today(),
      },
    ]);
  };

  const updateSimpananRow = (idx: number, patch: Partial<Simpanan>) => {
    setSimpananRows((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const removeSimpananRow = (idx: number) => {
    setSimpananRows((rows) => rows.filter((_, i) => i !== idx));
  };

  const rollupSavings = (rows: Simpanan[]) => ({
    savings_pokok: rows.filter((r) => r.jenis_simpanan === "pokok").reduce((s, r) => s + (r.jumlah_simpanan || 0), 0),
    savings_wajib: rows.filter((r) => r.jenis_simpanan === "wajib").reduce((s, r) => s + (r.jumlah_simpanan || 0), 0),
    savings_sukarela: rows
      .filter((r) => r.jenis_simpanan === "sukarela")
      .reduce((s, r) => s + (r.jumlah_simpanan || 0), 0),
  });

  const handleMemberFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // New members must have a structurally valid NIK. Existing members keep the
    // lighter 16-digit check so a legacy/imported NIK doesn't block unrelated edits.
    const nikOk = memberFormType === "add" ? isValidNik(memberFormValues.nik) : memberFormValues.nik.length === 16;
    if (!nikOk) {
      toast.error(t("toast.nikInvalid"));
      return;
    }
    if (!memberFormValues.name.trim()) {
      toast.error(t("toast.nameRequired"));
      return;
    }
    // A member's location is a real village code; the region picker must resolve
    // to a village. Guards against a stale/blank code when the picker is left
    // mid-selection (only province/regency chosen).
    if (!memberFormValues.kode_wilayah?.trim()) {
      toast.error(t("toast.regionRequired"));
      return;
    }
    try {
      const fv = memberFormValues;
      const id = memberFormType === "add" ? newId("mbr") : currentMemberId;
      const rollup = rollupSavings(simpananRows);
      const columns = {
        nik: fv.nik,
        name: fv.name,
        place_of_birth: fv.place_of_birth,
        date_of_birth: fv.date_of_birth,
        gender: fv.gender,
        occupation: fv.occupation,
        education: fv.education,
        rt: fv.rt,
        rw: fv.rw,
        hamlet: fv.hamlet,
        kode_wilayah: fv.kode_wilayah,
        status_keanggotaan: fv.status_keanggotaan,
        status: fv.status,
        savings_pokok: rollup.savings_pokok,
        savings_wajib: rollup.savings_wajib,
        savings_sukarela: rollup.savings_sukarela,
        loan_total: Number(fv.loan_total),
        loan_outstanding: Number(fv.loan_outstanding),
        loan_status: fv.loan_status,
        registered_at: fv.registered_at || today(),
      };

      if (memberFormType === "add") {
        await membersRepo.insert(id, columns);
        // Award XP via the event ledger; keeps `cooperatives.xp` in sync.
        // A guard rejection (e.g. verification/cap, R4) must NOT roll
        // back the member insert — surface it as its own toast.
        try {
          await awardXp(getActiveCoopId(), "member_joined", { memberId: id });
        } catch (e) {
          // A guard rejection (xp.verificationRequired / xp.dailyCapReached)
          // is a key and resolves via t(); any other (SQL) error is not,
          // so log it and show the generic message instead of leaking raw SQL.
          console.error("awardXp failed:", e);
          const msg = e instanceof Error && e.message.startsWith("xp.") ? e.message : "xp.awardFailed";
          toast.error(t(msg));
        }
      } else {
        await membersRepo.update(currentMemberId, columns);
        // Replace this member's ledger rows with the edited set.
        await simpananRepo.execute("DELETE FROM simpanan_anggota WHERE anggota_ref = ?", [currentMemberId]);
      }

      for (const row of simpananRows) {
        if (!row.jumlah_simpanan) continue;
        await simpananRepo.insert(newId("svn"), {
          anggota_ref: id,
          jenis_simpanan: row.jenis_simpanan,
          periode_pembayaran: row.periode_pembayaran,
          jumlah_simpanan: Number(row.jumlah_simpanan),
          status: row.status,
          dibayar_pada: row.dibayar_pada,
        });
      }

      setShowMemberModal(false);
      loadMembersData();
      onChange?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // SQLite UNIQUE violation on members.nik → friendly duplicate message.
      if (/unique/i.test(msg) && /nik/i.test(msg)) {
        // Bump the nonce so the form can re-roll its auto-generated NIK sequence.
        setNikConflictNonce((n) => n + 1);
        toast.error(t("toast.nikDuplicate"));
      } else {
        toast.error(t("toast.memberSaveFailed", { error: msg }));
      }
    }
  };

  const deleteMember = async (member: Member) => {
    if (member.loan_outstanding > 0) {
      toast.error(t("toast.memberDeleteBlocked"));
      return;
    }
    try {
      await simpananRepo.execute("DELETE FROM simpanan_anggota WHERE anggota_ref = ?", [member.id ?? ""]);
      await membersRepo.remove(member.id ?? "");
      // Revert XP via a negative ledger event (R3); failure here
      // must not mask a successful member deletion.
      try {
        await removeMemberXp(getActiveCoopId(), member.id ?? "");
      } catch (e) {
        console.error(e);
        toast.error(t("xp.revertFailed"));
      }
      loadMembersData();
      onChange?.();
    } catch (err) {
      toast.error(t("toast.memberDeleteFailed", { error: String(err) }));
    }
  };

  const filteredMembers = membersList.filter((mbr) => {
    const matchesSearch =
      mbr.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) || mbr.nik.includes(memberSearchQuery);
    const matchesFilter = memberFilterStatus === "semua" || mbr.status === memberFilterStatus;
    return matchesSearch && matchesFilter;
  });

  return {
    membersList,
    filteredMembers,
    memberSearchQuery,
    setMemberSearchQuery,
    memberFilterStatus,
    setMemberFilterStatus,
    showMemberModal,
    setShowMemberModal,
    memberFormType,
    memberFormValues,
    setMemberFormValues,
    nikConflictNonce,
    simpananRows,
    addSimpananRow,
    updateSimpananRow,
    removeSimpananRow,
    insights,
    loadMembersData,
    openAddMemberModal,
    openEditMemberModal,
    handleMemberFormSubmit,
    deleteMember,
  };
}
