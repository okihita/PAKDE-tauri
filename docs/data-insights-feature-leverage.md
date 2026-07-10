# PAKDE — Data Insights & Feature Leverage Report

> Deep, multi-dimensional analysis of `hackathon_data` (the live *Koperasi Desa Merah Putih* dataset) and a prioritized set of 30 product features ranked by **leverage** — strategic impact × user value ÷ implementation complexity.
>
> Scope: 1,026 cooperatives · 74,269 members · 126,725 savings records (local export) · plus governance, commerce, and service-application funnels.
> Every figure below is computed directly from the CSVs, not inferred from the schema.

---

## Part A — Deep, Multi-Dimensional Analysis

### A1. The signature finding: mass registration, near-zero activation

- **52% of all members (38,702) were registered in a single month — Aug 2025** — the top-down government launch. This is a *push*, not a *pull*.
- Of those Aug-2025 members, **only 19.7% have ever paid a single savings installment**.
- Platform-wide, **only 18% of members (13,367 of 74,269) have ever made one paid deposit.** The other 82% are names in a database.
- **745 of the 1,012 coops that have members have ZERO paid savings.** The central financial mechanism of a cooperative — member capital — is dead in ~74% of coops.

> **Latent need:** These aren't cooperatives yet; they're membership lists. The #1 job-to-be-done is *converting a roster into a savings habit*, not adding more features.

### A2. Engagement is already decaying (the streak is breaking)

Paid-savings activity by month (`dibayar_pada`): **Dec 8.8k → Jan 11.2k (peak) → Feb 7.3k → Mar 6.2k → Apr 8.5k → May 6.5k → Jun 5.6k.** After the January peak, momentum is bleeding out — textbook novelty-decay, exactly the problem PAKDE's Duolingo-style streaks exist to fight, but the loop isn't closed yet.

### A3. The most counter-intuitive result: the app account isn't changing behavior

- Members **with** an in-app account save at **16.4%**; members **without** save at **18.5%**. Having the app account correlates with *slightly worse* savings behavior.
- Only **24% of members have an app account**; **111 coops have 0% app adoption.**

> **Insight:** Digital *access* ≠ digital *habit*. Onboarding an account is being treated as the finish line when it's the starting line. The activation gap is behavioral, not technical.

### A4. Governance is quietly lapsing

- **Only 33.2% of coops (341) have any RAT** (the legally mandatory annual meeting). **77 recorded RATs had 0 attendees.**
- **18.8% of coops that reported show a net loss** (negative SHU); median SHU is **0**.
- **48 coops have board terms that already expired** (`periode_selesai` < snapshot date) — silent compliance failures nobody is watching.
- Female members = **51.3%**, but female board members = only **30.2%**. Leadership doesn't mirror membership.

### A5. Every high-value service funnel is jammed

| Service | Volume | State |
|---|---|---|
| **Financing** (`pembiayaan`) | 118 | **1 verified**, 71 stuck in Draft, **85 with tenor=0** (incomplete form); median ask **Rp522M** |
| **Domain** | 1,039 | **100% "Not Verified"** — nobody finishes |
| **Bank account** | 652 | 651 stuck "Requested" |
| **Partnership** (`kemitraan`) | 3,254 | 533 rejected — **238 (45% of rejections) for "zonasi tidak sesuai"** (zoning conflict they couldn't foresee) |

> **Latent need:** The costliest, most transformative services (capital, banking, agent partnerships) have the worst completion. Effort is wasted on applications doomed by a rule (zoning) or an unfilled field (tenor=0).

### A6. Commerce exists on paper, not on shelves

- **640 coops registered 13,974 products, but 86.4% have ZERO stock.** The catalog is aspirational; shelves are empty.
- **Median markup is 2.3%** (`harga_jual` vs `harga_beli`) — economically unsurvivable; strong evidence of *mispricing*, not thin margins by design.
- **All 1,000 sales are Cash, all "Paid," all clustered in the final days (July 2026).** POS is brand-new, and the credit/**Yarnen** flow (a headline feature for farmers) has **zero** usage.
- **487 of 1,942 outlets are "Belum Aktif"; 307 outlets (16%) have no internet, 64 no electricity** — this *validates offline-first* and reveals the real operating environment.

### A7. Untapped economic potential vs. generic copy-paste businesses

- Villages hold enormous documented potential: **4,913 commodities, median value Rp100M each** (Padi, Jagung, Ayam, Sapi, Perikanan, Cabai…).
- Yet coops register a **median of 28 KBLI business codes each** — cold storage, apothecary, machine rental, pharmacy — and operate almost none. Aspiration (28 businesses) vs reality (86% empty shelves).
- **Savings inequality: the top 10% of coops hold 52% of all savings.** A handful function; the long tail is hollow.

### A8. Data entropy makes the platform's own vision untrustworthy

- **1,344 distinct spellings of `pekerjaan`** (`IRT`, `Ibu Rumah Tangga`, `MENGURUS RUMAH TANGGA`…), **192 job titles**, **34 bank spellings** (`BRI` vs `Bank BRI (Bank Rakyat Indonesia)`, `Mandiri` vs `MANDIRI`).
- Capital is micro: **median `modal_awal` = Rp2.31M (~$140).**

> **Insight:** The federated national dashboard (the endgame vision) will be built on unusable, duplicate-ridden free text unless input is constrained at the edge.

### Behavioral archetypes that emerge

1. **The Ghost Roster coop (~74%)** — members exist, savings don't.
2. **The Flickering coop** — active in Jan, fading by June.
3. **The Aspirational coop** — 28 registered businesses, 100+ products, 0 stock.
4. **The Stuck Applicant** — repeatedly starts financing/domain/bank forms, never finishes.
5. **The Silent Lapse** — expired board, no RAT, negative SHU, nobody alerted.

---

## Part B — 30 Features, Ranked by Leverage

**Leverage = (Strategic Impact × User Value) ÷ Implementation Complexity.** Ranked highest-leverage first. `I` = Impact, `C` = Complexity (1–5). Each feature maps to a finding above.

### Tier 1 — Maximum leverage (cheap, attacks the core pathology)

| # | Feature | Attacks | I/C |
|---|---------|---------|-----|
| 1 | **Simpanan Streak Engine + "Streak Freeze"** — offline daily/weekly savings streaks per member with a grace-token freeze (Duolingo mechanic) to fight the Jan→Jun decay and 57% unpaid rate. The single highest-leverage move; savings *is* the cooperative. | A1, A2 | I5 / C2 |
| 2 | **Ghost-Member Activation Radar** — auto-flags the 82% who never saved and spawns a one-tap "First Rupiah" quest for the *Ketua* to collect their first deposit. Turns rosters into cooperatives. | A1, A3 | I5 / C2 |
| 3 | **Collection Roster (printable/offline)** — since 76% of members have no app account, generate a per-street collection sheet + WhatsApp-ready reminder text the *Ketua* carries door-to-door. Meets the phone-less user. | A3 | I5 / C2 |
| 4 | **Smart-Pricing Coach with Margin Guardrail** — POS warns/blocks when markup nears the observed 2.3% median and suggests a healthy markup from `harga_beli`. Protects solvency directly. | A6 | I5 / C2 |
| 5 | **Controlled-Vocabulary Autocomplete + Fuzzy Dedup** — replace free-text `pekerjaan`/`bank`/`jabatan` (1,344/34/192 spellings) with typeahead dictionaries + duplicate detection. Makes the federated dashboard possible. | A8 | I4 / C2 |
| 6 | **Board-Term & Document Expiry Watchdog** — countdown quests for the 48 expired boards and 114 expired documents; converts invisible legal lapses into a "Re-elect Your Party" quest. | A4, A8 | I4 / C1 |

### Tier 2 — High leverage (moderate build, high strategic value)

| # | Feature | Attacks | I/C |
|---|---------|---------|-----|
| 7 | **RAT-in-a-Box** — auto-generate the `laporan_posisi_keuangan` / `laporan_hasil_usaha` JSON from the local ledger so the 685 non-compliant coops produce a valid RAT packet in one session. | A4 | I5 / C3 |
| 8 | **Financing Readiness Score + Auto-Form-Filler** — pre-fills `pembiayaan`, blocks submission when `tenor=0` (the 85 broken forms), shows a readiness gauge before applying. Unjams the most-broken, highest-value funnel. | A5 | I5 / C3 |
| 9 | **Partnership Zoning Pre-Check** — a local ruleset that warns "this LPG/BRILink slot is likely zoned-out" *before* applying, killing the 238 predictable "zonasi tidak sesuai" rejections. | A5 | I4 / C2 |
| 10 | **Empty-Shelf Alarm + Restock Quest** — flags the 86.4% zero-stock inventory; each becomes a "Stock this shelf" quest wired to the Konva floor-plan bins. | A6 | I4 / C2 |
| 11 | **Village Commodity → Business Wizard** — matches documented commodities (Padi, Sapi, Perikanan; median Rp100M each) to a recommended business unit, replacing generic 28-KBLI copy-paste. | A7 | I5 / C3 |
| 12 | **Cooperative RAG Health Auto-Grade** — computes the Red/Amber/Green government grade locally and shows the one next action to move up a band. Operationalizes *Pembinaan & Pengawasan* as a live badge. | A1–A7 | I4 / C2 |
| 13 | **Yarnen Credit Ledger** — activate the unused credit flow: buy fertilizer on credit, repay after harvest, auto-journaled. Fits the real agrarian cash cycle. | A6 | I4 / C3 |
| 14 | **SHU "Divide the Loot" Simulator** — interactive SHU distribution respecting the 40%-to-members rule, showing each member's payout — a tangible reason to save. | A1, A4 | I4 / C2 |
| 15 | **Daily Cash-Close Ritual** — a 3-minute end-of-day reconciliation quest (drawer vs POS) with an 8-bit "books balanced" chime — the habit that prevents unaccounted cash. | A6 | I4 / C2 |

### Tier 3 — Solid leverage (differentiators / vision-enablers)

| # | Feature | Attacks | I/C |
|---|---------|---------|-----|
| 16 | **Anonymized Peer Benchmark** — "your coop vs. district median" percentile on savings/RAT/sales via federated aggregates, no PII. Social proof for flickering coops. | A7 | I4 / C3 |
| 17 | **Predictive Dormancy Alert** — trend detector flags a coop sliding toward the decay curve (2+ months declining deposits) and fires a rescue quest before it flatlines. | A2 | I4 / C3 |
| 18 | **Digital Member Passbook (QR)** — printable/QR passbook so the phone-less 76% can *see* their savings grow — the emotional receipt that builds habit. | A3 | I3 / C2 |
| 19 | **Gender-Inclusion Nudge** — surfaces the 51% female / 30% board gap as a "Balance Your Party" governance quest at re-election. Cheap, mission-aligned, grant-friendly. | A4 | I3 / C2 |
| 20 | **Compliance Calendar Autopilot** — one timeline stitching RAT, annual report, board terms, and doc renewals into scheduled quests. The "never miss a deadline" spine. | A4, A5 | I4 / C3 |
| 21 | **Multi-Coop Pendamping Console** — a triage view for field *pendamping* over their portfolio's weakest coops. Scales human support. | A5 | I4 / C3 |
| 22 | **Bank-Account Application Tracker** — status tracker + document checklist for the 651 stuck "Requested" bank applications, with turn-based reminders. | A5 | I3 / C2 |
| 23 | **Simpanan Sukarela Campaign Kit** — Sukarela is 80% unpaid; a themed savings-drive tool (goal thermometer + member leaderboard) that gamifies voluntary savings. | A1 | I3 / C2 |
| 24 | **Barcode-Scan + Shared Price Catalog** — scan-to-add products, seeded by an offline reference catalog of common sembako/LPG SKUs and typical prices. | A6 | I3 / C3 |
| 25 | **Paper/Excel Migration OCR Importer** — a photo-to-ledger importer to bring legacy members/savings in fast — the on-ramp for the 745 empty coops. | A1 | I4 / C4 |
| 26 | **Voice & Photo Low-Literacy Input** — voice-note a sale, snap a receipt; addresses the non-accountant persona directly. High delight, higher build. | persona | I4 / C4 |
| 27 | **Cash-Flow Forecaster for Micro-Capital** — with median capital Rp2.31M, a 30-day runway projector warns "you can't restock next week" before insolvency. | A8 | I4 / C4 |
| 28 | **Government-Ready Audit Trail Export** — signed, tamper-evident activity export (via the planned HMAC/replay layer) for supervision — turns oversight into a one-click submission. | A4 | I3 / C3 |
| 29 | **Conflict-Free Offline Sync (edge merge)** — CRDT-style merge so multiple staff transact offline and reconcile — hardens offline-first for the 16% no-internet outlets. | A6 | I4 / C5 |
| 30 | **Federated National Impact Dashboard** — the endgame: anonymized aggregates rolling up to a live national RAG map. Highest ceiling, but only trustworthy *after* #5, #12, and #28 exist — hence lowest leverage today. | A7 | I5 / C5 |

---

## How to read this ranking

The top features (#1–#6) share a pattern: they are **cheap, edge-deployable behavior-change loops** that attack the platform's existential problem — **membership without activation** (A1) and **decaying engagement** (A2) — rather than adding new modules. The data confirms PAKDE's thesis ("cooperatives don't need more features; they need direction") is *correct*; the gap is that the savings-habit loop and the data-quality foundation aren't closed yet. The most ambitious feature (the national dashboard, #30) is ranked last on purpose: high impact, but low leverage *now* because A8 shows it would be built on untrustworthy data.

---

*Generated from `hackathon_data` snapshot 2026-07-10. Figures are reproducible from the raw CSVs.*
