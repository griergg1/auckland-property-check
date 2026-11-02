import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Contact — morebeanz",
  description: "Email morebeanz. A free Auckland property check, sourced from the council and LINZ.",
};

export default function ContactPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader active="home" />
      <main className="mx-auto w-full max-w-[1250px] flex-1 px-4 py-12 md:py-16">
        <p className="label">Contact</p>
        <h1 className="display mt-3 text-[2rem] md:text-[2.25rem]">
          Email is the fastest way to reach us.
        </h1>
        <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-muted">
          There&apos;s no contact form yet — it would need a backend we haven&apos;t
          built. For now, email is direct, and we read it.
        </p>

        <section className="mt-10 border border-hairline p-6">
          <p className="label">Email</p>
          <p className="display mt-3 text-[1.4rem]">
            <a href="mailto:hello@morebeanz.com" className="text-accent hover:underline">
              hello@morebeanz.com
            </a>
          </p>
          <p className="mt-4 text-[0.9rem] leading-relaxed text-ink-muted">
            Helpful things to include:
          </p>
          <ul className="mt-3 space-y-1 text-[0.9rem] leading-relaxed text-ink-muted">
            <li>— The Auckland address you ran (or tried to run).</li>
            <li>— What you expected to see, and what you saw instead.</li>
            <li>— The run id from the report page, if you have one.</li>
            <li>— Which one you picked: live there, renovate, extend, add a dwelling, or build on vacant land.</li>
          </ul>
        </section>

        <p className="label mt-10">
          There is no contact form yet. Please don&apos;t send sensitive personal
          information by email.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
