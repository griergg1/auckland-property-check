import { describe, it, expect, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { runChecksForParcel, CHECK_SPECS } from "../src/lib/assessment";

// Integration test against the live Supabase project. Skipped if env not set or placeholder.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasRealKey = key && !key.includes("replace-with");

describe.skipIf(!url || !hasRealKey)("assess_overland_flow (live)", () => {
  const makeClient = () =>
    createClient(url!, key!, {
      auth: { persistSession: false },
      realtime: { transport: ws as unknown as never },
    });

  it(
    "returns detected for the demo parcel",
    { timeout: 60000, retry: 2 },
    async () => {
      const sb = makeClient();
      // Retry the parcel lookup — the table is large and lookups can be slow on a cold connection.
      let parcel: { id: string } | null = null;
      for (let attempt = 0; attempt < 3 && !parcel; attempt++) {
        const { data, error } = await sb
          .from("parcels")
          .select("id")
          .eq("source_parcel_id", "demo-parcel-001")
          .maybeSingle();
        if (error) throw new Error(error.message);
        parcel = data;
      }
      expect(parcel).toBeTruthy();
      const { data: result, error } = await sb.rpc("assess_overland_flow", {
        p_parcel_id: parcel!.id,
        p_intention: "extend",
      });
      expect(error).toBeFalsy();
      expect(result).toBeTruthy();
      expect(result[0].status).toBe("detected");
      expect(result[0].check_id).toBe("hazard.overland_flow");
    },
  );
});

// Unit test: runChecksForParcel must return one finding per CHECK_SPECS entry,
// in the same order, with the expected check_id. If this test fails because
// someone reordered CHECK_SPECS, update the expected list too — the ordering is
// load-bearing for how findings appear on the report.
describe("runChecksForParcel (unit, mocked)", () => {
  const EXPECTED_CHECK_IDS = [
    "hazard.overland_flow",
    "hazard.flood_prone",
    "hazard.coastal_inundation",
    "hazard.landslide_susceptibility",
    "planning.zone",
    "planning.overlays",
    "neighbourhood.school_zones",
  ];

  it("CHECK_SPECS stays in the documented order", () => {
    expect(CHECK_SPECS.map((s) => s.checkId)).toEqual(EXPECTED_CHECK_IDS);
  });

  it("returns 7 findings in the expected order from the mocked RPCs", async () => {
    const rpc = vi.fn(async (fn: string) => {
      const spec = CHECK_SPECS.find((s) => s.fn === fn);
      return {
        data: [
          {
            check_id: spec?.checkId ?? "unknown",
            rule_version: "rules.v1",
            status: "not_detected",
            title: `stub for ${spec?.checkId ?? fn}`,
            explanation: null,
            limitations: null,
            follow_up_questions: [],
            source_url: null,
            dataset_version_id: null,
            feature_ids: [],
            evidence_geom: null,
            retrieval_date: new Date().toISOString(),
            intentions: ["live"],
          },
        ],
        error: null,
      };
    });
    const sb = { rpc } as unknown as Parameters<typeof runChecksForParcel>[0];
    const result = await runChecksForParcel(sb, "00000000-0000-0000-0000-000000000000", "live");
    expect(result).toHaveLength(EXPECTED_CHECK_IDS.length);
    expect(result.map((f) => f.checkId)).toEqual(EXPECTED_CHECK_IDS);
    expect(rpc).toHaveBeenCalledTimes(EXPECTED_CHECK_IDS.length);
  });

  it("returns a fixed user-safe limitation when an RPC errors (never the raw error.message)", async () => {
    const rpc = vi.fn(async () => ({
      data: null,
      error: { message: "internal: pg_cat 42P01: relation does not exist" },
    }));
    const sb = { rpc } as unknown as Parameters<typeof runChecksForParcel>[0];
    const result = await runChecksForParcel(sb, "00000000-0000-0000-0000-000000000000", "live");
    for (const finding of result) {
      expect(finding.status).toBe("unavailable");
      expect(finding.limitations).not.toContain("pg_cat");
      expect(finding.limitations).not.toContain("relation does not exist");
    }
  });
});
