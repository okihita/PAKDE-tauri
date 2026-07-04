import { useTranslation } from "react-i18next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CoaAccount } from "@/types";

function computeReports(coaAccounts: CoaAccount[]) {
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
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <TableRow className="border-slate-900">
      <TableCell className={`text-[10px] font-mono py-1.5 ${accent ? "font-bold text-white pl-6" : "text-slate-400"}`}>
        {label}
      </TableCell>
      <TableCell
        className={`text-[10px] font-mono text-right py-1.5 ${accent ? "font-bold text-white" : "text-slate-300"}`}
      >
        {value}
      </TableCell>
    </TableRow>
  );
}

export default function AccountingReports({ coaAccounts }: { coaAccounts: CoaAccount[] }) {
  const { t } = useTranslation();
  const r = computeReports(coaAccounts);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Neraca */}
      <div className="bg-[#0b101c]/90 border border-slate-900 rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-400 font-mono tracking-wider uppercase border-b border-slate-900 pb-2 mb-3">
          {t("accounting.reports.neraca.title")}
        </h4>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-900 hover:bg-transparent">
              <TableHead className="text-[9px] font-mono text-slate-500 py-1">
                {t("accounting.reports.neraca.account")}
              </TableHead>
              <TableHead className="text-[9px] font-mono text-slate-500 py-1 text-right">
                {t("accounting.reports.neraca.balance")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="border-slate-900">
              <TableCell className="text-[9px] font-mono text-emerald-400 font-bold py-1" colSpan={2}>
                {t("accounting.reports.neraca.aset")}
              </TableCell>
            </TableRow>
            {r.assets.map((a) => (
              <Row key={a.code} label={a.name} value={a.balance.toLocaleString()} />
            ))}
            <Row
              label={`${t("common.total")} ${t("accounting.reports.neraca.aset")}`}
              value={r.totalAssets.toLocaleString()}
              accent
            />
            <TableRow className="border-slate-900">
              <TableCell className="text-[9px] font-mono text-amber-400 font-bold py-1" colSpan={2}>
                {t("accounting.reports.neraca.kewajiban")}
              </TableCell>
            </TableRow>
            {r.liabilities.map((a) => (
              <Row key={a.code} label={a.name} value={a.balance.toLocaleString()} />
            ))}
            <Row
              label={`${t("common.total")} ${t("accounting.reports.neraca.kewajiban")}`}
              value={r.totalLiabilities.toLocaleString()}
              accent
            />
            <TableRow className="border-slate-900">
              <TableCell className="text-[9px] font-mono text-blue-400 font-bold py-1" colSpan={2}>
                {t("accounting.reports.neraca.ekuitas")}
              </TableCell>
            </TableRow>
            {r.equity.map((a) => (
              <Row key={a.code} label={a.name} value={a.balance.toLocaleString()} />
            ))}
            <Row
              label={`${t("common.total")} ${t("accounting.reports.neraca.ekuitas")}`}
              value={r.totalEquity.toLocaleString()}
              accent
            />
            <TableRow className="border-slate-900 bg-emerald-500/5">
              <TableCell className="text-[9px] font-mono text-white font-bold py-1">
                {t("accounting.reports.neraca.totalLiabilitiesEquity")}
              </TableCell>
              <TableCell className="text-[9px] font-mono text-white font-bold py-1 text-right">
                Rp {(r.totalLiabilities + r.totalEquity).toLocaleString()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Laba Rugi */}
      <div className="bg-[#0b101c]/90 border border-slate-900 rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-400 font-mono tracking-wider uppercase border-b border-slate-900 pb-2 mb-3">
          {t("accounting.reports.labarugi.title")}
        </h4>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-900 hover:bg-transparent">
              <TableHead className="text-[9px] font-mono text-slate-500 py-1">
                {t("accounting.reports.neraca.account")}
              </TableHead>
              <TableHead className="text-[9px] font-mono text-slate-500 py-1 text-right">
                {t("accounting.reports.neraca.balance")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="border-slate-900">
              <TableCell className="text-[9px] font-mono text-emerald-400 font-bold py-1" colSpan={2}>
                {t("accounting.reports.labarugi.pendapatan")}
              </TableCell>
            </TableRow>
            {r.revenues.map((a) => (
              <Row key={a.code} label={a.name} value={a.balance.toLocaleString()} />
            ))}
            <Row
              label={`${t("common.total")} ${t("accounting.reports.labarugi.pendapatan")}`}
              value={r.totalRevenue.toLocaleString()}
              accent
            />
            <TableRow className="border-slate-900">
              <TableCell className="text-[9px] font-mono text-rose-400 font-bold py-1" colSpan={2}>
                {t("accounting.reports.labarugi.beban")}
              </TableCell>
            </TableRow>
            {r.expenses.map((a) => (
              <Row key={a.code} label={a.name} value={a.balance.toLocaleString()} />
            ))}
            <Row
              label={`${t("common.total")} ${t("accounting.reports.labarugi.beban")}`}
              value={r.totalExpense.toLocaleString()}
              accent
            />
            <Row label={t("accounting.reports.labarugi.shuGross")} value={r.shuKotor.toLocaleString()} accent />
            <Row label={t("accounting.reports.labarugi.tax")} value={r.tax.toLocaleString()} />
            <TableRow className="border-slate-900 bg-emerald-500/5">
              <TableCell className="text-[9px] font-mono text-white font-bold py-1">
                {t("accounting.reports.labarugi.shuNet")}
              </TableCell>
              <TableCell className="text-[9px] font-mono text-emerald-400 font-bold py-1 text-right">
                Rp {r.shuBersih.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
