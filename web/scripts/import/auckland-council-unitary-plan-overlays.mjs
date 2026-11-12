#!/usr/bin/env node
// Import Auckland Council Unitary Plan overlays into public.hazard_features.
// Layers: Historic Heritage Extent of Place, Significant Ecological Areas,
//   Regionally Significant Volcanic Viewshafts and Height Sensitive Areas,
//   Special Character Areas (Residential and Business).
// The dataset version stays draft until every layer's last page succeeds, then is promoted.
//
// Usage:
//   node --env-file=.env.local scripts/import/auckland-council-unitary-plan-overlays.mjs --dry-run
//   node --env-file=.env.local scripts/import/auckland-council-unitary-plan-overlays.mjs
import "dotenv/config";
import ws from "ws";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes("--dry-run");
const SLUG = "ac-unitary-plan-overlays";

if (!DRY && (!SB_URL || !SB_KEY)) {
  console.error("Supabase URL/service role key missing — run with --dry-run or add keys");
  process.exit(1);
}

const LAYERS = [
  {
    name: "Historic Heritage Extent of Place",
    url: "https://services1.arcgis.com/n4yPwebTjJCmXB6W/ArcGIS/rest/services/Historic_Heritage_Overlay_Extent_of_Place/FeatureServer/0",
    outFields: "OBJECTID,TYPE,SUBTYPE,SCHEDULE,NAME,VALIDATIONSTATE,VERSIONSTATUS,DocumentURL,GlobalID,Shape__Area,Shape__Length",
    overlay: "historic_heritage",
  },
  {
    name: "Significant Ecological Areas",
    url: "https://services1.arcgis.com/n4yPwebTjJCmXB6W/ArcGIS/rest/services/Significant_Ecological_Areas_Overlay/FeatureServer/0",
    outFields: "OBJECTID,TYPE,SUBTYPE,SCHEDULE,NAME,VALIDATIONSTATE,VERSIONSTATUS,GlobalID,Shape__Area,Shape__Length",
    overlay: "significant_ecological_area",
  },
  {
    name: "Regionally Significant Volcanic Viewshafts",
    url: "https://services1.arcgis.com/n4yPwebTjJCmXB6W/ArcGIS/rest/services/Regionally_Significant_Volcanic_Viewshafts_And_Height_Sensitive_Areas_Overlay/FeatureServer/0",
    outFields: "OBJECTID,TYPE,SUBTYPE,SCHEDULE,NAME,VALIDATIONSTATE,VERSIONSTATUS,GlobalID,Shape__Area,Shape__Length",
    overlay: "volcanic_viewshaft",
  },
  {
    name: "Special Character Areas",
    url: "https://services1.arcgis.com/n4yPwebTjJCmXB6W/ArcGIS/rest/services/Special_Character_Areas_Overlay_Residential_and_Business/FeatureServer/0",
    outFields: "OBJECTID,TYPE,SUBTYPE,SCHEDULE,NAME,VALIDATIONSTATE,VERSIONSTATUS,DocumentURL,GlobalID,Shape__Area,Shape__Length",
    overlay: "special_character",
  },
];

// Overlay polygons are large (historic heritage + SEA include big multi-ring
// features); PAGE=2000 timed out on the first run of this import, PAGE=100 is
// what succeeded. Keep it small so each insert RPC finishes well within the
// Postgres statement timeout. (Matches auckland-council-coastal-inundation.mjs.)
const PAGE = 100;

let sb;
if (!DRY) {
  const { createClient } = await import("@supabase/supabase-js");
  sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false }, realtime: { transport: ws } });
}

async function ensureDraftVersion() {
  await sb.from("datasets").upsert({
    slug: SLUG,
    source_org: "Auckland Council",
    name: "Unitary Plan Overlays",
    licence_url: "https://www.aucklandcouncil.govt.nz/en/geospatial/council-open-data/user-licence-auckland-council-open-data.html",
    access_method: "ArcGIS REST FeatureServer",
    attribution: "Auckland Council — Unitary Plan Overlays (CC BY 4.0)",
    enabled: true,
  }).select("slug");
  const { data: v, error } = await sb.from("dataset_versions").insert({
    dataset_slug: SLUG,
    version_label: new Date().toISOString().slice(0, 10),
    geom_validated: false,
    status: "draft",
    notes: "Auckland Council Unitary Plan overlays import (Historic Heritage, SEA, Volcanic Viewshafts, Special Character)",
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

// Small wrapper around fetch() with a bounded retry + exponential backoff so a
// transient network glitch during a long paginated import does not kill the run.
// A hard timeout via AbortController guards against hung sockets — without it
// a stalled response would never trigger the retry.
async function fetchWithRetry(url, { attempts = 4, baseDelayMs = 1000, timeoutMs = 60000 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1) break;
      const delay = baseDelayMs * 2 ** i;
      console.warn(`fetch failed (${err.message ?? err}), retrying in ${delay}ms (attempt ${i + 2}/${attempts})`);
      await new Promise((r) => setTimeout(r, delay));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

async function fetchPage(layer, resultOffset) {
  // Only import Operative records, same as the base zone import. Order by OBJECTID
  // so paging with resultOffset is stable even across retries.
  const url =
    `${layer.url}/query?where=VERSIONSTATUS%3D4&outFields=${encodeURIComponent(layer.outFields)}&outSR=2193&returnGeometry=true&orderByFields=OBJECTID&f=geojson` +
    `&resultOffset=${resultOffset}&resultRecordCount=${PAGE}`;
  const data = await fetchWithRetry(url);
  if (data.error) {
    throw new Error(data.error.message || `ArcGIS error for ${layer.name} at offset=${resultOffset}`);
  }
  return data;
}

// Load the TYPE field's coded-value domain for a layer from its ?f=json metadata.
// Returns a Map<code, name>, or null if the layer has no TYPE domain (e.g. historic
// heritage, whose TYPE field is empty). Reading the domain at runtime avoids a
// hardcoded map going stale when Auckland Council updates the schema.
async function loadTypeDomain(layer) {
  const meta = await fetchWithRetry(`${layer.url}?f=json`);
  const typeField = (meta.fields ?? []).find((f) => f.name === "TYPE");
  const codedValues = typeField?.domain?.codedValues;
  if (!Array.isArray(codedValues) || codedValues.length === 0) return null;
  return new Map(codedValues.map((cv) => [String(cv.code), cv.name]));
}

function typeName(typeDomain, typeCode) {
  if (typeCode == null || typeCode === "") return "";
  if (!typeDomain) return "";
  const name = typeDomain.get(String(typeCode));
  // Never fall back to the raw code — a reader should not see "Special Character Areas · 7".
  // If an unknown code shows up, the import validation (validateTypeCoverage) will have warned.
  return name ?? "";
}

function scenarioFor(layer, typeDomain, props) {
  const typeNameVal = typeName(typeDomain, props.TYPE);
  const parts = [layer.name];
  if (typeNameVal) parts.push(typeNameVal);
  if (props.NAME) parts.push(props.NAME);
  if (props.SCHEDULE) parts.push(`Schedule ${props.SCHEDULE}`);
  return parts.join(" · ");
}

function rowFromFeature(f, layer, typeDomain) {
  const props = f.properties ?? f.attributes ?? {};
  return {
    dataset_slug: SLUG,
    source_feature_id: `${layer.overlay}:${props.OBJECTID ?? ""}`,
    scenario: scenarioFor(layer, typeDomain, props),
    attributes: {
      ...props,
      overlay: layer.overlay,
      overlay_name: layer.name,
      type_name: typeName(typeDomain, props.TYPE),
      document_url: props.DocumentURL ?? null,
      global_id: props.GlobalID ?? null,
    },
    geom_geojson: JSON.stringify(f.geometry),
    dataset_version_id: versionId,
  };
}

let total = 0;
let versionId = null;
if (!DRY) versionId = await ensureDraftVersion();

try {
  for (const layer of LAYERS) {
    const typeDomain = await loadTypeDomain(layer);
    const seenTypes = new Set();
    let offset = 0;
    let layerTotal = 0;
    while (true) {
      const data = await fetchPage(layer, offset);
      const features = data.features ?? [];
      if (features.length === 0) break;
      for (const f of features) {
        const t = (f.properties ?? f.attributes ?? {}).TYPE;
        if (t != null && t !== "") seenTypes.add(String(t));
      }
      if (DRY) {
        total += features.length;
        layerTotal += features.length;
        // Sample the first feature of each layer (not just the first layer overall).
        if (layerTotal <= PAGE && features[0]) {
          const a = features[0].properties || features[0].attributes || {};
          console.log(`sample (${layer.name}): OBJECTID=${a.OBJECTID} TYPE=${a.TYPE} NAME=${a.NAME ?? ""} geom=${features[0].geometry?.type}`);
        }
      } else {
        const rows = features.map((f) => rowFromFeature(f, layer, typeDomain));
        const { error } = await sb.rpc("insert_hazard_geojson", { p_rows: rows });
        if (error) throw new Error(error.message);
        total += rows.length;
        layerTotal += rows.length;
      }
      console.log(`Imported/seen ${layerTotal} ${layer.name} features... (running total ${total})`);
      offset += features.length;
      const more = data.exceededTransferLimit === true || features.length === PAGE;
      if (!more) break;
    }
    // Warn — not throw — if any TYPE code in the data is missing from the domain.
    // The feed sometimes carries codes before the domain catches up; we fall back
    // to no type name rather than the raw code so the scenario text stays readable.
    if (typeDomain) {
      const unmapped = [...seenTypes].filter((t) => !typeDomain.has(t));
      if (unmapped.length > 0) {
        console.warn(`WARN ${layer.name}: unmapped TYPE codes in data: ${unmapped.join(", ")}`);
      }
    }
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

console.log(`Done. Total overlay features: ${total}${DRY ? " (dry-run, not inserted)" : ""}`);
