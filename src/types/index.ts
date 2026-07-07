// ── Domain models ────────────────────────────────────────────────

export interface Member {
  id?: string;
  nik: string;
  name: string;
  place_of_birth: string;
  date_of_birth: string;
  gender: "L" | "P";
  occupation: string;
  education: string;
  rt: string;
  rw: string;
  hamlet: string;
  status: "aktif" | "nonaktif";
  savings_pokok: number;
  savings_wajib: number;
  savings_sukarela: number;
  loan_total: number;
  loan_outstanding: number;
  loan_status: string;
}

export interface CoaAccount {
  code: string;
  name: string;
  type: "aset" | "kewajiban" | "ekuitas" | "pendapatan" | "beban";
  normal_balance: "debit" | "kredit";
  balance: number;
}

export interface JournalLineInput {
  accountCode: string;
  debit: number;
  credit: number;
}

export interface JournalEntryWithLines {
  id: string;
  number: string;
  date: string;
  description: string;
  reference: string;
  category: string;
  tags: string;
  lines: Array<{
    account_code: string;
    name: string;
    debit: number;
    credit: number;
  }>;
}

export interface CooperativeProfile {
  id?: string;
  name: string;
  legal_id: string;
  address: string;
  village: string;
  district: string;
  regency: string;
  province: string;
  postal_code: string;
  phone: string;
  email: string;
  business_units: string;
  officers: string;
  logo_path?: string;
  rag_status: string;
  health_score: number;
  status?: string;
  level?: string;
  parent_id?: string;
  parent_name?: string;
  founded_date?: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EwsAlert {
  id: string;
  cooperative_id: string;
  level: "info" | "warning" | "critical";
  indicator: string;
  message: string;
  current_value: number;
  threshold_value: number;
  trend: string;
  suggested_action: string;
  triggered_at: string;
  resolved_at: string | null;
  is_active: number;
}

export interface LedgerLine {
  id: string;
  journal_entry_id: string;
  account_code: string;
  description: string;
  debit: number;
  credit: number;
  date: string;
  number: string;
  entry_desc: string;
  runningBalance: number;
}

export interface FeasibilityResult {
  enpv: number;
  eirr: number;
  ebcr: number;
  tier: number;
  tierLabel?: string;
  tierColor?: string;
  isNPVPass?: boolean;
  isIRRPass?: boolean;
  isBCRPass?: boolean;
}

export interface SensitivityResult {
  enpv: number;
  eirr: number;
  ebcr: number;
  tier: number;
  tierLabel?: string;
  scenario?: string;
  investment?: number;
  flows?: number[];
}

export interface SyncHistoryItem {
  id: string;
  cooperative_id: string;
  direction: "upload" | "download";
  status: "success" | "failed" | "in_progress";
  entity_count: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

// ── DB row types ─────────────────────────────────────────────────

export interface JournalEntryRow {
  id: string;
  cooperative_id: string;
  number: string;
  date: string;
  description: string;
  reference: string;
  category: string;
  tags: string;
  created_by: string;
  created_at: string;
  sync_status: string;
}

export interface JournalLineRow {
  id: string;
  journal_entry_id: string;
  account_code: string;
  description: string;
  debit: number;
  credit: number;
  name: string;
}

export interface CoaBalanceRow {
  normal_balance: string;
  balance: number;
}

export interface CountRow {
  count: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category_id: string;
  stock_quantity: number;
  unit: string;
  cost_price: number;
  selling_price: number;
  zone_id?: string | null;
  shelf_row?: number | null;
  shelf_col?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface StoreLayout {
  id: string;
  cooperative_id: string;
  name: string;
  grid_width: number;
  grid_height: number;
  cell_size: number;
  canvas_data?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LayoutZone {
  id: string;
  layout_id: string;
  name: string;
  zone_type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rows: number;
  cols: number;
  color: string;
  created_at?: string;
}

export interface SalesTransaction {
  id: string;
  cooperative_id: string;
  member_id: string | null;
  member_name?: string;
  total_amount: number;
  payment_type: "cash" | "credit";
  category_id: string;
  category_name?: string;
  journal_entry_id: string | null;
  transaction_date: string;
  items?: SalesTransactionItem[];
}

export interface SalesTransactionItem {
  id: string;
  transaction_id: string;
  item_id: string;
  item_name?: string;
  quantity: number;
  price: number;
  cost: number;
}

// ── Utility ──────────────────────────────────────────────────────

export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
