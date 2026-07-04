import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CoaAccount } from "@/types";

interface Props {
  coaAccounts: CoaAccount[];
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  newValues: {
    code: string;
    name: string;
    type: CoaAccount["type"];
    normal_balance: CoaAccount["normal_balance"];
    balance: number;
  };
  setNewValues: (v: Props["newValues"]) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AccountingCoa({
  coaAccounts,
  showModal,
  setShowModal,
  newValues,
  setNewValues,
  onSubmit,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          onClick={() => setShowModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-8"
        >
          <Plus className="h-3 w-3 mr-1" /> Tambah Akun
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-slate-900 hover:bg-transparent">
            <TableHead className="text-[10px] font-mono text-slate-500 w-20">Kode</TableHead>
            <TableHead className="text-[10px] font-mono text-slate-500">Nama Akun</TableHead>
            <TableHead className="text-[10px] font-mono text-slate-500">Tipe</TableHead>
            <TableHead className="text-[10px] font-mono text-slate-500">Saldo Normal</TableHead>
            <TableHead className="text-[10px] font-mono text-slate-500 text-right">Saldo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coaAccounts.map((a) => (
            <TableRow key={a.code} className="border-slate-900 hover:bg-[#0e1326]">
              <TableCell className="text-[10px] font-mono text-slate-300">{a.code}</TableCell>
              <TableCell className="text-xs text-white">{a.name}</TableCell>
              <TableCell className="text-[10px] font-mono text-slate-400">{a.type}</TableCell>
              <TableCell className="text-[10px] font-mono text-slate-400">{a.normal_balance}</TableCell>
              <TableCell
                className={`text-[10px] font-mono font-bold text-right ${a.balance >= 0 ? "text-emerald-300" : "text-rose-300"}`}
              >
                Rp {a.balance.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#0b101c] border-slate-900 text-white max-w-sm">
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Tambah Akun COA</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[9px] uppercase">Kode Akun</label>
                <Input
                  value={newValues.code}
                  onChange={(e) => setNewValues({ ...newValues, code: e.target.value })}
                  className="bg-slate-950 border-slate-900 text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[9px] uppercase">Nama Akun</label>
                <Input
                  value={newValues.name}
                  onChange={(e) => setNewValues({ ...newValues, name: e.target.value })}
                  className="bg-slate-950 border-slate-900 text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[9px] uppercase">Tipe Akun</label>
                <Select
                  value={newValues.type}
                  onValueChange={(val) => setNewValues({ ...newValues, type: val as CoaAccount["type"] })}
                >
                  <SelectTrigger className="w-full bg-slate-950 border-slate-900 text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b101c] border-slate-900 text-white text-xs">
                    <SelectItem value="aset">Aset</SelectItem>
                    <SelectItem value="kewajiban">Kewajiban</SelectItem>
                    <SelectItem value="ekuitas">Ekuitas</SelectItem>
                    <SelectItem value="pendapatan">Pendapatan</SelectItem>
                    <SelectItem value="beban">Beban</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[9px] uppercase">Saldo Normal</label>
                <Select
                  value={newValues.normal_balance}
                  onValueChange={(val) =>
                    setNewValues({ ...newValues, normal_balance: val as CoaAccount["normal_balance"] })
                  }
                >
                  <SelectTrigger className="w-full bg-slate-950 border-slate-900 text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b101c] border-slate-900 text-white text-xs">
                    <SelectItem value="debit">Debit</SelectItem>
                    <SelectItem value="kredit">Kredit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[9px] uppercase">Saldo Awal</label>
                <Input
                  type="number"
                  value={newValues.balance}
                  onChange={(e) => setNewValues({ ...newValues, balance: Number(e.target.value) })}
                  className="bg-slate-950 border-slate-900 text-xs h-8"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="text-xs border-slate-900"
              >
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs">
                Simpan Akun
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
