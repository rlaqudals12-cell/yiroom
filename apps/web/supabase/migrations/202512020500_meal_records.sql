-- Migration: meal_records 테이블 생성
-- Purpose: N-1 식단 기록 저장
-- Date: 2025-12-02
-- Sprint: Sprint 2 (Task 2.0-a)

-- Step 1: meal_records 테이블 생성
CREATE TABLE IF NOT EXISTS public.meal_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

    -- 식사 정보
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_time TIME,

    -- 기록 방식 (photo: AI 분석, search: 검색, barcode: 바코드, manual: 수동 입력)
    record_type TEXT NOT NULL DEFAULT 'manual' CHECK (record_type IN ('photo', 'search', 'barcode', 'manual')),

    -- 음식 데이터 (JSONB 배열)
    -- 구조: [{ food_id, food_name, portion, calories, protein, carbs, fat, traffic_light, ai_confidence }]
    foods JSONB NOT NULL DEFAULT '[]',

    -- 영양 합계
    total_calories INTEGER DEFAULT 0,
    total_protein DECIMAL(5,1) DEFAULT 0,
    total_carbs DECIMAL(5,1) DEFAULT 0,
    total_fat DECIMAL(5,1) DEFAULT 0,
    total_sodium INTEGER DEFAULT 0,
    total_sugar DECIMAL(5,1) DEFAULT 0,

    -- AI 분석 결과 (photo 기록 시)
    ai_recognized_food TEXT,
    ai_confidence TEXT CHECK (ai_confidence IS NULL OR ai_confidence IN ('high', 'medium', 'low')),
    ai_raw_response JSONB,
    user_confirmed BOOLEAN DEFAULT FALSE,

    -- 이미지
    image_url TEXT,

    -- 메모
    notes TEXT,

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: 인덱스 생성
-- 사용자별 날짜순 조회 최적화
CREATE INDEX IF NOT EXISTS idx_meal_records_user_date
    ON meal_records(clerk_user_id, meal_date DESC);

-- 사용자별 식사 타입 조회
CREATE INDEX IF NOT EXISTS idx_meal_records_user_type
    ON meal_records(clerk_user_id, meal_type);

-- 날짜 범위 조회 (히스토리)
CREATE INDEX IF NOT EXISTS idx_meal_records_date
    ON meal_records(meal_date DESC);

-- Step 3: Row Level Security (RLS) 활성화
ALTER TABLE meal_records ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS 정책 생성
-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "Users can view own meal records"
    ON meal_records FOR SELECT
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 사용자는 자신의 데이터만 삽입 가능
CREATE POLICY "Users can insert own meal records"
    ON meal_records FOR INSERT
    WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 사용자는 자신의 데이터만 수정 가능
CREATE POLICY "Users can update own meal records"
    ON meal_records FOR UPDATE
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub')
    WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 사용자는 자신의 데이터만 삭제 가능
CREATE POLICY "Users can delete own meal records"
    ON meal_records FOR DELETE
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Step 5: updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_meal_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_meal_records_updated_at
    BEFORE UPDATE ON meal_records
    FOR EACH ROW
    EXECUTE FUNCTION update_meal_records_updated_at();

-- Step 6: 권한 부여
GRANT ALL ON TABLE meal_records TO anon;
GRANT ALL ON TABLE meal_records TO authenticated;
GRANT ALL ON TABLE meal_records TO service_role;

-- Step 7: 코멘트 추가
COMMENT ON TABLE meal_records IS 'N-1 식단 기록 테이블';
COMMENT ON COLUMN meal_records.meal_type IS '식사 타입 (breakfast/lunch/dinner/snack)';
COMMENT ON COLUMN meal_records.meal_date IS '식사 날짜';
COMMENT ON COLUMN meal_records.meal_time IS '식사 시간 (선택)';
COMMENT ON COLUMN meal_records.foods IS '음식 배열 (JSONB): [{food_id, food_name, portion, calories, protein, carbs, fat, traffic_light, ai_confidence}]';
COMMENT ON COLUMN meal_records.total_calories IS '총 칼로리 (kcal)';
COMMENT ON COLUMN meal_records.total_protein IS '총 단백질 (g)';
COMMENT ON COLUMN meal_records.total_carbs IS '총 탄수화물 (g)';
COMMENT ON COLUMN meal_records.total_fat IS '총 지방 (g)';
COMMENT ON COLUMN meal_records.total_sodium IS '총 나트륨 (mg)';
COMMENT ON COLUMN meal_records.total_sugar IS '총 당류 (g)';
COMMENT ON COLUMN meal_records.record_type IS '기록 방식 (photo/search/barcode/manual)';
COMMENT ON COLUMN meal_records.ai_recognized_food IS 'AI 인식 음식명';
COMMENT ON COLUMN meal_records.ai_confidence IS 'AI 인식 신뢰도 (high/medium/low)';
COMMENT ON COLUMN meal_records.ai_raw_response IS 'Gemini Vision 원본 응답 (JSONB)';
COMMENT ON COLUMN meal_records.user_confirmed IS '사용자 확인 여부';
COMMENT ON COLUMN meal_records.image_url IS '음식 사진 URL (Supabase Storage)';
