import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "About — morebeanz",
  description:
    "What morebeanz is, in plain English: a free Auckland property check you run before you pay for the LIM. What it is, what it isn't, and how it's built.",
};

const PRINCIPLES = [
  {
    n: "01",
    title: "Straight from the council",
    body: "We pull the council's own flood, coastal, and zoning layers from the council's own data hub, under a free-to-reuse licence. We keep a public list of what we pulled and when. No mystery sources.",
  },
  {
    n: "02",
    title: "We check the section, not the street.",
    body: "Every line is matched to the actual land parcel — not a 500 m circle around the address. The finding is about your section, not your neighbourhood.",
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
];

export default function AboutPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader active="home" />
      <main className="mx-auto w-full max-w-[1250px] flex-1 px-4 py-12 md:py-16">
        <p className="label">About</p>
        <h1 className="display mt-3 text-[2rem] md:text-[2.25rem]">
          A free Auckland property check, before you pay for the LIM.
        </h1>
        <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-muted">
          morebeanz reads the council&apos;s own flood, coastal, and zoning maps for an
          Auckland section, and tells you what they mean for what you want to do
          with the place — live in it, renovate, extend, add a dwelling, or build
          on vacant land. It&apos;s preliminary research. It is not a LIM, not a
          building inspection, and not legal advice.
        </p>

        <section className="mt-12">
          <p className="label">How it&apos;s built</p>
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
            <li>— Not a LIM. Order one from Auckland Council before you commit.</li>
            <li>— Not ownership or title confirmation. The section match is geometry, not a title.</li>
            <li>— Not a building inspection, a weathertightness or meth test, or a registered valuation.</li>
            <li>— Not a promise you&apos;ll get consent. The zone check names the base zone; overlays, precincts, designations, and a full application decide that.</li>
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
