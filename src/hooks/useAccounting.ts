import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getDb } from "@/db";
import type {
  CoaAccount,
  JournalEntryWithLines,
  JournalLineInput,
  JournalEntryRow,
  JournalLineRow,
  LedgerLine,
  CoaBalanceRow,
} from "@/types";
import { useToast } from "@/hooks/useToast";

const JOURNAL_FORM_DEFAULT = {
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
};

export function useAccounting() {
  const { t } = useTranslation();
  const toast = useToast();

  const [accountingTab, setAccountingTab] = useState<"coa" | "journal" | "ledger" | "neraca" | "labarugi">("coa");
  const [coaAccounts, setCoaAccounts] = useState<CoaAccount[]>([]);
  const [showCoaModal, setShowCoaModal] = useState(false);
  const [newCoaValues, setNewCoaValues] = useState<{
    code: string;
    name: string;
    type: CoaAccount["type"];
    normal_balance: CoaAccount["normal_balance"];
    balance: number;
  }>({ code: "", name: "", type: "aset", normal_balance: "debit", balance: 0 });

  const [journalEntries, setJournalEntries] = useState<JournalEntryWithLines[]>([]);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalForm, setJournalForm] = useState(JOURNAL_FORM_DEFAULT);

  const [ledgerSelectedCode, setLedgerSelectedCode] = useState("1.1.01");
  const [ledgerEntries, setLedgerEntries] = useState<LedgerLine[]>([]);
  const [ledgerBalanceStart, setLedgerBalanceStart] = useState(0);
  const [ledgerBalanceEnd, setLedgerBalanceEnd] = useState(0);

  // ── Loaders ────────────────────────────────────────────────────

  const loadAccountsData = useCallback(async () => {
    try {
      const db = await getDb();
      const res = await db.select<CoaAccount[]>("SELECT * FROM coa_accounts ORDER BY code ASC");
      setCoaAccounts(res);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadJournalData = useCallback(async () => {
    try {
      const db = await getDb();
      const entries = await db.select<JournalEntryRow[]>(
        "SELECT * FROM journal_entries ORDER BY date DESC, number DESC",
      );
      const mapped: JournalEntryWithLines[] = [];
      for (const entry of entries) {
        const lines = await db.select<JournalLineRow[]>(
          `SELECT jl.*, ca.name FROM journal_lines jl LEFT JOIN coa_accounts ca ON jl.account_code = ca.code WHERE jl.journal_entry_id = ?`,
          [entry.id],
        );
        mapped.push({ ...entry, lines });
      }
      setJournalEntries(mapped);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadLedgerData = useCallback(async () => {
    try {
      const db = await getDb();
      const account = await db.select<CoaBalanceRow[]>("SELECT balance FROM coa_accounts WHERE code = ?", [
        ledgerSelectedCode,
      ]);
      const balanceEnd = account.length > 0 ? account[0].balance : 0;
      setLedgerBalanceEnd(balanceEnd);

      const lines = await db.select<LedgerLine[]>(
        `SELECT jl.*, je.date, je.number, je.description as entry_desc FROM journal_lines jl
         INNER JOIN journal_entries je ON jl.journal_entry_id = je.id
         WHERE jl.account_code = ? ORDER BY je.date ASC, je.created_at ASC`,
        [ledgerSelectedCode],
      );

      let debSum = 0,
        credSum = 0;
      for (const l of lines) {
        debSum += l.debit;
        credSum += l.credit;
      }

      const accInfo = await db.select<CoaBalanceRow[]>("SELECT normal_balance FROM coa_accounts WHERE code = ?", [
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
  }, [ledgerSelectedCode]);

  // ── COA CRUD ───────────────────────────────────────────────────

  const handleCreateCoaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoaValues.code || !newCoaValues.name) {
      toast.error(t("toast.coaFieldsRequired"));
      return;
    }
    try {
      const db = await getDb();
      await db.execute(`INSERT INTO coa_accounts (code, name, type, normal_balance, balance) VALUES (?, ?, ?, ?, ?)`, [
        newCoaValues.code,
        newCoaValues.name,
        newCoaValues.type,
        newCoaValues.normal_balance,
        Number(newCoaValues.balance),
      ]);
      setShowCoaModal(false);
      loadAccountsData();
    } catch (err) {
      toast.error(t("toast.coaCreateFailed", { error: err instanceof Error ? err.message : String(err) }));
    }
  };

  // ── Journal CRUD ───────────────────────────────────────────────

  const handleJournalLineChange = (index: number, key: keyof JournalLineInput, value: string | number) => {
    setJournalForm((prev) => {
      const lines = [...prev.lines];
      lines[index] = { ...lines[index], [key]: value };
      return { ...prev, lines };
    });
  };

  const addJournalLineRow = () =>
    setJournalForm((prev) => ({ ...prev, lines: [...prev.lines, { accountCode: "1.1.01", debit: 0, credit: 0 }] }));
  const removeJournalLineRow = (index: number) => {
    if (journalForm.lines.length <= 2) return;
    setJournalForm((prev) => ({ ...prev, lines: prev.lines.filter((_, idx) => idx !== index) }));
  };

  const handleJournalEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalForm.number || !journalForm.description) {
      toast.error(t("toast.journalFieldsRequired"));
      return;
    }

    let totalDebit = 0,
      totalCredit = 0;
    for (const line of journalForm.lines) {
      totalDebit += Number(line.debit || 0);
      totalCredit += Number(line.credit || 0);
    }
    if (totalDebit !== totalCredit) {
      toast.error(t("toast.journalUnbalanced", { diff: Math.abs(totalDebit - totalCredit).toLocaleString() }));
      return;
    }
    if (totalDebit === 0) {
      toast.error(t("toast.journalZeroAmount"));
      return;
    }

    try {
      const db = await getDb();
      const newEntryId = `je-${Date.now()}`;
      await db.execute(
        `INSERT INTO journal_entries (id, number, date, description, reference, category, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          newEntryId,
          journalForm.number,
          journalForm.date,
          journalForm.description,
          journalForm.reference,
          journalForm.category,
          "usr-001",
        ],
      );

      for (const line of journalForm.lines) {
        const lineId = `jl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        await db.execute(
          `INSERT INTO journal_lines (id, journal_entry_id, account_code, debit, credit) VALUES (?, ?, ?, ?, ?)`,
          [lineId, newEntryId, line.accountCode, Number(line.debit), Number(line.credit)],
        );
        const account = await db.select<CoaBalanceRow[]>(
          "SELECT normal_balance, balance FROM coa_accounts WHERE code = ?",
          [line.accountCode],
        );
        if (account.length > 0) {
          const { normal_balance: norm, balance: cur } = account[0];
          const delta =
            norm === "debit" ? Number(line.debit) - Number(line.credit) : Number(line.credit) - Number(line.debit);
          await db.execute("UPDATE coa_accounts SET balance = ? WHERE code = ?", [cur + delta, line.accountCode]);
        }
      }

      toast.success(t("toast.journalSaveSuccess"));
      setShowJournalModal(false);
      setJournalForm(JOURNAL_FORM_DEFAULT);
      loadJournalData();
      loadAccountsData();
      loadLedgerData();
    } catch (err) {
      toast.error(t("toast.journalSaveFailed", { error: err instanceof Error ? err.message : String(err) }));
    }
  };

  // ── Reports (pure computation) ──────────────────────────────────

  const getAccountingReports = () => {
    const assets = coaAccounts.filter((a) => a.type === "aset");
    const liabilities = coaAccounts.filter((a) => a.type === "kewajiban");
    const equity = coaAccounts.filter((a) => a.type === "ekuitas");
    const revenues = coaAccounts.filter((a) => a.type === "pendapatan");
    const expenses = coaAccounts.filter((a) => a.type === "beban");

    const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
    const totalEquity = equity.reduce((s, a) => s + a.balance, 0);
    const totalRevenue = revenues.reduce((s, a) => s + a.balance, 0);
    const totalExpense = expenses.reduce((s, a) => s + a.balance, 0);
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

  return {
    accountingTab,
    setAccountingTab,
    coaAccounts,
    showCoaModal,
    setShowCoaModal,
    newCoaValues,
    setNewCoaValues,
    journalEntries,
    showJournalModal,
    setShowJournalModal,
    journalForm,
    setJournalForm,
    ledgerSelectedCode,
    setLedgerSelectedCode,
    ledgerEntries,
    ledgerBalanceStart,
    ledgerBalanceEnd,
    loadAccountsData,
    loadJournalData,
    loadLedgerData,
    handleCreateCoaSubmit,
    handleJournalLineChange,
    addJournalLineRow,
    removeJournalLineRow,
    handleJournalEntrySubmit,
    getAccountingReports,
  };
}
