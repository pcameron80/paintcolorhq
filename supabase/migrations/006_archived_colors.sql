-- Manufacturers discontinue colors but people keep searching for them — and
-- "my color is discontinued, what's the closest current equivalent?" is the
-- core matcher use case. Archived colors stay in the catalog as match
-- SOURCES but are excluded as match TARGETS (compute-matches), so we never
-- recommend a paint nobody can buy. First populated from the 2026-06 drift
-- scan: Sherwin-Williams' 220 archived historic colors and Farrow & Ball's
-- Archive collection.
alter table colors add column if not exists is_archived boolean not null default false;
