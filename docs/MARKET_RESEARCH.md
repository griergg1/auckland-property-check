# Auckland Property Check — market research

Desk research (November 2026). Not a substitute for user interviews or pricing experiments.

## Market need

**Official guidance** pushes buyers toward LIMs, property files, inspections, and council viewers—not a single product. After the 2023 Auckland floods, hazard awareness is higher; [Auckland Council](https://www.aucklandcouncil.govt.nz/en/environment/looking-after-aucklands-water/flooding-blockages/check-flood-risks-before-buy-build.html) directs buyers to its flood viewer and LIM. [Toka Tū Ake / NHC](https://www.naturalhazards.govt.nz/be-prepared/home-buyers/before-you-make-an-offer-on-a-house/) emphasises engineers, lawyers, and inspections.

**Friction:** GeoMaps and open GIS are powerful but expert-oriented; buyers must know which layers matter and how to interpret them. [DevStack’s GeoMaps guide](https://devstack.co.nz/development-tools/auckland-council-geomaps) describes a repeatable “five-minute screen” power users run manually—exactly the workflow a product can productise with parcel geometry and plain language.

**Regulatory tailwind:** Plan Change 120 and updated Geomaps flood layers increase LIM hazard visibility; buyers want to understand mapped risk **before** ~$375–500 LIM spend and 10-day waits (figures commonly cited by competitors).

**Future public good:** The [Ministry for the Environment New Zealand Flood Map](https://environment.govt.nz/what-government-is-doing/areas-of-work/climate-change/adapting-to-climate-change/national-adaptation-framework/new-zealand-flood-map/) aims to centralise flood information (broader public release expected from 2027). That may raise baseline awareness and **increase** demand for address-level, intention-aware interpretation—not replace council-specific planning/infrastructure depth.

## Competitive landscape (NZ)

| Product | Scope | Price signal | Strengths | Gaps vs your brief |
|---------|-------|--------------|-----------|-------------------|
| [iQHOME](https://iqhome.co.nz/) | Multi-city hazards; strong Auckland layer list | Free preview + from ~$1.95 / passes | Many official GIS layers; clear sourcing | Less emphasis on parcel confirm, intention ordering, shortlist compare |
| [SiteLenz](https://sitelenz.co.nz/) | Auckland-focused report | Free snapshot; ~$39 complete | Zoning, hazards, consents context, PDF | Paid report model; less explicit on multi-parcel confirm and reproducible rule versions |
| [Know Your Risk NZ](https://knowyourrisk.co.nz/) | Auckland hazards + PC120 | ~$49 PDF | Engineer positioning; 7 layers; hazard score | Hazard-centric; not full planning/infrastructure/compare journey |
| [Property Compass](https://propertycompass.co.nz/) | National, 659 datasets | ~$49 | Breadth across councils | Not Auckland-depth planning/stormwater compare; national generalist |
| [PropIntel](https://propintel.co.nz/) | NZ screening | Free preview | Wide screening (hazards, planning, amenity) | National; “screening” vs parcel-pinned assessment snapshots |
| [Duly](https://duly.co.nz/) | AI property research | Free (account) | Narrative report + assistant | AI-generated; not deterministic GIS rules as core |
| [First Pass](https://www.propertyclub.nz/tools/first-pass) | Docs + address | Club tool | Cross-checks uploaded SPA/title/LIM | Document-centric; not map-first public-data engine |
| **Council GeoMaps** | Auckland | Free | Authoritative, all layers | High skill floor; no compare/export/checklist product |

## Where Auckland Property Check can win

1. **Parcel-confirmed checks** — Intersect full parcel, not point-in-polygon shortcuts; multi-parcel support. Competitors mention address search; your brief makes confirmation a first-class step (trust and accuracy story).

2. **Intention-aware reports** — Same data, different ordering and questions for renovate vs vacant land vs add dwelling. Most hazard reports are one-size-fits-all.

3. **Shortlist comparison** — Side-by-side checks with coverage transparency. Rare in Auckland-specific tools; critical for active buyers comparing 3–5 properties.

4. **Reproducibility** — Snapshot runs to dataset + rule version. Important for lawyers/engineers and for “what did the map say at offer time?”

5. **Honest epistemology** — Four states including `unavailable` and `needs_review`; no AI deciding applicability. Differentiates from AI-first tools and builds professional trust.

6. **Free first search, account for shortlist** — Matches PropIntel/iQHOME preview patterns while pushing comparison as the retention hook.

## Risks and constraints

| Risk | Implication |
|------|-------------|
| **Crowded hazard reports** | Must differentiate on compare, intentions, parcel confirm, and planning/infrastructure—not “another $49 flood PDF.” |
| **Commoditisation** | iQHOME low price and Property Compass national scale compress willingness to pay for hazard-only SKUs. |
| **Data licence** | Competitors cite CC BY council GIS; you must match attribution and not over-claim “official.” |
| **LIM still required** | All serious players disclaim replacing LIM; marketing must say “before LIM / before specialist spend.” |
| **Council free tools** | Power users may stay on GeoMaps; product must save time and reduce interpretation error for non-experts. |
| **Accuracy liability** | Wrong parcel pick or stale layer → reputational harm; dataset registry and versioning are product features, not back-office detail. |

## Suggested positioning (draft)

**For:** Auckland buyers shortlisting standalone houses or vacant sections who plan to live, renovate, extend, or build.

**Category:** Pre-LIM property research and comparison (not a LIM, not valuation, not conveyancing).

**Tagline direction:** “Confirm the land, compare your shortlist, know what to ask before you pay for deep investigations.”

**Avoid claiming:** Pass/fail scores, insurance eligibility, consent certainty, or “official” status.

## Pricing (research only—not a decision)

Market anchors:

- Hazard-focused instant reports: **~$2–49** (iQHOME tiers to ~$49).
- Auckland “complete” early diligence: **~$39** (SiteLenz).
- LIM: **~$375–506** (competitor comparisons; verify with council fee schedule).

Possible models to test later:

- Free first property with core checks; paid compare/export/history.
- Shortlist subscription during active search window.
- B2B2C via lawyers/buyer’s agents (white-label export).

Product brief deliberately avoids locking pricing; validation should come from conversion on **compare + export**, not hazard PDF alone.

## What to validate next (product discovery)

1. Do buyers with 2+ properties on a shortlist pay for comparison vs single-report tools?
2. Does **intention selection** change perceived value vs generic hazard scores?
3. Will users complete **parcel confirmation**, or abandon if extra step vs address-only competitors?
4. Which checks drive “questions for my lawyer” (planning overlays vs stormwater vs flood)?

## Sources consulted

- [iQHOME](https://iqhome.co.nz/)
- [SiteLenz](https://sitelenz.co.nz/)
- [Know Your Risk NZ](https://knowyourrisk.co.nz/)
- [Property Compass](https://propertycompass.co.nz/)
- [PropIntel](https://propintel.co.nz/)
- [Duly](https://duly.co.nz/)
- [First Pass / Property Club NZ](https://www.propertyclub.nz/tools/first-pass)
- [Auckland Council — flood risks before you buy](https://www.aucklandcouncil.govt.nz/en/environment/looking-after-aucklands-water/flooding-blockages/check-flood-risks-before-buy-build.html)
- [Auckland Council geospatial tools](https://www.aucklandcouncil.govt.nz/en/geospatial.html)
- [NZ Flood Map (MfE)](https://environment.govt.nz/what-government-is-doing/areas-of-work/climate-change/adapting-to-climate-change/national-adaptation-framework/new-zealand-flood-map/)
