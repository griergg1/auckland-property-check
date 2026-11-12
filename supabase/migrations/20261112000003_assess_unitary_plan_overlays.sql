-- assess_unitary_plan_overlays — covers the four operative Unitary Plan overlay
-- layers imported under slug `ac-unitary-plan-overlays`:
--   * Historic Heritage Extent of Place
--   * Significant Ecological Areas
--   * Regionally Significant Volcanic Viewshafts / Height Sensitive Areas
--   * Special Character Areas (Residential and Business)
--
-- Returns either `not_detected` (no overlays overlap this parcel) or `detected`
-- with a list of overlays, grouped by overlay type and formatted for the report.
--
-- Security note: this function ALWAYS returns the hardcoded Auckland Unitary
-- Plan ePlan URL as `source_url`. The remote `DocumentURL` attribute is stored
-- on the hazard feature for reference but is NEVER passed through as `source_url`,
-- because `source_url` is rendered as an href on the report page. If this
-- function is ever refactored to accept per-feature URLs, validate them against
-- an https + Auckland Council host allowlist before returning.
CREATE OR REPLACE FUNCTION public.assess_unitary_plan_overlays(
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
  v_count integer;
  v_feature_ids text[];
  v_lines text;
begin
  select geom into v_parcel from public.parcels where id = p_parcel_id;
  if v_parcel is null then
    return query select
      'planning.overlays'::text, 'rules.v1'::text, 'unavailable'::text,
      'Unitary Plan overlay check'::text,
      'Parcel not found.'::text,
      null::text, '[]'::jsonb, null::text, null::uuid, '[]'::jsonb, null::jsonb, now(), array[p_intention]::text[];
    return;
  end if;

  select dv.id into v_dataset_version_id
  from public.dataset_versions dv
  where dv.dataset_slug = 'ac-unitary-plan-overlays'
    and dv.status = 'active'
  order by dv.imported_at desc
  limit 1;

  if v_dataset_version_id is null then
    return query select
      'planning.overlays'::text, 'rules.v1'::text, 'unavailable'::text,
      'Unitary Plan overlay check'::text,
      'Unitary Plan overlay data is not available for this area.'::text,
      'This check requires a verified Auckland Council Unitary Plan overlays dataset.'::text,
      '[]'::jsonb, null::text, null::uuid, '[]'::jsonb, null::jsonb, now(), array[p_intention]::text[];
    return;
  end if;

  select count(*) into v_count
  from public.hazard_features h
  where h.dataset_version_id = v_dataset_version_id
    and ST_Intersects(v_parcel, h.geom);

  if v_count = 0 then
    return query select
      'planning.overlays'::text, 'rules.v1'::text, 'not_detected'::text,
      'No Unitary Plan overlays on this section'::text,
      'No operative Unitary Plan overlay polygons were found overlapping this section within the checked coverage.'::text,
      'Map evidence only. This check covers historic heritage (extent of place), significant ecological areas, regionally significant volcanic viewshafts / height sensitive areas, and special character areas. Other overlays, precincts and designations may still apply. Verify with the ePlan viewer and a planner.'::text,
      '[]'::jsonb,
      'https://unitaryplan.aucklandcouncil.govt.nz/'::text,
      v_dataset_version_id, '[]'::jsonb, null::jsonb, now(), array[p_intention]::text[];
    return;
  end if;

  select array_agg(h.source_feature_id) into v_feature_ids
  from public.hazard_features h
  where h.dataset_version_id = v_dataset_version_id
    and ST_Intersects(v_parcel, h.geom);

  select string_agg(
    overlay_label || ': ' || item_list,
    '; '
    order by overlay_label
  ) into v_lines
  from (
    select
      case h.attributes->>'overlay'
        when 'historic_heritage' then 'Historic heritage'
        when 'significant_ecological_area' then 'Significant ecological area'
        when 'volcanic_viewshaft' then 'Volcanic viewshaft / height sensitive area'
        when 'special_character' then 'Special character area'
        else coalesce(h.attributes->>'overlay_name', h.attributes->>'overlay')
      end as overlay_label,
      string_agg(
        coalesce(nullif(h.attributes->>'name', ''), nullif(h.attributes->>'type_name', ''), h.scenario),
        ', '
        order by h.attributes->>'name'
      ) as item_list
    from public.hazard_features h
    where h.dataset_version_id = v_dataset_version_id
      and ST_Intersects(v_parcel, h.geom)
    group by h.attributes->>'overlay', h.attributes->>'overlay_name'
  ) sub;

  return query
    select
      'planning.overlays'::text,
      'rules.v1'::text,
      'detected'::text,
      'Unitary Plan overlays apply to this section'::text,
      'The following operative Auckland Unitary Plan overlays overlap this section: ' || v_lines || '.'::text,
      'Map evidence only. This check names operative overlays from the polygon layers only. It does not establish the exact rules, activity status, or consent requirements for any overlay. The historic heritage overlay uses the extent-of-place polygons, not the place-point layer. Other overlays, precincts, designations and plan-change versions may apply. Verify with the ePlan viewer and a planner before relying on it.'::text,
      jsonb_build_array(
        jsonb_build_object('question', 'What do these overlays mean for the proposed work, and what consents or design restrictions do they trigger?', 'audience', 'planner / council'),
        jsonb_build_object('question', 'Do the overlays affect title, covenants, or any sale conditions?', 'audience', 'lawyer')
      ),
      'https://unitaryplan.aucklandcouncil.govt.nz/'::text,
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
