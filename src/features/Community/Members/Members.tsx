import "./Members.css";
import { useTranslation } from "react-i18next";
import { MagnifyingGlassIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
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

function InsightTile({ label, value, sub, danger }: { label: string; value: string; sub?: string; danger?: boolean }) {
  return (
    <div className="rounded-xl bg-card border border-border p-3 space-y-1">
      <p className="text-xxxs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${danger ? "text-danger" : "text-foreground"}`}>{value}</p>
      {sub && <p className="text-xxxs text-muted-foreground font-mono">{sub}</p>}
    </div>
  );
}

type SortKey = "id" | "name" | "simpanan" | "outstanding";

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

export default function Members({ onMembersChanged }: { onMembersChanged?: () => void }) {
  const { t } = useTranslation();
  const m = useMembers(onMembersChanged);
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

  const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString()}`;
  const i: MemberInsights = m.insights;

  const totalSimpananMember = (mbr: Member) =>
    (mbr.savings_pokok || 0) + (mbr.savings_wajib || 0) + (mbr.savings_sukarela || 0);

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
      }
      return cmp * dir;
    });
  }, [m.filteredMembers, m.memberSequence, sortKey, sortDir]);

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayMembers.length === 0 && (
                <TableRow className="border-border">
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-xs">
                    {t("members.tableHeaders.noData")}
                  </TableCell>
                </TableRow>
              )}
              {displayMembers.map((mbr) => (
                <TableRow
                  key={mbr.id}
                  className="border-border hover:bg-sidebar-ring cursor-pointer"
                  onClick={() => setSelectedMember(mbr)}
                >
                  <TableCell className="text-xxs text-muted-foreground">
                    {m.memberSequence[mbr.id ?? ""] ?? "-"}
                  </TableCell>
                  <TableCell className="text-xs text-foreground font-semibold">{mbr.name}</TableCell>
                  <TableCell className="text-xxs text-success text-right">{fmt(totalSimpananMember(mbr))}</TableCell>
                  <TableCell className="text-xxs text-danger text-right">{fmt(mbr.loan_outstanding)}</TableCell>
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

      <MemberDetailDialog
        m={m}
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onRequestDelete={(mb) => {
          setSelectedMember(null);
          setPendingDelete(mb);
        }}
      />
    </div>
  );
}
