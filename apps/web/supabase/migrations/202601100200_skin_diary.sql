-- 피부 다이어리 시스템 (Phase 3)
-- 일일 컨디션 + 생활 요인 기록 + AI 상관관계 분석

-- ============================================
-- 피부 다이어리 엔트리 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS skin_diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  entry_date DATE NOT NULL,

  -- 컨디션 기록
  skin_condition INTEGER CHECK (skin_condition BETWEEN 1 AND 5), -- 1: 매우 나쁨, 5: 매우 좋음
  condition_notes TEXT,

  -- 생활 요인
  sleep_hours DECIMAL(3,1),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  water_intake_ml INTEGER,
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),

  -- 외부 요인
  weather TEXT CHECK (weather IN ('sunny', 'cloudy', 'rainy', 'cold', 'hot', 'humid', 'dry')),
  outdoor_hours DECIMAL(3,1),

  -- 스킨케어
  morning_routine_completed BOOLEAN DEFAULT false,
  evening_routine_completed BOOLEAN DEFAULT false,
  special_treatments TEXT[], -- ["시트마스크", "필링", "에센스 집중케어"]

  -- AI 연관 분석 (분석 후 업데이트)
  ai_correlation_score INTEGER CHECK (ai_correlation_score BETWEEN 0 AND 100),
  ai_insights JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_skin_diary_user FOREIGN KEY (clerk_user_id)
    REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  CONSTRAINT unique_skin_diary_user_date UNIQUE (clerk_user_id, entry_date)
);

-- ============================================
-- 인덱스
-- ============================================

CREATE INDEX IF NOT EXISTS idx_skin_diary_user_date
  ON skin_diary_entries(clerk_user_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_skin_diary_condition
  ON skin_diary_entries(clerk_user_id, skin_condition);

-- ============================================
-- RLS 정책
-- ============================================

ALTER TABLE skin_diary_entries ENABLE ROW LEVEL SECURITY;

-- 자신의 다이어리만 조회 가능
CREATE POLICY "Users can view own skin diary" ON skin_diary_entries
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 자신의 다이어리만 생성 가능
CREATE POLICY "Users can insert own skin diary" ON skin_diary_entries
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- 자신의 다이어리만 수정 가능
CREATE POLICY "Users can update own skin diary" ON skin_diary_entries
  FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 자신의 다이어리만 삭제 가능
CREATE POLICY "Users can delete own skin diary" ON skin_diary_entries
  FOR DELETE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- ============================================
-- 업데이트 트리거 (updated_at 자동 갱신)
-- ============================================

CREATE OR REPLACE FUNCTION update_skin_diary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_skin_diary_updated_at ON skin_diary_entries;
CREATE TRIGGER trigger_skin_diary_updated_at
  BEFORE UPDATE ON skin_diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_skin_diary_updated_at();

-- ============================================
-- 피부 다이어리 통계 뷰
-- ============================================

CREATE OR REPLACE VIEW skin_diary_weekly_stats AS
SELECT
  clerk_user_id,
  date_trunc('week', entry_date) AS week_start,
  COUNT(*) AS entries_count,
  ROUND(AVG(skin_condition)::numeric, 1) AS avg_condition,
  ROUND(AVG(sleep_hours)::numeric, 1) AS avg_sleep_hours,
  ROUND(AVG(water_intake_ml)::numeric, 0) AS avg_water_ml,
  ROUND(AVG(stress_level)::numeric, 1) AS avg_stress,
  COUNT(*) FILTER (WHERE morning_routine_completed) AS morning_routine_count,
  COUNT(*) FILTER (WHERE evening_routine_completed) AS evening_routine_count
FROM skin_diary_entries
GROUP BY clerk_user_id, date_trunc('week', entry_date);

-- ============================================
-- 코멘트
-- ============================================

COMMENT ON TABLE skin_diary_entries IS '피부 다이어리 - 일일 컨디션 및 생활 요인 기록';
COMMENT ON COLUMN skin_diary_entries.skin_condition IS '피부 컨디션 (1: 매우 나쁨 ~ 5: 매우 좋음)';
COMMENT ON COLUMN skin_diary_entries.sleep_quality IS '수면 품질 (1: 매우 나쁨 ~ 5: 매우 좋음)';
COMMENT ON COLUMN skin_diary_entries.stress_level IS '스트레스 (1: 매우 낮음 ~ 5: 매우 높음)';
COMMENT ON COLUMN skin_diary_entries.weather IS '날씨 (sunny/cloudy/rainy/cold/hot/humid/dry)';
COMMENT ON COLUMN skin_diary_entries.special_treatments IS '특별 케어 목록 (시트마스크, 필링 등)';
COMMENT ON COLUMN skin_diary_entries.ai_insights IS 'AI 상관관계 분석 결과 (JSON)';
