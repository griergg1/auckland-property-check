#!/usr/bin/env node
// Import Auckland Council Coastal Inundation 1% AEP (storm-tide, present-day) into public.hazard_features.
// The dataset version stays draft until the last page succeeds, then is promoted.
// Usage:
//   node --env-file=.env.local scripts/import/auckland-council-coastal-inundation.mjs --dry-run
//   node --env-file=.env.local scripts/import/auckland-council-coastal-inundation.mjs
//
// Source: Auckland Council, Coastal Inundation 1% AEP, ArcGIS item e1b4f3e57dc64b6395098a17ac979eeb.
// Licence: Auckland Council Open Data (CC BY 4.0). Item licenseInfo: "available to the public Under Creative Commons license."
// The 1% AEP (100-year return period, present-day sea level) is the standard planning scenario shown on the Flood Viewer.
import "dotenv/config";
import ws from "ws";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes("--dry-run");
const SLUG = "ac-coastal-inundation";

if (!DRY && (!SB_URL || !SB_KEY)) {
  console.error("Supabase URL/service role key missing — run with --dry-run or add keys");
  process.exit(1);
}

const FS_URL =
  "https://services1.arcgis.com/n4yPwebTjJCmXB6W/ArcGIS/rest/services/Coastal_Inundation_1_AEP/FeatureServer/0";
// Coastal inundation polygons are large; keep batches small so each insert RPC
// finishes well within the Postgres statement timeout.
const PAGE = 50;

let sb;
if (!DRY) {
  const { createClient } = await import("@supabase/supabase-js");
  sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false }, realtime: { transport: ws } });
}

async function ensureDraftVersion() {
  await sb.from("datasets").upsert({
    slug: SLUG,
    source_org: "Auckland Council",
    name: "Coastal Inundation 1% AEP",
    licence_url: "https://www.aucklandcouncil.govt.nz/en/geospatial/council-open-data/user-licence-auckland-council-open-data.html",
    access_method: "ArcGIS REST FeatureServer",
    attribution: "Auckland Council — Coastal Inundation 1% AEP (CC BY 4.0)",
    enabled: true,
  }).select("slug");
  const { data: v, error } = await sb.from("dataset_versions").insert({
    dataset_slug: SLUG,
    version_label: new Date().toISOString().slice(0, 10),
    geom_validated: false,
    status: "draft",
    notes: "Auckland Council Coastal Inundation 1% AEP import",
  }).select("id").single();
  if (error || !v) throw new Error(error?.message ?? "could not create dataset version");
  return v.id;
}

async function markFailed(message) {
  if (DRY || !versionId) return;
  await sb.from("dataset_versions").update({
    status: "failed",
    notes: String(message).slice(0, 500),
  }).eq("id", versionId);
}

async function fetchPage(resultOffset) {
  const url =
    `${FS_URL}/query?where=1%3D1&outFields=OBJECTID,Hazard,ARI_years,AEP_percent,WaveSetUp,WaveRunUp,SeaLevelRiseScenario,ModelType,Status,DocLink,GlobalID&outSR=2193&returnGeometry=true&f=geojson` +
    `&resultOffset=${resultOffset}&resultRecordCount=${PAGE}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ArcGIS ${res.status} at offset=${resultOffset}`);
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || `ArcGIS error at offset=${resultOffset}`);
  }
  return data;
}

// Build a human-readable scenario label from the source attributes.
function scenarioLabel(props) {
  const aep = props.AEP_percent ?? "1.0 %";
  const ari = props.ARI_years ?? 100;
  const slr = props.SeaLevelRiseScenario ?? "N/A";
  const slrPart = slr && slr !== "N/A" ? ` with ${slr} sea-level rise` : " (present-day sea level)";
  return `Coastal storm-tide ${aep} AEP (${ari}-year return period)${slrPart}`;
}

let total = 0;
let offset = 0;
let versionId = null;
if (!DRY) versionId = await ensureDraftVersion();

try {
  while (true) {
    const data = await fetchPage(offset);
    const features = data.features ?? [];
    if (features.length === 0) break;
    if (DRY) {
      total += features.length;
      if (total <= PAGE && features[0]) {
        const a = features[0].properties || features[0].attributes || {};
        console.log(`sample: OBJECTID=${a.OBJECTID} AEP=${a.AEP_percent} ARI=${a.ARI_years} SLR=${a.SeaLevelRiseScenario} geom=${features[0].geometry?.type}`);
      }
    } else {
      const rows = features.map((f) => {
        const props = f.properties ?? f.attributes ?? {};
        return {
          dataset_slug: SLUG,
          source_feature_id: String(props.OBJECTID ?? props.GlobalID ?? ""),
          scenario: scenarioLabel(props),
          attributes: props,
          geom_geojson: JSON.stringify(f.geometry),
          dataset_version_id: versionId,
        };
      });
      const { error } = await sb.rpc("insert_hazard_geojson", { p_rows: rows });
      if (error) throw new Error(error.message);
      total += rows.length;
    }
    console.log(`Imported/seen ${total} coastal inundation polygons...`);
    offset += features.length;
    const more = data.exceededTransferLimit === true || features.length === PAGE;
    if (!more) break;
  }
} catch (err) {
  await markFailed(err.message);
  console.error(err.message);
  process.exit(2);
}

if (!DRY) {
  if (total === 0) {
    await markFailed("import returned no features");
    console.error("refusing to activate an empty import");
    process.exit(3);
  }
  const { error: activateErr } = await sb.from("dataset_versions").update({
    status: "active",
    row_count: total,
    geom_validated: true,
  }).eq("id", versionId);
  if (activateErr) {
    await markFailed(activateErr.message);
    console.error("promote error:", activateErr.message);
    process.exit(3);
  }
  const { error: retireErr } = await sb.from("dataset_versions")
    .update({ status: "retired" })
    .eq("dataset_slug", SLUG)
    .eq("status", "active")
    .neq("id", versionId);
  if (retireErr) {
    console.error("retire error:", retireErr.message);
    process.exit(4);
  }
}

console.log(`Done. Total coastal inundation polygons: ${total}${DRY ? " (dry-run, not inserted)" : ""}`);
