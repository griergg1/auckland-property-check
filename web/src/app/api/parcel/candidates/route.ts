import { NextResponse } from "next/server";
import { ParcelCandidatesRequest, ParcelCandidatesResponse } from "@/lib/schemas";
import { supabaseServer } from "@/lib/supabase/server";
import { decodeAddressId } from "@/lib/linz";

export async function POST(request: Request) {
  const body = ParcelCandidatesRequest.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const point = decodeAddressId(body.data.addressId);
  if (!point) {
    return NextResponse.json({ error: "invalid addressId" }, { status: 400 });
  }
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("parcels_containing_point", {
    p_lat: point.lat,
    p_lon: point.lon,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const candidates = (data ?? []).map((p: any) => ({
    id: p.id,
    sourceParcelId: p.source_parcel_id,
    intent: p.intent,
    areaM2: p.area_m2 ? Number(p.area_m2) : null,
    geometry: p.geom_geojson ?? null,
    isDemo: false,
  }));
  return NextResponse.json(
    ParcelCandidatesResponse.parse({ candidates, isDemo: false }),
  );
}
