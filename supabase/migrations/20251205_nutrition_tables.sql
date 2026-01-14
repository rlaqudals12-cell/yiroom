-- N-1 영양 관리 테이블
-- nutrition_settings, meal_records, water_records

-- 영양 설정 테이블
CREATE TABLE IF NOT EXISTS nutrition_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  goal TEXT NOT NULL CHECK (goal IN ('weight_loss', 'maintain', 'muscle', 'skin', 'health')),
  bmr DECIMAL(6,1),
  tdee DECIMAL(6,1),
  daily_calorie_target INTEGER,
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  meal_style TEXT,
  cooking_skill TEXT,
  budget TEXT,
  allergies TEXT[] DEFAULT '{}',
  disliked_foods TEXT[] DEFAULT '{}',
  meal_count INTEGER DEFAULT 3,
  protein_target INTEGER,
  carbs_target INTEGER,
  fat_target INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 식단 기록 테이블
CREATE TABLE IF NOT EXISTS meal_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_time TIME,
  record_type TEXT NOT NULL DEFAULT 'manual',
  foods JSONB NOT NULL DEFAULT '[]',
  total_calories INTEGER DEFAULT 0,
  total_protein DECIMAL(5,1) DEFAULT 0,
  total_carbs DECIMAL(5,1) DEFAULT 0,
  total_fat DECIMAL(5,1) DEFAULT 0,
  total_sodium INTEGER DEFAULT 0,
  total_sugar DECIMAL(5,1) DEFAULT 0,
  ai_recognized_food TEXT,
  ai_confidence TEXT,
  ai_raw_response JSONB,
  user_confirmed BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 수분 섭취 기록 테이블
CREATE TABLE IF NOT EXISTS water_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  record_time TIME DEFAULT CURRENT_TIME,
  amount_ml INTEGER NOT NULL,
  drink_type TEXT DEFAULT 'water',
  hydration_factor DECIMAL(3,2) DEFAULT 1.0,
  effective_ml INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 일일 영양 요약 테이블
CREATE TABLE IF NOT EXISTS daily_nutrition_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  summary_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_calories INTEGER DEFAULT 0,
  total_protein DECIMAL(5,1) DEFAULT 0,
  total_carbs DECIMAL(5,1) DEFAULT 0,
  total_fat DECIMAL(5,1) DEFAULT 0,
  total_water_ml INTEGER DEFAULT 0,
  meal_count INTEGER DEFAULT 0,
  calorie_goal_met BOOLEAN DEFAULT FALSE,
  protein_goal_met BOOLEAN DEFAULT FALSE,
  water_goal_met BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, summary_date)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_nutrition_settings_user ON nutrition_settings(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_meal_records_user_date ON meal_records(clerk_user_id, meal_date);
CREATE INDEX IF NOT EXISTS idx_water_records_user_date ON water_records(clerk_user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_daily_summary_user_date ON daily_nutrition_summary(clerk_user_id, summary_date);

-- RLS 정책
ALTER TABLE nutrition_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition_summary ENABLE ROW LEVEL SECURITY;

-- nutrition_settings RLS
CREATE POLICY "Users can view own nutrition settings"
  ON nutrition_settings FOR SELECT
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own nutrition settings"
  ON nutrition_settings FOR INSERT
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own nutrition settings"
  ON nutrition_settings FOR UPDATE
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- meal_records RLS
CREATE POLICY "Users can view own meal records"
  ON meal_records FOR SELECT
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own meal records"
  ON meal_records FOR INSERT
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own meal records"
  ON meal_records FOR UPDATE
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete own meal records"
  ON meal_records FOR DELETE
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- water_records RLS
CREATE POLICY "Users can view own water records"
  ON water_records FOR SELECT
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own water records"
  ON water_records FOR INSERT
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own water records"
  ON water_records FOR UPDATE
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete own water records"
  ON water_records FOR DELETE
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- daily_nutrition_summary RLS
CREATE POLICY "Users can view own daily summary"
  ON daily_nutrition_summary FOR SELECT
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own daily summary"
  ON daily_nutrition_summary FOR INSERT
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own daily summary"
  ON daily_nutrition_summary FOR UPDATE
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- 코멘트
COMMENT ON TABLE nutrition_settings IS 'N-1 영양 설정 - 사용자별 영양 목표 및 선호도';
COMMENT ON TABLE meal_records IS 'N-1 식단 기록 - 식사별 음식 및 영양소 기록';
COMMENT ON TABLE water_records IS 'N-1 수분 섭취 기록';
COMMENT ON TABLE daily_nutrition_summary IS 'N-1 일일 영양 요약 - 자동 집계';
