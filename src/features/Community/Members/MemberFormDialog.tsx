import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Member, SimpananJenis, SimpananStatus } from "@/types";
import type { useMembers } from "@/hooks/useMembers";
import RegionPicker from "@/features/System/ProfileSelect/RegionPicker";
import type { WilayahRow } from "@/features/System/ProfileSelect/wilayahDb";
import { getActiveCoopId } from "@/db/active-coop";
import { getCooperativeById } from "@/features/System/ProfileSelect/cooperativeDb";
import { resolveWilayah, type WilayahResolved } from "@/db/wilayahLookup";
import { generateNik, isValidNik, parseNik } from "@/data/nik";

type MembersHook = ReturnType<typeof useMembers>;

type RegionInitial = {
  province: WilayahRow;
  regency: WilayahRow;
  district: WilayahRow;
  village: WilayahRow;
};

function toRegionInitial(res: WilayahResolved): RegionInitial {
  return {
    province: { kode: res.province_code, nama: res.province_name, level: 1 },
    regency: { kode: res.regency_code, nama: res.regency_name, level: 2 },
    district: { kode: res.district_code, nama: res.district_name, level: 3 },
    village: { kode: res.village_code, nama: res.village_name, level: 4 },
  };
}

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

const loanStatusOptions: string[] = ["lancar", "diragukan", "macet"];

export default function MemberFormDialog({ m }: { m: MembersHook }) {
  const { t } = useTranslation();
  const fv = m.memberFormValues;

  const [regionInitial, setRegionInitial] = useState<RegionInitial | undefined>(undefined);
  const [regionReady, setRegionReady] = useState(false);
  const [regionKey, setRegionKey] = useState(0);
  const [nikSeq, setNikSeq] = useState(1);
  const [nikTouched, setNikTouched] = useState(false);

  // On dialog open: seed the RegionPicker (edit → member's code; add → coop default)
  // and reset NIK auto-generation state. Keyed on open + type + member id so it
  // runs once per dialog session, not on every keystroke.
  useEffect(() => {
    if (!m.showMemberModal) return;
    let cancelled = false;
    void (async () => {
      setRegionReady(false);
      let code = "";
      if (m.memberFormType === "edit") {
        setNikTouched(true); // never auto-overwrite an existing NIK
        code = m.memberFormValues.kode_wilayah || "";
      } else {
        setNikTouched(false);
        setNikSeq(Math.floor(Math.random() * 9999) + 1);
        const coopId = getActiveCoopId();
        const coop = coopId ? await getCooperativeById(coopId) : null;
        code = coop?.village_code?.trim() || "";
        if (code) m.setMemberFormValues((prev) => ({ ...prev, kode_wilayah: code }));
      }
      const res = code ? await resolveWilayah(code) : null;
      if (cancelled) return;
      setRegionInitial(res ? toRegionInitial(res) : undefined);
      setRegionKey((k) => k + 1);
      setRegionReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.showMemberModal, m.memberFormType, m.memberFormValues.id]);

  // Auto-generate a valid NIK in add mode once region + DOB + gender are set,
  // unless the user has manually edited the field. The conflict nonce is folded
  // into the sequence so a duplicate-NIK submit yields a fresh candidate.
  useEffect(() => {
    if (m.memberFormType !== "add" || nikTouched) return;
    const { kode_wilayah, date_of_birth, gender } = m.memberFormValues;
    if (!kode_wilayah || !date_of_birth || !gender) return;
    const seq = ((nikSeq + m.nikConflictNonce - 1) % 9999) + 1;
    const nik = generateNik(kode_wilayah, date_of_birth, gender, seq);
    if (nik !== m.memberFormValues.nik) m.setMemberFormValues((prev) => ({ ...prev, nik }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    m.memberFormType,
    nikTouched,
    nikSeq,
    m.nikConflictNonce,
    m.memberFormValues.kode_wilayah,
    m.memberFormValues.date_of_birth,
    m.memberFormValues.gender,
  ]);

  const nikInvalid = fv.nik.length > 0 && !isValidNik(fv.nik);
  const nikParsed = isValidNik(fv.nik) ? parseNik(fv.nik) : null;

  // Zero-pad a numeric RT/RW field to 3 digits on blur (Indonesian convention).
  const padOnBlur = (field: "rt" | "rw") => (value: string) => {
    const v = value.trim();
    if (/^\d+$/.test(v)) m.setMemberFormValues((prev) => ({ ...prev, [field]: v.padStart(3, "0") }));
  };

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
                onChange={(e) => {
                  setNikTouched(true);
                  m.setMemberFormValues({ ...fv, nik: e.target.value });
                }}
                className="bg-input border-border text-xs h-8"
                maxLength={16}
              />
              {nikInvalid && <p className="text-xxxs text-danger">{t("members.form.nikInvalidHint")}</p>}
              {nikParsed && (
                <p className="text-xxxs text-muted-foreground font-mono">
                  {nikParsed.gender === "P" ? t("common.female") : t("common.male")} ·{" "}
                  {String(nikParsed.birthDay).padStart(2, "0")}/{String(nikParsed.birthMonth).padStart(2, "0")}/
                  {String(nikParsed.birthYear).padStart(2, "0")}
                </p>
              )}
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
                  onBlur={(e) => padOnBlur("rt")(e.target.value)}
                  className="bg-input border-border text-xs h-8 w-16"
                />
                <Input
                  placeholder={t("members.form.labels.rw")}
                  value={fv.rw}
                  onChange={(e) => m.setMemberFormValues({ ...fv, rw: e.target.value })}
                  onBlur={(e) => padOnBlur("rw")(e.target.value)}
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
            <div className="space-y-1 col-span-2">
              <label className="text-muted-foreground font-mono text-xxxs uppercase">
                {t("members.form.labels.region")}
              </label>
              {regionReady ? (
                <RegionPicker
                  key={regionKey}
                  initial={regionInitial}
                  onChange={(region) => {
                    // Always sync so the saved code matches what the picker shows.
                    // An incomplete selection yields "" and is caught on submit,
                    // preventing a stale code from diverging from the displayed region.
                    m.setMemberFormValues((prev) => ({ ...prev, kode_wilayah: region.village_code }));
                  }}
                />
              ) : (
                <p className="text-xxxs text-muted-foreground font-mono">{t("members.form.regionLoading")}</p>
              )}
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
                  <SelectItem value="anggota_biasa">{t("members.membership.anggotaBiasa")}</SelectItem>
                  <SelectItem value="calon_anggota">{t("members.membership.calonAnggota")}</SelectItem>
                  <SelectItem value="anggota_luar_biasa">{t("members.membership.anggotaLuarBiasa")}</SelectItem>
                  <SelectItem value="anggota_kehormatan">{t("members.membership.anggotaKehormatan")}</SelectItem>
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
              <div className="flex gap-2">
                {loanStatusOptions.map((opt) => {
                  const active = fv.loan_status === opt;
                  return (
                    <label
                      key={opt}
                      className={`flex items-center gap-1.5 px-3 h-8 rounded border cursor-pointer text-xs transition-colors ${
                        active
                          ? "border-brand bg-brand/10 text-brand font-bold"
                          : "border-border bg-input text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name="loan_status"
                        value={opt}
                        checked={active}
                        onChange={() => m.setMemberFormValues({ ...fv, loan_status: opt })}
                        className="accent-brand"
                      />
                      {t(`members.form.labels.loanStatusOptions.${opt}`)}
                    </label>
                  );
                })}
              </div>
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
