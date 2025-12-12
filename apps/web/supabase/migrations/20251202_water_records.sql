-- Migration: water_records 테이블 생성
-- Purpose: N-1 수분 섭취 기록
-- Date: 2025-12-02
-- Sprint: Sprint 2 (Task 2.0-b)

-- Step 1: water_records 테이블 생성
CREATE TABLE IF NOT EXISTS public.water_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,

    -- 수분 섭취 정보
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    record_time TIME DEFAULT CURRENT_TIME,
    amount_ml INTEGER NOT NULL CHECK (amount_ml > 0 AND amount_ml <= 2000),

    -- 음료 종류
    drink_type TEXT DEFAULT 'water' CHECK (drink_type IN ('water', 'tea', 'coffee', 'juice', 'soda', 'other')),

    -- 수분 흡수율 (음료 종류별: 물=1.0, 커피=0.8, 주스=0.7 등)
    hydration_factor DECIMAL(3,2) DEFAULT 1.0,

    -- 실제 수분 섭취량 (amount_ml * hydration_factor)
    effective_ml INTEGER,

    -- 메모
    notes TEXT,

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: 인덱스 생성
-- 사용자별 날짜순 조회 최적화
CREATE INDEX IF NOT EXISTS idx_water_records_user_date
    ON water_records(clerk_user_id, record_date DESC);

-- 일별 합계 계산용
CREATE INDEX IF NOT EXISTS idx_water_records_date
    ON water_records(record_date);

-- Step 3: Row Level Security (RLS) 활성화
ALTER TABLE water_records ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS 정책 생성
CREATE POLICY "Users can view own water records"
    ON water_records FOR SELECT
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own water records"
    ON water_records FOR INSERT
    WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own water records"
    ON water_records FOR UPDATE
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub')
    WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own water records"
    ON water_records FOR DELETE
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Step 5: 권한 부여
GRANT ALL ON TABLE water_records TO anon;
GRANT ALL ON TABLE water_records TO authenticated;
GRANT ALL ON TABLE water_records TO service_role;

-- Step 6: 코멘트 추가
COMMENT ON TABLE water_records IS 'N-1 수분 섭취 기록 테이블';
COMMENT ON COLUMN water_records.record_date IS '기록 날짜';
COMMENT ON COLUMN water_records.record_time IS '기록 시간';
COMMENT ON COLUMN water_records.amount_ml IS '수분 섭취량 (ml)';
COMMENT ON COLUMN water_records.drink_type IS '음료 종류 (water/tea/coffee/juice/soda/other)';
COMMENT ON COLUMN water_records.hydration_factor IS '수분 흡수율 (물=1.0, 커피=0.8, 주스=0.7 등)';
COMMENT ON COLUMN water_records.effective_ml IS '실제 수분 섭취량 (amount_ml * hydration_factor)';
