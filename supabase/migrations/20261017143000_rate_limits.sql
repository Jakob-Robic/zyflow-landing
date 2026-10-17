-- Shared rate limiter for /api/contact and /api/waitlist.
--
-- DO NOT apply from CI or this pull request. Apply in the Supabase SQL
-- editor (or `supabase db push`) on the live project BEFORE merging.
-- Until this function exists, form endpoints fail closed with 503.
--
-- App windows (enforced by api/_lib/rate-limit.js, passed as p_max /
-- p_window_seconds):
--   IP:    5 requests per 10 minutes, per endpoint
--   email: 3 requests per 1 hour, per endpoint
-- Keys are SHA-256 hashes (IP or normalized email + server-side salt).
-- The table stores no raw IP addresses or email addresses.
--
-- Cleanup: this function deletes expired rows (this key + a bounded
-- global sweep). Optional pg_cron if you want a scheduled vacuum:
--
--   select cron.schedule(
--     'cleanup-rate-limits',
--     '*/15 * * * *',
--     $$delete from public.rate_limits
--       where window_start < now() - interval '2 hours'$$
--   );

CREATE TABLE IF NOT EXISTS public.rate_limits (
  rate_key text NOT NULL,
  window_start timestamptz NOT NULL,
  hit_count integer NOT NULL DEFAULT 1 CHECK (hit_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (rate_key, window_start)
);

CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx
  ON public.rate_limits (window_start);

COMMENT ON TABLE public.rate_limits IS
  'Fixed-window counters for public form endpoints. Keys are hashes; no raw IP or email.';

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: anon/authenticated cannot SELECT/INSERT/UPDATE/DELETE.
-- service_role bypasses RLS; the SECURITY DEFINER function writes as owner.

REVOKE ALL ON TABLE public.rate_limits FROM PUBLIC;
REVOKE ALL ON TABLE public.rate_limits FROM anon;
REVOKE ALL ON TABLE public.rate_limits FROM authenticated;
GRANT ALL ON TABLE public.rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_key text,
  p_max integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_epoch bigint;
  v_window_start timestamptz;
  v_count integer;
  v_retry integer;
BEGIN
  IF p_key IS NULL OR length(p_key) = 0
     OR p_max IS NULL OR p_max < 1
     OR p_window_seconds IS NULL OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'invalid rate limit arguments';
  END IF;

  v_epoch := (floor(extract(epoch FROM v_now) / p_window_seconds) * p_window_seconds)::bigint;
  v_window_start := to_timestamp(v_epoch);

  DELETE FROM public.rate_limits
  WHERE rate_key = p_key
    AND window_start < v_window_start;

  DELETE FROM public.rate_limits
  WHERE ctid IN (
    SELECT ctid
    FROM public.rate_limits
    WHERE window_start < v_now - interval '2 hours'
    LIMIT 50
  );

  INSERT INTO public.rate_limits (rate_key, window_start, hit_count, updated_at)
  VALUES (p_key, v_window_start, 1, v_now)
  ON CONFLICT (rate_key, window_start)
  DO UPDATE SET
    hit_count = public.rate_limits.hit_count + 1,
    updated_at = EXCLUDED.updated_at
  RETURNING hit_count INTO v_count;

  v_retry := GREATEST(1, p_window_seconds - ((extract(epoch FROM v_now)::bigint) - v_epoch));

  RETURN jsonb_build_object(
    'allowed', v_count <= p_max,
    'count', v_count,
    'retry_after_seconds', v_retry
  );
END;
$$;

COMMENT ON FUNCTION public.check_and_increment_rate_limit(text, integer, integer) IS
  'Atomic fixed-window check-and-increment. Executable only by service_role.';

REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit(text, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit(text, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(text, integer, integer) TO service_role;
