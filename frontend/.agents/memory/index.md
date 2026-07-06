# Project Memory

## Core
App = Zrunva Health Passport (longitudinal patient record). PHI-sensitive.
All app routes live under `src/routes/_authenticated/`. Only public route is `/auth`.
Roles stored in `public.user_roles` (enum: patient/clinician/admin). Check via `has_role()`, never via profile columns.
