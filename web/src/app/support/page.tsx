import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Support — morebeanz",
  description:
    "What the morebeanz report covers, what it doesn't, how current the data is, and whether it's a LIM. In plain English.",
};

const FAQ = [
  {
    q: "What does the report cover?",
    a: "Four things today: council flood paths, flood-prone areas, coastal storm-tide, and the Unitary Plan zone for the section. Each one is matched to the actual section, comes back as yes / no / we couldn't tell / needs a human, and links to the source and the date we pulled it.",
  },
  {
    q: "What does the report NOT cover?",
    a: "Overlays (special character, historic heritage, significant ecological areas, volcanic viewshafts), precincts, designations, landslide, coastal erosion, tsunami zones, slope, stormwater, title restrictions, consent history, and sea-level-rise coastal scenarios. These are on the to-do list; until a layer is pulled and checked, it's not on the report.",
  },
  {
    q: "How current is the data?",
    a: "Every finding carries the date the check ran. The dataset list records the source, the licence, and the version of every layer we pulled. The council publishes updated flood maps from time to time; we re-pull when a new version comes out and retire the old one.",
  },
  {
    q: "Is it a LIM?",
    a: "No. A LIM is an official council document that costs $375 (10 working days) or $506 urgent (3 days). morebeanz is the screen before the LIM — to help you decide which sections are worth ordering a LIM, a building inspection, or legal advice on.",
  },
  {
    q: "What does \"we couldn't tell\" mean?",
    a: "It means the check didn't run — the layer's missing, the section's outside the area the map covers, or the data didn't come back. We never say \"all clear\" when that happens. \"We couldn't tell\" is an honest answer, not a pass.",
  },
  {
    q: "Why is the section sometimes ambiguous?",
    a: "An address dot can sit where several sections overlap — common on corner sites, rear units, and cross-leases. The confirm page lists every section that contains the address and asks you to pick. The check runs on the one you pick.",
  },
  {
    q: "What does it cost?",
    a: "The on-screen report is free today. A printable, shareable PDF is coming at NZ$25–30. The paywall isn't built yet; we're not charging anyone anything right now.",
  },
];

export default function SupportPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader active="home" />
      <main className="mx-auto w-full max-w-[1250px] flex-1 px-4 py-12 md:py-16">
        <p className="label">Support</p>
        <h1 className="display mt-3 text-[2rem] md:text-[2.25rem]">
          Questions, answered straight.
        </h1>
        <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-muted">
          If yours isn&apos;t here, email{" "}
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
