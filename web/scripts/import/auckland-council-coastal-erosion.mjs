#!/usr/bin/env node
// Import Auckland Council Areas Susceptible to Coastal Instability and Erosion
// (ASCIE), Level A regional forecast lines. Four timeframes: 2050, 2080, 2130,
// and 2130 under the higher sea-level-rise case (RCP8.5+).
//
// These are lines, the inland edge of the forecast area, not a filled polygon.
// The check reports the soonest line that crosses the parcel and says so.
//
// Usage:
//   node --env-file=.env.local scripts/import/auckland-council-coastal-erosion.mjs --dry-run
//   node --env-file=.env.local scripts/import/auckland-council-coastal-erosion.mjs
//
// Source: Auckland Council, item 5eaa62e1c2d44409b7ec86d0b2ee572f. CC BY 4.0.
import "dotenv/config";
import ws from "ws";
import { assertCount, assertNotShortPage, pageContinues, promoteVersion, sourceCount } from "./lib/finish-import.mjs";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes("--dry-run");
const SLUG = "ac-coastal-erosion";
const SERVICE =
  "https://services1.arcgis.com/n4yPwebTjJCmXB6W/ArcGIS/rest/services/CoastalInstabilityAndErosion/FeatureServer";
const PAGE = 500;
const OUT_FIELDS = "OBJECTID,CoastType,Timeframe,Scenario,Geology,SeaLevelRise,AssessmentLevel,URLLink,GlobalID";

// scenario_rank breaks the tie between the two 2130 layers.
const LAYERS = [
  { id: 0, rank: 1 },
  { id: 1, rank: 2 },
  { id: 2, rank: 3 },
  { id: 3, rank: 4 },
];

if (!DRY && (!SB_URL || !SB_KEY)) {
  console.error("Supabase URL/service role key missing — run with --dry-run or add keys");
  process.exit(1);
}

let sb;
if (!DRY) {
  const { createClient } = await import("@supabase/supabase-js");
  sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false }, realtime: { transport: ws } });
}

async function ensureDraftVersion() {
  await sb.from("datasets").upsert({
    slug: SLUG,
    source_org: "Auckland Council",
    name: "Areas Susceptible to Coastal Instability and Erosion",
    licence_url: "https://www.aucklandcouncil.govt.nz/en/geospatial/council-open-data/user-licence-auckland-council-open-data.html",
    access_method: "ArcGIS REST FeatureServer",
    attribution: "Auckland Council — Areas Susceptible to Coastal Instability and Erosion (CC BY 4.0)",
    enabled: true,
  }).select("slug");
  const { data: v, error } = await sb.from("dataset_versions").insert({
    dataset_slug: SLUG,
    version_label: new Date().toISOString().slice(0, 10),
    geom_validated: false,
    status: "draft",
    notes: "Auckland Council ASCIE Level A forecast lines (2050, 2080, 2130, 2130+)",
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

async function fetchPage(layerId, resultOffset) {
  // Features with a null shape have no geometry. Skip them or the insert rejects the page.
  const url =
    `${SERVICE}/${layerId}/query?where=Shape__Length%3E0&outFields=${OUT_FIELDS}&outSR=2193&returnGeometry=true&orderByFields=OBJECTID&f=geojson` +
    `&resultOffset=${resultOffset}&resultRecordCount=${PAGE}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ArcGIS ${res.status} layer ${layerId} offset=${resultOffset}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || `ArcGIS error layer ${layerId} offset=${resultOffset}`);
  return data;
}

let total = 0;
let versionId = null;
let expected = 0;
if (!DRY) versionId = await ensureDraftVersion();

try {
  for (const layer of LAYERS) {
    const layerExpected = await sourceCount(`${SERVICE}/${layer.id}/query?where=Shape__Length%3E0&returnCountOnly=true&f=json`);
    expected += layerExpected;
    let offset = 0;
    let layerTotal = 0;
    let expectingMore = false;
    while (true) {
      const data = await fetchPage(layer.id, offset);
      const features = data.features ?? [];
      assertNotShortPage(features, expectingMore, offset);
      if (features.length === 0) break;
      if (DRY) {
        total += features.length;
        layerTotal += features.length;
        if (layerTotal <= PAGE && features[0]) {
          const a = features[0].properties || features[0].attributes || {};
          console.log(`sample layer ${layer.id}: OBJECTID=${a.OBJECTID} scenario=${a.Scenario} geom=${features[0].geometry?.type}`);
        }
      } else {
        const rows = features.map((f) => {
          const props = f.properties ?? f.attributes ?? {};
          return {
            dataset_slug: SLUG,
            source_feature_id: String(props.OBJECTID ?? ""),
            scenario: props.Scenario ?? `ASCIE ${props.Timeframe ?? ""}`,
            attributes: { ...props, scenario_rank: layer.rank },
            geom_geojson: JSON.stringify(f.geometry),
            dataset_version_id: versionId,
          };
        });
        const { error } = await sb.rpc("insert_hazard_geojson", { p_rows: rows });
        if (error) throw new Error(error.message);
        total += rows.length;
        layerTotal += rows.length;
      }
      console.log(`Imported/seen ${layerTotal} on layer ${layer.id} (running total ${total})`);
      offset += features.length;
      expectingMore = pageContinues(data, features.length, PAGE);
      if (!expectingMore) break;
    }
    assertCount(layerTotal, layerExpected, `layer ${layer.id}`);
  }
} catch (err) {
  await markFailed(err.message);
  console.error(err.message);
  process.exit(2);
}

if (!DRY) {
  try {
    await promoteVersion(sb, { versionId, total, expected, label: SLUG });
  } catch (err) {
    await markFailed(err.message);
    console.error(err.message);
    process.exit(3);
  }
}

console.log(`Done. Total coastal erosion lines: ${total}${DRY ? " (dry-run, not inserted)" : ""}`);
