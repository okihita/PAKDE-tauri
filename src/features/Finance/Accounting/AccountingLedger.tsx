import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CoaAccount, LedgerLine } from "@/types";

interface Props {
  coaAccounts: CoaAccount[];
  selectedCode: string;
  setSelectedCode: (v: string) => void;
  entries: LedgerLine[];
  balanceStart: number;
  balanceEnd: number;
}

export default function AccountingLedger({
  coaAccounts,
  selectedCode,
  setSelectedCode,
  entries,
  balanceStart,
  balanceEnd,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xxs font-mono text-muted-foreground">{t("accounting.ledger.selectLabel")}</span>
        <Select value={selectedCode} onValueChange={setSelectedCode}>
          <SelectTrigger className="w-80 bg-input border-border text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground text-xs max-h-60">
            {coaAccounts.map((a) => (
              <SelectItem key={a.code} value={a.code}>
                {a.code} — {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-6 text-xs mb-2">
        <span className="font-mono text-muted-foreground">
          {t("accounting.ledger.balanceStart")}:{" "}
          <span className="text-foreground font-bold">Rp {balanceStart.toLocaleString()}</span>
        </span>
        <span className="font-mono text-muted-foreground">
          {t("accounting.ledger.balanceEnd")}:{" "}
          <span className="text-emerald-400 font-bold">Rp {balanceEnd.toLocaleString()}</span>
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-xxxs font-mono text-muted-foreground">
              {t("accounting.ledger.tableHeaders.date")}
            </TableHead>
            <TableHead className="text-xxxs font-mono text-muted-foreground">
              {t("accounting.ledger.tableHeaders.number")}
            </TableHead>
            <TableHead className="text-xxxs font-mono text-muted-foreground">
              {t("accounting.ledger.tableHeaders.description")}
            </TableHead>
            <TableHead className="text-xxxs font-mono text-muted-foreground text-right">
              {t("accounting.ledger.tableHeaders.debit")}
            </TableHead>
            <TableHead className="text-xxxs font-mono text-muted-foreground text-right">
              {t("accounting.ledger.tableHeaders.kredit")}
            </TableHead>
            <TableHead className="text-xxxs font-mono text-muted-foreground text-right">
              {t("accounting.ledger.tableHeaders.balance")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 && (
            <TableRow className="border-border">
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs font-mono">
                {t("accounting.ledger.empty")}
              </TableCell>
            </TableRow>
          )}
          {entries.map((e, i) => (
            <TableRow key={i} className="border-border hover:bg-sidebar-ring">
              <TableCell className="text-xxxs font-mono text-muted-foreground">{e.date}</TableCell>
              <TableCell className="text-xxxs font-mono text-foreground">{e.number}</TableCell>
              <TableCell className="text-xxxs font-mono text-muted-foreground">{e.entry_desc}</TableCell>
              <TableCell className="text-xxxs font-mono text-emerald-300 text-right">
                {e.debit > 0 ? `Rp ${e.debit.toLocaleString()}` : ""}
              </TableCell>
              <TableCell className="text-xxxs font-mono text-rose-300 text-right">
                {e.credit > 0 ? `Rp ${e.credit.toLocaleString()}` : ""}
              </TableCell>
              <TableCell className="text-xxxs font-mono text-foreground font-bold text-right">
                Rp {e.runningBalance.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
