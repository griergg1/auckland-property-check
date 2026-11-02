#!/usr/bin/env node
// Import Ministry of Education school enrolment home zones into public.hazard_features.
// Source: MoE enrolment scheme home zones, republished by Eagle Technology as the
//   "NZ School Enrolment Zones" FeatureServer (Living Atlas), NZTM (EPSG:2193).
//   URL: https://services.arcgis.com/XTtANUDT8Va4DLwI/arcgis/rest/services/NZ_School_Zone_boundaries/FeatureServer/0
// Licence: Crown copyright — Ministry of Education, CC BY 3.0 NZ (per the item licenseInfo;
//   equivalent to CC BY 4.0 for reuse purposes). "Contains data sourced from the
//   Ministry of Education licensed for reuse under Creative Commons Attribution 3.0 New Zealand."
// Note: the layer is generalised by Eagle Technology for web performance; it does not
//   fully represent the official boundaries. Fine for parcel-centroid point-in-polygon.
// The dataset version stays draft until the last page succeeds, then is promoted.
//
// Usage:
//   node --env-file=.env.local scripts/import/moe-school-enrolment-zones.mjs --dry-run
//   node --env-file=.env.local scripts/import/moe-school-enrolment-zones.mjs
import "dotenv/config";
import ws from "ws";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes("--dry-run");
const SLUG = "moe-school-enrolment-zones";

if (!DRY && (!SB_URL || !SB_KEY)) {
  console.error("Supabase URL/service role key missing — run with --dry-run or add keys");
  process.exit(1);
}

const FS_URL =
  "https://services.arcgis.com/XTtANUDT8Va4DLwI/arcgis/rest/services/NZ_School_Zone_boundaries/FeatureServer/0";
const PAGE = 2000; // maxRecordCount for this FeatureServer is 2000

let sb;
if (!DRY) {
  const { createClient } = await import("@supabase/supabase-js");
  sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false }, realtime: { transport: ws } });
}

async function ensureDraftVersion() {
  await sb.from("datasets").upsert({
    slug: SLUG,
    source_org: "Ministry of Education",
    name: "School Enrolment Home Zones",
    licence_url: "https://www.educationcounts.govt.nz/data-services/school-enrolment-zones",
    access_method: "ArcGIS REST FeatureServer (Eagle Technology Living Atlas republish)",
    attribution: "Ministry of Education — School Enrolment Home Zones (CC BY 3.0 NZ, Crown copyright)",
    enabled: true,
  }).select("slug");
  const { data: v, error } = await sb.from("dataset_versions").insert({
    dataset_slug: SLUG,
    version_label: new Date().toISOString().slice(0, 10),
    geom_validated: false,
    status: "draft",
    notes: "MoE School Enrolment Home Zones import (national; Auckland queried at report time)",
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
    `${FS_URL}/query?where=1%3D1` +
    `&outFields=OBJECTID,School_ID,School_name,Office,Institution_type,Approval_date,Effective_date` +
    `&outSR=2193&returnGeometry=true&f=geojson` +
    `&resultOffset=${resultOffset}&resultRecordCount=${PAGE}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ArcGIS ${res.status} at offset=${resultOffset}`);
  const data = await res.json();
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
        console.log(`sample: School_ID=${a.School_ID} name=${a.School_name} type=${a.Institution_type} office=${a.Office} geom=${features[0].geometry?.type}`);
      }
    } else {
      const rows = features.map((f) => {
        const props = f.properties ?? f.attributes ?? {};
        return {
          dataset_slug: SLUG,
          source_feature_id: String(props.OBJECTID ?? ""),
          scenario: props.Institution_type ?? "School",
          attributes: {
            school_id: props.School_ID ?? null,
            school_name: props.School_name ?? null,
            institution_type: props.Institution_type ?? null,
            office: props.Office ?? null,
            approval_date: props.Approval_date ?? null,
            effective_date: props.Effective_date ?? null,
          },
          geom_geojson: JSON.stringify(f.geometry),
          dataset_version_id: versionId,
        };
      });
      const { error } = await sb.rpc("insert_hazard_geojson", { p_rows: rows });
      if (error) throw new Error(error.message);
      total += rows.length;
    }
    console.log(`Imported/seen ${total} school enrolment zones...`);
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

console.log(`Done. Total school enrolment zones: ${total}${DRY ? " (dry-run, not inserted)" : ""}`);
