import { useState, useEffect } from "react";
import { initDb, getDb } from "./db";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Interface Definitions
interface Member {
  id: string;
  nik: string;
  name: string;
  place_of_birth: string;
  date_of_birth: string;
  gender: "L" | "P";
  occupation: string;
  education: string;
  rt: string;
  rw: string;
  hamlet: string;
  status: "aktif" | "nonaktif";
  savings_pokok: number;
  savings_wajib: number;
  savings_sukarela: number;
  loan_total: number;
  loan_outstanding: number;
  loan_status: string;
}

interface CoaAccount {
  code: string;
  name: string;
  type: "aset" | "kewajiban" | "ekuitas" | "pendapatan" | "beban";
  normal_balance: "debit" | "kredit";
  balance: number;
}

interface JournalLineInput {
  accountCode: string;
  debit: number;
  credit: number;
}

interface JournalEntryWithLines {
  id: string;
  number: string;
  date: string;
  description: string;
  reference: string;
  category: string;
  tags: string;
  lines: Array<{
    account_code: string;
    name: string;
    debit: number;
    credit: number;
  }>;
}

export default function App() {
  // Navigation & Core States
  const [appState, setAppState] = useState<"splash" | "setup" | "login" | "main" | "db_error">("splash");
  const [dbErrorMessage, setDbErrorMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);

  // PIN Auth States
  const [pinInput, setPinInput] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [setupConfirmPin, setSetupConfirmPin] = useState("");
  const [setupQuestion, setSetupQuestion] = useState("Apa nama hewan peliharaan pertama Anda?");
  const [setupAnswer, setSetupAnswer] = useState("");
  const [loginLockedUntil, setLoginLockedUntil] = useState<number | null>(null);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);
  const [showRecoveryFlow, setShowRecoveryFlow] = useState(false);
  const [recoveryAnswerInput, setRecoveryAnswerInput] = useState("");
  const [recoveryQuestionText, setRecoveryQuestionText] = useState("");
  const [pinErrorText, setPinErrorText] = useState("");

  // Dashboard Data States
  const [activeTab, setActiveTab] = useState<"home" | "members" | "accounting" | "feasibility" | "sync" | "settings">("home");
  const [coopProfile, setCoopProfile] = useState<any>({
    name: "Koperasi Maju Bersama",
    legal_id: "",
    address: "",
    village: "",
    district: "",
    regency: "Mojokerto",
    province: "Jawa Timur",
    postal_code: "",
    phone: "",
    email: "",
    business_units: '["unit_apotek", "unit_pupuk"]',
    officers: '{"chairman": "", "secretary": "", "treasurer": "", "supervisor": ""}',
    health_score: 100,
    rag_status: "green",
  });
  const [ewsAlertsList, setEwsAlertsList] = useState<any[]>([]);
  const [dashboardIncomeData, setDashboardIncomeData] = useState<any[]>([]);

  // Member CRUD States
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberFilterStatus, setMemberFilterStatus] = useState("semua");
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberFormType, setMemberFormType] = useState<"add" | "edit">("add");
  const [currentMemberId, setCurrentMemberId] = useState("");
  const [memberFormValues, setMemberFormValues] = useState<any>({
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
  });

  // Accounting States
  const [accountingTab, setAccountingTab] = useState<"coa" | "journal" | "ledger" | "neraca" | "labarugi">("coa");
  const [coaAccounts, setCoaAccounts] = useState<CoaAccount[]>([]);
  const [showCoaModal, setShowCoaModal] = useState(false);
  const [newCoaValues, setNewCoaValues] = useState({
    code: "",
    name: "",
    type: "aset" as const,
    normal_balance: "debit" as const,
    balance: 0,
  });
  const [journalEntries, setJournalEntries] = useState<JournalEntryWithLines[]>([]);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalForm, setJournalForm] = useState({
    date: new Date().toISOString().split("T")[0],
    number: "",
    description: "",
    reference: "",
    category: "operasional",
    tags: "",
    lines: [
      { accountCode: "1.1.01", debit: 0, credit: 0 },
      { accountCode: "4.01", debit: 0, credit: 0 },
    ] as JournalLineInput[],
  });
  const [ledgerSelectedCode, setLedgerSelectedCode] = useState("1.1.01");
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerBalanceStart, setLedgerBalanceStart] = useState(0);
  const [ledgerBalanceEnd, setLedgerBalanceEnd] = useState(0);

  // Financial Feasibility Analysis States
  const [feasibilityActiveTab, setFeasibilityActiveTab] = useState<"calculator" | "sensitivity">("calculator");
  const [feasibilityParams, setFeasibilityParams] = useState({
    initialInvestment: 50000000,
    projectionYears: 5,
    cashFlows: "18000000,22000000,25000000,28000000,30000000",
    discountRate: 8.5,
    opportunityCost: 5.0,
  });
  const [feasibilityResults, setFeasibilityResults] = useState<any>(null);
  const [sensitivityScenario, setSensitivityScenario] = useState<"optimis" | "moderat" | "pesimis">("moderat");
  const [sensitivityPresetResults, setSensitivityPresetResults] = useState<any>(null);

  // Sync Center States
  const [syncHistoryList, setSyncHistoryList] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState("");
  const [syncServerUrl] = useState("koperasi.kab-mojokerto.go.id");

  // Settings & Core updates
  const [appTheme, setAppTheme] = useState<"dark" | "light">("dark");
  const [fontSizeSetting, setFontSizeSetting] = useState<"normal" | "large">("normal");
  const [updateStatusText, setUpdateStatusText] = useState("");
  const [isUpdateChecking, setIsUpdateChecking] = useState(false);

  // Database Initialization Hook
  useEffect(() => {
    async function loadDatabase() {
      try {
        await initDb();
        const db = await getDb();

        const users = await db.select<any[]>("SELECT * FROM local_users");
        if (users.length === 0) {
          setAppState("setup");
        } else {
          if (users[0].recovery_question) {
            setRecoveryQuestionText(users[0].recovery_question);
          }
          setAppState("login");
        }
      } catch (err: any) {
        console.error(err);
        setDbErrorMessage(err.message || String(err));
        setAppState("db_error");
      }
    }
    setTimeout(loadDatabase, 800);
  }, []);

  // Lockout Timer Hook
  useEffect(() => {
    let timer: any;
    if (loginLockedUntil) {
      const remaining = Math.ceil((loginLockedUntil - Date.now()) / 1000);
      if (remaining > 0) {
        setLockoutCountdown(remaining);
        timer = setInterval(() => {
          const rem = Math.ceil((loginLockedUntil - Date.now()) / 1000);
          if (rem <= 0) {
            setLoginLockedUntil(null);
            setLockoutCountdown(0);
            setPinErrorText("");
            clearInterval(timer);
          } else {
            setLockoutCountdown(rem);
          }
        }, 1000);
      } else {
        setLoginLockedUntil(null);
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loginLockedUntil]);

  // Load Main Panel States Hook
  useEffect(() => {
    if (appState === "main") {
      loadProfileData();
      loadDashboardStats();
      loadMembersData();
      loadAccountsData();
      loadJournalData();
      loadLedgerData();
      loadSyncHistoryData();
    }
  }, [appState]);

  // General Ledger Update Hook when selection changes
  useEffect(() => {
    if (appState === "main") {
      loadLedgerData();
    }
  }, [ledgerSelectedCode]);

  // Loaders
  async function loadProfileData() {
    try {
      const db = await getDb();
      const res = await db.select<any[]>("SELECT * FROM cooperatives LIMIT 1");
      if (res.length > 0) {
        setCoopProfile(res[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadDashboardStats() {
    try {
      const db = await getDb();
      const alerts = await db.select<any[]>("SELECT * FROM ews_alerts ORDER BY triggered_at DESC LIMIT 5");
      setEwsAlertsList(alerts);

      setDashboardIncomeData([
        { month: "Feb", income: 72000000, expense: 58000000 },
        { month: "Mar", income: 75000000, expense: 61000000 },
        { month: "Apr", income: 81000000, expense: 59000000 },
        { month: "May", income: 78000000, expense: 64000000 },
        { month: "Jun", income: 85000000, expense: 62000000 },
        { month: "Jul", income: 89000000, expense: 60000000 },
      ]);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadMembersData() {
    try {
      const db = await getDb();
      const res = await db.select<Member[]>("SELECT * FROM members ORDER BY name ASC");
      setMembersList(res);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadAccountsData() {
    try {
      const db = await getDb();
      const res = await db.select<CoaAccount[]>("SELECT * FROM coa_accounts ORDER BY code ASC");
      setCoaAccounts(res);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadJournalData() {
    try {
      const db = await getDb();
      const entries = await db.select<any[]>("SELECT * FROM journal_entries ORDER BY date DESC, number DESC");
      const mapped: JournalEntryWithLines[] = [];

      for (const entry of entries) {
        const lines = await db.select<any[]>(
          `SELECT jl.*, ca.name 
           FROM journal_lines jl
           LEFT JOIN coa_accounts ca ON jl.account_code = ca.code
           WHERE jl.journal_entry_id = ?`,
          [entry.id]
        );
        mapped.push({ ...entry, lines });
      }
      setJournalEntries(mapped);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadLedgerData() {
    try {
      const db = await getDb();
      const account = await db.select<any[]>("SELECT balance FROM coa_accounts WHERE code = ?", [ledgerSelectedCode]);
      const balanceEnd = account.length > 0 ? account[0].balance : 0;
      setLedgerBalanceEnd(balanceEnd);

      const lines = await db.select<any[]>(
        `SELECT jl.*, je.date, je.number, je.description as entry_desc
         FROM journal_lines jl
         INNER JOIN journal_entries je ON jl.journal_entry_id = je.id
         WHERE jl.account_code = ?
         ORDER BY je.date ASC, je.created_at ASC`,
        [ledgerSelectedCode]
      );

      let debSum = 0;
      let credSum = 0;
      for (const line of lines) {
        debSum += line.debit;
        credSum += line.credit;
      }
      
      const accInfo = await db.select<any[]>("SELECT normal_balance FROM coa_accounts WHERE code = ?", [ledgerSelectedCode]);
      const normalBal = accInfo.length > 0 ? accInfo[0].normal_balance : "debit";
      
      const netActivity = normalBal === "debit" ? (debSum - credSum) : (credSum - debSum);
      const balanceStart = balanceEnd - netActivity;
      setLedgerBalanceStart(balanceStart);

      let running = balanceStart;
      const computedLines = lines.map((line) => {
        const change = normalBal === "debit" ? (line.debit - line.credit) : (line.credit - line.debit);
        running += change;
        return { ...line, runningBalance: running };
      });

      setLedgerEntries(computedLines);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadSyncHistoryData() {
    try {
      const db = await getDb();
      const res = await db.select<any[]>("SELECT * FROM sync_history ORDER BY started_at DESC LIMIT 10");
      setSyncHistoryList(res);
    } catch (e) {
      console.error(e);
    }
  }

  // Auth Operations
  const handleSetupPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPin.length !== 6 || setupConfirmPin.length !== 6) {
      setPinErrorText("PIN harus 6 digit angka.");
      return;
    }
    if (setupPin !== setupConfirmPin) {
      setPinErrorText("Konfirmasi PIN tidak cocok.");
      return;
    }
    if (!setupAnswer.trim()) {
      setPinErrorText("Jawaban pemulihan harus diisi.");
      return;
    }

    try {
      const db = await getDb();
      const userId = "usr-001";
      await db.execute(
        `INSERT INTO local_users (id, cooperative_id, name, role, pin_hash, recovery_question, recovery_answer_hash)
         VALUES (?, 'kdp-001', 'Slamet Riyadi', 'admin', ?, ?, ?)`,
        [userId, setupPin, setupQuestion, setupAnswer.trim().toLowerCase()]
      );

      setCurrentUser({ id: userId, name: "Slamet Riyadi", role: "admin" });
      setAppState("main");
    } catch (err: any) {
      setPinErrorText(`Setup gagal: ${err.message || err}`);
    }
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loginLockedUntil && Date.now() < loginLockedUntil) {
      return;
    }

    try {
      const db = await getDb();
      const users = await db.select<any[]>("SELECT * FROM local_users WHERE id = 'usr-001'");
      if (users.length === 0) {
        setAppState("setup");
        return;
      }

      const matchUser = users[0];
      if (pinInput === matchUser.pin_hash) {
        await db.execute("UPDATE local_users SET failed_attempts = 0, locked_until = NULL WHERE id = ?", [matchUser.id]);
        setCurrentUser({ id: matchUser.id, name: matchUser.name, role: matchUser.role });
        setAppState("main");
        setPinInput("");
        setPinErrorText("");
      } else {
        const newAttempts = matchUser.failed_attempts + 1;
        if (newAttempts >= 5) {
          const lockTime = Date.now() + 60000;
          await db.execute("UPDATE local_users SET failed_attempts = ?, locked_until = ? WHERE id = ?", [
            newAttempts,
            String(lockTime),
            matchUser.id,
          ]);
          setLoginLockedUntil(lockTime);
          setPinErrorText("Terlalu banyak percobaan salah. Terkunci 60 detik.");
        } else {
          await db.execute("UPDATE local_users SET failed_attempts = ? WHERE id = ?", [newAttempts, matchUser.id]);
          setPinErrorText(`PIN salah. Sisa percobaan: ${5 - newAttempts}`);
        }
        setPinInput("");
      }
    } catch (err: any) {
      setPinErrorText(`Login Error: ${err.message || err}`);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const db = await getDb();
      const users = await db.select<any[]>("SELECT * FROM local_users WHERE id = 'usr-001'");
      if (users.length > 0) {
        const adminUser = users[0];
        if (recoveryAnswerInput.trim().toLowerCase() === adminUser.recovery_answer_hash) {
          await db.execute(
            "UPDATE local_users SET pin_hash = '123456', failed_attempts = 0, locked_until = NULL WHERE id = ?",
            [adminUser.id]
          );
          setPinErrorText("PIN direset menjadi default '123456'. Harap segera ubah di Settings.");
          setShowRecoveryFlow(false);
          setRecoveryAnswerInput("");
        } else {
          setPinErrorText("Jawaban pemulihan salah.");
        }
      }
    } catch (err: any) {
      setPinErrorText(`Recovery Error: ${err.message || err}`);
    }
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const db = await getDb();
      await db.execute(
        `UPDATE cooperatives SET 
           name = ?, legal_id = ?, address = ?, village = ?, district = ?, 
           regency = ?, province = ?, postal_code = ?, phone = ?, email = ?, 
           business_units = ?, officers = ?, updated_at = datetime('now')
         WHERE id = 'kdp-001'`,
        [
          coopProfile.name,
          coopProfile.legal_id,
          coopProfile.address,
          coopProfile.village,
          coopProfile.district,
          coopProfile.regency,
          coopProfile.province,
          coopProfile.postal_code,
          coopProfile.phone,
          coopProfile.email,
          coopProfile.business_units,
          coopProfile.officers,
        ]
      );
      alert("Profil Koperasi disimpan successfully!");
      loadProfileData();
    } catch (err) {
      alert(`Save Profile Gagal: ${err}`);
    }
  };

  const handleProfileFieldChange = (key: string, value: any) => {
    setCoopProfile((prev: any) => ({ ...prev, [key]: value }));
  };

  // Member CRUD
  const openAddMemberModal = () => {
    setMemberFormType("add");
    setMemberFormValues({
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
    });
    setShowMemberModal(true);
  };

  const openEditMemberModal = (member: Member) => {
    setMemberFormType("edit");
    setCurrentMemberId(member.id);
    setMemberFormValues({ ...member });
    setShowMemberModal(true);
  };

  const handleMemberFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (memberFormValues.nik.length !== 16) {
      alert("Error: NIK harus 16 digit.");
      return;
    }
    if (!memberFormValues.name.trim()) {
      alert("Error: Nama harus diisi.");
      return;
    }

    try {
      const db = await getDb();
      if (memberFormType === "add") {
        const newId = `mbr-${Date.now()}`;
        await db.execute(
          `INSERT INTO members (
            id, cooperative_id, nik, name, place_of_birth, date_of_birth, gender,
            occupation, education, rt, rw, hamlet, status, savings_pokok, savings_wajib,
            savings_sukarela, loan_total, loan_outstanding, loan_status
          ) VALUES (?, 'kdp-001', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId,
            memberFormValues.nik,
            memberFormValues.name,
            memberFormValues.place_of_birth,
            memberFormValues.date_of_birth,
            memberFormValues.gender,
            memberFormValues.occupation,
            memberFormValues.education,
            memberFormValues.rt,
            memberFormValues.rw,
            memberFormValues.hamlet,
            memberFormValues.status,
            Number(memberFormValues.savings_pokok),
            Number(memberFormValues.savings_wajib),
            Number(memberFormValues.savings_sukarela),
            Number(memberFormValues.loan_total),
            Number(memberFormValues.loan_outstanding),
            memberFormValues.loan_status,
          ]
        );
      } else {
        await db.execute(
          `UPDATE members SET 
            nik = ?, name = ?, place_of_birth = ?, date_of_birth = ?, gender = ?,
            occupation = ?, education = ?, rt = ?, rw = ?, hamlet = ?, status = ?,
            savings_pokok = ?, savings_wajib = ?, savings_sukarela = ?,
            loan_total = ?, loan_outstanding = ?, loan_status = ?, updated_at = datetime('now')
           WHERE id = ?`,
          [
            memberFormValues.nik,
            memberFormValues.name,
            memberFormValues.place_of_birth,
            memberFormValues.date_of_birth,
            memberFormValues.gender,
            memberFormValues.occupation,
            memberFormValues.education,
            memberFormValues.rt,
            memberFormValues.rw,
            memberFormValues.hamlet,
            memberFormValues.status,
            Number(memberFormValues.savings_pokok),
            Number(memberFormValues.savings_wajib),
            Number(memberFormValues.savings_sukarela),
            Number(memberFormValues.loan_total),
            Number(memberFormValues.loan_outstanding),
            memberFormValues.loan_status,
            currentMemberId,
          ]
        );
      }
      setShowMemberModal(false);
      loadMembersData();
    } catch (err: any) {
      alert(`Gagal menyimpan anggota: ${err.message || err}`);
    }
  };

  const handleDeleteMember = async (member: Member) => {
    if (member.loan_outstanding > 0) {
      alert("Error: Tidak dapat menghapus anggota dengan pinjaman aktif.");
      return;
    }
    const yes = confirm(`Apakah Anda yakin ingin menghapus anggota ${member.name}?`);
    if (!yes) return;

    try {
      const db = await getDb();
      await db.execute("DELETE FROM members WHERE id = ?", [member.id]);
      loadMembersData();
    } catch (err) {
      alert(`Delete Gagal: ${err}`);
    }
  };

  // SAK EP Accounting
  const handleCreateCoaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoaValues.code || !newCoaValues.name) {
      alert("Error: Kode dan Nama Akun harus diisi.");
      return;
    }
    try {
      const db = await getDb();
      await db.execute(
        `INSERT INTO coa_accounts (code, cooperative_id, name, type, normal_balance, balance)
         VALUES (?, 'kdp-001', ?, ?, ?, ?)`,
        [
          newCoaValues.code,
          newCoaValues.name,
          newCoaValues.type,
          newCoaValues.normal_balance,
          Number(newCoaValues.balance),
        ]
      );
      setShowCoaModal(false);
      loadAccountsData();
    } catch (err: any) {
      alert(`Gagal menambah akun: ${err.message || err}`);
    }
  };

  const handleJournalLineChange = (index: number, key: keyof JournalLineInput, value: any) => {
    setJournalForm((prev) => {
      const lines = [...prev.lines];
      lines[index] = { ...lines[index], [key]: value };
      return { ...prev, lines };
    });
  };

  const addJournalLineRow = () => {
    setJournalForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { accountCode: "1.1.01", debit: 0, credit: 0 }],
    }));
  };

  const removeJournalLineRow = (index: number) => {
    if (journalForm.lines.length <= 2) return;
    setJournalForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, idx) => idx !== index),
    }));
  };

  const handleJournalEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalForm.number || !journalForm.description) {
      alert("Error: Nomor Bukti dan Keterangan harus diisi.");
      return;
    }

    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of journalForm.lines) {
      totalDebit += Number(line.debit || 0);
      totalCredit += Number(line.credit || 0);
    }

    if (totalDebit !== totalCredit) {
      alert(`Error: Jurnal tidak seimbang. Selisih: Rp ${Math.abs(totalDebit - totalCredit).toLocaleString()}`);
      return;
    }
    if (totalDebit === 0) {
      alert("Error: Jumlah transaksi tidak boleh Rp 0.");
      return;
    }

    try {
      const db = await getDb();
      const newEntryId = `je-${Date.now()}`;

      await db.execute(
        `INSERT INTO journal_entries (id, cooperative_id, number, date, description, reference, category, created_by)
         VALUES (?, 'kdp-001', ?, ?, ?, ?, ?, ?)`,
        [
          newEntryId,
          journalForm.number,
          journalForm.date,
          journalForm.description,
          journalForm.reference,
          journalForm.category,
          currentUser?.id || "usr-001",
        ]
      );

      for (const line of journalForm.lines) {
        const lineId = `jl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        await db.execute(
          `INSERT INTO journal_lines (id, journal_entry_id, account_code, debit, credit)
           VALUES (?, ?, ?, ?, ?)`,
          [lineId, newEntryId, line.accountCode, Number(line.debit), Number(line.credit)]
        );

        const account = await db.select<any[]>("SELECT normal_balance, balance FROM coa_accounts WHERE code = ?", [
          line.accountCode,
        ]);
        if (account.length > 0) {
          const norm = account[0].normal_balance;
          const currentBal = account[0].balance;
          const delta = norm === "debit" ? (Number(line.debit) - Number(line.credit)) : (Number(line.credit) - Number(line.debit));
          const updatedBal = currentBal + delta;

          await db.execute("UPDATE coa_accounts SET balance = ? WHERE code = ?", [updatedBal, line.accountCode]);
        }
      }

      alert("Transaksi Jurnal berhasil disimpan!");
      setShowJournalModal(false);
      setJournalForm({
        date: new Date().toISOString().split("T")[0],
        number: "",
        description: "",
        reference: "",
        category: "operasional",
        tags: "",
        lines: [
          { accountCode: "1.1.01", debit: 0, credit: 0 },
          { accountCode: "4.01", debit: 0, credit: 0 },
        ],
      });
      loadJournalData();
      loadAccountsData();
      loadLedgerData();
    } catch (err: any) {
      alert(`Gagal menyimpan transaksi: ${err.message || err}`);
    }
  };

  // Financial calculations
  const calculateFeasibility = () => {
    const { initialInvestment, projectionYears, cashFlows, discountRate } = feasibilityParams;
    const rate = Number(discountRate) / 100;
    const flows = cashFlows.split(",").map(Number);

    if (flows.length !== Number(projectionYears)) {
      alert("Error: Jumlah elemen arus kas tidak sesuai dengan Tahun Proyeksi.");
      return;
    }

    let pvBenefits = 0;
    for (let t = 0; t < flows.length; t++) {
      pvBenefits += flows[t] / Math.pow(1 + rate, t + 1);
    }
    const enpv = pvBenefits - Number(initialInvestment);
    const ebcr = pvBenefits / Number(initialInvestment);

    const npvFunc = (r: number) => {
      let sum = 0;
      for (let t = 0; t < flows.length; t++) {
        sum += flows[t] / Math.pow(1 + r, t + 1);
      }
      return sum - Number(initialInvestment);
    };

    const dNpvFunc = (r: number) => {
      let sum = 0;
      for (let t = 0; t < flows.length; t++) {
        sum += (- (t + 1) * flows[t]) / Math.pow(1 + r, t + 2);
      }
      return sum;
    };

    let eirr = 0.1;
    let iterations = 0;
    let error = 1e-6;
    let diff = 1;

    while (Math.abs(diff) > error && iterations < 100) {
      const npvVal = npvFunc(eirr);
      const dNpvVal = dNpvFunc(eirr);
      if (dNpvVal === 0) break;
      const nextR = eirr - npvVal / dNpvVal;
      diff = nextR - eirr;
      eirr = nextR;
      iterations++;
    }

    const eirrPct = eirr * 100;
    let tier = 3;
    let tierLabel = "Tidak Layak";
    let tierColor = "red";

    const isNPVPass = enpv > 0;
    const isIRRPass = eirrPct > Number(discountRate);
    const isBCRPass = ebcr >= 1.0;

    if (isNPVPass && isIRRPass && isBCRPass) {
      tier = 1;
      tierLabel = "Layak";
      tierColor = "green";
    } else if (isNPVPass && (isIRRPass || isBCRPass)) {
      tier = 2;
      tierLabel = "Cukup Layak (Risiko Waspada)";
      tierColor = "amber";
    }

    setFeasibilityResults({
      enpv,
      ebcr,
      eirr: eirrPct,
      tier,
      tierLabel,
      tierColor,
      isNPVPass,
      isIRRPass,
      isBCRPass,
    });
  };

  const handleSensitivityScenarioChange = (scenario: "optimis" | "moderat" | "pesimis") => {
    setSensitivityScenario(scenario);
    if (!feasibilityResults) return;

    const multipliers = {
      optimis: { investment: 0.95, flows: 1.15 },
      moderat: { investment: 1.0, flows: 1.0 },
      pesimis: { investment: 1.15, flows: 0.7 },
    };

    const mult = multipliers[scenario];
    const adjustedInvest = feasibilityParams.initialInvestment * mult.investment;
    const originalFlows = feasibilityParams.cashFlows.split(",").map(Number);
    const adjustedFlows = originalFlows.map((cf) => cf * mult.flows);

    const rate = Number(feasibilityParams.discountRate) / 100;

    let pv = 0;
    for (let t = 0; t < adjustedFlows.length; t++) {
      pv += adjustedFlows[t] / Math.pow(1 + rate, t + 1);
    }
    const enpv = pv - adjustedInvest;
    const ebcr = pv / adjustedInvest;

    const npvFunc = (r: number) => {
      let sum = 0;
      for (let t = 0; t < adjustedFlows.length; t++) {
        sum += adjustedFlows[t] / Math.pow(1 + r, t + 1);
      }
      return sum - adjustedInvest;
    };

    const dNpvFunc = (r: number) => {
      let sum = 0;
      for (let t = 0; t < adjustedFlows.length; t++) {
        sum += (- (t + 1) * adjustedFlows[t]) / Math.pow(1 + r, t + 2);
      }
      return sum;
    };

    let eirr = 0.1;
    let diff = 1;
    let iter = 0;
    while (Math.abs(diff) > 1e-6 && iter < 100) {
      const v = npvFunc(eirr);
      const d = dNpvFunc(eirr);
      if (d === 0) break;
      const nextR = eirr - v / d;
      diff = nextR - eirr;
      eirr = nextR;
      iter++;
    }

    const eirrPct = eirr * 100;
    let tier = 3;
    let tierLabel = "Tidak Layak";
    if (enpv > 0 && eirrPct > feasibilityParams.discountRate && ebcr >= 1.0) {
      tier = 1;
      tierLabel = "Layak";
    } else if (enpv > 0 && (eirrPct > feasibilityParams.discountRate || ebcr >= 1.0)) {
      tier = 2;
      tierLabel = "Cukup Layak";
    }

    setSensitivityPresetResults({
      scenario,
      investment: adjustedInvest,
      flows: adjustedFlows,
      enpv,
      ebcr,
      eirr: eirrPct,
      tier,
      tierLabel,
    });
  };

  // Mock Sync engine
  const handleSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncProgress("Memeriksa sambungan ke server...");
    
    setTimeout(() => {
      setSyncProgress("Mengupload data anggota dan transaksi baru...");
      
      setTimeout(async () => {
        setSyncProgress("Menyinkronkan data bagan akun (COA)...");
        
        setTimeout(async () => {
          try {
            const db = await getDb();
            const syncId = `sync-${Date.now()}`;
            const members = await db.select<any[]>("SELECT COUNT(*) as count FROM members");
            const entries = await db.select<any[]>("SELECT COUNT(*) as count FROM journal_entries");
            const count = (members[0]?.count || 0) + (entries[0]?.count || 0);

            await db.execute(
              `INSERT INTO sync_history (id, cooperative_id, direction, status, entity_count, completed_at)
               VALUES (?, 'kdp-001', 'upload', 'success', ?, datetime('now'))`,
              [syncId, count]
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

  // Change PIN
  const handlePinChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const oldPin = (e.currentTarget as any).oldPin.value;
    const newPin = (e.currentTarget as any).newPin.value;
    const confirmPin = (e.currentTarget as any).confirmPin.value;

    if (newPin.length !== 6 || oldPin.length !== 6) {
      alert("Error: PIN harus 6 digit.");
      return;
    }
    if (newPin !== confirmPin) {
      alert("Error: Konfirmasi PIN baru tidak cocok.");
      return;
    }

    try {
      const db = await getDb();
      const users = await db.select<any[]>("SELECT pin_hash FROM local_users WHERE id = 'usr-001'");
      if (users.length > 0 && users[0].pin_hash === oldPin) {
        await db.execute("UPDATE local_users SET pin_hash = ? WHERE id = 'usr-001'", [newPin]);
        alert("PIN berhasil diperbarui!");
        (e.currentTarget as any).reset();
      } else {
        alert("Error: PIN lama salah.");
      }
    } catch (err) {
      alert(`Update PIN Gagal: ${err}`);
    }
  };

  // OTA Updates
  const checkUpdateCenter = async () => {
    setIsUpdateChecking(true);
    setUpdateStatusText("Memeriksa pembaruan...");
    try {
      const update = await check();
      if (update) {
        setUpdateStatusText(`Mengunduh update v${update.version}...`);
        await update.downloadAndInstall();
        setUpdateStatusText("Relaunching...");
        await relaunch();
      } else {
        setUpdateStatusText("Aplikasi berada di versi terbaru!");
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

  // Financial aggregates
  const getAccountingReports = () => {
    const assets = coaAccounts.filter((a) => a.type === "aset");
    const liabilities = coaAccounts.filter((a) => a.type === "kewajiban");
    const equity = coaAccounts.filter((a) => a.type === "ekuitas");
    const revenues = coaAccounts.filter((a) => a.type === "pendapatan");
    const expenses = coaAccounts.filter((a) => a.type === "beban");

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

    const totalRevenue = revenues.reduce((sum, a) => sum + a.balance, 0);
    const totalExpense = expenses.reduce((sum, a) => sum + a.balance, 0);

    const shuKotor = totalRevenue - totalExpense;
    const tax = shuKotor > 0 ? shuKotor * 0.1 : 0;
    const shuBersih = shuKotor - tax;

    return {
      assets,
      liabilities,
      equity,
      revenues,
      expenses,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpense,
      shuKotor,
      tax,
      shuBersih,
      balanced: totalAssets === totalLiabilities + totalEquity,
    };
  };

  const reports = getAccountingReports();

  // Filtered members list
  const filteredMembers = membersList.filter((mbr) => {
    const matchesSearch =
      mbr.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      mbr.nik.includes(memberSearchQuery);
    const matchesFilter =
      memberFilterStatus === "semua" ||
      mbr.status === memberFilterStatus;
    return matchesSearch && matchesFilter;
  });

  // Splash view
  if (appState === "splash") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-white text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="text-5xl font-black bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent mb-4">KDKMP</div>
          <h2 className="text-xl font-bold">Sistem Informasi KDKMP</h2>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 my-6"></div>
          <p className="text-slate-400 text-sm">Memuat data lokal...</p>
        </div>
        <p className="absolute bottom-8 text-slate-600 text-xs">v0.5.0 • SAK EP Compliant</p>
      </div>
    );
  }

  // Database Connection failure screen
  if (appState === "db_error") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <div className="w-full max-w-md p-8 bg-slate-900 border border-rose-500/50 rounded-2xl shadow-xl text-center">
          <h2 className="text-2xl font-bold text-rose-500 mb-2">Database Connection Error</h2>
          <p className="text-slate-400 text-sm mb-6">
            Gagal memuat database SQLite. Harap hubungi administrator Anda.
          </p>
          <div className="bg-rose-500/10 p-4 rounded-lg text-rose-400 text-left font-mono text-xs mb-6 overflow-x-auto">
            <code>{dbErrorMessage}</code>
          </div>
          <Button variant="destructive" className="w-full" onClick={() => window.location.reload()}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  // First Launch wizard setup
  if (appState === "setup") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <form className="w-full max-w-md p-8 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl text-center backdrop-blur-xl" onSubmit={handleSetupPinSubmit}>
          <div className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent mb-2">KDKMP</div>
          <h2 className="text-xl font-bold mb-1">Buat PIN Baru</h2>
          <p className="text-slate-400 text-xs mb-6">Atur PIN 6 digit untuk mengamankan data koperasi lokal.</p>

          <div className="flex flex-col gap-4 w-full mb-6 text-left">
            <div>
              <label>PIN (6 Digit)</label>
              <Input
                type="password"
                placeholder="••••••"
                maxLength={6}
                value={setupPin}
                onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ""))}
                className="text-center text-xl tracking-[0.25em] bg-slate-950 border-slate-800"
              />
            </div>
            <div>
              <label>Konfirmasi PIN</label>
              <Input
                type="password"
                placeholder="••••••"
                maxLength={6}
                value={setupConfirmPin}
                onChange={(e) => setSetupConfirmPin(e.target.value.replace(/\D/g, ""))}
                className="text-center text-xl tracking-[0.25em] bg-slate-950 border-slate-800"
              />
            </div>
            <div>
              <label>Pertanyaan Pemulihan</label>
              <Select value={setupQuestion} onValueChange={setSetupQuestion}>
                <SelectTrigger className="w-full bg-slate-950 border-slate-800">
                  <SelectValue placeholder="Pilih Pertanyaan" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800 text-white">
                  <SelectItem value="Apa nama hewan peliharaan pertama Anda?">Apa nama hewan peliharaan pertama Anda?</SelectItem>
                  <SelectItem value="Di mana kota kelahiran ibu Anda?">Di mana kota kelahiran ibu Anda?</SelectItem>
                  <SelectItem value="Apa nama SD pertama Anda?">Apa nama SD pertama Anda?</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label>Jawaban Pemulihan</label>
              <Input
                type="text"
                placeholder="Ketik jawaban"
                value={setupAnswer}
                onChange={(e) => setSetupAnswer(e.target.value)}
                className="bg-slate-950 border-slate-800"
              />
            </div>
          </div>

          {pinErrorText && <p className="text-rose-400 text-sm mb-4">{pinErrorText}</p>}
          <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600">Simpan & Mulai</Button>
        </form>
      </div>
    );
  }

  // Keypad Lockscreen
  if (appState === "login") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        {!showRecoveryFlow ? (
          <form className="w-full max-w-md p-8 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl text-center backdrop-blur-xl" onSubmit={handleLoginSubmit}>
            <div className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent mb-2">KDKMP</div>
            <h2 className="text-xl font-bold mb-1">Masukkan PIN Anda</h2>
            <p className="text-slate-400 text-xs mb-6">Sistem Informasi KDKMP Koperasi Maju Bersama</p>

            <Input
              type="password"
              placeholder="••••••"
              maxLength={6}
              value={pinInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPinInput(val);
                if (val.length === 6) {
                  setTimeout(() => {
                    setPinInput((current) => {
                      if (current.length === 6) {
                        handleLoginSubmit();
                      }
                      return current;
                    });
                  }, 100);
                }
              }}
              disabled={!!loginLockedUntil}
              className="text-center text-3xl tracking-[0.4em] bg-slate-950 border-slate-800 py-6 mb-6 mx-auto w-4/5"
              autoFocus
            />

            {pinErrorText && <p className="text-rose-400 text-sm mb-4">{pinErrorText}</p>}
            {loginLockedUntil && (
              <p className="text-rose-400 font-semibold text-sm mb-4">
                Kunci aktif. Tunggu {lockoutCountdown} detik...
              </p>
            )}

            <Button type="submit" disabled={!!loginLockedUntil} className="w-full bg-emerald-500 hover:bg-emerald-600">Login</Button>
            <p
              onClick={() => setShowRecoveryFlow(true)}
              className="text-sky-400 hover:text-sky-300 text-sm cursor-pointer mt-6 inline-block"
            >
              Lupa PIN?
            </p>
          </form>
        ) : (
          <form className="w-full max-w-md p-8 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl text-center backdrop-blur-xl" onSubmit={handleRecoverySubmit}>
            <h2 className="text-xl font-bold mb-1">Pemulihan PIN</h2>
            <p className="text-slate-300 text-sm text-left my-4">
              <strong>Pertanyaan Keamanan:</strong> {recoveryQuestionText}
            </p>

            <Input
              type="text"
              placeholder="Masukkan jawaban Anda..."
              value={recoveryAnswerInput}
              onChange={(e) => setRecoveryAnswerInput(e.target.value)}
              className="bg-slate-950 border-slate-800 mb-6"
              autoFocus
            />

            {pinErrorText && <p className="text-rose-400 text-sm mb-4">{pinErrorText}</p>}

            <div className="flex gap-4">
              <Button type="button" onClick={() => setShowRecoveryFlow(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white">
                Batal
              </Button>
              <Button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600">Verifikasi</Button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // Dashboard Main Panel layout
  return (
    <div className={`app-container flex min-h-screen text-slate-100 ${appTheme} font-${fontSizeSetting}`}>
      {/* Sidebar Panel */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/40 p-6 flex flex-col justify-between backdrop-blur-xl print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-10">
            <span className="text-lg font-black bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent tracking-tight">KDKMP COCKPIT</span>
          </div>
          <nav className="flex flex-col gap-2">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition text-sm font-medium ${activeTab === "home" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`} onClick={() => setActiveTab("home")}>
              🏠 Beranda
            </div>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition text-sm font-medium ${activeTab === "members" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`} onClick={() => setActiveTab("members")}>
              👥 Anggota Koperasi
            </div>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition text-sm font-medium ${activeTab === "accounting" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`} onClick={() => setActiveTab("accounting")}>
              📊 Akuntansi SAK EP
            </div>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition text-sm font-medium ${activeTab === "feasibility" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`} onClick={() => setActiveTab("feasibility")}>
              📈 Analisis Kelayakan
            </div>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition text-sm font-medium ${activeTab === "sync" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`} onClick={() => setActiveTab("sync")}>
              🔄 Sinkronisasi
            </div>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition text-sm font-medium ${activeTab === "settings" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`} onClick={() => setActiveTab("settings")}>
              ⚙️ Pengaturan
            </div>
          </nav>
        </div>

        <div className="border-t border-slate-800/80 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
            <span>v0.5.0 Local</span>
          </div>
        </div>
      </aside>

      {/* Main viewport */}
      <main className="flex-1 p-12 overflow-y-auto max-w-6xl mx-auto w-full">
        {activeTab === "home" && (
          <div>
            <header className="mb-10 print:hidden">
              <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Beranda Utama</h2>
              <p className="text-slate-400 text-sm">RAG status kesehatan finansial KDKMP desa saat ini.</p>
            </header>

            {/* Health RAG Card */}
            <Card className="glass-panel text-white border-slate-800/80 mb-8 shadow-lg shadow-black/10">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-2 text-emerald-400">
                      🟢 SEHAT &nbsp;
                      <span className="text-sm font-normal text-slate-400">
                        (Skor: {coopProfile.health_score}/100)
                      </span>
                    </h3>
                    <p className="text-slate-300 text-sm">
                      Sistem RAG mendeteksi parameter solvabilitas dan kas berada pada batas optimal.
                    </p>
                  </div>
                  <div className="text-4xl">💚</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 border-t border-slate-800/80 pt-6">
                  <div className="border-l-4 border-emerald-500 pl-4">
                    <div className="text-slate-400 text-xs font-semibold mb-1">TOTAL ASET</div>
                    <div className="text-lg font-bold">Rp {reports.totalAssets.toLocaleString()}</div>
                  </div>
                  <div className="border-l-4 border-rose-500 pl-4">
                    <div className="text-slate-400 text-xs font-semibold mb-1">TOTAL KEWAJIBAN</div>
                    <div className="text-lg font-bold">Rp {reports.totalLiabilities.toLocaleString()}</div>
                  </div>
                  <div className="border-l-4 border-sky-500 pl-4">
                    <div className="text-slate-400 text-xs font-semibold mb-1">TOTAL EKUITAS</div>
                    <div className="text-lg font-bold">Rp {reports.totalEquity.toLocaleString()}</div>
                  </div>
                  <div className="border-l-4 border-emerald-500 pl-4">
                    <div className="text-slate-400 text-xs font-semibold mb-1">JUMLAH ANGGOTA</div>
                    <div className="text-lg font-bold">{membersList.length} Orang</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:hidden">
              <Card className="glass-panel text-white border-slate-800/80 hover:-translate-y-1 transition duration-300 cursor-pointer shadow-md" onClick={() => setActiveTab("members")}>
                <CardHeader>
                  <div className="text-3xl mb-2">📋</div>
                  <CardTitle className="text-lg font-bold text-white">Anggota Koperasi</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Kelola database anggota, simpanan, dan pinjaman.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="glass-panel text-white border-slate-800/80 hover:-translate-y-1 transition duration-300 cursor-pointer shadow-md" onClick={() => { setActiveTab("accounting"); setAccountingTab("journal"); }}>
                <CardHeader>
                  <div className="text-3xl mb-2">💳</div>
                  <CardTitle className="text-lg font-bold text-white">Transaksi Harian</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Catat transaksi debit/kredit umum SAK EP.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="glass-panel text-white border-slate-800/80 hover:-translate-y-1 transition duration-300 cursor-pointer shadow-md" onClick={() => { setActiveTab("accounting"); setAccountingTab("neraca"); }}>
                <CardHeader>
                  <div className="text-3xl mb-2">📊</div>
                  <CardTitle className="text-lg font-bold text-white">Laporan Keuangan</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Lihat Neraca saldo & Laporan Laba Rugi.</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Early Warning system */}
            <Card className="glass-panel text-white border-slate-800/80 mb-8 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold tracking-wide text-slate-400 uppercase">Sistem Peringatan Dini (EWS)</CardTitle>
              </CardHeader>
              <CardContent>
                {ewsAlertsList.length === 0 ? (
                  <p className="text-emerald-400 font-semibold text-sm">
                    ✅ Tidak ada peringatan aktif. Semua rasio finansial sehat.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {ewsAlertsList.map((alert) => (
                      <div key={alert.id} className="flex gap-3 bg-amber-500/5 p-4 rounded-xl border border-amber-500/10">
                        <div className="text-lg">⚠️</div>
                        <div>
                          <div className="font-semibold text-amber-500 text-sm">{alert.message}</div>
                          <div className="text-xs text-slate-400 mt-1">Saran: {alert.suggested_action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial summaries */}
            <Card className="glass-panel text-white border-slate-800/80 shadow-md print:hidden">
              <CardHeader>
                <CardTitle className="text-sm font-semibold tracking-wide text-slate-400 uppercase">Tren Keuangan (6 Bulan Terakhir)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-44 flex items-end gap-10 py-4 px-2">
                  {dashboardIncomeData.map((data, idx) => {
                    const maxVal = 100000000;
                    const incHeight = (data.income / maxVal) * 140;
                    const expHeight = (data.expense / maxVal) * 140;

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="flex items-end gap-1 h-[140px] w-full justify-center">
                          <div style={{ height: `${incHeight}px` }} className="w-4 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t" title={`Pendapatan: Rp ${data.income.toLocaleString()}`}></div>
                          <div style={{ height: `${expHeight}px` }} className="w-4 bg-gradient-to-t from-rose-500 to-rose-400 rounded-t" title={`Beban: Rp ${data.expense.toLocaleString()}`}></div>
                        </div>
                        <span className="text-xs text-slate-400">{data.month}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-6 text-xs text-slate-400 mt-4 justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                    <span>Pendapatan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-rose-500 rounded-sm"></div>
                    <span>Beban</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "members" && (
          <div>
            <header className="mb-10 print:hidden">
              <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Manajemen Anggota</h2>
              <p className="text-slate-400 text-sm">Kelola profil anggota, simpanan pokok/wajib, serta data pinjaman.</p>
            </header>

            <Card className="glass-panel text-white border-slate-800/80">
              <CardContent className="pt-6">
                <div className="flex justify-between mb-6 gap-4 print:hidden">
                  <div className="flex gap-3 flex-1">
                    <Input
                      type="text"
                      placeholder="Cari nama atau NIK..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="max-w-md bg-slate-950 border-slate-800 text-white"
                    />
                    <Select value={memberFilterStatus} onValueChange={setMemberFilterStatus}>
                      <SelectTrigger className="w-44 bg-slate-950 border-slate-800">
                        <SelectValue placeholder="Filter Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-800 text-white">
                        <SelectItem value="semua">Semua Status</SelectItem>
                        <SelectItem value="aktif">Aktif</SelectItem>
                        <SelectItem value="nonaktif">Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={openAddMemberModal} className="bg-emerald-500 hover:bg-emerald-600">
                    + Tambah Anggota
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="border-slate-800">
                      <TableRow className="border-slate-800 text-slate-400 hover:bg-transparent">
                        <TableHead>Nama Anggota</TableHead>
                        <TableHead>NIK</TableHead>
                        <TableHead>RT/RW</TableHead>
                        <TableHead>Total Simpanan</TableHead>
                        <TableHead>Outstanding Pinjaman</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="print:hidden">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((mbr) => {
                        const totalSavings = mbr.savings_pokok + mbr.savings_wajib + mbr.savings_sukarela;
                        return (
                          <TableRow key={mbr.id} className="border-slate-800/50 hover:bg-slate-800/10">
                            <TableCell className="font-semibold text-white">{mbr.name}</TableCell>
                            <TableCell>{mbr.nik}</TableCell>
                            <TableCell>{mbr.rt}/{mbr.rw}</TableCell>
                            <TableCell>Rp {totalSavings.toLocaleString()}</TableCell>
                            <TableCell>Rp {mbr.loan_outstanding.toLocaleString()}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${mbr.status === "aktif" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                                {mbr.status}
                              </span>
                            </TableCell>
                            <TableCell className="print:hidden">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEditMemberModal(mbr)} className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white">
                                  Edit
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteMember(mbr)} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20">
                                  Hapus
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredMembers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6 text-slate-500">
                            Belum ada data anggota ditemukan.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Dialog Component for Member Form */}
            <Dialog open={showMemberModal} onOpenChange={setShowMemberModal}>
              <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl overflow-y-auto max-h-[85vh]">
                <DialogHeader className="border-b border-slate-800 pb-4">
                  <DialogTitle className="text-xl font-bold">
                    {memberFormType === "add" ? "Tambah Anggota Baru" : "Edit Profil Anggota"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleMemberFormSubmit} className="space-y-6 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label>NIK (16 Digit)</label>
                      <Input
                        type="text"
                        maxLength={16}
                        required
                        value={memberFormValues.nik}
                        onChange={(e) => setMemberFormValues({ ...memberFormValues, nik: e.target.value.replace(/\D/g, "") })}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                    <div>
                      <label>Nama Lengkap</label>
                      <Input
                        type="text"
                        required
                        value={memberFormValues.name}
                        onChange={(e) => setMemberFormValues({ ...memberFormValues, name: e.target.value })}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                    <div>
                      <label>Tempat Lahir</label>
                      <Input
                        type="text"
                        value={memberFormValues.place_of_birth}
                        onChange={(e) => setMemberFormValues({ ...memberFormValues, place_of_birth: e.target.value })}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                    <div>
                      <label>Tanggal Lahir</label>
                      <Input
                        type="date"
                        value={memberFormValues.date_of_birth}
                        onChange={(e) => setMemberFormValues({ ...memberFormValues, date_of_birth: e.target.value })}
                        className="bg-slate-950 border-slate-800 text-slate-100"
                      />
                    </div>
                    <div>
                      <label>Jenis Kelamin</label>
                      <Select value={memberFormValues.gender} onValueChange={(val) => setMemberFormValues({ ...memberFormValues, gender: val })}>
                        <SelectTrigger className="w-full bg-slate-950 border-slate-800">
                          <SelectValue placeholder="Pilih Gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-800 text-white">
                          <SelectItem value="L">Laki-laki</SelectItem>
                          <SelectItem value="P">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label>Pekerjaan</label>
                      <Input
                        type="text"
                        value={memberFormValues.occupation}
                        onChange={(e) => setMemberFormValues({ ...memberFormValues, occupation: e.target.value })}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                    <div>
                      <label>Pendidikan Terakhir</label>
                      <Input
                        type="text"
                        value={memberFormValues.education}
                        onChange={(e) => setMemberFormValues({ ...memberFormValues, education: e.target.value })}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                    <div>
                      <label>Dusun</label>
                      <Input
                        type="text"
                        value={memberFormValues.hamlet}
                        onChange={(e) => setMemberFormValues({ ...memberFormValues, hamlet: e.target.value })}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                    <div>
                      <label>RT / RW</label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="RT"
                          value={memberFormValues.rt}
                          onChange={(e) => setMemberFormValues({ ...memberFormValues, rt: e.target.value })}
                          className="bg-slate-950 border-slate-800"
                        />
                        <Input
                          type="text"
                          placeholder="RW"
                          value={memberFormValues.rw}
                          onChange={(e) => setMemberFormValues({ ...memberFormValues, rw: e.target.value })}
                          className="bg-slate-950 border-slate-800"
                        />
                      </div>
                    </div>
                    <div>
                      <label>Status Anggota</label>
                      <Select value={memberFormValues.status} onValueChange={(val) => setMemberFormValues({ ...memberFormValues, status: val })}>
                        <SelectTrigger className="w-full bg-slate-950 border-slate-800">
                          <SelectValue placeholder="Pilih Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-800 text-white">
                          <SelectItem value="aktif">Aktif</SelectItem>
                          <SelectItem value="nonaktif">Nonaktif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 border-t border-slate-800 pt-4 mt-2">
                      <strong className="text-emerald-400 text-sm">Simpanan Anggota</strong>
                    </div>
                    <div>
                      <label>Simpanan Pokok (Rp)</label>
                      <Input
                        type="number"
                        value={memberFormValues.savings_pokok}
                        onChange={(e) => setMemberFormValues({ ...memberFormValues, savings_pokok: Number(e.target.value) })}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                    <div>
                      <label>Simpanan Wajib (Rp)</label>
                      <Input
                        type="number"
                        value={memberFormValues.savings_wajib}
                        onChange={(e) => setMemberFormValues({ ...memberFormValues, savings_wajib: Number(e.target.value) })}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                    <div>
                      <label>Simpanan Sukarela (Rp)</label>
                      <Input
                        type="number"
                        value={memberFormValues.savings_sukarela}
                        onChange={(e) => setMemberFormValues({ ...memberFormValues, savings_sukarela: Number(e.target.value) })}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>

                    <div className="col-span-2 border-t border-slate-800 pt-4 mt-2">
                      <strong className="text-sky-400 text-sm">Pinjaman Anggota</strong>
                    </div>
                    <div>
                      <label>Total Pinjaman (Rp)</label>
                      <Input
                        type="number"
                        value={memberFormValues.loan_total}
                        onChange={(e) => setMemberFormValues({ ...memberFormValues, loan_total: Number(e.target.value) })}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                    <div>
                      <label>Outstanding Sisa Pinjaman (Rp)</label>
                      <Input
                        type="number"
                        value={memberFormValues.loan_outstanding}
                        onChange={(e) => setMemberFormValues({ ...memberFormValues, loan_outstanding: Number(e.target.value) })}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                    <div>
                      <label>Status Pinjaman</label>
                      <Input
                        type="text"
                        value={memberFormValues.loan_status}
                        onChange={(e) => setMemberFormValues({ ...memberFormValues, loan_status: e.target.value })}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                  </div>

                  <DialogFooter className="border-t border-slate-800 pt-4 gap-2">
                    <Button type="button" onClick={() => setShowMemberModal(false)} className="bg-slate-850 hover:bg-slate-800 text-white">
                      Batal
                    </Button>
                    <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">Simpan Anggota</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === "accounting" && (
          <div>
            <header className="mb-10 print:hidden">
              <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Akuntansi SAK EP</h2>
              <p className="text-slate-400 text-sm">Kelola pembukuan umum standar SAK Entitas Privat.</p>
            </header>

            {/* SAK EP Subtabs navigation using shadcn tabs */}
            <Tabs value={accountingTab} onValueChange={(val) => setAccountingTab(val as any)} className="w-full">
              <TabsList className="bg-slate-900 border border-slate-800 text-slate-400 mb-6 p-1 rounded-xl print:hidden">
                <TabsTrigger value="coa" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 font-bold px-4 py-2 rounded-lg">Bagan Akun (COA)</TabsTrigger>
                <TabsTrigger value="journal" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 font-bold px-4 py-2 rounded-lg">Jurnal Umum</TabsTrigger>
                <TabsTrigger value="ledger" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 font-bold px-4 py-2 rounded-lg">Buku Besar</TabsTrigger>
                <TabsTrigger value="neraca" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 font-bold px-4 py-2 rounded-lg">Laporan Neraca</TabsTrigger>
                <TabsTrigger value="labarugi" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 font-bold px-4 py-2 rounded-lg">Laporan Laba Rugi</TabsTrigger>
              </TabsList>

              <TabsContent value="coa">
                <Card className="glass-panel text-white border-slate-800/80">
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-bold text-white">Daftar Bagan Rekening</CardTitle>
                      <CardDescription className="text-slate-400">SAK EP Chart of Accounts standar.</CardDescription>
                    </div>
                    <Button onClick={() => setShowCoaModal(true)} className="bg-emerald-500 hover:bg-emerald-600">
                      + Tambah Akun
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader className="border-slate-800">
                        <TableRow className="border-slate-800 text-slate-400 hover:bg-transparent">
                          <TableHead>Kode Rekening</TableHead>
                          <TableHead>Nama Rekening</TableHead>
                          <TableHead>Klasifikasi Tipe</TableHead>
                          <TableHead>Saldo Normal</TableHead>
                          <TableHead>Saldo Saat Ini</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coaAccounts.map((acc) => (
                          <TableRow key={acc.code} className="border-slate-800/50 hover:bg-slate-800/10">
                            <TableCell className="font-mono text-white">{acc.code}</TableCell>
                            <TableCell className="font-semibold">{acc.name}</TableCell>
                            <TableCell className="capitalize">{acc.type}</TableCell>
                            <TableCell className="capitalize">{acc.normal_balance}</TableCell>
                            <TableCell>Rp {acc.balance.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Dialog Form for New Account */}
                <Dialog open={showCoaModal} onOpenChange={setShowCoaModal}>
                  <DialogContent className="bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">Tambah Akun Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateCoaSubmit} className="space-y-4 pt-4">
                      <div>
                        <label>Kode Rekening (Contoh: 1.1.05)</label>
                        <Input type="text" required value={newCoaValues.code} onChange={(e) => setNewCoaValues({ ...newCoaValues, code: e.target.value })} className="bg-slate-950 border-slate-800" />
                      </div>
                      <div>
                        <label>Nama Akun</label>
                        <Input type="text" required value={newCoaValues.name} onChange={(e) => setNewCoaValues({ ...newCoaValues, name: e.target.value })} className="bg-slate-950 border-slate-800" />
                      </div>
                      <div>
                        <label>Klasifikasi Tipe</label>
                        <Select value={newCoaValues.type} onValueChange={(val) => setNewCoaValues({ ...newCoaValues, type: val as any })}>
                          <SelectTrigger className="w-full bg-slate-950 border-slate-800">
                            <SelectValue placeholder="Pilih Tipe" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-950 border-slate-800 text-white">
                            <SelectItem value="aset">Aset</SelectItem>
                            <SelectItem value="kewajiban">Kewajiban</SelectItem>
                            <SelectItem value="ekuitas">Ekuitas</SelectItem>
                            <SelectItem value="pendapatan">Pendapatan</SelectItem>
                            <SelectItem value="beban">Beban</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label>Saldo Normal</label>
                        <Select value={newCoaValues.normal_balance} onValueChange={(val) => setNewCoaValues({ ...newCoaValues, normal_balance: val as any })}>
                          <SelectTrigger className="w-full bg-slate-950 border-slate-800">
                            <SelectValue placeholder="Saldo Normal" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-950 border-slate-800 text-white">
                            <SelectItem value="debit">Debit</SelectItem>
                            <SelectItem value="kredit">Kredit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label>Saldo Awal (Rp)</label>
                        <Input type="number" value={newCoaValues.balance} onChange={(e) => setNewCoaValues({ ...newCoaValues, balance: Number(e.target.value) })} className="bg-slate-950 border-slate-800" />
                      </div>
                      <DialogFooter className="pt-4 border-t border-slate-800 gap-2">
                        <Button type="button" onClick={() => setShowCoaModal(false)} className="bg-slate-850 hover:bg-slate-800 text-white">Batal</Button>
                        <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">Tambah Akun</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="journal">
                <Card className="glass-panel text-white border-slate-800/80">
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-bold text-white">Buku Jurnal Umum</CardTitle>
                      <CardDescription className="text-slate-400">Catat debit dan kredit secara berpasangan.</CardDescription>
                    </div>
                    <Button onClick={() => setShowJournalModal(true)} className="bg-emerald-500 hover:bg-emerald-600">
                      + Jurnal Baru
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      {journalEntries.map((entry) => (
                        <div key={entry.id} className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 shadow-sm">
                          <div className="flex justify-between border-b border-slate-800 pb-3 mb-3">
                            <span className="font-bold text-sky-400">{entry.number}</span>
                            <span className="text-slate-400 text-xs">{entry.date}</span>
                          </div>
                          <div className="text-sm text-slate-200 mb-4">{entry.description}</div>
                          
                          <div className="pl-6 space-y-2">
                            {entry.lines.map((line, idx) => (
                              <div key={idx} className="flex justify-between text-xs font-mono">
                                <span className={line.credit > 0 ? "pl-8 text-slate-400" : "text-slate-200 font-semibold"}>
                                  {line.account_code} - {line.name}
                                </span>
                                <span>
                                  {line.debit > 0 ? `Rp ${line.debit.toLocaleString()} (D)` : `Rp ${line.credit.toLocaleString()} (K)`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Dialog Box for Adding Journal Posting */}
                <Dialog open={showJournalModal} onOpenChange={setShowJournalModal}>
                  <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl overflow-y-auto max-h-[85vh]">
                    <DialogHeader className="border-b border-slate-800 pb-4">
                      <DialogTitle className="text-xl font-bold">Buat Entri Jurnal Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleJournalEntrySubmit} className="space-y-6 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label>Tanggal Transaksi</label>
                          <Input type="date" required value={journalForm.date} onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })} className="bg-slate-950 border-slate-800 text-white" />
                        </div>
                        <div>
                          <label>Nomor Bukti (No. Ref)</label>
                          <Input type="text" required placeholder="Contoh: JU-2026-07-001" value={journalForm.number} onChange={(e) => setJournalForm({ ...journalForm, number: e.target.value })} className="bg-slate-950 border-slate-800" />
                        </div>
                        <div className="col-span-2">
                          <label>Keterangan Transaksi</label>
                          <Input type="text" required placeholder="Contoh: Penerimaan angsuran bulanan..." value={journalForm.description} onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })} className="bg-slate-950 border-slate-800" />
                        </div>
                      </div>

                      <div>
                        <strong className="text-emerald-400 text-sm">Baris Transaksi (Debit & Kredit)</strong>
                        <div className="overflow-x-auto mt-2">
                          <Table>
                            <TableHeader className="border-slate-800">
                              <TableRow className="border-slate-800 text-slate-400 hover:bg-transparent">
                                <TableHead className="w-1/2">Akun Rekening</TableHead>
                                <TableHead>Debit (Rp)</TableHead>
                                <TableHead>Kredit (Rp)</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {journalForm.lines.map((line, idx) => (
                                <TableRow key={idx} className="border-slate-800/40 hover:bg-transparent">
                                  <TableCell className="p-2">
                                    <Select value={line.accountCode} onValueChange={(val) => handleJournalLineChange(idx, "accountCode", val)}>
                                      <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-white">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-slate-950 border-slate-800 text-white">
                                        {coaAccounts.map((a) => (
                                          <SelectItem key={a.code} value={a.code}>{a.code} - {a.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell className="p-2">
                                    <Input
                                      type="number"
                                      value={line.debit}
                                      onChange={(e) => handleJournalLineChange(idx, "debit", Number(e.target.value))}
                                      className="bg-slate-950 border-slate-800 w-full"
                                    />
                                  </TableCell>
                                  <TableCell className="p-2">
                                    <Input
                                      type="number"
                                      value={line.credit}
                                      onChange={(e) => handleJournalLineChange(idx, "credit", Number(e.target.value))}
                                      className="bg-slate-950 border-slate-800 w-full"
                                    />
                                  </TableCell>
                                  <TableCell className="p-2">
                                    <Button type="button" onClick={() => removeJournalLineRow(idx)} className="bg-transparent border-0 hover:bg-rose-500/10 text-rose-500 px-2 py-1 shadow-none">
                                      ❌
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <Button type="button" onClick={addJournalLineRow} className="bg-slate-800 hover:bg-slate-700 text-white mt-4 text-xs shadow-none">
                          + Tambah Baris
                        </Button>
                      </div>

                      <DialogFooter className="pt-4 border-t border-slate-800 gap-2">
                        <Button type="button" onClick={() => setShowJournalModal(false)} className="bg-slate-850 hover:bg-slate-800 text-white">Batal</Button>
                        <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">Simpan Transaksi</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="ledger">
                <Card className="glass-panel text-white border-slate-800/80">
                  <CardHeader>
                    <div className="w-72">
                      <label>Pilih Rekening Akun</label>
                      <Select value={ledgerSelectedCode} onValueChange={setLedgerSelectedCode}>
                        <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-800 text-white">
                          {coaAccounts.map((a) => (
                            <SelectItem key={a.code} value={a.code}>{a.code} - {a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between border-b border-slate-850 pb-3 mb-6 text-sm text-slate-400">
                      <span>Saldo Awal: <strong className="text-white">Rp {ledgerBalanceStart.toLocaleString()}</strong></span>
                      <span>Saldo Akhir: <strong className="text-white">Rp {ledgerBalanceEnd.toLocaleString()}</strong></span>
                    </div>

                    <Table>
                      <TableHeader className="border-slate-800">
                        <TableRow className="border-slate-800 text-slate-400 hover:bg-transparent">
                          <TableHead>Tanggal</TableHead>
                          <TableHead>No. Ref</TableHead>
                          <TableHead>Keterangan</TableHead>
                          <TableHead>Debit (D)</TableHead>
                          <TableHead>Kredit (K)</TableHead>
                          <TableHead>Saldo Berjalan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ledgerEntries.map((line, idx) => (
                          <TableRow key={idx} className="border-slate-800/40 hover:bg-slate-850/10">
                            <TableCell>{line.date}</TableCell>
                            <TableCell className="font-mono text-sky-400">{line.number}</TableCell>
                            <TableCell>{line.entry_desc}</TableCell>
                            <TableCell className="text-emerald-400">{line.debit > 0 ? `Rp ${line.debit.toLocaleString()}` : "—"}</TableCell>
                            <TableCell className="text-rose-400">{line.credit > 0 ? `Rp ${line.credit.toLocaleString()}` : "—"}</TableCell>
                            <TableCell className="font-bold text-white">Rp {line.runningBalance.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        {ledgerEntries.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                              Tidak ada mutasi transaksi untuk rekening ini.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="neraca">
                <Card className="glass-panel text-white border-slate-800/80 p-8">
                  <div className="text-center mb-10">
                    <h3 className="text-2xl font-black tracking-tight text-white mb-1">KOPERASI MAJU BERSAMA</h3>
                    <h4 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-1">LAPORAN NERACA FINANSIAL</h4>
                    <p className="text-xs text-slate-500">Per 30 Juni 2026 • SAK EP Standard</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left: Assets */}
                    <div>
                      <h5 className="border-b-2 border-emerald-500 pb-2 text-emerald-400 font-extrabold text-sm tracking-wider uppercase mb-4">ASET (AKTIVA)</h5>
                      <div className="space-y-3">
                        {coaAccounts.filter(a => a.type === "aset").map(acc => (
                          <div key={acc.code} className="flex justify-between text-sm">
                            <span className="text-slate-300">{acc.name}</span>
                            <span className="font-mono">{acc.balance >= 0 ? `Rp ${acc.balance.toLocaleString()}` : `(Rp ${Math.abs(acc.balance).toLocaleString()})`}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold text-white border-t border-slate-800 pt-3 mt-4 text-base">
                          <span>TOTAL ASET</span>
                          <span>Rp {reports.totalAssets.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Liabilities & Equities */}
                    <div>
                      <h5 className="border-b-2 border-sky-500 pb-2 text-sky-400 font-extrabold text-sm tracking-wider uppercase mb-4">PASSIVA (KEWAJIBAN & EKUITAS)</h5>
                      
                      <strong className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Kewajiban</strong>
                      <div className="space-y-3 mb-6">
                        {coaAccounts.filter(a => a.type === "kewajiban").map(acc => (
                          <div key={acc.code} className="flex justify-between text-sm">
                            <span className="text-slate-300">{acc.name}</span>
                            <span className="font-mono">Rp {acc.balance.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-semibold text-slate-300 border-t border-slate-800/50 pt-2 text-sm">
                          <span>Total Kewajiban</span>
                          <span>Rp {reports.totalLiabilities.toLocaleString()}</span>
                        </div>
                      </div>

                      <strong className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Ekuitas</strong>
                      <div className="space-y-3">
                        {coaAccounts.filter(a => a.type === "ekuitas").map(acc => (
                          <div key={acc.code} className="flex justify-between text-sm">
                            <span className="text-slate-300">{acc.name}</span>
                            <span className="font-mono">Rp {acc.balance.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-semibold text-slate-300 border-t border-slate-800/50 pt-2 text-sm">
                          <span>Total Ekuitas</span>
                          <span>Rp {reports.totalEquity.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex justify-between font-bold text-white border-t border-slate-800 pt-3 mt-6 text-base">
                        <span>TOTAL PASSIVA</span>
                        <span>Rp {(reports.totalLiabilities + reports.totalEquity).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 border-t border-slate-800/80 pt-6 flex justify-between items-center print:hidden">
                    <div>
                      {reports.balanced ? (
                        <span className="text-emerald-400 font-bold text-sm">🟢 Seimbang (Balanced)</span>
                      ) : (
                        <span className="text-rose-400 font-bold text-sm">🔴 Tidak Seimbang (Unbalanced)</span>
                      )}
                    </div>
                    <Button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-700 text-white">
                      Cetak Laporan
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="labarugi">
                <Card className="glass-panel text-white border-slate-800/80 p-8">
                  <div className="text-center mb-10">
                    <h3 className="text-2xl font-black tracking-tight text-white mb-1">KOPERASI MAJU BERSAMA</h3>
                    <h4 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-1">LAPORAN LABA RUGI (SHU)</h4>
                    <p className="text-xs text-slate-500">Periode 01 Jan - 30 Juni 2026 • SAK EP Standard</p>
                  </div>

                  <div className="max-w-xl mx-auto space-y-8">
                    <div>
                      <h5 className="border-b-2 border-emerald-500 pb-2 text-emerald-400 font-extrabold text-sm tracking-wider uppercase mb-4">PENDAPATAN</h5>
                      <div className="space-y-3">
                        {coaAccounts.filter(a => a.type === "pendapatan").map(acc => (
                          <div key={acc.code} className="flex justify-between text-sm">
                            <span className="text-slate-300">{acc.name}</span>
                            <span className="font-mono">Rp {acc.balance.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold text-white border-t border-slate-800 pt-3 mt-3">
                          <span>TOTAL PENDAPATAN</span>
                          <span>Rp {reports.totalRevenue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="border-b-2 border-rose-500 pb-2 text-rose-400 font-extrabold text-sm tracking-wider uppercase mb-4">BEBAN OPERASIONAL</h5>
                      <div className="space-y-3">
                        {coaAccounts.filter(a => a.type === "beban").map(acc => (
                          <div key={acc.code} className="flex justify-between text-sm">
                            <span className="text-slate-300">{acc.name}</span>
                            <span className="font-mono">Rp {acc.balance.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold text-white border-t border-slate-800 pt-3 mt-3">
                          <span>TOTAL BEBAN</span>
                          <span>Rp {reports.totalExpense.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t-2 border-slate-600 pt-6 mt-8">
                      <div className="flex justify-between font-bold text-lg mb-2">
                        <span>SHU Kotor</span>
                        <span>Rp {reports.shuKotor.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-sm mb-2">
                        <span>Pajak (10%)</span>
                        <span>Rp {reports.tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-extrabold text-xl text-emerald-400">
                        <span>SHU Bersih</span>
                        <span>Rp {reports.shuBersih.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 border-t border-slate-800/80 pt-6 flex justify-end print:hidden">
                    <Button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-700 text-white">
                      Cetak Laporan
                    </Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {activeTab === "feasibility" && (
          <div>
            <header className="mb-10 print:hidden">
              <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Analisis Kelayakan Bisnis</h2>
              <p className="text-slate-400 text-sm">Hitung proyeksi investasi dan kelayakan menggunakan indikator ENPV, EIRR, dan EBCR.</p>
            </header>

            <Tabs value={feasibilityActiveTab} onValueChange={(val) => setFeasibilityActiveTab(val as any)} className="w-full">
              <TabsList className="bg-slate-900 border border-slate-800 text-slate-400 p-1 rounded-xl mb-6 print:hidden">
                <TabsTrigger value="calculator" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 font-bold px-4 py-2 rounded-lg">Kalkulator Kelayakan</TabsTrigger>
                <TabsTrigger value="sensitivity" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 font-bold px-4 py-2 rounded-lg">Analisis Sensitivitas</TabsTrigger>
              </TabsList>

              <TabsContent value="calculator">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Parameter Entry Card */}
                  <Card className="glass-panel text-white border-slate-800/80">
                    <CardHeader>
                      <CardTitle className="text-white text-base">Parameter Proyeksi Investasi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label>Investasi Awal (Rp)</label>
                        <Input
                          type="number"
                          value={feasibilityParams.initialInvestment}
                          onChange={(e) => setFeasibilityParams({ ...feasibilityParams, initialInvestment: Number(e.target.value) })}
                          className="bg-slate-950 border-slate-800"
                        />
                      </div>
                      <div>
                        <label>Tahun Proyeksi</label>
                        <Select value={String(feasibilityParams.projectionYears)} onValueChange={(val) => setFeasibilityParams({ ...feasibilityParams, projectionYears: Number(val) })}>
                          <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-950 border-slate-800 text-white">
                            <SelectItem value="3">3 Tahun</SelectItem>
                            <SelectItem value="5">5 Tahun</SelectItem>
                            <SelectItem value="10">10 Tahun</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label>Arus Kas Masuk Bersih (Pisahkan dengan koma)</label>
                        <Input
                          type="text"
                          value={feasibilityParams.cashFlows}
                          onChange={(e) => setFeasibilityParams({ ...feasibilityParams, cashFlows: e.target.value })}
                          className="bg-slate-950 border-slate-800"
                        />
                        <span className="text-slate-500 text-xs mt-1 block">Contoh: 18000000,22000000,25000000,28000000,30000000</span>
                      </div>
                      <div>
                        <label>Discount Rate (%)</label>
                        <Input
                          type="number"
                          step={0.1}
                          value={feasibilityParams.discountRate}
                          onChange={(e) => setFeasibilityParams({ ...feasibilityParams, discountRate: Number(e.target.value) })}
                          className="bg-slate-950 border-slate-800"
                        />
                      </div>
                      <div>
                        <label>Opportunity Cost (%)</label>
                        <Input
                          type="number"
                          step={0.1}
                          value={feasibilityParams.opportunityCost}
                          onChange={(e) => setFeasibilityParams({ ...feasibilityParams, opportunityCost: Number(e.target.value) })}
                          className="bg-slate-950 border-slate-800"
                        />
                      </div>
                      <Button onClick={calculateFeasibility} className="w-full bg-emerald-500 hover:bg-emerald-600 mt-2">
                        Hitung Kelayakan
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Calculations breakdown Card */}
                  <Card className="glass-panel text-white border-slate-800/80">
                    <CardHeader>
                      <CardTitle className="text-white text-base">Hasil Kelayakan Finansial</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {feasibilityResults ? (
                        <div className="space-y-6">
                          <div className={`text-center p-6 rounded-xl border ${feasibilityResults.tierColor === "green" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : feasibilityResults.tierColor === "amber" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"}`}>
                            <span className="text-xs uppercase font-semibold text-slate-400">Rekomendasi</span>
                            <h3 className="text-2xl font-bold my-1">{feasibilityResults.tierLabel}</h3>
                            <span className="text-xs text-slate-400">Tier Kelayakan: <strong>Tier {feasibilityResults.tier}</strong></span>
                          </div>

                          <div className="space-y-4 font-mono text-sm">
                            <div className="flex justify-between border-b border-slate-800 pb-2">
                              <span className="text-slate-400">Economic NPV (ENPV)</span>
                              <span className="font-bold text-white">
                                Rp {Math.round(feasibilityResults.enpv).toLocaleString()} &nbsp;
                                {feasibilityResults.isNPVPass ? "✅" : "❌"}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-2">
                              <span className="text-slate-400">Internal Rate (EIRR)</span>
                              <span className="font-bold text-white">
                                {feasibilityResults.eirr.toFixed(2)}% &nbsp;
                                {feasibilityResults.isIRRPass ? "✅" : "❌"}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-2">
                              <span className="text-slate-400">Benefit-Cost Ratio (EBCR)</span>
                              <span className="font-bold text-white">
                                {feasibilityResults.ebcr.toFixed(2)} &nbsp;
                                {feasibilityResults.isBCRPass ? "✅" : "❌"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-slate-500 py-12">
                          Silakan isi form parameter investasi dan klik tombol hitung kelayakan.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="sensitivity">
                <Card className="glass-panel text-white border-slate-800/80">
                  <CardHeader className="border-b border-slate-850 pb-4 print:hidden">
                    <div className="flex gap-2">
                      <Button onClick={() => handleSensitivityScenarioChange("optimis")} className={`shadow-none ${sensitivityScenario === "optimis" ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-800 hover:bg-slate-700 text-white"}`}>
                        Optimis (+15% Arus Kas)
                      </Button>
                      <Button onClick={() => handleSensitivityScenarioChange("moderat")} className={`shadow-none ${sensitivityScenario === "moderat" ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-800 hover:bg-slate-700 text-white"}`}>
                        Moderat (Base Case)
                      </Button>
                      <Button onClick={() => handleSensitivityScenarioChange("pesimis")} className={`shadow-none ${sensitivityScenario === "pesimis" ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-800 hover:bg-slate-700 text-white"}`}>
                        Pesimis (-30% Gagal Panen)
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {sensitivityPresetResults ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-base font-bold capitalize text-sky-400 mb-2">Skenario: {sensitivityScenario}</h4>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {sensitivityScenario === "optimis" && "Variabel cuaca dan fluktuasi komoditas stabil, hasil unit usaha diproyeksikan tumbuh 15%."}
                            {sensitivityScenario === "moderat" && "Base Case proyeksi awal tanpa modifikasi variabel eksternal."}
                            {sensitivityScenario === "pesimis" && "Gagal panen, perubahan iklim, dan fluktuasi harga komoditas menekan arus kas masuk sebesar 30%."}
                          </p>
                        </div>
                        <div className="border-l border-slate-850 pl-6 space-y-4 font-mono text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Investasi Awal</span>
                            <span>Rp {Math.round(sensitivityPresetResults.investment).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Hasil ENPV</span>
                            <span style={{ color: sensitivityPresetResults.enpv > 0 ? "#34d399" : "#fb7185" }}>
                              Rp {Math.round(sensitivityPresetResults.enpv).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Hasil EIRR</span>
                            <span>{sensitivityPresetResults.eirr.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Hasil EBCR</span>
                            <span>{sensitivityPresetResults.ebcr.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Hasil Rekomendasi</span>
                            <span className="font-bold text-white">{sensitivityPresetResults.tierLabel}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-slate-500 py-12">
                        Hitung kelayakan proyeksi awal (Kalkulator Kelayakan) terlebih dahulu untuk mengaktifkan skenario.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {activeTab === "sync" && (
          <div>
            <header className="mb-10 print:hidden">
              <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Sinkronisasi Jaringan</h2>
              <p className="text-slate-400 text-sm">Aggregasi data berjenjang dari Desa KDKMP ke Kabupaten/Provinsi secara offline-first.</p>
            </header>

            <Card className="glass-panel text-white border-slate-800/80 mb-8">
              <CardHeader>
                <CardTitle className="text-white text-base">Manual Sinkronisasi</CardTitle>
                <CardDescription className="text-slate-400">
                  Target Server Node Kabupaten: <strong>{syncServerUrl}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <Button onClick={handleSyncNow} disabled={isSyncing} className="bg-emerald-500 hover:bg-emerald-600">
                  {isSyncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}
                </Button>
                {syncProgress && <span className="text-sky-400 text-sm font-semibold">{syncProgress}</span>}
              </CardContent>
            </Card>

            <Card className="glass-panel text-white border-slate-800/80">
              <CardHeader>
                <CardTitle className="text-slate-400 text-sm font-semibold uppercase">Riwayat Sinkronisasi Lokal</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader className="border-slate-800">
                    <TableRow className="border-slate-800 text-slate-400 hover:bg-transparent">
                      <TableHead>Tanggal Selesai</TableHead>
                      <TableHead>Aliran Transaksi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Jumlah Entri</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncHistoryList.map((hist) => (
                      <TableRow key={hist.id} className="border-slate-800/40 hover:bg-slate-850/10">
                        <TableCell>{hist.completed_at}</TableCell>
                        <TableCell className="capitalize">{hist.direction}</TableCell>
                        <TableCell>
                          <span className={`font-semibold ${hist.status === "success" ? "text-emerald-400" : "text-rose-400"}`}>
                            {hist.status === "success" ? "Berhasil" : "Gagal"}
                          </span>
                        </TableCell>
                        <TableCell>{hist.entity_count} entri</TableCell>
                      </TableRow>
                    ))}
                    {syncHistoryList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-slate-500">
                          Belum ada riwayat sinkronisasi.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <header className="mb-10 print:hidden">
              <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Pengaturan Cockpit</h2>
              <p className="text-slate-400 text-sm">Sesuaikan preferensi desktop app, keamanan PIN, dan pembaruan OTA.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Profile setup card */}
              <form className="glass-panel text-white border-slate-800/80 rounded-2xl p-6 md:col-span-2" onSubmit={handleSaveProfile}>
                <h4 className="text-base font-bold text-white border-b border-slate-850 pb-3 mb-4">Profil Pengurus Koperasi</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label>Nama Koperasi</label>
                    <Input type="text" value={coopProfile.name} onChange={(e) => handleProfileFieldChange("name", e.target.value)} className="bg-slate-950 border-slate-800" />
                  </div>
                  <div>
                    <label>No. Legal Badan Hukum</label>
                    <Input type="text" value={coopProfile.legal_id} onChange={(e) => handleProfileFieldChange("legal_id", e.target.value)} className="bg-slate-950 border-slate-800" />
                  </div>
                  <div>
                    <label>Nama Ketua</label>
                    <Input
                      type="text"
                      value={JSON.parse(coopProfile.officers || "{}").chairman || ""}
                      onChange={(e) => {
                        const parsed = JSON.parse(coopProfile.officers || "{}");
                        parsed.chairman = e.target.value;
                        handleProfileFieldChange("officers", JSON.stringify(parsed));
                      }}
                      className="bg-slate-950 border-slate-800"
                    />
                  </div>
                  <div>
                    <label>Nama Sekretaris</label>
                    <Input
                      type="text"
                      value={JSON.parse(coopProfile.officers || "{}").secretary || ""}
                      onChange={(e) => {
                        const parsed = JSON.parse(coopProfile.officers || "{}");
                        parsed.secretary = e.target.value;
                        handleProfileFieldChange("officers", JSON.stringify(parsed));
                      }}
                      className="bg-slate-950 border-slate-800"
                    />
                  </div>
                  <div>
                    <label>Nama Bendahara</label>
                    <Input
                      type="text"
                      value={JSON.parse(coopProfile.officers || "{}").treasurer || ""}
                      onChange={(e) => {
                        const parsed = JSON.parse(coopProfile.officers || "{}");
                        parsed.treasurer = e.target.value;
                        handleProfileFieldChange("officers", JSON.stringify(parsed));
                      }}
                      className="bg-slate-950 border-slate-800"
                    />
                  </div>
                  <div>
                    <label>Nama Pengawas (Auditor)</label>
                    <Input
                      type="text"
                      value={JSON.parse(coopProfile.officers || "{}").supervisor || ""}
                      onChange={(e) => {
                        const parsed = JSON.parse(coopProfile.officers || "{}");
                        parsed.supervisor = e.target.value;
                        handleProfileFieldChange("officers", JSON.stringify(parsed));
                      }}
                      className="bg-slate-950 border-slate-800"
                    />
                  </div>
                </div>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 mt-6">Simpan Profil</Button>
              </form>

              {/* Keamanan PIN */}
              <Card className="glass-panel text-white border-slate-800/80">
                <CardHeader>
                  <CardTitle className="text-white text-base">Keamanan PIN Akses</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePinChangeSubmit} className="space-y-4">
                    <div>
                      <label>PIN Lama</label>
                      <Input type="password" name="oldPin" maxLength={6} required className="bg-slate-950 border-slate-800" />
                    </div>
                    <div>
                      <label>PIN Baru</label>
                      <Input type="password" name="newPin" maxLength={6} required className="bg-slate-950 border-slate-800" />
                    </div>
                    <div>
                      <label>Konfirmasi PIN Baru</label>
                      <Input type="password" name="confirmPin" maxLength={6} required className="bg-slate-950 border-slate-800" />
                    </div>
                    <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600">Perbarui PIN</Button>
                  </form>
                </CardContent>
              </Card>

              {/* Pembaruan updates */}
              <Card className="glass-panel text-white border-slate-800/80">
                <CardHeader>
                  <CardTitle className="text-white text-base">Pembaruan Sistem OTA</CardTitle>
                  <CardDescription className="text-slate-400">
                    Memeriksa rilis KDKMP terbaru di GitHub.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={checkUpdateCenter} disabled={isUpdateChecking} className="w-full bg-emerald-500 hover:bg-emerald-600">
                    {isUpdateChecking ? "Checking..." : "Periksa Pembaruan Sekarang"}
                  </Button>
                  {updateStatusText && <span className="text-emerald-400 text-sm font-semibold block text-center">{updateStatusText}</span>}
                </CardContent>
              </Card>

              {/* Theme preference settings */}
              <Card className="glass-panel text-white border-slate-800/80 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white text-base">Preferensi Tampilan</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label>Tema Warna</label>
                    <Select value={appTheme} onValueChange={(val) => setAppTheme(val as any)}>
                      <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-800 text-white">
                        <SelectItem value="dark">🌙 Mode Gelap</SelectItem>
                        <SelectItem value="light">☀️ Mode Terang</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label>Ukuran Font</label>
                    <Select value={fontSizeSetting} onValueChange={(val) => setFontSizeSetting(val as any)}>
                      <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-800 text-white">
                        <SelectItem value="normal">Normal (Disarankan)</SelectItem>
                        <SelectItem value="large">Besar (Untuk Membaca Lebih Mudah)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
