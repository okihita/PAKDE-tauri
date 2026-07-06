import { useState } from "react";
import { sfx } from "@/features/System/ProfileSelect/sfx";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LayoutZone, InventoryItem } from "@/types";
import type { CategoryRow } from "./StoreLayout";
import { X, Trash2, Minus, Box } from "lucide-react";

interface ShelfPanelProps {
  zone: LayoutZone;
  zoneItems: InventoryItem[];
  inventoryItems: InventoryItem[];
  categories: CategoryRow[];
  cellSize: number;
  onZoneChange: (zone: LayoutZone) => void;
  onItemAssign: (itemId: string, zoneId: string, row: number, col: number) => Promise<void>;
  onItemUnassign: (itemId: string) => Promise<void>;
  onClose: () => void;
  onDelete: () => void;
}

const ZONE_COLORS = [
  "#4CAF50",
  "#2196F3",
  "#FF9800",
  "#9C27B0",
  "#E91E63",
  "#00BCD4",
  "#8BC34A",
  "#FF5722",
];

export default function ShelfPanel({
  zone,
  zoneItems,
  inventoryItems,
  categories,
  cellSize,
  onZoneChange,
  onItemAssign,
  onItemUnassign,
  onClose,
  onDelete,
}: ShelfPanelProps) {
  const { t } = useTranslation();
  const [assigningBin, setAssigningBin] = useState<{ row: number; col: number } | null>(null);
  const [selectedItemId, setSelectedItemId] = useState("");

  const handleAssign = async () => {
    if (!assigningBin || !selectedItemId) return;
    await onItemAssign(selectedItemId, zone.id, assigningBin.row, assigningBin.col);
    sfx.playClick(220, 0.06);
    setAssigningBin(null);
    setSelectedItemId("");
  };

  const getCategoryIcon = (catId: string) => {
    const found = categories.find((c) => c.id === catId);
    return found ? found.icon : "📦";
  };

  // Get items NOT yet assigned to any zone (available for assignment)
  const availableItems = inventoryItems.filter(
    (i) => !i.zone_id || i.zone_id === zone.id,
  );

  const bins = Array.from({ length: zone.rows * zone.cols }, (_, idx) => {
    const row = Math.floor(idx / zone.cols);
    const col = idx % zone.cols;
    const item = zoneItems.find((i) => i.shelf_row === row && i.shelf_col === col);
    return { row, col, item };
  });

  const isArea = zone.zone_type === "zone";
  const isShelf = zone.zone_type === "shelf";

  return (
    <aside className="w-72 shrink-0 border-l border-border bg-slate-950/80 backdrop-blur-sm overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
        <h4 className="text-xs font-bold text-foreground truncate">{zone.name}</h4>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-6 w-6 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
            title={t("common.delete")}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Zone config */}
      <div className="p-3 space-y-2.5 text-xs border-b border-border shrink-0">
        <div className="space-y-1">
          <label className="text-muted-foreground font-mono text-xxxs uppercase">
            {t("common.name")}
          </label>
          <Input
            value={zone.name}
            onChange={(e) => onZoneChange({ ...zone, name: e.target.value })}
            className="bg-input border-border text-xs h-7"
          />
        </div>
        {isShelf && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("storeLayout.rows")}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={zone.rows || ""}
                  onChange={(e) => onZoneChange({ ...zone, rows: Math.max(1, Number(e.target.value)) })}
                  className="bg-input border-border text-xs h-7"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("storeLayout.cols")}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={zone.cols || ""}
                  onChange={(e) => onZoneChange({ ...zone, cols: Math.max(1, Number(e.target.value)) })}
                  className="bg-input border-border text-xs h-7"
                />
              </div>
            </div>
            <div className="text-xxxs font-mono text-slate-500 px-1">
              {(zone.width * (cellSize ?? 1)).toFixed(1)}m × {(zone.height * (cellSize ?? 1)).toFixed(1)}m · {zone.rows * zone.cols} {t("storeLayout.bins").toLowerCase()}
            </div>
          </>
        )}
        {isArea && (
          <div className="text-xxxs font-mono text-slate-500 px-1">
            {(zone.width * (cellSize ?? 1)).toFixed(1)}m × {(zone.height * (cellSize ?? 1)).toFixed(1)}m
          </div>
        )}
        <div className="space-y-1">
          <label className="text-muted-foreground font-mono text-xxxs uppercase">
            {t("storeLayout.color")}
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {ZONE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onZoneChange({ ...zone, color: c })}
                className={`w-6 h-6 rounded-md border-2 transition-all ${
                  zone.color === c ? "border-white scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Shelf bins grid — only for shelf zones */}
      {isShelf && (
        <div className="flex-1 p-3 overflow-y-auto">
        <h5 className="text-xxs font-mono text-muted-foreground uppercase tracking-wider mb-2">
          {t("storeLayout.bins")}
        </h5>
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${zone.cols}, 1fr)`,
          }}
        >
          {bins.map(({ row, col, item }) => {
            const isEmpty = !item;
            const isLow = item && item.stock_quantity <= 10 && item.stock_quantity > 0;
            const isOut = item && item.stock_quantity === 0;

            return (
              <div
                key={`${row}-${col}`}
                onClick={() => setAssigningBin({ row, col })}
                className={`
                  aspect-square rounded-lg border flex flex-col items-center justify-center p-1 cursor-pointer
                  transition-all hover:scale-105
                  ${
                    isEmpty
                      ? "border-slate-800 bg-slate-900/40 hover:border-emerald-500/30"
                      : isOut
                        ? "border-rose-500/30 bg-rose-500/10"
                        : isLow
                          ? "border-amber-500/30 bg-amber-500/10"
                          : "border-emerald-500/30 bg-emerald-500/10"
                  }
                  ${
                    assigningBin?.row === row && assigningBin?.col === col
                      ? "ring-2 ring-emerald-400"
                      : ""
                  }
                `}
                title={`[${row},${col}] ${item?.name || t("storeLayout.emptyBin")}`}
              >
                {item ? (
                  <>
                    <span className="text-sm">{getCategoryIcon(item.category_id)}</span>
                    <span className="text-xxxs font-mono font-bold text-foreground text-center truncate w-full">
                      {item.name.slice(0, 10)}
                    </span>
                    <span
                      className={`text-xxxs font-bold ${
                        isOut ? "text-rose-400" : isLow ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {item.stock_quantity} {item.unit}
                    </span>
                  </>
                ) : (
                  <Box className="h-4 w-4 text-slate-600" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Assign dialog inline — only for shelf zones */}
      {isShelf && assigningBin && (
        <div className="p-3 border-t border-border bg-slate-900/60 shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xxs font-mono text-emerald-400">
              [{assigningBin.row}, {assigningBin.col}]
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAssigningBin(null)}
              className="h-5 w-5 text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Show current item in this bin if any */}
          {bins.find((b) => b.row === assigningBin.row && b.col === assigningBin.col)?.item && (
            <div className="flex items-center justify-between bg-slate-900 rounded-lg p-2">
              <span className="text-xxs text-foreground truncate max-w-[140px]">
                {bins.find((b) => b.row === assigningBin.row && b.col === assigningBin.col)?.item?.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-rose-400"
                onClick={() => {
                  const currentItem = bins.find(
                    (b) => b.row === assigningBin.row && b.col === assigningBin.col,
                  )?.item;
                  if (currentItem) onItemUnassign(currentItem.id);
                  setAssigningBin(null);
                }}
              >
                <Minus className="h-3 w-3" />
              </Button>
            </div>
          )}

          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger className="bg-input border-border text-xs h-7">
              <SelectValue placeholder={t("storeLayout.selectItem")} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground text-xs max-h-40">
              {availableItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {getCategoryIcon(item.category_id)} {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleAssign}
            disabled={!selectedItemId}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-7"
          >
            {t("storeLayout.assignItem")}
          </Button>
        </div>
      )}
    </aside>
  );
}
