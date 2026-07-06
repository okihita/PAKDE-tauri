import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { sfx } from "@/features/System/ProfileSelect/sfx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStoreLayout } from "@/hooks/useStoreLayout";
import LayoutCanvas from "./LayoutCanvas";
import ShelfPanel from "./ShelfPanel";
import type { LayoutZone } from "@/types";
import { MapPin, Plus, Trash2, ArrowLeft, Sparkles } from "lucide-react";

export interface CategoryRow {
  id: string;
  name: string;
  icon: string;
}

export default function StoreLayout() {
  const { t } = useTranslation();
  const {
    layouts,
    activeLayout,
    categories,
    inventoryItems,
    loadLayouts,
    loadCategories,
    loadInventory,
    loadZones,
    createLayout,
    deleteLayout,
    selectLayout,
    saveZones,
    updateZone,
    assignItemToShelf,
    setActiveLayout,
  } = useStoreLayout();

  const [mode, setMode] = useState<"list" | "editor">("list");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState("");
  const [roomWidth, setRoomWidth] = useState(8);
  const [roomDepth, setRoomDepth] = useState(6);
  const [cellSize, setCellSize] = useState(1);
  const [editingZones, setEditingZones] = useState<LayoutZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<LayoutZone | null>(null);

  // Derive items in the selected zone directly from the latest inventory snapshot
  // so the ShelfPanel always reflects assignments.
  const zoneItems = useMemo(
    () => (selectedZone ? inventoryItems.filter((i) => i.zone_id === selectedZone.id) : []),
    [selectedZone, inventoryItems],
  );

  useEffect(() => {
    loadLayouts();
    loadCategories();
    loadInventory();
  }, [loadLayouts, loadCategories, loadInventory]);

  // sync zones when active layout changes
  useEffect(() => {
    if (!activeLayout) return;
    loadZones(activeLayout.id).then((z) => setEditingZones(z));
  }, [activeLayout, loadZones]);

  const handleCreateLayout = async () => {
    if (!newLayoutName.trim() || roomWidth <= 0 || roomDepth <= 0) return;
    const gridW = Math.ceil(roomWidth / cellSize);
    const gridH = Math.ceil(roomDepth / cellSize);
    await createLayout(newLayoutName.trim(), gridW, gridH, cellSize);
    setNewLayoutName("");
    setShowNewDialog(false);
  };

  const handleEditLayout = (layout: (typeof layouts)[number]) => {
    selectLayout(layout);
    setMode("editor");
  };

  const handleBackToList = () => {
    setActiveLayout(null);
    setEditingZones([]);
    setSelectedZone(null);
    setMode("list");
  };

  const handleSaveZones = async () => {
    if (!activeLayout) return null;
    const fresh = await saveZones(activeLayout.id, editingZones);
    if (fresh) {
      setEditingZones(fresh);
      sfx.playChime();
    }
    return fresh;
  };

  const handleZoneClick = (zone: LayoutZone) => {
    setSelectedZone(zone);
  };

  const handleZoneDelete = () => {
    if (!selectedZone) return;
    setEditingZones((prev) => prev.filter((z) => z.id !== selectedZone.id));
    setSelectedZone(null);
  };

  const handleItemAssign = async (itemId: string, zoneId: string, row: number, col: number) => {
    // Persist any unsaved zones first so the target zone_id exists in layout_zones
    // before linking inventory rows to it (FK constraint safety).
    await handleSaveZones();
    await assignItemToShelf(itemId, zoneId, row, col);
  };

  const handleItemUnassign = async (itemId: string) => {
    await assignItemToShelf(itemId, null, null, null);
  };

  // ── LIST MODE ──
  if (mode === "list") {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          <div className="flex items-center">
            <h3 className="text-xxs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              {t("storeLayout.title")}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* New layout card — always first */}
            <Card
              className="bg-slate-950/30 border-dashed border-2 border-slate-800 hover:border-emerald-500/30 cursor-pointer transition-all group"
              onClick={() => setShowNewDialog(true)}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[140px]">
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all">
                  <Plus className="h-5 w-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <span className="text-xs font-bold text-slate-500 group-hover:text-emerald-400 transition-colors">
                  {t("storeLayout.newLayout")}
                </span>
              </CardContent>
            </Card>

            {layouts.map((layout) => (
              <Card
                key={layout.id}
                className="bg-slate-950/60 border-slate-900/80 hover:border-emerald-500/20 cursor-pointer transition-all"
                onClick={() => handleEditLayout(layout)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{layout.name}</h4>
                      <p className="text-xxxs font-mono text-slate-400 mt-0.5">
                        {`${((layout.grid_width ?? 1) * (layout.cell_size ?? 1)).toFixed(1)}m × ${((layout.grid_height ?? 1) * (layout.cell_size ?? 1)).toFixed(1)}m`}
                      </p>
                      <p className="text-xxxs font-mono text-slate-500">
                        {layout.grid_width}×{layout.grid_height} {t("storeLayout.grid")} · 1{" "}
                        {t("storeLayout.cellLabel")} = {layout.cell_size ?? 1}m
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLayout(layout.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-xxxs font-mono text-slate-500">
                    {t("storeLayout.created")}: {layout.created_at?.slice(0, 10) || "-"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* New Layout Dialog */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="bg-card border-border text-foreground max-w-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateLayout();
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-sm font-bold text-foreground">{t("storeLayout.dialogNew")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3.5 py-4 text-xs">
                <div className="space-y-1">
                  <label className="text-muted-foreground font-mono text-xxxs uppercase">
                    {t("storeLayout.layoutName")}
                  </label>
                  <Input
                    value={newLayoutName}
                    onChange={(e) => setNewLayoutName(e.target.value)}
                    placeholder={t("storeLayout.layoutNamePlaceholder")}
                    className="bg-input border-border text-xs h-8.5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-muted-foreground font-mono text-xxxs uppercase">
                      {`${t("storeLayout.roomWidth")} (m)`}
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      step={0.5}
                      value={roomWidth || ""}
                      onChange={(e) => setRoomWidth(Number(e.target.value))}
                      className="bg-input border-border text-xs h-8.5"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-muted-foreground font-mono text-xxxs uppercase">
                      {`${t("storeLayout.roomDepth")} (m)`}
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      step={0.5}
                      value={roomDepth || ""}
                      onChange={(e) => setRoomDepth(Number(e.target.value))}
                      className="bg-input border-border text-xs h-8.5"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground font-mono text-xxxs uppercase flex items-center justify-between">
                    <span>{t("storeLayout.cellSize")}</span>
                    <span className="font-bold text-emerald-400">
                      1{t("storeLayout.cellLabel")} ={" "}
                      {cellSize === 1 ? "1 m" : cellSize === 0.5 ? "0.5 m" : `${cellSize} m`}
                    </span>
                  </label>
                  <div className="flex gap-2">
                    {[0.5, 1, 2].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCellSize(s)}
                        className={`flex-1 text-xxs font-bold py-1.5 rounded-lg border transition-all ${
                          cellSize === s
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-slate-900/40 text-muted-foreground border-border hover:border-slate-700"
                        }`}
                      >
                        {s}m
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xxxs font-mono text-slate-500">
                  {t("storeLayout.gridPreview")}: {Math.ceil(roomWidth / cellSize)}×{Math.ceil(roomDepth / cellSize)}{" "}
                  {t("storeLayout.grid")}
                </p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewDialog(false)}
                  className="border-border text-muted-foreground text-xs h-8"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-8"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {t("storeLayout.create")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── EDITOR MODE ──
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Editor Toolbar */}
      <div className="shrink-0 px-4 py-2 border-b border-border bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            {t("common.back")}
          </Button>
          <span className="text-xs font-bold text-foreground">{activeLayout?.name}</span>
          <span className="text-xxxs font-mono text-slate-500">
            {`${((activeLayout?.grid_width ?? 0) * (activeLayout?.cell_size ?? 1)).toFixed(1)}m × ${((activeLayout?.grid_height ?? 0) * (activeLayout?.cell_size ?? 1)).toFixed(1)}m`}
          </span>
        </div>
        <Button
          onClick={handleSaveZones}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-7 px-3"
        >
          {t("common.save")}
        </Button>
      </div>

      {/* Canvas + Panel */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <LayoutCanvas
            zones={editingZones}
            zonesSetter={setEditingZones}
            gridWidth={activeLayout?.grid_width ?? 20}
            gridHeight={activeLayout?.grid_height ?? 15}
            cellSize={activeLayout?.cell_size ?? 1}
            selectedZone={selectedZone}
            onZoneSelect={handleZoneClick}
            onZoneUpdate={(z) => {
              // Update local state first so the dragged zone doesn't snap back
              // on the next render; then persist to DB.
              setEditingZones((prev) => prev.map((pz) => (pz.id === z.id ? z : pz)));
              updateZone(z);
            }}
            inventoryItems={inventoryItems}
          />
        </div>

        {selectedZone && (
          <ShelfPanel
            zone={selectedZone}
            zoneItems={zoneItems}
            inventoryItems={inventoryItems}
            categories={categories}
            cellSize={activeLayout?.cell_size ?? 1}
            onZoneChange={(z) => {
              setSelectedZone(z);
              setEditingZones((prev) => prev.map((pz) => (pz.id === z.id ? z : pz)));
            }}
            onItemAssign={handleItemAssign}
            onItemUnassign={handleItemUnassign}
            onClose={() => setSelectedZone(null)}
            onDelete={handleZoneDelete}
          />
        )}
      </div>
    </div>
  );
}
