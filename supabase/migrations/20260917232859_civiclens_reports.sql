-- Apply only to a dedicated CivicLens project. Fails safely if reports already exists.
begin;
create table public.reports (
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(title) between 5 and 120),
 description text not null check(char_length(description) between 15 and 3000),
 image_path text,
 category text not null check(category in ('road_damage','streetlight','garbage','water_leakage','drainage','public_facility','other')),
 severity text not null check(severity in ('low','medium','high','critical')),
 ai_summary text not null check(char_length(ai_summary) between 10 and 500),
 ai_reasoning text not null check(char_length(ai_reasoning) between 10 and 1500),
 analysis_source text not null check(analysis_source in ('vision','mock','fallback')),
 area text not null check(char_length(area) between 2 and 100),
 area_key text not null,
 latitude double precision check(latitude between -90 and 90),
 longitude double precision check(longitude between -180 and 180),
 status text not null default 'reported' check(status in ('reported','under_review','in_progress','resolved')),
 risk_score smallint not null check(risk_score between 0 and 100),
 related_count integer not null default 1 check(related_count >= 1),
 is_demo boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check((latitude is null) = (longitude is null)),
 check(image_path is null or image_path = 'reports/' || id::text || '/photo.webp')
);
comment on column public.reports.risk_score is 'Score snapshot at submission. API recalculates current score from all reports on reads.';
comment on column public.reports.related_count is 'Snapshot count INCLUDING this report. Related means same category and normalized area, unresolved in preceding seven days.';
alter table public.reports enable row level security;
-- Browser never queries Supabase directly. No anon/authenticated policies or grants.
revoke all on public.reports from public, anon, authenticated;
grant select, insert, update on public.reports to service_role;
create index reports_related_idx on public.reports(category,area_key,created_at desc) where status <> 'resolved';
create index reports_status_idx on public.reports(status);
create index reports_severity_idx on public.reports(severity);
create index reports_created_at_idx on public.reports(created_at desc);
create index reports_risk_idx on public.reports(risk_score desc);
create function public.civiclens_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
revoke all on function public.civiclens_updated_at() from public, anon, authenticated;
create trigger reports_updated_at before update on public.reports for each row execute function public.civiclens_updated_at();
-- Private bucket. Only service role can upload; public API issues time-limited read URLs.
-- Never overwrite an existing bucket's configuration.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('report-images','report-images',false,5242880,array['image/webp']);
commit;
