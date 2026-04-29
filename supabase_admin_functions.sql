-- Binder admin dashboard functions
-- Run in Supabase SQL editor: https://supabase.com/dashboard/project/nbiwbvqbtyqvuzaklvcx/sql
-- These are SECURITY DEFINER — they bypass RLS and aggregate across all users.
-- The only access control is the password gate in admin.html.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_users',       (SELECT COUNT(*) FROM profiles),
    'total_signals',     (SELECT COUNT(*) FROM user_signals),
    'total_likes',       (SELECT COUNT(*) FROM user_likes),
    'total_surveys',     (SELECT COUNT(*) FROM feed_surveys),
    'dau_today',         (SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE date = CURRENT_DATE),
    'dau_yesterday',     (SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE date = CURRENT_DATE - 1),
    'avg_completion_7d', ROUND(
      COALESCE(
        (SELECT AVG(cards_completed::float / NULLIF(cards_seen, 0))
         FROM user_sessions
         WHERE date >= CURRENT_DATE - 7 AND cards_seen > 0),
        0
      )::numeric, 3
    )
  );
$$;

CREATE OR REPLACE FUNCTION admin_dau_table()
RETURNS TABLE(
  day            date,
  dau            bigint,
  avg_completion numeric,
  total_expands  bigint,
  total_clicks   bigint,
  total_likes    bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    date AS day,
    COUNT(DISTINCT user_id) AS dau,
    ROUND(AVG(CASE WHEN cards_seen > 0
                   THEN cards_completed::float / cards_seen END)::numeric, 2) AS avg_completion,
    SUM(expands)       AS total_expands,
    SUM(article_clicks) AS total_clicks,
    SUM(likes)         AS total_likes
  FROM user_sessions
  WHERE date >= CURRENT_DATE - 29
  GROUP BY date
  ORDER BY date DESC;
$$;

CREATE OR REPLACE FUNCTION admin_top_liked(n int DEFAULT 10)
RETURNS TABLE(
  url        text,
  insight    text,
  source     text,
  channel    text,
  like_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ul.card_url AS url,
    c.insight,
    c.source,
    c.channel,
    COUNT(*) AS like_count
  FROM user_likes ul
  LEFT JOIN cards c ON c.url = ul.card_url
  GROUP BY ul.card_url, c.insight, c.source, c.channel
  ORDER BY like_count DESC
  LIMIT n;
$$;

CREATE OR REPLACE FUNCTION admin_survey_breakdown()
RETURNS TABLE(response text, count bigint, pct numeric)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH totals AS (SELECT COUNT(*) AS total FROM feed_surveys)
  SELECT
    response,
    COUNT(*) AS count,
    ROUND(COUNT(*)::numeric / NULLIF((SELECT total FROM totals), 0) * 100, 1) AS pct
  FROM feed_surveys
  GROUP BY response
  ORDER BY count DESC;
$$;

-- Grant execute to anon so the frontend can call these via the anon key
GRANT EXECUTE ON FUNCTION admin_stats()              TO anon;
GRANT EXECUTE ON FUNCTION admin_dau_table()          TO anon;
GRANT EXECUTE ON FUNCTION admin_top_liked(int)       TO anon;
GRANT EXECUTE ON FUNCTION admin_survey_breakdown()   TO anon;
