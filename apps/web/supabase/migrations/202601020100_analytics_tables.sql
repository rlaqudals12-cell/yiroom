-- Analytics 테이블 마이그레이션
-- SPEC-ANALYTICS.md 기반

-- 분석 이벤트 테이블
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT,  -- 비로그인 시 NULL
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_path TEXT,
  referrer TEXT,
  device_type TEXT,  -- mobile, tablet, desktop
  browser TEXT,
  os TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 세션 테이블
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  clerk_user_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  entry_page TEXT,
  exit_page TEXT,
  country TEXT
);

-- 일별 집계 테이블 (성능 최적화)
CREATE TABLE IF NOT EXISTS analytics_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  metric_type TEXT NOT NULL,  -- page_views, unique_users, feature_usage, etc.
  metric_name TEXT NOT NULL,  -- 페이지 경로 또는 기능 이름
  value INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_duration_seconds NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, metric_type, metric_name)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_page_path ON analytics_events(page_path);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON analytics_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_clerk_user_id ON analytics_sessions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON analytics_daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_metric ON analytics_daily_stats(metric_type, metric_name);

-- RLS 정책 (비로그인 사용자도 이벤트 기록 가능)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_stats ENABLE ROW LEVEL SECURITY;

-- 이벤트: 누구나 INSERT 가능, 본인 데이터만 SELECT
CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can view own analytics events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 세션: 누구나 INSERT/UPDATE 가능 (세션 종료 시)
CREATE POLICY "Anyone can insert analytics sessions"
  ON analytics_sessions FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update analytics sessions"
  ON analytics_sessions FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own analytics sessions"
  ON analytics_sessions FOR SELECT
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 일별 통계: 관리자만 접근 (service_role 사용)
CREATE POLICY "Service role full access to daily stats"
  ON analytics_daily_stats FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 코멘트
COMMENT ON TABLE analytics_events IS '사용자 행동 분석 이벤트';
COMMENT ON TABLE analytics_sessions IS '사용자 세션 정보';
COMMENT ON TABLE analytics_daily_stats IS '일별 집계 통계 (대시보드용)';
