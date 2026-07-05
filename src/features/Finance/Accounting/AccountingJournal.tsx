import { Plus, Trash2, CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { JournalEntryWithLines, JournalLineInput } from "@/types";

interface Props {
  journalEntries: JournalEntryWithLines[];
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  journalForm: {
    date: string;
    number: string;
    description: string;
    reference: string;
    category: string;
    tags: string;
    lines: JournalLineInput[];
  };
  setJournalForm: (v: Props["journalForm"]) => void;
  onLineChange: (index: number, key: keyof JournalLineInput, value: string | number) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AccountingJournal({
  journalEntries,
  showModal,
  setShowModal,
  journalForm,
  setJournalForm,
  onLineChange,
  onAddLine,
  onRemoveLine,
  onSubmit,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setShowModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-8"
        >
          <Plus className="h-3 w-3 mr-1" /> {t("accounting.journal.addButton")}
        </Button>
      </div>

      {journalEntries.map((entry) => (
        <Card key={entry.id} className="bg-card border-border">
          <CardHeader className="py-3">
            <CardTitle className="text-xs font-mono flex items-center gap-3 text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              <span className="text-foreground font-bold">{entry.number}</span>
              <span className="text-muted-foreground">— {entry.date}</span>
              <span className="ml-auto text-xxxs text-muted-foreground">{entry.category}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <p className="text-xxs text-muted-foreground mb-2">{entry.description}</p>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xxxs font-mono text-muted-foreground py-1">
                    {t("accounting.journal.tableHeaders.account")}
                  </TableHead>
                  <TableHead className="text-xxxs font-mono text-muted-foreground py-1">
                    {t("accounting.journal.tableHeaders.name")}
                  </TableHead>
                  <TableHead className="text-xxxs font-mono text-muted-foreground py-1 text-right">
                    {t("accounting.journal.tableHeaders.debit")}
                  </TableHead>
                  <TableHead className="text-xxxs font-mono text-muted-foreground py-1 text-right">
                    {t("accounting.journal.tableHeaders.kredit")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.lines.map((line, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="text-xxxs font-mono text-foreground py-1">{line.account_code}</TableCell>
                    <TableCell className="text-xxxs font-mono text-muted-foreground py-1">{line.name}</TableCell>
                    <TableCell className="text-xxxs font-mono text-emerald-300 py-1 text-right">
                      Rp {line.debit.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xxxs font-mono text-rose-300 py-1 text-right">
                      Rp {line.credit.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {journalEntries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-xs font-mono">{t("accounting.journal.empty")}</div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border text-foreground max-w-xl max-h-[80vh] overflow-y-auto">
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">{t("accounting.journal.modal.title")}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-4 text-xs">
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("accounting.journal.modal.numberLabel")}
                </label>
                <Input
                  value={journalForm.number}
                  onChange={(e) => setJournalForm({ ...journalForm, number: e.target.value })}
                  className="bg-input border-border text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("accounting.journal.modal.dateLabel")}
                </label>
                <Input
                  type="date"
                  value={journalForm.date}
                  className="bg-input border-border text-xs h-8"
                  onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("accounting.journal.modal.descLabel")}
                </label>
                <Input
                  value={journalForm.description}
                  className="bg-input border-border text-xs h-8"
                  onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1 text-xs mt-2">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("accounting.journal.modal.linesLabel")}
              </label>
              {journalForm.lines.map((line, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={line.accountCode}
                    onChange={(e) => onLineChange(i, "accountCode", e.target.value)}
                    placeholder={t("accounting.journal.modal.codePlaceholder")}
                    className="bg-input border-border text-xs h-8 w-20"
                  />
                  <Input
                    type="number"
                    value={line.debit || ""}
                    onChange={(e) => onLineChange(i, "debit", Number(e.target.value))}
                    placeholder={t("accounting.journal.modal.debitPlaceholder")}
                    className="bg-input border-border text-xs h-8 flex-1"
                  />
                  <Input
                    type="number"
                    value={line.credit || ""}
                    onChange={(e) => onLineChange(i, "credit", Number(e.target.value))}
                    placeholder={t("accounting.journal.modal.creditPlaceholder")}
                    className="bg-input border-border text-xs h-8 flex-1"
                  />
                  {journalForm.lines.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-rose-400"
                      onClick={() => onRemoveLine(i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" type="button" className="text-xs border-border h-7 mt-1" onClick={onAddLine}>
                {t("accounting.journal.modal.addLine")}
              </Button>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="text-xs border-border"
              >
                {t("accounting.journal.modal.cancel")}
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs">
                {t("accounting.journal.modal.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
