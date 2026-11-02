# Dataset verification ledger

Each layer must have a row here **before** it is enabled in the app. Public visibility in a map viewer does not establish bulk reuse rights; a catalogue API does not contain geometry.

## Status legend

- `verified` — licence + access + coverage confirmed; safe to enable
- `access-check` — endpoint confirmed; licence/coverage being confirmed
- `pending` — not yet investigated

---

## LINZ — NZ Primary Parcels

| Field | Value |
|-------|-------|
| Slug | `linz-nz-primary-parcels` |
| Source org | Land Information New Zealand (LINZ) |
| Layer | NZ Primary Parcels |
| Layer ID | 50772 |
| Data type | Polygon (MultiPolygon) |
| CRS (stored) | EPSG:2193 (NZTM2000) |
| Access method | WFS 2.0 with API key |
| Endpoint | `https://data.linz.govt.nz/services;key={LINZ_API_KEY}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=layer-50772&SRSName=EPSG:2193&outputformat=json` |
| Auckland clip (NZTM bbox, y/x order) | `bbox(shape,5890000,1740000,5950000,1765000)` |
| Licence | LINZ Data Service Licence (CC BY 4.0 for this dataset) |
| Attribution | "Contains data sourced from the LINZ Data Service and licensed for reuse under CC BY 4.0." |
| Update cadence | Weekly (LDS property data updated weekly) |
| Status | `verified` — Auckland clip imported (461,632 parcels) |
| Notes | ~2.7M polygons nationally; Auckland clip keeps storage manageable. Use Changeset API for incremental updates. |

## LINZ — NZ Addresses

| Field | Value |
|-------|-------|
| Slug | `linz-nz-addresses` |
| Source org | LINZ |
| Layer | NZ Addresses |
| Layer ID | 123113 (NZ Addresses current schema, July 2026; layer-105688 retired) |
| Access method | WFS 2.0 with API key |
| Endpoint | `https://data.linz.govt.nz/services;key={LINZ_API_KEY}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=layer-123113&outputformat=json` |
| Licence | LINZ Data Service Licence (CC BY 4.0) |
| Attribution | "Contains data sourced from the LINZ Data Service and licensed for reuse under CC BY 4.0." |
| Update cadence | Weekly |
| Status | `verified` — live search only; not bulk-imported |
| Notes | Search uses `full_address` / `full_road_name` inside an Auckland bbox. A non-OK WFS response is an error, not an empty result. |

## LINZ Basemaps (aerial imagery)

| Field | Value |
|-------|-------|
| Slug | `linz-basemaps-aerial` |
| Source org | LINZ |
| Access method | Raster tiles (WebMercatorQuad) |
| Endpoint | `https://basemaps.linz.govt.nz/v1/aerial/{z}/{x}/{y}.webp` (optional `?api={LINZ_API_KEY}`) |
| Licence | LINZ Basemaps terms (CC BY 4.0) |
| Attribution | "&copy; LINZ" (rendered in MapLibre control) |
| Status | `verified` — public raster tiles; attribution in map UI |
| Notes | Used for map context only; not stored in PostGIS. |

## Auckland Council — Overland Flow Paths

| Field | Value |
|-------|-------|
| Slug | `ac-overland-flow-paths` |
| Source org | Auckland Council |
| Layer | Overland Flow Paths |
| Source modified | 2026-03-24 |
| Data type | LineString (stored as generic geometry, SRID 2193) |
| CRS | NZTM2000 (EPSG:2193) |
| Access method | ArcGIS REST FeatureServer |
| Endpoint | `https://services1.arcgis.com/n4yPwebTjJCmXB6W/ArcGIS/rest/services/Overland_Flow_Paths/FeatureServer/0` |
| Query example | `.../FeatureServer/0/query?where=1=1&outFields=*&outSR=2193&returnGeometry=true&f=geojson` |
| Licence | Auckland Council Open Data — CC BY 4.0 |
| Attribution | "Auckland Council Open Data — Overland Flow Paths" |
| Update cadence | As updated; Geomaps current is the live source (PC120 viewer is frozen) |
| Status | `verified` — imported (1,176,253 features) |
| Notes | Re-mapped 2019 using LiDAR DEM. Max record count 2000 per request → paginate. GeoJSON responses put attributes on `properties`, not `attributes`. Used for the `hazard.overland_flow` check. Existing rows may have an empty `source_feature_id` from the first import. |

## Auckland Council — Flood Prone Areas

| Field | Value |
|-------|-------|
| Slug | `ac-flood-prone-areas` |
| Source org | Auckland Council Healthy Waters |
| Access method | ArcGIS REST FeatureServer |
| Endpoint | `https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Flood_Prone_Areas/FeatureServer/0` |
| Item | [Flood Prone Areas](https://www.arcgis.com/home/item.html?id=0be75c47bc1a4f28b9a7745a3eba5cbf) |
| Licence | Auckland Council Open Data — CC BY 4.0. Item text: Creative Commons, for internal and external use. |
| Attribution | "Auckland Council Healthy Waters — Flood Prone Areas" |
| Count | 35,338 polygons (queried 2026-11-02) |
| Status | `verified` — imported 35,338 polygons. Version stays `draft` until the last page succeeds, then `active`. |
| Notes | Potential ponding areas from topography, assuming a blocked outlet. Not a hydraulic flood model. Used for the `hazard.flood_prone` check. |

## Auckland Council — Unitary Plan Base Zone

| Field | Value |
|-------|-------|
| Slug | `ac-unitary-plan-zones` |
| Source org | Auckland Council (Plans and Places) |
| Layer | Unitary Plan Base Zone (Auckland Unitary Plan — Operative in part, 15 Nov 2016) |
| Item ID | `232d7b39839d4616bcbfc0509e26d9b3` |
| Data type | Polygon (MultiPolygon) |
| CRS | NZTM2000 (EPSG:2193) |
| Access method | ArcGIS REST FeatureServer (no auth, open data) |
| Endpoint | `https://services1.arcgis.com/n4yPwebTjJCmXB6W/ArcGIS/rest/services/Unitary_Plan_Base_Zone/FeatureServer/0` |
| Query example | `.../FeatureServer/0/query?where=1=1&outFields=OBJECTID,NAME,ZONE,GROUPZONE&outSR=2193&returnGeometry=true&f=geojson&resultRecordCount=2000` |
| Max record count | 2000 per request → paginate with `resultOffset`; honour `exceededTransferLimit` |
| Fields | `OBJECTID`, `NAME` (sub-area label, often empty), `ZONE` (coded double → zone name), `GROUPZONE` (coded double → group), `VALIDATIONSTATE`, `VERSIONSTATUS`, `GlobalID`, `Shape__Area`, `Shape__Length` |
| Licence | Auckland Council Open Data — CC BY 4.0 (commercial use OK with attribution) |
| Attribution | "Auckland Council — Unitary Plan Base Zone (CC BY 4.0)" |
| Rule pages | Auckland Unitary Plan ePlan — Chapter H Zones PDFs at `https://unitaryplan.aucklandcouncil.govt.nz/` (index: `data/operative/data.xml`). Coastal zones are in Chapter F. |
| Update cadence | As updated; the ePlan viewer is the live text source |
| Status | `verified` — endpoint, licence (CC BY 4.0), and coverage confirmed 2026-11-02. Imported 139,488 operative zone polygons (filtered to `VERSIONSTATUS=4`); version stayed `draft` until the last page succeeded, then `active`. |
| Notes | `ZONE` is a coded value decoded client-side to the zone name (e.g. 18 → Residential - Mixed Housing Suburban Zone). The H-chapter rule PDF URL is built from the zone name. The import excludes Proposed/Decision/Withdrawn records (`VERSIONSTATUS≠4`) so the check names the current zone, not a plan-change version. Used for the `planning.zone` check, which intersects the confirmed parcel (not the address point). |

---

## Import plan (PoC → MVP)

1. **LINZ parcels (Auckland clip)** — import into `public.parcels` via WFS bbox query. Validate row count + geometry. Mark `dataset_versions.active`.
2. **Auckland Council overland flow paths** — page through FeatureServer (2000 records/page), transform to NZTM, insert into `public.hazard_features` with `dataset_slug='ac-overland-flow-paths'`.
3. **LINZ addresses** — decide live WFS search vs Auckland import after measuring size.
4. **Replace demo fixture** with real parcel + real hazard layer; keep demo fixtures behind `is_demo` flag for tests.

## Import execution environment

Run imports via `tsx` scripts in [`web/scripts/import/`](../web/scripts/import/) or GitHub Actions — **not** Vercel serverless (timeout + size). Service role key only in scripts/server.

## Pre-import gates

- [ ] LINZ API key obtained and stored in `.env.local` / Vercel.
- [ ] Licence text confirmed for each layer.
- [ ] Auckland bbox tested against WFS/REST (small count first).
- [ ] Validation: non-empty, SRID 2193, bounds within Auckland.
- [ ] `dataset_versions` row created with `status='draft'` → promoted to `active` after validation.
