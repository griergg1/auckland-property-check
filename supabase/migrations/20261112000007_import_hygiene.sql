-- Importer hygiene.
-- 1. promote_dataset_version retires the old live version and activates the
--    new one in one transaction, and only after every stored shape is valid.
-- 2. feature_overlaps_parcel counts a hazard only when it crosses into the
--    parcel, not when it merely touches the boundary. ST_Intersects keeps the
--    spatial index; NOT ST_Touches drops edge and corner touches. Measuring
--    the intersection area was too slow on the landslide layer.

CREATE OR REPLACE FUNCTION public.feature_overlaps_parcel(
  p_parcel geometry,
  p_feature geometry
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT p_parcel IS NOT NULL
    AND p_feature IS NOT NULL
    AND NOT ST_IsEmpty(p_feature)
    AND ST_Intersects(p_parcel, p_feature)
    AND NOT ST_Touches(p_parcel, p_feature);
$$;

REVOKE ALL ON FUNCTION public.feature_overlaps_parcel(geometry, geometry) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.feature_overlaps_parcel(geometry, geometry) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.promote_dataset_version(
  p_version_id uuid,
  p_row_count integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_slug text;
  v_invalid integer;
BEGIN
  SELECT dataset_slug INTO v_slug
  FROM public.dataset_versions
  WHERE id = p_version_id
  FOR UPDATE;

  IF v_slug IS NULL THEN
    RAISE EXCEPTION 'dataset version % not found', p_version_id;
  END IF;

  SELECT count(*) INTO v_invalid
  FROM (
    SELECT 1
    FROM public.hazard_features
    WHERE dataset_version_id = p_version_id
      AND NOT ST_IsValid(geom)
    UNION ALL
    SELECT 1
    FROM public.parcels
    WHERE source_dataset_version_id = p_version_id
      AND NOT ST_IsValid(geom)
  ) bad;

  IF v_invalid > 0 THEN
    RAISE EXCEPTION 'refusing to promote version %: % invalid geometries', p_version_id, v_invalid;
  END IF;

  UPDATE public.dataset_versions
  SET status = 'retired'
  WHERE dataset_slug = v_slug
    AND status = 'active'
    AND id <> p_version_id;

  UPDATE public.dataset_versions
  SET status = 'active',
      row_count = p_row_count,
      geom_validated = true
  WHERE id = p_version_id;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_dataset_version(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_dataset_version(uuid, integer) TO service_role;

-- Swap the overlap test in every assess_* function that still uses a bare intersect.
-- School zones use the parcel centroid and are left alone.
DO $$
DECLARE
  r record;
  src text;
  newsrc text;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname LIKE 'assess_%'
  LOOP
    src := pg_get_functiondef(r.sig);
    IF position('ST_Intersects(v_parcel, h.geom)' IN src) = 0 THEN
      CONTINUE;
    END IF;
    newsrc := replace(
      src,
      'ST_Intersects(v_parcel, h.geom)',
      'public.feature_overlaps_parcel(v_parcel, h.geom)'
    );
    EXECUTE newsrc;
  END LOOP;
END;
$$;

-- A landslide polygon with no category is not "nothing on the map".
CREATE OR REPLACE FUNCTION public.assess_landslide_susceptibility(
  p_parcel_id uuid,
  p_intention text DEFAULT 'live'::text
)
RETURNS TABLE(
  check_id text, rule_version text, status text, title text,
  explanation text, limitations text, follow_up_questions jsonb,
  source_url text, dataset_version_id uuid, feature_ids jsonb,
  evidence_geom jsonb, retrieval_date timestamp with time zone,
  intentions text[]
)
LANGUAGE plpgsql
STABLE
AS $function$
declare
  v_parcel geometry(Geometry, 2193);
  v_dataset_version_id uuid;
  v_highest text;
  v_feature_ids text[];
  v_count integer;
  v_limitations text := 'Map evidence only. This is regional-scale susceptibility mapping (Level A, 2025), not a site-specific geotechnical assessment. The shallow landslide susceptibility layer is not included. Verify slope stability with a geotechnical engineer before building or earthworks.';
  v_source text := 'https://www.aucklandcouncil.govt.nz/en/plans-policies-bylaws-reports-projects/our-plans-strategies/unitary-plan/auckland-unitary-plan-modifications/material-incorporated-by-reference/technical-report-auckland-landslide-susceptibility-assessment.html';
begin
  select geom into v_parcel from public.parcels where id = p_parcel_id;
  if v_parcel is null then
    return query select
      'hazard.landslide_susceptibility'::text, 'rules.v1'::text, 'unavailable'::text,
      'Landslide susceptibility check'::text,
      'Parcel not found.'::text,
      null::text, '[]'::jsonb, null::text, null::uuid, '[]'::jsonb, null::jsonb, now(), array[p_intention]::text[];
    return;
  end if;

  select dv.id into v_dataset_version_id
  from public.dataset_versions dv
  where dv.dataset_slug = 'ac-landslide-susceptibility'
    and dv.status = 'active'
  order by dv.imported_at desc
  limit 1;

  if v_dataset_version_id is null then
    return query select
      'hazard.landslide_susceptibility'::text, 'rules.v1'::text, 'unavailable'::text,
      'Landslide susceptibility check'::text,
      'Landslide susceptibility data is not available for this area.'::text,
      'This check requires a verified Auckland Council landslide susceptibility dataset.'::text,
      '[]'::jsonb, null::text, null::uuid, '[]'::jsonb, null::jsonb, now(), array[p_intention]::text[];
    return;
  end if;

  select h.attributes->>'SusceptibilityValue'
  into v_highest
  from public.hazard_features h
  where h.dataset_version_id = v_dataset_version_id
    and public.feature_overlaps_parcel(v_parcel, h.geom)
    and h.attributes->>'SusceptibilityValue' is not null
  order by case h.attributes->>'SusceptibilityValue'
    when 'Very High' then 5
    when 'High' then 4
    when 'Moderate' then 3
    when 'Low' then 2
    when 'Very Low' then 1
    else 0
  end desc
  limit 1;

  select count(*) into v_count
  from public.hazard_features h
  where h.dataset_version_id = v_dataset_version_id
    and public.feature_overlaps_parcel(v_parcel, h.geom);

  if v_count = 0 then
    return query select
      'hazard.landslide_susceptibility'::text, 'rules.v1'::text, 'not_detected'::text,
      'No mapped landslide susceptibility on this section'::text,
      'No mapped landslide susceptibility polygon was found covering this section within the checked coverage.'::text,
      v_limitations,
      '[]'::jsonb, v_source, v_dataset_version_id, '[]'::jsonb, null::jsonb, now(), array[p_intention]::text[];
    return;
  end if;

  if v_highest is null then
    return query select
      'hazard.landslide_susceptibility'::text, 'rules.v1'::text, 'needs_review'::text,
      'Landslide susceptibility is mapped, but the category is missing'::text,
      'A mapped landslide polygon covers this section, but it has no susceptibility category. This is not a clear result.'::text,
      v_limitations,
      '[]'::jsonb, v_source, v_dataset_version_id, '[]'::jsonb, null::jsonb, now(), array[p_intention]::text[];
    return;
  end if;

  select array_agg(h.source_feature_id)
  into v_feature_ids
  from public.hazard_features h
  where h.dataset_version_id = v_dataset_version_id
    and public.feature_overlaps_parcel(v_parcel, h.geom);

  return query
    select
      'hazard.landslide_susceptibility'::text,
      'rules.v1'::text,
      'detected'::text,
      'Landslide susceptibility: ' || v_highest,
      'Mapped Auckland Council large-scale landslide susceptibility covers this section. The highest category found is ' || v_highest || '.'::text,
      v_limitations,
      jsonb_build_array(
        jsonb_build_object('question', 'Does the mapped susceptibility change the foundation or earthworks design for the work you are planning?', 'audience', 'geotechnical engineer'),
        jsonb_build_object('question', 'Is there a record of past landslides or geotechnical reports for this property or the immediate neighbourhood?', 'audience', 'council / LIM')
      ),
      v_source,
      v_dataset_version_id,
      to_jsonb(v_feature_ids),
      (
        select ST_AsGeoJSON(ST_Transform(ST_Union(ST_Intersection(v_parcel, h.geom)), 4326))::jsonb
        from public.hazard_features h
        where h.dataset_version_id = v_dataset_version_id
          and public.feature_overlaps_parcel(v_parcel, h.geom)
      ),
      now(),
      array[p_intention]::text[];
end;
$function$;
