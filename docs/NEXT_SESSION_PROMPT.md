# Next session — prompt

Start the session by reading `progress.md` and running the start-of-session checklist. The phase is the Phase 0.5 proof of concept, live on Vercel with parcels, overland flow, flood prone, coastal inundation (1% AEP storm-tide), and Unitary Plan zone checks. Do not redo any of those imports, the domain, the basemap, or the parcel picker.

**Goal:** Marketing copy overhaul + emphasise our differentiators vs Duly. This is a copy/positioning session, not a new-data-import session.

**Context:** Read `docs/COMPETITOR_Duly.md` first — it is the competitor research for duly.co.nz (free AI-generated NZ property reports, national flood map, mortgage calculator, Kāinga Ora map, MCP server, account + sharing + notebooks). Duly has clear "who / what / how / why trust / what it costs" framing; we have almost none. Our home page (`web/src/app/page.tsx`) is honest but cold — a tool, not a product.

**Differentiators we already have and must say out loud (do not invent new ones):**
1. Parcel-confirmed intersection — every hazard is intersected with the confirmed LINZ parcel polygon, not an address point or a 500m search circle (Duly uses a 500m circle).
2. Intention-aware ordering — findings ordered by what the buyer intends to do (live / renovate / extend / add a dwelling / build on vacant land).
3. Four-state finding model — detected / not_detected / unavailable / needs_review. We never say "all clear" on missing data; Duly's AI reports can.
4. Source-cited, deterministic findings — every finding links to its source and retrieval date; the narrative is not AI-generated, so it cannot hallucinate.
5. Unitary Plan zone → rule chapter PDF deep link.
6. Per-finding limitations — each finding states what the map does NOT establish.
7. Auckland Council source-first — canonical AC layers imported directly from the ArcGIS hub with verified CC BY 4.0 licences, recorded in `docs/dataset-verification.md`.

**Scope for this session (copy + small structural additions, no new data imports):**

1. **Rewrite the hero** (`web/src/app/page.tsx`) with a sharper value prop and an explicit "who it's for" line. Keep the honest tone (we are not a LIM, sources cited). Suggested direction: lead with the parcel-precise + intention-aware + four-state honesty trio as the reason to use us over a 500m-circle map or an AI-generated summary.

2. **Add a "Who should use this" section** to the home page, mapped to our intention model (first-home buyer, renovator, extender, add-a-dwelling, vacant-land builder). One line each on why the report answers their question.

3. **Add a worked example / journey** like Duly's "24 Kōwhai Street" — a short, illustrated 4-step walk-through (search → confirm parcel → read findings → compare/export) using a real Auckland address. Keep it honest: show a real finding, not a mockup.

4. **Add a "Why morebeanz" differentiator section** to the home page. Use the seven differentiators above. Frame it as a direct, factual contrast with a generic "AI property report" or a "500m flood search" — without naming Duly. The point is the buyer can tell the difference.

5. **Add `/about`, `/support`, `/contact` pages** (App Router). Short, factual, no marketing fluff that we can't back up. About: what morebeanz is, the source-first principle, the four-state honesty rule, the no-LIM disclaimer. Support: a short FAQ (What does the report cover? What does it NOT cover? How current is the data? Is it a LIM?) + email. Contact: email + a short form (or just an email link if a form is out of scope).

6. **State pricing clearly.** Today it is free. The backlog plans a $25–30 paid report (pre-LIM screen, LIM is $375/10 days — see `docs/BRIEF.md`). Say on the home page: free now; paid PDF report planned. Do not build the paywall this session.

7. **Footer:** add links to About / Support / Contact, keep the "not a LIM / not ownership / not an approval guarantee" line, add the source-first attribution.

**Out of scope for this session (do not start):**
- New data imports (landslide susceptibility, AUP overlays, coastal erosion, tsunami, NHCover — these stay in the backlog).
- Mortgage calculator, "what's nearby," Kāinga Ora map, MCP server, account/auth, report sharing/PDF, bookmarks/shortlist — these are bigger builds; log them in the backlog with a note that Duly has them, but do not build them this session.
- Coastal inundation SLR scenarios (0.5m/1m/2m) — note in backlog as a quick parity move vs Duly's "2130 scenario" example, but do not import this session.

**Verify with:** one real address from the golden set run end-to-end (search → confirm → report) to confirm the new copy does not break the flow; lint; typecheck; `npm run test`; manual mobile-width pass on the home page and the three new pages. Then run the closeout in `progress.md` and add a Session log entry. Add a Backlog entry: "Marketing v2 — add mortgage calculator, what's-nearby, coastal SLR scenarios, report sharing/PDF" so the next-but-one session has a clear next step.
