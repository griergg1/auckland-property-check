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

// Hosts we trust to appear as a source link in a finding. A source_url that
// comes back from an RPC and isn't https or isn't on one of these hosts is
// dropped — never pass through `DocumentURL`-style fields straight into an href.
const ALLOWED_SOURCE_HOSTS = [
  "aucklandcouncil.govt.nz",
  "unitaryplan.aucklandcouncil.govt.nz",
  "experience.aucklandcouncil.govt.nz",
  "educationcounts.govt.nz",
  "arcgis.com",
  "linz.govt.nz",
  "knowledgeauckland.org.nz",
];

export function sanitizeSourceUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return undefined;
  }
  if (u.protocol !== "https:") return undefined;
  const host = u.hostname.toLowerCase();
  const ok = ALLOWED_SOURCE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  if (!ok) {
    console.warn("source_url rejected (host not on allowlist):", host);
    return undefined;
  }
  return u.toString();
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
    sourceUrl: sanitizeSourceUrl(row.source_url),
    datasetVersionId: row.dataset_version_id,
    featureIds: row.feature_ids ?? [],
    evidenceGeometry: row.evidence_geom ?? null,
    retrievalDate: row.retrieval_date,
    intentions: row.intentions ?? [intention],
  };
}

// Fixed user-facing message when an RPC call fails. The raw error.message is
// logged server-side only — never surfaced in the finding, since it can leak
// upstream details (table names, SQL fragments, auth hints).
const RPC_ERROR_LIMITATION =
  "The check could not be completed because the data service returned an error. This has been logged for review; try again later or verify via a LIM.";

type CheckSpec = {
  fn:
    | "assess_overland_flow"
    | "assess_flood_prone"
    | "assess_coastal_inundation"
    | "assess_coastal_erosion"
    | "assess_landslide_susceptibility"
    | "assess_unitary_plan_zone"
    | "assess_unitary_plan_overlays"
    | "assess_school_zones";
  checkId: string;
  title: string;
};

// Order here is the order findings appear on the report. The table pairs the
// RPC function name with its check_id + fallback title so the three can't drift
// apart (e.g. a renamed RPC without an updated check_id).
export const CHECK_SPECS: readonly CheckSpec[] = [
  { fn: "assess_overland_flow", checkId: "hazard.overland_flow", title: "Overland flow path check" },
  { fn: "assess_flood_prone", checkId: "hazard.flood_prone", title: "Flood prone area check" },
  { fn: "assess_coastal_inundation", checkId: "hazard.coastal_inundation", title: "Coastal inundation check" },
  { fn: "assess_coastal_erosion", checkId: "hazard.coastal_erosion", title: "Coastal erosion check" },
  { fn: "assess_landslide_susceptibility", checkId: "hazard.landslide_susceptibility", title: "Landslide susceptibility check" },
  { fn: "assess_unitary_plan_zone", checkId: "planning.zone", title: "Unitary Plan zone check" },
  { fn: "assess_unitary_plan_overlays", checkId: "planning.overlays", title: "Unitary Plan overlay check" },
  { fn: "assess_school_zones", checkId: "neighbourhood.school_zones", title: "School enrolment zones check" },
] as const;

async function runCheck(
  sb: SupabaseClient,
  spec: CheckSpec,
  parcelId: string,
  intention: BuyerIntention,
): Promise<Finding> {
  const fallback = unavailableFinding(spec.checkId, spec.title, intention, "No data returned.");
  const { data, error } = await sb.rpc(spec.fn, {
    p_parcel_id: parcelId,
    p_intention: intention,
  });
  if (error) {
    // Log the raw error server-side; show a fixed user-safe message in the finding.
    console.warn(`check ${spec.checkId} failed:`, error.message);
    return { ...fallback, limitations: RPC_ERROR_LIMITATION };
  }
  if (!data || data.length === 0) return fallback;
  return findingFromRow(data[0] as RawFindingRow, intention);
}

export async function runChecksForParcel(
  sb: SupabaseClient,
  parcelId: string,
  intention: BuyerIntention,
): Promise<Finding[]> {
  // Run every check in parallel. Promise.all preserves result order, which
  // matches CHECK_SPECS, which matches the order findings appear on the report.
  return Promise.all(CHECK_SPECS.map((spec) => runCheck(sb, spec, parcelId, intention)));
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
    intentions: ["live", "vacant_build"],
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
