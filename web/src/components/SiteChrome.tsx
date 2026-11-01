import Link from "next/link";

/* Parcel + contour mark — matches /public/mark.svg */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="text-ink"
    >
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

export function SiteHeader({ active }: { active?: "home" | "shortlist" }) {
  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex max-w-[1250px] items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Mark />
            <span className="display text-[1.15rem] leading-none">morebeanz</span>
          </Link>
        <nav className="label flex items-center gap-6">
          <Link
            href="/"
            className={active === "home" ? "text-ink" : "hover:text-ink"}
          >
            Home
          </Link>
          <Link
            href="/shortlist/compare"
            className={active === "shortlist" ? "text-ink" : "hover:text-ink"}
          >
            Shortlist
          </Link>
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
              <Mark />
              <span className="display text-[1.15rem]">morebeanz</span>
            </div>
            <p className="label mt-3">Preliminary property research · Auckland</p>
          </div>
          <p className="max-w-md text-[0.8rem] leading-relaxed text-ink-muted">
            Public Auckland map data. Not a LIM, not ownership confirmation, not an
            approval guarantee. Overland flow is the live check; other layers are not
            assessed yet.
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
