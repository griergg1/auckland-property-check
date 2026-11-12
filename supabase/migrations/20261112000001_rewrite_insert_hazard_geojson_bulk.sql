-- Rewrite insert_hazard_geojson from a row-by-row PL/pgSQL loop to a single
-- set-based INSERT ... SELECT. The old row-by-row implementation hit the
-- Postgres statement timeout on the 86 k Large Scale Landslide Susceptibility
-- import even at PAGE=100; the set-based version inserts all rows in one
-- statement and runs in well under the statement timeout.
--
-- Behaviour is unchanged for existing importers:
--   * geometry is parsed with ST_GeomFromGeoJSON and tagged SRID 2193 (NZTM2000)
--   * MultiPolygon and other multi-geometries flow through unchanged
--   * invalid geometries throw and abort the batch (same as before)
--   * attributes defaults to '{}'::jsonb when missing
--   * dataset_version_id is nullable (empty string → NULL)
--
-- Re-run against overland flow + flood-prone + coastal inundation imports at
-- --dry-run before flipping production, to confirm identical row shape.
CREATE OR REPLACE FUNCTION public.insert_hazard_geojson(p_rows jsonb)
RETURNS void
LANGUAGE plpgsql
AS $function$
begin
  INSERT INTO public.hazard_features (
    dataset_slug, source_feature_id, scenario, attributes, geom, dataset_version_id
  )
  SELECT
    r->>'dataset_slug',
    r->>'source_feature_id',
    r->>'scenario',
    COALESCE(r->'attributes', '{}'::jsonb),
    ST_SetSRID(ST_GeomFromGeoJSON(r->>'geom_geojson'), 2193),
    nullif(r->>'dataset_version_id', '')::uuid
  FROM jsonb_array_elements(p_rows) AS r;
end;
$function$;
