import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PencilSimpleIcon, TrashIcon, MapPinIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Member, Simpanan } from "@/types";
import type { useMembers } from "@/hooks/useMembers";
import { resolveWilayah, formatWilayahShort } from "@/db/wilayahLookup";

type MembersHook = ReturnType<typeof useMembers>;

interface Props {
  m: MembersHook;
  member: Member | null;
  onClose: () => void;
  onRequestDelete: (member: Member) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span className="text-xxxs font-mono uppercase tracking-wider text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs text-foreground text-right truncate">{children}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 rounded-lg border border-border p-3">
      <p className="text-xxxs font-bold uppercase tracking-wider text-muted-foreground mb-1">{title}</p>
      {children}
    </div>
  );
}

export default function MemberDetailDialog({ m, member, onClose, onRequestDelete }: Props) {
  const { t } = useTranslation();
  const [regionLabel, setRegionLabel] = useState("");

  useEffect(() => {
    if (!member) return;
    let cancelled = false;
    void (async () => {
      const res = await resolveWilayah(member.kode_wilayah);
      if (!cancelled) setRegionLabel(formatWilayahShort(res));
    })();
    if (member.id) void m.loadSimpananForMember(member.id);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id]);

  const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;
  const totalSimpanan = (mb: Member) => (mb.savings_pokok || 0) + (mb.savings_wajib || 0) + (mb.savings_sukarela || 0);

  const simpananRows: Simpanan[] = m.simpananRows;

  return (
    <Dialog open={!!member} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        {member && (
          <>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-foreground pr-6 flex items-center gap-2">
                <span className="text-xxxs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  #{m.memberSequence[member.id ?? ""] ?? "-"}
                </span>
                {member.name}
              </DialogTitle>
              <p className="text-xxxs font-mono text-muted-foreground">{member.nik}</p>
            </DialogHeader>

            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              <Section title={t("members.detail.section.personal")}>
                <Row label={t("members.detail.joinDate")}>{member.registered_at || "-"}</Row>
                <Row label={t("members.form.labels.gender")}>
                  {member.gender === "P" ? t("common.female") : t("common.male")}
                </Row>
                <Row label={t("members.form.labels.placeOfBirth")}>{member.place_of_birth || "-"}</Row>
                <Row label={t("members.form.labels.dateOfBirth")}>{member.date_of_birth || "-"}</Row>
                <Row label={t("members.form.labels.occupation")}>{member.occupation || "-"}</Row>
                <Row label={t("members.form.labels.education")}>{member.education || "-"}</Row>
                <Row label={t("members.form.labels.rtRw")}>
                  {[member.rt, member.rw].filter(Boolean).join(" / ") || "-"}
                </Row>
                <Row label={t("members.form.labels.hamlet")}>{member.hamlet || "-"}</Row>
                <Row label={t("members.form.labels.region")}>
                  <span className="flex items-center gap-1 justify-end">
                    {regionLabel ? <MapPinIcon className="h-3 w-3 text-muted-foreground shrink-0" /> : null}
                    {regionLabel || member.kode_wilayah || "-"}
                  </span>
                </Row>
              </Section>

              <Section title={t("members.detail.section.membership")}>
                <Row label={t("members.form.labels.membershipClass")}>
                  {member.status_keanggotaan
                    ? t(`members.membership.${member.status_keanggotaan}`, { defaultValue: member.status_keanggotaan })
                    : "-"}
                </Row>
                <Row label={t("members.form.labels.memberStatus")}>
                  {member.status === "aktif" ? t("members.filterActive") : t("members.filterInactive")}
                </Row>
              </Section>

              <Section title={t("members.detail.section.savings")}>
                <Row label={t("members.form.simpanan.jenisPokok")}>{fmt(member.savings_pokok || 0)}</Row>
                <Row label={t("members.form.simpanan.jenisWajib")}>{fmt(member.savings_wajib || 0)}</Row>
                <Row label={t("members.form.simpanan.jenisSukarela")}>{fmt(member.savings_sukarela || 0)}</Row>
                <Row label={t("members.detail.totalSavings")}>
                  <span className="font-bold text-success">{fmt(totalSimpanan(member))}</span>
                </Row>
              </Section>

              <Section title={t("members.detail.section.loan")}>
                <Row label={t("members.form.labels.totalLoan")}>{fmt(member.loan_total || 0)}</Row>
                <Row label={t("members.form.labels.outstandingLoan")}>
                  <span className="font-bold text-danger">{fmt(member.loan_outstanding || 0)}</span>
                </Row>
                <Row label={t("members.form.labels.loanStatus")}>
                  {member.loan_status
                    ? t(`members.form.labels.loanStatusOptions.${member.loan_status}`, {
                        defaultValue: member.loan_status,
                      })
                    : "-"}
                </Row>
              </Section>

              <Section title={t("members.detail.section.savingsHistory")}>
                {simpananRows.length === 0 ? (
                  <p className="text-xxxs text-muted-foreground font-mono">{t("members.tableHeaders.noData")}</p>
                ) : (
                  <div className="space-y-1">
                    {simpananRows.map((row, i) => (
                      <div key={i} className="flex items-center justify-between text-xxs font-mono">
                        <span className="text-muted-foreground">
                          {t(`members.form.simpanan.${row.jenis_simpanan}`, { defaultValue: row.jenis_simpanan })}
                          {row.periode_pembayaran ? ` · ${row.periode_pembayaran}` : ""}
                        </span>
                        <span className="text-foreground">{fmt(row.jumlah_simpanan || 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose} className="text-xs border-border">
                {t("common.close")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  m.openEditMemberModal(member);
                  onClose();
                }}
                className="text-xs border-border"
              >
                <PencilSimpleIcon className="h-3 w-3 mr-1" /> {t("members.detail.edit")}
              </Button>
              <Button
                onClick={() => onRequestDelete(member)}
                className="bg-danger hover:bg-danger/90 text-white font-bold text-xs"
              >
                <TrashIcon className="h-3 w-3 mr-1" /> {t("members.detail.delete")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
