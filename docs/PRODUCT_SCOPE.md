# morebeanz — property buying report: full scope discovery

**Status:** Discovery — not a build plan. This doc maps the *full* set of things a
property buying report could cover, marks each by data source, licence, effort,
and buyer value, and recommends a new scope direction. It exists so we stop
re-arguing scope every session.

**Why this doc exists:** The product brief (`docs/BRIEF.md`) deliberately
narrowed v1 to mapped hazards + planning for buyers of standalone houses and
vacant sections. Ship-first, that was the right call — it got us to a live
PoC with parcels, overland flow, flood prone, coastal storm-tide, and the
Unitary Plan zone. But user feedback (2026-11-02) is that this narrow scope
"feels like a tool for buying land, not a house," and is "only a small
percentage of what it needs to do." A normal home buyer's first questions are
value, sales history, schools, and neighbourhood — none of which we answer
today. This doc is the comprehensive scope check the brief was missing.

**Relationship to the brief:** The brief's v1 scope should be reframed as
"Phase 0.5 PoC" (hazards + planning, live now). The new target product is a
**home-buyer report**, not a hazards-and-planning report. A concrete
recommendation for the rewrite is in §5.

---

## 1. Methodology

This doc is built from:

- **Official buyer-guidance sources:** settled.govt.nz, Consumer Protection
  NZ, NZ Law Society (property buying guides), Auckland Council ("check
  flood risks before you buy/build"), Toka Tū Ake / NHC ("before you make an
  offer on a house").
- **Competitor scan:** `docs/COMPETITOR_Duly.md` and `docs/MARKET_RESEARCH.md`
  (Duly, QV, Homes.co.nz, OneRoof, iQHOME, SiteLenz, Know Your Risk, Property
  Compass, PropIntel, First Pass).
- **Data reality:** what is free / public per-property in NZ, what is paid
  per-report, and what needs a physical inspection (out of lane).
- **What we already have:** the live Phase 0.5 checks (parcels, overland
  flow, flood prone, coastal storm-tide, Unitary Plan base zone).

The scope is organised by **buyer question**, not by data layer — because
that is the user's point. A buyer does not care about "the overland flow
path layer"; they care whether the section floods.

---

## 2. The buyer's actual questions, in their order

A typical Auckland home buyer works through these in roughly this sequence.
The report should answer them in this order, not in the order that matches
our data layers.

1. **Is it worth the asking price?** → rating valuation, recent sales,
   comparable sales, AVM, suburb trend.
2. **Is the land safe to build on / does it flood?** → overland flow, flood
   prone, coastal storm-tide, coastal erosion, landslide, liquefaction, fault
   lines, contaminated land.
3. **Can I do what I want with it?** → Unitary Plan zone, overlays, precincts,
   designations, height/recession planes, consent history.
4. **What's the neighbourhood like?** → school zones, transit, parks, coast,
   shops, healthcare, noise, crime.
5. **What's it going to cost me to run?** → council rates, insurance
   estimate, rough running costs.
6. **What should I ask, and whom?** → questions for the agent, lawyer, council,
   builder, bank, insurer.
7. **How does it compare to the others on my shortlist?** → side-by-side
   compare, export.

Each of those maps to a category in §3.

---

## 3. Full scope map

**Lane key:**
- **v1.5 free** — free / public data, fits the free report and the $25–30 paid PDF envelope.
- **upsell** — paid data cost; belongs in a paid "full report" tier above the free screen, or as a per-property upsell.
- **out of lane** — needs a physical inspection or professional; we route to one and do not build it.

### A. The property itself (identity & physical)

| Item | Source | Licence | Effort | Buyer value | Lane |
|---|---|---|---|---|---|
| Address, legal description, parcel id, area | LINZ parcels + addresses | Free (CC BY 4.0) | Done | Foundational | v1.5 free (live) |
| Title — covenants, easements, restrictions, caveats | LINZ Record of Title (Landonline) | Paid per title | Medium | Top due-diligence item | upsell |
| Estate type (freehold / cross-lease / unit / leasehold) | Title | Paid per title | Low | High (changes what you own) | upsell |
| Rating valuation (CV, land value, improvement value, RV date) | Auckland Council rating database / QV | Free, per-property | Low | Very high — "what's it worth to the council" | **v1.5 free** |
| Council rates (annual $) | Auckland Council rating database | Free, per-property | Low | High — running cost | **v1.5 free** |
| Bedrooms, bathrooms, floor area, year built | Council property file | Per-property fee | Medium | High | upsell |
| Building consent history (consents, code of compliance) | Council property file | Per-property fee | Medium | High (unconsented works) | upsell |
| Earthquake-prone rating | Council register | Free | Low | Niche | v1.5 free |

### B. Natural hazards (on the land)

| Item | Source | Licence | Effort | Buyer value | Lane |
|---|---|---|---|---|---|
| Overland flow paths | Auckland Council | Free (CC BY 4.0) | Done | High | v1.5 free (live) |
| Flood prone areas | Auckland Council | Free (CC BY 4.0) | Done | High | v1.5 free (live) |
| Coastal storm-tide 1% AEP (present-day) | Auckland Council | Free (CC BY 4.0) | Done | High | v1.5 free (live) |
| Coastal storm-tide SLR scenarios (0.5/1/1.5/2m, 2130) | Auckland Council (separate FeatureServices) | Free (CC BY 4.0) | Low | Medium (long horizon) | **v1.5 free** |
| Coastal erosion | Auckland Council GeoMaps | Free | Medium | Medium (coastal only) | v1.5 free |
| Landslide susceptibility | Auckland Council (newly published) | Free | Medium | High (Waitākere / North Shore) | v1.5 free |
| Liquefaction | NZGS / council | Free | Medium | Medium | v1.5 free |
| Active fault lines | GNS Active Faults Database | Free | Low | Low (rare) | v1.5 free |
| Tsunami zones | Auckland Council Hazard Viewer | Free | Low | Low (coastal evacuation) | v1.5 free |
| Contaminated land (HAIL) | Ministry for the Environment list | Free | Medium | Medium | v1.5 free |
| NHCover landslide claims history | NHC claims map | Free | Medium | Medium (evidence of past events) | v1.5 free |
| Meth contamination | Needs physical test | — | — | — | out of lane |
| Weathertightness / asbestos | Needs building inspection | — | — | — | out of lane |

### C. Planning & consent

| Item | Source | Licence | Effort | Buyer value | Lane |
|---|---|---|---|---|---|
| Unitary Plan base zone | Auckland Council | Free (CC BY 4.0) | Done | High | v1.5 free (live) |
| Overlays (special character, historic heritage, SEA, volcanic viewshafts) | Auckland Council | Free | Medium | High (alter/demolish) | **v1.5 free** |
| Precincts | Auckland Council | Free | Medium | Medium | v1.5 free |
| Designations | Auckland Council | Free | Medium | Medium | v1.5 free |
| Height / recession planes / yard rules (rule-derived) | Derived from ePlan rules | Free (rule logic) | High | High (extenders) | v1.5 free (later) |
| Resource / building consent history | Council property file | Per-property fee | Medium | High | upsell |

### D. Market & value

| Item | Source | Licence | Effort | Buyer value | Lane |
|---|---|---|---|---|---|
| Rating valuation (CV, LV, IV, RV date) | Auckland Council / QV | Free, per-property | Low | Very high | **v1.5 free** |
| Last sale price + date | QV / CoreLogic / Homes.co.nz feed | Paid | Medium | Very high | upsell |
| Sales history (last ~3 sales) | QV / CoreLogic / Homes.co.nz feed | Paid | Medium | High | upsell |
| AVM (automated valuation) | CoreLogic / QV / Homes.co.nz | Paid | Medium | Very high — but competes with QV e-Report ($29.99) | upsell |
| Suburb median, days-on-market, trend | REINZ / OneRoof | Paid or free (partial) | Medium | High | upsell (or v1.5 free if a free feed exists) |
| Comparable recent nearby sales | QV / CoreLogic | Paid | Medium | High | upsell |
| Rental estimate | Trade Me / Homes.co.nz | Paid | Low | Medium (investors) | upsell |

### E. Neighbourhood & amenities

| Item | Source | Licence | Effort | Buyer value | Lane |
|---|---|---|---|---|---|
| School enrolment zones (primary, intermediate, secondary) | Ministry of Education | Free (GIS) | Low | Very high for families | **v1.5 free** |
| School Equity Index / decile | Ministry of Education | Free | Low | High for families | **v1.5 free** |
| Train station, bus, ferry | Open data (AT / council) | Free | Low | High | **v1.5 free** |
| Parks, reserves, playgrounds | Council / open data | Free | Low | Medium | **v1.5 free** |
| Coast / beach access | Open data | Free | Low | Medium | **v1.5 free** |
| Shops, town centres | OpenStreetMap | Free | Low | Medium | **v1.5 free** |
| Amenities within 800m (Duly parity) | OSM + MoE | Free | Medium | Medium | **v1.5 free** |
| Healthcare (GP, hospital) | Ministry of Health | Free | Low | Low | v1.5 free |
| Crime statistics | Police (open data) | Free | Low | Medium | v1.5 free |
| Noise (airport flight paths, motorways) | Council / open data | Free | Low | Medium | v1.5 free |

### F. Infrastructure & services

| Item | Source | Licence | Effort | Buyer value | Lane |
|---|---|---|---|---|---|
| Stormwater, wastewater, water supply | Auckland Council | Free | Medium | Medium | v1.5 free (later) |
| Power, gas, fibre | Utility companies | Free (coverage maps) | Low | Low | v1.5 free (later) |
| Rubbish collection day | Auckland Council | Free | Low | Low | v1.5 free (later) |

### G. The "what to ask" layer (intention-aware)

| Item | Source | Licence | Effort | Buyer value | Lane |
|---|---|---|---|---|---|
| Questions for the agent | Derived from findings + intention | Free (rule logic) | Low | High | **v1.5 free** |
| Questions for the lawyer | Derived from findings + intention | Free (rule logic) | Low | High | **v1.5 free** |
| Questions for the council | Derived from findings + intention | Free (rule logic) | Low | High | **v1.5 free** |
| Questions for the builder / inspector | Derived from findings + intention | Free (rule logic) | Low | High | **v1.5 free** |
| Questions for the bank / insurer | Derived from findings + intention | Free (rule logic) | Low | Medium | **v1.5 free** |

### H. Compare & export

| Item | Source | Licence | Effort | Buyer value | Lane |
|---|---|---|---|---|---|
| Shortlist side-by-side compare | Our own runs | Free | Medium | High (retention hook) | **v1.5 free** |
| PDF export (printable, shareable) | Our own snapshot | Free (print CSS first) | Medium | High (the paid product) | **v1.5 free / paid PDF** |
| Outstanding questions list (to take to the lawyer) | Derived from findings | Free (rule logic) | Low | Very high | **v1.5 free** |

---

## 4. What we already have vs what the full scope adds

**Live today (Phase 0.5 PoC):** parcels, overland flow, flood prone,
coastal storm-tide 1% AEP, Unitary Plan base zone. Five items, all
hazards + planning, all free CC BY 4.0.

**The full scope adds, in buyer-value order:**

1. **Value & cost (free):** rating valuation, council rates. Two free,
   per-property, low-effort items that change the report from "is this land
   safe" into "is this property worth it." Highest home-buyer value per
   unit of effort in the whole map.
2. **Neighbourhood (free):** school zones + Equity Index, transit, parks,
   coast, shops, within-800m. The Duly-parity block. Free, open data.
   Big change in how the product *feels* — from due-diligence tool to
   home-buyer tool.
3. **More hazards (free):** coastal SLR scenarios, coastal erosion,
   landslide susceptibility, liquefaction, fault lines, tsunami, HAIL
   contaminated land, NHCover claims. Completes the hazard picture. All
   free council / GNS / NHC sources.
4. **More planning (free):** overlays, precincts, designations. Completes
   the "can I do what I want" picture. Free council layers.
5. **The "what to ask" layer (free):** intention-aware questions for
   agent / lawyer / council / builder / bank. This is the layer that turns
   raw findings into something a buyer *uses*. Free (rule logic).
6. **Compare & export (free + paid):** shortlist side-by-side, PDF
   export, outstanding-questions list. The retention hook and the paid
   product.
7. **Title, sales, AVM, consents, floor plan (paid upsell):** the
   full-report tier. Paid data costs; the fork in §6 decides whether we
   build this lane at all.

## 5. Recommended scope direction

**Reframe the product:** from "Auckland property check (hazards +
planning)" to **"Auckland home-buyer report — what the council and LINZ
know about this property, for free, before you pay for the LIM, the title,
or a valuation."**

**v1.5 — the free home-buyer report (target: next 2–3 sessions):**
- Keep everything live today.
- Add: rating valuation + council rates (A.1).
- Add: school zones + Equity Index + transit + parks + coast + shops +
  within-800m (E.1–E.6).
- Add: coastal SLR scenarios, coastal erosion, landslide, liquefaction,
  fault lines, tsunami, HAIL, NHCover claims (B).
- Add: overlays, precincts, designations (C).
- Add: the "what to ask" layer, intention-aware (G).
- Add: shortlist compare + PDF export + outstanding-questions list (H).
- Rewrite the hero and home page to lead with the home buyer, not the
  land buyer ("property," not "section"; "what it's worth and what's on
  it," not just "what's on it").

**Paid "full report" tier (target: after v1.5, decision in §6):**
- Title (covenants, easements, restrictions).
- Last sale price + sales history.
- AVM.
- Consent history + floor area + year built (from council property file).
- Priced to cover per-report data cost; positioned above the $25–30 PDF,
  or as an upsell on top of it.

**Out of lane (route to a professional, never build):**
- Meth contamination (physical test).
- Weathertightness / asbestos (building inspection).
- Registered valuation (physical inspection).
- Building-consents correctness (council property file + site visit).

## 6. What this means for the brief

The brief's v1 scope ("mapped hazards + planning for standalone houses and
vacant sections") should be **reframed as Phase 0.5 PoC** — the slice that
shipped first, not the product. The product is the v1.5 home-buyer report in
§5. Concretely, the brief should be updated to:

- State the product is a **home-buyer report**, not a hazards report.
- Move the current v1 scope into a "Phase 0.5 PoC — live" section.
- Add the v1.5 scope (§5) as the new target.
- Add the paid-tier fork (§6 open question) as a decision to make before
  the paid tier is built.
- Keep the existing "out of lane" list and extend it with the items above.

I have not rewritten the brief yet — that's a separate step once you've
signed off the scope direction in this doc.

## 7. Open questions for you

1. **Paid tier: yes / no / later?** Do we build a paid "full report" tier
   (title, sales, AVM, consents), or stay free-only and keep those out of
   scope? This is the fork that decides everything downstream — it
   determines whether we're a free pre-LIM screen (broad, shallow, free) or
   a paid full report (narrower, deeper, paid data costs). My instinct: do
   v1.5 free first, decide on the paid tier after v1.5 is live and we have
   conversion data.
2. **AVM partner:** if we do the paid tier, AVM needs a data partner
   (CoreLogic, QV, or Homes.co.nz). Each has different cost and terms. We
   don't need to pick now — only before the paid tier is built.
3. **School zones — enrolment vs catchment:** NZ moved from school deciles
   to the Equity Index. We should show the Equity Index and the enrolment
   zone, not a decile. Confirm that's the right framing for buyers.
4. **"Within 800m" parity with Duly:** do we match Duly's 800m radius, or
   use a different boundary (walkshed, suburb, school walk-zone)? 800m is
   the obvious parity move; walkshed is better but harder.
5. **Compare UX:** shortlist side-by-side is the retention hook. How many
   properties can a free user compare before hitting the paywall? (Brief
   says "beyond a small number.") Pin the number before building.

## 8. What I'd build first in v1.5 (if you sign off the direction)

In buyer-value-per-effort order, not data-layer order:

1. Rating valuation + council rates (free, per-property, low effort).
2. School zones + Equity Index (free, MoE, low effort).
3. The "what to ask" layer (free, rule logic, low effort).
4. Nearby: transit + parks + coast + shops (free, open data, medium effort).
5. Coastal SLR scenarios (free, low effort, direct parity move vs Duly).
6. Landslide susceptibility (free, medium effort, high buyer value).
7. Shortlist compare + PDF export (free + paid, medium effort).

Items 1–3 are the ones that change how the product *feels* — they turn it
from a land-buyer tool into a home-buyer tool. Items 4–7 complete the
picture. The paid tier is a separate decision after v1.5 is live.

---

**Next step:** you sign off (or correct) the scope direction in §5 and the
v1.5 build order in §8. Then I rewrite `docs/BRIEF.md` to match, and the
home page hero stops reading as a land-buyer tool.

