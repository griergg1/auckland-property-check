import "server-only";

const LAYER = "layer-123113"; // NZ Addresses (new schema, published July 2026)
const AUCKLAND_BBOX = "-37.20,174.20,-36.20,175.60"; // lat/lon y/x order

export type LinzAddress = {
  id: string; // encoded lat,lon
  label: string;
  point: { lat: number; lon: number };
};

function wfsUrl(cql: string, count = 20) {
  const key = process.env.LINZ_API_KEY;
  return (
    `https://data.linz.govt.nz/services;key=${key}/wfs` +
    `?service=WFS&version=2.0.0&request=GetFeature` +
    `&typeNames=${LAYER}` +
    `&cql_filter=${encodeURIComponent(cql)}` +
    `&count=${count}&outputformat=json&SRSName=EPSG:4326`
  );
}

export async function searchAddresses(query: string): Promise<LinzAddress[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  // Build a CQL filter: bbox(Auckland) AND (road or suburb ILIKE query)
  const like = q.toUpperCase().replace(/'/g, "''");
  const cql = `bbox(shape,${AUCKLAND_BBOX}) AND (full_address ILIKE '%${like}%' OR full_road_name ILIKE '%${like}%')`;
  const res = await fetch(wfsUrl(cql, 20));
  if (!res.ok) {
    throw new Error(`LINZ address search failed (${res.status})`);
  }
  const data = await res.json() as any;
  const features = data.features ?? [];
  return features.map((f: any) => {
    const p = f.properties || {};
    const [lon, lat] = f.geometry?.coordinates ?? [0, 0];
    const label = (p.full_address || [p.address_number ?? "", p.full_road_name ?? "", p.suburb_locality ?? ""].filter(Boolean).join(" ")) + ", Auckland";
    return {
      id: `addr:${lat.toFixed(6)}:${lon.toFixed(6)}`,
      label,
      point: { lat, lon },
    };
  });
}

export function decodeAddressId(id: string): { lat: number; lon: number } | null {
  const m = id.match(/^addr:(-?\d+\.\d+):(-?\d+\.\d+)$/);
  if (!m) return null;
  return { lat: parseFloat(m[1]), lon: parseFloat(m[2]) };
}
