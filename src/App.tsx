import { useState, useEffect } from "react";
import { initDb, getDb } from "./db";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { ToastProvider, useToast } from "@/hooks/useToast";

// Import Lucide Icons
import {
  LayoutDashboard,
  Users,
  Receipt,
  TrendingUp,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Bell,
  Plus,
  Trash2,
  Edit2,
  CalendarDays,
  Database,
  UserCheck,
  Info,
} from "lucide-react";

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

function AppContent() {
  // Navigation & Core States
  const [appState, setAppState] = useState<"splash" | "main" | "db_error">("splash");
  const [dbErrorMessage, setDbErrorMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);

  // Download Progress States
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadContentLength, setDownloadContentLength] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);

  // Dashboard Data States
  const [activeTab, setActiveTab] = useState<"home" | "members" | "accounting" | "feasibility" | "sync" | "settings">(
    "home",
  );
  const [coopProfile, setCoopProfile] = useState<any>({
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

  const toast = useToast();

  // Database Initialization Hook
  useEffect(() => {
    async function loadDatabase() {
      try {
        await initDb();
        // Skip setup/login wizard screens - load main panel directly
        setCurrentUser({ id: "usr-001", name: "Slamet Riyadi", role: "Ketua Koperasi" });
        setAppState("main");
      } catch (err: any) {
        console.error(err);
        setDbErrorMessage(err.message || String(err));
        setAppState("db_error");
      }
    }
    setTimeout(loadDatabase, 800);
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadLedgerData is intentionally not memoized in this prototype
  }, [appState]);

  // General Ledger Update Hook when selection changes
  useEffect(() => {
    if (appState === "main") {
      loadLedgerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadLedgerData is intentionally not memoized in this prototype
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
          [entry.id],
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
        [ledgerSelectedCode],
      );

      let debSum = 0;
      let credSum = 0;
      for (const line of lines) {
        debSum += line.debit;
        credSum += line.credit;
      }

      const accInfo = await db.select<any[]>("SELECT normal_balance FROM coa_accounts WHERE code = ?", [
        ledgerSelectedCode,
      ]);
      const normalBal = accInfo.length > 0 ? accInfo[0].normal_balance : "debit";

      const netActivity = normalBal === "debit" ? debSum - credSum : credSum - debSum;
      const balanceStart = balanceEnd - netActivity;
      setLedgerBalanceStart(balanceStart);

      let running = balanceStart;
      const computedLines = lines.map((line) => {
        const change = normalBal === "debit" ? line.debit - line.credit : line.credit - line.debit;
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
        ],
      );
      toast.success("Profil Koperasi berhasil disimpan!");
      loadProfileData();
    } catch (err) {
      toast.error(`Gagal menyimpan profil: ${err}`);
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
      toast.error("Error: NIK harus 16 digit.");
      return;
    }
    if (!memberFormValues.name.trim()) {
      toast.error("Error: Nama harus diisi.");
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
          ],
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
          ],
        );
      }
      setShowMemberModal(false);
      loadMembersData();
    } catch (err: any) {
      toast.error(`Gagal menyimpan anggota: ${err.message || err}`);
    }
  };

  const handleDeleteMember = async (member: Member) => {
    if (member.loan_outstanding > 0) {
      toast.error("Error: Tidak dapat menghapus anggota dengan pinjaman aktif.");
      return;
    }
    const yes = await toast.confirm(`Apakah Anda yakin ingin menghapus anggota ${member.name}?`);
    if (!yes) return;

    try {
      const db = await getDb();
      await db.execute("DELETE FROM members WHERE id = ?", [member.id]);
      loadMembersData();
    } catch (err) {
      toast.error(`Gagal menghapus anggota: ${err}`);
    }
  };

  // SAK EP Accounting
  const handleCreateCoaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoaValues.code || !newCoaValues.name) {
      toast.error("Error: Kode dan Nama Akun harus diisi.");
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
        ],
      );
      setShowCoaModal(false);
      loadAccountsData();
    } catch (err: any) {
      toast.error(`Gagal menambah akun: ${err.message || err}`);
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
      toast.error("Error: Nomor Bukti dan Keterangan harus diisi.");
      return;
    }

    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of journalForm.lines) {
      totalDebit += Number(line.debit || 0);
      totalCredit += Number(line.credit || 0);
    }

    if (totalDebit !== totalCredit) {
      toast.error(`Error: Jurnal tidak seimbang. Selisih: Rp ${Math.abs(totalDebit - totalCredit).toLocaleString()}`);
      return;
    }
    if (totalDebit === 0) {
      toast.error("Error: Jumlah transaksi tidak boleh Rp 0.");
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
        ],
      );

      for (const line of journalForm.lines) {
        const lineId = `jl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        await db.execute(
          `INSERT INTO journal_lines (id, journal_entry_id, account_code, debit, credit)
           VALUES (?, ?, ?, ?, ?)`,
          [lineId, newEntryId, line.accountCode, Number(line.debit), Number(line.credit)],
        );

        const account = await db.select<any[]>("SELECT normal_balance, balance FROM coa_accounts WHERE code = ?", [
          line.accountCode,
        ]);
        if (account.length > 0) {
          const norm = account[0].normal_balance;
          const currentBal = account[0].balance;
          const delta =
            norm === "debit" ? Number(line.debit) - Number(line.credit) : Number(line.credit) - Number(line.debit);
          const updatedBal = currentBal + delta;

          await db.execute("UPDATE coa_accounts SET balance = ? WHERE code = ?", [updatedBal, line.accountCode]);
        }
      }

      toast.success("Transaksi Jurnal berhasil disimpan!");
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
      toast.error(`Gagal menyimpan transaksi: ${err.message || err}`);
    }
  };

  // Financial calculations
  const calculateFeasibility = () => {
    const { initialInvestment, projectionYears, cashFlows, discountRate } = feasibilityParams;
    const rate = Number(discountRate) / 100;
    const flows = cashFlows.split(",").map(Number);

    if (flows.length !== Number(projectionYears)) {
      toast.error("Error: Jumlah elemen arus kas tidak sesuai dengan Tahun Proyeksi.");
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
        sum += (-(t + 1) * flows[t]) / Math.pow(1 + r, t + 2);
      }
      return sum;
    };

    let eirr = 0.1;
    let iterations = 0;
    const error = 1e-6;
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
      tierLabel = "Layak Proyeksi";
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
        sum += (-(t + 1) * adjustedFlows[t]) / Math.pow(1 + r, t + 2);
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
    setSyncProgress("Menghubungkan ke API server node Mojokerto...");

    setTimeout(() => {
      setSyncProgress("Mengunggah log transaksi jurnal & anggota baru...");

      setTimeout(async () => {
        setSyncProgress("Singkronisasi parameter rasio EWS kabupaten...");

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

  // OTA Updates
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

        let bytesDownloaded = 0;
        let size = 0;

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
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1e-2,
    };
  };

  const reports = getAccountingReports();

  // Filtered members list
  const filteredMembers = membersList.filter((mbr) => {
    const matchesSearch =
      mbr.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) || mbr.nik.includes(memberSearchQuery);
    const matchesFilter = memberFilterStatus === "semua" || mbr.status === memberFilterStatus;
    return matchesSearch && matchesFilter;
  });

  // Splash view
  if (appState === "splash") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#070b14] text-white text-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
            <div className="relative text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent px-6 py-2 border-[0.5px] border-emerald-500/30 rounded-2xl bg-emerald-950/20">
              KDKMP
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-wider text-slate-200">COCKPIT PANEL</h2>
            <p className="text-slate-500 text-xs font-mono">SQLite Local Node Initialization</p>
          </div>
          <div className="w-40 bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-800/40">
            <div className="bg-emerald-500 h-full w-2/3 animate-[pulse_1.5s_infinite] rounded-full"></div>
          </div>
        </div>
        <p className="absolute bottom-8 text-slate-600 font-mono text-[10px]">VER 0.5.0 • SAK EP COMPLIANT</p>
      </div>
    );
  }

  // Database Connection failure screen
  if (appState === "db_error") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#070b14] text-white">
        <div className="w-full max-w-md p-8 bg-slate-950 border border-rose-500/30 rounded-2xl shadow-2xl text-center">
          <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-rose-500 mb-1">Koneksi Database Gagal</h2>
          <p className="text-slate-400 text-xs mb-6">
            Sistem tidak dapat membaca database internal SQLite. Coba jalankan ulang aplikasi.
          </p>
          <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl text-rose-400 text-left font-mono text-[11px] mb-6 overflow-x-auto">
            <code>{dbErrorMessage}</code>
          </div>
          <Button variant="destructive" className="w-full" onClick={() => window.location.reload()}>
            Muat Ulang
          </Button>
        </div>
      </div>
    );
  }

  // Dashboard Main Panel layout
  return (
    <div
      className={`app-container flex min-h-screen text-slate-300 bg-[#070b14] ${appTheme} font-${fontSizeSetting} antialiased`}
    >
      {/* Sleek Enterprise Sidebar */}
      <aside className="w-64 border-r border-slate-900 bg-[#090e1a]/95 flex flex-col justify-between print:hidden">
        <div>
          {/* Brand Header */}
          <div className="px-6 py-6 border-b border-slate-900 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black tracking-widest text-emerald-400">KDKMP</span>
              <span className="text-xs font-mono text-slate-500">|</span>
              <span className="text-xs font-mono text-slate-300">DOMAS</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-[pulse_2s_infinite]"></span>
              <span className="text-[10px] font-mono text-slate-400">Connected to local.db</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 text-xs font-semibold ${activeTab === "home" ? "bg-emerald-500/10 text-emerald-400 border-[0.5px] border-emerald-500/20" : "text-slate-400 hover:bg-slate-900/50 hover:text-white"}`}
              onClick={() => setActiveTab("home")}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Beranda Utama</span>
            </div>
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 text-xs font-semibold ${activeTab === "members" ? "bg-emerald-500/10 text-emerald-400 border-[0.5px] border-emerald-500/20" : "text-slate-400 hover:bg-slate-900/50 hover:text-white"}`}
              onClick={() => setActiveTab("members")}
            >
              <Users className="h-4 w-4" />
              <span>Database Anggota</span>
            </div>
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 text-xs font-semibold ${activeTab === "accounting" ? "bg-emerald-500/10 text-emerald-400 border-[0.5px] border-emerald-500/20" : "text-slate-400 hover:bg-slate-900/50 hover:text-white"}`}
              onClick={() => setActiveTab("accounting")}
            >
              <Receipt className="h-4 w-4" />
              <span>Akuntansi SAK EP</span>
            </div>
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 text-xs font-semibold ${activeTab === "feasibility" ? "bg-emerald-500/10 text-emerald-400 border-[0.5px] border-emerald-500/20" : "text-slate-400 hover:bg-slate-900/50 hover:text-white"}`}
              onClick={() => setActiveTab("feasibility")}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Kelayakan Finansial</span>
            </div>
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 text-xs font-semibold ${activeTab === "sync" ? "bg-emerald-500/10 text-emerald-400 border-[0.5px] border-emerald-500/20" : "text-slate-400 hover:bg-slate-900/50 hover:text-white"}`}
              onClick={() => setActiveTab("sync")}
            >
              <RefreshCw className="h-4 w-4 text-slate-400" />
              <span>Sinkronisasi</span>
            </div>
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 text-xs font-semibold ${activeTab === "settings" ? "bg-emerald-500/10 text-emerald-400 border-[0.5px] border-emerald-500/20" : "text-slate-400 hover:bg-slate-900/50 hover:text-white"}`}
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="h-4 w-4 text-slate-400" />
              <span>Pengaturan</span>
            </div>
          </nav>
        </div>

        {/* User Card inside Sidebar */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold font-mono">
              SR
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-slate-200 truncate">{currentUser?.name}</div>
              <div className="text-[10px] text-slate-500 font-mono truncate">{currentUser?.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Control Panel Header */}
        <header className="h-16 border-b border-slate-900 bg-[#090e1a]/40 px-8 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
              {activeTab === "home" && "Dashboard Monitoring"}
              {activeTab === "members" && "KDKMP Members Registry"}
              {activeTab === "accounting" && `SAK EP Ledger • ${accountingTab.toUpperCase()}`}
              {activeTab === "feasibility" && "Economic Feasibility Calculations"}
              {activeTab === "sync" && "Offline-First Sync Panel"}
              {activeTab === "settings" && "System Settings"}
            </span>
          </div>

          <div className="flex items-center gap-6">
            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <UserCheck className="h-4 w-4 text-emerald-400" />
              <span>Node Admin: Slamet R.</span>
            </div>

            <div className="h-4 w-[1px] bg-slate-900"></div>

            {/* Notifications Button */}
            <div className="relative cursor-pointer text-slate-400 hover:text-white">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1.5 -right-1.5 h-2 w-2 rounded-full bg-amber-500"></span>
            </div>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 p-8 overflow-y-auto w-full">
          {activeTab === "home" && (
            <div className="space-y-6">
              {/* Monitoring dials grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-[#0b101c]/90 border border-slate-900 shadow-md">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex justify-between items-center text-slate-500 text-[10px] font-mono font-bold tracking-wider uppercase mb-1">
                      <span>Rasio Solvabilitas</span>
                      <span className="text-emerald-400">92%</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-white">4.82x</div>
                    <div className="text-[10px] text-emerald-400 mt-1 font-mono">▲ Optimal (+0.12)</div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0b101c]/90 border border-slate-900 shadow-md">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex justify-between items-center text-slate-500 text-[10px] font-mono font-bold tracking-wider uppercase mb-1">
                      <span>Rasio Likuiditas</span>
                      <span className="text-emerald-400">89%</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-white">2.15x</div>
                    <div className="text-[10px] text-emerald-400 mt-1 font-mono">▲ Sehat (+0.04)</div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0b101c]/90 border border-slate-900 shadow-md">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex justify-between items-center text-slate-500 text-[10px] font-mono font-bold tracking-wider uppercase mb-1">
                      <span>Rasio Kas SHU</span>
                      <span className="text-emerald-400">95%</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-white">18.4%</div>
                    <div className="text-[10px] text-emerald-400 mt-1 font-mono">▲ Bertumbuh</div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0b101c]/90 border border-slate-900 shadow-md">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex justify-between items-center text-slate-500 text-[10px] font-mono font-bold tracking-wider uppercase mb-1">
                      <span>Total Aset</span>
                      <span className="text-emerald-400">Aktif</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-white">
                      Rp {reports.totalAssets.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">SAK EP Compliant</div>
                  </CardContent>
                </Card>
              </div>

              {/* RAG Status Strip */}
              <div className="flex items-center justify-between bg-emerald-950/10 border-[0.5px] border-emerald-500/20 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">
                      Status Kesehatan Finansial: SEHAT (🟢 RAG Green)
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Seluruh indikator likuiditas, kecukupan modal, dan rasio piutang bermasalah di bawah ambang batas.
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs font-semibold text-emerald-400 bg-emerald-500/5 px-3 py-1 rounded border border-emerald-500/10 shrink-0">
                  Skor Indeks: {coopProfile.health_score} / 100
                </div>
              </div>

              {/* Early Warning system Alerts */}
              {ewsAlertsList.length > 0 && (
                <Card className="bg-[#0b101c]/90 border border-slate-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Peringatan Dini Aktif (EWS)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {ewsAlertsList.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex gap-3 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10"
                      >
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-amber-500">{alert.message}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Saran: {alert.suggested_action}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Dashboard Chart & Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Visual trends */}
                <Card className="bg-[#0b101c]/90 border border-slate-900 md:col-span-2 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Performa Keuangan Semester I
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="h-48 flex items-end justify-between px-2 pt-6">
                      {dashboardIncomeData.map((data, idx) => {
                        const maxVal = 100000000;
                        const incHeight = (data.income / maxVal) * 130;
                        const expHeight = (data.expense / maxVal) * 130;

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                            <div className="flex items-end justify-center gap-1.5 h-[130px] w-full border-b border-slate-800/40 pb-1">
                              <div
                                style={{ height: `${incHeight}px` }}
                                className="w-3 bg-emerald-500 rounded-t-sm transition-all duration-500 hover:brightness-110"
                                title={`Pendapatan: Rp ${data.income.toLocaleString()}`}
                              ></div>
                              <div
                                style={{ height: `${expHeight}px` }}
                                className="w-3 bg-rose-500/60 rounded-t-sm transition-all duration-500 hover:brightness-110"
                                title={`Beban: Rp ${data.expense.toLocaleString()}`}
                              ></div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{data.month}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-4 text-[10px] font-mono text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-sm bg-emerald-500"></span>
                        <span>Total SHU (Pendapatan)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-sm bg-rose-500/60"></span>
                        <span>Beban Usaha</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Profile Summary Card */}
                <Card className="bg-[#0b101c]/90 border border-slate-900 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Informasi Koperasi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Badan Hukum</span>
                      <p className="text-xs font-semibold text-slate-200">{coopProfile.legal_id}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Alamat Node</span>
                      <p className="text-xs font-semibold text-slate-200">
                        Desa {coopProfile.village}, {coopProfile.district}, {coopProfile.regency}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Unit Bisnis Aktif</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {JSON.parse(coopProfile.business_units || "[]").map((unit: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 px-2 py-0.5 border border-emerald-500/10 rounded"
                          >
                            {unit.replace("unit_", "").toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "members" && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 print:hidden">
                <div className="flex gap-2 flex-1 max-w-xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="text"
                      placeholder="Cari berdasarkan nama atau NIK anggota..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="pl-9 bg-[#0b101c]/60 border-slate-900 text-xs text-white"
                    />
                  </div>
                  <Select value={memberFilterStatus} onValueChange={setMemberFilterStatus}>
                    <SelectTrigger className="w-44 bg-[#0b101c]/60 border-slate-900 text-xs text-slate-300">
                      <SelectValue placeholder="Status Keanggotaan" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0b101c] border-slate-900 text-xs text-white">
                      <SelectItem value="semua">Semua Status</SelectItem>
                      <SelectItem value="aktif">Status Aktif</SelectItem>
                      <SelectItem value="nonaktif">Status Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={openAddMemberModal}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9"
                >
                  <Plus className="h-4 w-4 mr-1 text-slate-950" /> Tambah Anggota
                </Button>
              </div>

              {/* Members Table */}
              <Card className="bg-[#0b101c]/90 border border-slate-900 overflow-hidden shadow-md">
                <Table>
                  <TableHeader className="bg-slate-950/40 border-slate-900">
                    <TableRow className="border-slate-900 hover:bg-transparent">
                      <TableHead className="text-slate-500 font-mono text-[10px] font-bold uppercase tracking-wider">
                        Nama Lengkap
                      </TableHead>
                      <TableHead className="text-slate-500 font-mono text-[10px] font-bold uppercase tracking-wider">
                        NIK
                      </TableHead>
                      <TableHead className="text-slate-500 font-mono text-[10px] font-bold uppercase tracking-wider">
                        Alamat
                      </TableHead>
                      <TableHead className="text-slate-500 font-mono text-[10px] font-bold uppercase tracking-wider">
                        Total Simpanan
                      </TableHead>
                      <TableHead className="text-slate-500 font-mono text-[10px] font-bold uppercase tracking-wider">
                        Outstanding Pinjaman
                      </TableHead>
                      <TableHead className="text-slate-500 font-mono text-[10px] font-bold uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="text-slate-500 font-mono text-[10px] font-bold uppercase tracking-wider text-right print:hidden">
                        Operasi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((mbr) => {
                      const totalSavings = mbr.savings_pokok + mbr.savings_wajib + mbr.savings_sukarela;
                      return (
                        <TableRow key={mbr.id} className="border-slate-900 hover:bg-slate-900/10">
                          <TableCell className="font-semibold text-slate-200 text-xs">{mbr.name}</TableCell>
                          <TableCell className="font-mono text-slate-400 text-xs">{mbr.nik}</TableCell>
                          <TableCell className="text-xs text-slate-400">
                            Rt. {mbr.rt} / Rw. {mbr.rw} - {mbr.hamlet}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-300">
                            Rp {totalSavings.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-300">
                            Rp {mbr.loan_outstanding.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${mbr.status === "aktif" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-rose-500/10 text-rose-400 border border-rose-500/15"}`}
                            >
                              {mbr.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right print:hidden">
                            <div className="flex gap-1.5 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditMemberModal(mbr)}
                                className="h-7 w-7 p-0 border-slate-900 bg-slate-950/20 hover:bg-slate-800 text-slate-300"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteMember(mbr)}
                                className="h-7 w-7 p-0 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-none"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredMembers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs font-mono">
                          Tidak ada data anggota ditemukan.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>

              {/* Member Modification Dialog */}
              <Dialog open={showMemberModal} onOpenChange={setShowMemberModal}>
                <DialogContent className="bg-[#0b101c] border-slate-900 text-slate-100 max-w-2xl overflow-y-auto max-h-[85vh]">
                  <DialogHeader className="border-b border-slate-900 pb-3">
                    <DialogTitle className="text-sm font-bold font-mono tracking-wider uppercase text-slate-300">
                      {memberFormType === "add" ? "Registrasi Anggota Baru" : "Update Profil Anggota"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleMemberFormSubmit} className="space-y-6 pt-4 text-xs">
                    {/* Biodata Section */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-[10px] font-mono tracking-wider uppercase text-emerald-400 border-b border-slate-900 pb-1">
                        Biodata Kependudukan
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[9px] uppercase">Nomor NIK (16 Digit)</label>
                          <Input
                            type="text"
                            maxLength={16}
                            required
                            value={memberFormValues.nik}
                            onChange={(e) =>
                              setMemberFormValues({ ...memberFormValues, nik: e.target.value.replace(/\D/g, "") })
                            }
                            className="bg-slate-950 border-slate-900 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[9px] uppercase">Nama Lengkap</label>
                          <Input
                            type="text"
                            required
                            value={memberFormValues.name}
                            onChange={(e) => setMemberFormValues({ ...memberFormValues, name: e.target.value })}
                            className="bg-slate-950 border-slate-900 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[9px] uppercase">Tempat Lahir</label>
                          <Input
                            type="text"
                            value={memberFormValues.place_of_birth}
                            onChange={(e) =>
                              setMemberFormValues({ ...memberFormValues, place_of_birth: e.target.value })
                            }
                            className="bg-slate-950 border-slate-900 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[9px] uppercase">Tanggal Lahir</label>
                          <Input
                            type="date"
                            value={memberFormValues.date_of_birth}
                            onChange={(e) =>
                              setMemberFormValues({ ...memberFormValues, date_of_birth: e.target.value })
                            }
                            className="bg-slate-950 border-slate-900 text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[9px] uppercase">Jenis Kelamin</label>
                          <Select
                            value={memberFormValues.gender}
                            onValueChange={(val) => setMemberFormValues({ ...memberFormValues, gender: val })}
                          >
                            <SelectTrigger className="w-full bg-slate-950 border-slate-900 text-xs">
                              <SelectValue placeholder="Gender" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-950 border-slate-900 text-white text-xs">
                              <SelectItem value="L">Laki-laki</SelectItem>
                              <SelectItem value="P">Perempuan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[9px] uppercase">Pekerjaan</label>
                          <Input
                            type="text"
                            value={memberFormValues.occupation}
                            onChange={(e) => setMemberFormValues({ ...memberFormValues, occupation: e.target.value })}
                            className="bg-slate-950 border-slate-900 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Alamat Section */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-[10px] font-mono tracking-wider uppercase text-emerald-400 border-b border-slate-900 pb-1">
                        Alamat Domisili
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[9px] uppercase">Dusun</label>
                          <Input
                            type="text"
                            value={memberFormValues.hamlet}
                            onChange={(e) => setMemberFormValues({ ...memberFormValues, hamlet: e.target.value })}
                            className="bg-slate-950 border-slate-900 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[9px] uppercase">RT</label>
                          <Input
                            type="text"
                            value={memberFormValues.rt}
                            onChange={(e) => setMemberFormValues({ ...memberFormValues, rt: e.target.value })}
                            className="bg-slate-950 border-slate-900 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[9px] uppercase">RW</label>
                          <Input
                            type="text"
                            value={memberFormValues.rw}
                            onChange={(e) => setMemberFormValues({ ...memberFormValues, rw: e.target.value })}
                            className="bg-slate-950 border-slate-900 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Keuangan Section */}
                    <div className="grid grid-cols-2 gap-6 pt-2 border-t border-slate-900">
                      {/* Simpanan */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-[10px] font-mono tracking-wider uppercase text-emerald-400 border-b border-slate-900 pb-1">
                          Neraca Simpanan
                        </h4>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-slate-500 font-mono text-[9px] uppercase">Simpanan Pokok (Rp)</label>
                            <Input
                              type="number"
                              value={memberFormValues.savings_pokok}
                              onChange={(e) =>
                                setMemberFormValues({ ...memberFormValues, savings_pokok: Number(e.target.value) })
                              }
                              className="bg-slate-950 border-slate-900 text-xs font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-500 font-mono text-[9px] uppercase">Simpanan Wajib (Rp)</label>
                            <Input
                              type="number"
                              value={memberFormValues.savings_wajib}
                              onChange={(e) =>
                                setMemberFormValues({ ...memberFormValues, savings_wajib: Number(e.target.value) })
                              }
                              className="bg-slate-950 border-slate-900 text-xs font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-500 font-mono text-[9px] uppercase">
                              Simpanan Sukarela (Rp)
                            </label>
                            <Input
                              type="number"
                              value={memberFormValues.savings_sukarela}
                              onChange={(e) =>
                                setMemberFormValues({ ...memberFormValues, savings_sukarela: Number(e.target.value) })
                              }
                              className="bg-slate-950 border-slate-900 text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Pinjaman */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-[10px] font-mono tracking-wider uppercase text-sky-400 border-b border-slate-900 pb-1">
                          Status Pinjaman
                        </h4>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-slate-500 font-mono text-[9px] uppercase">
                              Plafon Pinjaman (Rp)
                            </label>
                            <Input
                              type="number"
                              value={memberFormValues.loan_total}
                              onChange={(e) =>
                                setMemberFormValues({ ...memberFormValues, loan_total: Number(e.target.value) })
                              }
                              className="bg-slate-950 border-slate-900 text-xs font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-500 font-mono text-[9px] uppercase">
                              Outstanding Pinjaman (Rp)
                            </label>
                            <Input
                              type="number"
                              value={memberFormValues.loan_outstanding}
                              onChange={(e) =>
                                setMemberFormValues({ ...memberFormValues, loan_outstanding: Number(e.target.value) })
                              }
                              className="bg-slate-950 border-slate-900 text-xs font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-400 font-mono text-[9px] uppercase">
                              Kategori Kolektibilitas
                            </label>
                            <Input
                              type="text"
                              value={memberFormValues.loan_status}
                              onChange={(e) =>
                                setMemberFormValues({ ...memberFormValues, loan_status: e.target.value })
                              }
                              className="bg-slate-950 border-slate-900 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <div className="border-t border-slate-900 pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-slate-400 font-mono text-[9px] uppercase">Status Anggota</label>
                        <Select
                          value={memberFormValues.status}
                          onValueChange={(val) => setMemberFormValues({ ...memberFormValues, status: val })}
                        >
                          <SelectTrigger className="w-36 bg-slate-950 border-slate-900 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-950 border-slate-900 text-white text-xs">
                            <SelectItem value="aktif">AKTIF</SelectItem>
                            <SelectItem value="nonaktif">NONAKTIF</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <DialogFooter className="gap-2">
                        <Button
                          type="button"
                          onClick={() => setShowMemberModal(false)}
                          className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs"
                        >
                          Batal
                        </Button>
                        <Button
                          type="submit"
                          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs"
                        >
                          Simpan Data
                        </Button>
                      </DialogFooter>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {activeTab === "accounting" && (
            <div className="space-y-6">
              {/* SAK EP Navigation tab row */}
              <Tabs value={accountingTab} onValueChange={(val) => setAccountingTab(val as any)} className="w-full">
                <TabsList className="bg-[#090e1a] border border-slate-900 text-slate-400 mb-6 p-0.5 rounded-lg flex w-fit print:hidden">
                  <TabsTrigger
                    value="coa"
                    className="data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 font-bold text-xs px-4 py-1.5 rounded"
                  >
                    Bagan Akun (COA)
                  </TabsTrigger>
                  <TabsTrigger
                    value="journal"
                    className="data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 font-bold text-xs px-4 py-1.5 rounded"
                  >
                    Buku Jurnal Umum
                  </TabsTrigger>
                  <TabsTrigger
                    value="ledger"
                    className="data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 font-bold text-xs px-4 py-1.5 rounded"
                  >
                    Buku Besar
                  </TabsTrigger>
                  <TabsTrigger
                    value="neraca"
                    className="data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 font-bold text-xs px-4 py-1.5 rounded"
                  >
                    Neraca Keuangan
                  </TabsTrigger>
                  <TabsTrigger
                    value="labarugi"
                    className="data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 font-bold text-xs px-4 py-1.5 rounded"
                  >
                    Laporan SHU (Laba Rugi)
                  </TabsTrigger>
                </TabsList>

                {/* Bagan Akun */}
                <TabsContent value="coa">
                  <Card className="bg-[#0b101c]/90 border border-slate-900">
                    <CardHeader className="flex flex-row justify-between items-center border-b border-slate-900/60 pb-4">
                      <div>
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Chart of Accounts (Bagan Perkiraan)
                        </CardTitle>
                        <CardDescription className="text-[10px] text-slate-500">
                          Struktur penomoran akun perkiraan akuntansi standar SAK Entitas Privat.
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => setShowCoaModal(true)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-8"
                      >
                        <Plus className="h-4 w-4 mr-1 text-slate-950" /> Tambah Akun
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <Table>
                        <TableHeader className="bg-slate-950/20 border-slate-900">
                          <TableRow className="border-slate-900 hover:bg-transparent">
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase">Kode Akun</TableHead>
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase">
                              Nama Perkiraan
                            </TableHead>
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase">
                              Klasifikasi
                            </TableHead>
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase">
                              Saldo Normal
                            </TableHead>
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase">Saldo Buku</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {coaAccounts.map((acc) => (
                            <TableRow key={acc.code} className="border-slate-900 hover:bg-slate-900/10">
                              <TableCell className="font-mono text-xs text-emerald-400">{acc.code}</TableCell>
                              <TableCell className="font-semibold text-slate-200 text-xs">{acc.name}</TableCell>
                              <TableCell className="text-xs text-slate-400 capitalize">{acc.type}</TableCell>
                              <TableCell className="text-xs text-slate-400 capitalize">{acc.normal_balance}</TableCell>
                              <TableCell className="font-mono text-xs text-slate-200">
                                Rp {acc.balance.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* COA Add Dialog */}
                  <Dialog open={showCoaModal} onOpenChange={setShowCoaModal}>
                    <DialogContent className="bg-[#0b101c] border-slate-900 text-slate-100 max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-sm font-bold font-mono tracking-wider uppercase text-slate-300">
                          Buat Perkiraan Baru
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateCoaSubmit} className="space-y-4 pt-4 text-xs">
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[9px] uppercase">
                            Kode Rekening (Contoh: 1.1.04)
                          </label>
                          <Input
                            type="text"
                            required
                            value={newCoaValues.code}
                            onChange={(e) => setNewCoaValues({ ...newCoaValues, code: e.target.value })}
                            className="bg-slate-950 border-slate-900 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[9px] uppercase">Nama Perkiraan</label>
                          <Input
                            type="text"
                            required
                            value={newCoaValues.name}
                            onChange={(e) => setNewCoaValues({ ...newCoaValues, name: e.target.value })}
                            className="bg-slate-950 border-slate-900 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[9px] uppercase">Klasifikasi Tipe</label>
                          <Select
                            value={newCoaValues.type}
                            onValueChange={(val) => setNewCoaValues({ ...newCoaValues, type: val as any })}
                          >
                            <SelectTrigger className="w-full bg-slate-950 border-slate-900 text-xs">
                              <SelectValue placeholder="Tipe Akun" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-950 border-slate-900 text-white text-xs">
                              <SelectItem value="aset">ASET</SelectItem>
                              <SelectItem value="kewajiban">KEWAJIBAN</SelectItem>
                              <SelectItem value="ekuitas">EKUITAS</SelectItem>
                              <SelectItem value="pendapatan">PENDAPATAN</SelectItem>
                              <SelectItem value="beban">BEBAN OPERASIONAL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[9px] uppercase">Saldo Normal</label>
                          <Select
                            value={newCoaValues.normal_balance}
                            onValueChange={(val) => setNewCoaValues({ ...newCoaValues, normal_balance: val as any })}
                          >
                            <SelectTrigger className="w-full bg-slate-950 border-slate-900 text-xs">
                              <SelectValue placeholder="Saldo Normal" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-950 border-slate-900 text-white text-xs">
                              <SelectItem value="debit">DEBIT</SelectItem>
                              <SelectItem value="kredit">KREDIT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[9px] uppercase">Saldo Awal Awal (Rp)</label>
                          <Input
                            type="number"
                            value={newCoaValues.balance}
                            onChange={(e) => setNewCoaValues({ ...newCoaValues, balance: Number(e.target.value) })}
                            className="bg-slate-950 border-slate-900 text-xs font-mono"
                          />
                        </div>
                        <DialogFooter className="pt-4 border-t border-slate-900 gap-2">
                          <Button
                            type="button"
                            onClick={() => setShowCoaModal(false)}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs"
                          >
                            Batal
                          </Button>
                          <Button
                            type="submit"
                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs"
                          >
                            Tambah Akun
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </TabsContent>

                {/* Buku Jurnal */}
                <TabsContent value="journal">
                  <Card className="bg-[#0b101c]/90 border border-slate-900 shadow-md">
                    <CardHeader className="flex flex-row justify-between items-center border-b border-slate-900/60 pb-4">
                      <div>
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Jurnal Transaksi Harian
                        </CardTitle>
                        <CardDescription className="text-[10px] text-slate-500">
                          Rekapitulasi posting debit dan kredit umum.
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => setShowJournalModal(true)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-8"
                      >
                        <Plus className="h-4 w-4 mr-1 text-slate-950" /> Buat Jurnal Baru
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {journalEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 shadow-sm"
                          >
                            <div className="flex justify-between border-b border-slate-900/60 pb-2 mb-2 text-xs font-mono">
                              <span className="font-bold text-emerald-400">{entry.number}</span>
                              <span className="text-slate-500 flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" /> {entry.date}
                              </span>
                            </div>
                            <div className="text-xs text-slate-200 mb-3 font-semibold">{entry.description}</div>

                            <div className="pl-4 space-y-1.5 border-l-[2px] border-slate-800">
                              {entry.lines.map((line, idx) => (
                                <div key={idx} className="flex justify-between text-[11px] font-mono">
                                  <span className={line.credit > 0 ? "pl-8 text-slate-500" : "text-slate-300"}>
                                    {line.account_code} - {line.name}
                                  </span>
                                  <span className="text-slate-400">
                                    {line.debit > 0 ? (
                                      <span className="text-emerald-400/90">Rp {line.debit.toLocaleString()} (D)</span>
                                    ) : (
                                      <span className="text-slate-500">Rp {line.credit.toLocaleString()} (K)</span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Journal Input Dialog */}
                  <Dialog open={showJournalModal} onOpenChange={setShowJournalModal}>
                    <DialogContent className="bg-[#0b101c] border-slate-900 text-slate-100 max-w-3xl overflow-y-auto max-h-[85vh]">
                      <DialogHeader className="border-b border-slate-900 pb-3">
                        <DialogTitle className="text-sm font-bold font-mono tracking-wider uppercase text-slate-300">
                          Posting Jurnal Berpasangan
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleJournalEntrySubmit} className="space-y-6 pt-4 text-xs">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-slate-400 font-mono text-[9px] uppercase">Tanggal Transaksi</label>
                            <Input
                              type="date"
                              required
                              value={journalForm.date}
                              onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })}
                              className="bg-slate-950 border-slate-900 text-white text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-400 font-mono text-[9px] uppercase">
                              Nomor Bukti Transaksi (No. Ref)
                            </label>
                            <Input
                              type="text"
                              required
                              placeholder="Contoh: JM-2026-07-002"
                              value={journalForm.number}
                              onChange={(e) => setJournalForm({ ...journalForm, number: e.target.value })}
                              className="bg-slate-950 border-slate-900 text-xs font-mono"
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-slate-400 font-mono text-[9px] uppercase">Keterangan Ringkas</label>
                            <Input
                              type="text"
                              required
                              placeholder="Contoh: Penerimaan pembayaran angsuran toko..."
                              value={journalForm.description}
                              onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                              className="bg-slate-950 border-slate-900 text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <strong className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 border-b border-slate-900 pb-1 block">
                            Baris Rekening Ledger
                          </strong>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader className="bg-slate-950/20 border-slate-900">
                                <TableRow className="border-slate-900 hover:bg-transparent">
                                  <TableHead className="text-slate-500 font-mono text-[10px] uppercase w-1/2">
                                    Nama Akun / Rekening
                                  </TableHead>
                                  <TableHead className="text-slate-500 font-mono text-[10px] uppercase">
                                    Debit (Rp)
                                  </TableHead>
                                  <TableHead className="text-slate-500 font-mono text-[10px] uppercase">
                                    Kredit (Rp)
                                  </TableHead>
                                  <TableHead className="w-10"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {journalForm.lines.map((line, idx) => (
                                  <TableRow key={idx} className="border-slate-900 hover:bg-transparent">
                                    <TableCell className="p-1">
                                      <Select
                                        value={line.accountCode}
                                        onValueChange={(val) => handleJournalLineChange(idx, "accountCode", val)}
                                      >
                                        <SelectTrigger className="w-full bg-slate-950 border-slate-900 text-xs text-white">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-950 border-slate-900 text-white text-xs">
                                          {coaAccounts.map((a) => (
                                            <SelectItem key={a.code} value={a.code}>
                                              {a.code} - {a.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="p-1">
                                      <Input
                                        type="number"
                                        value={line.debit}
                                        onChange={(e) => handleJournalLineChange(idx, "debit", Number(e.target.value))}
                                        className="bg-slate-950 border-slate-900 text-xs font-mono w-full"
                                      />
                                    </TableCell>
                                    <TableCell className="p-1">
                                      <Input
                                        type="number"
                                        value={line.credit}
                                        onChange={(e) => handleJournalLineChange(idx, "credit", Number(e.target.value))}
                                        className="bg-slate-950 border-slate-900 text-xs font-mono w-full"
                                      />
                                    </TableCell>
                                    <TableCell className="p-1 text-center">
                                      <Button
                                        type="button"
                                        onClick={() => removeJournalLineRow(idx)}
                                        className="bg-transparent border-0 hover:bg-rose-500/10 text-rose-500 p-1 shadow-none"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          <Button
                            type="button"
                            onClick={addJournalLineRow}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] h-7 shadow-none px-3"
                          >
                            + Tambah Baris
                          </Button>
                        </div>

                        <DialogFooter className="pt-4 border-t border-slate-900 gap-2">
                          <Button
                            type="button"
                            onClick={() => setShowJournalModal(false)}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs"
                          >
                            Batal
                          </Button>
                          <Button
                            type="submit"
                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs"
                          >
                            Simpan Transaksi
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </TabsContent>

                {/* Buku Besar */}
                <TabsContent value="ledger">
                  <Card className="bg-[#0b101c]/90 border border-slate-900 shadow-md">
                    <CardHeader className="border-b border-slate-900/60 pb-4">
                      <div className="w-80">
                        <label className="text-slate-400 font-mono text-[9px] uppercase block mb-1">
                          Filter Rekening Buku Besar
                        </label>
                        <Select value={ledgerSelectedCode} onValueChange={setLedgerSelectedCode}>
                          <SelectTrigger className="w-full bg-slate-950 border-slate-900 text-xs text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-950 border-slate-900 text-white text-xs">
                            {coaAccounts.map((a) => (
                              <SelectItem key={a.code} value={a.code}>
                                {a.code} - {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flex justify-between border-b border-slate-900 pb-3 mb-6 text-xs text-slate-400 font-mono">
                        <span>
                          Saldo Awal:{" "}
                          <strong className="text-slate-200">Rp {ledgerBalanceStart.toLocaleString()}</strong>
                        </span>
                        <span>
                          Saldo Akhir:{" "}
                          <strong className="text-emerald-400">Rp {ledgerBalanceEnd.toLocaleString()}</strong>
                        </span>
                      </div>

                      <Table>
                        <TableHeader className="bg-slate-950/20 border-slate-900">
                          <TableRow className="border-slate-900 hover:bg-transparent">
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase">Tanggal</TableHead>
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase">
                              Nomor Bukti
                            </TableHead>
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase">
                              Keterangan Posting
                            </TableHead>
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase">Debit (D)</TableHead>
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase">Kredit (K)</TableHead>
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase">
                              Saldo Kumulatif
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ledgerEntries.map((line, idx) => (
                            <TableRow key={idx} className="border-slate-900 hover:bg-slate-900/10">
                              <TableCell className="text-xs">{line.date}</TableCell>
                              <TableCell className="font-mono text-xs text-emerald-400">{line.number}</TableCell>
                              <TableCell className="text-xs text-slate-300">{line.entry_desc}</TableCell>
                              <TableCell className="font-mono text-xs text-emerald-400">
                                {line.debit > 0 ? `Rp ${line.debit.toLocaleString()}` : "—"}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-slate-500">
                                {line.credit > 0 ? `Rp ${line.credit.toLocaleString()}` : "—"}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-slate-200 font-bold">
                                Rp {line.runningBalance.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                          {ledgerEntries.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-slate-500 text-xs font-mono">
                                Tidak ada mutasi transaksi untuk perkiraan ini.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Neraca Laporan */}
                <TabsContent value="neraca">
                  <Card className="bg-[#0b101c]/90 border border-slate-900 p-8 shadow-md">
                    {/* Financial Statement Header */}
                    <div className="text-center mb-8 border-b border-slate-900 pb-6">
                      <h3 className="text-lg font-black tracking-wider text-white uppercase">
                        {coopProfile.name.toUpperCase()}
                      </h3>
                      <h4 className="text-[10px] font-mono font-bold text-slate-400 tracking-widest uppercase mt-1">
                        LAPORAN NERACA KEUANGAN KDKMP
                      </h4>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                        Per 30 Juni 2026 • SAK Entitas Privat Compliant
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-xs">
                      {/* Left Column: Aktiva */}
                      <div>
                        <h5 className="border-b border-emerald-500/30 pb-2 text-emerald-400 font-bold font-mono tracking-widest uppercase mb-4 text-[10px]">
                          ASET (AKTIVA)
                        </h5>
                        <div className="space-y-2">
                          {coaAccounts
                            .filter((a) => a.type === "aset")
                            .map((acc) => (
                              <div
                                key={acc.code}
                                className="flex justify-between border-b border-slate-900/40 pb-1.5 font-mono"
                              >
                                <span className="text-slate-400 text-xs font-sans">{acc.name}</span>
                                <span className="text-slate-200">
                                  {acc.balance >= 0
                                    ? `Rp ${acc.balance.toLocaleString()}`
                                    : `(Rp ${Math.abs(acc.balance).toLocaleString()})`}
                                </span>
                              </div>
                            ))}
                          <div className="flex justify-between font-bold text-white border-t border-slate-800 pt-3 mt-4 text-xs font-mono">
                            <span>TOTAL ASET</span>
                            <span className="border-b-[3px] border-double border-white">
                              Rp {reports.totalAssets.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Passiva */}
                      <div>
                        <h5 className="border-b border-sky-500/30 pb-2 text-sky-400 font-bold font-mono tracking-widest uppercase mb-4 text-[10px]">
                          KEWAJIBAN & EKUITAS (PASSIVA)
                        </h5>

                        <strong className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-2">
                          Kewajiban Jangka Pendek/Panjang
                        </strong>
                        <div className="space-y-2 mb-6">
                          {coaAccounts
                            .filter((a) => a.type === "kewajiban")
                            .map((acc) => (
                              <div
                                key={acc.code}
                                className="flex justify-between border-b border-slate-900/40 pb-1.5 font-mono"
                              >
                                <span className="text-slate-400 text-xs font-sans">{acc.name}</span>
                                <span className="text-slate-200">Rp {acc.balance.toLocaleString()}</span>
                              </div>
                            ))}
                          <div className="flex justify-between text-slate-400 border-t border-slate-900/40 pt-2 text-xs font-mono">
                            <span className="font-sans text-[11px] italic">Jumlah Kewajiban</span>
                            <span>Rp {reports.totalLiabilities.toLocaleString()}</span>
                          </div>
                        </div>

                        <strong className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-2">
                          Modal & Ekuitas Desa
                        </strong>
                        <div className="space-y-2">
                          {coaAccounts
                            .filter((a) => a.type === "ekuitas")
                            .map((acc) => (
                              <div
                                key={acc.code}
                                className="flex justify-between border-b border-slate-900/40 pb-1.5 font-mono"
                              >
                                <span className="text-slate-400 text-xs font-sans">{acc.name}</span>
                                <span className="text-slate-200">Rp {acc.balance.toLocaleString()}</span>
                              </div>
                            ))}
                          <div className="flex justify-between text-slate-400 border-t border-slate-900/40 pt-2 text-xs font-mono">
                            <span className="font-sans text-[11px] italic">Jumlah Ekuitas</span>
                            <span>Rp {reports.totalEquity.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex justify-between font-bold text-white border-t border-slate-800 pt-3 mt-6 text-xs font-mono">
                          <span>TOTAL PASSIVA</span>
                          <span className="border-b-[3px] border-double border-white">
                            Rp {(reports.totalLiabilities + reports.totalEquity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 border-t border-slate-900 pt-6 flex justify-between items-center print:hidden">
                      <div>
                        {reports.balanced ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/20 px-2.5 py-1 border border-emerald-500/10 rounded">
                            <CheckCircle2 className="h-3.5 w-3.5" /> AKTIVA & PASSIVA SEIMBANG
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400 bg-rose-950/20 px-2.5 py-1 border border-rose-500/10 rounded">
                            <XCircle className="h-3.5 w-3.5" /> SELISIH AKTIVA/PASSIVA TERDETEKSI
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={() => window.print()}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs h-8"
                      >
                        Cetak Laporan
                      </Button>
                    </div>
                  </Card>
                </TabsContent>

                {/* Laba Rugi */}
                <TabsContent value="labarugi">
                  <Card className="bg-[#0b101c]/90 border border-slate-900 p-8 shadow-md">
                    {/* Laba Rugi Header */}
                    <div className="text-center mb-8 border-b border-slate-900 pb-6">
                      <h3 className="text-lg font-black tracking-wider text-white uppercase">
                        {coopProfile.name.toUpperCase()}
                      </h3>
                      <h4 className="text-[10px] font-mono font-bold text-slate-400 tracking-widest uppercase mt-1">
                        LAPORAN LABA RUGI / SHU
                      </h4>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                        Periode 1 Januari - 30 Juni 2026 • SAK EP Standard
                      </p>
                    </div>

                    <div className="max-w-xl mx-auto space-y-6 text-xs">
                      {/* Pendapatan */}
                      <div>
                        <h5 className="border-b border-emerald-500/30 pb-1 text-emerald-400 font-bold font-mono tracking-widest uppercase mb-3 text-[10px]">
                          PENDAPATAN USAHA
                        </h5>
                        <div className="space-y-2">
                          {coaAccounts
                            .filter((a) => a.type === "pendapatan")
                            .map((acc) => (
                              <div
                                key={acc.code}
                                className="flex justify-between border-b border-slate-900/40 pb-1.5 font-mono"
                              >
                                <span className="text-slate-400 font-sans">{acc.name}</span>
                                <span className="text-slate-200">Rp {acc.balance.toLocaleString()}</span>
                              </div>
                            ))}
                          <div className="flex justify-between font-bold text-white border-t border-slate-800 pt-2.5 mt-2 font-mono">
                            <span>TOTAL PENDAPATAN</span>
                            <span>Rp {reports.totalRevenue.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Beban */}
                      <div>
                        <h5 className="border-b border-rose-500/30 pb-1 text-rose-400 font-bold font-mono tracking-widest uppercase mb-3 text-[10px]">
                          BEBAN OPERASIONAL
                        </h5>
                        <div className="space-y-2">
                          {coaAccounts
                            .filter((a) => a.type === "beban")
                            .map((acc) => (
                              <div
                                key={acc.code}
                                className="flex justify-between border-b border-slate-900/40 pb-1.5 font-mono"
                              >
                                <span className="text-slate-400 font-sans">{acc.name}</span>
                                <span className="text-slate-200">Rp {acc.balance.toLocaleString()}</span>
                              </div>
                            ))}
                          <div className="flex justify-between font-bold text-white border-t border-slate-800 pt-2.5 mt-2 font-mono">
                            <span>TOTAL BEBAN OPERASIONAL</span>
                            <span>Rp {reports.totalExpense.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* SHU Aggregation */}
                      <div className="border-t-[2px] border-slate-700 pt-5 mt-6 font-mono">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-300">SHU SEBELUM PAJAK</span>
                          <span className="font-bold text-slate-200">Rp {reports.shuKotor.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mb-3">
                          <span>Pajak Penghasilan (10%)</span>
                          <span>(Rp {reports.tax.toLocaleString()})</span>
                        </div>
                        <div className="flex justify-between text-sm font-extrabold text-emerald-400 border-t border-slate-900 pt-3">
                          <span>SHU BERSIH TAHUN BERJALAN</span>
                          <span className="border-b-[3px] border-double border-emerald-400">
                            Rp {reports.shuBersih.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 border-t border-slate-900 pt-6 flex justify-end print:hidden">
                      <Button
                        onClick={() => window.print()}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs h-8"
                      >
                        Cetak Laporan
                      </Button>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeTab === "feasibility" && (
            <div className="space-y-6">
              <Tabs
                value={feasibilityActiveTab}
                onValueChange={(val) => setFeasibilityActiveTab(val as any)}
                className="w-full"
              >
                <TabsList className="bg-[#090e1a] border border-slate-900 text-slate-400 mb-6 p-0.5 rounded-lg flex w-fit print:hidden">
                  <TabsTrigger
                    value="calculator"
                    className="data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 font-bold text-xs px-4 py-1.5 rounded"
                  >
                    Kalkulator Kelayakan
                  </TabsTrigger>
                  <TabsTrigger
                    value="sensitivity"
                    className="data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950 font-bold text-xs px-4 py-1.5 rounded"
                  >
                    Analisis Sensitivitas
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="calculator" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Parameter input */}
                    <Card className="bg-[#0b101c]/90 border border-slate-900 shadow-md">
                      <CardHeader>
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Variabel Investasi Unit Usaha
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-2 text-xs">
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[9px] uppercase">
                            Investasi Kapital Awal (Rp)
                          </label>
                          <Input
                            type="number"
                            value={feasibilityParams.initialInvestment}
                            onChange={(e) =>
                              setFeasibilityParams({ ...feasibilityParams, initialInvestment: Number(e.target.value) })
                            }
                            className="bg-slate-950 border-slate-900 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[9px] uppercase">
                            Tahun Horison Proyeksi
                          </label>
                          <Select
                            value={String(feasibilityParams.projectionYears)}
                            onValueChange={(val) =>
                              setFeasibilityParams({ ...feasibilityParams, projectionYears: Number(val) })
                            }
                          >
                            <SelectTrigger className="w-full bg-slate-950 border-slate-900 text-xs text-slate-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0b101c] border-slate-900 text-xs text-white">
                              <SelectItem value="3">3 Tahun Operasional</SelectItem>
                              <SelectItem value="5">5 Tahun Operasional</SelectItem>
                              <SelectItem value="10">10 Tahun Operasional</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[9px] uppercase">
                            Aliran Arus Kas Masuk Bersih (Pisahkan dengan koma)
                          </label>
                          <Input
                            type="text"
                            value={feasibilityParams.cashFlows}
                            onChange={(e) => setFeasibilityParams({ ...feasibilityParams, cashFlows: e.target.value })}
                            className="bg-slate-950 border-slate-900 text-xs font-mono"
                          />
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                            Format: tahun1, tahun2, tahun3, ...
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-slate-400 font-mono text-[9px] uppercase">Discount Rate (%)</label>
                            <Input
                              type="number"
                              step={0.1}
                              value={feasibilityParams.discountRate}
                              onChange={(e) =>
                                setFeasibilityParams({ ...feasibilityParams, discountRate: Number(e.target.value) })
                              }
                              className="bg-slate-950 border-slate-900 text-xs font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-400 font-mono text-[9px] uppercase">
                              Opportunity Cost (%)
                            </label>
                            <Input
                              type="number"
                              step={0.1}
                              value={feasibilityParams.opportunityCost}
                              onChange={(e) =>
                                setFeasibilityParams({ ...feasibilityParams, opportunityCost: Number(e.target.value) })
                              }
                              className="bg-slate-950 border-slate-900 text-xs font-mono"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={calculateFeasibility}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9 mt-4 shadow-none"
                        >
                          Hitung Rasio Kelayakan
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Results metrics */}
                    <Card className="bg-[#0b101c]/90 border border-slate-900 shadow-md">
                      <CardHeader>
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Hasil Uji Indikator Kelayakan
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-2">
                        {feasibilityResults ? (
                          <div className="space-y-6 text-xs">
                            {/* Recommendation banner */}
                            <div
                              className={`p-4 rounded-xl border text-center font-mono ${feasibilityResults.tierColor === "green" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : feasibilityResults.tierColor === "amber" ? "bg-amber-500/5 border-amber-500/20 text-amber-400" : "bg-rose-500/5 border-rose-500/20 text-rose-400"}`}
                            >
                              <span className="text-[10px] text-slate-500 uppercase block tracking-widest mb-1">
                                Rekomendasi Uji
                              </span>
                              <h4 className="text-lg font-bold uppercase tracking-wider">
                                {feasibilityResults.tierLabel}
                              </h4>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                Tier Level: <strong>Tier {feasibilityResults.tier}</strong>
                              </span>
                            </div>

                            {/* Details table */}
                            <div className="space-y-3 font-mono text-[11px]">
                              <div className="flex justify-between border-b border-slate-900 pb-2">
                                <span className="text-slate-500">Economic NPV (ENPV)</span>
                                <span className="font-bold text-slate-200">
                                  Rp {Math.round(feasibilityResults.enpv).toLocaleString()} &nbsp;
                                  {feasibilityResults.isNPVPass ? "🟢 PASS" : "🔴 FAIL"}
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-slate-900 pb-2">
                                <span className="text-slate-500">Internal Rate (EIRR)</span>
                                <span className="font-bold text-slate-200">
                                  {feasibilityResults.eirr.toFixed(2)}% &nbsp;
                                  {feasibilityResults.isIRRPass ? "🟢 PASS" : "🔴 FAIL"}
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-slate-900 pb-2">
                                <span className="text-slate-500">Benefit-Cost Ratio (EBCR)</span>
                                <span className="font-bold text-slate-200">
                                  {feasibilityResults.ebcr.toFixed(2)} &nbsp;
                                  {feasibilityResults.isBCRPass ? "🟢 PASS" : "🔴 FAIL"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-slate-500 py-16 text-xs font-mono">
                            <Info className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                            Silakan masukkan parameter investasi desa untuk memulai simulasi.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="sensitivity">
                  <Card className="bg-[#0b101c]/90 border border-slate-900 shadow-md">
                    <CardHeader className="border-b border-slate-900 pb-4 print:hidden">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSensitivityScenarioChange("optimis")}
                          className={`text-xs h-8 px-4 font-mono shadow-none ${sensitivityScenario === "optimis" ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-950/40 border border-slate-900 text-slate-400 hover:text-white"}`}
                        >
                          Optimis (+15% Kas Masuk)
                        </Button>
                        <Button
                          onClick={() => handleSensitivityScenarioChange("moderat")}
                          className={`text-xs h-8 px-4 font-mono shadow-none ${sensitivityScenario === "moderat" ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-950/40 border border-slate-900 text-slate-400 hover:text-white"}`}
                        >
                          Moderat (Base Case)
                        </Button>
                        <Button
                          onClick={() => handleSensitivityScenarioChange("pesimis")}
                          className={`text-xs h-8 px-4 font-mono shadow-none ${sensitivityScenario === "pesimis" ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-950/40 border border-slate-900 text-slate-400 hover:text-white"}`}
                        >
                          Pesimis (-30% Shock Pertanian)
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {sensitivityPresetResults ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                          <div>
                            <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-emerald-400 mb-2">
                              Kondisi Variabel Skenario
                            </h4>
                            <p className="text-slate-400 leading-relaxed">
                              {sensitivityScenario === "optimis" &&
                                "Cuaca optimal dan panen raya desa melimpah. Arus kas masuk unit usaha diproyeksikan meningkat 15% di atas perkiraan dasar."}
                              {sensitivityScenario === "moderat" &&
                                "Perkiraan dasar (Base Case) tanpa fluktuasi harga komoditas atau kejadian alam ekstrim di desa."}
                              {sensitivityScenario === "pesimis" &&
                                "Gagal panen sawah desa akibat cuaca kering berkepanjangan menekan daya beli dan menyusutkan pendapatan usaha hingga 30%."}
                            </p>
                          </div>
                          <div className="border-l border-slate-900 pl-6 space-y-3 font-mono text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Kapital Skenario</span>
                              <span>Rp {Math.round(sensitivityPresetResults.investment).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">NPV Sensitivitas</span>
                              <span style={{ color: sensitivityPresetResults.enpv > 0 ? "#34d399" : "#fb7185" }}>
                                Rp {Math.round(sensitivityPresetResults.enpv).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">IRR Sensitivitas</span>
                              <span>{sensitivityPresetResults.eirr.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">BCR Sensitivitas</span>
                              <span>{sensitivityPresetResults.ebcr.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-200">
                              <span className="text-slate-500">Rekomendasi Akhir</span>
                              <span>{sensitivityPresetResults.tierLabel}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-slate-500 py-16 text-xs font-mono">
                          <Info className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                          Hitung kelayakan proyeksi awal (Kalkulator Kelayakan) terlebih dahulu untuk mengaktifkan
                          skenario.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeTab === "sync" && (
            <div className="space-y-6">
              <Card className="bg-[#0b101c]/90 border border-slate-900 shadow-md">
                <CardHeader>
                  <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Pintu Gerbang Sinkronisasi Kabupaten
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-500">
                    Koneksi Node Local SQLite database ke portal aggregasi kabupaten:{" "}
                    <strong className="text-slate-300 font-mono">{syncServerUrl}</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <Button
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9"
                  >
                    {isSyncing ? "Menghubungkan..." : "Mulai Sinkronisasi Sekarang"}
                  </Button>
                  {syncProgress && (
                    <span className="text-emerald-400 text-xs font-mono font-semibold">{syncProgress}</span>
                  )}
                </CardContent>
              </Card>

              {/* Sync History */}
              <Card className="bg-[#0b101c]/90 border border-slate-900 shadow-md">
                <CardHeader>
                  <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Log Riwayat Aggregasi Sinkronisasi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="bg-slate-950/20 border-slate-900">
                      <TableRow className="border-slate-900 hover:bg-transparent">
                        <TableHead className="text-slate-500 font-mono text-[10px] uppercase">
                          Waktu Sinkronisasi
                        </TableHead>
                        <TableHead className="text-slate-500 font-mono text-[10px] uppercase">Tipe Data</TableHead>
                        <TableHead className="text-slate-500 font-mono text-[10px] uppercase">Status Koneksi</TableHead>
                        <TableHead className="text-slate-500 font-mono text-[10px] uppercase">Jumlah Muatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncHistoryList.map((hist) => (
                        <TableRow key={hist.id} className="border-slate-900 hover:bg-slate-900/10">
                          <TableCell className="text-xs font-mono">{hist.completed_at}</TableCell>
                          <TableCell className="text-xs capitalize">{hist.direction}</TableCell>
                          <TableCell>
                            <span
                              className={`font-mono text-xs font-bold ${hist.status === "success" ? "text-emerald-400" : "text-rose-400"}`}
                            >
                              {hist.status === "success" ? "BERHASIL" : "GAGAL"}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{hist.entity_count} entri data</TableCell>
                        </TableRow>
                      ))}
                      {syncHistoryList.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-500 text-xs font-mono">
                            Belum ada riwayat sinkronisasi terdaftar di database.
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Form */}
                <form
                  className="bg-[#0b101c]/90 border border-slate-900 rounded-xl p-6 md:col-span-2 shadow-md"
                  onSubmit={handleSaveProfile}
                >
                  <h4 className="text-xs font-bold text-slate-400 font-mono tracking-wider uppercase border-b border-slate-900 pb-3 mb-4">
                    Profil Organisasi Koperasi Desa
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-500 font-mono text-[9px] uppercase">Nama Koperasi</label>
                      <Input
                        type="text"
                        value={coopProfile.name}
                        onChange={(e) => handleProfileFieldChange("name", e.target.value)}
                        className="bg-slate-950 border-slate-900 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 font-mono text-[9px] uppercase">Nomor Legal Hukum</label>
                      <Input
                        type="text"
                        value={coopProfile.legal_id}
                        onChange={(e) => handleProfileFieldChange("legal_id", e.target.value)}
                        className="bg-slate-950 border-slate-900 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 font-mono text-[9px] uppercase">Nama Ketua Pengurus</label>
                      <Input
                        type="text"
                        value={JSON.parse(coopProfile.officers || "{}").chairman || ""}
                        onChange={(e) => {
                          const parsed = JSON.parse(coopProfile.officers || "{}");
                          parsed.chairman = e.target.value;
                          handleProfileFieldChange("officers", JSON.stringify(parsed));
                        }}
                        className="bg-slate-950 border-slate-900 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 font-mono text-[9px] uppercase">Nama Sekretaris</label>
                      <Input
                        type="text"
                        value={JSON.parse(coopProfile.officers || "{}").secretary || ""}
                        onChange={(e) => {
                          const parsed = JSON.parse(coopProfile.officers || "{}");
                          parsed.secretary = e.target.value;
                          handleProfileFieldChange("officers", JSON.stringify(parsed));
                        }}
                        className="bg-slate-950 border-slate-900 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 font-mono text-[9px] uppercase">Nama Bendahara</label>
                      <Input
                        type="text"
                        value={JSON.parse(coopProfile.officers || "{}").treasurer || ""}
                        onChange={(e) => {
                          const parsed = JSON.parse(coopProfile.officers || "{}");
                          parsed.treasurer = e.target.value;
                          handleProfileFieldChange("officers", JSON.stringify(parsed));
                        }}
                        className="bg-slate-950 border-slate-900 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 font-mono text-[9px] uppercase">Nama Dewan Pengawas</label>
                      <Input
                        type="text"
                        value={JSON.parse(coopProfile.officers || "{}").supervisor || ""}
                        onChange={(e) => {
                          const parsed = JSON.parse(coopProfile.officers || "{}");
                          parsed.supervisor = e.target.value;
                          handleProfileFieldChange("officers", JSON.stringify(parsed));
                        }}
                        className="bg-slate-950 border-slate-900 text-xs"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9 mt-6"
                  >
                    Simpan Profil Koperasi
                  </Button>
                </form>

                {/* Updater */}
                <Card className="bg-[#0b101c]/90 border border-slate-900 md:col-span-2 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Pemeliharaan Aplikasi & Update OTA
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500">
                      Sambungkan ke repositori GitHub untuk mengunduh update biner rilis KDKMP secara langsung.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2 text-xs">
                    <Button
                      onClick={checkUpdateCenter}
                      disabled={isUpdateChecking}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9"
                    >
                      {isUpdateChecking ? "Menghubungi Repositori..." : "Cek Pembaruan Sistem Sekarang"}
                    </Button>
                    {updateStatusText && (
                      <span className="text-emerald-400 text-xs font-mono font-semibold block text-center mt-2">
                        {updateStatusText}
                      </span>
                    )}

                    {downloadContentLength > 0 && (
                      <div className="space-y-2 mt-4 font-mono text-[10px]">
                        <div className="flex justify-between text-slate-400">
                          <span>
                            Progress: {(downloadedBytes / 1024 / 1024).toFixed(2)} MB /{" "}
                            {(downloadContentLength / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <span className="font-bold text-emerald-400">{downloadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-900 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-300"
                            style={{ width: `${downloadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Preference card */}
                <Card className="bg-[#0b101c]/90 border border-slate-900 md:col-span-2 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Preferensi Interface
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-500 font-mono text-[9px] uppercase">Tema Warna Cockpit</label>
                      <Select value={appTheme} onValueChange={(val) => setAppTheme(val as any)}>
                        <SelectTrigger className="w-full bg-slate-950 border-slate-900 text-xs text-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0b101c] border-slate-900 text-white text-xs">
                          <SelectItem value="dark">🌙 MODE GELAP (DEEP GRAPHITE)</SelectItem>
                          <SelectItem value="light">☀️ MODE TERANG (HIGH CONTRAST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 font-mono text-[9px] uppercase">Ukuran Skala Huruf</label>
                      <Select value={fontSizeSetting} onValueChange={(val) => setFontSizeSetting(val as any)}>
                        <SelectTrigger className="w-full bg-slate-950 border-slate-900 text-xs text-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0b101c] border-slate-900 text-white text-xs">
                          <SelectItem value="normal">NORMAL (DENSITY OPTIMIZED)</SelectItem>
                          <SelectItem value="large">BESAR (EASE OF READING)</SelectItem>
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
    </div>
  );
}
