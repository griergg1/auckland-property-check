# morebeanz — design system

Visual and interaction language for the product. Editorial and hairline-led, in soft New Zealand harbour and bush colours: mist, sea, and green, with quiet gradients. Not a warm-tan archive, and not a bright dashboard.

## Principles

1. **Findings first.** The map supports the text, not the other way around. Essential reading works without map interaction.
2. **Honest, not flashy.** The product explicitly says it is *not* a LIM. The design must look measured and credible, never promotional.
3. **Hairlines, not shadows.** Separate with 1px cool borders. No drop shadows, no glassmorphism. Gradients are slow shifts of sky into bush, or harbour into green — never bright or glossy.
4. **Sharp corners.** Border radius is 0 (or 2px at most). The softness is in the colour, not the corners.
5. **One accent.** A harbour teal carries the brand, links, and the primary action. Everything else is deep-harbour ink on mist.
6. **Type carries the hierarchy.** Serif headlines, sans body, mono labels. Size and weight do the work; colour stays restrained.

## Colour

Mist, sea, and bush. No pure black, no pure white, no tan, no neon.

| Token | Hex | Use |
|------|-----|-----|
| `paper` | `#F3F7F6` | Page ground, under the body gradient |
| `surface` | `#F7FBFA` | Cards, panels |
| `ink` | `#163038` | Body text, headings (deep harbour) |
| `ink-muted` | `#3F5A64` | Secondary text, captions |
| `hairline` | `#C5D5D8` | All 1px borders and dividers |
| `accent` | `#1A6572` | Logo mark, links, focus ring |
| `water` | `#2A6F8F` | Flood and evidence overlays |
| `bush` | `#2F6B52` | Clear / not-on-the-map green |

The page background is a fixed gradient: `#B7D3E6` → `#C9E0D8` → `#E7F3EF`. The hero plate (`.wash`) is `#8FBCD4` → `#A9D0C4` → `#D7EBE4`. Dark bands (`.tide`) are `#14343C` → `#1A4C56` → `#1C5546`.

### Status colours (muted blue and green — never bright dashboard pills)

| Status | Ink | Wash | Border |
|--------|-----|------|--------|
| `detected` | `#1A4E6A` (harbour) | `#E4EEF4` | `#B7D0E0` |
| `not_detected` | `#2C6B52` (bush) | `#E3F0E8` | `#B7D4C4` |
| `unavailable` | `#4E6570` (slate) | `#E7EEEF` | `#C5D2D6` |
| `needs_review` | `#3E5270` (dusk) | `#E6EAF2` | `#C5CEDC` |

Status badges use a 1px border, no radius, small mono all-caps label. They read as archival stamps, not alert chips.

## Typography

Three families, one role each.

| Role | Family | Source |
|------|--------|--------|
| Headlines | **Newsreader** (serif, 400–600) | Google Fonts |
| Body / UI | **Geist Sans** (existing) | next/font |
| Labels / numerals | **Geist Mono** (existing), all-caps, letter-spaced | next/font |

Scale (desktop, rem):

- Display: 3.0 / 1.1 — hero headline only
- H1: 2.0 / 1.15 — screen titles
- H2: 1.5 / 1.2 — section titles
- H3: 1.125 / 1.3 — finding titles, card titles
- Body: 1.0 / 1.6
- Small: 0.875 / 1.5
- Label: 0.6875, uppercase, `letter-spacing: 0.12em` — section eyebrows, status, meta

Headlines: Newsreader, weight 400–500, never bold. The reference's elegance comes from light serif weight against tiny mono labels.

## Layout

- Max content width: 1100px (report), 1250px (compare). Home uses a full-bleed asymmetric hero.
- Section vertical rhythm: 96px desktop / 64px mobile.
- Hairline grid: panels separated by 1px `hairline`, no gaps filled with whitespace alone where a structural divide is needed.
- No rounded corners on containers. Inputs and buttons are square.
- Header is a single hairline-bordered strip: logo left, minimal nav right.

## Components

**Button — primary.** Square, 1px `ink` border, `paper` background, `ink` text, mono all-caps label. On hover: background `ink`, text `paper`. The accent is reserved for links and the logo, not buttons — keeps the page calm.

**Button — secondary.** No border, mono all-caps label with a thin underline that grows on hover.

**Input.** Square, 1px `hairline` border, `paper` background, `ink` text, Geist Sans. Focus: 1px `accent` border, no glow. Placeholder in `ink-muted`.

**Finding row.** Full-width hairline-bordered strip. Header row: finding title (Newsreader) + status stamp (mono). Expand reveals explanation, limitations, follow-up questions, source line. No nested card; the hairline is the container.

**Map panel.** Hairline border, no radius. LINZ basemap. Evidence overlay in `accent` at 0.6 opacity; parcel outline in `ink` at 1.5px. Map caption in mono small below.

**Status stamp.** 1px border, square, mono all-caps 0.6875rem, padding 2px 6px. Colour from the status table above.

## Iconography

None in v1. The logo mark is the only graphic. Findings are typed, not iconed. Avoids the "feature card with a lucide icon" look that makes every AI-built site read the same.

## Logo

A parcel boundary with a contour line beneath it. The square is the property; the curve is the terrain and the layers of information we surface.

```
┌────────────┐
│            │
│    ‿‿‿     │   ← contour (terrain / layers)
│            │
└────────────┘   ← parcel boundary
```

Rationale:

- **Non-literal.** It is not a house, a roof, a pin, or a magnifier — all of which read generic-tech.
- **On-product.** Parcel geometry and terrain are both core datasets. The mark is the work, abstracted.
- **Sibling to the reference.** Like the Subtle Bodies sunburst, it is a thin-line geometric mark that pairs with a serif wordmark.
- **Scales.** Reads at 16px (favicon) and at 120px (header).

Wordmark: "morebeanz" set in Newsreader, weight 500, lowercase, `ink`. The mark sits to the left at the cap height. A tiny mono all-caps tagline may sit under the wordmark on the home header only: "PRELIMINARY RESEARCH · AUCKLAND".

Files:
- `web/public/logo.svg` — mark + wordmark lockup
- `web/public/mark.svg` — mark alone (for favicon and tight spaces)
- `web/src/app/icon.svg` — favicon (mark on `paper`)

## Favicon

The mark alone on a `#F4F1EA` ground, `#1C1A17` stroke. Square, no radius — matches the sharp-corner system. Provided as `src/app/icon.svg` (Next.js picks this up automatically) plus a fallback `favicon.ico` retained for legacy tabs.

## Screen-by-screen UX

### 1. Home — `/`

Asymmetric hero, two panels divided by a hairline.

- **Left panel (paper):**
  - Eyebrow: `RESEARCH` (mono all-caps)
  - Headline (Newsreader, ~3rem): "Understand a property before you pay to investigate it."
  - Sub: one sentence — "Mapped hazards, planning, terrain and infrastructure, pulled from public Auckland sources and cited."
  - Search form: address input (square, hairline) + "Check this address" primary button.
  - Tiny mono caveat: "Demo data · not a LIM"
- **Right panel:** a topographic backdrop — a faint contour-line motif on `surface`, or a static LINZ basemap snapshot of an Auckland parcel. Hairline framed.

Below the hero:

- **What we check** — four hairline cards: Hazards, Planning, Terrain, Infrastructure. Each: mono label, serif title, one line of body.
- **How it works** — four numbered steps: Search → Confirm parcel → Read findings → Compare & export. Mono numerals, serif titles.
- **Footer** — hairline top border, mono all-caps nav, the honest disclaimer.

### 2. Parcel confirm — `/property/confirm`

- Eyebrow: `CONFIRM PARCEL`
- Headline: "Is this the right property?"
- Map (hairline-framed, LINZ basemap) with candidate parcel outlines in `ink`.
- A short list of candidates below or beside the map: address + parcel id + area. Each row a hairline strip; selected row gets an `accent` left border (3px).
- Primary action: "Use this parcel" (square primary button).
- If ambiguous: a `needs_review` stamp and a line of body explaining why.

### 3. Report — `/property/[runId]/report`

- Header strip: back link, "Property report" (Newsreader H1), parcel address (mono small), print button (secondary).
- Intention selector: four small hairline chips (Live / Renovate / Extend / Add dwelling / Build). Selected chip: `ink` border, `ink` text. Findings re-order on select.
- Layout: findings list left (wide), map right (sticky). On mobile, map collapses above findings.
- Each finding: hairline strip, title + status stamp, expand for explanation / limitations / questions / source.
- Source line: mono small — dataset name, dataset version, source date, retrieval date, link.
- Footer: the disclaimer, larger and calmer than the home caveat.

### 4. Compare — `/shortlist/compare`

- Two- or three-column hairline grid. Each column is one saved property: address, parcel id, then the same findings list stacked. Status stamps align across columns so the eye can scan.
- A coverage strip at the top: mono all-caps row per dataset showing which properties have it and which are `unavailable`.
- Export button (secondary) top-right.

### 5. Print — `/property/[runId]/print`

- Black-on-paper, no colour except status stamps (kept for legibility).
- Source block at the foot of every finding, not collapsed.
- Page breaks between sections; running header with parcel id and retrieval date.
- Browser print CSS first (per TECH.md). No server PDF in v1.

## Motion

Almost none. Expand/collapse is a 120ms opacity + height transition. No page transitions, no entrance animations, no parallax. The product is a document; documents do not animate.

## Accessibility

- Status conveyed by text label, not colour alone (the stamps carry words).
- Focus ring: 2px `accent` outline, 2px offset — visible on the mist background.
- Min body text 0.875rem; mono labels 0.6875rem only for non-essential meta.
- Contrast: `ink` on `paper` ≈ 14:1; `ink-muted` on `paper` ≈ 6.5:1 — both pass AA.

## What is deliberately avoided

- Lucide icons in rounded cards
- Indigo / violet / pink gradients
- Glassmorphism, blur, aurora backgrounds
- "Trusted by" logo strips
- Animated count-up stats
- Big rounded buttons with shadow
- Any emoji
