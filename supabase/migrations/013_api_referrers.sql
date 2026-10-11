-- Migration 013: api_referrers
--
-- Which external sites use the free color-match API, the MCP tool and the
-- embeddable widget, and whether they credit PaintColorHQ. Free use requires a
-- visible link to https://www.paintcolorhq.com (stated on /api and /embed).
--
-- Written by the server routes through log_api_referrer() (service role, via
-- src/lib/referrer-log.ts): one row per (kind, page URL), hits incremented on
-- each logged request. Read and updated by scripts/check-attribution.ts, which
-- fetches each page and records has_credit / check_note / last_checked.
--
-- Access: RLS is on with NO policies, so anon and authenticated cannot read or
-- write. The RPC is SECURITY DEFINER and executable by service_role only.
--
-- Apply BEFORE merging the code that calls the RPC. Until then the call fails
-- inside supabase-js (returned error, never thrown) and nothing is logged.

BEGIN;

CREATE TABLE IF NOT EXISTS api_referrers (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind          text NOT NULL CHECK (kind IN ('api', 'embed', 'mcp')),
  referrer_url  text NOT NULL CHECK (char_length(referrer_url) <= 500),
  referrer_host text NOT NULL,
  first_seen    timestamptz NOT NULL DEFAULT now(),
  last_seen     timestamptz NOT NULL DEFAULT now(),
  hits          bigint NOT NULL DEFAULT 1,
  last_checked  timestamptz,
  has_credit    boolean,
  check_note    text,
  CONSTRAINT api_referrers_kind_url_key UNIQUE (kind, referrer_url)
);

COMMENT ON TABLE api_referrers IS
  'External pages using the free API / MCP / embed, with attribution check results. Service role only. See migration 013 and scripts/check-attribution.ts.';

ALTER TABLE api_referrers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON api_referrers FROM anon, authenticated;

CREATE OR REPLACE FUNCTION log_api_referrer(p_kind text, p_url text, p_host text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_url IS NULL OR p_host IS NULL OR p_url = '' OR p_host = '' THEN
    RETURN;
  END IF;
  INSERT INTO api_referrers (kind, referrer_url, referrer_host)
  VALUES (p_kind, left(p_url, 500), left(p_host, 255))
  ON CONFLICT (kind, referrer_url) DO UPDATE
    SET hits = api_referrers.hits + 1,
        last_seen = now();
END;
$$;

-- Postgres grants EXECUTE to PUBLIC by default and Supabase adds anon and
-- authenticated through default privileges; remove all three.
REVOKE ALL ON FUNCTION log_api_referrer(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION log_api_referrer(text, text, text) TO service_role;

COMMIT;
