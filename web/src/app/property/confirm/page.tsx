"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MapView from "@/components/MapView";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

type ParcelCandidate = {
  id: string;
  sourceParcelId: string | null;
  intent: string | null;
  areaM2: number | null;
  geometry: any;
  isDemo: boolean;
};

const INTENTIONS: { value: string; label: string }[] = [
  { value: "live", label: "Live there" },
  { value: "renovate", label: "Renovate" },
  { value: "extend", label: "Extend" },
  { value: "add_dwelling", label: "Add a dwelling" },
  { value: "vacant_build", label: "Build on vacant land" },
];

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-col">
          <SiteHeader />
          <main className="mx-auto max-w-[1250px] w-full px-4 py-16">Loading…</main>
          <SiteFooter />
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}

function ConfirmContent() {
  const router = useRouter();
  const params = useSearchParams();
  const addressId = params.get("addressId") ?? "";
  const [candidates, setCandidates] = useState<ParcelCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intention, setIntention] = useState("live");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!addressId) {
      setError("missing addressId");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/parcel/candidates", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ addressId }),
        });
        if (!res.ok) throw new Error("failed to load parcels");
        const data = await res.json();
        setCandidates(data.candidates ?? []);
      } catch (e: any) {
        setError(e.message ?? "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [addressId]);

  async function confirmAndRun() {
    if (submitting || !parcel) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/assessment/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ parcelIds: [parcel.id], intention }),
      });
      if (!res.ok) {
        setError("assessment failed");
        return;
      }
      const data = await res.json();
      router.push(`/property/${data.runId}/report`);
    } finally {
      setSubmitting(false);
    }
  }

  const parcel = candidates[0];
  const ambiguous = candidates.length > 1;
  const parcelFeature = parcel?.geometry
    ? ({ type: "Feature", geometry: parcel.geometry, properties: {} } as GeoJSON.Feature)
    : null;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1250px] flex-1 px-4 py-12 md:py-16">
        <p className="label">Confirm parcel</p>
        <h1 className="display mt-3 text-[2rem] md:text-[2.25rem]">Is this the right property?</h1>
        <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
          Confirm the highlighted land parcel before running checks. Address-to-parcel match is
          not ownership confirmation.
        </p>

        {loading && <p className="mt-8 text-ink-muted">Loading parcel…</p>}
        {error && <p className="mt-8 text-st-detected">{error}</p>}

        {!loading && parcel && (
          <div className="mt-10 grid grid-cols-1 border border-hairline lg:grid-cols-2">
            {/* left: map + parcel facts */}
            <div className="border-hairline p-5 lg:border-r">
              <MapView
                parcelGeoJSON={parcelFeature}
                className="h-[360px] w-full border border-hairline"
              />
              <dl className="mt-4 text-[0.9rem]">
                <div className="flex justify-between border-b border-hairline py-2">
                  <dt className="label">Parcel ID</dt>
                  <dd className="font-mono text-[0.8rem]">
                    {parcel.sourceParcelId ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-hairline py-2">
                  <dt className="label">Intent</dt>
                  <dd className="text-ink-muted">{parcel.intent ?? "—"}</dd>
                </div>
                <div className="flex justify-between border-b border-hairline py-2">
                  <dt className="label">Area</dt>
                  <dd className="text-ink-muted">
                    {parcel.areaM2 ? `${parcel.areaM2.toLocaleString()} m²` : "—"}
                  </dd>
                </div>
              </dl>
              {ambiguous && (
                <p className="stamp mt-4 text-st-review bg-st-review-wash border-st-review-line">
                  Needs review · {candidates.length} candidate parcels
                </p>
              )}
            </div>

            {/* right: intention + action */}
            <div className="p-5">
              <p className="label">Your intention</p>
              <p className="mt-2 text-[0.9rem] text-ink-muted">
                Findings will be ordered by what you plan to do.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {INTENTIONS.map((it) => {
                  const selected = intention === it.value;
                  return (
                    <button
                      key={it.value}
                      type="button"
                      onClick={() => setIntention(it.value)}
                      className={`label border px-3 py-2 ${
                        selected
                          ? "border-ink bg-ink text-paper"
                          : "border-hairline bg-surface text-ink hover:border-ink"
                      }`}
                    >
                      {it.label}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={confirmAndRun}
                disabled={submitting}
                className="label mt-8 w-full border border-ink bg-paper px-4 py-3 text-ink hover:bg-ink hover:text-paper disabled:opacity-40"
              >
                {submitting ? "Running checks" : "Confirm and run checks"}
              </button>

              <p className="label mt-4">
                Demo fixtures · not a LIM
              </p>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
