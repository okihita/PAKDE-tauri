import { useTranslation } from "react-i18next";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Member, SimpananJenis, SimpananStatus } from "@/types";
import type { useMembers } from "@/hooks/useMembers";

type MembersHook = ReturnType<typeof useMembers>;

const jenisOptions: { value: SimpananJenis; labelKey: string }[] = [
  { value: "pokok", labelKey: "members.form.simpanan.jenisPokok" },
  { value: "wajib", labelKey: "members.form.simpanan.jenisWajib" },
  { value: "sukarela", labelKey: "members.form.simpanan.jenisSukarela" },
];

const statusSimpananOptions: { value: SimpananStatus; labelKey: string }[] = [
  { value: "lunas", labelKey: "members.form.simpanan.statusLunas" },
  { value: "belum", labelKey: "members.form.simpanan.statusBelum" },
  { value: "terlambat", labelKey: "members.form.simpanan.statusTerlambat" },
];

export default function MemberFormDialog({ m }: { m: MembersHook }) {
  const { t } = useTranslation();
  const fv = m.memberFormValues;

  return (
    <Dialog open={m.showMemberModal} onOpenChange={m.setShowMemberModal}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        <form onSubmit={m.handleMemberFormSubmit}>
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-200">
              {m.memberFormType === "add" ? t("members.form.titleAdd") : t("members.form.titleEdit")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4 text-xs max-h-[60vh] overflow-y-auto">
            <div className="space-y-1">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("members.form.labels.nik")}
              </label>
              <Input
                value={fv.nik}
                onChange={(e) => m.setMemberFormValues({ ...fv, nik: e.target.value })}
                className="bg-input border-border text-xs h-8"
                maxLength={16}
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("members.form.labels.name")}
              </label>
              <Input
                value={fv.name}
                onChange={(e) => m.setMemberFormValues({ ...fv, name: e.target.value })}
                className="bg-input border-border text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("members.form.labels.gender")}
              </label>
              <Select
                value={fv.gender}
                onValueChange={(val) => m.setMemberFormValues({ ...fv, gender: val as "L" | "P" })}
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
                {t("members.form.labels.registeredAt")}
              </label>
              <Input
                type="date"
                value={fv.registered_at || ""}
                onChange={(e) => m.setMemberFormValues({ ...fv, registered_at: e.target.value })}
                className="bg-input border-border text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("members.form.labels.placeOfBirth")}
              </label>
              <Input
                value={fv.place_of_birth}
                onChange={(e) => m.setMemberFormValues({ ...fv, place_of_birth: e.target.value })}
                className="bg-input border-border text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("members.form.labels.dateOfBirth")}
              </label>
              <Input
                type="date"
                value={fv.date_of_birth}
                onChange={(e) => m.setMemberFormValues({ ...fv, date_of_birth: e.target.value })}
                className="bg-input border-border text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("members.form.labels.occupation")}
              </label>
              <Input
                value={fv.occupation}
                onChange={(e) => m.setMemberFormValues({ ...fv, occupation: e.target.value })}
                className="bg-input border-border text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("members.form.labels.education")}
              </label>
              <Input
                value={fv.education}
                onChange={(e) => m.setMemberFormValues({ ...fv, education: e.target.value })}
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
                  value={fv.rt}
                  onChange={(e) => m.setMemberFormValues({ ...fv, rt: e.target.value })}
                  className="bg-input border-border text-xs h-8 w-16"
                />
                <Input
                  placeholder={t("members.form.labels.rw")}
                  value={fv.rw}
                  onChange={(e) => m.setMemberFormValues({ ...fv, rw: e.target.value })}
                  className="bg-input border-border text-xs h-8 w-16"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("members.form.labels.hamlet")}
              </label>
              <Input
                value={fv.hamlet}
                onChange={(e) => m.setMemberFormValues({ ...fv, hamlet: e.target.value })}
                className="bg-input border-border text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("members.form.labels.kodeWilayah")}
              </label>
              <Input
                value={fv.kode_wilayah}
                onChange={(e) => m.setMemberFormValues({ ...fv, kode_wilayah: e.target.value })}
                className="bg-input border-border text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("members.form.labels.membershipClass")}
              </label>
              <Select
                value={fv.status_keanggotaan || "anggota_biasa"}
                onValueChange={(val) =>
                  m.setMemberFormValues({ ...fv, status_keanggotaan: val as Member["status_keanggotaan"] })
                }
              >
                <SelectTrigger className="w-full bg-input border-border text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground text-xs">
                  <SelectItem value="anggota_biasa">{t("members.form.simpanan.jenisPokok")}</SelectItem>
                  <SelectItem value="calon_anggota">{t("members.filterActive")}</SelectItem>
                  <SelectItem value="anggota_luar_biasa">{t("members.filterInactive")}</SelectItem>
                  <SelectItem value="anggota_kehormatan">{t("members.tableHeaders.membership")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("members.form.labels.memberStatus")}
              </label>
              <Select
                value={fv.status}
                onValueChange={(val) => m.setMemberFormValues({ ...fv, status: val as "aktif" | "nonaktif" })}
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
                {t("members.form.labels.totalLoan")}
              </label>
              <Input
                type="number"
                value={fv.loan_total}
                onChange={(e) => m.setMemberFormValues({ ...fv, loan_total: Number(e.target.value) })}
                className="bg-input border-border text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("members.form.labels.outstandingLoan")}
              </label>
              <Input
                type="number"
                value={fv.loan_outstanding}
                onChange={(e) => m.setMemberFormValues({ ...fv, loan_outstanding: Number(e.target.value) })}
                className="bg-input border-border text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("members.form.labels.loanStatus")}
              </label>
              <Input
                value={fv.loan_status}
                onChange={(e) => m.setMemberFormValues({ ...fv, loan_status: e.target.value })}
                className="bg-input border-border text-xs h-8"
              />
            </div>

            {/* ── Simpanan ledger (live: simpanan_anggota) ── */}
            <div className="col-span-2 space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xxxs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("members.form.simpanan.title")}
                </span>
                <Button type="button" variant="outline" size="sm" className="text-xxxs h-7" onClick={m.addSimpananRow}>
                  <PlusIcon className="h-3 w-3 mr-1" /> {t("members.form.simpanan.add")}
                </Button>
              </div>
              {m.simpananRows.length === 0 && (
                <p className="text-xxxs text-muted-foreground font-mono">{t("members.tableHeaders.noData")}</p>
              )}
              {m.simpananRows.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="space-y-1 flex-1">
                    <label className="text-xxxs text-muted-foreground">{t("members.form.simpanan.jenis")}</label>
                    <Select
                      value={row.jenis_simpanan}
                      onValueChange={(val) => m.updateSimpananRow(idx, { jenis_simpanan: val as SimpananJenis })}
                    >
                      <SelectTrigger className="w-full bg-input border-border text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground text-xs">
                        {jenisOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {t(o.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 w-24">
                    <label className="text-xxxs text-muted-foreground">{t("members.form.simpanan.periode")}</label>
                    <Input
                      type="month"
                      value={row.periode_pembayaran || ""}
                      onChange={(e) => m.updateSimpananRow(idx, { periode_pembayaran: e.target.value })}
                      className="bg-input border-border text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1 w-28">
                    <label className="text-xxxs text-muted-foreground">{t("members.form.simpanan.jumlah")}</label>
                    <Input
                      type="number"
                      value={row.jumlah_simpanan}
                      onChange={(e) => m.updateSimpananRow(idx, { jumlah_simpanan: Number(e.target.value) })}
                      className="bg-input border-border text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1 w-24">
                    <label className="text-xxxs text-muted-foreground">{t("members.form.simpanan.status")}</label>
                    <Select
                      value={row.status}
                      onValueChange={(val) => m.updateSimpananRow(idx, { status: val as SimpananStatus })}
                    >
                      <SelectTrigger className="w-full bg-input border-border text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground text-xs">
                        {statusSimpananOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {t(o.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-danger"
                    onClick={() => m.removeSimpananRow(idx)}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
              ))}
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
            <Button type="submit" className="bg-brand hover:bg-brand text-brand-foreground font-bold text-xs">
              {m.memberFormType === "add" ? t("members.form.saveAdd") : t("members.form.saveEdit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
