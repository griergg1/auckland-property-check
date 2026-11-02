# Auckland Property Check — progress log

Living record of what was done, what’s next, and **session rituals** so work stays shippable (no Duly-style “half-finished queue” code in the repo).

**Related docs:** [docs/BRIEF.md](docs/BRIEF.md) · [docs/TECH.md](docs/TECH.md) · [docs/MARKET_RESEARCH.md](docs/MARKET_RESEARCH.md) · Plan: `.cursor/plans/` or team copy of implementation plan

**Current target phase:** Phase 0.5 PoC — live on Vercel with parcels, overland flow, and flood prone areas. `morebeanz.com` is registered again and delegated to DreamHost.

---

## How to use this file

1. **Start of session** — run the checklist below; note date + goal in *Session log*.
2. **During session** — tick items in *Session log* as you go (optional but useful).
3. **Close of session** — run closeout checklist; append *Session log* entry with outcome and *Next*.

---

## Start of session

Do this before writing new code or running imports.

### Context (2 min)

- [ ] Read the **last Session log entry** (below) and *Next* line.
- [ ] Confirm **phase** (PoC / MVP / …) and **today’s single outcome** (one sentence). If unclear, pick one item from *Backlog* or plan todos.
- [ ] Open plan / `docs/TECH.md` only if touching data layers, assessment rules, or auth.

### Environment (5 min)

- [ ] `git status` — know if you’re mid-change; note branch name.
- [ ] `git pull` (if collaborating or using another machine).
- [ ] Env vars present for what you’ll run (`.env.local` — never commit): Supabase, `LINZ_API_KEY` if using live WFS.
- [ ] Supabase local or remote reachable (if DB work): e.g. `supabase status` or dashboard smoke check.
- [ ] Dependencies match lockfile: `npm ci` or `pnpm install` if `package.json` / lockfile changed since last session.

### Baseline quality (before new edits)

- [ ] If prior session left failing tests/build, **fix or explicitly revert** before adding scope (don’t stack debt).
- [ ] Optional quick smoke: `npm run lint` and/or `npm run test` (when scripts exist).

### Session goal (write in log)

- [ ] Add a **draft** Session log header: `## YYYY-MM-DD — <short title>` with *Goal:* one bullet.

---

## Close of session

Do this before closing the laptop. **Do not skip** because “it’s small.”

### Correctness

- [ ] App runs locally for paths you touched (search → confirm → report, or whatever exists).
- [ ] **No known errors** in terminal for dev server and for any import script you ran.
- [ ] `npm run lint` — pass (or only pre-existing issues documented in log).
- [ ] `npm run test` — pass (Vitest; when present).
- [ ] If UI changed: quick manual pass on **mobile width** + one real address from golden set (when available).
- [ ] No secrets in diff: `git diff` free of keys, `.env`, service role tokens.

### Debug / hygiene

- [ ] Remove `console.log` debug, stray TODOs unless tracked in *Backlog*.
- [ ] Migrations applied or noted in log if only on your machine.
- [ ] If dataset import ran: `dataset_versions` / registry doc updated ([docs/dataset-verification.md](docs/dataset-verification.md) when that file exists).

### Code review (CodeRabbit)

- [ ] CodeRabbit CLI available: `coderabbit --version` and `coderabbit auth status`.
- [ ] Review **session changes** (prefer committed or staged scope):

  ```bash
  coderabbit review --agent
  ```

  Or review since main:

  ```bash
  coderabbit review --agent --base main
  ```

- [ ] **Critical / Warning** findings: fix or document why deferred in Session log *Notes*.
- [ ] Do not run review on commits that contain secrets.

### Git

- [ ] Meaningful commits (user rule: only commit when intended; closeout assumes you **want** to save progress).
- [ ] `git status` clean or only intentional untracked files (e.g. local data dumps in `.gitignore`).
- [ ] **Push** to remote: `git push -u origin <branch>` so work isn’t only local.
- [ ] If PoC+ and CI exists: check GitHub Actions (or Vercel preview) for the branch.

### Progress log (required)

- [ ] Complete the Session log entry:
  - *Done:* bullets
  - *Verified:* lint / test / manual / CodeRabbit
  - *Next:* one concrete starting task
  - *Blockers:* optional

### Optional (weekly or before demo)

- [ ] Run golden-address regression (when `tests/fixtures/properties.json` exists).
- [ ] Playwright smoke (when e2e exists): `npm run test:e2e`.
- [ ] Vercel preview URL noted in log if deploying.

---

## Session log

*(Newest first.)*

### Template

```markdown
## YYYY-MM-DD — Session title

**Goal:** …

**Done:**
- …

**Verified:** lint ✅ / test ✅ / manual ✅ / CodeRabbit ✅ / pushed ✅

**Next:** …

**Notes:** …
```

---

<!-- Sessions below -->

## 2026-11-02 — Parcel choice and flood prone areas

**Goal:** Let a visitor choose when several parcels contain the address, then add flood prone areas as the second live check.

**Done:**
- Confirm page lists every parcel that contains the address. The selected row is the one that runs. Other outlines stay on the map, lighter than the selection.
- Imported 35,338 Auckland Council flood prone areas. The dataset version stayed draft until the last page, then became active.
- A report now returns two findings: overland flow and flood prone areas. Opening a finding shows that finding's evidence on the map.
- `morebeanz.com` was re-registered at DreamHost. The `.com` registry delegates it to DreamHost again, and the apex A record is Vercel's `216.198.79.1`.
- Basemap fix from earlier today is on production (`360d62a`).

**Verified:** typecheck ✅ / lint ✅ / test ✅ / manual ✅ (five overlapping parcels in the city centre; choosing the second parcel wrote that parcel id on the run; flood check returns `detected` with evidence where a polygon overlaps, and `not_detected` on 17 Shanaway Rise)

**Next:** Auckland Unitary Plan zones — locate the zone polygon layer and licence, then add `planning.zone`.

**Notes:** Flood prone areas are potential ponding from topography, assuming a blocked outlet. They are not a hydraulic flood model.

---

## 2026-11-01 — Closeout (real-data PoC)

**Goal:** Close the session cleanly so the next one can start from a pushed, reviewed tree.

**Done:**
- Lint, typecheck, and Vitest passed (4 tests, including the live overland-flow RPC).
- CodeRabbit review of commits since `9ce9f1f` (11 findings). Fixed the honesty issues; deferred the rest below.
- LINZ address search now throws on a non-OK response instead of returning no matches.
- Home, confirm, report, and footer copy no longer call the live data “demo fixtures”. The home checks list marks overland flow as live and planning, terrain, and infrastructure as planned.
- Empty address search message appears only after a completed search with no matches.
- Assessment run and report responses set `isDemo: false`.
- Parcel geometry is parsed when the RPC returns a GeoJSON string.
- Overland-flow import reads `properties` (GeoJSON) as well as `attributes`.
- Dataset ledger updated: parcels imported, addresses layer `123113`, overland flow imported.

**Verified:** lint ✅ / typecheck ✅ / test ✅ (4 pass) / CodeRabbit ✅ (findings triaged) / secrets not in git (`.env.local` ignored) / pushed ✅

**Next:** Point `morebeanz.com` DNS (A `216.198.79.1` and `64.29.17.1`; `www` CNAME `cname.vercel-dns.com`). Then let the visitor choose when `parcels_containing_point` returns more than one parcel.

**Notes (CodeRabbit, deferred):**
- Confirm still submits `candidates[0]`. Multi-parcel choice is the next product change, not a silent failure.
- Overland-flow import still marks the dataset version active before the pages finish. The current import already completed (1,176,253 features). The next import should insert as draft and promote only after the last page succeeds. Existing `source_feature_id` values may be empty from the first import.
- `.label` color can override `text-paper` on buttons. Visual only; left as-is.
- Assessment routes already use the anon client. The integration test uses the service role to look up the demo parcel. No RLS change in this closeout.
- Several `dataset_versions` rows are still `active` from repeated import attempts.
- `morebeanz.com` DNS is not pointed yet.

**Notes:**
- LINZ API key and service role key stay in `web/.env.local` only. Service role is not required on Vercel.

---

## 2026-11-01 — Project setup (docs only)

**Goal:** Capture briefs, tech stack, market research, PoC scope, and session rituals.

**Done:**
- Added `docs/BRIEF.md`, `docs/TECH.md`, `docs/MARKET_RESEARCH.md`, `docs/RISK_SWOT.md`
- Defined Phase 0.5 PoC and no-stall rules in implementation plan
- Created `progress.md` with start/close checklists

**Verified:** n/a (no application code yet)

**Next:** Scaffold Next.js + Supabase PostGIS; dataset verification ledger; first council layer import plan.

**Notes:** App implementation not started.

---

## 2026-11-01 — Retire Go Drink Free infra

**Goal:** Remove unused Go Drink Free from Supabase and Vercel.

**Done:**
- Supabase `godrinkfree` (`fzrndnyzqqboqcaelgoz`): dropped `public.waitlist`; no public tables remain; 0 auth users.
- Vercel: CLI delete requires login — use dashboard link below.

**Verified:** Supabase `list_tables` → empty public schema.

**Next:** Scaffold Next.js PoC; wire `.env.local` to new Supabase ref.

---

## 2026-11-01 — Real data import + live address search

**Goal:** Replace demo fixtures with real LINZ parcels + Auckland Council overland flow data; live address search.

**Done:**
- Imported **461,632 real Auckland parcels** (LINZ NZ Primary Parcels, Auckland clip) into `public.parcels`.
- Imported **1,176,253 Auckland Council overland flow features** (ArcGIS REST, CC BY 4.0) into `public.hazard_features`.
- DB size: 1.26 GB (within 8 GB Pro disk).
- Switched `/api/address/search` to live LINZ NZ Addresses WFS (layer 123113, new July 2026 schema).
- Switched `/api/parcel/candidates` to find real parcels containing the address point (`parcels_containing_point` PostGIS function).
- Updated `assess_overland_flow` to use real dataset slug `ac-overland-flow-paths` (with demo fallback); fixed `v_parcel` type to generic Geometry for MultiPolygon parcels.
- Live end-to-end smoke test: "17 Shanaway Rise, Hillcrest" → real parcel (5039937, 1163 m²) → `detected` with real overland flow path intersection evidence.

**Verified:** lint ✅ / typecheck ✅ / test ✅ (4 pass) / build ✅ / committed ✅ / pushed ✅

**Next:** Deploy real-data build to Vercel; wire `morebeanz.com` DNS; add more checks (flood prone, planning zone).

**Notes:**
- LINZ API key in `.env.local` + Vercel (encrypted).
- Service role key in `.env.local` (set by user).
- `morebeanz.com` DNS still pending (A → 216.198.79.1 + 64.29.17.1; CNAME www → cname.vercel-dns.com.).

---

## Backlog (high level)

Use plan todos for detail; this is a short pointer list.

- [x] Scaffold Next.js (App Router, TS, Tailwind, pinned deps)
- [x] Supabase + PostGIS migrations (datasets, parcels, runs, findings)
- [x] LINZ Auckland parcel/address path
- [x] One verified Auckland Council layer + PostGIS check
- [x] PoC UI: search → confirm → report
- [x] Vitest: rear-of-section intersection case
- [x] CodeRabbit + git push in every closeout once code exists
- [x] `morebeanz.com` DNS (re-registered; apex A record points at Vercel)
- [x] Choose among multiple parcel candidates
- [x] Flood prone areas
- [ ] Next dataset: unitary plan zone
- [ ] Import versions stay draft until the import finishes

---

## Principles (reminder)

- **No user-facing report queue** — sync assessment; imports offline.
- **Four finding states** — never “all clear” on failure.
- **Parcel geometry**, not address point alone.
- **Demo vs live** clearly labelled when fixtures exist.
