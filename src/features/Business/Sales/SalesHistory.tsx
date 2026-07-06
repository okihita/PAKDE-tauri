import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { History, FileText, Info } from "lucide-react";
import type { SalesTransaction, Member } from "@/types";

const QUANTITY_PRICE_SEPARATOR = " x Rp ";

interface SalesHistoryProps {
  transactionsList: SalesTransaction[];
  membersList: Member[];
}

export default function SalesHistory({
  transactionsList,
  membersList,
}: SalesHistoryProps) {
  const { t } = useTranslation();
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<SalesTransaction | null>(null);

  const handleOpenReceipt = (tx: SalesTransaction) => {
    setSelectedTx(tx);
    setShowReceiptModal(true);
  };

  const getCustomerLabel = (memberId: string | null) => {
    if (!memberId) return t("sales.checkout.walkIn");
    const m = membersList.find((mbr) => mbr.id === memberId);
    return m ? `${m.name} (${m.nik.slice(-4)})` : memberId;
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-400" />
            {t("sales.history.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("sales.history.id")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("sales.history.date")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("sales.history.customer")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("sales.history.payment")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground text-right">
                  {t("sales.history.amount")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground text-right w-24">
                  {t("sales.history.action")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsList.map((tx) => (
                <TableRow key={tx.id} className="border-border hover:bg-sidebar-ring">
                  <TableCell className="text-xxs font-mono text-muted-foreground truncate max-w-[120px]">
                    {tx.id}
                  </TableCell>
                  <TableCell className="text-xxs font-mono text-muted-foreground">
                    {tx.transaction_date}
                  </TableCell>
                  <TableCell className="text-xs text-foreground font-semibold">
                    {getCustomerLabel(tx.member_id)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xxxs font-mono font-bold px-1.5 py-0.5 rounded ${
                        tx.payment_type === "cash"
                          ? "text-emerald-400 bg-emerald-500/10"
                          : "text-amber-400 bg-amber-500/10"
                      }`}
                    >
                      {tx.payment_type.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-xxs font-mono text-foreground font-bold text-right">
                    Rp {tx.total_amount.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReceipt(tx)}
                      className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-xxs h-7.5 px-3"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      {t("sales.history.action")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {transactionsList.length === 0 && (
                <TableRow className="border-border">
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs font-mono">
                    {t("sales.history.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">
              {t("sales.history.detailsTitle")}
            </DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4 pt-2 text-xxs">
              <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-3 font-mono">
                <div>
                  <p className="text-muted-foreground uppercase">{t("sales.history.id")}</p>
                  <p className="text-foreground font-bold">{selectedTx.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground uppercase">{t("sales.history.date")}</p>
                  <p className="text-foreground">{selectedTx.transaction_date}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase">{t("sales.history.customer")}</p>
                  <p className="text-foreground font-bold">{getCustomerLabel(selectedTx.member_id)}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground uppercase">{t("sales.history.payment")}</p>
                  <p className="text-foreground">
                    <span className="font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20 text-xxs">
                      {selectedTx.payment_type.toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <p className="font-bold text-muted-foreground uppercase tracking-wide">
                  {t("sales.history.items")}
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedTx.items?.map((it) => (
                    <div
                      key={it.id}
                      className="flex justify-between items-center py-1 font-mono border-b border-border/30"
                    >
                      <div>
                        <p className="text-foreground font-semibold">{it.item_name || it.item_id}</p>
                        <p className="text-xxs text-muted-foreground">
                          {it.quantity}
                          {QUANTITY_PRICE_SEPARATOR}
                          {it.price.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <p className="text-foreground font-bold">
                        Rp {(it.quantity * it.price).toLocaleString("id-ID")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Accounting */}
              <div className="pt-2 space-y-2 border-t border-border/50">
                <div className="flex justify-between items-baseline font-mono">
                  <span className="font-bold text-muted-foreground uppercase">
                    {t("sales.checkout.total")}
                  </span>
                  <span className="text-sm font-black text-emerald-400">
                    Rp {selectedTx.total_amount.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="p-2 rounded bg-input/20 border border-border/30 font-mono text-xxs text-muted-foreground">
                  <span className="flex items-center gap-1 text-emerald-400/90">
                    <Info className="h-3 w-3" />
                    {t("sales.history.journalRef", {
                      num: selectedTx.journal_entry_id?.slice(-8),
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowReceiptModal(false)}
              className="border-border text-muted-foreground text-xs h-8"
            >
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
