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

  // If a rating valuation finding exists and was detected, pull the structured
  // values from the cache so the report header can render them as fields.
  let ratingValuation: any = null;
  const rvFinding = findings.find((f: any) => f.checkId === "value.rating_valuation");
  if (rvFinding && rvFinding.status === "detected" && rvFinding.featureIds?.[0]) {
    const { data: rvRow } = await sb
      .from("rating_valuation_cache")
      .select("*")
      .eq("ac_rate_account_key", String(rvFinding.featureIds[0]))
      .maybeSingle();
    if (rvRow) {
      ratingValuation = {
        acRateAccountKey: rvRow.ac_rate_account_key,
        address: rvRow.address,
        capitalValue: rvRow.capital_value,
        landValue: rvRow.land_value,
        improvementValue: rvRow.improvement_value,
        annualRates: rvRow.annual_rates,
        valuationNumber: rvRow.valuation_number,
        landAreaM2: rvRow.land_area_m2,
        totalFloorAreaM2: rvRow.total_floor_area_m2,
        buildingSiteCoverageM2: rvRow.building_site_coverage_m2,
        landUseDescription: rvRow.land_use_description,
        localBoard: rvRow.local_board,
        propertyCategory: rvRow.property_category,
        legalDescription: rvRow.legal_description,
        fetchedAt: rvRow.fetched_at,
      };
    }
  }

  // The "what to ask" layer — deterministic questions derived from this run's
  // findings + the buyer's intention. Same RULE_VERSION pattern as the checks.
  let questions: { audience: string; question: string; checkId: string; rationale: string }[] = [];
  const { data: questionRows } = await sb.rpc("generate_questions", {
    p_run_id: runId,
    p_intention: run.intention ?? "live",
  });
  questions = (questionRows ?? []).map((q: any) => ({
    audience: q.audience,
    question: q.question,
    checkId: q.check_id,
    rationale: q.rationale,
  }));

  return NextResponse.json({
    runId: run.id,
    intention: run.intention,
    ruleVersion: run.rule_version,
    datasetVersionIds: run.dataset_version_ids ?? [],
    findings,
    ratingValuation,
    questions,
    parcelGeometries,
    isDemo: false,
  });
}
