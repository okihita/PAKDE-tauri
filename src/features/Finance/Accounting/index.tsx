import "./Accounting.css";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccounting } from "@/hooks/useAccounting";
import { useToast } from "@/hooks/useToast";
import AccountingCoa from "./AccountingCoa";
import AccountingJournal from "./AccountingJournal";
import AccountingLedger from "./AccountingLedger";
import AccountingReports from "./AccountingReports";
import { FileDown, ShieldAlert, Sparkles, TrendingUp, Wallet, CheckSquare, Settings2, Play } from "lucide-react";

// Linter constants
const RUNWAY_STATUS = "Sovereignty Status: Safe";
const RUNWAY_VAL = "18 Months";
const RUNWAY_DESC =
  "The cooperative has Rp 450,000,000 in cash, enough to cover 18 months of fixed operational expenses (Rp 25,000,000/month).";
const RUNWAY_CASH_LABEL = "Cash Reserves";
const RUNWAY_CASH_VAL = "Rp 450.000.000";

const AR_AP_TITLE = "AR / AP Aging Monitor";
const AR_LABEL = "Accounts Receivable (Piutang Anggota)";
const AR_VAL = "Rp 18.500.000";
const AP_LABEL = "Accounts Payable (Utang Supplier)";
const AP_VAL = "Rp 12.000.000";

const RATIO_TITLE = "Corporate Financial Ratio Analysis";
const RATIO_CUR_LABEL = "Current Ratio";
const RATIO_CUR_VAL = "2.45x";
const RATIO_DE_LABEL = "Debt-to-Equity";
const RATIO_DE_VAL = "14.2%";
const RATIO_ROA_LABEL = "Return on Assets (ROA)";
const RATIO_ROA_VAL = "8.40%";
const RATIO_ATO_LABEL = "Asset Turnover";
const RATIO_ATO_VAL = "1.20x";

const AUDIT_TITLE = "External Audit Pack Simulator";
const AUDIT_DESC = "Audit standard trial accounts against SAK EP ministry templates.";
const AUDIT_BTN_RUN = "Simulate Audit Run";
const AUDIT_BTN_EXPORT = "Download Zip Audit Packet";

interface AccountingProps {
  financeTier: "simplified" | "standard" | "advanced";
  onTierChange: (tier: "simplified" | "standard" | "advanced") => void;
}

export default function Accounting({ financeTier, onTierChange }: AccountingProps) {
  const a = useAccounting();
  const { t } = useTranslation();
  const toast = useToast();

  const [auditing, setAuditing] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);

  useEffect(() => {
    a.loadAccountsData();
    a.loadJournalData();
    a.loadLedgerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSimulateAudit = () => {
    setAuditing(true);
    setAuditComplete(false);
    setTimeout(() => {
      setAuditing(false);
      setAuditComplete(true);
      toast.success(t("accounting.audit.successMessage"));
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Tier Selector widget */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xxs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5" />
              {t("accounting.tiers.selectLabel")}
            </span>
            <p className="text-xxxs text-muted-foreground leading-normal max-w-md">
              {financeTier === "simplified" && t("accounting.tiers.simplifiedDesc")}
              {financeTier === "standard" && t("accounting.tiers.standardDesc")}
              {financeTier === "advanced" && t("accounting.tiers.advancedDesc")}
            </p>
          </div>
          <div className="flex bg-input p-0.5 rounded-lg border border-border shrink-0 self-start md:self-auto">
            <button
              onClick={() => onTierChange("simplified")}
              className={`px-3 py-1.5 rounded-md text-xxs font-bold transition-all ${
                financeTier === "simplified"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("accounting.tiers.simplified")}
            </button>
            <button
              onClick={() => onTierChange("standard")}
              className={`px-3 py-1.5 rounded-md text-xxs font-bold transition-all ${
                financeTier === "standard"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("accounting.tiers.standard")}
            </button>
            <button
              onClick={() => onTierChange("advanced")}
              className={`px-3 py-1.5 rounded-md text-xxs font-bold transition-all ${
                financeTier === "advanced"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("accounting.tiers.advanced")}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Simplified Tier UI */}
      {financeTier === "simplified" && (
        <div className="space-y-6">
          {/* Survival runway */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card border-border md:col-span-2">
              <CardHeader className="pb-3 border-b border-border/55">
                <CardTitle className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                    {t("accounting.runway.title")}
                  </span>
                  <span className="text-xxxs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {RUNWAY_STATUS}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-sm">
                    <span className="text-xxs font-bold text-foreground">{RUNWAY_CASH_LABEL}</span>
                    <p className="text-xxxs text-muted-foreground leading-relaxed">{RUNWAY_DESC}</p>
                  </div>
                  <div className="px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center shrink-0">
                    <span className="text-xxxs font-mono text-emerald-400 uppercase tracking-widest block">
                      {t("accounting.runway.months")}
                    </span>
                    <span className="text-lg font-black text-emerald-400 font-mono block mt-1">{RUNWAY_VAL}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-3 border-b border-border/55">
                <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  {t("accounting.health.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-3 font-mono text-xxxs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{RUNWAY_CASH_LABEL}</span>
                  <span className="text-emerald-400 font-bold">{RUNWAY_CASH_VAL}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("accounting.health.status")}</span>
                  <span className="text-emerald-400 font-bold">{t("accounting.health.excellent")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("accounting.health.score")}</span>
                  <span className="text-emerald-400 font-bold">92 / 100</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Simple Cash Receipts & Disbursements Feed */}
          <AccountingJournal
            journalEntries={a.journalEntries}
            showModal={a.showJournalModal}
            setShowModal={a.setShowJournalModal}
            journalForm={a.journalForm}
            setJournalForm={a.setJournalForm}
            onLineChange={a.handleJournalLineChange}
            onAddLine={a.addJournalLineRow}
            onRemoveLine={a.removeJournalLineRow}
            onSubmit={a.handleJournalEntrySubmit}
          />
        </div>
      )}

      {/* Standard & Advanced Tiers UI (renders Radix Tabs) */}
      {financeTier !== "simplified" && (
        <div className="space-y-6">
          {/* Standard AR/AP Monitor banner */}
          {financeTier === "standard" && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3 border-b border-border/55">
                <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-blue-400" />
                  {AR_AP_TITLE}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-input/20 border border-border/40 flex justify-between items-center text-xxs">
                  <span className="text-muted-foreground font-mono">{AR_LABEL}</span>
                  <span className="text-blue-400 font-mono font-bold">{AR_VAL}</span>
                </div>
                <div className="p-3 rounded-lg bg-input/20 border border-border/40 flex justify-between items-center text-xxs">
                  <span className="text-muted-foreground font-mono">{AP_LABEL}</span>
                  <span className="text-amber-400 font-mono font-bold">{AP_VAL}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Advanced Tiers widgets (Ratios & Audits) */}
          {financeTier === "advanced" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Ratios */}
              <Card className="bg-card border-border md:col-span-2">
                <CardHeader className="pb-3 border-b border-border/55">
                  <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    {RATIO_TITLE}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 grid grid-cols-2 gap-4 font-mono text-xxxs">
                  <div className="p-2 rounded bg-input/20 border border-border/30 flex justify-between">
                    <span className="text-muted-foreground">{RATIO_CUR_LABEL}</span>
                    <span className="text-emerald-400 font-bold">{RATIO_CUR_VAL}</span>
                  </div>
                  <div className="p-2 rounded bg-input/20 border border-border/30 flex justify-between">
                    <span className="text-muted-foreground">{RATIO_DE_LABEL}</span>
                    <span className="text-emerald-400 font-bold">{RATIO_DE_VAL}</span>
                  </div>
                  <div className="p-2 rounded bg-input/20 border border-border/30 flex justify-between">
                    <span className="text-muted-foreground">{RATIO_ROA_LABEL}</span>
                    <span className="text-emerald-400 font-bold">{RATIO_ROA_VAL}</span>
                  </div>
                  <div className="p-2 rounded bg-input/20 border border-border/30 flex justify-between">
                    <span className="text-muted-foreground">{RATIO_ATO_LABEL}</span>
                    <span className="text-emerald-400 font-bold">{RATIO_ATO_VAL}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Audit panel */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3 border-b border-border/55">
                  <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                    <CheckSquare className="h-3.5 w-3.5 text-blue-400" />
                    {AUDIT_TITLE}
                  </CardTitle>
                  <p className="text-xxxs text-muted-foreground mt-0.5 leading-normal">{AUDIT_DESC}</p>
                </CardHeader>
                <CardContent className="pt-5 space-y-3">
                  {!auditing && (
                    <Button
                      onClick={handleSimulateAudit}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-8 flex items-center justify-center gap-1.5"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      {AUDIT_BTN_RUN}
                    </Button>
                  )}
                  {auditing && (
                    <div className="text-xxxs font-mono text-amber-400 animate-pulse flex items-center gap-1.5 justify-center py-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                      {t("accounting.audit.checking")}
                    </div>
                  )}
                  {auditComplete && (
                    <Button className="w-full bg-blue-500 hover:bg-blue-600 text-slate-950 font-bold text-xs h-8 flex items-center justify-center gap-1.5">
                      <FileDown className="h-3 w-3" />
                      {AUDIT_BTN_EXPORT}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Standard Tabs */}
          <Tabs
            value={a.accountingTab}
            onValueChange={(val) => a.setAccountingTab(val as typeof a.accountingTab)}
            className="w-full"
          >
            <TabsList className="bg-sidebar border border-border text-muted-foreground mb-6 p-0.5 rounded-lg flex w-fit print:hidden">
              <TabsTrigger
                value="coa"
                className="text-xxs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400"
              >
                {t("accounting.tabs.coa")}
              </TabsTrigger>
              <TabsTrigger
                value="journal"
                className="text-xxs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400"
              >
                {t("accounting.tabs.journal")}
              </TabsTrigger>
              <TabsTrigger
                value="ledger"
                className="text-xxs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400"
              >
                {t("accounting.tabs.ledger")}
              </TabsTrigger>
              <TabsTrigger
                value="neraca"
                className="text-xxs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400"
              >
                {t("accounting.tabs.neraca")}
              </TabsTrigger>
              <TabsTrigger
                value="labarugi"
                className="text-xxs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400"
              >
                {t("accounting.tabs.labarugi")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="coa">
              <AccountingCoa
                coaAccounts={a.coaAccounts}
                showModal={a.showCoaModal}
                setShowModal={a.setShowCoaModal}
                newValues={a.newCoaValues}
                setNewValues={a.setNewCoaValues}
                onSubmit={a.handleCreateCoaSubmit}
              />
            </TabsContent>

            <TabsContent value="journal">
              <AccountingJournal
                journalEntries={a.journalEntries}
                showModal={a.showJournalModal}
                setShowModal={a.setShowJournalModal}
                journalForm={a.journalForm}
                setJournalForm={a.setJournalForm}
                onLineChange={a.handleJournalLineChange}
                onAddLine={a.addJournalLineRow}
                onRemoveLine={a.removeJournalLineRow}
                onSubmit={a.handleJournalEntrySubmit}
              />
            </TabsContent>

            <TabsContent value="ledger">
              <AccountingLedger
                coaAccounts={a.coaAccounts}
                selectedCode={a.ledgerSelectedCode}
                setSelectedCode={a.setLedgerSelectedCode}
                entries={a.ledgerEntries}
                balanceStart={a.ledgerBalanceStart}
                balanceEnd={a.ledgerBalanceEnd}
              />
            </TabsContent>

            <TabsContent value="neraca">
              <AccountingReports coaAccounts={a.coaAccounts} />
            </TabsContent>

            <TabsContent value="labarugi">
              <AccountingReports coaAccounts={a.coaAccounts} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
