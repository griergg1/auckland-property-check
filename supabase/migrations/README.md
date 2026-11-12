# Supabase migrations

These are SQL migrations captured from the live `auckland-property-check`
Supabase project so the schema and RPCs live in-repo, not only in the dashboard.

Older migrations (`20261101…` and `20261102…`) were applied through the
Supabase dashboard / MCP and are listed in `supabase migration list`. This
folder currently captures the Wave 2 changes that were applied without
checked-in SQL:

| File | What it does |
|------|--------------|
| `20261112000001_rewrite_insert_hazard_geojson_bulk.sql` | Rewrite `insert_hazard_geojson` from a per-row loop to a set-based `INSERT ... SELECT` so large pages fit inside the Postgres statement timeout. Behaviour is unchanged (SRID 2193, multi-geometry pass-through, invalid geom throws, nullable `dataset_version_id`). |
| `20261112000002_assess_landslide_susceptibility.sql` | `assess_landslide_susceptibility` RPC — reads `ac-landslide-susceptibility` and returns the highest category category found on the parcel. |
| `20261112000003_assess_unitary_plan_overlays.sql` | `assess_unitary_plan_overlays` RPC — reads `ac-unitary-plan-overlays` and groups matching overlays by overlay type. The `source_url` is always the hardcoded ePlan URL — `DocumentURL` from the remote feed is never passed through. |
| `20261112000004_generate_questions_overlays_landslide.sql` | Add landslide-susceptibility and overlays rules to `generate_questions`. |
| `20261112000005_fix_licence_url_hyphenated_for_wave2_datasets.sql` | Point the two Wave 2 dataset rows at the hyphenated Auckland Council open-data licence URL. |
| `20261112000006_assessment_run_address_label.sql` | Store the searched address on `assessment_runs` so the report can name the property. Applied on the live project. |

These files are **not** a bootstrap set for a fresh project. The baseline schema
(`public.parcels`, `public.hazard_features`, `public.dataset_versions`,
`public.datasets`, the earlier `assess_*` RPCs, anon RLS policies) lives in
the earlier `20261101…` and `20261102…` migrations listed in the Supabase
dashboard and `supabase migration list` on the live project, and was never
checked into this repo. Running only the files here against a blank Postgres
will fail — the RPCs expect tables these files don't create.

For the live project they were applied through the Supabase MCP / dashboard;
these files exist so the diffs are reviewable in-repo. To move them into a new
project, first recreate the baseline schema (or restore a dump of the live
database), then apply these in order via `supabase db push` or the SQL editor.
The `insert_hazard_geojson` rewrite is a compatible drop-in for every existing
importer: verify by re-running one of the already-active importers against a
staging / rolled-back copy of the DB and confirming the resulting
`hazard_features` row shape (SRID, geometry type, attributes) matches before
flipping production.
