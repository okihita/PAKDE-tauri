import "./Members.css";
import { useTranslation } from "react-i18next";
import { MagnifyingGlassIcon, PlusIcon, TrashIcon, PencilSimpleIcon, Plant } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMembers, type MemberInsights } from "@/hooks/useMembers";
import { useToast } from "@/hooks/useToast";
import { seedMockMembers } from "@/data/seed-members";
import { resolveWilayah, formatWilayahShort } from "@/db/wilayahLookup";
import { useEffect, useMemo, useState } from "react";
import type { Member } from "@/types";
import MemberFormDialog from "./MemberFormDialog";

function InsightTile({ label, value, sub, danger }: { label: string; value: string; sub?: string; danger?: boolean }) {
  return (
    <div className="rounded-xl bg-card border border-border p-3 space-y-1">
      <p className="text-xxxs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${danger ? "text-danger" : "text-foreground"}`}>{value}</p>
      {sub && <p className="text-xxxs text-muted-foreground font-mono">{sub}</p>}
    </div>
  );
}

export default function Members({ onMembersChanged }: { onMembersChanged?: () => void }) {
  const { t } = useTranslation();
  const m = useMembers(onMembersChanged);
  const toast = useToast();
  const [seeding, setSeeding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Member | null>(null);
  const [regionLabels, setRegionLabels] = useState<Record<string, string>>({});

  // Stable key of unique visible village codes (filteredMembers is a fresh array
  // each render, so serialize to a primitive to avoid re-running the effect every
  // render).
  const visibleCodesKey = useMemo(() => {
    const set = new Set<string>();
    for (const mbr of m.filteredMembers) if (mbr.kode_wilayah) set.add(mbr.kode_wilayah);
    return [...set].sort().join("|");
  }, [m.filteredMembers]);

  // Batch-resolve region labels for the visible codes (resolveWilayah is cached).
  useEffect(() => {
    const codes = visibleCodesKey ? visibleCodesKey.split("|") : [];
    const missing = codes.filter((c) => !(c in regionLabels));
    if (missing.length === 0) return;
    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        missing.map(async (code) => [code, formatWilayahShort(await resolveWilayah(code))] as const),
      );
      if (cancelled) return;
      setRegionLabels((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    })();
    return () => {
      cancelled = true;
    };
  }, [visibleCodesKey, regionLabels]);

  const statusOptions = [
    { value: "semua", label: t("members.filterAll") },
    { value: "aktif", label: t("members.filterActive") },
    { value: "nonaktif", label: t("members.filterInactive") },
  ];

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedMockMembers();
      await m.loadMembersData();
      onMembersChanged?.();
    } catch (err) {
      toast.error(t("toast.seedFailed", { error: err instanceof Error ? err.message : String(err) }));
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    m.loadMembersData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString()}`;
  const i: MemberInsights = m.insights;

  const totalSimpananMember = (mbr: Member) =>
    (mbr.savings_pokok || 0) + (mbr.savings_wajib || 0) + (mbr.savings_sukarela || 0);

  return (
    <div className="space-y-4">
      {/* ── Insight tiles (manager cockpit) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <InsightTile
          label={t("members.insights.totalMembers")}
          value={String(i.totalMembers)}
          sub={`${i.activeMembers} aktif · ${i.inactiveMembers} nonaktif`}
        />
        <InsightTile label={t("members.insights.totalSimpanan")} value={fmt(i.totalSimpanan)} />
        <InsightTile label={t("members.insights.piutang")} value={fmt(i.totalPiutang)} />
        <InsightTile
          label={t("members.insights.simpananPending")}
          value={String(i.simpananPending)}
          danger={i.simpananPending > 0}
        />
        <InsightTile label={t("members.insights.newThisMonth")} value={String(i.newThisMonth)} />
        <InsightTile label={t("members.title")} value={fmt(i.totalSimpanan + i.totalPiutang)} sub="Aset kelolaan" />
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t("members.title")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSeed}
              disabled={seeding}
              className="bg-warning/20 hover:bg-warning/30 text-warning font-bold text-xs h-8 border border-warning/20"
            >
              <Plant className="h-3 w-3 mr-1" /> {seeding ? "..." : t("members.seedButton")}
            </Button>
            <Button
              onClick={m.openAddMemberModal}
              className="bg-brand hover:bg-brand text-brand-foreground font-bold text-xs h-8"
            >
              <PlusIcon className="h-3 w-3 mr-1" /> {t("members.addButton")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
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
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("members.tableHeaders.membership")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("members.tableHeaders.region")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground text-right">
                  {t("members.tableHeaders.simpanan")}
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
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-xs font-mono">
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
                      className={`text-xxxs font-mono font-bold px-2 py-0.5 rounded ${mbr.status === "aktif" ? "text-success bg-success/10" : "text-muted-foreground bg-muted"}`}
                    >
                      {mbr.status.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-xxs font-mono text-foreground">
                    {mbr.status_keanggotaan
                      ? t(`members.membership.${mbr.status_keanggotaan}`, { defaultValue: mbr.status_keanggotaan })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-xxs font-mono text-muted-foreground" title={mbr.kode_wilayah || undefined}>
                    {mbr.kode_wilayah ? (regionLabels[mbr.kode_wilayah] ?? "…") : "-"}
                  </TableCell>
                  <TableCell className="text-xxs font-mono text-success text-right">
                    {fmt(totalSimpananMember(mbr))}
                  </TableCell>
                  <TableCell className="text-xxs font-mono text-danger text-right">
                    {fmt(mbr.loan_outstanding)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t("common.edit")}
                        aria-label={t("common.edit")}
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => m.openEditMemberModal(mbr)}
                      >
                        <PencilSimpleIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t("common.delete")}
                        aria-label={t("common.delete")}
                        className="h-6 w-6 text-danger hover:text-danger hover:bg-danger/10"
                        onClick={() => setPendingDelete(mbr)}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <DialogContent className="bg-card border border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <TrashIcon className="h-4 w-4 text-danger" />
              {t("members.deleteTitle")}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-xs text-muted-foreground font-mono">
            {t("members.deleteConfirm", { name: pendingDelete?.name ?? "" })}
          </DialogDescription>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPendingDelete(null)} className="text-xs border-border">
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (pendingDelete) m.deleteMember(pendingDelete);
                setPendingDelete(null);
              }}
              className="bg-danger hover:bg-danger/90 text-white font-bold text-xs"
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MemberFormDialog m={m} />
    </div>
  );
}
