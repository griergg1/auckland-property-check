-- Update generate_questions to add rules for the two Wave 2 checks:
--   * hazard.landslide_susceptibility (detected → geotechnical engineer; always → council/LIM)
--   * planning.overlays (detected → planner/council + lawyer; not_detected → confirm other layers)
--
-- Keeps the ordinal ORDER BY 1, 2 from the previous version to avoid the
-- ambiguous-column bug between the function's output `check_id` and the CTE's
-- `f.check_id` (fixed by aliasing to chk_id / st / ttl / expl).
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
      'The council map shows an overland flow path crossing this section. How does that affect the drainage design for the work you''re planning, and where on the section should it sit to avoid ponding?',
      f.chk_id,
      'overland flow path detected on the section'
    from f
    where f.chk_id = 'hazard.overland_flow' and f.st = 'detected'
    and v_int in ('renovate','extend','add_dwelling','vacant_build')
    union all
    select 'council (LIM)',
      'Order a LIM from Auckland Council and confirm whether the overland flow path is listed on it. The LIM is the official record; this map is a screen, not a substitute.',
      f.chk_id,
      'overland flow path detected — confirm on the LIM'
    from f
    where f.chk_id = 'hazard.overland_flow' and f.st = 'detected'
    union all
    select 'builder',
      'The council map shows a flood-prone area (potential ponding from topography, assuming a blocked outlet) on this section. Where on the section should the work sit to avoid it, and how should the drainage be designed?',
      f.chk_id,
      'flood prone area detected on the section'
    from f
    where f.chk_id = 'hazard.flood_prone' and f.st = 'detected'
    and v_int in ('renovate','extend','add_dwelling','vacant_build')
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
    select 'geotechnical engineer',
      'Mapped large-scale landslide susceptibility overlaps this section. What site-specific geotechnical assessment is needed before building, extending, or doing earthworks here?',
      f.chk_id,
      'landslide susceptibility detected — ask a geotechnical engineer'
    from f
    where f.chk_id = 'hazard.landslide_susceptibility' and f.st = 'detected'
    and v_int in ('renovate','extend','add_dwelling','vacant_build')
    union all
    select 'council / LIM',
      'The council map shows mapped landslide susceptibility on this section. Order a LIM and ask council whether there is a record of past landslides or geotechnical reports for this property or the immediate neighbourhood.',
      f.chk_id,
      'landslide susceptibility detected — confirm on the LIM'
    from f
    where f.chk_id = 'hazard.landslide_susceptibility' and f.st = 'detected'
    union all
    select 'planner / council',
      case v_int
        when 'extend' then 'The section is in ' || f.ttl || '. What activity status does an extension have under this zone, and do any height-in-relation-to-boundary or recession-plane rules limit where it can sit?'
        when 'add_dwelling' then 'The section is in ' || f.ttl || '. Does this zone allow a second dwelling as of right, or does it need resource consent? What density rules apply?'
        when 'renovate' then 'The section is in ' || f.ttl || '. What alterations are permitted as of right under this zone, and what needs consent?'
        when 'vacant_build' then 'The section is in ' || f.ttl || '. What does this zone permit on a vacant section, and what consents does a new build need?'
        else 'The section is in ' || f.ttl || '. What does this zone allow, and what would need consent?'
      end,
      f.chk_id,
      'zone detected — activity status depends on the zone and the work'
    from f
    where f.chk_id = 'planning.zone' and f.st = 'detected'
    union all
    select 'planner / council',
      'The following Unitary Plan overlays were detected on this section: ' || f.expl || '. What do they mean for the proposed work, and what consents or design restrictions do they trigger?',
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
