# Hackathon Dataset — Data-Driven Insights Report

> Source: `hackathon_data/` CSV exports (the SQL dump, treated as real production data)
> Analysis date: 2026-07-10 · Method: full CSV → in-memory SQLite, raw aggregations (no sampling)
> Scope: 27 tables, **547,895 rows** across **1,026 village cooperatives (koperasi)**

---

## 0. Executive Summary

The dataset describes a national platform for **Indonesian village cooperatives (Koperasi Desa / KDKM)**. Every cooperative is tied 1:1 to one village, and the cooperative is the hub of a rich web of members, savings, management, business lines, outlets, assets, commerce, and platform service requests.

**Headline facts (computed from the data, not estimated):**

- **1,026 cooperatives**, one per village, spread across **38 provinces / 316 kab-kota / 773 kecamatan** (remarkably balanced: ~27 coops per province).
- **74,269 members** (1,012 coops have members; 14 have none), averaging **73 members/coop** (median 41, max 2,194).
- **Financial depth is shallow:** only **267 coops (26%)** and **23.3% of members** have any recorded savings; paid-in savings total just **~IDR 2.11 B (~USD 132k)**.
- **Governance gap:** only **341 coops (33.2%)** have a recorded RAT (annual member meeting) for fiscal year 2025.
- **Digital adoption gap:** only **23.7% of members (17,624 / 74,269)** have a platform account.
- **Process funnels are stalling:** domain verification (1,039 apps) and bank-account requests (652) are **100% unprocessed**; financing (118) has **only 1 verified, 0 approved**. Only **kemitraan (partnership)** shows healthy throughput (83% positive).
- **Data-quality red flags:** extreme numeric outliers in a few financial fields, and heavy missingness in occupation (48%), management education (73%), and village-fund (252 villages).

---

## 1. Cooperative Population & Geography

| Metric | Value |
|---|---|
| Cooperatives (`profil_koperasi`) | 1,026 |
| All `status_registrasi` = Approved | 1,026 (100%) |
| All `bentuk_koperasi` = Primer | 1,026 (100%) |
| `kategori_usaha` = Koperasi | 990 (36 blank) |
| Villages (`referensi_wilayah`) | 1,026 (1:1 with coops) |
| Provinces / kab-kota / kecamatan | 38 / 316 / 773 |
| `modal_awal` parsed | n=1,026 · min 50k · median 2.31M · mean 8.20M · max 1.70B IDR |

- **Even national coverage:** each of the 38 provinces carries ~27 cooperatives (top provinces: Sumatera Utara, Sumatera Selatan, Sumatera Barat, Sulawesi* all = 27). This looks like a deliberately balanced national rollout.
- `modal_awal` (declared starting capital) is right-skewed: median ~2.3M IDR (~$144) vs mean ~8.2M — a long tail of larger coops (max 1.7B).

---

## 2. Membership, Demographics & Inclusion

**Members (`anggota_koperasi`):** 74,269 total · 1,012 coops represented.

- **Gender:** 51.3% female (38,069) / 48.7% male (36,200) — near gender balance at membership level.
- **Platform account:** only **17,624 "Punya Akun" (23.7%)** vs **56,645 "Tidak Punya Akun" (76.3%)** → the single biggest engagement gap.
- **Membership status:** 66,302 Approved / 7,967 Requested.
- **Occupation (`pekerjaan`):** **48% blank**. Among filled values: *Mengurus Rumah Tangga / IRT / Ibu Rumah Tangga* (≈8.8k), *Wiraswasta* (≈4.1k), *Petani/Pekebun* (≈4.1k), *Karyawan Swasta* (≈2.8k) dominate — a rural, household-economy membership base.
- **Members per coop:** min 1 · median 41 · mean 73.4 · max 2,194 (one outlier mega-coop).
- **14 cooperatives have zero members** — likely shell/newly-registered entities.

**Management (`pengurus_koperasi`):** 8,482 officers across all 1,026 coops (avg ~8/coop).

- **Gender in leadership:** only **30.2% female (2,558)** vs 69.8% male (5,924) — a clear **leadership gender gap** vs balanced membership.
- **Education (`status_pendidikan`):** **73% blank (6,211)**. Among filled: SMA 1,090 > S1 933 > S2 94 > D3 77.
- **Roles:** Anggota 1,691, Ketua 1,591, Bendahara 899, Sekretaris 868, Wakil Ketua Bidang Usaha 818, Wakil Ketua Bidang Anggota 723, Anggota Pengawas 214.

**Employees (`karyawan_koperasi`):** 942 total, only **315 coops** employ staff. Gender 511 M / 431 F.

---

## 3. Financial Inclusion — Savings (`simpanan_anggota`)

- **126,725 savings records.** Of these **54,707 are PAID** (with an amount) and **72,018 are UNPAID** (scheduled/upcoming, amount = 0).
- **Total paid-in savings = IDR 2,112,677,722 (~USD 132,042).**
- **Penetration is low:** only **299 coops (29%)** appear in the table, **267 (26%)** have any *paid* savings; only **17,327 members (23.3%)** have a savings record at all.
- **Per-member deposits:** median IDR 75,000, mean IDR 121,930, max IDR 22,000,000.
- **Per-coop paid savings:** median IDR 1.92M, mean IDR 7.07M, max IDR 170.5M.
- **Type mix:** dominated by *Simpanan Pokok* (14,802) and monthly *Simpanan Wajib* (Jan 2025 → 2027 schedules present), plus *Simpanan Sukarela* voluntary top-ups.
- **Date span (`dibayar_pada`):** 2025-12-19 → 2026-07-08 — active, ongoing collection.

**Interpretation:** despite 74k members, real financial throughput is thin and concentrated; most members are recorded but not yet financially active. This is the core inclusion opportunity.

---

## 4. Cooperative Health — Capital, Assets, Governance

**Capital (`modal_koperasi`):** only **26 records** for the entire platform (total ~IDR 18.4B, median 21M, max 10B). **Severely under-reported** — cannot be used for capital-adequacy KPIs.

**Assets (`aset_koperasi`):** 924 assets across **923 coops**.
- Type: Barang Milik Desa (BMDes) 375, BMD (Barang Milik Daerah) 190, Hibah 103, BMN 40, Milik Sendiri 22.
- Status: **Terverifikasi 477 (52%)**, Sedang Diverifikasi 307, Tidak Ada Lahan 123, Dipertimbangkan 10, Perlu Verifikasi Lanjutan 6, Ditolak 1.
- ~44% of assets are still unverified or landless → operational maturity is partial.

**Outlets / Gerai (`gerai_koperasi`):** 1,942 outlets; **791 coops (77%)** have ≥1.
- Status: **Aktif 1,455 (75%)**, Belum Aktif 487.
- Internet: Ada 1,579 / Tidak Ada 307 / blank 56. Electricity: Ada 1,822 / Tidak Ada 64.
- Internet access missing in ~16% of outlets is a digital-service constraint.

**Governance — RAT (`rat_koperasi`):** **341 records, all fiscal year 2025, 341 distinct coops → only 33.2% of coops held/recorded a RAT.**
- Status: Verified 289, Reported 32, Drafted 13, Rejected 7.
- **Two-thirds of cooperatives have no recorded annual meeting** — a major compliance/governance gap to surface in any dashboard.

**Business lines (`kbli_koperasi`):** 35,591 records, **all 1,026 coops** classified (mean 34.7/coop, median 28, max 199).
- Top KBLI: Unit Simpan Pinjam Koperasi Primer (924), Ritel sembako/tradisional (906), Apotek/obat (805/736/712), Cold Storage (763), Ritel mesin (710).
- **Licensing data missing:** only **51 of 35,591 (0.14%)** carry `tipe_izin_usaha` → business-license tracking is effectively absent.

---

## 5. Commerce & Productivity

- **Products (`produk_koperasi`):** 13,974 SKUs, but only **640 coops** have products → commerce is active in a minority of coops.
- **Inventory (`inventaris_produk`):** 13,974 rows, total stock 101.9M units (median stock 0, mean 7,294; a few very large stock values up to ~100M — likely outliers).
- **Stock-in (`barang_masuk_produk`):** 665 records. **Stock-out (`barang_keluar_produk`):** 884 records, all status `Paid`.
- **Sales (`transaksi_penjualan`):** 1,000 rows (sample, `transaksi_sample_id`), all `Cash`, total **~IDR 11.47B** (~USD 717k), median IDR 195k, max IDR 3.62B. Treat as **directional, not a full ledger**.
- **Implied margin signal:** stock-out value (~IDR 11.1B) vs stock-in cost (~IDR 6.9B) suggests positive gross margin, but stock-in has extreme outliers (max single row 3.65T IDR) that distort totals — verify before quoting absolute margin.

---

## 6. Platform Service Funnels (key operational insight)

| Service | Apps | Distinct coops | Status breakdown | Read |
|---|---:|---:|---|---|
| **Domain** (`pengajuan_domain`) | 1,039 | 1,025 | 100% *Not Verified* / *Waiting* | **Loop never closes** |
| **Bank account** (`pengajuan_rekening_bank`) | 652 | 376 | Requested 651 / Processed 1 | **Effectively no approvals** |
| **Financing** (`pengajuan_pembiayaan`) | 118 | 109 | Draft 71 / Requested 46 / Verified 1 / **Approved 0** | **Pipeline stalled** |
| **Partnership** (`pengajuan_kemitraan`) | 3,254 | 622 | Verified 1,782 / Approved 928 / Rejected 533 / Processed 11 | **Healthy (83% positive)** |

- **Financing demand exists but is unserved:** 101 applications carry amounts (median IDR 3B, total ~IDR 303T including extreme outliers). Only 1 has reached "Verified"; **zero approved** → a clear bottleneck (back-office capacity or policy).
- **Domain & bank-account requests are stuck at intake** — high submission, ~0 fulfillment. Strong candidate for process automation.
- **Partnership is the only mature funnel**, with packages like *Standar*, *Refil Gas*, *Bahan Pokok*, *Beras SPHP*, *PPOB*, *Pupuk* driving adoption.

**Village fund context (`referensi_profil_desa`):** 774 villages report `anggaran_dana_desa` (252 blank); total **~IDR 266.9B**, median **~IDR 352.6M/village (~$22k)**. This is a large latent capital pool that could be linked to coop financing — currently uncaptured.

---

## 7. Regional / Village Economics (`referensi_komoditas_desa`)

- **8,191 commodity records, 1,375 distinct commodities.**
- **Top commodities by village count:** Padi (403), Jagung (394), Ayam (378), Sapi (364), Perikanan (315), Cabai (298), Kambing (285), Pisang (274), Ubi Kayu (259), Bebek (222).
- **Economic potential (`nilai_potensi_desa`):** total ~IDR 2.27e15, but **with extreme outliers** (max 1.2e15 in a single row) — clearly synthetic/noisy; use median/ranking rather than sums.
- **Regional savings leaders (by `dibayar_pada` totals):** Jawa Timur (222.8M), Jawa Barat (210.8M), Bali (206.9M), NTT (117.3M), Lampung (116.9M), Kalimantan Timur (104.0M).

---

## 8. Data-Quality Caveats (read before building KPIs)

1. **No foreign keys** in the source; however referential integrity here is **clean** — 0 orphan `anggota_ref`/`koperasi_ref` records; every village has a coop.
2. **Extreme numeric outliers** in `barang_masuk_produk.total_biaya` (max 3.65T), `referensi_komoditas_desa.nilai_potensi_desa` (max 1.2e15), `pengajuan_pembiayaan.nominal_permohonan` (max 3.2e16). Treat these as unit/data-entry errors; prefer medians and clipping.
3. **Heavy missingness:** `anggota_koperasi.pekerjaan` 48% blank, `pengurus_koperasi.status_pendidikan` 73% blank, `referensi_profil_desa.anggaran_dana_desa` 252 blank, `profil_koperasi.kategori_usaha` 36 blank, `kbli_koperasi.tipe_izin_usaha` 99.86% blank.
4. **Sample tables:** `transaksi_penjualan`, `produk_koperasi`, `rat_koperasi` carry `_sample_id` — confirm whether full or sampled before absolute revenue claims.
5. **Numeric formatting:** Indonesian thousands separators (`.`) and decimals (`,`) require cleaning before `CAST`/aggregation (handled in this analysis).
6. **PII:** `anggota_koperasi`/`pengurus_koperasi`/`karyawan_koperasi` contain NIK, names, phones, emails, KTP files — restrict/ anonymize before any local or shared use.

---

## 9. Recommended Insights to Surface (product/analytics backlog)

1. **Financial-inclusion dashboard:** % members with savings, paid-in savings per coop, savings trend by month — currently only 26% of coops are active.
2. **Governance alert:** 67% of coops lack a RAT record — build a compliance nudge/reminder.
3. **Digital onboarding:** 76% of members have no account — bulk-activation campaign.
4. **Funnel automation:** domain verification & bank-account requests are 100% unprocessed; financing has 0 approvals — prioritize back-office/automation.
5. **Gender-in-leadership:** 30% female managers vs 51% female members — target women-in-leadership programs.
6. **Capital linkage:** connect village funds (~IDR 267B) to coop financing to unblock the stalled pembiayaan pipeline.
7. **Commerce expansion:** only 640/1,026 coops sell products — onboard the remaining ~386.
8. **Data-quality fixes:** enforce license (`tipe_izin_usaha`), occupation, education, and village-fund capture at input.

---

*Numbers in this report were computed directly from the CSV dump (full tables, no sampling) on 2026-07-10. Where values are synthetic/noisy (outliers, blanks), this is flagged inline.*
