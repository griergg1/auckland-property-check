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

function unavailableFinding(
  checkId: string,
  title: string,
  intention: BuyerIntention,
  limitations: string,
): Finding {
  return {
    id: "",
    checkId,
    ruleVersion: RULE_VERSION,
    status: "unavailable",
    title,
    explanation: "The check could not be completed.",
    limitations,
    followUpQuestions: [],
    sourceUrl: undefined,
    datasetVersionId: null,
    featureIds: [],
    evidenceGeometry: null,
    retrievalDate: new Date().toISOString(),
    intentions: [intention],
  };
}

function findingFromRow(row: RawFindingRow, intention: BuyerIntention): Finding {
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

async function runCheck(
  sb: SupabaseClient,
  fn:
    | "assess_overland_flow"
    | "assess_flood_prone"
    | "assess_unitary_plan_zone"
    | "assess_coastal_inundation",
  parcelId: string,
  intention: BuyerIntention,
  fallback: Finding,
): Promise<Finding> {
  const { data, error } = await sb.rpc(fn, {
    p_parcel_id: parcelId,
    p_intention: intention,
  });
  if (error || !data || data.length === 0) {
    return { ...fallback, limitations: error?.message ?? fallback.limitations };
  }
  return findingFromRow(data[0] as RawFindingRow, intention);
}

export async function runChecksForParcel(
  sb: SupabaseClient,
  parcelId: string,
  intention: BuyerIntention,
): Promise<Finding[]> {
  const overland = await runCheck(
    sb,
    "assess_overland_flow",
    parcelId,
    intention,
    unavailableFinding("hazard.overland_flow", "Overland flow path check", intention, "No data returned."),
  );
  const flood = await runCheck(
    sb,
    "assess_flood_prone",
    parcelId,
    intention,
    unavailableFinding("hazard.flood_prone", "Flood prone area check", intention, "No data returned."),
  );
  const coastal = await runCheck(
    sb,
    "assess_coastal_inundation",
    parcelId,
    intention,
    unavailableFinding("hazard.coastal_inundation", "Coastal inundation check", intention, "No data returned."),
  );
  const zone = await runCheck(
    sb,
    "assess_unitary_plan_zone",
    parcelId,
    intention,
    unavailableFinding("planning.zone", "Unitary Plan zone check", intention, "No data returned."),
  );
  return [overland, flood, coastal, zone];
}
