import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Trash2, Sparkles, LayoutGrid, List } from "lucide-react";
import type { InventoryItem } from "@/types";

const TEXT_AISLE_HEADER = "Aisle: ";
const TEXT_STABLE_STATUS = "Stable";
const TEXT_LOW_STOCK_STATUS = "Low Stock";
const TEXT_OUT_OF_STOCK_STATUS = "Out of Stock";
const TEXT_TITLE_TABLE = "Table View";
const TEXT_TITLE_VISUAL = "Visual Warehouse";
const TEXT_CURRENCY_PREFIX = ": Rp ";

interface SalesInventoryProps {
  inventoryList: InventoryItem[];
  categoriesList: Array<{ id: string; name: string; icon: string }>;
  onCreateItem: (
    name: string,
    categoryId: string,
    stockQuantity: number,
    unit: string,
    costPrice: number,
    sellingPrice: number,
  ) => Promise<boolean>;
  onRestockItem: (id: string, qty: number) => Promise<boolean>;
  onDeleteItem: (id: string) => Promise<boolean>;
}

export default function SalesInventory({
  inventoryList,
  categoriesList,
  onCreateItem,
  onRestockItem,
  onDeleteItem,
}: SalesInventoryProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"table" | "visual">("table");

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    categoryId: "",
    stockQuantity: 0,
    unit: "",
    costPrice: 0,
    sellingPrice: 0,
  });

  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockItemId, setRestockItemId] = useState("");
  const [restockQty, setRestockQty] = useState(0);

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onCreateItem(
      addForm.name,
      addForm.categoryId || (categoriesList.length > 0 ? categoriesList[0].id : ""),
      addForm.stockQuantity,
      addForm.unit,
      addForm.costPrice,
      addForm.sellingPrice,
    );
    if (success) {
      setAddForm({
        name: "",
        categoryId: categoriesList[0]?.id || "",
        stockQuantity: 0,
        unit: "",
        costPrice: 0,
        sellingPrice: 0,
      });
      setShowAddModal(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onRestockItem(restockItemId, restockQty);
    if (success) {
      setRestockItemId("");
      setRestockQty(0);
      setShowRestockModal(false);
    }
  };

  const getCategoryIcon = (catId: string) => {
    const found = categoriesList.find((c) => c.id === catId);
    return found ? found.icon : "📦";
  };

  const groupedInventory = categoriesList.map((cat) => {
    const items = inventoryList.filter((item) => item.category_id === cat.id);
    return { category: cat, items };
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xxs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-emerald-400" />
          {t("sales.inventory.title")}
        </h3>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex border border-border rounded-lg p-0.5 bg-slate-900/50 backdrop-blur-sm">
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("table")}
              className="h-7 w-7 rounded-md p-0"
              title={TEXT_TITLE_TABLE}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "visual" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("visual")}
              className="h-7 w-7 rounded-md p-0"
              title={TEXT_TITLE_VISUAL}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button
            onClick={() => {
              if (categoriesList.length > 0) {
                setAddForm((f) => ({ ...f, categoryId: categoriesList[0].id }));
              }
              setShowAddModal(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-8.5 px-4 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {t("sales.inventory.addItem")}
          </Button>
        </div>
      </div>

      {viewMode === "table" ? (
        <Card className="bg-card border-border hover-glow-card animate-in fade-in duration-250">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xxs font-mono text-muted-foreground pl-4">
                    {t("sales.inventory.name")}
                  </TableHead>
                  <TableHead className="text-xxs font-mono text-muted-foreground">
                    {t("sales.inventory.category")}
                  </TableHead>
                  <TableHead className="text-xxs font-mono text-muted-foreground text-right">
                    {t("sales.inventory.cost")}
                  </TableHead>
                  <TableHead className="text-xxs font-mono text-muted-foreground text-right">
                    {t("sales.inventory.price")}
                  </TableHead>
                  <TableHead className="text-xxs font-mono text-muted-foreground text-right">
                    {t("sales.inventory.stock")}
                  </TableHead>
                  <TableHead className="text-xxs font-mono text-muted-foreground text-center w-36 pr-4">
                    {t("sales.inventory.action")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryList.map((item) => (
                  <TableRow key={item.id} className="border-border hover:bg-sidebar-ring">
                    <TableCell className="text-xs text-foreground font-semibold pl-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{getCategoryIcon(item.category_id)}</span>
                        <span>{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xxs text-muted-foreground font-mono uppercase">
                      {item.category_id.replace("unit_", "").replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-xxs font-mono text-muted-foreground text-right">
                      Rp {item.cost_price.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-xxs font-mono text-emerald-400 font-semibold text-right">
                      Rp {item.selling_price.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-xxs font-mono text-foreground font-bold text-right">
                      {item.stock_quantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex gap-1.5 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRestockItemId(item.id);
                            setShowRestockModal(true);
                          }}
                          className="border-border text-muted-foreground hover:text-foreground text-xxs h-7 px-2.5"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {t("sales.inventory.restock")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteItem(item.id)}
                          className="h-7 w-7 text-rose-400 hover:text-foreground hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {inventoryList.length === 0 && (
                  <TableRow className="border-border">
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs font-mono">
                      {t("sales.inventory.empty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-250">
          {groupedInventory.map(({ category, items }) => {
            if (items.length === 0) return null;
            return (
              <div key={category.id} className="space-y-2">
                <h4 className="text-xxxs font-mono font-bold text-emerald-400 uppercase tracking-widest px-1">
                  {category.icon} {TEXT_AISLE_HEADER} {category.name}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {items.map((item) => {
                    const isLow = item.stock_quantity <= 10 && item.stock_quantity > 0;
                    const isOutOfStock = item.stock_quantity === 0;
                    const capacity = 100; // default baseline capacity
                    const stockPct = Math.min(100, Math.max(0, (item.stock_quantity / capacity) * 100));

                    return (
                      <Card
                        key={item.id}
                        className={`bg-slate-950/60 border-slate-900/80 p-4 flex flex-col justify-between min-h-36 hover:border-emerald-500/20 hover:shadow-[0_4px_20px_rgba(16,185,129,0.03)] transition-all duration-200 ${
                          isOutOfStock ? "animate-pulse-border bg-rose-500/5" : ""
                        }`}
                      >
                        <div className="space-y-3.5">
                          <div className="flex justify-between items-start">
                            <span className="text-base shrink-0">{category.icon}</span>
                            {isOutOfStock ? (
                              <span className="text-xxxs font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 uppercase tracking-wider animate-pulse">
                                {TEXT_OUT_OF_STOCK_STATUS}
                              </span>
                            ) : isLow ? (
                              <span className="text-xxxs font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase tracking-wider">
                                {TEXT_LOW_STOCK_STATUS}
                              </span>
                            ) : (
                              <span className="text-xxxs font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                                {TEXT_STABLE_STATUS}
                              </span>
                            )}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-foreground truncate">{item.name}</h5>
                            <p className="text-xxxs font-mono text-slate-400 mt-0.5">
                              {t("sales.inventory.price")}
                              {TEXT_CURRENCY_PREFIX}
                              {item.selling_price.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2.5 pt-3.5 border-t border-slate-900/60 mt-4">
                          {/* Visual Stack Progress Bar */}
                          <div className="space-y-1 font-sans">
                            <div className="flex justify-between items-center text-xxxs font-mono text-slate-400">
                              <span className="uppercase">{t("sales.inventory.stock")}</span>
                              <span className="font-bold">
                                {item.stock_quantity} {item.unit}
                              </span>
                            </div>
                            <div className="h-1 rounded-full bg-slate-900 border border-slate-900/80 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isOutOfStock ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${stockPct}%` }}
                              />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1.5 pt-0.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRestockItemId(item.id);
                                setShowRestockModal(true);
                              }}
                              className="flex-1 border-slate-900 hover:border-slate-800 text-slate-300 text-xxxs h-6.5"
                            >
                              <Plus className="h-2.5 w-2.5 mr-1" />
                              {t("sales.inventory.restock")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeleteItem(item.id)}
                              className="h-6.5 w-6.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {inventoryList.length === 0 && (
            <Card className="bg-card border-border hover-glow-card">
              <CardContent className="p-12 text-center text-xs text-muted-foreground font-mono">
                {t("sales.inventory.empty")}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Product Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <form onSubmit={handleAddProductSubmit}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-foreground">{t("sales.inventory.dialogAdd")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3.5 py-4 text-xs">
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("sales.inventory.name")}
                </label>
                <Input
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder={t("sales.inventory.placeholderName")}
                  className="bg-input border-border text-xs h-8.5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("sales.inventory.category")}
                </label>
                <Select value={addForm.categoryId} onValueChange={(val) => setAddForm({ ...addForm, categoryId: val })}>
                  <SelectTrigger className="bg-input border-border text-xs h-8.5">
                    <SelectValue placeholder={t("sales.checkout.selectUnit")} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground text-xs">
                    {categoriesList.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-muted-foreground font-mono text-xxxs uppercase">
                    {t("sales.inventory.stock")}
                  </label>
                  <Input
                    type="number"
                    value={addForm.stockQuantity || ""}
                    onChange={(e) => setAddForm({ ...addForm, stockQuantity: Number(e.target.value) })}
                    className="bg-input border-border text-xs h-8.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground font-mono text-xxxs uppercase">
                    {t("sales.inventory.unit")}
                  </label>
                  <Input
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    placeholder={t("sales.inventory.placeholderUnit")}
                    className="bg-input border-border text-xs h-8.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-muted-foreground font-mono text-xxxs uppercase">
                    {t("sales.inventory.cost")}
                  </label>
                  <Input
                    type="number"
                    value={addForm.costPrice || ""}
                    onChange={(e) => setAddForm({ ...addForm, costPrice: Number(e.target.value) })}
                    className="bg-input border-border text-xs h-8.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground font-mono text-xxxs uppercase">
                    {t("sales.inventory.price")}
                  </label>
                  <Input
                    type="number"
                    value={addForm.sellingPrice || ""}
                    onChange={(e) => setAddForm({ ...addForm, sellingPrice: Number(e.target.value) })}
                    className="bg-input border-border text-xs h-8.5"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="border-border text-muted-foreground text-xs h-8"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-8"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {t("sales.inventory.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Restock Modal */}
      <Dialog open={showRestockModal} onOpenChange={setShowRestockModal}>
        <DialogContent className="bg-card border-border text-foreground max-w-xs">
          <form onSubmit={handleRestockSubmit}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-foreground">
                {t("sales.inventory.dialogRestock")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3.5 py-4 text-xs">
              <div className="space-y-1">
                <label className="text-muted-foreground font-mono text-xxxs uppercase">
                  {t("sales.inventory.restockQty")}
                </label>
                <Input
                  type="number"
                  value={restockQty || ""}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="bg-input border-border text-xs h-8.5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRestockModal(false)}
                className="border-border text-muted-foreground text-xs h-8"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-8"
              >
                {t("sales.inventory.restock")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
