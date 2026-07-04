import { Plus, Trash2, CalendarDays } from "lucide-react";
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
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setShowModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-8"
        >
          <Plus className="h-3 w-3 mr-1" /> Entri Jurnal Baru
        </Button>
      </div>

      {journalEntries.map((entry) => (
        <Card key={entry.id} className="bg-[#0b101c]/90 border-slate-900">
          <CardHeader className="py-3">
            <CardTitle className="text-xs font-mono flex items-center gap-3 text-slate-400">
              <CalendarDays className="h-3 w-3" />
              <span className="text-white font-bold">{entry.number}</span>
              <span className="text-slate-500">— {entry.date}</span>
              <span className="ml-auto text-[9px] text-slate-600">{entry.category}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <p className="text-[10px] text-slate-400 mb-2">{entry.description}</p>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-900 hover:bg-transparent">
                  <TableHead className="text-[9px] font-mono text-slate-500 py-1">Akun</TableHead>
                  <TableHead className="text-[9px] font-mono text-slate-500 py-1">Nama</TableHead>
                  <TableHead className="text-[9px] font-mono text-slate-500 py-1 text-right">Debit</TableHead>
                  <TableHead className="text-[9px] font-mono text-slate-500 py-1 text-right">Kredit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.lines.map((line, i) => (
                  <TableRow key={i} className="border-slate-900">
                    <TableCell className="text-[9px] font-mono text-slate-300 py-1">{line.account_code}</TableCell>
                    <TableCell className="text-[9px] font-mono text-slate-500 py-1">{line.name}</TableCell>
                    <TableCell className="text-[9px] font-mono text-emerald-300 py-1 text-right">
                      Rp {line.debit.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-[9px] font-mono text-rose-300 py-1 text-right">
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
        <div className="text-center py-12 text-slate-500 text-xs font-mono">
          Belum ada entri jurnal. Buat entri baru untuk memulai.
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#0b101c] border-slate-900 text-white max-w-xl max-h-[80vh] overflow-y-auto">
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Entri Jurnal Baru</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[9px] uppercase">Nomor Bukti</label>
                <Input
                  value={journalForm.number}
                  onChange={(e) => setJournalForm({ ...journalForm, number: e.target.value })}
                  className="bg-slate-950 border-slate-900 text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[9px] uppercase">Tanggal</label>
                <Input
                  type="date"
                  value={journalForm.date}
                  className="bg-slate-950 border-slate-900 text-xs h-8"
                  onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-slate-500 font-mono text-[9px] uppercase">Keterangan</label>
                <Input
                  value={journalForm.description}
                  className="bg-slate-950 border-slate-900 text-xs h-8"
                  onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1 text-xs mt-2">
              <label className="text-slate-500 font-mono text-[9px] uppercase">Baris Jurnal</label>
              {journalForm.lines.map((line, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={line.accountCode}
                    onChange={(e) => onLineChange(i, "accountCode", e.target.value)}
                    placeholder="Kode Akun"
                    className="bg-slate-950 border-slate-900 text-xs h-8 w-20"
                  />
                  <Input
                    type="number"
                    value={line.debit || ""}
                    onChange={(e) => onLineChange(i, "debit", Number(e.target.value))}
                    placeholder="Debit"
                    className="bg-slate-950 border-slate-900 text-xs h-8 flex-1"
                  />
                  <Input
                    type="number"
                    value={line.credit || ""}
                    onChange={(e) => onLineChange(i, "credit", Number(e.target.value))}
                    placeholder="Kredit"
                    className="bg-slate-950 border-slate-900 text-xs h-8 flex-1"
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
              <Button variant="outline" type="button" className="text-xs border-slate-900 h-7 mt-1" onClick={onAddLine}>
                + Tambah Baris
              </Button>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="text-xs border-slate-900"
              >
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs">
                Simpan Jurnal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
