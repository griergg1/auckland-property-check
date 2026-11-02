# Next session — prompt

Start the session by reading `progress.md` and running the start-of-session checklist. The phase is **v1.5 — the home-buyer report**, built on top of the Phase 0.5 PoC that is live on Vercel with parcels, overland flow, flood prone, coastal inundation (1% AEP storm-tide), and Unitary Plan zone checks. **Do not redo any of those imports, the domain, the basemap, or the parcel picker.**

**Goal:** Start building v1.5. Run the rating-valuation sourcing check, then build Wave 1 of the v1.5 plan (the three items that change how the product *feels*), then rewrite the home page hero to lead with the home buyer — backed by the new live findings, not promised ones.

**Read these first — they are the source of truth for this session:**
- `docs/PRODUCT_SCOPE.md` — the full scope of a property buying report, organised by buyer question. The "why."
- `docs/PRODUCT_SCOPE_V15_PLAN.md` — the prioritized build plan (high-value + free, in 4 waves). The "what and when." This session is **Wave 1** (§3.1) plus the §4 sourcing check and the hero rewrite at the end.
- `.agents/product-marketing.md` — the voice and positioning rules. The hero rewrite must follow these.
- `docs/dataset-verification.md` — the dataset ledger. Every new layer imported this session gets an entry here, same as the existing hazard layers.

**Context:** User feedback (2026-11-02) was that the Phase 0.5 PoC "feels like a tool for buying land, not a house" and covers "only a small percentage of what it needs to do." A normal home buyer's first questions are value, schools, and neighbourhood — none of which we answer today. v1.5 fixes that. Wave 1 is the three items that flip the product from a land-buyer tool into a home-buyer tool: rating valuation + council rates, school zones, and the intention-aware "what to ask" layer.

**Branching step — do this FIRST, before building anything:**

Run the §4 sourcing check for **rating valuation + council rates** (plan item 1.1). Concretely:
1. Check the Auckland Council open-data portal for a per-property rating-valuation feed (CSV / API).
2. Check QV's API terms (QV.co.nz shows RV free per-property; an API may exist with a free tier or a paid tier).
3. If neither exists, confirm whether the council's "Search rating" web endpoint can be queried per-property at low volume (TOS-permitted, rate-limited, cached for N days).

Then decide the order:
- **If a free feed exists** → build 1.1 (rating valuation + council rates) first, then 1.2 (school zones + Equity Index), then 1.3 (what-to-ask layer).
- **If no free feed** → 1.1 moves to the paid upsell lane. Build 1.2 first, then 1.3, then 1.1 when a feed is found. Log the sourcing outcome in the session log and in `docs/dataset-verification.md`.

**Scope for this session (Wave 1 of `PRODUCT_SCOPE_V15_PLAN.md`):**

1. **1.1 Rating valuation + council rates** (if the sourcing check passes). What the buyer sees: CV (capital value), land value, improvement value, date of last RV, and the annual council rates — on the report header, above the findings. Same four-state shape as the existing findings (`detected` / `not_detected` / `unavailable` / `needs_review`); `unavailable` if the feed can't return a value for this parcel. Per-finding limitations line: "This is the council's rating valuation, not a market valuation or a registered valuation." Import the layer with the same hardening as the existing hazard imports (reject ArcGIS error body, honour `exceededTransferLimit`, refuse to activate an empty import, mark the version failed on throw, draft → active). Record in `docs/dataset-verification.md`.
2. **1.2 School enrolment zones + Equity Index.** What the buyer sees: primary, intermediate, and secondary enrolment zones that contain the section, the school names, and each school's Equity Index (the replacement for the old decile). Dataset: Ministry of Education — NZ Schools directory + enrolment zones (GIS polygons, data.govt.nz / Koordinates) + Equity Index. Licence: free, CC BY 4.0 (Crown copyright, MoE). Point-in-polygon against the confirmed parcel centroid. Same import hardening. Same four-state shape; `unavailable` if the parcel is outside the MoE coverage.
3. **1.3 The "what to ask" layer (intention-aware).** What the buyer sees: a short, plain-English list of questions for the agent, the lawyer, the council, and the builder — derived from the findings on *this* report and the buyer's selected intention. E.g. a detected overland flow path + "extend" intention → "Ask the builder: how does this affect the extension's drainage design?" Dataset: none external — derived from the report's own findings by deterministic rules (same `RULE_VERSION` pattern as the hazard checks). Add a `generate_questions` SQL function that takes the run's findings + the intention and returns questions per audience. Render as a new section on the report page. Follow the voice in `.agents/product-marketing.md` — plain English, no jargon, talk to the buyer.
4. **Rewrite the home page hero** to lead with the home buyer, not the land buyer. Do this LAST, after 1.1 and/or 1.2 are live, so the new copy is backed by real findings on the report — not promised ones. Replace "section" with "property" throughout the hero and the "who it's for" section. Lead with "what it's worth and what's on it," not just "what's on it." Keep the honest tone (not a LIM, sources cited, four states). Keep the worked example honest — re-run the golden address and update the worked-example finding card to match what the live report returns on the day of the session (the parcel data has shifted before; do not trust the stale log).

**Out of scope for this session (do not start):**
- Wave 2 (landslide susceptibility, Unitary Plan overlays) — next session.
- Wave 3 (nearby bundle: transit, parks, coast, shops, 800m) — later.
- Wave 4 (shortlist compare, PDF export) — later. The paywall line is already pinned (3 properties free; 4+ requires the paid PDF — see `PRODUCT_SCOPE_V15_PLAN.md` §5), so 4.1 builds clean when we get there; do not build it this session.
- The paid tier (title, sales, AVM, consents, floor plan) — separate scope after v1.5 is live.
- Medium-value free hazards (coastal SLR scenarios, coastal erosion, liquefaction, tsunami, fault lines, HAIL, NHCover) — a later "hazards completion" wave.
- New data imports beyond Wave 1.
- Re-importing LINZ parcels (that's a separate backlog item — "Data freshness / ops" in `progress.md`).

**Verify with:**
- One real address from the golden set run end-to-end (search → confirm → report) to confirm the new findings (RV and/or school zones, plus the what-to-ask section) render and the existing flow still works.
- `npm run lint`, `npm run typecheck`, `npm run test` (Vitest; the live Supabase integration test needs network).
- Manual mobile-width pass on the report page (new findings + what-to-ask section) and the home page (hero rewrite).
- CodeRabbit review of session changes; fix or document any Critical / Warning findings.
- Then run the closeout in `progress.md` and add a Session log entry (Done / Verified / Next / Notes). Update the Backlog: mark the Wave 1 items done, and note the RV sourcing outcome (free feed found, or 1.1 moved to upsell).

**Honest constraints — do not break these:**
- The four-state finding model is the headline differentiator. Never say "all clear" on missing data — `unavailable` is an honest state, not a pass.
- Every finding links to its source and a retrieval date. The narrative is deterministic, not AI-generated.
- The worked example on the home page must reflect a real run on the day of the session, not a stale log entry. Re-run the golden address and update the card.
- The hero rewrite must follow `.agents/product-marketing.md` (plain English, talk to the buyer, honest over hype, "property" not "section").
