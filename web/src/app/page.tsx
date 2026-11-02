"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Candidate = { id: string; label: string };

const CHECKS = [
  {
    label: "Live now",
    title: "Flood & coastal",
    body: "Council flood maps — overland flow paths, flood-prone areas, and coastal storm-tide — matched to your section, not the street.",
  },
  {
    label: "Live now",
    title: "What you can build",
    body: "The Unitary Plan zone for the section, named in plain English, with a link to the exact rule chapter. Overlays and precincts are still being added.",
  },
  {
    label: "Coming",
    title: "Slope",
    body: "Not yet. When the elevation data is missing, we'll say so — we won't call a section flat just because we couldn't check.",
  },
  {
    label: "Coming",
    title: "Stormwater & more",
    body: "Not yet. We'll add mapped public infrastructure only after we've checked each layer is fit to use.",
  },
];

const AUDIENCES = [
  {
    label: "First-home buyer",
    title: "Is this section going to flood?",
    body: "The flood and coastal lines on the council maps, matched to the actual section — so you know what to ask the agent before you offer.",
  },
  {
    label: "Renovator",
    title: "Can I alter, and what are the limits?",
    body: "The zone check names what's permitted on the section and links to the rule chapter. Overlays and precincts are still being added.",
  },
  {
    label: "Extender",
    title: "Where on the section can I build out?",
    body: "Flood paths and ponding areas are matched to the section, so the extension's position and drainage questions are concrete, not a guess.",
  },
  {
    label: "Adding a dwelling",
    title: "Is a second dwelling allowed?",
    body: "The zone check links to the chapter that sets dwelling density. The flood findings come first, because they shape where a second unit can sit.",
  },
  {
    label: "Building on vacant land",
    title: "What does the land itself show?",
    body: "Flood, ponding, and coastal storm-tide are live today. Slope is still coming — until then it reads as \"we couldn't check\", not \"it's flat\".",
  },
];

const DIFFERENTIATORS = [
  {
    n: "01",
    title: "We check the section, not the street.",
    body: "Every flood and planning line is matched to the actual land parcel — not a 500 m circle around the address. The finding is about your section, not your neighbourhood.",
  },
  {
    n: "02",
    title: "Ordered for what you're actually doing.",
    body: "Renovating, extending, adding a dwelling, or building on vacant land — the check that matters most to that decision comes first. You don't wade through someone else's checklist.",
  },
  {
    n: "03",
    title: "We don't say \"all clear\" when we don't know.",
    body: "Every finding is one of four things: yes, no, we couldn't tell, or it needs a human to look. If the map's missing, we say so — we never call a section safe just because the map was blank.",
  },
  {
    n: "04",
    title: "No AI wrote this.",
    body: "Findings come from fixed rules against the council's own maps, with the source link and the date we pulled it. The report can't invent a flood that isn't there, or miss one that is.",
  },
  {
    n: "05",
    title: "Council rules, with the rule book linked.",
    body: "The zone check names the zone and links to the exact chapter of the Unitary Plan that sets what you can do on it — not a generic zoning page.",
  },
  {
    n: "06",
    title: "What this map does NOT tell you.",
    body: "Every finding comes with a plain-English line on what it doesn't establish — not a floor-level answer, not an insurance answer, not a consent decision.",
  },
  {
    n: "07",
    title: "Straight from the council, not a third party.",
    body: "We pull the council's own layers from the council's own data hub, under a free-to-reuse licence, and we keep a public list of what we pulled and when. No mystery sources.",
  },
];

const JOURNEY = [
  {
    n: "01",
    title: "Search",
    body: "Type an Auckland address. We match it to the real address on the LINZ register.",
  },
  {
    n: "02",
    title: "Confirm the section",
    body: "If more than one section contains the address, you pick the right one. The check runs on the section you pick — not on the address dot.",
  },
  {
    n: "03",
    title: "Read the findings",
    body: "Each finding says yes, no, we couldn't tell, or it needs a human — in plain English, with the source link and the date we pulled it.",
  },
  {
    n: "04",
    title: "Compare & keep",
    body: "Print the findings with sources, or run another address and compare your shortlist side by side.",
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
          Free to use · Not a LIM · Every line sourced
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
            <a href="#why" className="hidden sm:inline hover:text-ink">Why us</a>
            <Link href="/about" className="hover:text-ink">About</Link>
          </nav>
        </div>
      </header>

      {/* hero — asymmetric two-panel */}
      <section className="border-b border-hairline">
        <div className="mx-auto grid max-w-[1250px] grid-cols-1 md:grid-cols-2">
          {/* left: text + search */}
          <div className="border-hairline px-6 py-16 md:border-r md:px-10 md:py-24">
            <p className="label">Auckland property check</p>
            <h1 className="display mt-4 text-[2.25rem] md:text-[3rem]">
              Know what&apos;s on the section before you pay for the LIM.
            </h1>
            <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-ink-muted">
              Type an Auckland address, confirm the right section, and read what
              the council maps say about it — flood, coastal, and what you can
              build — in plain English, with the source link next to every line.
              Built for first-home buyers, renovators, extenders, and people
              adding a dwelling. Free to use. Not a LIM.
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
                  {loading ? "Searching" : "Check this address"}
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
                No matches. Try a street name, or add the suburb.
              </p>
            )}

            <p className="label mt-8">Free · not a LIM · every line sourced</p>
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
          <p className="label">Who it&apos;s for</p>
          <h2 className="display mt-3 text-[1.75rem] md:text-[2rem]">
            Built around what you plan to do with the place.
          </h2>
          <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-muted">
            The report puts the check that matters most to your decision first.
            Pick the one that sounds like you.
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
                This version is for standalone houses and vacant sections.
                Places with messy boundaries need a different, slower check.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* worked example */}
      <section id="example" className="border-b border-hairline">
        <div className="mx-auto max-w-[1250px] px-4 py-16 md:py-24">
          <p className="label">A real example</p>
          <h2 className="display mt-3 text-[1.75rem] md:text-[2rem]">
            17 Shanaway Rise, Hillcrest — what the check actually showed.
          </h2>
          <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-muted">
            This is a real run on a real Auckland address, not a mockup. The
            section (LINZ parcel 5169096, 687 m²) is in Hillcrest. Here&apos;s what
            the check returned on 2 November 2026.
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
                <p className="label">Finding 04 · what you can build</p>
                <h3 className="display mt-1 text-[1.1rem] leading-snug">
                  Residential — Mixed Housing Suburban zone.
                </h3>
              </div>
              <span className="stamp text-st-detected bg-st-detected-wash border-st-detected-line">
                On the map
              </span>
            </div>
            <div className="px-5 py-4 text-[0.9rem] leading-relaxed">
              <p>
                The Unitary Plan zone for this section is Mixed Housing Suburban,
                and the check links to the exact rule chapter (H4) that sets
                what&apos;s permitted, discretionary, and non-complying here.
              </p>
              <p className="mt-3 text-ink-muted">
                <span className="label mr-2">What this doesn&apos;t tell you</span>
                The base zone only. Overlays (special character, historic
                heritage, significant ecological areas, volcanic viewshafts),
                precincts, and designations are separate layers we haven&apos;t
                added yet. This doesn&apos;t tell you the height, the activity
                status, or whether a specific consent would go through.
              </p>
              <p className="mt-4 border-t border-hairline pt-3 label">
                Source · Auckland Unitary Plan base zones (council data, free to reuse) · pulled on the day you run it
              </p>
            </div>
          </div>
          <p className="label mt-4">
            The same run also returned flood paths, flood-prone areas, and coastal
            storm-tide as not on this section — reported as &ldquo;not on the
            map&rdquo;, not as &ldquo;all clear&rdquo;. If the data had been
            missing, we&apos;d have said &ldquo;we couldn&apos;t check&rdquo;
            instead. That&apos;s the honesty rule.
          </p>
        </div>
      </section>

      {/* what we check */}
      <section id="checks" className="border-b border-hairline">
        <div className="mx-auto max-w-[1250px] px-4 py-16 md:py-24">
          <p className="label">What we check</p>
          <h2 className="display mt-3 text-[1.75rem] md:text-[2rem]">
            Four things on the report today.
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
          <p className="label">Why use this and not the council viewer or an AI report</p>
          <h2 className="display mt-3 text-[1.75rem] md:text-[2rem]">
            The difference is in the geometry, the honesty, and the source.
          </h2>
          <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-muted">
            None of this is marketing. It&apos;s how the checks are built — and
            you can tell the difference on the report itself.
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
          <p className="label">What it costs</p>
          <h2 className="display mt-3 text-[1.75rem] md:text-[2rem]">
            Free today. A paid PDF is coming.
          </h2>
          <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-muted">
            The on-screen report — type an address, confirm the section, read the
            findings with sources — is free today. A printable, shareable PDF is
            coming at NZ$25–30, as a screen before the LIM (the Auckland Council LIM
            is $375 and takes 10 working days). The paywall isn&apos;t built yet;
            we&apos;re not charging anyone anything right now.
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
              Council map data, pulled straight from the Auckland Council and LINZ
              data hubs under a free-to-reuse licence. Not a LIM, not ownership
              confirmation, not a promise you&apos;ll get consent. Flood, coastal,
              and the Unitary Plan zone are live today; slope and stormwater are
              still coming.
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
