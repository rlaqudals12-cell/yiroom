-- Migration: daily_nutrition_summary 테이블 생성
-- Purpose: N-1 일일 영양 합계 (대시보드용 캐시)
-- Date: 2025-12-02
-- Sprint: Sprint 2 (Task 2.0-c)

-- Step 1: daily_nutrition_summary 테이블 생성
CREATE TABLE IF NOT EXISTS public.daily_nutrition_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,

    -- 날짜 (사용자당 하루에 하나)
    summary_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- 칼로리
    total_calories INTEGER DEFAULT 0,
    target_calories INTEGER,

    -- 영양소
    total_protein DECIMAL(5,1) DEFAULT 0,
    target_protein INTEGER,
    total_carbs DECIMAL(5,1) DEFAULT 0,
    target_carbs INTEGER,
    total_fat DECIMAL(5,1) DEFAULT 0,
    target_fat INTEGER,
    total_sodium INTEGER DEFAULT 0,
    total_sugar DECIMAL(5,1) DEFAULT 0,

    -- 수분
    total_water_ml INTEGER DEFAULT 0,

    -- 신호등 비율 (%)
    green_ratio INTEGER DEFAULT 0 CHECK (green_ratio >= 0 AND green_ratio <= 100),
    yellow_ratio INTEGER DEFAULT 0 CHECK (yellow_ratio >= 0 AND yellow_ratio <= 100),
    red_ratio INTEGER DEFAULT 0 CHECK (red_ratio >= 0 AND red_ratio <= 100),

    -- 식사 정보
    meals_count INTEGER DEFAULT 0,
    meal_record_ids UUID[] DEFAULT '{}',

    -- 연속 기록일 (당일 기준, 빠른 조회용 캐시)
    streak_days INTEGER DEFAULT 0,

    -- 달성률
    calorie_percent DECIMAL(5,1) DEFAULT 0,
    protein_percent DECIMAL(5,1) DEFAULT 0,
    carbs_percent DECIMAL(5,1) DEFAULT 0,
    fat_percent DECIMAL(5,1) DEFAULT 0,
    water_percent DECIMAL(5,1) DEFAULT 0,

    -- AI 인사이트 (당일 생성된 조언/분석)
    ai_insights JSONB DEFAULT '[]',

    -- 목표 달성 여부
    is_complete BOOLEAN DEFAULT FALSE,

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- 사용자당 날짜별 하나
    UNIQUE(clerk_user_id, summary_date)
);

-- Step 2: 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_daily_nutrition_summary_user_date
    ON daily_nutrition_summary(clerk_user_id, summary_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_nutrition_summary_date
    ON daily_nutrition_summary(summary_date DESC);

-- Step 3: Row Level Security (RLS) 활성화
ALTER TABLE daily_nutrition_summary ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS 정책 생성
CREATE POLICY "Users can view own daily summary"
    ON daily_nutrition_summary FOR SELECT
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own daily summary"
    ON daily_nutrition_summary FOR INSERT
    WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own daily summary"
    ON daily_nutrition_summary FOR UPDATE
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub')
    WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own daily summary"
    ON daily_nutrition_summary FOR DELETE
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Step 5: updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_daily_nutrition_summary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_daily_nutrition_summary_updated_at
    BEFORE UPDATE ON daily_nutrition_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_nutrition_summary_updated_at();

-- Step 6: 권한 부여
GRANT ALL ON TABLE daily_nutrition_summary TO anon;
GRANT ALL ON TABLE daily_nutrition_summary TO authenticated;
GRANT ALL ON TABLE daily_nutrition_summary TO service_role;

-- Step 7: 코멘트 추가
COMMENT ON TABLE daily_nutrition_summary IS 'N-1 일일 영양 요약 (대시보드용 캐시)';
COMMENT ON COLUMN daily_nutrition_summary.summary_date IS '요약 날짜';
COMMENT ON COLUMN daily_nutrition_summary.total_calories IS '일일 총 칼로리';
COMMENT ON COLUMN daily_nutrition_summary.calorie_percent IS '칼로리 달성률 (%)';
COMMENT ON COLUMN daily_nutrition_summary.is_complete IS '목표 달성 여부';
COMMENT ON COLUMN daily_nutrition_summary.meal_record_ids IS '식사 기록 ID 배열';
COMMENT ON COLUMN daily_nutrition_summary.total_sodium IS '총 나트륨 (mg)';
COMMENT ON COLUMN daily_nutrition_summary.total_sugar IS '총 당류 (g)';
COMMENT ON COLUMN daily_nutrition_summary.green_ratio IS '신호등 녹색 비율 (%)';
COMMENT ON COLUMN daily_nutrition_summary.yellow_ratio IS '신호등 노란색 비율 (%)';
COMMENT ON COLUMN daily_nutrition_summary.red_ratio IS '신호등 빨간색 비율 (%)';
COMMENT ON COLUMN daily_nutrition_summary.water_percent IS '수분 달성률 (%)';
COMMENT ON COLUMN daily_nutrition_summary.ai_insights IS '당일 AI 인사이트 배열 (JSONB)';
COMMENT ON COLUMN daily_nutrition_summary.streak_days IS '연속 기록일 (당일 기준)';
