import { NextResponse } from "next/server";
import {
  AssessmentRunRequest,
  AssessmentRunResponse,
} from "@/lib/schemas";
import { supabaseServer } from "@/lib/supabase/server";
import { runChecksForParcel, runRatingValuationCheck, RULE_VERSION } from "@/lib/assessment";

export async function POST(request: Request) {
  const body = AssessmentRunRequest.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const { parcelIds, intention, addressLabel } = body.data;
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
  const runId = run.id;

  async function persistFinding(finding: any) {
    const { data: inserted, error: insertErr } = await sb
      .from("findings")
      .insert({
        run_id: runId,
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
      throw new Error(insertErr?.message ?? "failed to persist finding");
    }
    return { ...finding, id: inserted.id };
  }

  // Run every live check for each confirmed parcel.
  const findings = [];
  try {
    for (const parcelId of parcelIds) {
      const checks = await runChecksForParcel(sb, parcelId, intention);
      for (const finding of checks) {
        findings.push(await persistFinding(finding));
      }
    }

    // Rating valuation + council rates (per-property API, not a PostGIS layer).
    // Runs once per run (not per parcel) — the address identifies the property.
    if (addressLabel) {
      const rv = await runRatingValuationCheck(sb, addressLabel);
      findings.push(await persistFinding(rv));
    }
  } catch (err: any) {
    // Persistence failure: fail the run rather than report a finding with no id.
    await sb.from("assessment_runs").delete().eq("id", runId);
    return NextResponse.json(
      { error: err?.message ?? "failed to persist finding" },
      { status: 500 },
    );
  }

  const { error: completeErr } = await sb
    .from("assessment_runs")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", runId);
  if (completeErr) {
    await sb.from("assessment_runs").delete().eq("id", runId);
    return NextResponse.json({ error: completeErr.message }, { status: 500 });
  }

  return NextResponse.json(
    AssessmentRunResponse.parse({
      runId: runId,
      intention,
      ruleVersion: RULE_VERSION,
      datasetVersionIds,
      findings,
      isDemo: false,
    }),
  );
}
