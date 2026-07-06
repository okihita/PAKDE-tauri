import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Trash2, Sparkles } from "lucide-react";
import type { InventoryItem } from "@/types";

interface SalesInventoryProps {
  inventoryList: InventoryItem[];
  categoriesList: Array<{ id: string; name: string; icon: string }>;
  onCreateItem: (
    name: string,
    categoryId: string,
    stockQuantity: number,
    unit: string,
    costPrice: number,
    sellingPrice: number
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
      addForm.sellingPrice
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xxs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-emerald-400" />
          {t("sales.inventory.title")}
        </h3>
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

      <Card className="bg-card border-border hover-glow-card">
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

      {/* Add Product Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <form onSubmit={handleAddProductSubmit}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-foreground">
                {t("sales.inventory.dialogAdd")}
              </DialogTitle>
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
                <Select
                  value={addForm.categoryId}
                  onValueChange={(val) => setAddForm({ ...addForm, categoryId: val })}
                >
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
