"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Candidate = { id: string; label: string };

const CHECKS = [
  {
    label: "Hazards",
    title: "Flood, overland flow, coastal",
    body: "Verified council hazard layers intersected with the full parcel — not the address point.",
  },
  {
    label: "Planning",
    title: "Zones and overlays",
    body: "Applicable Auckland Unitary Plan zones and selected overlays, with links to the rules.",
  },
  {
    label: "Terrain",
    title: "Approximate slope",
    body: "Slope indication where elevation data supports it. Stated as unavailable where it does not.",
  },
  {
    label: "Infrastructure",
    title: "Stormwater and more",
    body: "Selected mapped public infrastructure, starting with stormwater where available.",
  },
];

const STEPS = [
  { n: "01", title: "Search", body: "Enter an Auckland street address." },
  { n: "02", title: "Confirm parcel", body: "Pick the right parcel on the map." },
  { n: "03", title: "Read findings", body: "Ordered by what you intend to do." },
  { n: "04", title: "Compare & export", body: "Shortlist side by side; print with sources." },
];

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <nav className="label flex items-center gap-6">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#checks" className="hover:text-ink">What we check</a>
          </nav>
        </div>
      </header>

      {/* hero — asymmetric two-panel */}
      <section className="border-b border-hairline">
        <div className="mx-auto grid max-w-[1250px] grid-cols-1 md:grid-cols-2">
          {/* left: text + search */}
          <div className="border-hairline px-6 py-16 md:border-r md:px-10 md:py-24">
            <p className="label">Research</p>
            <h1 className="display mt-4 text-[2.25rem] md:text-[3rem]">
              Understand a property before you pay to investigate it.
            </h1>
            <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-ink-muted">
              Mapped hazards, planning, terrain and infrastructure — pulled from public
              Auckland sources, cited, and ordered by what you intend to do with the place.
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
                  onChange={(e) => setQ(e.target.value)}
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
            {candidates.length === 0 && !loading && q.length > 0 && (
              <p className="mt-3 text-sm text-ink-muted">
                No demo addresses match. Try &ldquo;Shanaway&rdquo; or &ldquo;Hobsonville&rdquo;.
              </p>
            )}

            <p className="label mt-8">Demo data · not a LIM</p>
          </div>

          {/* right: topographic backdrop */}
          <div className="relative hidden min-h-[420px] bg-surface md:block">
            <TopoBackdrop />
          </div>
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

      {/* how it works */}
      <section id="how" className="border-b border-hairline">
        <div className="mx-auto max-w-[1250px] px-4 py-16 md:py-24">
          <p className="label">How it works</p>
          <div className="mt-10 grid grid-cols-1 border border-hairline sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div
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
              </div>
            ))}
          </div>
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
            </div>
            <p className="max-w-md text-[0.8rem] leading-relaxed text-ink-muted">
              Demo fixtures only — not real assessments. Not a LIM, not ownership confirmation,
              not an approval guarantee. Every finding cites its source, dataset version, and
              retrieval date.
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
