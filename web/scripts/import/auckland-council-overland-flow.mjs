#!/usr/bin/env node
// Import Auckland Council Overland Flow Paths (ArcGIS REST FeatureServer) into public.hazard_features.
// Usage:
//   node --env-file=.env.local scripts/import/auckland-council-overland-flow.mjs --dry-run
//   node --env-file=.env.local scripts/import/auckland-council-overland-flow.mjs
//
// Licence: Auckland Council Open Data (CC BY 4.0).
import "dotenv/config";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes("--dry-run");

if (!DRY && (!SB_URL || !SB_KEY)) {
  console.error("Supabase URL/service role key missing — run with --dry-run or add keys");
  process.exit(1);
}

const FS_URL =
  "https://services1.arcgis.com/n4yPwebTjJCmXB6W/ArcGIS/rest/services/Overland_Flow_Paths/FeatureServer/0";
const PAGE = 1000; // max 2000 per request; use 1000 to be safe

let sb;
if (!DRY) {
  const { createClient } = await import("@supabase/supabase-js");
  sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
}

async function ensureDataset() {
  await sb.from("datasets").upsert({
    slug: "ac-overland-flow-paths",
    source_org: "Auckland Council",
    name: "Overland Flow Paths",
    licence_url: "https://www.aucklandcouncil.govt.nz/en/geospatial/council-open-data/user-licence-auckland-council-open-data.html",
    access_method: "ArcGIS REST FeatureServer",
    attribution: "Auckland Council Open Data — Overland Flow Paths (CC BY 4.0)",
    enabled: true,
  }).select("slug");
  const { data: v } = await sb.from("dataset_versions").insert({
    dataset_slug: "ac-overland-flow-paths",
    version_label: new Date().toISOString().slice(0, 10),
    source_publication_date: "2026-03-24",
    geom_validated: true,
    status: "active",
    notes: "Auckland Council Overland Flow Paths import",
  }).select("id").single();
  return v.id;
}

async function fetchPage(resultOffset) {
  const url =
    `${FS_URL}/query?where=1%3D1&outFields=*&outSR=2193&returnGeometry=true&f=geojson` +
    `&resultOffset=${resultOffset}&resultRecordCount=${PAGE}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ArcGIS ${res.status} at offset=${resultOffset}`);
  return res.json();
}

let total = 0;
let offset = 0;
let versionId = null;
if (!DRY) versionId = await ensureDataset();

while (true) {
  const data = await fetchPage(offset);
  const features = data.features ?? [];
  if (features.length === 0) break;
  if (DRY) {
    total += features.length;
    if (total <= 3 && features[0]) {
      const a = features[0].attributes || {};
      console.log(`sample: OBJECTID=${a.OBJECTID} attributes=${JSON.stringify(a).slice(0, 120)}`);
    }
  } else {
    const rows = features.map((f) => ({
      dataset_slug: "ac-overland-flow-paths",
      source_feature_id: String(f.attributes?.OBJECTID ?? ""),
      scenario: "Overland flow path",
      attributes: f.attributes ?? {},
      geom_geojson: JSON.stringify(f.geometry),
      dataset_version_id: versionId,
    }));
    const { error } = await sb.rpc("insert_hazard_geojson", { p_rows: rows });
    if (error) { console.error("insert error:", error.message); process.exit(2); }
    total += rows.length;
  }
  console.log(`Imported/seen ${total} flow path features...`);
  if (features.length < PAGE) break;
  offset += PAGE;
}

console.log(`Done. Total flow path features: ${total}${DRY ? " (dry-run, not inserted)" : ""}`);
