-- assess_landslide_susceptibility — fourth hazard check, after overland flow,
-- flood prone, coastal inundation. Reads the active `ac-landslide-susceptibility`
-- dataset and intersects the confirmed parcel. Returns the highest susceptibility
-- category found (Very High / High / Moderate / Low / Very Low) or `not_detected`.
--
-- The shallow landslide susceptibility layer (4.9 M grid-cell polygons) is
-- deliberately excluded from import; its limitations line says so.
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

  -- Highest susceptibility category among intersecting polygons.
  select
    h.attributes->>'SusceptibilityValue'
  into v_highest
  from public.hazard_features h
  where h.dataset_version_id = v_dataset_version_id
    and ST_Intersects(v_parcel, h.geom)
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
    and ST_Intersects(v_parcel, h.geom);

  if v_count = 0 or v_highest is null then
    return query select
      'hazard.landslide_susceptibility'::text, 'rules.v1'::text, 'not_detected'::text,
      'No mapped landslide susceptibility on this section'::text,
      'No mapped landslide susceptibility polygon was found overlapping this section within the checked coverage.'::text,
      'Map evidence only. The absence of mapped susceptibility does not guarantee slope stability. The shallow landslide susceptibility layer is not included in this check because its grid-cell resolution makes it unsuitable for bulk import. Verify with a geotechnical engineer before building or earthworks.'::text,
      '[]'::jsonb,
      'https://www.aucklandcouncil.govt.nz/en/plans-policies-bylaws-reports-projects/our-plans-strategies/unitary-plan/auckland-unitary-plan-modifications/material-incorporated-by-reference/technical-report-auckland-landslide-susceptibility-assessment.html'::text,
      v_dataset_version_id, '[]'::jsonb, null::jsonb, now(), array[p_intention]::text[];
    return;
  end if;

  select array_agg(h.source_feature_id)
  into v_feature_ids
  from public.hazard_features h
  where h.dataset_version_id = v_dataset_version_id
    and ST_Intersects(v_parcel, h.geom);

  return query
    select
      'hazard.landslide_susceptibility'::text,
      'rules.v1'::text,
      'detected'::text,
      'Landslide susceptibility: ' || v_highest,
      'Mapped Auckland Council large-scale landslide susceptibility overlaps this section. The highest category found is ' || v_highest || '.'::text,
      'Map evidence only. This is regional-scale susceptibility mapping (Level A, 2025), not a site-specific geotechnical assessment. It shows where conditions are more or less favourable for landslides; it does not mean a landslide has occurred or will occur here. The shallow landslide susceptibility layer is not included because its 4.9 million grid-cell polygons are unsuitable for bulk import. If you are building, extending, or doing earthworks, verify slope stability with a geotechnical engineer and order a LIM.'::text,
      jsonb_build_array(
        jsonb_build_object('question', 'Does the mapped susceptibility change the foundation or earthworks design for the work you are planning?', 'audience', 'geotechnical engineer'),
        jsonb_build_object('question', 'Is there a record of past landslides or geotechnical reports for this property or the immediate neighbourhood?', 'audience', 'council / LIM')
      ),
      'https://www.aucklandcouncil.govt.nz/en/plans-policies-bylaws-reports-projects/our-plans-strategies/unitary-plan/auckland-unitary-plan-modifications/material-incorporated-by-reference/technical-report-auckland-landslide-susceptibility-assessment.html'::text,
      v_dataset_version_id,
      to_jsonb(v_feature_ids),
      (
        select ST_AsGeoJSON(ST_Transform(ST_Union(ST_Intersection(v_parcel, h.geom)), 4326))::jsonb
        from public.hazard_features h
        where h.dataset_version_id = v_dataset_version_id
          and ST_Intersects(v_parcel, h.geom)
      ),
      now(),
      array[p_intention]::text[];
end;
$function$;
