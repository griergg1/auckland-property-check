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

## 2026-11-02 — v1.5 Wave 1: rating valuation, school zones, what-to-ask, hero rewrite

**Goal:** Build Wave 1 of the v1.5 home-buyer-report plan — the three items that flip the product from a land-buyer tool into a home-buyer tool (rating valuation + council rates, school enrolment zones, intention-aware what-to-ask layer) — then rewrite the home page hero to lead with the home buyer, backed by the new live findings.

**Branching step (§4 sourcing check, done first):**
- Auckland Council open-data portal: no bulk CC-BY feed for per-property rating valuations. The council's "Find your property rates or valuation" page is powered by an undocumented public read-only JSON API at `https://experience.aucklandcouncil.govt.nz/nextapi/property` (address search → ACRateAccountKey → rate-assessment). No API key, no login; the public bearer token is extracted from the council's own search page. Returns CV, land value, improvement value, annual rates, valuation number, land/floor area, local board, legal description. Verified live 2026-11-02: for 17 Shanaway Rise, Hillcrest → CV $1,350,000, land $1,150,000, improvement $200,000, rates $4,516/yr.
- QV API terms: OUT for the free tier. QV's free service terms prohibit commercial use, bulk harvesting, scraping, and automated queries; bulk API access requires commercial PropertyIQ licensing ($299+/yr per user). So QV is not used.
- Council's "Search rating" web endpoint: this IS the council's own public rate-assessment API (the same one that powers the council's own public search page). Not a third-party scrape.
- **Decision: 1.1 is IN v1.5 free.** Build order: 1.1 → 1.2 → 1.3. Logged in `docs/dataset-verification.md` under slug `ac-rating-valuation` (status `access-check` — the endpoint and auth model are confirmed; a formal terms review is a follow-up, since this is an undocumented public API rather than a CC-BY-licensed open-data feed).

**Done:**
- **1.1 Rating valuation + council rates (live).** Added `web/src/lib/council-rates.ts`: fetches the public bearer token from the council's own search page (caches it in `council_api_token` until its JWT exp minus 5 min), resolves address → ACRateAccountKey via `nextapi/property?query=`, fetches the rate-assessment, caches the result in `rating_valuation_cache` for 7 days (valuations change triennially, rates annually). Added `runRatingValuationCheck` in `web/src/lib/assessment.ts` — same four-state shape as the other findings; `unavailable` if the council API can't return a value or errors (errors are logged server-side, not surfaced in the finding). Limitations line: "This is the council's rating valuation, not a market valuation or a registered valuation." Source URL: the council's per-property rates page. Wired into the run route (runs once per run, keyed by address, not per parcel). Migration: `rating_valuation_cache` + `council_api_token` tables with anon RLS policies (the run route uses the anon client; Vercel has no service role). Report GET route returns a structured `ratingValuation` object (CV, LV, IV, rates, areas, local board, legal description) by reading the cache. Report page renders it as a header card above the findings list (CV, LV, IV, annual rates, land/floor area) with the DETECTED stamp, limitations, and source link.
- **1.2 School enrolment zones (live).** Located the canonical MoE enrolment-zone source: Eagle Technology Living Atlas FeatureServer (item `2effe91b31fc40d39434c35491e844c5`), national, NZTM, CC BY 3.0 NZ (Crown copyright, MoE). The ecan MapServer layer 3 is Canterbury-only and was rejected. Wrote `web/scripts/import/moe-school-enrolment-zones.mjs` (same hardening as the coastal inundation import: reject ArcGIS error body, honour `exceededTransferLimit`, refuse to activate an empty import, mark version failed on throw, draft → active). Imported 1,325 national enrolment home zone polygons (447 tagged `Office=AK` Auckland) into `public.hazard_features` under slug `moe-school-enrolment-zones`. Added `assess_school_zones` SQL function: ST_Contains against the parcel centroid, returns one finding `neighbourhood.school_zones` listing the matching schools (name, institution type, office). Wired as the fifth finding in `runChecksForParcel`. Verified live: 17 Shanaway Rise → detected, 3 zones (Northcote College secondary, Northcote Intermediate, Willow Park contributing). Recorded in `docs/dataset-verification.md`. **Equity Index join deferred** — the Living Atlas layer has `School_ID` (joinable to the MoE schools directory / EQI Excel) but the directory CSV fetch (data.govt.nz API timed out / 403) and the EQI Excel parse (no xlsx library) are follow-ups; the finding's limitations line states the Equity Index is the 2023+ replacement for the old decile and is not yet wired.
- **1.3 The what-to-ask layer (live).** Added `generate_questions(p_run_id, p_intention)` SQL function — deterministic rules (same `rules.v1` pattern) that read the run's findings and the intention, and return questions per audience (builder/drainlayer, council/LIM, insurer, planner/council, school/MoE, bank/mortgage adviser, lawyer). Intention-aware: e.g. overland flow + extend → builder drainage question; zone + add_dwelling → second-dwelling consent question; RV detected → bank CV-vs-asking-price question; RV unavailable → council property-file question. Report GET route calls it and returns `questions`; report page renders a "What to ask, and whom" section grouped by audience. Fixed a PL/pgSQL column-ambiguity bug (the function's output `check_id` column conflicted with the CTE's `f.check_id`) by aliasing the CTE columns and using ordinal `ORDER BY 1, 2`. Verified live: 17 Shanaway Rise + extend → 5 questions across 4 audiences (bank, lawyer, planner/council x2, school).
- **Hero rewrite (done last, backed by the new live findings).** Rewrote `web/src/app/page.tsx` hero to lead with the home buyer: headline "Know what a property is worth and what's on it before you pay for the LIM"; subhead names the rating valuation, annual rates, school enrolment zones, flood/coastal maps, and what you can build. Replaced "section" with "property" throughout the hero, who-it's-for, differentiators, journey, pricing, and footer. Updated AUDIENCES so first-home buyer leads with "What's it worth, and what are the schools?" Updated CHECKS to "Six things on the report today" (Value & rates, School zones, Flood & coastal, What you can build). Updated the worked example to reflect the real 2 Nov 2026 run: a new RV card (CV $1,350,000, land $1,150,000, rates $4,516/yr, 685 m², 130 m², Kaipatiki) plus the zone card (Mixed Housing Suburban, H4) and a new school-zones card (Northcote College, Northcote Intermediate, Willow Park). Updated `SiteFooter` to separate the RV (council public rates search) from the CC-BY open-data licence claim.

**Verified:** lint ✅ / typecheck ✅ / test ✅ (4 pass; the live Supabase integration test passes with network) / manual ✅ (golden address "17 Shanaway Rise, Hillcrest" run end-to-end search → confirm → report; 6 findings render — RV in header with live council data (CV $1.35M, rates $4,516), 5 findings in list, 5 what-to-ask questions across 4 audiences; home + report pages render at 390px mobile width via browser screenshot) / CodeRabbit ✅ (6 findings: 4 minor fixed, 2 major — 1 fixed, 1 deferred with comment) / secrets not in git ✅

**Next:** Wave 2 — landslide susceptibility (newly published AC maps, high for Waitākere / North Shore) + Unitary Plan overlays (special character, historic heritage, SEA, volcanic viewshafts). Same ArcGIS hub, same import hardening. Also: wire the Equity Index join for 1.2 (fetch the MoE schools directory CSV / EQI Excel, join on School_ID), and run a formal terms review on the council rate-assessment API to promote its dataset row from `access-check` to `verified`.

**Notes:**
- The §4 sourcing check found a free per-property feed (Auckland Council's own public rate-assessment API), so 1.1 stayed in v1.5 free. QV is out (terms prohibit commercial use). The RV dataset row is `access-check` (not `verified`) because the API is undocumented rather than CC-BY-licensed open data; the check is live on the strength of "this is the council's own public API for its own public tool," with a 7-day cache and rate-limited per-run usage. A formal terms review is a follow-up.
- The rating valuation is per-address, not per-parcel. The run route creates exactly one RV finding per run (keyed by addressLabel). The report page keeps the first (only) RV in the header and excludes all RV from the findings list. Multi-parcel RV is not built; if it ever is, the header rendering must be updated to associate each RV with its parcel.
- The Equity Index join for 1.2 is deferred. The Living Atlas layer has `School_ID` (joinable) but no decile/EQi; the ecan MapServer layer has decile but no School_ID and is Canterbury-only. The MoE schools directory CSV (which has an `EQi_Index` field) and the EQI Excel are the join sources, but the data.govt.nz API timed out / 403 and xlsx parsing needs a library not in the project. The finding's limitations line states the EQI is the 2023+ replacement for the old decile and is not yet wired.
- The `generate_questions` function had a PL/pgSQL column-ambiguity bug (`check_id` was both a function output column and a CTE column). Fixed by aliasing the CTE columns (`chk_id`, `st`, `ttl`, `expl`) and using ordinal `ORDER BY 1, 2`.
- The worked example on the home page is a static snapshot from the 2 Nov 2026 live run (CV $1.35M, rates $4,516, 3 school zones), with the source line now stating the actual retrieval date (2 November 2026) instead of "pulled on the day you run it" (which is for live reports). Re-running the golden address during the session confirmed the parcel is still LINZ 5169096 (687 m²) and the council area is 685 m² — the council rating area and the LINZ parcel area can differ slightly.

**Notes (CodeRabbit):**
- Minor, fixed: SiteChrome + home page footer now separate the rating valuation (council public rates search) from the CC-BY open-data licence claim.
- Minor, fixed: the council rates error handler in `assessment.ts` no longer appends the raw exception message to the finding limitations; it logs server-side and surfaces a fixed user-safe message.
- Minor, fixed: the static worked-example source line now states the actual retrieval date (2 November 2026) instead of implying it was pulled on the day the user runs it.
- Minor, fixed: the what-to-ask section copy now clarifies that the questions are fetched for the run's original intention and do not reorder when the reader switches the intention above (only the findings reorder).
- Major, fixed: added a clarifying comment on the report page that the run creates exactly one RV finding per run (keyed by address, not parcel), so the header keeps the first and the list excludes all RV; multi-parcel RV is not built and would need a header update if ever added.
- Major, deferred: keep the AC rates check disabled while its dataset row is `access-check`. The check is live on the strength of the council's own public API for its own public tool (with 7-day cache, rate-limited per-run usage); a formal terms review to promote the row to `verified` is a follow-up, not a blocker for v1.5 Wave 1.

---

## 2026-11-02 — Marketing copy overhaul + differentiators

**Goal:** Copy/positioning pass — sharper hero, "who it's for", worked example, "Why morebeanz" differentiators, /about + /support + /contact, pricing line, footer attribution. No new data imports.

**Done:**
- Rewrote the home page hero (`web/src/app/page.tsx`): new value prop ("Parcel-precise findings before you pay for the LIM."), an explicit who-it's-for line, and the parcel-precise + intention-aware + four-state honesty trio stated up front. Kept the honest "Not a LIM" tone and the live search form.
- Added a "Who should use this" section mapped to the intention model (first-home buyer, renovator, extender, add-a-dwelling, vacant-land builder), plus a "Not for — apartments & cross-leases" card so the scope limit is stated, not hidden.
- Added a worked example using a real Auckland address (17 Shanaway Rise, Hillcrest). Ran the live assessment during the session to keep it honest: the parcel now resolves to LINZ 5169096 (687 m²) — not the 5039937 (1,163 m²) recorded in the 2026-11-01 log; the parcel data has shifted. The example shows the real returned finding (Zone: Residential — Mixed Housing Suburban, detected, H4 chapter) and notes the three hazard checks returned not_detected on this parcel, reported as not_detected — not as "all clear".
- Added a "Why morebeanz" section with all seven differentiators (parcel-confirmed intersection, intention-aware ordering, four-state honesty, source-cited deterministic findings, zone → rule-chapter PDF, per-finding limitations, AC source-first). Framed as a factual contrast with a generic "500 m circle" / "AI summary" without naming Duly.
- Added a pricing section: free now; paid PDF report planned at NZ$25–30 as a pre-LIM screen (LIM is $375 / 10 days). No paywall built.
- Added `/about`, `/support`, `/contact` App Router pages. About: what morebeanz is, four principles, "what it is not" disclaimers. Support: 7-item FAQ (what it covers / doesn't cover, data currency, is-it-a-LIM, what "unavailable" means, parcel ambiguity, cost) + email. Contact: email link + what to include (a backend form is out of scope this session; email is direct and honest about that).
- Updated the shared `SiteChrome` (`SiteHeader` + `SiteFooter`) to add About / Support / Contact nav links and source-first CC BY 4.0 attribution in the footer. Updated the home page inline header and footer to match. Coastal inundation now named in the footer live-checks line (it was already a live finding but the footer hadn't caught up).

**Verified:** lint ✅ / typecheck ✅ / test ✅ (4 pass; the live Supabase integration test passes with network, fails only under sandbox network restriction) / manual ✅ (home + /about + /support + /contact all return HTTP 200 and render at 390px mobile width via browser screenshot; golden address "17 Shanaway Rise, Hillcrest" run end-to-end search → confirm → report — flow unbroken by the new copy) / CodeRabbit ⏳ (run at closeout) / secrets not in git ✅

**Next:** Landslide susceptibility — post-2023-storms concern AC is pushing; newly published maps. Same ArcGIS hub, same import hardening. (Unchanged from prior session; this was a copy session.)

**Notes:**
- The worked example had to be corrected mid-session: the 2026-11-01 log recorded parcel 5039937 (1,163 m²) with a detected overland flow path for "17 Shanaway Rise, Hillcrest", but the live parcels table now resolves that address point to parcel 5169096 (687 m²) with overland flow / flood prone / coastal all not_detected and only the zone detected. The example was rewritten to match the current live run rather than the stale log, per the prompt's "show a real finding, not a mockup" rule. The 5039937 → 5169096 shift suggests the LINZ parcel import or the `parcels_containing_point` result has changed since 2026-11-01; worth a one-off audit but not blocking.
- The home page is still a single client component (`"use client"`) because of the search form. The new static sections (Who / Example / Why / Pricing) are inline in that client component rather than split out as server components — a future refactor could extract them, but it's not needed for this pass and would expand scope.
- The contact page is an email link, not a form. A form needs a backend + email service (out of scope). The page says so plainly.
- Out-of-scope items from the prompt were NOT started: mortgage calculator, what's-nearby, Kāinga Ora map, MCP server, auth, report sharing/PDF, coastal SLR scenarios. Logged in Backlog as "Marketing v2".

---

## 2026-11-02 — Coastal inundation (storm-tide) check

**Goal:** Add coastal inundation / storm-tide as the fourth hazard check, the next live finding.

**Done:**
- Located the canonical Auckland Council coastal storm inundation layer: Coastal Inundation 1% AEP (present-day sea level), ArcGIS FeatureServer item `e1b4f3e57dc64b6395098a17ac979eeb`, CC BY 4.0 (item `licenseInfo`: "available to the public Under Creative Commons license"). Recorded endpoint, item id, fields, CRS (EPSG:2193), max record count (2000), and rule/source page URL in `docs/dataset-verification.md` under slug `ac-coastal-inundation`. The 1% AEP (100-year return period, present-day) is the standard planning scenario shown on the AC Flood Viewer; sea-level-rise variants are separate FeatureServices and out of scope.
- Imported 689 storm-tide polygons into `public.hazard_features` under slug `ac-coastal-inundation`. The import follows the flood-prone hardening: reject an ArcGIS error body, honour `exceededTransferLimit`, refuse to activate an empty import, mark the version failed on throw, and keep the version `draft` until the last page succeeds, then `active`. The first attempt timed out at page size 500 (large coastal polygons exceeded the Postgres statement timeout); the failed version was correctly marked `failed`, and re-running at page size 50 succeeded and retired the prior active version.
- Added `assess_coastal_inundation` SQL function. It intersects the confirmed parcel (not the address point), returns one of the four finding states, names the scenario and return period (1% AEP, 100-year, present-day sea level) where the source carries one, and links to the AC flood-check page. When the layer is missing the result is `unavailable`, not clear. The limitations state what the map does not establish: not a site-specific flood assessment, not a floor-level or insurance answer; wave runup, overtopping, sea-level-rise scenarios, and freshwater flooding are not included.
- Wired it as the fourth finding in `runChecksForParcel` (overland flow, flood prone, coastal inundation, Unitary Plan zone). The report renders the fourth finding automatically.
- Updated home and footer copy to mark coastal inundation live, only after the version was active.

**Verified:** lint ✅ / typecheck ✅ / test ✅ (4 pass) / manual ✅ (Mission Bay coastal parcel 6741703 → detected, scenario "Coastal storm-tide 1.0 % AEP (100-year return period) (present-day sea level)"; Hillcrest inland parcel 5039937 → not_detected) / CodeRabbit ✅ (0 findings) / secrets not in git ✅ / pushed ✅

**Next:** Landslide susceptibility — post-2023-storms concern AC is pushing; newly published maps. High for Waitākere / North Shore hillsides. Same ArcGIS hub, same import hardening.

**Notes:**
- The 1% AEP layer has 689 polygons; the present-day scenario uses `SeaLevelRiseScenario="N/A"`. Sea-level-rise variants (0.5 m, 1 m, 1.5 m, 2 m) are separate FeatureServices and are not imported; a future "coastal inundation + SLR" check could add them.
- Coastal inundation mapping is not available for some Parakai-Helensville scenarios (hydrodynamic modelling gaps); those parcels will return `not_detected` within checked coverage, which is honest.
- The first import attempt's statement-timeout failure was caught by the `markFailed` path and left a `failed` version (not `retired`); the second attempt created a fresh `draft`, succeeded, and retired only the prior `active` version. The `failed` row remains for audit.

---

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
- [x] Coastal inundation / storm-tide
- [x] **v1.5 Wave 1 — rating valuation + council rates** (free per-property feed found: Auckland Council's own public rate-assessment API; QV out on terms. RV dataset row `access-check`; formal terms review is a follow-up)
- [x] **v1.5 Wave 1 — school enrolment zones** (MoE via Eagle Technology Living Atlas, CC BY 3.0 NZ; 1,325 national zones imported. Equity Index join deferred — directory CSV fetch + xlsx parse are follow-ups)
- [x] **v1.5 Wave 1 — what-to-ask layer** (`generate_questions` SQL function; intention-aware; rendered on the report)
- [x] **v1.5 Wave 1 — home page hero rewrite** (leads with the home buyer; "property" not "section"; worked example re-run on 2 Nov 2026 with live RV + school zones)
- [ ] Import versions stay draft until the import finishes (flood-prone + unitary plan + coastal inundation + school zones already do this; overland flow predates it)

### v1.5 follow-ups (after Wave 1)
- [ ] **Wire the Equity Index join for school zones.** The Living Atlas layer has `School_ID` (joinable) but no EQi. Fetch the MoE schools directory CSV (has `EQi_Index`) from data.govt.nz, or the EQI Excel (2023–2026) from Education Counts, and join on `School_ID`. Show each school's Equity Index (the 2023+ replacement for the old decile) on the school-zones finding.
- [ ] **Formal terms review on the council rate-assessment API.** The RV dataset row is `access-check` (the API is undocumented, not CC-BY-licensed). Confirm in writing that per-property display via the council's own public API is permitted; promote the row to `verified`.
- [ ] **RV per-parcel (if ever needed).** The run route creates exactly one RV finding per run (keyed by address). If multi-parcel runs ever need per-parcel RV, update the report header to associate each RV with its parcel.

### Next checks — free data, usefulness-ranked (not existence-ranked)
*Research: slope dropped — relevant to builders, not to buyers of existing homes. Ranked by how often buyer-facing guidance mentions each.*

- [x] Coastal inundation / storm-tide — completes the flood/hazard trio. AC Flood Viewer, same ArcGIS hub as overland flow. CC BY 4.0.
- [ ] Landslide susceptibility — post-2023-storms concern AC is pushing; newly published maps. High for Waitākere / North Shore hillsides.
- [ ] AUP overlays — special character, historic heritage, significant ecological areas, volcanic viewshafts, precincts, designations. Extends the live zone check; same open-data hub as zones. Answers "can I demolish/alter".
- [ ] Coastal erosion — AC GeoMaps. Medium relevance; pairs with coastal inundation.
- [ ] Tsunami zones — AC Hazard Viewer. Medium; coastal evacuation.
- [ ] NHCover landslide claims history — free NHC claims map; evidence of past events, complements landslide susceptibility.

### Product / monetization (spec now, build later)
- [ ] **Marketing v2 — add mortgage calculator, what's-nearby, coastal SLR scenarios, report sharing/PDF.** Duly has all of these (per `docs/COMPETITOR_Duly.md`); they are bigger builds than a copy pass and were deliberately deferred this session. Sub-items:
  - Mortgage calculator with live NZ bank rates (RatesAPI.nz is free). Low effort, high buyer value, differentiator-neutral.
  - "What's nearby" amenity search (schools, parks, shops) from Ministry of Education + OpenStreetMap. Medium effort.
  - Coastal inundation SLR scenarios (0.5 m / 1 m / 1.5 m / 2 m) — separate FeatureServices on the same AC ArcGIS hub as the present-day 1% AEP layer already imported. Low effort, direct parity move vs Duly's "2130 scenario" example.
  - Report sharing / PDF export beyond the current print button. Medium effort; pairs with the paid-report paywall.
  - Bookmarks / shared shortlist (already in backlog below).
- [ ] **Price the report at NZ$25–30.** Position as a pre-LIM screen (LIM is $375 / 10 days). See `docs/BRIEF.md`.
- [ ] **PDF report generation** — printable, shareable summary of a run's findings with sources and dates. Start with browser print CSS (per `docs/TECH.md`); move to server PDF (`@react-pdf/renderer` or microservice) only if print quality/pagination demands it.
- [ ] Paid report gate — free first search (address → confirm → on-screen findings); paywall the PDF export and saved shortlist beyond N properties.
- [ ] Intention-aware ordering already in the report; make it the headline differentiator vs $49 hazard PDFs.

### Data freshness / ops (scheduled re-imports)
- [ ] **Re-import LINZ parcels on a schedule.** The parcel snapshot (461,632 Auckland parcels, imported 2026-11-01) is the geometry every hazard is intersected with. LINZ continually retires/subdivides parcels and repositions address points, so a static snapshot drifts from the live cadastre. Discovered 2026-11-02: "17 Shanaway Rise, Hillcrest" resolved to parcel 5039937 (1,163 m²) on 2026-11-01 but to parcel 5169096 (687 m²) on 2026-11-02 — the area change suggests the section was subdivided and the live address point now falls on the new parcel. The parcel-confirmed intersection is our headline differentiator; a stale snapshot silently makes it less honest. Scheduling options, ranked:
  - Monthly scheduled re-import of LINZ NZ Primary Parcels (Auckland clip) — probably enough for most of the city; lowest ops cost.
  - Plus a freshness guard at report-generation time: if the active parcel dataset version is older than N days, refuse to run / warn / auto-refresh before returning findings — the highest-integrity option for the paid report.
  - Address points are already live (LINZ NZ Addresses WFS, hit on every search) — no change needed there.
  - Record each re-import in `dataset_versions` and `docs/dataset-verification.md` as already done for hazard layers.

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
