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
