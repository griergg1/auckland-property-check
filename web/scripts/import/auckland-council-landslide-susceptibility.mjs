#!/usr/bin/env node
// Import Auckland Council Large Scale Landslide Susceptibility into public.hazard_features.
// The shallow susceptibility layer (4.9 M grid-cell polygons) is not bulk-imported because
// its resolution makes it unsuitable for this database; this check uses the regional-scale
// large-scale susceptibility mapping instead.
// The dataset version stays draft until the last page succeeds, then is promoted.
//
// Source: Auckland Council, Large Scale Landslide Susceptibility,
//   ArcGIS item ID 0d83cc4836f04620b77c31e802114288.
//   Same Auckland Council open-data hub as the flood layers.
// Licence: Auckland Council Open Data (CC BY 4.0).
//
// Usage:
//   node --env-file=.env.local scripts/import/auckland-council-landslide-susceptibility.mjs --dry-run
//   node --env-file=.env.local scripts/import/auckland-council-landslide-susceptibility.mjs
import "dotenv/config";
import ws from "ws";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes("--dry-run");
const SLUG = "ac-landslide-susceptibility";

if (!DRY && (!SB_URL || !SB_KEY)) {
  console.error("Supabase URL/service role key missing — run with --dry-run or add keys");
  process.exit(1);
}

const FS_URL =
  "https://services1.arcgis.com/n4yPwebTjJCmXB6W/ArcGIS/rest/services/Large_Scale_Landslide_Susceptibility/FeatureServer/0";
const PAGE = 1000;

let sb;
if (!DRY) {
  const { createClient } = await import("@supabase/supabase-js");
  sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false }, realtime: { transport: ws } });
}

async function ensureDraftVersion() {
  await sb.from("datasets").upsert({
    slug: SLUG,
    source_org: "Auckland Council",
    name: "Landslide Susceptibility (Large Scale)",
    licence_url: "https://www.aucklandcouncil.govt.nz/en/geospatial/council-open-data/user-licence-auckland-council-open-data.html",
    access_method: "ArcGIS REST FeatureServer",
    attribution: "Auckland Council — Landslide Susceptibility (CC BY 4.0)",
    enabled: true,
  }).select("slug");
  const { data: v, error } = await sb.from("dataset_versions").insert({
    dataset_slug: SLUG,
    version_label: new Date().toISOString().slice(0, 10),
    geom_validated: false,
    status: "draft",
    notes: "Auckland Council Large Scale Landslide Susceptibility import (shallow layer excluded — see script comments)",
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
// This script's first run died at ~30k rows on a transient fetch error; the
// retry stops a repeat of that from costing the whole import. A hard timeout
// via AbortController guards against hung sockets — without it a stalled
// response would never trigger the retry.
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

async function fetchPage(resultOffset) {
  // Order by OBJECTID so paging with resultOffset is stable across retries.
  // Unordered paging on an 86k-row import can duplicate or skip rows.
  const url =
    `${FS_URL}/query?where=1%3D1&outFields=OBJECTID,SUAspect,AspectDirection,SUSlope,SlopeType,PartitionedSlope,Relief,StreamOrder,LandslideCount,Confidence,SusceptibilityCode,SusceptibilityValue,Shape__Area,Shape__Length&outSR=2193&returnGeometry=true&orderByFields=OBJECTID&f=geojson` +
    `&resultOffset=${resultOffset}&resultRecordCount=${PAGE}`;
  const data = await fetchWithRetry(url);
  if (data.error) {
    throw new Error(data.error.message || `ArcGIS error at offset=${resultOffset}`);
  }
  return data;
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
        console.log(`sample: OBJECTID=${a.OBJECTID} susceptibility=${a.SusceptibilityValue} confidence=${a.Confidence} geom=${features[0].geometry?.type}`);
      }
    } else {
      const rows = features.map((f) => {
        const props = f.properties ?? f.attributes ?? {};
        return {
          dataset_slug: SLUG,
          source_feature_id: String(props.OBJECTID ?? ""),
          scenario: props.SusceptibilityValue ?? "Landslide susceptibility",
          attributes: props,
          geom_geojson: JSON.stringify(f.geometry),
          dataset_version_id: versionId,
        };
      });
      const { error } = await sb.rpc("insert_hazard_geojson", { p_rows: rows });
      if (error) throw new Error(error.message);
      total += rows.length;
    }
    console.log(`Imported/seen ${total} landslide susceptibility features...`);
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

console.log(`Done. Total landslide susceptibility features: ${total}${DRY ? " (dry-run, not inserted)" : ""}`);
