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
        <span className="text-[10px] font-mono text-slate-500">{t("accounting.ledger.selectLabel")}</span>
        <Select value={selectedCode} onValueChange={setSelectedCode}>
          <SelectTrigger className="w-80 bg-slate-950 border-slate-900 text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0b101c] border-slate-900 text-white text-xs max-h-60">
            {coaAccounts.map((a) => (
              <SelectItem key={a.code} value={a.code}>
                {a.code} — {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-6 text-xs mb-2">
        <span className="font-mono text-slate-400">
          {t("accounting.ledger.balanceStart")}:{" "}
          <span className="text-white font-bold">Rp {balanceStart.toLocaleString()}</span>
        </span>
        <span className="font-mono text-slate-400">
          {t("accounting.ledger.balanceEnd")}:{" "}
          <span className="text-emerald-400 font-bold">Rp {balanceEnd.toLocaleString()}</span>
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-slate-900 hover:bg-transparent">
            <TableHead className="text-[9px] font-mono text-slate-500">
              {t("accounting.ledger.tableHeaders.date")}
            </TableHead>
            <TableHead className="text-[9px] font-mono text-slate-500">
              {t("accounting.ledger.tableHeaders.number")}
            </TableHead>
            <TableHead className="text-[9px] font-mono text-slate-500">
              {t("accounting.ledger.tableHeaders.description")}
            </TableHead>
            <TableHead className="text-[9px] font-mono text-slate-500 text-right">
              {t("accounting.ledger.tableHeaders.debit")}
            </TableHead>
            <TableHead className="text-[9px] font-mono text-slate-500 text-right">
              {t("accounting.ledger.tableHeaders.kredit")}
            </TableHead>
            <TableHead className="text-[9px] font-mono text-slate-500 text-right">
              {t("accounting.ledger.tableHeaders.balance")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 && (
            <TableRow className="border-slate-900">
              <TableCell colSpan={6} className="text-center py-8 text-slate-500 text-xs font-mono">
                {t("accounting.ledger.empty")}
              </TableCell>
            </TableRow>
          )}
          {entries.map((e, i) => (
            <TableRow key={i} className="border-slate-900 hover:bg-[#0e1326]">
              <TableCell className="text-[9px] font-mono text-slate-400">{e.date}</TableCell>
              <TableCell className="text-[9px] font-mono text-slate-300">{e.number}</TableCell>
              <TableCell className="text-[9px] font-mono text-slate-500">{e.entry_desc}</TableCell>
              <TableCell className="text-[9px] font-mono text-emerald-300 text-right">
                {e.debit > 0 ? `Rp ${e.debit.toLocaleString()}` : ""}
              </TableCell>
              <TableCell className="text-[9px] font-mono text-rose-300 text-right">
                {e.credit > 0 ? `Rp ${e.credit.toLocaleString()}` : ""}
              </TableCell>
              <TableCell className="text-[9px] font-mono text-white font-bold text-right">
                Rp {e.runningBalance.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
