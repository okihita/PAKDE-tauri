# Wilayah Integration — Indonesian Administrative Regions

## Source

[cahyadsn/wilayah](https://github.com/cahyadsn/wilayah) — MIT license. 38 provinces, 514 regencies/cities, 7,285 districts, 84,968 villages. Based on Kepmendagri No 300.2.2-2430 Tahun 2025.

## Schema

Three read-only reference tables imported at `initDb()` time:

```sql
CREATE TABLE IF NOT EXISTS wilayah_provinces (
  code TEXT PRIMARY KEY,     -- 2-digit: "35"
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wilayah_regencies (
  code TEXT PRIMARY KEY,     -- 4-digit: "35.01"
  province_code TEXT NOT NULL REFERENCES wilayah_provinces(code),
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wilayah_districts (
  code TEXT PRIMARY KEY,     -- 6-digit: "35.01.04"
  regency_code TEXT NOT NULL REFERENCES wilayah_regencies(code),
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wilayah_villages (
  code TEXT PRIMARY KEY,     -- 10-digit: "35.01.04.1001"
  district_code TEXT NOT NULL REFERENCES wilayah_districts(code),
  name TEXT NOT NULL
);
```

## Data Flow

```
cahyadsn/wilayah (MySQL dump)
  → sed convert to SQLite
  → bundled as src-tauri/resources/wilayah.sqlite (prebuilt)
  → initDb() loads if wilayah_villages is empty
```

The prebuilt SQLite file ships with the app (~1.5 MB). On first `initDb()`, we `ATTACH` it and copy the data into the main DB. This avoids slow parsing of 85k INSERT statements.

## First Feature: Village Auto-Complete

**Use case:** User creates a new cooperative in `CreateProfileDialog`. They need to fill province, regency, district, and village.

### UX Design

```
┌──────────────────────────────────────┐
│  Provinsi                            │
│  ┌────────────────────────────────┐  │
│  │ <type to search...>            │  │  ← combobox, filters as you type
│  │ Jawa Timur                     │  │
│  │ Jawa Tengah                    │  │
│  │ Kalimantan Timur               │  │
│  └────────────────────────────────┘  │
│                                      │
│  Kabupaten / Kota                    │
│  ┌────────────────────────────────┐  │
│  │ Mojokerto                      │  │  ← filtered by selected province
│  └────────────────────────────────┘  │
│                                      │
│  Kecamatan                           │
│  ┌────────────────────────────────┐  │
│  │ Jetis                           │  │  ← filtered by selected regency
│  └────────────────────────────────┘  │
│                                      │
│  Desa / Kelurahan                    │
│  ┌────────────────────────────────┐  │
│  │ Sukamaju, Kec. Jetis           │  │  ← shows disambiguation context
│  │ Sukamaju, Kec. Gondang         │  │
│  │ Sukamaju, Kec. Pacet           │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### Handling Collisions

There are ~85k villages but only ~40k unique names. "Sukamaju" appears in 100+ districts. The auto-complete shows:

```
Sukamaju, Kec. Jetis, Kab. Mojokerto
Sukamaju, Kec. Gondang, Kab. Mojokerto
Sukamaju, Kec. Pacet, Kab. Pacitan
...
```

Three approaches combined:

1. **Cascading filters** — select province → regency narrows, regency → district narrows. This is the primary path for users who know the hierarchy.

2. **Context labels** — village search results show `{village}, Kec. {district}, Kab. {regency}`. No wasted space with province since it's already filtered by the current selection.

3. **Direct village search** — user can type any village name and see all matches with full context, then click to auto-fill the entire hierarchy upward.

### Implementation

```
src/features/System/ProfileSelect/
├── RegionPicker.tsx     ← new: cascading combobox component
├── wilayahDb.ts         ← new: query helpers for wilayah tables
├── CreateProfileDialog.tsx  ← modified: uses RegionPicker
```

**RegionPicker component:**
- Takes `onChange: (region: { code, province, regency, district, village }) => void`
- Four cascading `Combobox` inputs (custom, not shadcn — we don't have one)
- Each input filters the next: province selection resets regency/district/village
- Village input disambiguates with district/regency context

**wilayahDb.ts queries:**

```ts
searchProvinces(query: string): Promise<WilayahRow[]>
searchRegencies(provinceCode: string, query: string): Promise<WilayahRow[]>
searchDistricts(regencyCode: string, query: string): Promise<WilayahRow[]>
searchVillages(districtCode?: string, query: string): Promise<WilayahRow[]>
  // If districtCode is omitted, searches across all districts
  // Returns village name + district name + regency name for context
```

## Migration from Current Fields

Currently `cooperatives` has:
- `province TEXT` — "Jawa Timur"
- `regency TEXT` — "Mojokerto"
- `village TEXT` — "Desa Kedungpring"

After integration, ADD:
- `province_code TEXT` — "35"
- `regency_code TEXT` — "35.16"
- `district_code TEXT` — "35.16.08"
- `village_code TEXT` — "35.16.08.2005"

Keep the TEXT columns for backward compat and display. The CODE columns are the canonical reference.

## Size Budget

| Item | Size |
|---|---|
| `wilayah_provinces` | ~1 KB |
| `wilayah_regencies` | ~15 KB |
| `wilayah_districts` | ~200 KB |
| `wilayah_villages` | ~2 MB |
| Prebuilt SQLite | ~1.5 MB |

Bundled in `src-tauri/resources/` — included in the app bundle with zero network cost.
