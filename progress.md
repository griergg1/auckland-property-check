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

## 2026-11-02 — Auckland Unitary Plan zone check

**Goal:** Add Auckland Unitary Plan zones as the `planning.zone` check, the third live finding.

**Done:**
- Located the official zone polygon layer: Auckland Council Unitary Plan Base Zone, ArcGIS FeatureServer item `232d7b39839d4616bcbfc0509e26d9b3`, CC BY 4.0. Recorded the endpoint, fields, coded values, and rule-page URL pattern in `docs/dataset-verification.md`.
- Imported 139,488 operative zone polygons (filtered to `VERSIONSTATUS=4`) into `public.hazard_features` under slug `ac-unitary-plan-zones`. The import follows the flood-prone hardening: reject an ArcGIS error body, honour `exceededTransferLimit`, refuse to activate an empty import, mark the version failed on throw, and keep the version `draft` until the last page succeeds, then `active`.
- Added `assess_unitary_plan_zone` SQL function. It intersects the confirmed parcel (not the address point), returns one of the four finding states, names the zone, and links to the ePlan rule chapter PDF for that zone (H-chapters for land zones, F-chapters for coastal zones, ePlan root as fallback). When the layer is missing the result is `unavailable`, not clear. The limitations state what the map does not establish (overlays, precincts, designations, height, activity status, consent needs).
- Wired it as the third finding in `runChecksForParcel`. The report now returns overland flow, flood prone areas, and Unitary Plan zone.
- Updated home and footer copy to mark planning as live, only after the version was active.

**Verified:** lint ✅ / typecheck ✅ / test ✅ (4 pass) / manual ✅ (real parcel 5039937 → detected, Residential - Mixed Housing Suburban Zone, H4 PDF; demo parcel → detected, Coastal - General Coastal Marine Zone, F2 PDF; a parcel outside coverage → not_detected) / CodeRabbit ✅ (1 major fixed, 2 deferred) / secrets not in git ✅ / pushed ✅

**Next:** Terrain (approximate slope) — locate an elevation/DEM source and licence, then add `terrain.slope` as the fourth check.

**Notes:**
- The Unitary Plan is "Operative in part (15 November 2016)". The base zone layer tiles all of Auckland (land + coastal + roads), so a normal Auckland parcel always returns `detected`; `not_detected` means the parcel is outside the AUP area. 16 non-operative records (12 Proposed, 4 other) are excluded by the `VERSIONSTATUS=4` filter so the check names the current zone, not a plan-change version.
- The check names the base zone only. Overlays (historic heritage, special character, significant ecological areas, volcanic viewshafts), precincts, and designations are separate layers not yet assessed.

**Notes (CodeRabbit):**
- Major, fixed: filter the import to operative records (`VERSIONSTATUS=4`) so a Proposed/Decision zone is not reported as the current zone. Re-imported 139,488 operative polygons, matching the source's operative count exactly.
- Major, deferred: validate the imported total against an authoritative source count and assert geometry SRID/bounds before promoting the version. The import already validates non-empty and `insert_hazard_geojson` sets SRID 2193; an authoritative count check is consistent with the flood-prone import (which also lacks it) and is left for a later hardening pass across all imports.
- Major, considered: keep the "Planning · live" label as planned until the RPC is confirmed for deployment. The user's instruction was to update copy after the version is active; the version is active, the RPC is verified on three parcels, and the change is pushed to main (Vercel auto-deploys). Kept as live.

---

## 2026-11-02 — Parcel choice and flood prone areas

**Goal:** Let a visitor choose when several parcels contain the address, then add flood prone areas as the second live check.

**Done:**
- Confirm page lists every parcel that contains the address. The selected row is the one that runs. Other outlines stay on the map, lighter than the selection.
- Imported 35,338 Auckland Council flood prone areas. The dataset version stayed draft until the last page, then became active.
- A report now returns two findings: overland flow and flood prone areas. Opening a finding shows that finding's evidence on the map.
- `morebeanz.com` was re-registered at DreamHost. The `.com` registry delegates it to DreamHost again, and the apex A record is Vercel's `216.198.79.1`.
- Basemap fix from earlier today is on production (`360d62a`).

**Verified:** lint ✅ / typecheck ✅ / test ✅ (4 pass) / manual ✅ (desktop search → confirm → report, and the confirm page at 390px; five overlapping parcels, the chosen parcel id was the one saved) / CodeRabbit ✅ (1 major fixed, 1 minor deferred) / secrets not in git ✅ / pushed ✅

**Next:** Auckland Unitary Plan zones — locate the zone polygon layer and licence, then add `planning.zone`.

**Notes:** Flood prone areas are potential ponding from topography, assuming a blocked outlet. They are not a hydraulic flood model.

**Notes (CodeRabbit):**
- Major, fixed: the flood-prone import now rejects an ArcGIS error body, pages with `exceededTransferLimit`, refuses to activate an empty import, checks the retire result, and marks the version failed if paging throws. The 35,338-row import already completed before this hardening.
- Minor, deferred: CodeRabbit asked for a static `NEXT_PUBLIC` LINZ key on the basemap. The Data Service key is rejected by the basemaps service (`API Key Invalid: malformed`). The map mints the short-lived key that service accepts. Left as-is.

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

### Done
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
- [x] Unitary Plan zone
- [ ] Import versions stay draft until the import finishes (flood-prone + unitary plan already do this; overland flow predates it)

### Next checks — free data, usefulness-ranked (not existence-ranked)
*Research: slope dropped — relevant to builders, not to buyers of existing homes. Ranked by how often buyer-facing guidance mentions each.*

- [ ] Coastal inundation / storm-tide — completes the flood/hazard trio. AC Flood Viewer, same ArcGIS hub as overland flow. CC BY 4.0.
- [ ] Landslide susceptibility — post-2023-storms concern AC is pushing; newly published maps. High for Waitākere / North Shore hillsides.
- [ ] AUP overlays — special character, historic heritage, significant ecological areas, volcanic viewshafts, precincts, designations. Extends the live zone check; same open-data hub as zones. Answers "can I demolish/alter".
- [ ] Coastal erosion — AC GeoMaps. Medium relevance; pairs with coastal inundation.
- [ ] Tsunami zones — AC Hazard Viewer. Medium; coastal evacuation.
- [ ] NHCover landslide claims history — free NHC claims map; evidence of past events, complements landslide susceptibility.

### Product / monetization (spec now, build later)
- [ ] **Price the report at NZ$25–30.** Position as a pre-LIM screen (LIM is $375 / 10 days). See `docs/BRIEF.md`.
- [ ] **PDF report generation** — printable, shareable summary of a run's findings with sources and dates. Start with browser print CSS (per `docs/TECH.md`); move to server PDF (`@react-pdf/renderer` or microservice) only if print quality/pagination demands it.
- [ ] Paid report gate — free first search (address → confirm → on-screen findings); paywall the PDF export and saved shortlist beyond N properties.
- [ ] Intention-aware ordering already in the report; make it the headline differentiator vs $49 hazard PDFs.

### Future — paid data layers / APIs (not now; everything above is free CC BY 4.0)
*Add only when a check's buyer value justifies the per-report cost. Price must still land at $25–30, so pass-through costs cap what we can use.*

- [ ] **LINZ Record of Title** (covenants, easements, restrictions) — paid per title via Landonline. Top due-diligence item; would add a "title restrictions" check. Cost-per-title must fit inside the $25–30 envelope or be an upsell.
- [ ] **Auckland Council property file** (consent history, original plans) — per-property fee, pass-through. Likely an upsell, not in the base report.
- [ ] **CoreLogic / PropertyValue or QV data** — sales history, comparables, AVM. Competes with QV e-Report ($29.99); low differentiation for us. Probably out of lane.
- [ ] **High-res LiDAR DEM** — only if we ever revisit slope/earthworks. Free 8 m DEM exists; high-res is commercial. Slope is currently out of scope, so this is parked.
- [ ] **NHCover per-property claim detail** — the free claims map is in scope above; per-property claim docs may need an official channel.

### Out of lane (route to a professional, do not build)
- Meth contamination — needs physical testing.
- Weathertightness / asbestos — needs building inspection.
- Registered valuation — needs physical inspection.
- Building consents correctness — needs council property file + site visit.

---

## Principles (reminder)

- **No user-facing report queue** — sync assessment; imports offline.
- **Four finding states** — never "all clear" on failure.
- **Parcel geometry**, not address point alone.
- **Demo vs live** clearly labelled when fixtures exist.
- **Usefulness, not existence** — add a layer because buyers look for it, not because the data exists.
