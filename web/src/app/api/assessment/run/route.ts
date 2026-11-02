import { NextResponse } from "next/server";
import {
  AssessmentRunRequest,
  AssessmentRunResponse,
} from "@/lib/schemas";
import { supabaseServer } from "@/lib/supabase/server";
import { runChecksForParcel, RULE_VERSION } from "@/lib/assessment";

export async function POST(request: Request) {
  const body = AssessmentRunRequest.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const { parcelIds, intention } = body.data;
  const sb = await supabaseServer();

  // Fetch active dataset version ids for traceability
  const { data: versions } = await sb
    .from("dataset_versions")
    .select("id, dataset_slug")
    .eq("status", "active");
  const datasetVersionIds = (versions ?? []).map((v: any) => v.id);

  // Create assessment run record
  const { data: run, error } = await sb
    .from("assessment_runs")
    .insert({
      parcel_ids: parcelIds,
      intention,
      rule_version: RULE_VERSION,
      dataset_version_ids: datasetVersionIds,
    })
    .select("id")
    .single();
  if (error || !run) {
    return NextResponse.json({ error: error?.message ?? "run failed" }, { status: 500 });
  }

  // Run every live check for each confirmed parcel.
  const findings = [];
  for (const parcelId of parcelIds) {
    const checks = await runChecksForParcel(sb, parcelId, intention);
    for (const finding of checks) {
      const { data: inserted, error: insertErr } = await sb
        .from("findings")
        .insert({
          run_id: run.id,
          check_id: finding.checkId,
          rule_version: finding.ruleVersion,
          status: finding.status,
          title: finding.title,
          explanation: finding.explanation,
          limitations: finding.limitations,
          follow_up_questions: finding.followUpQuestions,
          source_url: finding.sourceUrl,
          dataset_version_id: finding.datasetVersionId,
          feature_ids: finding.featureIds,
          evidence_geom: finding.evidenceGeometry,
          retrieval_date: finding.retrievalDate,
          intentions: finding.intentions,
        })
        .select("id")
        .single();
      if (insertErr || !inserted) {
        // Persistence failure: fail the run rather than report a finding with no id.
        await sb.from("assessment_runs").delete().eq("id", run.id);
        return NextResponse.json(
          { error: insertErr?.message ?? "failed to persist finding" },
          { status: 500 },
        );
      }
      findings.push({ ...finding, id: inserted.id });
    }
  }

  const { error: completeErr } = await sb
    .from("assessment_runs")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", run.id);
  if (completeErr) {
    await sb.from("assessment_runs").delete().eq("id", run.id);
    return NextResponse.json({ error: completeErr.message }, { status: 500 });
  }

  return NextResponse.json(
    AssessmentRunResponse.parse({
      runId: run.id,
      intention,
      ruleVersion: RULE_VERSION,
      datasetVersionIds,
      findings,
      isDemo: false,
    }),
  );
}
