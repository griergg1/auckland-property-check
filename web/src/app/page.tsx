"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FieldSheet, FloodPlate, SchoolPlate, ValuePlate, ZonePlate } from "@/components/HomeGraphics";
import { Logo } from "@/components/SiteChrome";

type Candidate = { id: string; label: string };

const CHECKS = [
  {
    label: "Live now",
    title: "Value & rates",
    body: "The council rating valuation (CV, land value, improvement value) and the annual council rates, pulled live from Auckland Council's public rates search and shown on the report header.",
    plate: ValuePlate,
  },
  {
    label: "Live now",
    title: "School zones",
    body: "The primary, intermediate, and secondary enrolment home zones that contain the property, from the Ministry of Education. The Equity Index join is still being wired.",
    plate: SchoolPlate,
  },
  {
    label: "Live now",
    title: "Flood & coastal",
    body: "Council flood maps — overland flow paths, flood-prone areas, and coastal storm-tide — matched to your property, not the street.",
    plate: FloodPlate,
  },
  {
    label: "Live now",
    title: "What you can build",
    body: "The Unitary Plan zone for the property, named in plain English, with a link to the exact rule chapter. Overlays and precincts are still being added.",
    plate: ZonePlate,
  },
];

const AUDIENCES = [
  {
    label: "First-home buyer",
    title: "What's it worth, and what are the schools?",
    body: "The council rating valuation, the annual rates, and the school enrolment zones come first — the value and the neighbourhood, not just the flood lines.",
  },
  {
    label: "Renovator",
    title: "Can I alter, and what are the limits?",
    body: "The zone check names what's permitted on the property and links to the rule chapter. Overlays and precincts are still being added.",
  },
  {
    label: "Extender",
    title: "Where on the property can I build out?",
    body: "Flood paths and ponding areas are matched to the property, so the extension's position and drainage questions are concrete, not a guess.",
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
    title: "We check the property, not the street.",
    body: "Every flood and planning line is matched to the actual land parcel — not a 500 m circle around the address. The finding is about your property, not your neighbourhood.",
  },
  {
    n: "02",
    title: "Ordered for what you're actually doing.",
    body: "Renovating, extending, adding a dwelling, or building on vacant land — the check that matters most to that decision comes first. You don't wade through someone else's checklist.",
  },
  {
    n: "03",
    title: "We don't say \"all clear\" when we don't know.",
    body: "Every finding is one of four things: yes, no, we couldn't tell, or it needs a human to look. If the map's missing, we say so — we never call a property safe just because the map was blank.",
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
    title: "Confirm the property",
    body: "If more than one property contains the address, you pick the right one. The check runs on the property you pick — not on the address dot.",
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
      <div className="border-b border-hairline">
        <p className="label mx-auto max-w-[1250px] px-4 py-2 text-center">
          Free to use · Not a LIM · Every line sourced
        </p>
      </div>

      {/* header */}
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1250px] items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center">
            <Logo />
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
            <p className="label">Auckland property report</p>
            <h1 className="display mt-4 text-[2.25rem] md:text-[3rem]">
              Know what a property is worth and what&apos;s on it before you pay for the LIM.
            </h1>
            <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-ink-muted">
              Type an Auckland address, confirm the right property, and read what
              the council and LINZ know about it — the rating valuation and annual
              rates, the school enrolment zones, the flood and coastal maps, and
              what you can build — in plain English, with the source link next to
              every line. Built for first-home buyers, renovators, extenders, and
              people adding a dwelling. Free to use. Not a LIM.
            </p>

            <form onSubmit={search} className="mt-8 max-w-md">
              <label className="label block" htmlFor="addr">
                Address
              </label>
              <div className="mt-2 flex flex-col border border-hairline bg-surface sm:flex-row">
                <input
                  id="addr"
                  type="text"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setSearched(false);
                  }}
                  placeholder="Enter an Auckland street address"
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[0.95rem] placeholder:text-ink-muted focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || q.length < 2}
                  className="label border-t border-hairline px-5 py-3 text-ink hover:bg-ink hover:text-paper disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink sm:border-t-0 sm:border-l"
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
                      onClick={() => router.push(`/property/confirm?addressId=${encodeURIComponent(c.id)}&label=${encodeURIComponent(c.label)}`)}
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

          {/* right: a real field sheet, not a faint pattern */}
          <div className="wash border-t border-hairline p-4 sm:p-6 md:border-t-0 md:p-8">
            <FieldSheet />
            <p className="label mt-3">
              17 Shanaway Rise, Hillcrest · LINZ parcel 5169096 · 687 m²
            </p>
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
            The report puts the check that matters most to your decision first —
            the value and rates for a buyer, the zone for a renovator, the flood
            lines for an extender. Pick the one that sounds like you.
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
                This version is for standalone houses and vacant properties.
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
            17 Shanaway Rise, Hillcrest — what the report actually showed.
          </h2>
          <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-muted">
            This is a real run on a real Auckland address, not a mockup. The
            property (LINZ parcel 5169096, 687 m²) is in Hillcrest. Here&apos;s what
            the report returned on 2 November 2026.
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
                <p className="display text-[2.75rem] leading-none text-accent">{s.n}</p>
                <h3 className="display mt-4 text-[1.15rem]">{s.title}</h3>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-muted">{s.body}</p>
              </li>
            ))}
          </ol>

          {/* real rating valuation from the live run on 2 Nov 2026 */}
          <div className="tide mt-8 border border-ink">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              {[
                ["Capital value", "$1,350,000"],
                ["Land value", "$1,150,000"],
                ["Improvement", "$200,000"],
                ["Rates", "$4,516"],
              ].map(([k, v], i) => (
                <div
                  key={k}
                  className={`tide-line px-5 py-6 ${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t lg:border-t-0" : ""} ${i > 0 ? "lg:border-l" : ""}`}
                >
                  <p className="label tide-muted">{k}</p>
                  <p className="display mt-2 text-[1.7rem] text-paper md:text-[2rem]">{v}</p>
                </div>
              ))}
            </div>
            <p className="tide-line tide-muted border-t px-5 py-3 text-[0.8rem] leading-relaxed">
              Council rating valuation, not a market value. Land 685 m², floor 130 m²,
              Kaipatiki local board. Pulled 2 November 2026 from Auckland Council&apos;s public rates search.
            </p>
          </div>

          {/* real zone + school zones from the live run */}
          <div className="mt-4 grid grid-cols-1 border border-hairline sm:grid-cols-2">
            <div className="border-hairline p-5 sm:border-r">
              <p className="label">What you can build</p>
              <h3 className="display mt-2 text-[1.05rem] leading-snug">
                Residential — Mixed Housing Suburban zone.
              </h3>
              <p className="mt-2 text-[0.85rem] leading-relaxed text-ink-muted">
                The Unitary Plan zone for this property, with a link to the exact
                rule chapter (H4) that sets what&apos;s permitted, discretionary,
                and non-complying here. Overlays and precincts are separate layers
                not yet added.
              </p>
              <span className="stamp mt-3 inline-block text-st-detected bg-st-detected-wash border-st-detected-line">
                On the map
              </span>
            </div>
            <div className="p-5">
              <p className="label">School enrolment zones</p>
              <h3 className="display mt-2 text-[1.05rem] leading-snug">
                Northcote College, Northcote Intermediate, Willow Park.
              </h3>
              <p className="mt-2 text-[0.85rem] leading-relaxed text-ink-muted">
                The property&apos;s centroid sits inside three enrolment home
                zones — a secondary (Northcote College), an intermediate
                (Northcote Intermediate), and a contributing primary (Willow
                Park). The Equity Index join is still being wired; until then we
                show the school name and type.
              </p>
              <span className="stamp mt-3 inline-block text-st-detected bg-st-detected-wash border-st-detected-line">
                On the map
              </span>
            </div>
          </div>
          <p className="label mt-4">
            The same run also returned flood paths, flood-prone areas, and coastal
            storm-tide as not on this property — reported as &ldquo;not on the
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
            On the report today.
          </h2>
          <div className="mt-10 grid grid-cols-1 border border-hairline sm:grid-cols-2 lg:grid-cols-4">
            {CHECKS.map((c, i) => {
              const Plate = c.plate;
              return (
                <div
                  key={c.title}
                  className={`border-hairline ${
                    i % 4 !== 0 ? "lg:border-l" : ""
                  } ${i % 2 !== 0 ? "sm:border-l lg:border-l-0" : ""} ${
                    i >= 1 ? "border-t sm:border-t-0" : ""
                  } ${i >= 2 ? "lg:border-t" : ""}`}
                >
                  <div className="border-b border-hairline bg-surface">
                    <Plate />
                  </div>
                  <div className="p-6">
                    <p className="label">{c.label}</p>
                    <h3 className="display mt-3 text-[1.15rem]">{c.title}</h3>
                    <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-muted">{c.body}</p>
                  </div>
                </div>
              );
            })}
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
      <section className="tide border-b border-hairline">
        <div className="mx-auto grid max-w-[1250px] grid-cols-1 items-end gap-8 px-4 py-16 md:grid-cols-[auto_1fr] md:py-24">
          <p className="display text-[5.5rem] leading-none tracking-tight md:text-[7rem]">$0</p>
          <div>
            <p className="label tide-muted">What it costs</p>
            <h2 className="display mt-3 text-[1.75rem] text-paper md:text-[2rem]">
              Free today. A paid PDF is coming.
            </h2>
            <p className="tide-muted mt-4 max-w-2xl text-[0.95rem] leading-relaxed">
              The on-screen report — type an address, confirm the property, read the
              findings with sources — is free today. A printable, shareable PDF is
              coming at NZ$25–30, as a screen before the LIM (the Auckland Council LIM
              is $375 and takes 10 working days). The paywall isn&apos;t built yet;
              we&apos;re not charging anyone anything right now.
            </p>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="mt-auto">
        <div className="mx-auto max-w-[1250px] px-4 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Logo className="h-7 w-auto" />
              <p className="label mt-3">Preliminary property research · Auckland</p>
              <nav className="label mt-3 flex flex-wrap gap-x-4 gap-y-1">
                <Link href="/about" className="hover:text-ink">About</Link>
                <Link href="/support" className="hover:text-ink">Support</Link>
                <Link href="/contact" className="hover:text-ink">Contact</Link>
              </nav>
            </div>
            <p className="max-w-md text-[0.8rem] leading-relaxed text-ink-muted">
            Council map data, pulled straight from the Auckland Council and LINZ
            data hubs under a free-to-reuse licence. The rating valuation is
            pulled live from Auckland Council&apos;s public rates search (a
            public per-property API, not an open-licensed feed). Not a LIM, not
            ownership confirmation, not a promise you&apos;ll get consent.
            Rating valuation, school zones, flood, coastal, and the Unitary
            Plan zone are live today; overlays and more hazards are still
            coming.
          </p>
          </div>
          <hr className="rule mt-8" />
          <p className="label mt-4">© morebeanz</p>
        </div>
      </footer>
    </div>
  );
}

