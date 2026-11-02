# Competitor research — Duly (duly.co.nz)

Researched 2026-11-02. Public site only (no account created). Source: https://duly.co.nz/ and its sub-pages, sitemap, and one sample report.

## What Duly is

Free NZ property research service. Core offer: an **AI-generated property report** that pulls public + third-party sources into one narrative, with an **AI assistant** for follow-up questions. Free account (email verify, no credit card) unlocks full reports, PDFs, bookmarks, shortlists, notebooks. Reports are public/shareable (indexed in search engines).

## Pages / structure

- `/` — hero ("Property research. Completely free."), 4-step "Duly journey" (address → …), three pillars (Risk & compliance context, Market & ownership picture, a report you can keep exploring).
- `/about` — mission, story, values (Transparency, Accessibility, Excellence, Empowerment), team (2 named people).
- `/support`, `/contact` — FAQs, email, contact form.
- `/flood-map` — standalone free **national flood map** (all 16 regions + Rakiura + Chatham Islands), with per-region coverage/licence notes. 500m search-circle model.
- `/ko-map` — standalone free **Kāinga Ora (state housing) parcel map**.
- `/calculator` — free **mortgage repayment calculator** with live published bank rates (RatesAPI.nz).
- `/mcp-integration`, `/mcp-docs` — **MCP server** (21 read-only tools) for ChatGPT/Claude.
- `/property-report/{id}` — public, shareable, AI-generated report. Snapshot (price, CV, market trend, year built), research overview, risk areas.
- `/terms`, `/privacy`.

## What Duly does that we don't

| Capability | Duly | us (morebeanz) |
|---|---|---|
| AI-generated narrative report + "next steps" | ✅ | ❌ deterministic findings only |
| AI assistant for follow-up questions | ✅ | ❌ |
| National coverage (all 16 regions) | ✅ | ❌ Auckland only |
| Mortgage calculator (live bank rates) | ✅ | ❌ |
| Kāinga Ora / state-housing parcel map | ✅ | ❌ |
| "What's nearby" amenity search (schools/parks/shops, 800m) | ✅ | ❌ |
| MCP server for ChatGPT/Claude (21 tools) | ✅ | ❌ |
| Account / auth (email verify) | ✅ | ❌ |
| Shareable report links + PDF export + email copy | ✅ | ❌ print button only |
| Bookmarks / shared shortlists / notebooks | ✅ | ❌ (shortlist in backlog, not built) |
| Market & ownership picture (sales, comparables, CV, trend, running costs) | ✅ | ❌ |
| Consent history / title details | ✅ (in scope) | ❌ (title is in our paid-data backlog) |
| Property snapshot (price, CV, market trend, year built) | ✅ | ❌ |
| Standalone free flood map (no account, national) | ✅ | ❌ (flood tied to parcel report) |
| Coastal inundation **with sea-level-rise / 2130 scenarios** | ✅ (example report mentions it) | ❌ present-day 1% AEP only |
| About / Support / Contact pages with FAQs | ✅ | ❌ |
| Marketing language: who/what/how, journey, values, team | ✅ | ❌ almost none |
| Risk-rated findings ("High / Medium risk") | ✅ | ❌ (we use four states, not severity) |

## What we do that Duly doesn't (our differentiators — keep and emphasise)

1. **Parcel-confirmed intersection.** We intersect every hazard with the confirmed LINZ parcel polygon, not an address point or a 500m search circle. Duly's flood map explicitly uses a 500m circle and shows "vector features intersecting the circle." Our check is parcel-precise — the finding is about the section, not the neighbourhood.
2. **Intention-aware ordering.** Findings are ordered by what the buyer intends to do (live / renovate / extend / add a dwelling / build on vacant land). Duly does not.
3. **Four-state finding model** — detected / not_detected / unavailable / needs_review. We never say "all clear" on missing data. Duly's AI reports can say "no risk found," which is the honesty trap we explicitly avoid.
4. **Source-cited, deterministic findings.** Every finding links to its source and retrieval date; the narrative is not AI-generated, so it cannot hallucinate. Duly's reports are AI-generated and "may be incomplete, outdated, or inaccurate" (their words).
5. **Unitary Plan zone → rule chapter PDF.** We link directly to the ePlan H/F chapter PDF for the specific zone. Duly mentions zoning but not rule-chapter deep links (from public pages).
6. **Per-finding limitations.** Each finding states what the map does NOT establish (not a site-specific flood assessment, not a floor-level or insurance answer, etc.). Duly has general disclaimers but not per-finding.
7. **Auckland Council source-first.** We import the canonical AC layers (overland flow, flood prone, coastal inundation 1% AEP, Unitary Plan base zone) directly from the ArcGIS hub with verified CC BY 4.0 licences, recorded in a dataset ledger. Duly aggregates "public and third-party" sources with varying coverage.

## Layout / copy observations (the user's main ask)

Duly's homepage answers the three questions our home page barely addresses:

- **Who is it for?** — "first home buyers and property investors." Stated on `/about` and implied on `/`.
- **What is it for?** — "ask better questions before making an offer." A clear, modest value prop.
- **How do you use it?** — a 4-step "Duly journey" (01 address → 02 … → 03 … → 04 …) with illustrations and a worked example ("24 Kōwhai Street, Auckland").
- **Why trust it?** — values (Transparency, Accessibility, Excellence, Empowerment), team page with named people, source references, AI-disclosure line on every screen.
- **What does it cost?** — "Completely free. No credit card." Repeated.

Our home page (`web/src/app/page.tsx`) currently has: a hero ("Understand a property before you pay to investigate it."), a 4-card "What we check" grid, a 4-step "How it works" grid, and a footer. There is no "who is it for," no value prop beyond the hero, no worked example, no about/support/contact, no pricing clarity, no differentiator emphasis (parcel-precise, intention-aware, four-state honesty). The tone is honest but cold — closer to a tool than a product.

## Opportunities for the next session

Two lanes, ranked by the user's emphasis:

### A. Marketing copy overhaul (the user's primary ask)
- Rewrite the hero with a sharper value prop and "who it's for."
- Add a "who should use this" section (first-home buyers, renovators, extenders, people adding a dwelling, vacant-land builders — matches our intention model).
- Add a worked example / journey like Duly's "24 Kōwhai Street."
- Add an "Why morebeanz" differentiator section: parcel-precise, intention-aware, four-state honesty, source-cited, Auckland Council source-first.
- Add `/about`, `/support`, `/contact` pages (even short ones) so the site has a face.
- State pricing clearly (free now; the $25–30 report is planned — see backlog).

### B. Product gaps to consider adding (the user's "anything we can do that it doesn't" — but these are bigger builds)
- **Mortgage calculator** with live NZ bank rates (RatesAPI.nz is free). Low effort, high buyer value, differentiator-neutral.
- **"What's nearby"** amenity search (schools, parks, shops) from Ministry of Education + OpenStreetMap. Medium effort.
- **Coastal inundation SLR scenarios** (0.5m / 1m / 2m) — we already have the present-day 1% AEP; the SLR variants are separate FeatureServices on the same hub. Low effort, high relevance, and Duly's example report explicitly mentions a "2130 scenario" so this is a direct parity move.
- **Report sharing / PDF export** beyond the print button. Medium effort.
- **Bookmarks / shortlist** — already in our backlog.

The user's instruction is to do the marketing copy in the next session and add differentiators we can do that Duly doesn't. The differentiators we already have (parcel-precise, intention-aware, four-state) are the strongest argument — they should be the headline, not a footnote.

## Notes

- Duly's flood map is the most polished piece: national, per-region licence notes, honest "no overlay here does not mean no flood risk" framing. It is a top-of-funnel free tool (no account needed) that funnels to the report.
- Duly's reports are AI-generated and explicitly hedged ("may be incomplete, outdated, or inaccurate"). Our deterministic, source-cited approach is a genuine trust differentiator but only if we say so out loud.
- Duly has a 500m search-circle model for its flood map; we intersect the parcel. This is a real, defensible difference and should be on the home page.
- Duly's MCP integration is a distribution channel we can't match quickly; it's out of scope for the next session.
