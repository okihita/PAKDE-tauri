import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getDb } from "@/db";
import type { Member } from "@/types";
import { useToast } from "@/hooks/useToast";

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
  status: "aktif",
  savings_pokok: 0,
  savings_wajib: 0,
  savings_sukarela: 0,
  loan_total: 0,
  loan_outstanding: 0,
  loan_status: "lancar",
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

  const loadMembersData = useCallback(async () => {
    try {
      const db = await getDb();
      const res = await db.select<Member[]>("SELECT * FROM members ORDER BY name ASC");
      setMembersList(res);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const openAddMemberModal = () => {
    setMemberFormType("add");
    setMemberFormValues(MEMBER_DEFAULT);
    setShowMemberModal(true);
  };

  const openEditMemberModal = (member: Member) => {
    setMemberFormType("edit");
    setCurrentMemberId(member.id ?? "");
    setMemberFormValues({ ...member });
    setShowMemberModal(true);
  };

  const handleMemberFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (memberFormValues.nik.length !== 16) {
      toast.error(t("toast.nikInvalid"));
      return;
    }
    if (!memberFormValues.name.trim()) {
      toast.error(t("toast.nameRequired"));
      return;
    }
    try {
      const db = await getDb();
      const fv = memberFormValues;
      if (memberFormType === "add") {
        const newId = `mbr-${Date.now()}`;
        await db.execute(
          `INSERT INTO members (id, nik, name, place_of_birth, date_of_birth, gender,
          occupation, education, rt, rw, hamlet, status, savings_pokok, savings_wajib,
          savings_sukarela, loan_total, loan_outstanding, loan_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId,
            fv.nik,
            fv.name,
            fv.place_of_birth,
            fv.date_of_birth,
            fv.gender,
            fv.occupation,
            fv.education,
            fv.rt,
            fv.rw,
            fv.hamlet,
            fv.status,
            Number(fv.savings_pokok),
            Number(fv.savings_wajib),
            Number(fv.savings_sukarela),
            Number(fv.loan_total),
            Number(fv.loan_outstanding),
            fv.loan_status,
          ],
        );
      } else {
        await db.execute(
          `UPDATE members SET nik=?, name=?, place_of_birth=?, date_of_birth=?, gender=?,
            occupation=?, education=?, rt=?, rw=?, hamlet=?, status=?,
            savings_pokok=?, savings_wajib=?, savings_sukarela=?,
            loan_total=?, loan_outstanding=?, loan_status=?, updated_at=datetime('now')
           WHERE id=?`,
          [
            fv.nik,
            fv.name,
            fv.place_of_birth,
            fv.date_of_birth,
            fv.gender,
            fv.occupation,
            fv.education,
            fv.rt,
            fv.rw,
            fv.hamlet,
            fv.status,
            Number(fv.savings_pokok),
            Number(fv.savings_wajib),
            Number(fv.savings_sukarela),
            Number(fv.loan_total),
            Number(fv.loan_outstanding),
            fv.loan_status,
            currentMemberId,
          ],
        );
      }
      setShowMemberModal(false);
      loadMembersData();
      onChange?.();
    } catch (err) {
      toast.error(t("toast.memberSaveFailed", { error: err instanceof Error ? err.message : String(err) }));
    }
  };

  const handleDeleteMember = async (member: Member) => {
    if (member.loan_outstanding > 0) {
      toast.error(t("toast.memberDeleteBlocked"));
      return;
    }
    const yes = await toast.confirm(t("toast.memberDeleteConfirm", { name: member.name }));
    if (!yes) return;
    try {
      const db = await getDb();
      await db.execute("DELETE FROM members WHERE id = ?", [member.id]);
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
    loadMembersData,
    openAddMemberModal,
    openEditMemberModal,
    handleMemberFormSubmit,
    handleDeleteMember,
  };
}
