import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Support — morebeanz",
  description:
    "What the morebeanz report covers, what it does not cover, how current the data is, and whether it is a LIM.",
};

const FAQ = [
  {
    q: "What does the report cover?",
    a: "Four checks today: Auckland Council overland flow paths, flood prone areas, coastal storm-tide (1% AEP, present-day sea level), and the Auckland Unitary Plan base zone. Each finding is intersected with the confirmed LINZ parcel polygon, returned in one of four states, and linked to its source and retrieval date.",
  },
  {
    q: "What does the report NOT cover?",
    a: "Overlays (special character, historic heritage, significant ecological areas, volcanic viewshafts), precincts, designations, landslide susceptibility, coastal erosion, tsunami zones, terrain/slope, stormwater infrastructure, title restrictions, consent history, and sea-level-rise coastal scenarios. These are on the backlog; until a layer is imported and verified, it is not in the report.",
  },
  {
    q: "How current is the data?",
    a: "Each finding carries a retrieval date — the day the check ran against the imported layer. The dataset ledger records the source, licence, and version of every imported layer. Auckland Council publishes updated hazard layers periodically; we re-import when a new version is published and retire the old one.",
  },
  {
    q: "Is it a LIM?",
    a: "No. A Land Information Memorandum is an official council document that costs $375 (10 working days) or $506 urgent (3 days). morebeanz is preliminary research — a pre-LIM screen to help you decide which properties are worth ordering a LIM, a building inspection, or legal advice on.",
  },
  {
    q: "What does \"unavailable\" mean?",
    a: "It means the check could not be completed — the layer is missing, the parcel is outside coverage, or the data did not return. We never say \"all clear\" on missing data. \"Unavailable\" is an honest state, not a pass.",
  },
  {
    q: "Why is the parcel sometimes ambiguous?",
    a: "An address point can sit where several parcels overlap (common with corner sites, rear units, and cross-leases). The confirm page lists every parcel that contains the address and asks you to choose. The check runs against the parcel you pick.",
  },
  {
    q: "What does it cost?",
    a: "The on-screen report is free today. A printable, shareable PDF report is planned at NZ$25–30. The paywall is not built yet; nothing is being charged.",
  },
];

export default function SupportPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader active="home" />
      <main className="mx-auto w-full max-w-[1250px] flex-1 px-4 py-12 md:py-16">
        <p className="label">Support</p>
        <h1 className="display mt-3 text-[2rem] md:text-[2.25rem]">
          Frequently asked questions.
        </h1>
        <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-muted">
          Short, factual answers. If your question is not here, email{" "}
          <a href="mailto:hello@morebeanz.com" className="text-accent hover:underline">
            hello@morebeanz.com
          </a>{" "}
          or use the{" "}
          <Link href="/contact" className="text-accent hover:underline">contact page</Link>.
        </p>

        <ul className="mt-10 divide-y divide-hairline border border-hairline">
          {FAQ.map((item) => (
            <li key={item.q} className="px-5 py-5">
              <p className="display text-[1.05rem]">{item.q}</p>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-muted">{item.a}</p>
            </li>
          ))}
        </ul>

        <p className="label mt-10">
          Email ·{" "}
          <a href="mailto:hello@morebeanz.com" className="text-accent hover:underline">
            hello@morebeanz.com
          </a>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
