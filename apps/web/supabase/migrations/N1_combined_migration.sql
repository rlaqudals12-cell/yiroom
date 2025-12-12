-- ============================================
-- N-1 영양 모듈 통합 마이그레이션
-- 실행: Supabase Dashboard > SQL Editor
-- 날짜: 2025-12-04
-- ============================================

-- ============================================
-- 1. 확장 기능 설치
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 2. foods 테이블 (공용 음식 DB)
-- ============================================
CREATE TABLE IF NOT EXISTS public.foods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    category TEXT NOT NULL,
    serving_size TEXT DEFAULT '1인분',
    serving_grams INTEGER,
    calories INTEGER NOT NULL,
    protein DECIMAL(5,1),
    carbs DECIMAL(5,1),
    fat DECIMAL(5,1),
    fiber DECIMAL(5,1),
    sugar DECIMAL(5,1),
    sodium INTEGER,
    traffic_light TEXT CHECK (traffic_light IN ('green', 'yellow', 'red')),
    is_korean BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
GRANT SELECT ON TABLE foods TO anon;
GRANT SELECT ON TABLE foods TO authenticated;
GRANT ALL ON TABLE foods TO service_role;

-- ============================================
-- 3. nutrition_settings 테이블 (온보딩)
-- ============================================
CREATE TABLE IF NOT EXISTS public.nutrition_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,
    goal TEXT NOT NULL CHECK (goal IN ('weight_loss', 'maintain', 'muscle', 'skin', 'health')),
    bmr DECIMAL(6,1),
    tdee DECIMAL(6,1),
    daily_calorie_target INTEGER,
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    meal_style TEXT CHECK (meal_style IN ('korean', 'salad', 'western', 'lunchbox', 'delivery', 'any')),
    cooking_skill TEXT CHECK (cooking_skill IN ('beginner', 'intermediate', 'advanced', 'none')),
    budget TEXT CHECK (budget IN ('economy', 'moderate', 'premium', 'any')),
    allergies TEXT[] DEFAULT '{}',
    disliked_foods TEXT[] DEFAULT '{}',
    meal_count INTEGER DEFAULT 3 CHECK (meal_count >= 2 AND meal_count <= 6),
    protein_target INTEGER,
    carbs_target INTEGER,
    fat_target INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clerk_user_id)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_settings_clerk_user_id ON nutrition_settings(clerk_user_id);
ALTER TABLE nutrition_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nutrition settings" ON nutrition_settings FOR SELECT
    USING (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can insert own nutrition settings" ON nutrition_settings FOR INSERT
    WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can update own nutrition settings" ON nutrition_settings FOR UPDATE
    USING (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can delete own nutrition settings" ON nutrition_settings FOR DELETE
    USING (clerk_user_id = auth.jwt() ->> 'sub');

GRANT ALL ON TABLE nutrition_settings TO anon;
GRANT ALL ON TABLE nutrition_settings TO authenticated;
GRANT ALL ON TABLE nutrition_settings TO service_role;

-- ============================================
-- 4. meal_records 테이블 (식단 기록)
-- ============================================
CREATE TABLE IF NOT EXISTS public.meal_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_time TIME,
    record_type TEXT NOT NULL DEFAULT 'manual' CHECK (record_type IN ('photo', 'search', 'barcode', 'manual')),
    foods JSONB NOT NULL DEFAULT '[]',
    total_calories INTEGER DEFAULT 0,
    total_protein DECIMAL(5,1) DEFAULT 0,
    total_carbs DECIMAL(5,1) DEFAULT 0,
    total_fat DECIMAL(5,1) DEFAULT 0,
    total_sodium INTEGER DEFAULT 0,
    total_sugar DECIMAL(5,1) DEFAULT 0,
    ai_recognized_food TEXT,
    ai_confidence TEXT CHECK (ai_confidence IS NULL OR ai_confidence IN ('high', 'medium', 'low')),
    ai_raw_response JSONB,
    user_confirmed BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_records_user_date ON meal_records(clerk_user_id, meal_date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_records_user_type ON meal_records(clerk_user_id, meal_type);
ALTER TABLE meal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal records" ON meal_records FOR SELECT
    USING (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can insert own meal records" ON meal_records FOR INSERT
    WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can update own meal records" ON meal_records FOR UPDATE
    USING (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can delete own meal records" ON meal_records FOR DELETE
    USING (clerk_user_id = auth.jwt() ->> 'sub');

GRANT ALL ON TABLE meal_records TO anon;
GRANT ALL ON TABLE meal_records TO authenticated;
GRANT ALL ON TABLE meal_records TO service_role;

-- ============================================
-- 5. water_records 테이블 (수분 섭취)
-- ============================================
CREATE TABLE IF NOT EXISTS public.water_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    record_time TIME DEFAULT CURRENT_TIME,
    amount_ml INTEGER NOT NULL CHECK (amount_ml > 0 AND amount_ml <= 2000),
    drink_type TEXT DEFAULT 'water' CHECK (drink_type IN ('water', 'tea', 'coffee', 'juice', 'soda', 'other')),
    hydration_factor DECIMAL(3,2) DEFAULT 1.0,
    effective_ml INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_water_records_user_date ON water_records(clerk_user_id, record_date DESC);
ALTER TABLE water_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own water records" ON water_records FOR SELECT
    USING (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can insert own water records" ON water_records FOR INSERT
    WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can update own water records" ON water_records FOR UPDATE
    USING (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can delete own water records" ON water_records FOR DELETE
    USING (clerk_user_id = auth.jwt() ->> 'sub');

GRANT ALL ON TABLE water_records TO anon;
GRANT ALL ON TABLE water_records TO authenticated;
GRANT ALL ON TABLE water_records TO service_role;

-- ============================================
-- 6. favorite_foods 테이블 (즐겨찾기)
-- ============================================
CREATE TABLE IF NOT EXISTS public.favorite_foods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,
    food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    custom_name TEXT,
    category TEXT CHECK (category IS NULL OR category IN ('breakfast', 'lunch', 'dinner', 'snack', 'any')),
    default_serving DECIMAL(3,1) DEFAULT 1.0,
    use_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    custom_portion TEXT,
    custom_calories INTEGER,
    notes TEXT,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clerk_user_id, food_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_foods_user ON favorite_foods(clerk_user_id);
ALTER TABLE favorite_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorite foods" ON favorite_foods FOR SELECT
    USING (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can insert own favorite foods" ON favorite_foods FOR INSERT
    WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can update own favorite foods" ON favorite_foods FOR UPDATE
    USING (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can delete own favorite foods" ON favorite_foods FOR DELETE
    USING (clerk_user_id = auth.jwt() ->> 'sub');

GRANT ALL ON TABLE favorite_foods TO anon;
GRANT ALL ON TABLE favorite_foods TO authenticated;
GRANT ALL ON TABLE favorite_foods TO service_role;

-- ============================================
-- 7. nutrition_streaks 테이블 (연속 기록)
-- ============================================
CREATE TABLE IF NOT EXISTS public.nutrition_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_record_date DATE,
    streak_start_date DATE,
    badges_earned JSONB DEFAULT '[]',
    milestones_reached JSONB DEFAULT '[]',
    premium_rewards_claimed JSONB DEFAULT '[]',
    total_days_logged INTEGER DEFAULT 0,
    total_meals_logged INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clerk_user_id)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_streaks_user ON nutrition_streaks(clerk_user_id);
ALTER TABLE nutrition_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nutrition streaks" ON nutrition_streaks FOR SELECT
    USING (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can insert own nutrition streaks" ON nutrition_streaks FOR INSERT
    WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can update own nutrition streaks" ON nutrition_streaks FOR UPDATE
    USING (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can delete own nutrition streaks" ON nutrition_streaks FOR DELETE
    USING (clerk_user_id = auth.jwt() ->> 'sub');

GRANT ALL ON TABLE nutrition_streaks TO anon;
GRANT ALL ON TABLE nutrition_streaks TO authenticated;
GRANT ALL ON TABLE nutrition_streaks TO service_role;

-- ============================================
-- 8. daily_nutrition_summary 테이블 (일일 요약)
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_nutrition_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,
    summary_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_calories INTEGER DEFAULT 0,
    target_calories INTEGER,
    total_protein DECIMAL(5,1) DEFAULT 0,
    target_protein INTEGER,
    total_carbs DECIMAL(5,1) DEFAULT 0,
    target_carbs INTEGER,
    total_fat DECIMAL(5,1) DEFAULT 0,
    target_fat INTEGER,
    total_sodium INTEGER DEFAULT 0,
    total_sugar DECIMAL(5,1) DEFAULT 0,
    total_water_ml INTEGER DEFAULT 0,
    green_ratio INTEGER DEFAULT 0,
    yellow_ratio INTEGER DEFAULT 0,
    red_ratio INTEGER DEFAULT 0,
    meals_count INTEGER DEFAULT 0,
    meal_record_ids UUID[] DEFAULT '{}',
    streak_days INTEGER DEFAULT 0,
    calorie_percent DECIMAL(5,1) DEFAULT 0,
    protein_percent DECIMAL(5,1) DEFAULT 0,
    carbs_percent DECIMAL(5,1) DEFAULT 0,
    fat_percent DECIMAL(5,1) DEFAULT 0,
    water_percent DECIMAL(5,1) DEFAULT 0,
    ai_insights JSONB DEFAULT '[]',
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clerk_user_id, summary_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_nutrition_summary_user_date ON daily_nutrition_summary(clerk_user_id, summary_date DESC);
ALTER TABLE daily_nutrition_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily summary" ON daily_nutrition_summary FOR SELECT
    USING (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can insert own daily summary" ON daily_nutrition_summary FOR INSERT
    WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can update own daily summary" ON daily_nutrition_summary FOR UPDATE
    USING (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can delete own daily summary" ON daily_nutrition_summary FOR DELETE
    USING (clerk_user_id = auth.jwt() ->> 'sub');

GRANT ALL ON TABLE daily_nutrition_summary TO anon;
GRANT ALL ON TABLE daily_nutrition_summary TO authenticated;
GRANT ALL ON TABLE daily_nutrition_summary TO service_role;

-- ============================================
-- 9. fasting_records 테이블 (단식 기록)
-- ============================================
CREATE TABLE IF NOT EXISTS public.fasting_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    target_hours INTEGER NOT NULL,
    actual_hours DECIMAL(4,1),
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fasting_records_clerk_user ON fasting_records(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_fasting_records_start ON fasting_records(clerk_user_id, start_time DESC);
ALTER TABLE fasting_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fasting_records" ON fasting_records FOR SELECT
    USING (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can insert own fasting_records" ON fasting_records FOR INSERT
    WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can update own fasting_records" ON fasting_records FOR UPDATE
    USING (clerk_user_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can delete own fasting_records" ON fasting_records FOR DELETE
    USING (clerk_user_id = auth.jwt() ->> 'sub');

GRANT ALL ON TABLE fasting_records TO anon;
GRANT ALL ON TABLE fasting_records TO authenticated;
GRANT ALL ON TABLE fasting_records TO service_role;

-- ============================================
-- 10. users 테이블 확장 (BMR 계산용)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'gender') THEN
        ALTER TABLE users ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'other'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'birth_date') THEN
        ALTER TABLE users ADD COLUMN birth_date DATE;
    END IF;
END $$;

COMMENT ON COLUMN users.gender IS '성별 (male/female/other) - BMR 계산용';
COMMENT ON COLUMN users.birth_date IS '생년월일 - 나이 계산용';

-- ============================================
-- 11. body_analyses 테이블 확장 (키/몸무게)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_analyses' AND column_name = 'height') THEN
        ALTER TABLE body_analyses ADD COLUMN height DECIMAL(5,1);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_analyses' AND column_name = 'weight') THEN
        ALTER TABLE body_analyses ADD COLUMN weight DECIMAL(5,1);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_body_analyses_user_latest ON body_analyses(user_id, created_at DESC);

COMMENT ON COLUMN body_analyses.height IS '키 (cm) - 사용자 직접 입력';
COMMENT ON COLUMN body_analyses.weight IS '몸무게 (kg) - 사용자 직접 입력';

-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'N-1 영양 모듈 마이그레이션 완료!';
    RAISE NOTICE '생성된 테이블: foods, nutrition_settings, meal_records, water_records, favorite_foods, nutrition_streaks, daily_nutrition_summary, fasting_records';
    RAISE NOTICE '확장된 테이블: users (gender, birth_date), body_analyses (height, weight)';
END $$;
