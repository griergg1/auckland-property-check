#!/usr/bin/env node
// Import Auckland Council Flood Prone Areas into public.hazard_features.
// The dataset version stays draft until the last page succeeds, then is promoted.
// Usage:
//   node --env-file=.env.local scripts/import/auckland-council-flood-prone.mjs --dry-run
//   node --env-file=.env.local scripts/import/auckland-council-flood-prone.mjs
//
// Source: Auckland Council Healthy Waters, public ArcGIS item 0be75c47bc1a4f28b9a7745a3eba5cbf.
// Licence: Creative Commons (Auckland Council open data, CC BY 4.0).
import "dotenv/config";
import ws from "ws";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes("--dry-run");
const SLUG = "ac-flood-prone-areas";

if (!DRY && (!SB_URL || !SB_KEY)) {
  console.error("Supabase URL/service role key missing — run with --dry-run or add keys");
  process.exit(1);
}

const FS_URL =
  "https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Flood_Prone_Areas/FeatureServer/0";
const PAGE = 500;

let sb;
if (!DRY) {
  const { createClient } = await import("@supabase/supabase-js");
  sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false }, realtime: { transport: ws } });
}

async function ensureDraftVersion() {
  await sb.from("datasets").upsert({
    slug: SLUG,
    source_org: "Auckland Council",
    name: "Flood Prone Areas",
    licence_url: "https://www.aucklandcouncil.govt.nz/en/geospatial/council-open-data/user-licence-auckland-council-open-data.html",
    access_method: "ArcGIS REST FeatureServer",
    attribution: "Auckland Council Healthy Waters — Flood Prone Areas (CC BY 4.0)",
    enabled: true,
  }).select("slug");
  const { data: v, error } = await sb.from("dataset_versions").insert({
    dataset_slug: SLUG,
    version_label: new Date().toISOString().slice(0, 10),
    geom_validated: false,
    status: "draft",
    notes: "Auckland Council Flood Prone Areas import",
  }).select("id").single();
  if (error || !v) throw new Error(error?.message ?? "could not create dataset version");
  return v.id;
}

async function fetchPage(resultOffset) {
  const url =
    `${FS_URL}/query?where=1%3D1&outFields=OBJECTID,FPA_ID,CanFill,Depth100y,RecordStatus&outSR=2193&returnGeometry=true&f=geojson` +
    `&resultOffset=${resultOffset}&resultRecordCount=${PAGE}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ArcGIS ${res.status} at offset=${resultOffset}`);
  return res.json();
}

let total = 0;
let offset = 0;
let versionId = null;
if (!DRY) versionId = await ensureDraftVersion();

while (true) {
  const data = await fetchPage(offset);
  const features = data.features ?? [];
  if (features.length === 0) break;
  if (DRY) {
    total += features.length;
    if (total <= PAGE && features[0]) {
      const a = features[0].properties || features[0].attributes || {};
      console.log(`sample: OBJECTID=${a.OBJECTID} FPA_ID=${a.FPA_ID} geom=${features[0].geometry?.type}`);
    }
  } else {
    const rows = features.map((f) => {
      const props = f.properties ?? f.attributes ?? {};
      return {
        dataset_slug: SLUG,
        source_feature_id: String(props.FPA_ID ?? props.OBJECTID ?? ""),
        scenario: props.CanFill ? `Can fill in 1% AEP: ${props.CanFill}` : "Flood prone area",
        attributes: props,
        geom_geojson: JSON.stringify(f.geometry),
        dataset_version_id: versionId,
      };
    });
    const { error } = await sb.rpc("insert_hazard_geojson", { p_rows: rows });
    if (error) {
      await sb.from("dataset_versions").update({ status: "failed", notes: error.message }).eq("id", versionId);
      console.error("insert error:", error.message);
      process.exit(2);
    }
    total += rows.length;
  }
  console.log(`Imported/seen ${total} flood prone areas...`);
  if (features.length < PAGE) break;
  offset += PAGE;
}

if (!DRY) {
  const { error: activateErr } = await sb.from("dataset_versions").update({
    status: "active",
    row_count: total,
    geom_validated: true,
  }).eq("id", versionId);
  if (activateErr) {
    console.error("promote error:", activateErr.message);
    process.exit(3);
  }
  await sb.from("dataset_versions")
    .update({ status: "retired" })
    .eq("dataset_slug", SLUG)
    .eq("status", "active")
    .neq("id", versionId);
}

console.log(`Done. Total flood prone areas: ${total}${DRY ? " (dry-run, not inserted)" : ""}`);
