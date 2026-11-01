# Auckland Property Check — product brief

A single reference for what we are building, who it serves, and what success looks like. Derived from the product brief (sections 1–3).

## Purpose

Build a website that helps people **research and compare Auckland properties** before spending money on detailed investigations.

A buyer enters an address and receives an understandable summary of relevant **public** information: mapped hazards, planning restrictions, land boundaries, terrain, and available infrastructure information.

**Product promise:** Understand the properties on your shortlist before paying to investigate them in depth.

## Who it is for

People considering an **existing standalone house** or a **vacant residential section** in Auckland, including buyers who intend to renovate, extend, or eventually add another dwelling.

**First version:** these property types only. Apartments, cross-leases, and properties with ambiguous boundaries need a separate or limited assessment.

## The problem

Useful property information is spread across council maps, government datasets, and technical documents. Buyers may not know these resources exist or understand what the information means.

The website brings that information together, explains its relevance, and helps buyers identify questions earlier.

## How it saves time and potentially money

- Replaces repeated searches across separate websites.
- Helps buyers identify properties that do not suit their plans before arranging further investigations.
- Makes shortlisted properties easier to compare.
- Produces specific questions for the agent, council, or professional adviser.
- Keeps findings and sources together for subsequent investigations.

Financial savings depend on avoiding unnecessary work or unsuitable properties; they are **not** a guaranteed reduction in the cost of completing a purchase.

## Main user journey

1. Enter an Auckland street address.
2. Confirm the correct property on a map.
3. Select an **intention:** live there, renovate, extend, add a dwelling, or build on vacant land.
4. Read a summary of findings, ordered by relevance to that intention.
5. Open individual findings to see the map, explanation, and original source.
6. Save the property and compare it with others.
7. Export a summary and a list of questions to investigate.

An initial search does not require an account. An account enables a saved shortlist.

## First-version features

Each feature is enabled only after its underlying dataset has been **verified** for access, coverage, and permitted reuse.

| Feature | What the buyer receives |
|--------|-------------------------|
| Property identification | Address, mapped land parcel, area where available, aerial imagery |
| Mapped hazards | Findings from verified flood, overland flow, and coastal hazard datasets |
| Planning information | Applicable zones and selected overlays, with explanations and links to relevant rules |
| Terrain | Approximate slope indication where suitable elevation data exists |
| Infrastructure | Selected mapped public infrastructure, starting with stormwater where available |
| Personalised checklist | Questions relevant to the buyer’s intended use |
| Property comparison | The same checks displayed side by side |
| Export | Printable summary with sources, dates, and outstanding questions |

## How findings should appear

Each finding includes:

- What the source shows.
- Where it applies on the property.
- Why it may matter to the buyer’s selected intention.
- A useful next question.
- Source, data date (where available), and retrieval date.
- Any information that remains unavailable.

**Example (illustrative):**

> **A mapped overland flow path intersects part of this section.**

The map highlights the intersection. For someone planning an extension, the accompanying question is: “How would this affect the proposed extension location and drainage design?”

Wording describes mapped evidence without claiming that the house has flooded.

## Product boundaries

The website provides **preliminary research**. It does not:

- Issue an official LIM
- Confirm building condition
- Establish title restrictions
- Guarantee development permission
- Determine insurance availability

The first version does **not** include automated property valuations, comprehensive consent histories, or conveyancing.

## Later additions

- Upload and organise seller-provided documents.
- Extract findings with links to relevant document pages.
- Compare document information with mapped public information.
- Notify users when relevant source information changes.

## Success measures

Measure whether buyers can:

- Research and compare properties faster
- Understand findings correctly
- Identify useful questions they would otherwise have missed

Track address-matching accuracy, dataset coverage, report completion time, and discrepancies against official sources.

## Positioning note (from market context)

Existing NZ tools often focus on **paid hazard PDFs** or **national breadth**. Auckland Property Check differentiates on **parcel-confirmed geometry**, **intention-aware ordering**, **shortlist comparison**, **reproducible snapshots**, and **deterministic rules** (not AI-decided hazard applicability). See [MARKET_RESEARCH.md](./MARKET_RESEARCH.md).
