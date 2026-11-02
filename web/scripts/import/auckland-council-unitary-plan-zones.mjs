#!/usr/bin/env node
// Import Auckland Council Unitary Plan Base Zone (ArcGIS REST FeatureServer) into public.hazard_features.
// The dataset version stays draft until the last page succeeds, then is promoted.
// Usage:
//   node --env-file=.env.local scripts/import/auckland-council-unitary-plan-zones.mjs --dry-run
//   node --env-file=.env.local scripts/import/auckland-council-unitary-plan-zones.mjs
//
// Source: Auckland Council, Unitary Plan Base Zone, ArcGIS item 232d7b39839d4616bcbfc0509e26d9b3.
// Licence: Auckland Council Open Data (CC BY 4.0).
// Rule pages: Auckland Unitary Plan ePlan, Chapter H Zones PDFs (coastal zones in Chapter F).
import "dotenv/config";
import ws from "ws";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes("--dry-run");
const SLUG = "ac-unitary-plan-zones";

if (!DRY && (!SB_URL || !SB_KEY)) {
  console.error("Supabase URL/service role key missing — run with --dry-run or add keys");
  process.exit(1);
}

const FS_URL =
  "https://services1.arcgis.com/n4yPwebTjJCmXB6W/ArcGIS/rest/services/Unitary_Plan_Base_Zone/FeatureServer/0";
const PAGE = 1000; // max 2000 per request; use 1000 to be safe

// ZONE coded value → zone name (from the FeatureServer coded-value domain).
const ZONE_NAMES = {
  65: "Ardmore Airport",
  66: "Ardmore Airport Residential",
  1: "Business - Business Park Zone",
  35: "Business - City Centre Zone",
  49: "Business - General Business Zone",
  5: "Business - Heavy Industry Zone",
  17: "Business - Light Industry Zone",
  7: "Business - Local Centre Zone",
  10: "Business - Metropolitan Centre Zone",
  12: "Business - Mixed Use Zone",
  44: "Business - Neighbourhood Centre Zone",
  22: "Business - Town Centre Zone",
  59: "Coastal - Coastal Transition Zone",
  39: "Coastal - Defence Zone",
  45: "Coastal - Ferry Terminal Zone",
  30: "Coastal - General Coastal Marine Zone",
  40: "Coastal - Marina Zone",
  37: "Coastal - Minor Port Zone",
  41: "Coastal - Mooring Zone",
  58: "DELETED",
  4: "Future Urban Zone",
  43: "Hauraki Gulf Islands",
  62: "Open Space - Civic Spaces Zone",
  34: "Open Space - Community Zone",
  31: "Open Space - Conservation Zone",
  32: "Open Space - Informal Recreation Zone",
  33: "Open Space - Sport and Active Recreation Zone",
  23: "Residential - Large Lot Zone",
  18: "Residential - Mixed Housing Suburban Zone",
  60: "Residential - Mixed Housing Urban Zone",
  20: "Residential - Rural and Coastal Settlement Zone",
  19: "Residential - Single House Zone",
  8: "Residential - Terrace Housing and Apartment Building Zone",
  27: "Road",
  3: "Rural - Countryside Living Zone",
  11: "Rural - Mixed Rural Zone",
  46: "Rural - Rural Coastal Zone",
  15: "Rural - Rural Conservation Zone",
  16: "Rural - Rural Production Zone",
  68: "Rural - Waitakere Foothills Zone",
  69: "Rural - Waitakere Ranges Zone",
  56: "Special Purpose - Airports and Airfields Zone",
  53: "Special Purpose - Cemetery Zone",
  55: "Special Purpose - Healthcare Facility and Hospital Zone",
  67: "Special Purpose - Landfill Zone",
  54: "Special Purpose - Major Recreation Facility Zone",
  52: "Special Purpose - Māori Purpose Zone",
  51: "Special Purpose - Quarry Zone",
  63: "Special Purpose - School Zone",
  64: "Special Purpose - Tertiary Education Zone",
  26: "Strategic Transport Corridor Zone",
  25: "Water",
  70: "Two-Storey Single Dwelling Residential Area",
  71: "Two-Storey Medium Density Residential Area",
  72: "Residential - Low Density Residential Zone",
  61: "Green Infrastructure Corridor",
};

const GROUPZONE_NAMES = {
  1: "Public Open Space",
  2: "Residential",
  3: "Business",
  4: "Rural",
  5: "Coastal",
  6: "Special purpose zone",
  7: "General",
  8: "New growth",
};

// Zone name → H-chapter PDF filename (exact spelling from the ePlan index).
// Coastal zones resolve to Chapter F. Zones without a dedicated chapter fall back to the ePlan root.
const EPLAN_ROOT = "https://unitaryplan.aucklandcouncil.govt.nz/";
const H_BASE = "https://unitaryplan.aucklandcouncil.govt.nz/Images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/";
const F_BASE = "https://unitaryplan.aucklandcouncil.govt.nz/Images/Auckland%20Unitary%20Plan%20Operative/Chapter%20F%20Coastal/";

function rulePageUrl(zoneName) {
  switch (zoneName) {
    case "Residential - Large Lot Zone": return H_BASE + encodeURIComponent("H1 Residential - Large Lot Zone.pdf");
    case "Residential - Rural and Coastal Settlement Zone": return H_BASE + encodeURIComponent("H2 Residential - Rural and Coastal Settlement Zone.pdf");
    case "Residential - Single House Zone": return H_BASE + encodeURIComponent("H3 Residential - Single House Zone.pdf");
    case "Residential - Mixed Housing Suburban Zone": return H_BASE + encodeURIComponent("H4 Residential - Mixed Housing Suburban Zone.pdf");
    case "Residential - Mixed Housing Urban Zone": return H_BASE + encodeURIComponent("H5 Residential - Mixed Housing Urban Zone.pdf");
    case "Residential - Terrace Housing and Apartment Building Zone": return H_BASE + encodeURIComponent("H6 Residential - Terrace Housing and Apartment Buildings Zone.pdf");
    case "Open Space - Civic Spaces Zone":
    case "Open Space - Community Zone":
    case "Open Space - Conservation Zone":
    case "Open Space - Informal Recreation Zone":
    case "Open Space - Sport and Active Recreation Zone":
      return H_BASE + encodeURIComponent("H7 Open Space zones.pdf");
    case "Business - City Centre Zone": return H_BASE + encodeURIComponent("H8 Business - City Centre Zone.pdf");
    case "Business - Metropolitan Centre Zone": return H_BASE + encodeURIComponent("H9 Business - Metropolitan Centre Zone.pdf");
    case "Business - Town Centre Zone": return H_BASE + encodeURIComponent("H10 Business - Town Centre Zone.pdf");
    case "Business - Local Centre Zone": return H_BASE + encodeURIComponent("H11 Business - Local Centre Zone.pdf");
    case "Business - Neighbourhood Centre Zone": return H_BASE + encodeURIComponent("H12 Business - Neighbourhood Centre Zone.pdf");
    case "Business - Mixed Use Zone": return H_BASE + encodeURIComponent("H13 Business - Mixed Use Zone.pdf");
    case "Business - General Business Zone": return H_BASE + encodeURIComponent("H14 Business - General Business Zone.pdf");
    case "Business - Business Park Zone": return H_BASE + encodeURIComponent("H15 Business - Business Park Zone.pdf");
    case "Business - Heavy Industry Zone": return H_BASE + encodeURIComponent("H16 Business - Heavy Industry Zone.pdf");
    case "Business - Light Industry Zone": return H_BASE + encodeURIComponent("H17 Business - Light Industry Zone.pdf");
    case "Future Urban Zone": return H_BASE + encodeURIComponent("H18 Future Urban Zone.pdf");
    case "Rural - Mixed Rural Zone":
    case "Rural - Rural Coastal Zone":
    case "Rural - Rural Conservation Zone":
    case "Rural - Rural Production Zone":
    case "Rural - Countryside Living Zone":
      return H_BASE + encodeURIComponent("H19 Rural zones.pdf");
    case "Rural - Waitakere Foothills Zone": return H_BASE + encodeURIComponent("H20 Rural - Waitakere Foothills Zone.pdf");
    case "Rural - Waitakere Ranges Zone": return H_BASE + encodeURIComponent("H21 Rural - Waitakere Ranges Zone.pdf");
    case "Strategic Transport Corridor Zone": return H_BASE + encodeURIComponent("H22 Strategic Transport Corridor Zone.pdf");
    case "Special Purpose - Airports and Airfields Zone": return H_BASE + encodeURIComponent("H23 Special Purpose - Airports and Airfields Zone.pdf");
    case "Special Purpose - Cemetery Zone": return H_BASE + encodeURIComponent("H24 Special Purpose - Cemetery Zone.pdf");
    case "Special Purpose - Healthcare Facility and Hospital Zone": return H_BASE + encodeURIComponent("H25 Special Purpose - Healthcare Facility and Hospital Zone.pdf");
    case "Special Purpose - Major Recreation Facility Zone": return H_BASE + encodeURIComponent("H26 Special Purpose - Major Recreation Facility Zone.pdf");
    case "Special Purpose - Māori Purpose Zone": return H_BASE + encodeURIComponent("H27 Special Purpose - Maori Purpose Zone.pdf");
    case "Special Purpose - Quarry Zone": return H_BASE + encodeURIComponent("H28 Special Purpose - Quarry Zone.pdf");
    case "Special Purpose - School Zone": return H_BASE + encodeURIComponent("H29 Special Purpose - School Zone.pdf");
    case "Special Purpose - Tertiary Education Zone": return H_BASE + encodeURIComponent("H30 Special Purpose - Tertiary Education Zone.pdf");
    case "Coastal - Coastal Transition Zone": return F_BASE + encodeURIComponent("F8 Coastal - Coastal Transition Zone.pdf");
    case "Coastal - Defence Zone": return F_BASE + encodeURIComponent("F7 Coastal - Defence Zone.pdf");
    case "Coastal - Ferry Terminal Zone": return F_BASE + encodeURIComponent("F6 Coastal - Ferry Terminal Zone.pdf");
    case "Coastal - General Coastal Marine Zone": return F_BASE + encodeURIComponent("F2 Coastal - General Coastal Marine Zone.pdf");
    case "Coastal - Marina Zone": return F_BASE + encodeURIComponent("F3 Coastal - Marina Zone.pdf");
    case "Coastal - Minor Port Zone": return F_BASE + encodeURIComponent("F5 Coastal - Minor Port Zone.pdf");
    case "Coastal - Mooring Zone": return F_BASE + encodeURIComponent("F4 Coastal - Mooring Zone and moorings outside the Coastal - Mooring Zone.pdf");
    default: return EPLAN_ROOT;
  }
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
    name: "Unitary Plan Base Zone",
    licence_url: "https://www.aucklandcouncil.govt.nz/en/geospatial/council-open-data/user-licence-auckland-council-open-data.html",
    access_method: "ArcGIS REST FeatureServer",
    attribution: "Auckland Council — Unitary Plan Base Zone (CC BY 4.0)",
    enabled: true,
  }).select("slug");
  const { data: v, error } = await sb.from("dataset_versions").insert({
    dataset_slug: SLUG,
    version_label: new Date().toISOString().slice(0, 10),
    geom_validated: false,
    status: "draft",
    notes: "Auckland Council Unitary Plan Base Zone import",
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
  // VERSIONSTATUS=4 is Operative. Exclude Proposed/Decision/Withdrawn records so the
  // check names the current zone, not a plan-change version.
  const url =
    `${FS_URL}/query?where=VERSIONSTATUS%3D4&outFields=OBJECTID,NAME,ZONE,GROUPZONE,VERSIONSTATUS&outSR=2193&returnGeometry=true&f=geojson` +
    `&resultOffset=${resultOffset}&resultRecordCount=${PAGE}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ArcGIS ${res.status} at offset=${resultOffset}`);
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || `ArcGIS error at offset=${resultOffset}`);
  }
  return data;
}

function decodeZone(props) {
  const zoneCode = props.ZONE;
  const zoneName = ZONE_NAMES[zoneCode] ?? (zoneCode != null ? `Zone code ${zoneCode}` : "Unknown zone");
  const groupzoneCode = props.GROUPZONE;
  const groupzoneName = GROUPZONE_NAMES[groupzoneCode];
  return {
    zone_code: zoneCode,
    zone_name: zoneName,
    groupzone_code: groupzoneCode,
    groupzone_name: groupzoneName ?? null,
    rule_page_url: rulePageUrl(zoneName),
    name: props.NAME ?? null,
  };
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
        console.log(`sample: OBJECTID=${a.OBJECTID} ZONE=${a.ZONE} -> ${decodeZone(a).zone_name} geom=${features[0].geometry?.type}`);
      }
    } else {
      const rows = features.map((f) => {
        const props = f.properties ?? f.attributes ?? {};
        const decoded = decodeZone(props);
        return {
          dataset_slug: SLUG,
          source_feature_id: String(props.OBJECTID ?? ""),
          scenario: decoded.zone_name,
          attributes: { ...props, ...decoded },
          geom_geojson: JSON.stringify(f.geometry),
          dataset_version_id: versionId,
        };
      });
      const { error } = await sb.rpc("insert_hazard_geojson", { p_rows: rows });
      if (error) throw new Error(error.message);
      total += rows.length;
    }
    console.log(`Imported/seen ${total} unitary plan zones...`);
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

console.log(`Done. Total unitary plan zones: ${total}${DRY ? " (dry-run, not inserted)" : ""}`);
