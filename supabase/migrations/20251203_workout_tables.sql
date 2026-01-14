-- W-1 운동 모듈 테이블
-- workout_analyses, workout_logs, workout_streaks

-- 운동 분석 테이블
CREATE TABLE IF NOT EXISTS workout_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  body_analysis_id UUID,
  personal_color_id UUID,
  workout_type TEXT,
  workout_type_reason TEXT,
  workout_type_confidence DECIMAL(3,2),
  goals TEXT[] DEFAULT '{}',
  concerns TEXT[] DEFAULT '{}',
  frequency TEXT,
  location TEXT,
  equipment TEXT[] DEFAULT '{}',
  injuries TEXT[] DEFAULT '{}',
  target_weight DECIMAL(5,2),
  target_date DATE,
  specific_goal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 운동 플랜 테이블
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  analysis_id UUID REFERENCES workout_analyses(id) ON DELETE SET NULL,
  week_start_date DATE NOT NULL,
  week_number INTEGER DEFAULT 1,
  daily_plans JSONB NOT NULL DEFAULT '[]',
  total_workout_days INTEGER DEFAULT 0,
  total_estimated_minutes INTEGER DEFAULT 0,
  total_estimated_calories INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 운동 기록 테이블
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ,
  actual_duration INTEGER,
  actual_calories INTEGER,
  exercise_logs JSONB NOT NULL DEFAULT '[]',
  total_volume INTEGER DEFAULT 0,
  perceived_effort INTEGER CHECK (perceived_effort >= 1 AND perceived_effort <= 10),
  notes TEXT,
  mood TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 운동 스트릭 테이블
CREATE TABLE IF NOT EXISTS workout_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_workout_date DATE,
  total_workouts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_workout_analyses_user ON workout_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, workout_date);
CREATE INDEX IF NOT EXISTS idx_workout_streaks_user ON workout_streaks(user_id);

-- RLS 정책
ALTER TABLE workout_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_streaks ENABLE ROW LEVEL SECURITY;

-- workout_analyses RLS
CREATE POLICY "Users can view own workout analyses"
  ON workout_analyses FOR SELECT
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own workout analyses"
  ON workout_analyses FOR INSERT
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own workout analyses"
  ON workout_analyses FOR UPDATE
  USING (user_id = (auth.jwt() ->> 'sub'));

-- workout_plans RLS
CREATE POLICY "Users can view own workout plans"
  ON workout_plans FOR SELECT
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own workout plans"
  ON workout_plans FOR INSERT
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own workout plans"
  ON workout_plans FOR UPDATE
  USING (user_id = (auth.jwt() ->> 'sub'));

-- workout_logs RLS
CREATE POLICY "Users can view own workout logs"
  ON workout_logs FOR SELECT
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own workout logs"
  ON workout_logs FOR INSERT
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own workout logs"
  ON workout_logs FOR UPDATE
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete own workout logs"
  ON workout_logs FOR DELETE
  USING (user_id = (auth.jwt() ->> 'sub'));

-- workout_streaks RLS
CREATE POLICY "Users can view own workout streaks"
  ON workout_streaks FOR SELECT
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own workout streaks"
  ON workout_streaks FOR INSERT
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own workout streaks"
  ON workout_streaks FOR UPDATE
  USING (user_id = (auth.jwt() ->> 'sub'));

-- 코멘트
COMMENT ON TABLE workout_analyses IS 'W-1 운동 분석 - 사용자 운동 목표 및 분석';
COMMENT ON TABLE workout_plans IS 'W-1 운동 플랜 - 주간 운동 계획';
COMMENT ON TABLE workout_logs IS 'W-1 운동 기록 - 일일 운동 로그';
COMMENT ON TABLE workout_streaks IS 'W-1 운동 스트릭 - 연속 운동 기록';
