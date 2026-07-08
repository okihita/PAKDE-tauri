import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getDb } from "@/db";
import { getActiveCoopId } from "@/db/active-coop";
import { useToast } from "@/hooks/useToast";
import type { InventoryItem, SalesTransaction, SalesTransactionItem, Member } from "@/types";

export interface CartItem {
  item: InventoryItem;
  quantity: number;
}

export function useSales() {
  const { t } = useTranslation();
  const toast = useToast();

  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [transactionsList, setTransactionsList] = useState<SalesTransaction[]>([]);
  const [categoriesList, setCategoriesList] = useState<Array<{ id: string; name: string; icon: string }>>([]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Inventory data
  const loadInventory = useCallback(async () => {
    try {
      const db = await getDb();
      const res = await db.select<InventoryItem[]>(
        "SELECT * FROM inventory_items ORDER BY name ASC"
      );
      setInventoryList(res);
    } catch (e) {
      console.error("Failed to load inventory:", e);
    }
  }, []);

  // Load active members (for customer choice)
  const loadMembers = useCallback(async () => {
    try {
      const db = await getDb();
      const res = await db.select<Member[]>(
        "SELECT * FROM members WHERE status = 'aktif' ORDER BY name ASC"
      );
      setMembersList(res);
    } catch (e) {
      console.error("Failed to load members:", e);
    }
  }, []);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const db = await getDb();
      // only load categories that represent business units (prefix unit_)
      const res = await db.select<Array<{ id: string; name: string; icon: string }>>(
        "SELECT * FROM categories WHERE id LIKE 'unit_%' ORDER BY name ASC"
      );
      setCategoriesList(res);
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  }, []);

  // Load Sales History
  const loadTransactions = useCallback(async () => {
    try {
      const db = await getDb();
      const txs = await db.select<SalesTransaction[]>(
        `SELECT st.*, m.name as member_name, c.name as category_name
         FROM sales_transactions st
         LEFT JOIN members m ON st.member_id = m.id
         LEFT JOIN categories c ON st.category_id = c.id
         ORDER BY st.transaction_date DESC`
      );

      const mapped: SalesTransaction[] = [];
      for (const tx of txs) {
        const items = await db.select<SalesTransactionItem[]>(
          `SELECT sti.*, ii.name as item_name
           FROM sales_transaction_items sti
           LEFT JOIN inventory_items ii ON sti.item_id = ii.id
           WHERE sti.transaction_id = ?`,
          [tx.id]
        );
        mapped.push({ ...tx, items });
      }
      setTransactionsList(mapped);
    } catch (e) {
      console.error("Failed to load sales transactions:", e);
    }
  }, []);

  // ── Cart Actions ───────────────────────────────────────────────

  const addToCart = (item: InventoryItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock_quantity) {
          toast.error(t("sales.toast.outOfStock", { name: item.name }));
          return prev;
        }
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateCartQty = (itemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(itemId);
      return;
    }
    const invItem = inventoryList.find((i) => i.id === itemId);
    if (invItem && qty > invItem.stock_quantity) {
      toast.error(t("sales.toast.outOfStock", { name: invItem.name }));
      return;
    }
    setCart((prev) =>
      prev.map((c) => (c.item.id === itemId ? { ...c, quantity: qty } : c))
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const clearCart = () => setCart([]);

  // ── Checkout Action ─────────────────────────────────────────────

  const processCheckout = async (
    memberId: string | null,
    paymentType: "cash" | "credit",
    categoryId: string
  ): Promise<boolean> => {
    if (cart.length === 0) {
      toast.error(t("sales.toast.emptyCart"));
      return false;
    }
    if (paymentType === "credit" && !memberId) {
      toast.error(t("sales.toast.memberRequiredForCredit"));
      return false;
    }

    setIsProcessing(true);
    try {
      const db = await getDb();
      const txId = `tx-${Date.now()}`;
      const jeId = `je-sales-${Date.now()}`;
      const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);

      // 1. Calculate totals and check stock availability
      let totalAmount = 0;
      for (const c of cart) {
        totalAmount += c.item.selling_price * c.quantity;
        const currentItem = inventoryList.find((i) => i.id === c.item.id);
        if (!currentItem || currentItem.stock_quantity < c.quantity) {
          throw new Error(t("sales.toast.outOfStock", { name: c.item.name }));
        }
      }

      // 2. Insert into sales_transactions
      await db.execute(
        `INSERT INTO sales_transactions (id, member_id, total_amount, payment_type, category_id, journal_entry_id, transaction_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [txId, memberId, totalAmount, paymentType, categoryId, jeId, timestamp]
      );

      // 3. Process each line item (Save, Deduct Stock)
      for (const c of cart) {
        const lineId = `sti-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        await db.execute(
          `INSERT INTO sales_transaction_items (id, transaction_id, item_id, quantity, price, cost)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [lineId, txId, c.item.id, c.quantity, c.item.selling_price, c.item.cost_price]
        );

        // Deduct Stock
        await db.execute(
          `UPDATE inventory_items
           SET stock_quantity = stock_quantity - ?, updated_at = datetime('now')
           WHERE id = ?`,
          [c.quantity, c.item.id]
        );
      }

      // 4. Update member outstanding balance if paid with Credit
      if (paymentType === "credit" && memberId) {
        await db.execute(
          `UPDATE members
           SET loan_outstanding = loan_outstanding + ?, updated_at = datetime('now')
           WHERE id = ?`,
          [totalAmount, memberId]
        );
      }

      // 5. Create Double-Entry Journal Entry
      const jeNumber = `JE-SALES-${Date.now().toString().slice(-6)}`;
      const jeDesc = `Penjualan ${paymentType === "cash" ? "Tunai" : "Kredit (Yarnen)"} - POS`;
      
      const coopId = getActiveCoopId();
      await db.execute(
        `INSERT INTO journal_entries (id, cooperative_id, number, date, description, category, created_by)
         VALUES (?, ?, ?, ?, ?, ?, 'usr-001')`,
        [jeId, coopId, jeNumber, timestamp.split(" ")[0], jeDesc, "operasional"]
      );

      // Line 1: Debit Cash (1.1.01) or Accounts Receivable (1.1.03)
      const debitAccount = paymentType === "cash" ? "1.1.01" : "1.1.03";
      const line1Id = `jl-${Date.now()}-d`;
      await db.execute(
        `INSERT INTO journal_lines (id, journal_entry_id, account_code, description, debit, credit)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [line1Id, jeId, debitAccount, jeDesc, totalAmount]
      );

      // Line 2: Credit Business Unit Revenue (4.02)
      const line2Id = `jl-${Date.now()}-c`;
      await db.execute(
        `INSERT INTO journal_lines (id, journal_entry_id, account_code, description, debit, credit)
         VALUES (?, ?, ?, ?, 0, ?)`,
        [line2Id, jeId, "4.02", jeDesc, totalAmount]
      );

      // Update balances in coa_accounts
      // Debit account is Asset (Aset) -> Normal balance debit -> Balance increases
      const debAccRes = await db.select<Array<{ balance: number }>>(
        "SELECT balance FROM coa_accounts WHERE code = ?",
        [debitAccount]
      );
      if (debAccRes.length > 0) {
        await db.execute(
          "UPDATE coa_accounts SET balance = ? WHERE code = ?",
          [debAccRes[0].balance + totalAmount, debitAccount]
        );
      }

      // Credit account is Revenue (Pendapatan) -> Normal balance kredit -> Balance increases
      const credAccRes = await db.select<Array<{ balance: number }>>(
        "SELECT balance FROM coa_accounts WHERE code = ?",
        ["4.02"]
      );
      if (credAccRes.length > 0) {
        await db.execute(
          "UPDATE coa_accounts SET balance = ? WHERE code = ?",
          [credAccRes[0].balance + totalAmount, "4.02"]
        );
      }

      toast.success(t("sales.toast.checkoutSuccess"));
      setCart([]);
      await loadInventory();
      await loadTransactions();
      await loadMembers();
      return true;
    } catch (e) {
      console.error("Checkout failed:", e);
      toast.error(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Inventory CRUD ──────────────────────────────────────────────

  const createInventoryItem = async (
    name: string,
    categoryId: string,
    stockQuantity: number,
    unit: string,
    costPrice: number,
    sellingPrice: number
  ): Promise<boolean> => {
    if (!name || !categoryId || !unit || sellingPrice <= 0) {
      toast.error(t("sales.toast.fieldsRequired"));
      return false;
    }
    try {
      const db = await getDb();
      const itemId = `item-${Date.now()}`;
      await db.execute(
        `INSERT INTO inventory_items (id, name, category_id, stock_quantity, unit, cost_price, selling_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [itemId, name, categoryId, stockQuantity, unit, costPrice, sellingPrice]
      );
      toast.success(t("sales.toast.itemCreated"));
      await loadInventory();
      return true;
    } catch (e) {
      console.error(e);
      toast.error(t("sales.toast.saveFailed"));
      return false;
    }
  };

  const restockInventoryItem = async (
    id: string,
    qty: number
  ): Promise<boolean> => {
    if (qty <= 0) {
      toast.error(t("sales.toast.qtyInvalid"));
      return false;
    }
    try {
      const db = await getDb();
      await db.execute(
        `UPDATE inventory_items
         SET stock_quantity = stock_quantity + ?, updated_at = datetime('now')
         WHERE id = ?`,
        [qty, id]
      );
      toast.success(t("sales.toast.itemRestocked"));
      await loadInventory();
      return true;
    } catch (e) {
      console.error(e);
      toast.error(t("sales.toast.saveFailed"));
      return false;
    }
  };

  const deleteInventoryItem = async (id: string): Promise<boolean> => {
    const confirmDelete = await toast.confirm(t("sales.toast.deleteConfirm"));
    if (!confirmDelete) return false;
    try {
      const db = await getDb();
      await db.execute("DELETE FROM inventory_items WHERE id = ?", [id]);
      toast.success(t("sales.toast.itemDeleted"));
      await loadInventory();
      return true;
    } catch (e) {
      console.error(e);
      toast.error(t("sales.toast.deleteFailed"));
      return false;
    }
  };

  return {
    inventoryList,
    membersList,
    transactionsList,
    categoriesList,
    cart,
    isProcessing,
    loadInventory,
    loadMembers,
    loadCategories,
    loadTransactions,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    processCheckout,
    createInventoryItem,
    restockInventoryItem,
    deleteInventoryItem,
  };
}
