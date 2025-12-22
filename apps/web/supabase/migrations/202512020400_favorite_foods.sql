-- Migration: favorite_foods 테이블 생성
-- Purpose: N-1 즐겨찾기 음식
-- Date: 2025-12-02
-- Sprint: Sprint 2 (Task 2.0-d)

-- Step 1: favorite_foods 테이블 생성
CREATE TABLE IF NOT EXISTS public.favorite_foods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

    -- 음식 참조
    food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    custom_name TEXT,  -- 사용자 지정 별칭

    -- 카테고리 (언제 주로 먹는지)
    category TEXT CHECK (category IS NULL OR category IN ('breakfast', 'lunch', 'dinner', 'snack', 'any')),

    -- 기본 섭취량
    default_serving DECIMAL(3,1) DEFAULT 1.0,

    -- 사용 통계
    use_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),

    -- 커스텀 정보
    custom_portion TEXT,
    custom_calories INTEGER,
    notes TEXT,

    -- 메타데이터
    added_at TIMESTAMPTZ DEFAULT NOW(),

    -- 사용자당 음식별 하나
    UNIQUE(clerk_user_id, food_id)
);

-- Step 2: 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_favorite_foods_user
    ON favorite_foods(clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_favorite_foods_user_count
    ON favorite_foods(clerk_user_id, use_count DESC);

-- Step 3: Row Level Security (RLS) 활성화
ALTER TABLE favorite_foods ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS 정책 생성
CREATE POLICY "Users can view own favorite foods"
    ON favorite_foods FOR SELECT
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own favorite foods"
    ON favorite_foods FOR INSERT
    WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own favorite foods"
    ON favorite_foods FOR UPDATE
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub')
    WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own favorite foods"
    ON favorite_foods FOR DELETE
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Step 5: 권한 부여
GRANT ALL ON TABLE favorite_foods TO anon;
GRANT ALL ON TABLE favorite_foods TO authenticated;
GRANT ALL ON TABLE favorite_foods TO service_role;

-- Step 6: 코멘트 추가
COMMENT ON TABLE favorite_foods IS 'N-1 즐겨찾기 음식 테이블';
COMMENT ON COLUMN favorite_foods.food_id IS 'foods 테이블 참조';
COMMENT ON COLUMN favorite_foods.food_name IS '음식 이름 (빠른 조회용)';
COMMENT ON COLUMN favorite_foods.custom_name IS '사용자 지정 별칭';
COMMENT ON COLUMN favorite_foods.category IS '주로 먹는 시간대 (breakfast/lunch/dinner/snack/any)';
COMMENT ON COLUMN favorite_foods.default_serving IS '기본 섭취량 배수 (1.0 = 1인분)';
COMMENT ON COLUMN favorite_foods.use_count IS '사용 횟수';
COMMENT ON COLUMN favorite_foods.last_used_at IS '마지막 사용 시간';
COMMENT ON COLUMN favorite_foods.custom_portion IS '사용자 정의 서빙 크기';
COMMENT ON COLUMN favorite_foods.custom_calories IS '사용자 정의 칼로리';
