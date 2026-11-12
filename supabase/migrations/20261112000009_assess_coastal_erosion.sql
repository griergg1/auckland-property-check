-- ST_IsValid must run only on the new version's rows. Without a materialised
-- filter, the planner can validate every hazard polygon in the database and
-- the promote statement times out.

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

  WITH hazard_rows AS MATERIALIZED (
    SELECT geom FROM public.hazard_features WHERE dataset_version_id = p_version_id
  ),
  parcel_rows AS MATERIALIZED (
    SELECT geom FROM public.parcels WHERE source_dataset_version_id = p_version_id
  )
  SELECT count(*) INTO v_invalid
  FROM (
    SELECT 1 FROM hazard_rows WHERE NOT ST_IsValid(geom)
    UNION ALL
    SELECT 1 FROM parcel_rows WHERE NOT ST_IsValid(geom)
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

-- Coastal erosion forecast lines (ASCIE Level A).
-- The source is a line, the inland edge of the forecast area, not a polygon.
-- The soonest timeframe whose line crosses the parcel is the one we report.

CREATE OR REPLACE FUNCTION public.assess_coastal_erosion(
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
  v_rank integer;
  v_scenario text;
  v_limitations text := 'This is Auckland Council''s regional forecast line for the area susceptible to coastal instability and erosion (ASCIE), under a high sea-level-rise scenario (RCP8.5). The line is the inland edge of that forecast, not a filled area and not a record of erosion that has already happened. A section between today''s coast and the line can still be inside the forecast even when the line does not cross it. Local and site-specific studies are not in this layer.';
  v_source text := 'https://www.knowledgeauckland.org.nz/publications/predicting-auckland-s-exposure-to-coastal-instability-and-erosion/';
begin
  select geom into v_parcel from public.parcels where id = p_parcel_id;
  if v_parcel is null then
    return query select
      'hazard.coastal_erosion'::text, 'rules.v1'::text, 'unavailable'::text,
      'Coastal erosion check'::text,
      'Parcel not found.'::text,
      null::text, '[]'::jsonb, null::text, null::uuid, '[]'::jsonb, null::jsonb, now(), array[p_intention]::text[];
    return;
  end if;

  select dv.id into v_dataset_version_id
  from public.dataset_versions dv
  where dv.dataset_slug = 'ac-coastal-erosion'
    and dv.status = 'active'
  order by dv.imported_at desc
  limit 1;

  if v_dataset_version_id is null then
    return query select
      'hazard.coastal_erosion'::text, 'rules.v1'::text, 'unavailable'::text,
      'Coastal erosion check'::text,
      'Coastal erosion forecast data is not available for this area.'::text,
      'This check requires Auckland Council''s Areas Susceptible to Coastal Instability and Erosion layer.'::text,
      '[]'::jsonb, null::text, null::uuid, '[]'::jsonb, null::jsonb, now(), array[p_intention]::text[];
    return;
  end if;

  select min((h.attributes->>'scenario_rank')::integer)
  into v_rank
  from public.hazard_features h
  where h.dataset_version_id = v_dataset_version_id
    and public.feature_overlaps_parcel(v_parcel, h.geom);

  if v_rank is null then
    return query select
      'hazard.coastal_erosion'::text, 'rules.v1'::text, 'not_detected'::text,
      'No coastal erosion forecast line on this section'::text,
      'None of the council''s regional coastal erosion forecast lines (2050, 2080, 2130, or 2130 with higher sea-level rise) cross this section.'::text,
      v_limitations,
      '[]'::jsonb, v_source, v_dataset_version_id, '[]'::jsonb, null::jsonb, now(), array[p_intention]::text[];
    return;
  end if;

  select h.attributes->>'Scenario'
  into v_scenario
  from public.hazard_features h
  where h.dataset_version_id = v_dataset_version_id
    and (h.attributes->>'scenario_rank')::integer = v_rank
    and public.feature_overlaps_parcel(v_parcel, h.geom)
  limit 1;

  return query
    select
      'hazard.coastal_erosion'::text,
      'rules.v1'::text,
      'detected'::text,
      'Coastal erosion forecast: ' || coalesce(v_scenario, 'line crosses this section'),
      'Auckland Council''s regional forecast line for coastal instability and erosion crosses this section. The soonest line that does so is ' || coalesce(v_scenario, 'one of the mapped timeframes') || '. This is a forecast of where the shoreline or cliff could move, not proof the land has already eroded.'::text,
      v_limitations,
      '[]'::jsonb,
      v_source,
      v_dataset_version_id,
      coalesce((
        select jsonb_agg(h.source_feature_id)
        from public.hazard_features h
        where h.dataset_version_id = v_dataset_version_id
          and (h.attributes->>'scenario_rank')::integer = v_rank
          and public.feature_overlaps_parcel(v_parcel, h.geom)
      ), '[]'::jsonb),
      (
        select ST_AsGeoJSON(ST_Transform(ST_Union(ST_Intersection(v_parcel, h.geom)), 4326))::jsonb
        from public.hazard_features h
        where h.dataset_version_id = v_dataset_version_id
          and (h.attributes->>'scenario_rank')::integer = v_rank
          and public.feature_overlaps_parcel(v_parcel, h.geom)
      ),
      now(),
      array[p_intention]::text[];
end;
$function$;

GRANT EXECUTE ON FUNCTION public.assess_coastal_erosion(uuid, text) TO anon, authenticated, service_role;

-- Questions for a buyer of a house, or a buyer of an empty section.
-- Renovate, extend, and add-a-dwelling are no longer separate questions.
-- A house buyer still hears about a flood path or a landslide. The wording
-- is "before you offer", not "for the renovation".
CREATE OR REPLACE FUNCTION public.generate_questions(
  p_run_id uuid,
  p_intention text DEFAULT 'live'::text
)
RETURNS TABLE(audience text, question text, check_id text, rationale text)
LANGUAGE plpgsql
STABLE
AS $function$
declare
  v_int text := coalesce(p_intention, 'live');
begin
  return query
    with f as (
      select fi.check_id as chk_id, fi.status as st, fi.title as ttl, fi.explanation as expl
      from public.findings fi
      where fi.run_id = p_run_id
    )
    select 'builder / drainlayer',
      case when v_int = 'vacant_build'
        then 'An overland flow path crosses this section. Before you buy it to build on, ask where a house can sit clear of the path, and what drainage a new build needs.'
        else 'An overland flow path crosses this section. Before you offer on the house, ask what that has meant for this property and what the LIM says about it.'
      end,
      f.chk_id,
      'overland flow path detected on the section'
    from f
    where f.chk_id = 'hazard.overland_flow' and f.st = 'detected'
    union all
    select 'council (LIM)',
      'Order a LIM from Auckland Council and confirm whether the overland flow path is listed on it. The LIM is the official record; this map is a screen, not a substitute.',
      f.chk_id,
      'overland flow path detected — confirm on the LIM'
    from f
    where f.chk_id = 'hazard.overland_flow' and f.st = 'detected'
    union all
    select 'builder',
      case when v_int = 'vacant_build'
        then 'A flood-prone area is mapped on this section. Before you buy it to build on, ask where the house should sit and how the drainage should be designed.'
        else 'A flood-prone area is mapped on this section. Before you offer on the house, ask whether it has flooded and what the LIM records.'
      end,
      f.chk_id,
      'flood prone area detected on the section'
    from f
    where f.chk_id = 'hazard.flood_prone' and f.st = 'detected'
    union all
    select 'insurer',
      'The council map shows a flood-prone area on this section. How does this affect building insurance and what evidence does the insurer need?',
      f.chk_id,
      'flood prone area detected — insurance question'
    from f
    where f.chk_id = 'hazard.flood_prone' and f.st = 'detected'
    union all
    select 'insurer',
      'The council map shows coastal storm-tide inundation (1% AEP, present-day sea level) on this section. How does this affect building insurance, and what will the insurer require for floor levels or flood defenses?',
      f.chk_id,
      'coastal inundation detected — insurance question'
    from f
    where f.chk_id = 'hazard.coastal_inundation' and f.st = 'detected'
    union all
    select 'council (LIM)',
      'Order a LIM and confirm the coastal storm-tide mapping and any sea-level-rise scenarios that apply. The LIM is the official record.',
      f.chk_id,
      'coastal inundation detected — confirm on the LIM'
    from f
    where f.chk_id = 'hazard.coastal_inundation' and f.st = 'detected'
    union all
    select 'council / LIM',
      case when v_int = 'vacant_build'
        then 'The council''s ' || f.ttl || ' crosses this section. Before you build, ask where a house can sit relative to that forecast line and what setback applies. The line is the inland edge of a forecast, not a filled area.'
        else 'The council''s ' || f.ttl || ' crosses this section. Before you offer, ask what that forecast means for this property and whether the LIM records coastal erosion.'
      end,
      f.chk_id,
      'coastal erosion forecast line crosses the section'
    from f
    where f.chk_id = 'hazard.coastal_erosion' and f.st = 'detected'
    union all
    select 'geotechnical engineer',
      case when v_int = 'vacant_build'
        then 'Mapped landslide susceptibility covers this section. What geotechnical assessment do you need before you build?'
        else 'Mapped landslide susceptibility covers this section. Before you offer, ask whether a geotech report already exists for the house, and whether that should change the price.'
      end,
      f.chk_id,
      'landslide susceptibility detected — ask a geotechnical engineer'
    from f
    where f.chk_id = 'hazard.landslide_susceptibility' and f.st = 'detected'
    union all
    select 'council / LIM',
      'The council map shows mapped landslide susceptibility on this section. Order a LIM and ask council whether there is a record of past landslides or geotechnical reports for this property or the immediate neighbourhood.',
      f.chk_id,
      'landslide susceptibility detected — confirm on the LIM'
    from f
    where f.chk_id = 'hazard.landslide_susceptibility' and f.st = 'detected'
    union all
    select 'planner / council',
      case when v_int = 'vacant_build'
        then 'The section is in ' || f.ttl || '. You are buying land to build on. What can this zone take as a new house, and what consents does that need?'
        else 'The section is in ' || f.ttl || '. You are buying the house. What is already allowed here, and what would need consent if you later changed it?'
      end,
      f.chk_id,
      'zone detected — activity status depends on the zone and the work'
    from f
    where f.chk_id = 'planning.zone' and f.st = 'detected'
    union all
    select 'planner / council',
      'The following Unitary Plan overlays were detected on this section: ' || f.expl || '. Before you offer, ask what they stop you doing, and what consents they trigger.',
      f.chk_id,
      'overlays detected — ask the planner'
    from f
    where f.chk_id = 'planning.overlays' and f.st = 'detected'
    union all
    select 'planner / council',
      'No operative Unitary Plan overlays (historic heritage, significant ecological areas, volcanic viewshafts, special character) were detected on this section. Do any other overlays, precincts, or designations apply that are not covered by this check?',
      f.chk_id,
      'no overlays detected — confirm other layers'
    from f
    where f.chk_id = 'planning.overlays' and f.st = 'not_detected'
    union all
    select 'school / MoE',
      'The section is inside the enrolment home zone(s) listed above. Confirm with each school that the address qualifies for in-zone enrolment, and ask what proof of address they need.',
      f.chk_id,
      'in-zone — confirm enrolment eligibility'
    from f
    where f.chk_id = 'neighbourhood.school_zones' and f.st = 'detected'
    union all
    select 'school / MoE',
      'No mapped enrolment home zone contains this section. That may mean the nearest schools don''t have enrolment schemes, or that the school you want is out-of-zone. Ask the school about ballot order and the likelihood of an out-of-zone place.',
      f.chk_id,
      'no in-zone school — ask about out-of-zone ballot'
    from f
    where f.chk_id = 'neighbourhood.school_zones' and f.st = 'not_detected'
    union all
    select 'bank / mortgage adviser',
      'The council rating valuation (CV, land value, improvement value) and annual rates are shown on the report header. How does the CV compare to the asking price, and what does the bank use for the loan-to-value calculation?',
      f.chk_id,
      'CV available — compare to asking price'
    from f
    where f.chk_id = 'value.rating_valuation' and f.st = 'detected'
    union all
    select 'lawyer',
      'The annual council rates are shown on the report. Confirm with the lawyer whether there are any rates arrears or targeted rates that transfer with the property.',
      f.chk_id,
      'rates shown — check for arrears'
    from f
    where f.chk_id = 'value.rating_valuation' and f.st = 'detected'
    union all
    select 'council',
      'We couldn''t pull the council rating valuation for this address. Order a property file from Auckland Council to confirm the valuation, the rates, and any arrears before you commit.',
      f.chk_id,
      'RV unavailable — order a property file'
    from f
    where f.chk_id = 'value.rating_valuation' and f.st = 'unavailable'
    order by 1, 2;
end;
$function$;
