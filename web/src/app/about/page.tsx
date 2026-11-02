import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "About — morebeanz",
  description:
    "What morebeanz is, the source-first principle, the four-state honesty rule, and what it is not (a LIM).",
};

const PRINCIPLES = [
  {
    n: "01",
    title: "Source-first",
    body: "Canonical Auckland Council layers are imported directly from the ArcGIS hub with verified CC BY 4.0 licences, recorded in a public dataset ledger. No third-party aggregation, no mystery sources.",
  },
  {
    n: "02",
    title: "Parcel-confirmed geometry",
    body: "Every hazard is intersected with the confirmed LINZ parcel polygon — not an address point, and not a 500 m search circle.",
  },
  {
    n: "03",
    title: "Four-state honesty",
    body: "Every finding is detected, not detected, unavailable, or needs review. Missing data is reported as unavailable — never as \"all clear\".",
  },
  {
    n: "04",
    title: "Deterministic, not AI-generated",
    body: "Findings are produced by deterministic rules against the imported layers, then linked to their source and retrieval date. The narrative cannot hallucinate.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader active="home" />
      <main className="mx-auto w-full max-w-[1250px] flex-1 px-4 py-12 md:py-16">
        <p className="label">About</p>
        <h1 className="display mt-3 text-[2rem] md:text-[2.25rem]">
          morebeanz is a parcel-precise Auckland property research tool.
        </h1>
        <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-muted">
          It brings public Auckland map data — hazards, planning, and (later)
          terrain and infrastructure — into one report, intersected with the
          confirmed land parcel and ordered by what you intend to do with the
          place. It is preliminary research, not a substitute for a LIM, a
          building inspection, or legal advice.
        </p>

        <section className="mt-12">
          <p className="label">Principles</p>
          <ul className="mt-6 grid grid-cols-1 border border-hairline sm:grid-cols-2">
            {PRINCIPLES.map((p, i) => (
              <li
                key={p.n}
                className={`border-hairline p-6 ${
                  i % 2 !== 0 ? "sm:border-l" : ""
                } ${i >= 2 ? "border-t sm:border-t-0" : ""} ${i >= 2 ? "sm:border-t" : ""}`}
              >
                <p className="label">{p.n}</p>
                <h2 className="display mt-3 text-[1.1rem]">{p.title}</h2>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-muted">{p.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 border border-hairline p-6">
          <p className="label">What morebeanz is not</p>
          <ul className="mt-4 space-y-2 text-[0.9rem] leading-relaxed text-ink-muted">
            <li>— Not a Land Information Memorandum (LIM). Order one from Auckland Council before you commit.</li>
            <li>— Not ownership confirmation. The parcel match is geometry, not title.</li>
            <li>— Not a building inspection, a weathertightness or meth assessment, or a registered valuation.</li>
            <li>— Not an approval guarantee. The zone check names the base zone; consent depends on overlays, precincts, designations, and a full application.</li>
          </ul>
        </section>

        <p className="label mt-10">
          See the <Link href="/support" className="text-accent hover:underline">support page</Link>{" "}
          for what the report covers, or the{" "}
          <Link href="/contact" className="text-accent hover:underline">contact page</Link> to reach us.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
