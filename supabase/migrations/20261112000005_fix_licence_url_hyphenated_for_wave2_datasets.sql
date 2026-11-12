-- Fix the stored licence_url for the two Wave 2 datasets. Their first-run
-- scripts wrote the broken `user-licence-aucklandcouncil-open-data.html`
-- URL (no hyphen between "auckland" and "council"), while every other importer
-- uses the hyphenated `user-licence-auckland-council-open-data.html`. The
-- hyphenated form is the canonical URL (verified via web search). The script
-- source has also been fixed so new imports write the correct URL.
UPDATE public.datasets
SET licence_url = 'https://www.aucklandcouncil.govt.nz/en/geospatial/council-open-data/user-licence-auckland-council-open-data.html'
WHERE slug IN ('ac-landslide-susceptibility','ac-unitary-plan-overlays')
  AND licence_url = 'https://www.aucklandcouncil.govt.nz/en/geospatial/council-open-data/user-licence-aucklandcouncil-open-data.html';
