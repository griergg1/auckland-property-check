# v1.5 build plan — high-value + free, prioritized

**Companion to `docs/PRODUCT_SCOPE.md`.** This is the buildable plan for the
next several sessions. The filter rule is strict: **buyer value High or Very
high AND free to us.** Paid-tier items (title, sales, AVM, consents, floor
plan) are out of this plan — they'll be scoped after v1.5 is live and we have
conversion data.

---

## 1. What's in this plan (the filter result)

Eight items from `PRODUCT_SCOPE.md` §3 passed the high-value + free filter:

1. Rating valuation + council rates (A) — Very high, free, per-property
2. School enrolment zones + Equity Index (E) — Very high, free, MoE
3. The "what to ask" layer, intention-aware (G) — High, free, rule logic
4. Landslide susceptibility (B) — High, free, Auckland Council
5. Unitary Plan overlays — special character, historic heritage, SEA, volcanic viewshafts (C) — High, free, Auckland Council
6. Nearby — transit, parks, coast, shops, within-800m (E) — bundle is high, free, open data
7. Shortlist side-by-side compare (H) — High, free, our own runs
8. PDF export + outstanding-questions list (H) — Very high, free (print CSS first)

## 2. What's deferred (and why)

- **Medium-value free hazards** — coastal SLR scenarios, coastal erosion,
  liquefaction, tsunami, fault lines, HAIL contaminated land, NHCover claims.
  Complete the hazard picture but none individually high. Add in a later
  "hazards completion" wave after the high-value items ship.
- **Medium-value free planning** — precincts, designations, height /
  recession-plane rules. Add after overlays ship; height rules are
  rule-derived and higher effort.
- **Medium-value free neighbourhood** — healthcare, crime, noise, rubbish
  day. Add if the nearby bundle proves the neighbourhood lane is worth it.
- **Low-value free** — earthquake-prone rating, power/gas/fibre. Skip
  unless a buyer asks.
- **All paid** — title, last sale price, sales history, AVM, suburb
  trend, comparables, rental estimate, consent history, floor area, year
  built. Separate paid-tier scope, after v1.5.

---

## 3. Build waves (the order)

Ordering principle: **front-load the items that change how the product
feels**, not just what it covers. RV and school zones are the two that
flip it from a land-buyer tool into a home-buyer tool. The what-to-ask layer
turns raw findings into something a buyer uses. Those three go first.

### Wave 1 — change how the product feels

#### 1.1 Rating valuation + council rates

- **Buyer question:** "Is it worth the asking price? What'll it cost me to run?"
- **What the buyer sees:** CV (capital value), land value, improvement value, date of last RV, and the annual council rates — on the report header, above the findings.
- **Dataset:** Auckland Council rating valuation database (held by QV on behalf of the council; the same data shown free on QV.co.nz and the council's "Search rating" web tool).
- **Licence:** Free, per-property, public. No redistribution restriction on the values themselves; the council's web tool is public.
- **How to get it:** ⚠ **Sourcing check needed (see §4).** The council's
  rating search is a public web form, not a documented API. Options:
  (a) a free per-property feed — confirm whether Auckland Council / QV
  exposes one (check the council's open-data portal and the QV API terms);
  (b) if no free feed, a one-off per-property fetch against the council's
  rating-search endpoint (rate-limited, cached) — confirm the TOS allows it.
- **Effort:** Low once the feed is sourced; the sourcing check is the
  gating step.
- **Depends on:** the confirmed parcel (already live).
- **Risk:** This is the one item in the plan with real data-sourcing risk.
  Everything else below uses a confirmed free feed.

#### 1.2 School enrolment zones + Equity Index

- **Buyer question:** "Is it in a good school zone?"
- **What the buyer sees:** Primary, intermediate, and secondary enrolment
  zones that contain the section, the school names, and each school's
  Equity Index (the replacement for the old decile).
- **Dataset:** Ministry of Education — NZ Schools directory + enrolment
  zones (GIS polygons) + Equity Index. Published on data.govt.nz /
  Koordinates and Education Counts.
- **Licence:** Free, CC BY 4.0 (Crown copyright, MoE).
- **How to get it:** Download the enrolment-zone polygons and the schools
  table; import as a layer (same pattern as the Unitary Plan zone import);
  point-in-polygon against the confirmed parcel centroid. Equity Index
  is a per-school attribute joined on the school id.
- **Effort:** Low. Same import hardening as the existing hazard imports.
- **Depends on:** the confirmed parcel (already live).

#### 1.3 The "what to ask" layer (intention-aware)

- **Buyer question:** "What should I ask, and whom?"
- **What the buyer sees:** A short, plain-English list of questions for
  the agent, the lawyer, the council, and the builder — derived from the
  findings on this report and the buyer's selected intention. E.g. a
  detected overland flow path + "extend" intention → "Ask the builder:
  how does this affect the extension's drainage design?"
- **Dataset:** None external — derived from the report's own findings
  by deterministic rules (the same `RULE_VERSION` pattern as the
  hazard checks).
- **Licence:** Free (our own rule logic).
- **How to get it:** Add a `generate_questions` SQL function that takes
  the run's findings + the intention and returns questions per audience.
  Render as a new section on the report page.
- **Effort:** Low–medium. The rule writing is the work; no data import.
- **Depends on:** the findings already on the report (live + waves 1–2).
  Best built after 1.1 and 1.2 so the questions can cover value and
  schools too.

### Wave 2 — complete the hazard and planning picture

#### 2.1 Landslide susceptibility

- **Buyer question:** "Is the land stable — especially after the 2023 storms?"
- **What the buyer sees:** A finding in the four states, with the
  source link and retrieval date, same shape as the other hazard findings.
- **Dataset:** Auckland Council landslide susceptibility layer (newly
  published; same ArcGIS hub as overland flow / flood prone / coastal
  storm-tide).
- **Licence:** Free, CC BY 4.0.
- **How to get it:** Same import path as the existing hazard layers —
  FeatureServer item id, page, `exceededTransferLimit` handling, draft →
  active versioning. Record in `docs/dataset-verification.md`.
- **Effort:** Medium. Polygon count and layer size to confirm on first pull.
- **Depends on:** the confirmed parcel (already live).

#### 2.2 Unitary Plan overlays

- **Buyer question:** "Can I alter / demolish? Is there a heritage or
  special-character catch on this section?"
- **What the buyer sees:** A new finding per overlay that applies
  (special character, historic heritage, significant ecological area,
  volcanic viewshaft). `detected` / `not_detected` / `unavailable` /
  `needs_review`, same shape as the zone finding.
- **Dataset:** Auckland Unitary Plan overlay layers — separate ArcGIS
  FeatureServices from the same hub as the base zone.
- **Licence:** Free, CC BY 4.0.
- **How to get it:** Same import path. Each overlay is a separate layer;
  import each, add an `assess_*` function per overlay.
- **Effort:** Medium. Several layers; one assess function each.
- **Depends on:** the confirmed parcel (already live) and the base zone
  finding (already live).

### Wave 3 — the neighbourhood bundle

#### 3.1 Nearby — transit, parks, coast, shops, within-800m

- **Buyer question:** "What's the neighbourhood like?"
- **What the buyer sees:** A "Nearby" section on the report — nearest
  train station / bus / ferry, parks and reserves, coast access, and the
  main shops / town centre, each with distance from the section. An
  800m-walkshed summary (not a 500m circle) for the amenity count.
- **Dataset:** Auckland Transport GTFS (transit), Auckland Council parks
  and reserves (open data), LINZ / council coastlines (open data),
  OpenStreetMap (shops, town centres).
- **Licence:** Free. AT GTFS is open; council parks are CC BY 4.0;
  OSM is ODbL.
- **How to get it:** Import the static layers (parks, coast) once;
  query OSM and AT for the dynamic ones; compute distance from the
  confirmed parcel centroid. Use a walkshed (80m network) rather than a
  straight 800m radius if we can — otherwise 800m radius for v1.5 parity
  with Duly, walkshed as a later upgrade.
- **Effort:** Medium. Several small sources; the walkshed is the harder part.
- **Depends on:** the confirmed parcel (already live).

### Wave 4 — compare & export (the retention + the paid bridge)

#### 4.1 Shortlist side-by-side compare

- **Buyer question:** "How does this compare to the others on my shortlist?"
- **What the buyer sees:** A compare page that takes 2–N saved runs
  and shows the same findings side by side, with coverage transparency.
- **Dataset:** Our own persisted runs (already stored).
- **Licence:** Free (our own data).
- **How to get it:** The `/shortlist/compare` route already exists as a
  stub; wire it to list the user's saved runs and render the findings
  side by side. Decide the free-vs-paid line (see §5).
- **Effort:** Medium.
- **Depends on:** runs being persisted (already are).

#### 4.2 PDF export + outstanding-questions list

- **Buyer question:** "Can I keep this and take it to my lawyer?"
- **What the buyer sees:** A print-optimised report view (browser print
  CSS first, per `docs/TECH.md`) with the findings, sources, dataset
  versions, retrieval dates, the intention, the outstanding-questions
  list, and a clear "what this map does NOT establish" line.
- **Dataset:** Our own persisted run snapshot.
- **Licence:** Free (our own data).
- **How to get it:** Print CSS on the existing report page; the print
  button is already there. Add the outstanding-questions list (from 1.3)
  to the print view. Server-side PDF (`@react-pdf/renderer` or a
  microservice) only if print quality/pagination demands it.
- **Effort:** Medium. Print CSS is the cheap path; server PDF is the
  expensive path, gated by a quality check.
- **Depends on:** 1.3 (questions list) and the report being complete
  enough to print.

---

## 4. Data-sourcing risks (the gating step before Wave 1)

Only one item in the plan has real sourcing risk: **rating valuation +
council rates (1.1).** Everything else uses a confirmed free feed.

**Step 0 before Wave 1:** confirm the RV feed. Concretely:

1. Check the Auckland Council open-data portal for a per-property rating
   valuation feed (CSV / API).
2. Check QV's API terms (QV.co.nz shows RV free per-property; an API
   may exist with a free tier or a paid tier — if paid, 1.1 moves to the
   upsell lane, not v1.5 free).
3. If neither exists, confirm whether the council's "Search rating" web
   endpoint can be queried per-property at low volume (TOS-permitted,
   rate-limited, cached for N days).

If 1.1 turns out to need a paid feed, it drops out of v1.5 free and the
plan continues with 1.2 (school zones) as the new first item. The plan
does not block on 1.1 — it reorders.

---

## 5. The one paid-tier decision that touches v1.5

The user has said: don't worry about the paid layer right now. There is
one v1.5 decision that depends on it: **the shortlist-compare
paywall line** (4.1). The brief says "free first search; account for
shortlist beyond a small number."

**Decision (2026-11-02): free users can compare up to 3 properties
side by side. Comparing 4 or more requires the paid PDF.** This does not
need the paid tier to exist — only the number to be decided, and it now
is. Build 4.1 against this limit.

---

## 6. What the next session picks up

**Session N+1 (next):**
1. Run the §4 sourcing check for rating valuation. Decide: 1.1 is in
   v1.5 free, or 1.1 moves to upsell and 1.2 becomes the first build.
2. If 1.1 is in: build 1.1 (rating valuation + council rates) and
   1.2 (school zones + Equity Index). Ship both. Rewrite the hero to
   lead with the home buyer ("what it's worth and what's on it," not
   just "what's on it").
3. If 1.1 is out: build 1.2 first, then 1.3 (what-to-ask), then 1.1
   when a feed is found.

**Session N+2:** Wave 2 (landslide + overlays).

**Session N+3:** Wave 3 (nearby bundle).

**Session N+4:** Wave 4 (compare + PDF export).

The hero rewrite happens at the end of Session N+1, once the first
home-buyer findings (RV and/or school zones) are live — so the new copy
is backed by real findings, not promised ones.

---

## 7. Open question for you

~~One decision before Session N+1 starts: **the shortlist-compare paywall
line (§5).** How many properties can a free user compare side by side
before the paid PDF is required — 3? 5? Unlimited free, paywall only on
the PDF? Pin the number and 4.1 builds clean.~~

**Resolved 2026-11-02: 3 properties free; 4+ requires the paid PDF.** See §5.
No open questions remain for v1.5.
