# Business Units Screen (Unit Usaha)

This module enables village cooperative managers to activate, deactivate, or register operational divisions (such as Apotek, Toko Pupuk, Simpan Pinjam, or Penggilingan Padi).

---

### 🗄️ Database Schema & Fields
- **Cooperative Profile**:
  - Table: `cooperatives`
  - Field: `business_units` (stored as a serialized JSON string array, e.g. `["unit_apotek", "unit_pupuk"]`).
- **Category Registry**:
  - Table: `categories`
  - Columns: `id` (starts with `unit_`), `name` (e.g. `Unit Air Bersih`), `icon` (emoji).

---

### 📊 Financial Calculations
- **Gross Revenue**:
  - Sum of credit lines in `journal_lines` tagged with matching category IDs where the corresponding account in `coa_accounts` is of type `'pendapatan'` (revenue).
  - Calculated live on load/update.
