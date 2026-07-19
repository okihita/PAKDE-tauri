import "./Members.css";
import { useTranslation } from "react-i18next";
import { MagnifyingGlassIcon, PlusIcon, TrashIcon, CheckCircleIcon, WarningIcon } from "@phosphor-icons/react";
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
import { useEffect, useMemo, useState } from "react";
import type { Member } from "@/types";
import MemberFormDialog from "./MemberFormDialog";
import MemberDetailDialog from "./MemberDetailDialog";
import LevelUpDialog from "./LevelUpDialog";
import { getCoopDb } from "@/db";
import { onRequestOpenMember, onRequestAddMember } from "@/lib/commandPaletteEvents";

function InsightTile({ label, value, sub, danger }: { label: string; value: string; sub?: string; danger?: boolean }) {
  return (
    <div className="rounded-xl bg-card border border-border p-3 space-y-1">
      <p className="text-xxxs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${danger ? "text-danger" : "text-foreground"}`}>{value}</p>
      {sub && <p className="text-xxxs text-muted-foreground font-mono">{sub}</p>}
    </div>
  );
}

type SortKey = "id" | "name" | "simpanan" | "outstanding" | "shu";

function SortableHeader({
  label,
  active,
  dir,
  align,
  className,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  align?: "right";
  className?: string;
  onClick: () => void;
}) {
  return (
    <TableHead className={`text-xxs text-muted-foreground ${align === "right" ? "text-right" : ""} ${className ?? ""}`}>
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1 hover:text-foreground">
        <span>{label}</span>
        {active && <span className="text-xxxs">{dir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </TableHead>
  );
}

function PaginationBar({
  page,
  totalPages,
  totalItems,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-xxs text-muted-foreground">
        {totalItems} {t("members.title").toLowerCase()}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={page <= 1}
          className="text-xxs h-7 border-border"
        >
          {t("members.tableHeaders.pagination.prev")}
        </Button>
        <span className="text-xxs text-muted-foreground min-w-[80px] text-center">
          {t("members.tableHeaders.pagination.pageInfo", { page, total: totalPages })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={page >= totalPages}
          className="text-xxs h-7 border-border"
        >
          {t("members.tableHeaders.pagination.next")}
        </Button>
      </div>
    </div>
  );
}

export default function Members({ onMembersChanged, xp = 0 }: { onMembersChanged?: () => void; xp?: number }) {
  const { t } = useTranslation();
  const m = useMembers(onMembersChanged, xp);
  const [pendingDelete, setPendingDelete] = useState<Member | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const statusOptions = [
    { value: "semua", label: t("members.filterAll") },
    { value: "aktif", label: t("members.filterActive") },
    { value: "nonaktif", label: t("members.filterInactive") },
  ];

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  useEffect(() => {
    m.loadMembersData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Command Palette hooks: open a member's detail dialog or the add form
  // directly from the global search without leaving the Members tab.
  useEffect(() => {
    const offOpen = onRequestOpenMember((member) => setSelectedMember(member));
    const offAdd = onRequestAddMember(() => m.openAddMemberModal());
    return () => {
      offOpen();
      offAdd();
    };
  }, [m]);

  const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString()}`;
  const i: MemberInsights = m.insights;

  // Board readiness: count of members holding an active position (the pengurus
  // table). Mirrors the Leveling governance quest "Struktur pengurus minimal 3 orang".
  const activeBoard = Object.keys(m.jabatanMap).length;
  const readinessMet = activeBoard >= 3;

  // Invert jabatanMap → per-position member lookup for the pengurus panel.
  const pengurusRoster = useMemo(() => {
    const blocked: Record<string, { name: string; id: string } | null> = {
      ketua: null,
      sekretaris: null,
      bendahara: null,
      pengawas: null,
    };
    for (const [memberId, jabatan] of Object.entries(m.jabatanMap)) {
      const mbr = m.membersList.find((x) => x.id === memberId);
      if (mbr) blocked[jabatan] = { name: mbr.name, id: memberId };
    }
    return blocked;
  }, [m.jabatanMap, m.membersList]);

  const totalSimpananMember = (mbr: Member) =>
    (mbr.savings_pokok || 0) + (mbr.savings_wajib || 0) + (mbr.savings_sukarela || 0);

  // ── SHU (Sisa Hasil Usaha) ──
  // Jasa modal: 25% of net coop surplus, distributed proportionally to each
  // member's pokok + wajib savings. (Per RUU Koperasi; jasa usaha layer TBD.)
  const [shuPool, setShuPool] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const db = await getCoopDb();
        const rows = await db.select<Array<{ r: number; e: number }>>(
          `SELECT
            COALESCE(SUM(CASE WHEN type = 'pendapatan' AND is_active = 1 THEN balance ELSE 0 END), 0) as r,
            COALESCE(SUM(CASE WHEN type = 'beban' AND is_active = 1 THEN balance ELSE 0 END), 0) as e
          FROM coa_accounts`,
        );
        const gross = Math.max(0, rows[0].r - rows[0].e);
        setShuPool(Math.round(gross * 0.25)); // 25% jasa modal portion
      } catch {
        /* non-critical */
      }
    })();
  }, [m.membersList]);

  const totalPokokWajib = useMemo(
    () => m.membersList.reduce((s, mbr) => s + (mbr.savings_pokok || 0) + (mbr.savings_wajib || 0), 0),
    [m.membersList],
  );

  const shuJatah = useMemo(() => {
    if (totalPokokWajib === 0 || shuPool === 0) return {} as Record<string, number>;
    const map: Record<string, number> = {};
    for (const mbr of m.membersList) {
      const pokokWajib = (mbr.savings_pokok || 0) + (mbr.savings_wajib || 0);
      map[mbr.id ?? ""] = Math.round((pokokWajib / totalPokokWajib) * shuPool);
    }
    return map;
  }, [m.membersList, shuPool, totalPokokWajib]);

  const displayMembers = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...m.filteredMembers].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "id":
          cmp =
            (m.memberSequence[a.id ?? ""] ?? Number.MAX_SAFE_INTEGER) -
            (m.memberSequence[b.id ?? ""] ?? Number.MAX_SAFE_INTEGER);
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "simpanan":
          cmp = totalSimpananMember(a) - totalSimpananMember(b);
          break;
        case "outstanding":
          cmp = a.loan_outstanding - b.loan_outstanding;
          break;
        case "shu":
          cmp = (shuJatah[a.id ?? ""] ?? 0) - (shuJatah[b.id ?? ""] ?? 0);
          break;
      }
      return cmp * dir;
    });
  }, [m.filteredMembers, m.memberSequence, sortKey, sortDir, shuJatah]);

  const pagedMembers = useMemo(
    () => displayMembers.slice((m.page - 1) * m.pageSize, m.page * m.pageSize),
    [displayMembers, m.page, m.pageSize],
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* ── Left column: summary KPIs (sticky on desktop) ── */}
      <aside className="lg:w-80 shrink-0 lg:sticky lg:top-6 space-y-3">
        {/* ── Pengurus roster ── */}
        <div className="rounded-xl bg-card border border-border p-3 space-y-2">
          <p className="text-xxs font-bold uppercase tracking-wider text-muted-foreground">{t("pengurus.title")}</p>
          <div className="space-y-1">
            {(["ketua", "sekretaris", "bendahara", "pengawas"] as const).map((j) => (
              <div key={j} className="flex items-center justify-between text-xxs">
                <span className="text-muted-foreground w-20 shrink-0">{t(`pengurus.jabatan.${j}`)}</span>
                <span
                  className={
                    pengurusRoster[j] ? "text-foreground font-medium truncate ml-1" : "text-muted-foreground/50 italic"
                  }
                >
                  {pengurusRoster[j]?.name ?? t("pengurus.emptySlot")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t("members.summaryTitle")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-1 gap-3">
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
      </aside>

      {/* ── Right column: member database table ── */}
      <div className="flex-1 min-w-0">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t("members.title")}
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Readiness chip — reflects the board structure at a glance. */}
              <div
                className={`flex items-center gap-1.5 rounded-lg px-2 h-8 border text-xxs font-semibold ${
                  readinessMet
                    ? "bg-success/10 border-success/30 text-success"
                    : "bg-warning/10 border-warning/30 text-warning"
                }`}
                title={t("pengurus.readinessHint")}
              >
                {readinessMet ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <WarningIcon className="h-3.5 w-3.5" />}
                <span>{t("pengurus.readiness", { n: activeBoard })}</span>
              </div>
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

            <div className="mb-3">
              <PaginationBar
                page={m.page}
                totalPages={m.totalPages}
                totalItems={m.filteredMembers.length}
                onPrev={() => m.setPage(m.page - 1)}
                onNext={() => m.setPage(m.page + 1)}
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <SortableHeader
                    label={t("members.tableHeaders.id")}
                    active={sortKey === "id"}
                    dir={sortDir}
                    className="w-10"
                    onClick={() => toggleSort("id")}
                  />
                  <SortableHeader
                    label={t("members.tableHeaders.name")}
                    active={sortKey === "name"}
                    dir={sortDir}
                    onClick={() => toggleSort("name")}
                  />
                  <SortableHeader
                    label={t("members.tableHeaders.simpanan")}
                    active={sortKey === "simpanan"}
                    dir={sortDir}
                    align="right"
                    onClick={() => toggleSort("simpanan")}
                  />
                  <SortableHeader
                    label={t("members.tableHeaders.outstanding")}
                    active={sortKey === "outstanding"}
                    dir={sortDir}
                    align="right"
                    onClick={() => toggleSort("outstanding")}
                  />
                  <SortableHeader
                    label={t("members.tableHeaders.shu")}
                    active={sortKey === "shu"}
                    dir={sortDir}
                    align="right"
                    onClick={() => toggleSort("shu")}
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayMembers.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs">
                      {t("members.tableHeaders.noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedMembers.map((mbr) => (
                    <TableRow
                      key={mbr.id}
                      className="border-border hover:bg-sidebar-ring cursor-pointer"
                      onClick={() => setSelectedMember(mbr)}
                    >
                      <TableCell className="text-xxs text-muted-foreground">
                        {m.memberSequence[mbr.id ?? ""] ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        <span className="text-foreground">{mbr.name}</span>
                        {m.jabatanMap[mbr.id ?? ""] && (
                          <span className="ml-1.5 inline-flex rounded border border-brand/30 bg-brand/10 px-1 py-0.5 text-xxxs font-semibold text-brand">
                            {t(`pengurus.jabatan.${m.jabatanMap[mbr.id ?? ""]}`)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xxs text-success text-right">
                        {fmt(totalSimpananMember(mbr))}
                      </TableCell>
                      <TableCell className="text-xxs text-danger text-right">{fmt(mbr.loan_outstanding)}</TableCell>
                      <TableCell className="text-xxs text-success text-right">
                        {fmt(shuJatah[mbr.id ?? ""] ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="pt-3">
              <PaginationBar
                page={m.page}
                totalPages={m.totalPages}
                totalItems={m.filteredMembers.length}
                onPrev={() => m.setPage(m.page - 1)}
                onNext={() => m.setPage(m.page + 1)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

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

      <MemberDetailDialog
        m={m}
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onRequestDelete={(mb) => {
          setSelectedMember(null);
          setPendingDelete(mb);
        }}
      />

      <LevelUpDialog levelUp={m.levelUp} onClose={m.clearLevelUp} />
    </div>
  );
}
