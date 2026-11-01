import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

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
