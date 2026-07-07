# Implementation: Card Height, Demo Content, Coop Age & Category

## 1. Card Height Matching

**Root cause**: Left card has an extra `<p>` with "Sudah punya akun? Masuk" that pushes its bottom edge lower than the right card, even with `min-h-[260px]`.

**Fix**: The right card's action button should use `mt-auto` to sit at the bottom, mirroring the left card's login link. Both cards already use `flex flex-col justify-between`.

**Changes**:
- `ProfileSelect.tsx`: Wrap right card's action button in a `<div className="mt-auto">` so it pushes to the bottom, matching the left card's layout.

---

## 2. Demo Card Content Cleanup

**Root cause**: The "Coba Demo" card shows `"50 anggota · 3 unit usaha · 16 modul siap dijelajahi"` in `DEMO_DESC`. These details belong in the tier selection cards below, not the top-level demo card.

**Fix**: Replace `DEMO_DESC` with a shorter, tier-agnostic description like `"Jelajahi koperasi virtual dengan data dan modul lengkap — pilih level yang sesuai."`

**Changes**:
- `ProfileSelect.tsx`: Update `DEMO_DESC` constant.

---

## 3. Coop Founding Date & Age

**Schema addition**: Add `founded_date TEXT` column to `cooperatives` table via `ensureColumn()` in `initDb()`.

```sql
ALTER TABLE cooperatives ADD COLUMN founded_date TEXT;
```

**Frontend**: Add a computed `age` field derived from `new Date().getFullYear() - new Date(founded_date).getFullYear()`. Display as `"5 tahun"` in cooperative cards and profiles.

**Seed data**: Demo cooperative (kdp-001) gets `founded_date: "2020-01-15"`.

**Create dialog**: Add an optional `founded_date` input (date picker) to `CreateProfileDialog`.

**Changes**:
- `src/db/init.ts`: Add `ensureColumn("cooperatives", "founded_date TEXT", "founded_date")`
- `src/db/init.ts`: Update `DEMO_COOP` to include `founded_date`
- `src/types.ts`: Add `founded_date` to `CooperativeProfile` type
- `ProfileSelect.tsx`: Show age in coop cards
- `CreateProfileDialog.tsx`: Add `founded_date` field

---

## 4. Cooperative Category per UU 25/1992

### Legal Classification (UU No. 25 Tahun 1992)

The law classifies cooperatives along multiple axes. We store the primary classification in a `category` column.

#### A. By Function (Jenis menurut fungsinya)

| Value | Label | Description |
|---|---|---|
| `konsumsi` | Koperasi Konsumen | Provides daily necessities to members |
| `pemasaran` | Koperasi Pemasaran | Markets members' products collectively |
| `produksi` | Koperasi Produsen | Produces goods; members are workers |
| `jasa` | Koperasi Jasa | Provides services (savings/loans, insurance, transport) |
| `serba_usaha` | Koperasi Serba Usaha | Multi-purpose cooperative |

#### B. By Scale (already exists as `level`)

| Value | Label |
|---|---|
| `desa` | Tingkat Desa |
| `kecamatan` | Tingkat Kecamatan |
| `kabupaten` | Tingkat Kabupaten |
| `provinsi` | Tingkat Provinsi |
| `nasional` | Tingkat Nasional |

#### C. By Membership Type

| Value | Label |
|---|---|
| `primer` | Primer (min 20 individuals) |
| `sekunder` | Sekunder (federation of cooperatives) |

### Schema Addition

Add `category TEXT` column to `cooperatives`:

```sql
ALTER TABLE cooperatives ADD COLUMN category TEXT;
```

### Implementation

1. **Schema migration** — `initDb()`:
   ```ts
   await ensureColumn("cooperatives", "category TEXT", "category");
   await ensureColumn("cooperatives", "founded_date TEXT", "founded_date");
   ```

2. **Type update** — `src/types.ts`:
   ```ts
   interface CooperativeProfile {
     // ...existing fields...
     category?: string;
     founded_date?: string;
   }
   ```

3. **Seed data** — `src/db/init.ts`:
   ```ts
   const DEMO_COOP = {
     // ...existing fields...
     category: "serba_usaha",
     founded_date: "2020-01-15",
   };
   ```

4. **Form field** — `CreateProfileDialog.tsx`:
   - Add `category` select dropdown with UU 25/1992 options
   - Add `founded_date` date input

5. **Display** — `ProfileSelect.tsx` coop cards:
   - Show `category` as a colored tag (e.g., "Serba Usaha" in amber badge)
   - Show age as `"5 tahun"` below the coop name

6. **Demo tiers** — update tier cards:
   - Each demo tier gets a `category` and `founded_date`
   - The `seedDemoCooperativeAtLevel` inserts these fields
