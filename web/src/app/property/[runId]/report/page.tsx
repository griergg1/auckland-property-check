"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import MapView from "@/components/MapView";
import { SiteHeader, SiteFooter, StatusStamp } from "@/components/SiteChrome";
import type { Finding } from "@/lib/schemas";

const INTENTIONS: { value: string; label: string }[] = [
  { value: "live", label: "Live there" },
  { value: "renovate", label: "Renovate" },
  { value: "extend", label: "Extend" },
  { value: "add_dwelling", label: "Add a dwelling" },
  { value: "vacant_build", label: "Build on vacant land" },
];

export default function ReportPage() {
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
  const [intention, setIntention] = useState<string>("live");

  useEffect(() => {
    if (!runId) return;
    (async () => {
      try {
        const res = await fetch(`/api/assessment/${runId}`);
        if (!res.ok) throw new Error("report not found");
        const data = await res.json();
        setFindings(data.findings ?? []);
        setParcelGeometries(data.parcelGeometries ?? []);
        if (data.intention) setIntention(data.intention);
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

  // simple intention-aware ordering: findings that mention the intention first
  const ordered = [...findings].sort((a, b) => {
    const ai = a.intentions?.includes(intention) ? 0 : 1;
    const bi = b.intentions?.includes(intention) ? 0 : 1;
    return ai - bi;
  });

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1250px] flex-1 px-4 py-12 md:py-16">
        {/* report header */}
        <div className="flex flex-col gap-4 border-b border-hairline pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label">Property report</p>
            <h1 className="display mt-2 text-[2rem] md:text-[2.25rem]">Findings</h1>
            <p className="label mt-2">Run {runId}</p>
          </div>
          <button
            onClick={() => window.print()}
            className="label self-start border border-hairline bg-surface px-4 py-2 text-ink hover:border-ink md:self-auto"
          >
            Print
          </button>
        </div>

        {/* intention selector */}
        <div className="mt-6">
          <p className="label">Order findings by intention</p>
          <div className="mt-3 flex flex-wrap gap-2">
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
        </div>

        {loading && <p className="mt-8 text-ink-muted">Loading…</p>}
        {error && <p className="mt-8 text-st-detected">{error}</p>}

        {!loading && (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_minmax(0,420px)]">
            {/* findings list */}
            <ul className="border border-hairline">
              {ordered.map((f, i) => {
                const isOpen = expanded === f.id;
                return (
                  <li key={f.id} className="border-b border-hairline last:border-b-0">
                    <button
                      onClick={() => setExpanded(isOpen ? null : f.id)}
                      className="w-full px-5 py-4 text-left hover:bg-surface"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="label">Finding {String(i + 1).padStart(2, "0")}</p>
                          <h2 className="display mt-1 text-[1.15rem] leading-snug">
                            {f.title}
                          </h2>
                        </div>
                        <StatusStamp status={f.status} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t border-hairline px-5 py-4 text-[0.9rem] leading-relaxed">
                        {f.explanation && <p>{f.explanation}</p>}
                        {f.limitations && (
                          <p className="mt-3 text-ink-muted">
                            <span className="label mr-2">Limitations</span>
                            {f.limitations}
                          </p>
                        )}
                        {f.followUpQuestions.length > 0 && (
                          <div className="mt-4">
                            <p className="label">Questions to investigate</p>
                            <ul className="mt-2 space-y-1">
                              {f.followUpQuestions.map((q, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="text-accent">—</span>
                                  <span>
                                    {q.question}{" "}
                                    <span className="label ml-1">({q.audience})</span>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {f.sourceUrl && (
                          <p className="mt-4 border-t border-hairline pt-3 label">
                            <a
                              href={f.sourceUrl}
                              className="text-accent hover:underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Source
                            </a>
                            {" · retrieved " + new Date(f.retrievalDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
              {ordered.length === 0 && (
                <li className="px-5 py-6 text-[0.9rem] text-ink-muted">No findings.</li>
              )}
            </ul>

            {/* sticky map */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <MapView
                parcelGeoJSON={parcelGeometries[0] ?? null}
                evidenceGeoJSON={firstEvidence}
                className="h-[420px] w-full border border-hairline"
              />
              <p className="label mt-2">
                Parcel outline in ink · evidence in accent
              </p>
            </div>
          </div>
        )}

        <p className="label mt-10">
          Demo fixtures · not a LIM · not ownership confirmation · not an approval guarantee
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
