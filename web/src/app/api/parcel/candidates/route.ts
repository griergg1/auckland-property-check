import { NextResponse } from "next/server";
import {
  ParcelCandidatesRequest,
  ParcelCandidatesResponse,
} from "@/lib/schemas";
import { supabaseServer } from "@/lib/supabase/server";

// PoC: map demo address ids to the demo parcel. Real implementation will
// resolve address -> candidate parcels via LINZ address-parcel links.
const DEMO_ADDRESS_TO_PARCEL: Record<string, string> = {
  "00000000-0000-0000-0000-000000000001": "demo-parcel-001",
  "00000000-0000-0000-0000-000000000002": "demo-parcel-001",
};

export async function POST(request: Request) {
  const body = ParcelCandidatesRequest.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const sb = await supabaseServer();
  const sourceParcelId = DEMO_ADDRESS_TO_PARCEL[body.data.addressId];
  if (!sourceParcelId) {
    return NextResponse.json(
      { error: "address not found (demo fixtures only)" },
      { status: 404 },
    );
  }
  const { data, error } = await sb
    .from("parcels")
    .select("id, source_parcel_id, intent, area_m2, geom")
    .eq("source_parcel_id", sourceParcelId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const candidates = (data ?? []).map((p: any) => ({
    id: p.id,
    sourceParcelId: p.source_parcel_id,
    intent: p.intent,
    areaM2: p.area_m2 ? Number(p.area_m2) : null,
    geometry: null, // filled below via a transform query
    isDemo: true,
  }));
  // Fetch geometry as GeoJSON 4326 for each candidate
  for (const c of candidates) {
    const { data: geo } = await sb.rpc("parcel_geojson_4326", {
      p_parcel_id: c.id,
    });
    c.geometry = geo ?? null;
  }
  return NextResponse.json(
    ParcelCandidatesResponse.parse({ candidates, isDemo: true }),
  );
}
