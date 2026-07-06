import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSales } from "@/hooks/useSales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, History, Package, Search, MinusCircle, PlusCircle, CreditCard, Trash2 } from "lucide-react";
import DevDocStripe from "@/components/DevDocStripe";
import readmeContent from "./README.md?raw";
import SalesHistory from "./SalesHistory";
import SalesInventory from "./SalesInventory";
import "./Sales.css";

const USER_ICON = "👤";
const MAX_CART_BADGE = "Max Cart";

export default function Sales() {
  const { t } = useTranslation();
  const s = useSales();

  // Tab State
  const [activeSubTab, setActiveSubTab] = useState<"checkout" | "history" | "inventory">("checkout");

  // POS Checkout State
  const [selectedMemberId, setSelectedMemberId] = useState<string>("walk-in");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("unit_pupuk");
  const [paymentType, setPaymentType] = useState<"cash" | "credit">("cash");
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");

  const loadInventory = s.loadInventory;
  const loadMembers = s.loadMembers;
  const loadCategories = s.loadCategories;
  const loadTransactions = s.loadTransactions;

  // Initialize data
  useEffect(() => {
    loadInventory();
    loadMembers();
    loadCategories();
    loadTransactions();
  }, [loadInventory, loadMembers, loadCategories, loadTransactions]);

  // Filters
  const filteredProducts = s.inventoryList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategoryFilter === "all" || item.category_id === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate Cart Total
  const cartTotal = s.cart.reduce((sum, c) => sum + c.item.selling_price * c.quantity, 0);

  const handleCheckoutSubmit = async () => {
    const memberVal = selectedMemberId === "walk-in" ? null : selectedMemberId;
    const success = await s.processCheckout(memberVal, paymentType, selectedCategoryId);
    if (success) {
      setSelectedMemberId("walk-in");
      setPaymentType("cash");
    }
  };

  const getCategoryIcon = (catId: string) => {
    const found = s.categoriesList.find((c) => c.id === catId);
    return found ? found.icon : "📦";
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 max-w-6xl mx-auto">
      <DevDocStripe content={readmeContent} />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">{t("sales.checkout.title")}</h1>
            <p className="text-xxs text-muted-foreground">{t("sales.history.title")}</p>
          </div>
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as "checkout" | "history" | "inventory")} className="w-full">
        <TabsList className="bg-sidebar border border-border text-muted-foreground p-0.5 rounded-lg flex w-fit mb-6">
          <TabsTrigger
            value="checkout"
            className="text-xxs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 flex items-center gap-1.5"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {t("sales.tabs.checkout")}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="text-xxs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 flex items-center gap-1.5"
          >
            <History className="h-3.5 w-3.5" />
            {t("sales.tabs.history")}
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className="text-xxs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 flex items-center gap-1.5"
          >
            <Package className="h-3.5 w-3.5" />
            {t("sales.tabs.inventory")}
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: POS CHECKOUT ────────────────────────────────────── */}
        <TabsContent value="checkout" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Products grid */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t("sales.checkout.searchProducts")}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-8 bg-input border-border text-xs h-9 placeholder:text-muted-foreground/60"
                  />
                </div>
                <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-44 bg-input border-border text-xs h-9">
                    <SelectValue placeholder={t("sales.checkout.allCategories")} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground text-xs">
                    <SelectItem value="all">{t("sales.checkout.allCategories")}</SelectItem>
                    {s.categoriesList.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stock_quantity <= 0;
                  const cartItem = s.cart.find((c) => c.item.id === p.id);
                  const cartQty = cartItem ? cartItem.quantity : 0;
                  const availableQty = p.stock_quantity - cartQty;

                  return (
                    <Card
                      key={p.id}
                      onClick={() => !isOutOfStock && availableQty > 0 && s.addToCart(p)}
                      className={`bg-card border-border select-none relative overflow-hidden transition-all duration-200 ${
                        isOutOfStock || availableQty <= 0
                          ? "opacity-55 grayscale cursor-not-allowed"
                          : "cursor-pointer hover:border-emerald-500/30 hover:bg-emerald-500/3 hover:scale-[1.01]"
                      }`}
                    >
                      {cartQty > 0 && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-slate-950 font-bold font-mono text-xxs w-5 h-5 rounded-full flex items-center justify-center shadow-lg ring-1 ring-emerald-400">
                          {cartQty}
                        </div>
                      )}
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/10">
                            {getCategoryIcon(p.category_id)}
                          </span>
                          <CardTitle className="text-xxs font-bold text-foreground line-clamp-2 leading-tight">
                            {p.name}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-1 space-y-2">
                        <div className="flex justify-between items-baseline font-mono">
                          <span className="text-xxxs text-muted-foreground uppercase">{t("sales.checkout.price")}</span>
                          <span className="text-xs font-black text-emerald-400">
                            Rp {p.selling_price.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xxxs text-muted-foreground font-mono">
                          <span>{t("sales.checkout.stock", { n: p.stock_quantity, unit: p.unit })}</span>
                          {isOutOfStock ? (
                            <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-1 rounded">
                              {t("sales.checkout.outOfStock")}
                            </span>
                          ) : availableQty === 0 ? (
                            <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-1 rounded">
                              {MAX_CART_BADGE}
                            </span>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-16 text-center text-muted-foreground text-xs font-mono border-dashed border border-border rounded-xl">
                    {t("sales.inventory.empty")}
                  </div>
                )}
              </div>
            </div>

            {/* Cart & Checkout Panel */}
            <div className="space-y-6">
              <Card className="bg-card border-border hover-glow-card">
                <CardHeader className="pb-3 border-b border-border/55">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <ShoppingCart className="h-3.5 w-3.5 text-emerald-400" />
                      {t("sales.checkout.cartTitle")}
                    </span>
                    <span className="font-mono text-xxs text-muted-foreground">
                      {t("sales.checkout.itemCount", { count: s.cart.length })}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Cart Items list */}
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {s.cart.map((c) => (
                      <div
                        key={c.item.id}
                        className="flex items-center justify-between gap-3 text-xxs p-2 rounded-lg bg-input/20 border border-border/40"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">{c.item.name}</p>
                          <p className="text-xxs text-muted-foreground font-mono mt-0.5">
                            Rp {c.item.selling_price.toLocaleString("id-ID")} / {c.item.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => s.updateCartQty(c.item.id, c.quantity - 1)}
                            className="p-1 hover:text-emerald-400 text-muted-foreground transition-colors"
                          >
                            <MinusCircle className="h-4 w-4" />
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-foreground text-xxs">
                            {c.quantity}
                          </span>
                          <button
                            onClick={() => s.updateCartQty(c.item.id, c.quantity + 1)}
                            className="p-1 hover:text-emerald-400 text-muted-foreground transition-colors"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => s.removeFromCart(c.item.id)}
                            className="p-1 pl-2 hover:text-rose-400 text-muted-foreground transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {s.cart.length === 0 && (
                      <p className="text-xxs text-muted-foreground py-6 text-center italic leading-normal">
                        {t("sales.checkout.emptyCart")}
                      </p>
                    )}
                  </div>

                  {/* Customer Settings */}
                  <div className="space-y-3 pt-3 border-t border-border/50">
                    <div className="space-y-1">
                      <label className="text-xxs font-mono text-muted-foreground uppercase">
                        {t("sales.checkout.customer")}
                      </label>
                      <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                        <SelectTrigger className="bg-input border-border text-xs h-8.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground text-xs max-h-56">
                          <SelectItem value="walk-in">
                            {USER_ICON} {t("sales.checkout.walkIn")}
                          </SelectItem>
                          {s.membersList.map((m) => (
                            <SelectItem key={m.id} value={m.id || ""}>
                              {USER_ICON} {m.name} ({m.nik})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedMemberId !== "walk-in" && (
                        <p className="text-xxs font-mono text-amber-400 mt-1">
                          {t("sales.checkout.memberLoan", {
                            amount: `Rp ${
                              (
                                s.membersList.find((mbr) => mbr.id === selectedMemberId)?.loan_outstanding ?? 0
                              ).toLocaleString("id-ID")
                            }`,
                          })}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xxs font-mono text-muted-foreground uppercase">
                        {t("sales.checkout.businessUnit")}
                      </label>
                      <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger className="bg-input border-border text-xs h-8.5">
                          <SelectValue placeholder={t("sales.checkout.selectUnit")} />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground text-xs">
                          {s.categoriesList.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.icon} {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xxs font-mono text-muted-foreground uppercase block">
                        {t("sales.checkout.paymentType")}
                      </label>
                      <div className="flex bg-input p-0.5 rounded-lg border border-border w-full">
                        <button
                          type="button"
                          onClick={() => setPaymentType("cash")}
                          className={`flex-1 py-1.5 rounded-md text-xxs font-bold transition-all ${
                            paymentType === "cash"
                              ? "bg-emerald-500/10 text-emerald-400 border-[0.5px] border-emerald-500/20"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t("sales.checkout.cash")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentType("credit")}
                          className={`flex-1 py-1.5 rounded-md text-xxs font-bold transition-all ${
                            paymentType === "credit"
                              ? "bg-emerald-500/10 text-emerald-400 border-[0.5px] border-emerald-500/20"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t("sales.checkout.credit")}
                        </button>
                      </div>
                      {paymentType === "credit" && selectedMemberId === "walk-in" && (
                        <div className="p-2 rounded bg-amber-500/5 border border-amber-500/10 text-xxs font-mono text-amber-400">
                          {t("sales.toast.memberRequiredForCredit")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary & Submit */}
                  <div className="space-y-3 pt-3 border-t border-border">
                    <div className="flex justify-between items-baseline font-mono">
                      <span className="text-xxxs font-bold text-muted-foreground uppercase">
                        {t("sales.checkout.total")}
                      </span>
                      <span className="text-base font-black text-emerald-400">
                        Rp {cartTotal.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <Button
                      onClick={handleCheckoutSubmit}
                      disabled={
                        s.isProcessing ||
                        s.cart.length === 0 ||
                        (paymentType === "credit" && selectedMemberId === "walk-in")
                      }
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9.5 flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="h-4 w-4" />
                      {s.isProcessing ? t("sales.checkout.processing") : t("sales.checkout.process")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 2: SALES TRANSACTION HISTORY ────────────────────────── */}
        <TabsContent value="history" className="outline-none">
          <SalesHistory
            transactionsList={s.transactionsList}
            membersList={s.membersList}
          />
        </TabsContent>

        {/* ── TAB 3: INVENTORY MANAGEMENT ────────────────────────────── */}
        <TabsContent value="inventory" className="outline-none">
          <SalesInventory
            inventoryList={s.inventoryList}
            categoriesList={s.categoriesList}
            onCreateItem={s.createInventoryItem}
            onRestockItem={s.restockInventoryItem}
            onDeleteItem={s.deleteInventoryItem}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
