"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Candidate = { id: string; label: string };

const CHECKS = [
  {
    label: "Hazards · live",
    title: "Overland flow, flood prone, coastal inundation",
    body: "Auckland Council overland flow paths, flood prone areas, and coastal storm-tide (1% AEP) extent, each intersected with the full parcel.",
  },
  {
    label: "Planning · live",
    title: "Unitary Plan zone",
    body: "The Auckland Unitary Plan base zone that applies to the section, named and linked to the rule chapter. Overlays, precincts and designations are not assessed yet.",
  },
  {
    label: "Terrain · planned",
    title: "Approximate slope",
    body: "Not assessed yet. Missing elevation data will be reported as unavailable, not as flat or clear.",
  },
  {
    label: "Infrastructure · planned",
    title: "Stormwater and more",
    body: "Not assessed yet. Mapped public infrastructure will be added only after each layer is verified.",
  },
];

const AUDIENCES = [
  {
    label: "First-home buyer",
    title: "Will this section work for me to live in?",
    body: "Flood, coastal storm-tide, and the Unitary Plan zone — each intersected with the actual parcel, not the neighbourhood.",
  },
  {
    label: "Renovator",
    title: "Can I alter, and what limits apply?",
    body: "The base zone names what's permitted, with a deep link to the ePlan rule chapter. Overlays and precincts are still being added.",
  },
  {
    label: "Extender",
    title: "Where on the section can I build out?",
    body: "Overland flow paths and flood prone areas are mapped against the parcel, so the extension location and drainage questions are concrete.",
  },
  {
    label: "Adding a dwelling",
    title: "Is a second dwelling in the rules?",
    body: "The zone check links to the chapter that sets dwelling density. Hazard findings are ordered first because they shape where a second unit can sit.",
  },
  {
    label: "Vacant-land builder",
    title: "What does the land itself show?",
    body: "Overland flow, flood prone, and coastal storm-tide are the live hazard checks; terrain (slope) is still being added and will read as unavailable until then.",
  },
];

const DIFFERENTIATORS = [
  {
    n: "01",
    title: "Parcel-confirmed intersection",
    body: "Every hazard is intersected with the confirmed LINZ parcel polygon — not an address point, and not a 500 m search circle. The finding is about the section, not the neighbourhood.",
  },
  {
    n: "02",
    title: "Intention-aware ordering",
    body: "Findings are ordered by what you intend to do — live there, renovate, extend, add a dwelling, or build on vacant land. The question you came with is the one answered first.",
  },
  {
    n: "03",
    title: "Four-state honesty",
    body: "Every finding is detected, not detected, unavailable, or needs review. We never say \"all clear\" when the data is missing — missing data is reported as unavailable, not as safe.",
  },
  {
    n: "04",
    title: "Source-cited, deterministic findings",
    body: "Every finding links to its source and a retrieval date. The narrative is not AI-generated, so it cannot hallucinate a hazard that isn't on the map, or invent one that is.",
  },
  {
    n: "05",
    title: "Unitary Plan zone → rule chapter PDF",
    body: "The zone check links directly to the ePlan H- or F-chapter PDF for the specific zone, not a generic zoning page.",
  },
  {
    n: "06",
    title: "Per-finding limitations",
    body: "Each finding states what the map does NOT establish — not a site-specific flood assessment, not a floor-level or insurance answer, not a consent decision.",
  },
  {
    n: "07",
    title: "Auckland Council, source-first",
    body: "Canonical AC layers are imported directly from the ArcGIS hub with verified CC BY 4.0 licences, recorded in a public dataset ledger. No third-party aggregation, no mystery sources.",
  },
];

const JOURNEY = [
  {
    n: "01",
    title: "Search",
    body: "Enter an Auckland street address. The LINZ address service returns the matched address.",
  },
  {
    n: "02",
    title: "Confirm parcel",
    body: "Choose the parcel when more than one contains the address. The check runs against the parcel polygon, not the address point.",
  },
  {
    n: "03",
    title: "Read findings",
    body: "Findings are returned in the four states, ordered by your intention, each with its source and retrieval date.",
  },
  {
    n: "04",
    title: "Compare & export",
    body: "Print the findings with sources, or run another address to compare shortlist properties side by side.",
  },
];

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCandidates([]);
    try {
      const res = await fetch("/api/address/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) throw new Error("search failed");
      const data = await res.json();
      setCandidates(data.candidates ?? []);
      setSearched(true);
    } catch (err: any) {
      setError(err.message ?? "search error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* announcement strip — sets the honest tone */}
      <div className="border-b border-hairline bg-paper">
        <p className="label mx-auto max-w-[1250px] px-4 py-2 text-center">
          Preliminary research · Not a LIM · Sources cited
        </p>
      </div>

      {/* header */}
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1250px] items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Mark />
            <span className="display text-[1.15rem] leading-none">morebeanz</span>
          </Link>
          <nav className="label flex items-center gap-4 sm:gap-6">
            <a href="#who" className="hidden sm:inline hover:text-ink">Who it&apos;s for</a>
            <a href="#example" className="hidden sm:inline hover:text-ink">Example</a>
            <a href="#checks" className="hidden sm:inline hover:text-ink">What we check</a>
            <a href="#why" className="hidden sm:inline hover:text-ink">Why morebeanz</a>
            <Link href="/about" className="hover:text-ink">About</Link>
          </nav>
        </div>
      </header>

      {/* hero — asymmetric two-panel */}
      <section className="border-b border-hairline">
        <div className="mx-auto grid max-w-[1250px] grid-cols-1 md:grid-cols-2">
          {/* left: text + search */}
          <div className="border-hairline px-6 py-16 md:border-r md:px-10 md:py-24">
            <p className="label">Auckland property research</p>
            <h1 className="display mt-4 text-[2.25rem] md:text-[3rem]">
              Parcel-precise findings before you pay for the LIM.
            </h1>
            <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-ink-muted">
              For first-home buyers, renovators, extenders, and people adding a
              dwelling. Every hazard is intersected with the confirmed LINZ parcel —
              not a 500 m search circle, and not an AI summary. Findings are
              deterministic, source-cited, and ordered by what you intend to do with
              the place. Not a LIM.
            </p>

            <form onSubmit={search} className="mt-8 max-w-md">
              <label className="label block" htmlFor="addr">
                Address
              </label>
              <div className="mt-2 flex border border-hairline bg-surface">
                <input
                  id="addr"
                  type="text"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setSearched(false);
                  }}
                  placeholder="Enter an Auckland street address"
                  className="flex-1 bg-transparent px-3 py-3 text-[0.95rem] placeholder:text-ink-muted focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || q.length < 2}
                  className="label border-l border-hairline px-5 py-3 text-ink hover:bg-ink hover:text-paper disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink"
                >
                  {loading ? "Searching" : "Check"}
                </button>
              </div>
            </form>

            {error && <p className="mt-3 text-sm text-st-detected">{error}</p>}

            {candidates.length > 0 && (
              <ul className="mt-6 max-w-md border border-hairline">
                {candidates.map((c) => (
                  <li key={c.id} className="border-b border-hairline last:border-b-0">
                    <button
                      onClick={() => router.push(`/property/confirm?addressId=${c.id}`)}
                      className="w-full px-4 py-3 text-left text-[0.95rem] hover:bg-surface"
                    >
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {searched && candidates.length === 0 && !loading && !error && (
              <p className="mt-3 text-sm text-ink-muted">
                No Auckland addresses matched. Try a street name or a fuller address.
              </p>
            )}

            <p className="label mt-8">Not a LIM</p>
          </div>

          {/* right: topographic backdrop */}
          <div className="relative hidden min-h-[420px] bg-surface md:block">
            <TopoBackdrop />
          </div>
        </div>
      </section>

      {/* who should use this */}
      <section id="who" className="border-b border-hairline">
        <div className="mx-auto max-w-[1250px] px-4 py-16 md:py-24">
          <p className="label">Who should use this</p>
          <h2 className="display mt-3 text-[1.75rem] md:text-[2rem]">
            Built around what you plan to do with the place.
          </h2>
          <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-muted">
            The report is ordered by your intention. Pick the one that matches you —
            the findings that matter most to that decision come first.
          </p>
          <ul className="mt-10 grid grid-cols-1 border border-hairline sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((a, i) => (
              <li
                key={a.label}
                className={`border-hairline p-6 ${
                  i % 3 !== 0 ? "lg:border-l" : ""
                } ${i % 2 !== 0 ? "sm:border-l lg:border-l-0" : ""} ${
                  i >= 1 ? "border-t sm:border-t-0" : ""
                } ${i >= 2 ? "lg:border-t" : ""} ${i >= 3 ? "sm:border-t lg:border-t-0" : ""} ${i >= 4 ? "lg:border-t" : ""}`}
              >
                <p className="label">{a.label}</p>
                <h3 className="display mt-3 text-[1.1rem]">{a.title}</h3>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-muted">{a.body}</p>
              </li>
            ))}
            <li className="border-hairline p-6 lg:border-l lg:border-t">
              <p className="label">Not for</p>
              <h3 className="display mt-3 text-[1.1rem]">Apartments &amp; cross-leases</h3>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-muted">
                The first version targets standalone houses and vacant residential
                sections. Properties with ambiguous boundaries need a separate,
                limited assessment.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* worked example */}
      <section id="example" className="border-b border-hairline">
        <div className="mx-auto max-w-[1250px] px-4 py-16 md:py-24">
          <p className="label">Worked example</p>
          <h2 className="display mt-3 text-[1.75rem] md:text-[2rem]">
            17 Shanaway Rise, Hillcrest — a real run.
          </h2>
          <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-muted">
            This is the actual flow on a real Auckland address, not a mockup. The
            parcel (LINZ id 5169096, 687 m²) is in the Hillcrest catchment. The
            findings below are what the live checks returned on it on 2 Nov 2026.
          </p>
          <ol className="mt-10 grid grid-cols-1 border border-hairline sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY.map((s, i) => (
              <li
                key={s.n}
                className={`border-hairline p-6 ${
                  i % 4 !== 0 ? "lg:border-l" : ""
                } ${i % 2 !== 0 ? "sm:border-l lg:border-l-0" : ""} ${
                  i >= 1 ? "border-t sm:border-t-0" : ""
                } ${i >= 2 ? "lg:border-t" : ""}`}
              >
                <p className="label">{s.n}</p>
                <h3 className="display mt-3 text-[1.15rem]">{s.title}</h3>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-muted">{s.body}</p>
              </li>
            ))}
          </ol>

          {/* real finding from the live run on 2 Nov 2026 */}
          <div className="mt-8 border border-hairline">
            <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
              <div>
                <p className="label">Finding 04 · planning.zone</p>
                <h3 className="display mt-1 text-[1.1rem] leading-snug">
                  Zone: Residential — Mixed Housing Suburban Zone.
                </h3>
              </div>
              <span className="stamp text-st-detected bg-st-detected-wash border-st-detected-line">
                Detected
              </span>
            </div>
            <div className="px-5 py-4 text-[0.9rem] leading-relaxed">
              <p>
                The Auckland Unitary Plan base zone layer intersects the confirmed
                parcel polygon. The zone is named and linked to the ePlan rule
                chapter (H4) that sets what&apos;s permitted, discretionary, and
                non-complying on this section.
              </p>
              <p className="mt-3 text-ink-muted">
                <span className="label mr-2">Limitations</span>
                The base zone only. Overlays (special character, historic heritage,
                significant ecological areas, volcanic viewshafts), precincts, and
                designations are separate layers not yet assessed. This does not
                establish height, activity status, or whether a specific consent
                would be granted.
              </p>
              <p className="mt-4 border-t border-hairline pt-3 label">
                Source · Auckland Unitary Plan base zones (CC BY 4.0) · retrieved
                during the live run
              </p>
            </div>
          </div>
          <p className="label mt-4">
            The same run also returned overland flow, flood prone areas, and coastal
            storm-tide as not detected on this parcel — reported as not_detected,
            not as &ldquo;all clear&rdquo;, because the four-state model never
            converts missing or negative data into a blanket safe.
          </p>
        </div>
      </section>

      {/* what we check */}
      <section id="checks" className="border-b border-hairline">
        <div className="mx-auto max-w-[1250px] px-4 py-16 md:py-24">
          <p className="label">What we check</p>
          <h2 className="display mt-3 text-[1.75rem] md:text-[2rem]">
            Four layers, one report.
          </h2>
          <div className="mt-10 grid grid-cols-1 border border-hairline sm:grid-cols-2 lg:grid-cols-4">
            {CHECKS.map((c, i) => (
              <div
                key={c.label}
                className={`border-hairline p-6 ${
                  i % 4 !== 0 ? "lg:border-l" : ""
                } ${i % 2 !== 0 ? "sm:border-l lg:border-l-0" : ""} ${
                  i >= 1 ? "border-t sm:border-t-0" : ""
                } ${i >= 2 ? "lg:border-t" : ""}`}
              >
                <p className="label">{c.label}</p>
                <h3 className="display mt-3 text-[1.15rem]">{c.title}</h3>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-muted">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* why morebeanz */}
      <section id="why" className="border-b border-hairline">
        <div className="mx-auto max-w-[1250px] px-4 py-16 md:py-24">
          <p className="label">Why morebeanz</p>
          <h2 className="display mt-3 text-[1.75rem] md:text-[2rem]">
            What a parcel-precise report gives you that a 500 m circle or an AI summary can&apos;t.
          </h2>
          <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-muted">
            The difference is in the geometry, the honesty model, and the source
            chain. None of this is marketing — it&apos;s how the checks are built.
          </p>
          <ul className="mt-10 grid grid-cols-1 border border-hairline sm:grid-cols-2 lg:grid-cols-3">
            {DIFFERENTIATORS.map((d, i) => (
              <li
                key={d.n}
                className={`border-hairline p-6 ${
                  i % 3 !== 0 ? "lg:border-l" : ""
                } ${i % 2 !== 0 ? "sm:border-l lg:border-l-0" : ""} ${
                  i >= 1 ? "border-t sm:border-t-0" : ""
                } ${i >= 2 ? "lg:border-t" : ""} ${i >= 3 ? "sm:border-t lg:border-t-0" : ""} ${i >= 4 ? "lg:border-t" : ""} ${i >= 5 ? "lg:border-t" : ""}`}
              >
                <p className="label">{d.n}</p>
                <h3 className="display mt-3 text-[1.1rem]">{d.title}</h3>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-muted">{d.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* pricing */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1250px] px-4 py-16 md:py-24">
          <p className="label">Pricing</p>
          <h2 className="display mt-3 text-[1.75rem] md:text-[2rem]">
            Free now. A paid PDF report is planned.
          </h2>
          <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-muted">
            The on-screen report — search, confirm parcel, and the four-state findings
            with sources — is free today. A printable, shareable PDF report is planned
            at NZ$25–30, positioned as a pre-LIM screen (the Auckland Council LIM is
            $375 / 10 working days). The paywall is not built yet; nothing is being
            charged.
          </p>
        </div>
      </section>

      {/* footer */}
      <footer className="mt-auto">
        <div className="mx-auto max-w-[1250px] px-4 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Mark />
                <span className="display text-[1.15rem]">morebeanz</span>
              </div>
              <p className="label mt-3">Preliminary property research · Auckland</p>
              <nav className="label mt-3 flex flex-wrap gap-x-4 gap-y-1">
                <Link href="/about" className="hover:text-ink">About</Link>
                <Link href="/support" className="hover:text-ink">Support</Link>
                <Link href="/contact" className="hover:text-ink">Contact</Link>
              </nav>
            </div>
            <p className="max-w-md text-[0.8rem] leading-relaxed text-ink-muted">
              Public Auckland map data, sourced first-party from the Auckland Council
              ArcGIS hub and LINZ under CC BY 4.0. Not a LIM, not ownership
              confirmation, not an approval guarantee. Overland flow, flood prone
              areas, coastal storm-tide, and the Unitary Plan zone are the live
              checks; terrain and infrastructure are not assessed yet.
            </p>
          </div>
          <hr className="rule mt-8" />
          <p className="label mt-4">© morebeanz</p>
        </div>
      </footer>
    </div>
  );
}

/* ---- logo mark (matches /public/mark.svg) ---- */
function Mark() {
  return (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M 14 34 Q 24 22 34 34"
        fill="none"
        stroke="#7A5A3A"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 14 30 Q 24 20 34 30"
        fill="none"
        stroke="#7A5A3A"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

/* ---- topographic contour backdrop (pure CSS/SVG, no image) ---- */
function TopoBackdrop() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 600 480"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="600" height="480" fill="#FBFAF6" />
      <g
        fill="none"
        stroke="#7A5A3A"
        strokeWidth="1"
        opacity="0.28"
        strokeLinecap="round"
      >
        <path d="M -40 360 Q 150 260 300 300 T 640 280" />
        <path d="M -40 330 Q 150 230 300 270 T 640 250" />
        <path d="M -40 300 Q 150 200 300 240 T 640 220" />
        <path d="M -40 270 Q 150 170 300 210 T 640 190" />
        <path d="M -40 240 Q 150 140 300 180 T 640 160" />
        <path d="M -40 210 Q 150 110 300 150 T 640 130" />
      </g>
      <g
        fill="none"
        stroke="#1C1A17"
        strokeWidth="1.5"
        opacity="0.55"
      >
        {/* a parcel outline drawn over the contours */}
        <path d="M 180 150 L 420 150 L 420 330 L 180 330 Z" />
      </g>
      <g stroke="#1C1A17" strokeWidth="1" opacity="0.4">
        <path d="M 180 150 L 180 138 M 420 150 L 420 138" />
        <path d="M 180 330 L 180 342 M 420 330 L 420 342" />
      </g>
    </svg>
  );
}
