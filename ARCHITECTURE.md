# PAKDE Nationwide Architecture Plan

## 1. Current State

PAKDE is a standalone desktop app per cooperative. Each node runs its own SQLite database. The "Sync" tab is purely mock — it simulates a 3-second delay and writes a local history row. **No data ever leaves the machine.**

## 2. Target Architecture: Federated Node Network

```
┌───────────────────────────────────────────────────────────────┐
│                    NATIONAL DASHBOARD                          │
│           (Web app: aggregate analytics across all nodes)       │
│            Hosted on a small VPS ($10-20/mo)                   │
└───────────────────────┬───────────────────────────────────────┘
                        │ HTTPS (REST API)
                        ▼
┌───────────────────────────────────────────────────────────────┐
│                 CENTRAL API SERVER                              │
│  Node.js / Fastify + PostgreSQL                                 │
│  • Cooperative registration & auth                              │
│  • Accepts periodic sync payloads from each node                 │
│  • Computes national aggregates                                  │
│  • Serves the National Dashboard                                │
└──────┬──────────┬──────────┬──────────┬──────────┬────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
   │Kop 1 │  │Kop 2 │  │Kop 3 │  │Kop 4 │  │Kop N │
   │Desa A│  │Desa B│  │Desa C│  │Desa D│  │...   │
   └──────┘  └──────┘  └──────┘  └──────┘  └──────┘
    SQLite     SQLite     SQLite     SQLite     SQLite
    (local)    (local)    (local)    (local)    (local)
```

Each cooperative node keeps its own full SQLite database locally (existing architecture). Additionally, it periodically syncs a lightweight payload to the central API:

**Sync payload (what each node sends):**

```json
{
  "cooperative_id": "kdp-001",
  "api_key": "sk-...",
  "period_end": "2026-07-04T00:00:00Z",
  "health_score": 65,
  "rag_status": "kuning",
  "level_id": "tangguh",
  "total_members": 247,
  "active_members": 221,
  "total_assets": 1250000000,
  "shu_year_to_date": 340000000,
  "total_savings": 780000000,
  "total_outstanding_loans": 420000000,
  "journal_entry_count": 156,
  "sync_audit": [
    { "type": "member", "operation": "create", ... },
    { "type": "journal", "operation": "update", ... }
  ]
}
```

This is a **dual-payload** design:

1. **Encrypted full backup** — the entire local SQLite database, each record encrypted individually with AES-256-GCM, sent as opaque ciphertext blobs. Server cannot read any field. Used for disaster recovery if the PC is stolen or lost.
2. **Public aggregate payload** — derived statistics only (health score, member count, total assets, etc.). No PII. Used for rankings and the National Dashboard.

## 3. Fair Cost Distribution Model

The central server costs money. Here's how to split it fairly:

### Cost Breakdown (Monthly)

| Item | Cost | Share logic |
|---|---|---|
| VPS (2 vCPU, 4GB RAM, 80GB SSD) | ~Rp 243.000/mo | Fixed |
| PostgreSQL managed DB | ~Rp 162.000/mo | Fixed |
| Domain + SSL | ~Rp 16.000/mo | Fixed |
| **Total** | **~Rp 421.000/mo (~Rp 5.000.000/thn)** | |

### Three Tier Models to Consider

#### Option A: Flat Per-Node Fee (Simplest)

| Tier | Monthly Fee | Covers |
|---|---|---|
| per cooperative | **Rp 32.000/mo** | 1 API key, standard sync, National Dashboard access |

At Rp 32.000/mo per node with 15 nodes = Rp 480.000/mo (covers costs + small buffer). At 200 nodes = Rp 6.400.000/mo (profit funds development).

**Pros:** Dead simple. Every cooperative pays the same. Easy to invoice. **Cons:** A 20-member village cooperative pays the same as a 500-member city cooperative.

#### Option B: Tiered by Cooperative Size (Fairest)

| Tier | Members | Monthly Fee |
|---|---|---|
| Rintisan (Pioneer) | 1–49 | **Gratis** |
| Pemula (Beginner) | 50–149 | **Rp 16.000/mo** |
| Bertumbuh (Growing) | 150–299 | **Rp 32.000/mo** |
| Produktif (Productive) | 300–499 | **Rp 64.000/mo** |
| Mapan (Established) | 500+ | **Rp 97.000/mo** |

**Pros:** Tracks ability to pay. Smallest coops pay nothing. **Cons:** Requires self-reported member count (verified quarterly).

#### Option C: Hybrid (Recommended)

| Component | Cost |
|---|---|
| **Base fee** (all nodes) | **Rp 16.000/mo** — covers infrastructure |
| **Premium** (optional) | **Rp 81.000/mo** — adds: detailed audit trail, per-member sync, priority support |

Make the base tier cheap enough that every cooperative can afford it (harga segelas kopi). Premium features cover development cost.

### Recommended: Start with Option A (Rp 32.000/mo flat), migrate to Option C when scale demands it.

## 4. Backend Stack

| Component | Choice | Why |
|---|---|---|
| **Runtime** | Node.js 22 LTS | Devs already know TypeScript |
| **Framework** | Fastify | Fast, schema validation, low overhead |
| **Database** | PostgreSQL 17 | Mature, reliable, good aggregate queries |
| **ORM** | Drizzle | Type-safe, lightweight, no magic |
| **Auth** | API keys (Bearer tokens) | Simple, no OAuth complexity needed |
| **Hosting** | Hetzner VPS ($10-15/mo) | Excellent value for EU hosting |
| **Monitoring** | Sentry (free tier) | Error tracking |
| **CI/CD** | GitHub Actions | Already using GitHub |

## 5. National Dashboard

A separate **web app** (not inside the desktop PAKDE) for privacy and simplicity:

| Route | What it shows |
|---|---|
| `/` | Login (API key) |
| `/dashboard` | National aggregate: total coops, total members, avg health score |
| `/dashboard/map` | Geographic heatmap by province/regency |
| `/dashboard/rankings` | Leaderboard of all registered cooperatives |
| `/dashboard/my-coop` | Your cooperative's stats compared to national averages |
| `/admin` | (Admin only) Manage cooperatives, invoices, system health |

The web app is a standalone React SPA (Vite + Tailwind, same stack as the desktop app) served by the same Fastify server.

## 6. Implementation Phases

### Phase 1: Backend Foundation (Est. 2–3 weeks)
- [ ] Fastify server + PostgreSQL schema (cooperatives, sync_payloads, invoices)
- [ ] API key generation + auth middleware
- [ ] POST `/api/v1/sync` endpoint (accepts sync payloads)
- [ ] Basic health check endpoint
- [ ] CI/CD with GitHub Actions

### Phase 2: Desktop Sync (Est. 1–2 weeks)
- [ ] Add `@tauri-apps/plugin-http` permission
- [ ] Replace mock sync in `useSync.ts` with real `fetch()` calls
- [ ] Implement `sync_status` column tracking on members + journal_entries
- [ ] Add cooperative registration flow (get API key → store locally)
- [ ] Offline queueing (retry failed syncs on next app launch)

### Phase 3: National Dashboard (Est. 2–3 weeks)
- [ ] Web app scaffold (React + Vite, separate directory)
- [ ] National aggregate calculation (background cron job)
- [ ] Ranking endpoint + leaderboard UI
- [ ] Per-cooperative detail view
- [ ] Geographic breakdown by province

### Phase 4: Billing & Scaling (Est. 1 week)
- [ ] Invoice generation (monthly per cooperative)
- [ ] Payment integration (Midtrans/Xendit for Indonesia)
- [ ] Usage monitoring dashboard
- [ ] Automated suspension for non-payment

## 7. Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Data sovereignty** | Nodes keep full local DB + encrypted cloud backup | Works offline. Recovery after theft. Server cannot read data. |
| **Sync direction** | Bidirectional (node ⇄ server) | Full encrypted backup from node. Aggregate-only from server to node. |
| **Replication depth** | Full (encrypted) + aggregate (plaintext) | Encrypted blobs for disaster recovery. Aggregates for National Dashboard. Zero PII exposure. |
| **Encryption** | AES-256-GCM client-side, zero-knowledge | Server stores only ciphertext. Recovery via printed passphrase. |
| **API auth** | Pre-shared API keys + HMAC payload signing | API key never transmitted. Payload integrity verified server-side. |
| **National dashboard** | Separate web app | Avoids bloating the desktop app, works on any device |
| **Hosting** | VPS, not serverless | Predictable cost for known number of nodes |

## 8. Cost Distribution Flow

```
Each cooperative pays monthly fee
         │
         ▼
Central server processes payment
  (Midtrans / Xendit)
         │
         ▼
On successful payment:
  • API key remains active
  • Sync endpoint accepts data
  • National Dashboard accessible
         │
         ▼
On failed payment (30 days grace):
  • API key suspended
  • Sync rejected with 402 Payment Required
  • National Dashboard shows read-only historical data
  • Desktop app continues working fully (offline mode)
```

The desktop app never stops working — only cloud sync and the national dashboard are gated behind payment. Local operations are always free.

## 9. Security Architecture

This system handles financial data of village cooperatives across Indonesia — a breach would be catastrophic. Security is not an afterthought.

### 9.1 Threat Model

| Threat | Severity | Mitigation |
|---|---|---|
| Attacker steals API key, impersonates cooperative | **Critical** | Key rotation, IP allowlisting, rate limiting, anomaly detection |
| One cooperative reads another's data | **Critical** | Strict tenant isolation at DB query level, never trust `cooperative_id` from client alone |
| SQL injection via sync payload | **Critical** | Parameterized queries (Drizzle ORM), input validation schema on every endpoint |
| MITM on sync connection | **High** | Enforce TLS 1.3 only, pin certificate on desktop client |
| Desktop app binary tampered with | **High** | Code signing, Tauri updater verifies signatures |
| Attacker reverse-engineers desktop app, extracts hardcoded secrets | **High** | No secrets in client binary — API key is user-provided, stored in OS keychain |
| Replay attack (re-send old sync payload) | **Medium** | Timestamp + nonce per payload, reject payloads older than 5 minutes |
| DDoS on central API | **Medium** | Rate limiting per API key, Cloudflare proxy |
| Insider threat (admin accesses cooperative data) | **Medium** | Audit log on every admin action, read-only dashboards by default |
| PDPA/Privacy Law violation | **Legal** | Full data encrypted client-side. Server stores zero readable PII. Right-to-deletion endpoint. |

### 9.2 API Security

```
Client                           Server
  │                                │
  │  POST /api/v1/sync             │
  │  Authorization: Bearer sk_...  │
  │  Content-Type: application/json│
  │  Body: { signed payload }      │
  │                                │
  │───────────────────────────────>│
  │                                │── Verify TLS termination
  │                                │── Parse & validate API key
  │                                │── Check key not expired/revoked
  │                                │── Rate limit check (100 req/hr per key)
  │                                │── Validate payload schema (Zod)
  │                                │── Verify payload signature (HMAC)
  │                                │── Check timestamp within 5min window
  │                                │── Extract cooperative_id from key, not body
  │                                │── Insert into PostgreSQL (parameterized)
  │                                │── Log to audit trail
  │                                │
  │  200 { accepted: true }       │
  │<───────────────────────────────│
```

#### API Key Design

- **Format:** `sk_live_` prefix + 48 bytes of `crypto.randomBytes()` → base64url → 64-char string
- **Storage (desktop):** OS keychain via `keytar` npm package (macOS Keychain, Windows Credential Manager, Linux libsecret)
- **Storage (server):** Only `bcrypt` hash of the key — never the raw key
- **Rotation:** Keys expire every 90 days. Server sends `X-Key-Expires` header; client auto-requests new key before expiry.
- **Revocation:** Admin can revoke a key instantly. Server checks revocation list on every request (in-memory cache, updated from DB every 60s).

#### Payload Signing

Each sync payload is signed with an HMAC-SHA256 using a **derived key** (not the API key directly):

```typescript
// Client side (desktop app)
const derivedKey = hmac(API_KEY, "pakde-sync-v1");
const signature = hmac(derivedKey, JSON.stringify(payload));
// Send: { payload, signature, timestamp, nonce }
```

```typescript
// Server side
const derivedKey = hmac(knownApiKey, "pakde-sync-v1");
const expected = hmac(derivedKey, JSON.stringify(payload));
if (!timingSafeEqual(expected, received)) reject(401);
```

This ensures:
- The API key itself is never transmitted over the wire
- Payload cannot be tampered with
- Replay is prevented by timestamp + nonce
- Each cooperative has a unique derived key scope

### 9.3 Database Security

```sql
-- Every table has cooperative_id, queried via Row-Level Security (RLS)
CREATE POLICY tenant_isolation ON sync_payloads
  FOR ALL USING (cooperative_id = current_setting('app.current_coop_id'));

-- Health scores are aggregated, never stored per-coop in public views
CREATE MATERIALIZED VIEW national_stats AS
  SELECT AVG(health_score), COUNT(*), SUM(total_members)
  FROM cooperatives WHERE status = 'aktif';
```

- **RLS enabled** on every table — a query can never accidentally leak data across cooperatives
- **No direct DB access** from the internet — only the Fastify worker connects via private network
- **Automated backups** every 6 hours, encrypted at rest (AES-256-GCM)
- **Point-in-time recovery** — 7-day rolling window

### 9.4 Infrastructure Security

| Layer | Measure |
|---|---|
| **Network** | VPS in private VPC. Only ports 443 (HTTPS) and 22 (SSH, key-only) exposed. Fail2ban on SSH. |
| **TLS** | Let's Encrypt with auto-renewal. TLS 1.3 only. CAA DNS record set. |
| **WAF** | Cloudflare proxy (free tier) — DDoS protection, bot mitigation, IP reputation filtering |
| **OS** | Ubuntu 24.04 LTS. Automatic security patches. Unattended-upgrades enabled. |
| **Monitoring** | Uptime Kuma (self-hosted) + Sentry for error tracking. Alerts via Telegram. |
| **Incident response** | Automated key revocation on anomaly detection (>10 failed auth/min). Manual DB freeze switch. |

### 9.5 Desktop App Security (Client Side)

- **API key** stored in OS keychain, not in localStorage or plaintext files
- **No secrets in source code** — the sync endpoint URL is configurable via settings, defaulting to the production server
- **Tauri CSP** restricts the webview to only connect to the sync API and GitHub releases (for updater)
- **Audit trail** — every sync attempt is logged locally with timestamp, status, and error
- **Offline mode** — when unreachable, queue syncs locally and retry on next launch

### 9.6 Compliance: Indonesian PDPA (UU No. 27 Tahun 2022)

| Requirement | How PAKDE meets it |
|---|---|
| **Data minimization (public)** | Only aggregate metrics exposed publicly — encrypted full backup contains PII but server cannot decrypt it |
| **Consent** | Cooperative admin explicitly registers for cloud sync. Receives printed recovery phrase |
| **Right to deletion** | `DELETE /api/v1/cooperative/{id}` endpoint removes all server-side data within 24 hours |
| **Data breach notification** | Automated alerting + admin notification within 72 hours |
| **Data residency** | Server hosted in Indonesia (Hetzner Singapore or local DC) |
| **Purpose limitation** | Data is used exclusively for national aggregation and ranking |

### 9.7 Security Roadmap

| Phase | Milestone |
|---|---|
| **MVP** | TLS 1.3, API key auth, rate limiting, parameterized queries |
| **V1** | Payload signing (HMAC), OS keychain storage, RLS on PostgreSQL |
| **V2** | Key rotation, IP allowlisting, anomaly detection, Cloudflare proxy |
| **V3** | Third-party security audit, PDPA compliance certification, bug bounty program |

## 10. Immediate Next Steps

1. Set up the VPS ($15/mo at Hetzner)
2. Initialize PostgreSQL
3. Build the Fastify server with the sync endpoint
4. Update the desktop app to call the real endpoint
5. Launch the National Dashboard read-only (public beta)
6. Add billing once there are 10+ active nodes
