# Auckland Property Check — progress log

Living record of what was done, what’s next, and **session rituals** so work stays shippable (no Duly-style “half-finished queue” code in the repo).

**Related docs:** [docs/BRIEF.md](docs/BRIEF.md) · [docs/TECH.md](docs/TECH.md) · [docs/MARKET_RESEARCH.md](docs/MARKET_RESEARCH.md) · Plan: `.cursor/plans/` or team copy of implementation plan

**Current target phase:** Phase 0.5 PoC (not started)

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

## 2026-11-01 — PoC scaffold + Supabase + CodeRabbit

**Goal:** Build the Phase 0.5 PoC (search → confirm → report) end to end.

**Done:**
- Scaffolded Next.js 16 (App Router, TS, Tailwind) into `web/`
- Installed deps: @supabase/supabase-js, @supabase/ssr, maplibre-gl, zod; dev: vitest, @turf/turf, ws, dotenv
- Supabase migrations applied to `nwltvcqnflsezmthcfuu`:
  - `core_schema` (datasets, dataset_versions, parcels, assessment_runs, findings + enums)
  - `hazard_features_and_demo_seed` (hazard_features table + demo datasets/versions)
  - demo parcel + rear-of-section overland flow fixture (address point outside hazard, parcel intersects)
  - `assess_overland_flow` PostGIS function (rules.v1, four states)
  - `parcel_geojson_4326` helper function
- App code: supabase clients, Zod schemas, assessment module, 3 API routes + GET [runId], 3 screens (search/confirm/report), MapView (MapLibre + LINZ basemap)
- Vitest: rear-hazard geometry test (3 passing); live integration test (skipped without service role key)
- CodeRabbit review (8 findings): fixed 7, skipped 1 (next.config Tailwind/Next 16 config — build passes, valid)

**Verified:** lint ✅ / typecheck ✅ / test ✅ (3 pass, 1 skip) / build ✅ / CodeRabbit ✅ / committed ✅ / pushed ✅

**Next:** Add service role key to `web/.env.local` from dashboard; deploy to Vercel and wire `morebeanz.com` domain; smoke test dev server end to end.

**Notes:**
- `.env.local` has anon key (publishable, safe); service role key is a placeholder — add from [Settings → API](https://supabase.com/dashboard/project/nwltvcqnflsezmthcfuu/settings/api) before running the integration test or local dev server.
- Repo: https://github.com/griergg1/auckland-property-check (public, `main` pushed).
- Domain `morebeanz.com` noted for Vercel deployment later.
- Demo fixtures clearly labelled in UI; not real assessments.

**Notes:**
- **Repurpose Supabase project** (same ref `fzrndnyzqqboqcaelgoz`) for Auckland Property — avoids a 5th Supabase project charge.
- **Vercel delete (you confirm):** [Delete godrinkfree project in Vercel settings](https://vercel.com/d?to=%2Fgriergg1s-projects%2Fgodrinkfree%2Fsettings%2Fgeneral%23delete-project&title=Review+in+Vercel)
- Supabase project **pause/delete** full project: only via [Supabase dashboard](https://supabase.com/dashboard/project/fzrndnyzqqboqcaelgoz/settings/general) if you prefer a net-new project later (not recommended for billing).

---

## Backlog (high level)

Use plan todos for detail; this is a short pointer list.

- [ ] Scaffold Next.js (App Router, TS, Tailwind, pinned deps)
- [ ] Supabase + PostGIS migrations (datasets, parcels, runs, findings)
- [ ] LINZ Auckland parcel/address path
- [ ] One verified Auckland Council layer + PostGIS check
- [ ] PoC UI: search → confirm → report
- [ ] Vitest: rear-of-section intersection case
- [ ] CodeRabbit + git push in every closeout once code exists

---

## Principles (reminder)

- **No user-facing report queue** — sync assessment; imports offline.
- **Four finding states** — never “all clear” on failure.
- **Parcel geometry**, not address point alone.
- **Demo vs live** clearly labelled when fixtures exist.
