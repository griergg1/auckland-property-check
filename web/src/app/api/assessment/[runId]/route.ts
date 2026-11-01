import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  const sb = await supabaseServer();

  const { data: run, error: runErr } = await sb
    .from("assessment_runs")
    .select("id, intention, rule_version, dataset_version_ids, completed_at, parcel_ids")
    .eq("id", runId)
    .single();
  if (runErr || !run) {
    return NextResponse.json({ error: "run not found" }, { status: 404 });
  }

  const { data: findingRows, error: findingsErr } = await sb
    .from("findings")
    .select("id, check_id, rule_version, status, title, explanation, limitations, follow_up_questions, source_url, dataset_version_id, feature_ids, evidence_geom, retrieval_date, intentions")
    .eq("run_id", runId);
  if (findingsErr) {
    return NextResponse.json({ error: findingsErr.message }, { status: 500 });
  }

  // Fetch parcel geometries for the map
  const parcelGeometries: (GeoJSON.Feature | null)[] = [];
  for (const parcelId of (run.parcel_ids ?? []) as string[]) {
    const { data: geo } = await sb.rpc("parcel_geojson_4326", { p_parcel_id: parcelId });
    parcelGeometries.push(
      geo ? ({ type: "Feature", geometry: geo as any, properties: { id: parcelId } } as GeoJSON.Feature) : null,
    );
  }

  const findings = (findingRows ?? []).map((f: any) => ({
    id: f.id,
    checkId: f.check_id,
    ruleVersion: f.rule_version,
    status: f.status,
    title: f.title,
    explanation: f.explanation ?? undefined,
    limitations: f.limitations ?? undefined,
    followUpQuestions: f.follow_up_questions ?? [],
    sourceUrl: f.source_url ?? undefined,
    datasetVersionId: f.dataset_version_id,
    featureIds: f.feature_ids ?? [],
    evidenceGeometry: f.evidence_geom ?? null,
    retrievalDate: f.retrieval_date,
    intentions: f.intentions ?? ["live"],
  }));

  return NextResponse.json({
    runId: run.id,
    intention: run.intention,
    ruleVersion: run.rule_version,
    datasetVersionIds: run.dataset_version_ids ?? [],
    findings,
    parcelGeometries,
    isDemo: true,
  });
}
