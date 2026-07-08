# Multi-Tenant Schema Design

## Principle

Every cooperative is a **tenant**. All data rows belong to exactly one cooperative. The `cooperative_id` column is **never optional** on any table that holds business data.

## UUIDs for Primary Keys

All entity IDs use UUIDs v4 (`crypto.randomUUID()`). This eliminates collision risk when syncing across devices.

| Entity | ID Format | Example |
|---|---|---|
| Demo cooperative | Fixed UUID | `00000000-0000-0000-0000-000000000001` |
| Real cooperatives | Random UUID | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| Future: members, users, etc. | Random UUID | same pattern |

The demo UUID is a **well-known constant** exported from `src/db/seed-demo.ts` as `DEMO_COOP_UUID`. All code that references the demo cooperative uses this constant — never a hardcoded string.

## Composite Primary Keys

Tables that logically belong to a cooperative use `(id, cooperative_id)` as the primary key, **not** `id` alone. This allows two cooperatives to independently create objects with the same logical identifier.

| Table | PK before (broken) | PK after (fixed) |
|---|---|---|
| `coa_accounts` | `code` | `(code, cooperative_id)` |
| `categories` | `id` | `(id, cooperative_id)` |
| `inventory_items` | `id` | `(id, cooperative_id)` — add column |

## Why composite keys?

The demo cooperative (`kdp-001`) uses standard accounting codes (`1.1.01` = Kas) and standard category IDs (`unit_pupuk`). A real cooperative must be able to use the same codes without colliding.

```sql
-- BEFORE (single PK — broken for multi-tenant)
INSERT INTO coa_accounts (code, cooperative_id, name) VALUES ('1.1.01', 'kdp-001', 'Kas');  -- ✅
INSERT INTO coa_accounts (code, cooperative_id, name) VALUES ('1.1.01', 'kdp-real', 'Kas'); -- ❌ PK conflict

-- AFTER (composite PK — correct)
INSERT INTO coa_accounts (code, cooperative_id, name) VALUES ('1.1.01', 'kdp-001', 'Kas');  -- ✅
INSERT INTO coa_accounts (code, cooperative_id, name) VALUES ('1.1.01', 'kdp-real', 'Kas'); -- ✅
```

## Migration Strategy

### For fresh installs (new DB)
- `CREATE TABLE` statements define the composite PKs directly.
- No migration needed.

### For existing installs (old DB)
SQLite cannot `ALTER TABLE` to change primary keys. The safe migration path:

1. **(Dev only)**: Delete the database file. Fresh `initDb()` creates the correct schema.
2. **(Production)**: A schema version check + table rebuild migration:
   ```sql
   -- 1. Check version in _meta table
   -- 2. If version < 2:
   --    a. CREATE TABLE coa_accounts_v2 (code TEXT, cooperative_id TEXT, ..., PRIMARY KEY (code, cooperative_id))
   --    b. INSERT INTO coa_accounts_v2 SELECT * FROM coa_accounts
   --    c. DROP TABLE coa_accounts
   --    d. ALTER TABLE coa_accounts_v2 RENAME TO coa_accounts
   -- 3. Set version = 2
   ```

## Updated Schema (key tables only)

```sql
-- Cooperative accounts: one set per coop
CREATE TABLE coa_accounts (
  code TEXT NOT NULL,
  cooperative_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('aset','kewajiban','ekuitas','pendapatan','beban')),
  category TEXT,
  normal_balance TEXT NOT NULL CHECK(normal_balance IN ('debit','kredit')),
  balance REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  parent_code TEXT,
  sort_order INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (code, cooperative_id),
  FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
);

-- Business categories: one set per coop
CREATE TABLE categories (
  id TEXT NOT NULL,
  cooperative_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  PRIMARY KEY (id, cooperative_id),
  FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
);

-- Inventory: items belong to a coop
CREATE TABLE inventory_items (
  id TEXT NOT NULL,
  cooperative_id TEXT NOT NULL DEFAULT 'kdp-001',
  name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  stock_quantity REAL DEFAULT 0,
  unit TEXT NOT NULL,
  cost_price REAL DEFAULT 0,
  selling_price REAL DEFAULT 0,
  zone_id TEXT,
  shelf_row INTEGER,
  shelf_col INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (id, cooperative_id),
  FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id),
  FOREIGN KEY (category_id, cooperative_id) REFERENCES categories(id, cooperative_id)
);
```

## Foreign Key Propagation

When `categories` has a composite PK, any table referencing it must also include `cooperative_id` in the FK:

```sql
-- BEFORE
FOREIGN KEY (category_id) REFERENCES categories(id)

-- AFTER
FOREIGN KEY (category_id, cooperative_id) REFERENCES categories(id, cooperative_id)
```

Tables affected:
- `inventory_items` → `categories`
- `sales_transactions` → `categories`
- `journal_lines` → `coa_accounts`

## Query Pattern

All queries on tenant-scoped tables must filter by `cooperative_id`:

```ts
// ✅ Correct
db.select("SELECT * FROM coa_accounts WHERE cooperative_id = ?", [activeCoopId]);

// ❌ Wrong — returns all coops' data mixed together
db.select("SELECT * FROM coa_accounts");
```

The `activeCoopId` comes from `localStorage.getItem("pakde-active-profile-id")`.

## Database Access — Colocation Principle

Database queries live **inside the feature module** that owns them, not in a global `db/` helpers folder.

### Why colocation?

- Feature modules are self-contained — no cross-feature imports for DB access
- When a feature is removed, its queries are removed with it
- The `db/` folder at root stays focused on schema (`init.ts`, `seed-demo.ts`)

### Current feature helpers

| Feature | Helper file | Exports |
|---|---|---|
| ProfileSelect | `cooperativeDb.ts` | `createCooperative(data)` |
| Settings | `settingsDb.ts` | `updateCooperative(id, data)` |

### ESLint enforcement

`.tsx` files are forbidden from importing `getDb` directly:

```json
{
  "no-restricted-imports": [
    "error",
    {
      "paths": [
        {
          "name": "@/db",
          "importNames": ["getDb"],
          "message": "Use a feature-local db helper instead of raw getDb() in .tsx files."
        }
      ]
    }
  ]
}
```

### Pattern for new features

```
src/features/YourFeature/
├── YourFeature.tsx        # UI only — imports data from ./yourFeatureDb
└── yourFeatureDb.ts       # DB queries — imports getDb, exports type-safe functions
```
