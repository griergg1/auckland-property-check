import Link from "next/link";
import Image from "next/image";

export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/morebeanz-logo.png"
      alt="morebeanz"
      width={1376}
      height={237}
      className={className}
      priority
    />
  );
}

/* Shared nav links — used by both the home page header and SiteHeader */
const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/support", label: "Support" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ active }: { active?: "home" | "shortlist" }) {
  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex max-w-[1250px] flex-wrap items-center justify-between gap-y-2 px-4 py-4">
        <Link href="/" className="flex items-center">
          <Logo className="h-7 w-auto sm:h-8" />
        </Link>
        <nav className="label flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-6">
          <Link
            href="/"
            className={active === "home" ? "text-ink" : "hover:text-ink"}
          >
            Home
          </Link>
          <Link
            href="/shortlist/compare"
            className={`hidden sm:inline ${active === "shortlist" ? "text-ink" : "hover:text-ink"}`}
          >
            Shortlist
          </Link>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto">
      <div className="mx-auto max-w-[1250px] px-4 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Logo className="h-7 w-auto" />
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
            data hubs under a free-to-reuse licence. The rating valuation is
            pulled live from Auckland Council&apos;s public rates search (a
            public per-property API, not an open-licensed feed). Not a LIM, not
            ownership confirmation, not a promise you&apos;ll get consent.
            Rating valuation, school zones, flood, coastal, and the Unitary
            Plan zone are live today; overlays and more hazards are still coming.
          </p>
        </div>
        <hr className="rule mt-8" />
        <p className="label mt-4">© morebeanz</p>
      </div>
    </footer>
  );
}

/* Status stamp — earthy, archival */
const STATUS_STYLES: Record<string, { text: string; cls: string }> = {
  detected: { text: "Detected", cls: "text-st-detected bg-st-detected-wash border-st-detected-line" },
  not_detected: { text: "Not detected", cls: "text-st-clear bg-st-clear-wash border-st-clear-line" },
  unavailable: { text: "Unavailable", cls: "text-st-unavail bg-st-unavail-wash border-st-unavail-line" },
  needs_review: { text: "Needs review", cls: "text-st-review bg-st-review-wash border-st-review-line" },
};

export function StatusStamp({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.unavailable;
  return <span className={`stamp ${s.cls}`}>{s.text}</span>;
}
