import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WrenchIcon, PlusIcon, TrashIcon, PencilIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useEquipment } from "@/hooks/useEquipment";
import { sfx } from "@/features/System/ProfileSelect/sfx";
import type { EquipmentCondition, EquipmentItem } from "@/types";

const CONDITIONS: EquipmentCondition[] = ["Baik", "Rusak Ringan", "Perlu Perbaikan"];

const conditionClass = (condition: string) =>
  condition === "Baik"
    ? "bg-success/10 text-success"
    : condition === "Rusak Ringan"
      ? "bg-warning/10 text-warning"
      : "bg-danger/10 text-danger";

export default function Equipment() {
  const { t } = useTranslation();
  const { equipmentList, loadEquipment, createEquipment, updateEquipment, recordMaintenance, deleteEquipment } =
    useEquipment();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<EquipmentItem | null>(null);
  const [form, setForm] = useState({
    name: "",
    quantity: 1,
    condition: "Baik" as EquipmentCondition,
    lastMaintenance: "",
    value: 0,
  });

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const filtered = equipmentList.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", quantity: 1, condition: "Baik", lastMaintenance: "", value: 0 });
    setShowDialog(true);
  };

  const openEdit = (item: EquipmentItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      quantity: item.quantity,
      condition: item.condition,
      lastMaintenance: item.last_maintenance,
      value: item.value,
    });
    setShowDialog(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const ok = editing
      ? await updateEquipment(editing.id, form.name, form.quantity, form.condition, form.lastMaintenance, form.value)
      : await createEquipment(form.name, form.quantity, form.condition, form.lastMaintenance, form.value);
    if (ok) {
      sfx.playChime();
      setShowDialog(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex-1 overflow-auto p-6">
      <Card className="bg-card border-border hover-glow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <WrenchIcon className="h-3.5 w-3.5 text-warning" /> {t("sidebar.nav.equipment")}
          </CardTitle>
          <Button
            onClick={openAdd}
            className="bg-brand hover:bg-brand text-brand-foreground font-bold text-xs h-8 px-3 flex items-center gap-1.5"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            {t("equipment.addItem")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-xs">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t("equipment.search")}
              value={search}
              onChange={(ev) => setSearch(ev.target.value)}
              className="pl-8 bg-input border-border text-xs h-9 placeholder:text-muted-foreground/60"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xxs font-mono text-muted-foreground">{t("equipment.table.name")}</TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("equipment.table.amount")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("equipment.table.condition")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("equipment.table.lastMaintenance")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">{t("equipment.table.value")}</TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground text-right w-44 pr-4">
                  {t("equipment.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="border-border hover:bg-secondary">
                  <TableCell className="text-xs font-medium text-foreground">{item.name}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{item.quantity}</TableCell>
                  <TableCell className="text-xs">
                    <span className={`text-xxxs font-bold px-1.5 py-0.5 rounded ${conditionClass(item.condition)}`}>
                      {t(
                        `equipment.condition.${item.condition === "Baik" ? "baik" : item.condition === "Rusak Ringan" ? "rusakRingan" : "perluPerbaikan"}`,
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {item.last_maintenance || "-"}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-foreground">
                    {item.value.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex gap-1.5 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => recordMaintenance(item.id)}
                        className="border-border text-muted-foreground hover:text-foreground text-xxs h-7 px-2"
                        title={t("equipment.recordMaintenance")}
                      >
                        <WrenchIcon className="h-3 w-3 mr-1" />
                        {t("equipment.recordMaintenance")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(item)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteEquipment(item.id)}
                        className="h-7 w-7 text-danger hover:text-foreground hover:bg-danger/10"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow className="border-border">
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs font-mono">
                    {t("equipment.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-foreground">
                {editing ? t("equipment.dialogEdit") : t("equipment.dialogAdd")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3.5 py-4 text-xs">
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("equipment.form.name")}
                </label>
                <Input
                  value={form.name}
                  onChange={(ev) => setForm({ ...form, name: ev.target.value })}
                  placeholder={t("equipment.form.namePlaceholder")}
                  className="bg-input border-border text-xs h-8.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-muted-foreground font-mono text-xxxs uppercase">
                    {t("equipment.form.quantity")}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={form.quantity || ""}
                    onChange={(ev) => setForm({ ...form, quantity: Number(ev.target.value) })}
                    className="bg-input border-border text-xs h-8.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground font-mono text-xxxs uppercase">
                    {t("equipment.form.value")}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={form.value || ""}
                    onChange={(ev) => setForm({ ...form, value: Number(ev.target.value) })}
                    className="bg-input border-border text-xs h-8.5"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("equipment.form.condition")}
                </label>
                <Select
                  value={form.condition}
                  onValueChange={(val) => setForm({ ...form, condition: val as EquipmentCondition })}
                >
                  <SelectTrigger className="bg-input border-border text-xs h-8.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground text-xs">
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t(
                          `equipment.condition.${c === "Baik" ? "baik" : c === "Rusak Ringan" ? "rusakRingan" : "perluPerbaikan"}`,
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("equipment.form.lastMaintenance")}
                </label>
                <Input
                  type="date"
                  value={form.lastMaintenance || today}
                  onChange={(ev) => setForm({ ...form, lastMaintenance: ev.target.value })}
                  className="bg-input border-border text-xs h-8.5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="border-border text-muted-foreground text-xs h-8"
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" className="bg-brand hover:bg-brand text-brand-foreground font-bold text-xs h-8">
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
