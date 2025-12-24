-- ============================================================
-- 웰니스 스코어 테이블
-- Phase H Sprint 2: 통합 건강 점수 시스템
-- ============================================================

-- 1. wellness_scores 테이블
CREATE TABLE IF NOT EXISTS wellness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- 점수 (0-100)
  total_score INTEGER CHECK (total_score >= 0 AND total_score <= 100),
  workout_score INTEGER CHECK (workout_score >= 0 AND workout_score <= 25),
  nutrition_score INTEGER CHECK (nutrition_score >= 0 AND nutrition_score <= 25),
  skin_score INTEGER CHECK (skin_score >= 0 AND skin_score <= 25),
  body_score INTEGER CHECK (body_score >= 0 AND body_score <= 25),

  -- 상세 점수 (JSONB)
  score_breakdown JSONB DEFAULT '{}',
  -- 예: {
  --   "workout": { "streak": 10, "frequency": 8, "goal": 5 },
  --   "nutrition": { "calorie": 10, "balance": 8, "water": 5 },
  --   "skin": { "analysis": 10, "routine": 8, "matching": 5 },
  --   "body": { "analysis": 10, "progress": 8, "workout": 5 }
  -- }

  -- 인사이트 (AI 생성)
  insights JSONB DEFAULT '[]',
  -- 예: [
  --   { "type": "improvement", "area": "nutrition", "message": "단백질 섭취를 늘려보세요" },
  --   { "type": "achievement", "area": "workout", "message": "운동 스트릭 7일 달성!" }
  -- ]

  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 동일 날짜 중복 방지
  CONSTRAINT unique_user_date_wellness UNIQUE (clerk_user_id, date)
);

-- ============================================================
-- RLS 정책
-- ============================================================

ALTER TABLE wellness_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wellness scores"
  ON wellness_scores FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own wellness scores"
  ON wellness_scores FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own wellness scores"
  ON wellness_scores FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================================
-- 인덱스
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_wellness_scores_user ON wellness_scores(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_scores_date ON wellness_scores(date DESC);
CREATE INDEX IF NOT EXISTS idx_wellness_scores_user_date ON wellness_scores(clerk_user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_wellness_scores_total ON wellness_scores(total_score DESC);

-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION update_wellness_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_wellness_scores_updated_at ON wellness_scores;
CREATE TRIGGER trigger_wellness_scores_updated_at
  BEFORE UPDATE ON wellness_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_wellness_scores_updated_at();
