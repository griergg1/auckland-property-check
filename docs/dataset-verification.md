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
| Status | `access-check` — needs LINZ API key + licence confirmation before import |
| Notes | ~2.7M polygons nationally; Auckland clip keeps storage manageable. Use Changeset API for incremental updates. |

## LINZ — NZ Addresses

| Field | Value |
|-------|-------|
| Slug | `linz-nz-addresses` |
| Source org | LINZ |
| Layer | NZ Addresses |
| Layer ID | 105688 (current schema; note March 2026 schema migration) |
| Access method | WFS 2.0 with API key |
| Endpoint | `https://data.linz.govt.nz/services;key={LINZ_API_KEY}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=layer-105688&outputformat=json` |
| Licence | LINZ Data Service Licence (CC BY 4.0) |
| Attribution | "Contains data sourced from the LINZ Data Service and licensed for reuse under CC BY 4.0." |
| Update cadence | Weekly |
| Status | `access-check` — schema migration March 2026; wrap fields in adapter |
| Notes | Used for address search → address-to-parcel resolution. May use live WFS query for search instead of bulk import. |

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
| Data type | Polygon (line features stored as polygons) |
| CRS | NZTM2000 (EPSG:2193) |
| Access method | ArcGIS REST FeatureServer |
| Endpoint | `https://services1.arcgis.com/n4yPwebTjJCmXB6W/ArcGIS/rest/services/Overland_Flow_Paths/FeatureServer/0` |
| Query example | `.../FeatureServer/0/query?where=1=1&outFields=*&outSR=2193&returnGeometry=true&f=geojson` |
| Licence | Auckland Council Open Data — CC BY 4.0 |
| Attribution | "Auckland Council Open Data — Overland Flow Paths" |
| Update cadence | As updated; Geomaps current is the live source (PC120 viewer is frozen) |
| Status | `verified` — licence + endpoint confirmed; import planned |
| Notes | Re-mapped 2019 using LiDAR DEM. Max record count 2000 per request → paginate. Used for the `hazard.overland_flow` check. |

## Auckland Council — Flood Prone Areas (next candidate)

| Field | Value |
|-------|-------|
| Slug | `ac-flood-prone-areas` |
| Source org | Auckland Council |
| Access method | ArcGIS REST FeatureServer |
| Status | `pending` — locate FeatureServer URL and confirm licence before enabling |
| Notes | Pair with overland flow for a fuller flood picture. |

## Auckland Council — Unitary Plan zones (planning, later)

| Field | Value |
|-------|-------|
| Slug | `ac-unitary-plan-zones` |
| Source org | Auckland Council |
| Access method | ArcGIS REST (MapServer/FeatureServer) |
| Status | `pending` — locate zone polygon layer + rule page URLs |
| Notes | Enables the `planning.zone` check with links to rule pages. |

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
