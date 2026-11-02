import type { SupabaseClient } from "@supabase/supabase-js";
import type { Finding, BuyerIntention } from "./schemas";
import { getRatingValuation, propertyPageUrl, type RatingValuation } from "./council-rates";

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
    | "assess_coastal_inundation"
    | "assess_school_zones",
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
  const schools = await runCheck(
    sb,
    "assess_school_zones",
    parcelId,
    intention,
    unavailableFinding("neighbourhood.school_zones", "School enrolment zones check", intention, "No data returned."),
  );
  return [overland, flood, coastal, zone, schools];
}

function fmtMoney(n: number | null): string {
  if (n == null) return "—";
  return "$" + n.toLocaleString("en-NZ");
}

// Rating valuation + council rates. This is the one check that is NOT a PostGIS
// intersection — it is a per-property fetch from Auckland Council's public
// rate-assessment API. Same four-state shape as the other findings; `unavailable`
// if the council API can't return a value for this address.
export async function runRatingValuationCheck(
  sb: SupabaseClient,
  addressLabel: string,
): Promise<Finding> {
  const retrievalDate = new Date().toISOString();
  const base: Finding = {
    id: "",
    checkId: "value.rating_valuation",
    ruleVersion: RULE_VERSION,
    status: "unavailable",
    title: "Rating valuation & council rates",
    explanation: "The council's rating valuation for this property could not be retrieved.",
    limitations:
      "This is the council's rating valuation, not a market valuation or a registered valuation.",
    followUpQuestions: [],
    sourceUrl: undefined,
    datasetVersionId: null,
    featureIds: [],
    evidenceGeometry: null,
    retrievalDate,
    intentions: ["live", "renovate", "extend", "add_dwelling", "vacant_build"],
  };

  let rv: RatingValuation | null = null;
  try {
    rv = await getRatingValuation(sb, addressLabel);
  } catch (err) {
    // Log the raw error server-side; surface only a fixed user-safe message in the finding
    // (never the raw exception text, which can leak upstream details).
    console.warn("rating valuation fetch failed:", (err as Error).message);
    return base;
  }
  if (!rv || (rv.capitalValue == null && rv.annualRates == null)) {
    return base;
  }

  const lines: string[] = [];
  if (rv.capitalValue != null) lines.push(`Capital value (CV): ${fmtMoney(rv.capitalValue)}`);
  if (rv.landValue != null) lines.push(`Land value: ${fmtMoney(rv.landValue)}`);
  if (rv.improvementValue != null) lines.push(`Improvement value: ${fmtMoney(rv.improvementValue)}`);
  if (rv.annualRates != null) lines.push(`Annual council rates: ${fmtMoney(rv.annualRates)}`);
  if (rv.landAreaM2 != null) lines.push(`Land area: ${rv.landAreaM2.toLocaleString()} m²`);
  if (rv.totalFloorAreaM2 != null) lines.push(`Floor area: ${rv.totalFloorAreaM2.toLocaleString()} m²`);
  if (rv.localBoard) lines.push(`Local board: ${rv.localBoard}`);
  const explanation =
    `The council's rating valuation for this property, as held by Auckland Council` +
    ` (rating valuation #${rv.valuationNumber ?? "—"}): ` +
    lines.join(" · ") +
    `. Auckland Council revalues every three years (most recent 2024); annual rates are set each July for the rating year.`;

  return {
    ...base,
    status: "detected",
    title: "Rating valuation & council rates",
    explanation,
    limitations:
      "This is the council's rating valuation, not a market valuation or a registered valuation. The CV reflects the likely selling price at the last revaluation date, not today. Annual rates are the total assessment for the rating year, not what's currently paid (rebates, targeted rates, and arrears can change the actual amount).",
    sourceUrl: propertyPageUrl(rv.acRateAccountKey),
    featureIds: [rv.acRateAccountKey],
    retrievalDate: rv.fetchedAt ?? retrievalDate,
  };
}
