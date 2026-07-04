import { useTranslation } from "react-i18next";
import { Search, Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMembers } from "@/hooks/useMembers";
import { useEffect } from "react";

export default function Members() {
  const { t } = useTranslation();
  const m = useMembers();

  const statusOptions = [
    { value: "semua", label: t("members.filterAll") },
    { value: "aktif", label: t("members.filterActive") },
    { value: "nonaktif", label: t("members.filterInactive") },
  ];

  useEffect(() => {
    m.loadMembersData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t("members.title")}
          </CardTitle>
          <Button
            onClick={m.openAddMemberModal}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-8"
          >
            <Plus className="h-3 w-3 mr-1" /> {t("members.addButton")}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder={t("members.searchPlaceholder")}
                value={m.memberSearchQuery}
                onChange={(e) => m.setMemberSearchQuery(e.target.value)}
                className="pl-7 bg-input border-border text-xs h-8"
              />
            </div>
            <Select value={m.memberFilterStatus} onValueChange={(v) => m.setMemberFilterStatus(v)}>
              <SelectTrigger className="w-36 bg-input border-border text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground text-xs">
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("members.tableHeaders.nik")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("members.tableHeaders.name")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("members.tableHeaders.gender")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("members.tableHeaders.status")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground text-right">
                  {t("members.tableHeaders.pokok")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground text-right">
                  {t("members.tableHeaders.wajib")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground text-right">
                  {t("members.tableHeaders.outstanding")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground text-right w-16">
                  {t("members.tableHeaders.action")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {m.filteredMembers.length === 0 && (
                <TableRow className="border-border">
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs font-mono">
                    {t("members.tableHeaders.noData")}
                  </TableCell>
                </TableRow>
              )}
              {m.filteredMembers.map((mbr) => (
                <TableRow key={mbr.id} className="border-border hover:bg-sidebar-ring">
                  <TableCell className="text-xxs font-mono text-foreground">{mbr.nik}</TableCell>
                  <TableCell className="text-xs text-foreground font-semibold">{mbr.name}</TableCell>
                  <TableCell className="text-xxs font-mono text-muted-foreground">{mbr.gender}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xxxs font-mono font-bold px-2 py-0.5 rounded ${mbr.status === "aktif" ? "text-emerald-400 bg-emerald-500/10" : "text-muted-foreground bg-muted"}`}
                    >
                      {mbr.status.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-xxs font-mono text-emerald-300 text-right">
                    Rp {mbr.savings_pokok.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xxs font-mono text-emerald-300 text-right">
                    Rp {mbr.savings_wajib.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xxs font-mono text-rose-300 text-right">
                    Rp {mbr.loan_outstanding.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => m.openEditMemberModal(mbr)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-rose-400 hover:text-foreground"
                        onClick={() => m.handleDeleteMember(mbr)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Member Form Modal */}
      <Dialog open={m.showMemberModal} onOpenChange={m.setShowMemberModal}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <form onSubmit={m.handleMemberFormSubmit}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-slate-200">
                {m.memberFormType === "add" ? t("members.form.titleAdd") : t("members.form.titleEdit")}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-4 text-xs">
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("members.form.labels.nik")}
                </label>
                <Input
                  value={m.memberFormValues.nik}
                  onChange={(e) => m.setMemberFormValues({ ...m.memberFormValues, nik: e.target.value })}
                  className="bg-input border-border text-xs h-8"
                  maxLength={16}
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("members.form.labels.name")}
                </label>
                <Input
                  value={m.memberFormValues.name}
                  onChange={(e) => m.setMemberFormValues({ ...m.memberFormValues, name: e.target.value })}
                  className="bg-input border-border text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("members.form.labels.gender")}
                </label>
                <Select
                  value={m.memberFormValues.gender}
                  onValueChange={(val) => m.setMemberFormValues({ ...m.memberFormValues, gender: val as "L" | "P" })}
                >
                  <SelectTrigger className="w-full bg-input border-border text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground text-xs">
                    <SelectItem value="L">{t("common.male")}</SelectItem>
                    <SelectItem value="P">{t("common.female")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("members.form.labels.placeOfBirth")}
                </label>
                <Input
                  value={m.memberFormValues.place_of_birth}
                  onChange={(e) => m.setMemberFormValues({ ...m.memberFormValues, place_of_birth: e.target.value })}
                  className="bg-input border-border text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("members.form.labels.dateOfBirth")}
                </label>
                <Input
                  type="date"
                  value={m.memberFormValues.date_of_birth}
                  onChange={(e) => m.setMemberFormValues({ ...m.memberFormValues, date_of_birth: e.target.value })}
                  className="bg-input border-border text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("members.form.labels.occupation")}
                </label>
                <Input
                  value={m.memberFormValues.occupation}
                  onChange={(e) => m.setMemberFormValues({ ...m.memberFormValues, occupation: e.target.value })}
                  className="bg-input border-border text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("members.form.labels.education")}
                </label>
                <Input
                  value={m.memberFormValues.education}
                  onChange={(e) => m.setMemberFormValues({ ...m.memberFormValues, education: e.target.value })}
                  className="bg-input border-border text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("members.form.labels.rtRw")}
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("members.form.labels.rt")}
                    value={m.memberFormValues.rt}
                    onChange={(e) => m.setMemberFormValues({ ...m.memberFormValues, rt: e.target.value })}
                    className="bg-input border-border text-xs h-8 w-16"
                  />
                  <Input
                    placeholder={t("members.form.labels.rw")}
                    value={m.memberFormValues.rw}
                    onChange={(e) => m.setMemberFormValues({ ...m.memberFormValues, rw: e.target.value })}
                    className="bg-input border-border text-xs h-8 w-16"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("members.form.labels.hamlet")}
                </label>
                <Input
                  value={m.memberFormValues.hamlet}
                  onChange={(e) => m.setMemberFormValues({ ...m.memberFormValues, hamlet: e.target.value })}
                  className="bg-input border-border text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("members.form.labels.memberStatus")}
                </label>
                <Select
                  value={m.memberFormValues.status}
                  onValueChange={(val) =>
                    m.setMemberFormValues({ ...m.memberFormValues, status: val as "aktif" | "nonaktif" })
                  }
                >
                  <SelectTrigger className="w-full bg-input border-border text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground text-xs">
                    <SelectItem value="aktif">{t("members.filterActive")}</SelectItem>
                    <SelectItem value="nonaktif">{t("members.filterInactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("members.form.labels.savingsPokok")}
                </label>
                <Input
                  type="number"
                  value={m.memberFormValues.savings_pokok}
                  onChange={(e) =>
                    m.setMemberFormValues({ ...m.memberFormValues, savings_pokok: Number(e.target.value) })
                  }
                  className="bg-input border-border text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("members.form.labels.savingsWajib")}
                </label>
                <Input
                  type="number"
                  value={m.memberFormValues.savings_wajib}
                  onChange={(e) =>
                    m.setMemberFormValues({ ...m.memberFormValues, savings_wajib: Number(e.target.value) })
                  }
                  className="bg-input border-border text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("members.form.labels.savingsSukarela")}
                </label>
                <Input
                  type="number"
                  value={m.memberFormValues.savings_sukarela}
                  onChange={(e) =>
                    m.setMemberFormValues({ ...m.memberFormValues, savings_sukarela: Number(e.target.value) })
                  }
                  className="bg-input border-border text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("members.form.labels.totalLoan")}
                </label>
                <Input
                  type="number"
                  value={m.memberFormValues.loan_total}
                  onChange={(e) => m.setMemberFormValues({ ...m.memberFormValues, loan_total: Number(e.target.value) })}
                  className="bg-input border-border text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("members.form.labels.outstandingLoan")}
                </label>
                <Input
                  type="number"
                  value={m.memberFormValues.loan_outstanding}
                  onChange={(e) =>
                    m.setMemberFormValues({ ...m.memberFormValues, loan_outstanding: Number(e.target.value) })
                  }
                  className="bg-input border-border text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("members.form.labels.loanStatus")}
                </label>
                <Input
                  value={m.memberFormValues.loan_status}
                  onChange={(e) => m.setMemberFormValues({ ...m.memberFormValues, loan_status: e.target.value })}
                  className="bg-input border-border text-xs h-8"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => m.setShowMemberModal(false)}
                className="text-xs border-border"
              >
                {t("members.form.cancel")}
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs">
                {m.memberFormType === "add" ? t("members.form.saveAdd") : t("members.form.saveEdit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
