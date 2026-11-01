#!/usr/bin/env node
// Import LINZ NZ Primary Parcels (Auckland clip) into public.parcels.
// Usage:
//   node --env-file=.env.local scripts/import/linz-parcels.mjs --dry-run   # count only
//   node --env-file=.env.local scripts/import/linz-parcels.mjs            # insert
//
// Requires: LINZ_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in env.
import "dotenv/config";

const LINZ_KEY = process.env.LINZ_API_KEY;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes("--dry-run");

if (!LINZ_KEY) { console.error("LINZ_API_KEY missing"); process.exit(1); }
if (!DRY && (!SB_URL || !SB_KEY)) {
  console.error("Supabase URL/service role key missing — run with --dry-run or add keys");
  process.exit(1);
}

// Auckland urban clip (geographic, lat/lon y/x order per LINZ WFS).
// Wider than central; tighten to reduce count.
const BBOX = "-37.00,174.40,-36.40,175.40";
const PAGE = 1000;

let sb;
if (!DRY) {
  const { createClient } = await import("@supabase/supabase-js");
  sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
}

async function fetchPage(startIndex) {
  const url =
    `https://data.linz.govt.nz/services;key=${LINZ_KEY}/wfs` +
    `?service=WFS&version=2.0.0&request=GetFeature` +
    `&typeNames=layer-50772` +
    `&cql_filter=bbox(shape,${BBOX})+and+parcel_intent<>'Road'+and+parcel_intent<>'Hydro'` +
    `&SRSName=EPSG:2193` +
    `&count=${PAGE}&startindex=${startIndex}` +
    `&outputformat=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WFS ${res.status} at startindex=${startIndex}`);
  return res.json();
}

// Ensure dataset + version exist (idempotent).
async function ensureDataset() {
  await sb.from("datasets").upsert({
    slug: "linz-nz-primary-parcels",
    source_org: "LINZ",
    name: "NZ Primary Parcels",
    licence_url: "https://www.linz.govt.nz/data/licensing-and-using-data",
    access_method: "WFS 2.0",
    attribution: "Contains data sourced from the LINZ Data Service and licensed for reuse under CC BY 4.0.",
    enabled: true,
  }).select("slug");
  const { data: v } = await sb.from("dataset_versions").insert({
    dataset_slug: "linz-nz-primary-parcels",
    version_label: new Date().toISOString().slice(0, 10),
    source_publication_date: new Date().toISOString().slice(0, 10),
    geom_validated: true,
    status: "active",
    notes: "Auckland clip import",
  }).select("id").single();
  return v.id;
}

function toWkt(geom) {
  // GeoJSON Polygon/MultiPolygon (NZTM 2193) -> WKT for ST_GeomFromText.
  // Supabase can accept GeoJSON via ST_SetSRID(ST_GeomFromGeoJSON(...), 2193) in a function.
  // We insert raw GeoJSON and let a PostGIS function convert.
  return JSON.stringify(geom);
}

let total = 0;
let startIndex = 0;
let versionId = null;
if (!DRY) versionId = await ensureDataset();

while (true) {
  const data = await fetchPage(startIndex);
  const features = data.features ?? [];
  if (features.length === 0) break;
  if (DRY) {
    total += features.length;
    if (total <= 5 && features[0]) {
      const p = features[0].properties || {};
      console.log(`sample: id=${p.id} appellation=${p.appellation} area=${p.calc_area}`);
    }
  } else {
    // Insert via a PostGIS function that converts GeoJSON (2193) to geometry.
    const rows = features.map((f) => ({
      source_parcel_id: String(f.properties?.id ?? ""),
      intent: f.properties?.parcel_intent ?? null,
      area_m2: f.properties?.calc_area ?? null,
      geom_geojson: toWkt(f.geometry),
      source_dataset_version_id: versionId,
    }));
    const { error } = await sb.rpc("insert_parcel_geojson", {
      p_rows: rows,
    });
    if (error) { console.error("insert error:", error.message); process.exit(2); }
    total += rows.length;
  }
  console.log(`Imported/seen ${total} parcels...`);
  if (features.length < PAGE) break;
  startIndex += PAGE;
}

console.log(`Done. Total parcels: ${total}${DRY ? " (dry-run, not inserted)" : ""}`);
