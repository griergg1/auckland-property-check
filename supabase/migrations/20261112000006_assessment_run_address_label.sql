-- Keep the searched address on the run so the report can name the property
-- and show its size even when the council rating valuation does not come back.
ALTER TABLE public.assessment_runs
  ADD COLUMN IF NOT EXISTS address_label text;
