-- Migration: nutrition_settings 테이블 생성
-- Purpose: N-1 영양 모듈 온보딩 데이터 저장
-- Date: 2025-12-01
-- Version: v2.6

-- Step 1: nutrition_settings 테이블 생성
CREATE TABLE IF NOT EXISTS public.nutrition_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,

    -- Step 1: 목표
    goal TEXT NOT NULL CHECK (goal IN ('weight_loss', 'maintain', 'muscle', 'skin', 'health')),

    -- Step 2: 기본 정보 (BMR/TDEE 계산 결과)
    bmr DECIMAL(6,1),
    tdee DECIMAL(6,1),
    daily_calorie_target INTEGER,
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),

    -- Step 3: 식사 스타일
    meal_style TEXT CHECK (meal_style IN ('korean', 'salad', 'western', 'lunchbox', 'delivery', 'any')),

    -- Step 4: 요리 스킬
    cooking_skill TEXT CHECK (cooking_skill IN ('beginner', 'intermediate', 'advanced', 'none')),

    -- Step 5: 예산
    budget TEXT CHECK (budget IN ('economy', 'moderate', 'premium', 'any')),

    -- Step 6: 알레르기/기피
    allergies TEXT[] DEFAULT '{}',
    disliked_foods TEXT[] DEFAULT '{}',

    -- Step 7: 식사 횟수
    meal_count INTEGER DEFAULT 3 CHECK (meal_count >= 2 AND meal_count <= 6),

    -- 영양소 목표
    protein_target INTEGER,
    carbs_target INTEGER,
    fat_target INTEGER,

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- 사용자당 하나의 설정만 허용
    UNIQUE(clerk_user_id)
);

-- Step 2: 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_nutrition_settings_clerk_user_id ON nutrition_settings(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_settings_goal ON nutrition_settings(goal);

-- Step 3: Row Level Security (RLS) 활성화
ALTER TABLE nutrition_settings ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS 정책 생성
-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "Users can view own nutrition settings"
    ON nutrition_settings FOR SELECT
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 사용자는 자신의 데이터만 삽입 가능
CREATE POLICY "Users can insert own nutrition settings"
    ON nutrition_settings FOR INSERT
    WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 사용자는 자신의 데이터만 수정 가능
CREATE POLICY "Users can update own nutrition settings"
    ON nutrition_settings FOR UPDATE
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub')
    WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 사용자는 자신의 데이터만 삭제 가능
CREATE POLICY "Users can delete own nutrition settings"
    ON nutrition_settings FOR DELETE
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Step 5: updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_nutrition_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_nutrition_settings_updated_at
    BEFORE UPDATE ON nutrition_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_nutrition_settings_updated_at();

-- Step 6: 권한 부여
GRANT ALL ON TABLE nutrition_settings TO anon;
GRANT ALL ON TABLE nutrition_settings TO authenticated;
GRANT ALL ON TABLE nutrition_settings TO service_role;

-- Step 7: 코멘트 추가
COMMENT ON TABLE nutrition_settings IS 'N-1 영양 모듈 사용자 설정';
COMMENT ON COLUMN nutrition_settings.goal IS '영양 목표 (weight_loss/maintain/muscle/skin/health)';
COMMENT ON COLUMN nutrition_settings.bmr IS '기초대사량 (kcal)';
COMMENT ON COLUMN nutrition_settings.tdee IS '총 에너지 소비량 (kcal)';
COMMENT ON COLUMN nutrition_settings.meal_style IS '식사 스타일 (korean/salad/western/lunchbox/delivery/any)';
COMMENT ON COLUMN nutrition_settings.allergies IS '알레르기 배열';
COMMENT ON COLUMN nutrition_settings.disliked_foods IS '기피 음식 배열';
