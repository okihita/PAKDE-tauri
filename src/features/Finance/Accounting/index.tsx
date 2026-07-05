import DevDocStripe from "@/components/DevDocStripe";
import readmeContent from "./README.md?raw";
import "./Accounting.css";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccounting } from "@/hooks/useAccounting";
import AccountingCoa from "./AccountingCoa";
import AccountingJournal from "./AccountingJournal";
import AccountingLedger from "./AccountingLedger";
import AccountingReports from "./AccountingReports";

export default function Accounting() {
  const a = useAccounting();
  const { t } = useTranslation();

  useEffect(() => {
    a.loadAccountsData();
    a.loadJournalData();
    a.loadLedgerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <DevDocStripe content={readmeContent} />
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
  );
}
