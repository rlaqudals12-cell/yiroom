-- 피부 다이어리 테이블 스키마 업데이트
-- Phase 3: SDD-S1-UX-IMPROVEMENT.md §4.2 피부 다이어리 시스템

-- 기존 skin_diary_entries 테이블에 누락된 컬럼 추가

-- 컨디션 메모
ALTER TABLE skin_diary_entries
ADD COLUMN IF NOT EXISTS condition_notes TEXT;

-- 수면 품질
ALTER TABLE skin_diary_entries
ADD COLUMN IF NOT EXISTS sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5);

-- 수분 섭취량
ALTER TABLE skin_diary_entries
ADD COLUMN IF NOT EXISTS water_intake_ml INTEGER;

-- 야외 활동 시간
ALTER TABLE skin_diary_entries
ADD COLUMN IF NOT EXISTS outdoor_hours DECIMAL(3,1);

-- 아침 루틴 완료
ALTER TABLE skin_diary_entries
ADD COLUMN IF NOT EXISTS morning_routine_completed BOOLEAN DEFAULT false;

-- 저녁 루틴 완료
ALTER TABLE skin_diary_entries
ADD COLUMN IF NOT EXISTS evening_routine_completed BOOLEAN DEFAULT false;

-- 특별 케어 목록
ALTER TABLE skin_diary_entries
ADD COLUMN IF NOT EXISTS special_treatments TEXT[] DEFAULT '{}';

-- AI 상관관계 점수
ALTER TABLE skin_diary_entries
ADD COLUMN IF NOT EXISTS ai_correlation_score INTEGER;

-- AI 인사이트 JSONB
ALTER TABLE skin_diary_entries
ADD COLUMN IF NOT EXISTS ai_insights JSONB;

-- 업데이트 시각
ALTER TABLE skin_diary_entries
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- UNIQUE 제약조건 (clerk_user_id, entry_date)
-- 기존 인덱스가 있을 경우 제약조건으로 대체
DO $$
BEGIN
  -- 기존 제약조건이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_user_date'
    AND conrelid = 'skin_diary_entries'::regclass
  ) THEN
    ALTER TABLE skin_diary_entries
    ADD CONSTRAINT unique_user_date UNIQUE (clerk_user_id, entry_date);
  END IF;
END $$;

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_skin_diary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_skin_diary_updated_at ON skin_diary_entries;
CREATE TRIGGER trigger_update_skin_diary_updated_at
  BEFORE UPDATE ON skin_diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_skin_diary_updated_at();

-- 코멘트 업데이트
COMMENT ON TABLE skin_diary_entries IS '피부 일기 - 일별 피부 컨디션 기록 및 생활 요인 추적';
COMMENT ON COLUMN skin_diary_entries.skin_condition IS '피부 컨디션 점수 (1-5)';
COMMENT ON COLUMN skin_diary_entries.condition_notes IS '피부 상태 메모';
COMMENT ON COLUMN skin_diary_entries.sleep_hours IS '수면 시간';
COMMENT ON COLUMN skin_diary_entries.sleep_quality IS '수면 품질 (1-5)';
COMMENT ON COLUMN skin_diary_entries.water_intake_ml IS '수분 섭취량 (ml)';
COMMENT ON COLUMN skin_diary_entries.stress_level IS '스트레스 레벨 (1-5)';
COMMENT ON COLUMN skin_diary_entries.weather IS '날씨 (sunny, cloudy, rainy, cold, hot, humid, dry)';
COMMENT ON COLUMN skin_diary_entries.outdoor_hours IS '야외 활동 시간';
COMMENT ON COLUMN skin_diary_entries.morning_routine_completed IS '아침 루틴 완료 여부';
COMMENT ON COLUMN skin_diary_entries.evening_routine_completed IS '저녁 루틴 완료 여부';
COMMENT ON COLUMN skin_diary_entries.special_treatments IS '특별 케어 목록';
COMMENT ON COLUMN skin_diary_entries.ai_correlation_score IS 'AI 상관관계 분석 점수';
COMMENT ON COLUMN skin_diary_entries.ai_insights IS 'AI 인사이트 (JSON)';
