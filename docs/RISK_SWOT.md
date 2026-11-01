# Auckland Property Check — SWOT and risk register

Living document for product and delivery risk. Review when enabling a new dataset or shipping a major feature.

## SWOT

### Strengths

- Clear product boundaries (not a LIM) aligned with how competitors and council already frame the category.
- **Deterministic PostGIS + rule versions** — defensible, testable, auditable; avoids AI liability on “does this hazard apply?”
- **Parcel confirmation + multi-parcel** — accuracy story competitors often skip.
- **Intention-aware ordering + comparison** — fits real buyer behaviour (3–5 properties, different plans per site).
- **Reproducible snapshots** — export traceable to dataset versions (useful for advisers).
- Stack is mainstream (Next.js, Supabase, MapLibre) — hireable, documented.

### Weaknesses

- Greenfield: no brand, SEO, or trust yet vs iQHOME, SiteLenz, Know Your Risk.
- Auckland-only v1 limits TAM vs national tools (Property Compass, PropIntel).
- Heavy dependence on **correct dataset licensing** and refresh discipline — operational burden.
- Parcel confirmation adds friction vs one-click address reports.
- No consent/title/valuation in v1 — some buyers expect “everything in one PDF.”

### Opportunities

- Post-2023 floods + PC120: buyers and lawyers more hazard-literate; demand for **plain English before LIM**.
- MfE national flood map (from ~2027) may drive traffic to interpretation tools.
- Professional channel: buyer’s agents, lawyers wanting structured “questions lists” per property.
- Seller-side pre-listing check (brief mentions “what buyers will see”) — secondary persona later.
- Document upload phase (brief “later”) could leapfrog pure map tools.

### Threats

- **Price compression** on hazard-only reports (iQHOME from ~$1.95).
- Incumbents add comparison or parcel pick quickly.
- Council improves GeoMaps UX or bundles guidance — reduces pain for DIY users.
- **Wrong finding** (stale layer, wrong parcel) → social media / Fair Trading scrutiny.
- LINZ address schema change (2026) breaking search if not adapted.
- Open-data licence changes or API rate limits on Auckland Council services.

## Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R1 | Wrong parcel selected → incorrect findings | Medium | High | Mandatory map confirm; `needs_review` on ambiguity; disclaimer on title extent |
| R2 | Stale dataset vs live Geomaps | Medium | High | Version registry; source dates in UI; refresh schedule; keep last good import |
| R3 | API/import failure shown as “clear” | Low | Critical | Four status enum; tests; never default to `not_detected` on error |
| R4 | Layer used without bulk-reuse rights | Medium | High | Per-layer verification doc; legal review before enable; attribution |
| R5 | Hazard wording overclaims (e.g. “will flood”) | Medium | High | Template review; describe mapped evidence only; limitations field |
| R6 | Competitor parity on hazards only | High | Medium | Lead messaging on compare + intentions + parcel geometry |
| R7 | Supabase/Vercel cost at scale (geometry storage) | Medium | Medium | Auckland clips; retire old versions; index sensibly |
| R8 | User expects LIM-equivalent | High | Medium | Persistent disclaimers; export “questions for LIM/lawyer” |
| R9 | DEM/slope misleading where resolution poor | Medium | Medium | `unavailable` when coverage insufficient; document resolution |
| R10 | Saved report accessed by wrong user | Low | Critical | RLS + auth tests; no guessable run IDs without ownership |
| R11 | Demo fixtures confused with live data | Low | High | Separate schema/flag; banner in UI |
| R12 | LINZ WFS/query changes break search | Medium | Medium | Adapter layer; monitoring on import; integration tests |

## Assumptions to monitor

1. Buyers will tolerate an extra parcel-confirm step if findings feel more trustworthy.
2. Comparison is a stronger monetisation hook than a single hazard PDF.
3. Auckland Council open GIS layers remain accessible for the import/query pattern we choose.
4. Template-based explanations are enough for v1 NPS/trust (no AI required).

## Pre-launch gates

- [ ] 20–30 property golden set passes acceptance tests (technical brief).
- [ ] Every enabled layer has row in dataset verification ledger (licence, URL, date).
- [ ] Legal review of terms/disclaimers (not a LIM, no ownership, no insurance/consent guarantees).
- [ ] Side-by-side check on 5 properties vs manual GeoMaps for regression trust.
