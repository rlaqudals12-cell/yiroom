-- M-1 정신건강 트래킹 테이블
-- 스트레스/수면/기분 일일 트래킹

CREATE TABLE mental_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  log_date DATE NOT NULL,
  mood_score SMALLINT CHECK (mood_score BETWEEN 1 AND 5),
  stress_level SMALLINT CHECK (stress_level BETWEEN 1 AND 10),
  sleep_hours DECIMAL(3,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  sleep_quality SMALLINT CHECK (sleep_quality BETWEEN 1 AND 5),
  energy_level SMALLINT CHECK (energy_level BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 동일 사용자/날짜 중복 방지
  UNIQUE (clerk_user_id, log_date)
);

-- 인덱스
CREATE INDEX idx_mental_health_logs_user ON mental_health_logs(clerk_user_id);
CREATE INDEX idx_mental_health_logs_date ON mental_health_logs(log_date);
CREATE INDEX idx_mental_health_logs_user_date ON mental_health_logs(clerk_user_id, log_date);

-- RLS 활성화
ALTER TABLE mental_health_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 데이터만 조회/수정 가능
CREATE POLICY "Users can view own mental health logs"
  ON mental_health_logs FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own mental health logs"
  ON mental_health_logs FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own mental health logs"
  ON mental_health_logs FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own mental health logs"
  ON mental_health_logs FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 서비스 역할 전체 접근
CREATE POLICY "Service role has full access to mental health logs"
  ON mental_health_logs FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE mental_health_logs IS 'M-1 정신건강 트래킹 - 일일 체크인 기록';
