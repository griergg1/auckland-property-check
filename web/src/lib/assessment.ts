import type { SupabaseClient } from "@supabase/supabase-js";
import type { Finding, BuyerIntention } from "./schemas";

export const RULE_VERSION = "rules.v1";

export type RawFindingRow = {
  check_id: string;
  rule_version: string;
  status: "detected" | "not_detected" | "unavailable" | "needs_review";
  title: string;
  explanation: string | null;
  limitations: string | null;
  follow_up_questions: { question: string; audience: string }[];
  source_url: string | null;
  dataset_version_id: string | null;
  feature_ids: string[];
  evidence_geom: object | null;
  retrieval_date: string;
  intentions: string[];
};

export async function runAssessmentForParcel(
  sb: SupabaseClient,
  parcelId: string,
  intention: BuyerIntention,
): Promise<Finding> {
  const { data, error } = await sb.rpc("assess_overland_flow", {
    p_parcel_id: parcelId,
    p_intention: intention,
  });
  if (error || !data || data.length === 0) {
    return {
      id: "",
      checkId: "hazard.overland_flow",
      ruleVersion: RULE_VERSION,
      status: "unavailable",
      title: "Overland flow path check",
      explanation: "The check could not be completed.",
      limitations: error?.message ?? "No data returned.",
      followUpQuestions: [],
      sourceUrl: undefined,
      datasetVersionId: null,
      featureIds: [],
      evidenceGeometry: null,
      retrievalDate: new Date().toISOString(),
      intentions: [intention],
    };
  }
  const row: RawFindingRow = data[0];
  return {
    id: "",
    checkId: row.check_id,
    ruleVersion: row.rule_version,
    status: row.status,
    title: row.title,
    explanation: row.explanation ?? undefined,
    limitations: row.limitations ?? undefined,
    followUpQuestions: row.follow_up_questions ?? [],
    sourceUrl: row.source_url ?? undefined,
    datasetVersionId: row.dataset_version_id,
    featureIds: row.feature_ids ?? [],
    evidenceGeometry: row.evidence_geom ?? null,
    retrievalDate: row.retrieval_date,
    intentions: row.intentions ?? [intention],
  };
}
