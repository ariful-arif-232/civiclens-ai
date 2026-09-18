-- Dedicated CivicLens database only. Never apply to either existing Supabase project.
CREATE TABLE IF NOT EXISTS public.civiclens_migrations (
  version text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 120),
  description text NOT NULL CHECK (char_length(description) BETWEEN 15 AND 3000),
  image_path text,
  image_url text CHECK (image_url IS NULL OR image_url ~ '^https://res[.]cloudinary[.]com/[A-Za-z0-9_-]+/image/upload/'),
  category text NOT NULL CHECK (category IN ('road_damage','streetlight','garbage','water_leakage','drainage','public_facility','other')),
  severity text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  ai_summary text NOT NULL CHECK (char_length(ai_summary) BETWEEN 10 AND 500),
  ai_reasoning text NOT NULL CHECK (char_length(ai_reasoning) BETWEEN 10 AND 1500),
  analysis_source text NOT NULL CHECK (analysis_source IN ('vision','mock','fallback')),
  area text NOT NULL CHECK (char_length(area) BETWEEN 2 AND 100),
  area_key text NOT NULL,
  latitude double precision CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision CHECK (longitude BETWEEN -180 AND 180),
  status text NOT NULL DEFAULT 'reported' CHECK (status IN ('reported','under_review','in_progress','resolved')),
  risk_score smallint NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  related_count integer NOT NULL DEFAULT 1 CHECK (related_count >= 1),
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((latitude IS NULL) = (longitude IS NULL)),
  CHECK (image_path IS NULL OR is_demo OR image_path = 'civiclens-ai/reports/' || id::text),
  CHECK (analysis_source <> 'mock' OR is_demo)
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS public.civiclens_rate_limits (
  key text NOT NULL, window_start timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts >= 1), PRIMARY KEY (key,window_start)
);
-- statement-breakpoint
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
ALTER TABLE public.civiclens_rate_limits ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
ALTER TABLE public.civiclens_migrations ENABLE ROW LEVEL SECURITY;
-- statement-breakpoint
REVOKE ALL ON public.reports, public.civiclens_rate_limits, public.civiclens_migrations FROM PUBLIC;
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS reports_related_idx ON public.reports(category,area_key,created_at DESC) WHERE status <> 'resolved';
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS reports_severity_idx ON public.reports(severity);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON public.reports(created_at DESC);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS reports_risk_idx ON public.reports(risk_score DESC);
-- statement-breakpoint
CREATE OR REPLACE FUNCTION public.civiclens_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
    (OLD.status='reported' AND NEW.status='under_review') OR
    (OLD.status='under_review' AND NEW.status IN ('reported','in_progress')) OR
    (OLD.status='in_progress' AND NEW.status IN ('under_review','resolved')) OR
    (OLD.status='resolved' AND NEW.status='under_review')
  ) THEN RAISE EXCEPTION 'Invalid report status transition' USING ERRCODE='23514'; END IF;
  NEW.updated_at = clock_timestamp(); RETURN NEW;
END; $$;
-- statement-breakpoint
REVOKE ALL ON FUNCTION public.civiclens_updated_at() FROM PUBLIC;
-- statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='reports_updated_at' AND tgrelid='public.reports'::regclass)
  THEN CREATE TRIGGER reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.civiclens_updated_at(); END IF;
END $$;
-- statement-breakpoint
COMMENT ON COLUMN public.reports.risk_score IS 'Submission snapshot, not a calibrated probability. Current values are recomputed from severity, related report count and recency on reads.';
-- statement-breakpoint
COMMENT ON COLUMN public.reports.related_count IS 'Includes this report. Same category and normalized area; unresolved reports from preceding seven days. Not verified duplicates.';
