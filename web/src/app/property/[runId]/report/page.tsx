"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import MapView from "@/components/MapView";
import type { Finding } from "@/lib/schemas";

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  detected: { text: "Detected", color: "text-red-700 bg-red-50 border-red-200" },
  not_detected: { text: "Not detected", color: "text-green-700 bg-green-50 border-green-200" },
  unavailable: { text: "Unavailable", color: "text-amber-700 bg-amber-50 border-amber-200" },
  needs_review: { text: "Needs review", color: "text-purple-700 bg-purple-50 border-purple-200" },
};

export default function ReportPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-4xl px-4 py-8">Loading…</main>}>
      <ReportContent />
    </Suspense>
  );
}

function ReportContent() {
  const params = useParams();
  const runId = (params?.runId ?? "") as string;
  const [findings, setFindings] = useState<Finding[]>([]);
  const [parcelGeometries, setParcelGeometries] = useState<(GeoJSON.Feature | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;
    (async () => {
      try {
        const res = await fetch(`/api/assessment/${runId}`);
        if (!res.ok) throw new Error("report not found");
        const data = await res.json();
        setFindings(data.findings ?? []);
        setParcelGeometries(data.parcelGeometries ?? []);
      } catch (e: any) {
        setError(e.message ?? "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [runId]);

  const firstEvidence = findings.find((f) => f.evidenceGeometry)?.evidenceGeometry
    ? ({
        type: "Feature",
        geometry: findings.find((f) => f.evidenceGeometry)!.evidenceGeometry,
        properties: {},
      } as GeoJSON.Feature)
    : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Property report</h1>
        <button
          onClick={() => window.print()}
          className="rounded border border-neutral-300 px-3 py-1 text-sm"
        >
          Print
        </button>
      </div>
      <p className="mt-1 text-sm text-neutral-600">
        Findings first. Expand any finding for evidence and source.
      </p>
      {loading && <p className="mt-4">Loading…</p>}
      {error && <p className="mt-4 text-red-700">{error}</p>}
      {!loading && (
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <MapView
            parcelGeoJSON={parcelGeometries[0] ?? null}
            evidenceGeoJSON={firstEvidence}
            className="h-80 w-full rounded border"
          />
          <ul className="space-y-3">
            {findings.map((f) => {
              const s = STATUS_LABELS[f.status] ?? STATUS_LABELS.unavailable;
              const isOpen = expanded === f.id;
              return (
                <li key={f.id} className="rounded border border-neutral-200">
                  <button
                    onClick={() => setExpanded(isOpen ? null : f.id)}
                    className="w-full px-4 py-3 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{f.title}</span>
                      <span className={`rounded border px-2 py-0.5 text-xs ${s.color}`}>
                        {s.text}
                      </span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-neutral-200 px-4 py-3 text-sm">
                      {f.explanation && <p>{f.explanation}</p>}
                      {f.limitations && (
                        <p className="mt-2 text-neutral-600">
                          <strong>Limitations:</strong> {f.limitations}
                        </p>
                      )}
                      {f.followUpQuestions.length > 0 && (
                        <div className="mt-3">
                          <p className="font-medium">Questions to investigate</p>
                          <ul className="mt-1 list-disc pl-5">
                            {f.followUpQuestions.map((q, i) => (
                              <li key={i}>
                                {q.question}{" "}
                                <span className="text-neutral-500">({q.audience})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {f.sourceUrl && (
                        <p className="mt-3">
                          <a href={f.sourceUrl} className="text-blue-700 underline" target="_blank" rel="noreferrer">
                            Source
                          </a>
                          {" — retrieved " + new Date(f.retrievalDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
            {findings.length === 0 && (
              <li className="text-sm text-neutral-500">No findings.</li>
            )}
          </ul>
        </div>
      )}
      <p className="mt-8 text-xs text-neutral-500">
        Demo fixtures only — not real assessments. Not a LIM, not ownership confirmation, not an approval guarantee.
      </p>
    </main>
  );
}
