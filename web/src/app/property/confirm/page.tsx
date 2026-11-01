"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MapView from "@/components/MapView";

type ParcelCandidate = {
  id: string;
  sourceParcelId: string | null;
  intent: string | null;
  areaM2: number | null;
  geometry: any;
  isDemo: boolean;
};

export default function ConfirmPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-4xl px-4 py-8">Loading…</main>}>
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

  const [submitting, setSubmitting] = useState(false);

  async function confirmAndRun() {
    if (submitting || !parcel) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/assessment/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          parcelIds: [parcel.id],
          intention,
        }),
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
  const parcelFeature = parcel?.geometry
    ? ({ type: "Feature", geometry: parcel.geometry, properties: {} } as GeoJSON.Feature)
    : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-semibold">Confirm the property</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Confirm the highlighted land parcel before running checks.
      </p>
      {loading && <p className="mt-4">Loading parcel…</p>}
      {error && <p className="mt-4 text-red-700">{error}</p>}
      {!loading && parcel && (
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <MapView parcelGeoJSON={parcelFeature} className="h-80 w-full rounded border" />
            <dl className="mt-3 text-sm">
              <div className="flex justify-between border-b py-1">
                <dt className="text-neutral-500">Parcel ID</dt>
                <dd>{parcel.sourceParcelId ?? "—"}</dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-neutral-500">Intent</dt>
                <dd>{parcel.intent ?? "—"}</dd>
              </div>
              <div className="flex justify-between border-b py-1">
                <dt className="text-neutral-500">Area</dt>
                <dd>{parcel.areaM2 ? `${parcel.areaM2} m²` : "—"}</dd>
              </div>
            </dl>
          </div>
          <div>
            <label className="text-sm font-medium">Your intention for this property</label>
            <select
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              className="mt-2 w-full rounded border border-neutral-300 px-3 py-2"
            >
              <option value="live">Live there</option>
              <option value="renovate">Renovate</option>
              <option value="extend">Extend</option>
              <option value="add_dwelling">Add a dwelling</option>
              <option value="vacant_build">Build on vacant land</option>
            </select>
            <button
              onClick={confirmAndRun}
              disabled={submitting}
              className="mt-4 w-full rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
            >
              {submitting ? "Running checks…" : "Confirm and run checks"}
            </button>
            <p className="mt-3 text-xs text-neutral-500">
              Demo fixtures only. Not a LIM. Address-to-parcel match is not ownership confirmation.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
