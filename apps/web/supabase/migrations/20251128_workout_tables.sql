-- W-1 운동/피트니스 테이블 마이그레이션
-- Task 2.11-2.14: workout_analyses, workout_plans, workout_logs, workout_streaks

-- =====================================================
-- Task 2.11: workout_analyses 테이블 (운동 분석 결과)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.workout_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    body_analysis_id UUID REFERENCES public.body_analyses(id),
    personal_color_id UUID,

    -- 운동 타입 (5가지: TONER, BUILDER, BURNER, MOVER, FLEXER)
    workout_type VARCHAR(20) NOT NULL,
    workout_type_reason TEXT,
    workout_type_confidence DECIMAL(5,2),

    -- 입력 데이터
    goals JSONB DEFAULT '[]',
    concerns JSONB DEFAULT '[]',
    frequency VARCHAR(10),
    location VARCHAR(20),
    equipment JSONB DEFAULT '[]',
    injuries JSONB DEFAULT '[]',

    -- 목표 설정
    target_weight DECIMAL(5,2),
    target_date DATE,
    specific_goal TEXT,

    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_workout_analyses_user_id
    ON public.workout_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_analyses_user_latest
    ON public.workout_analyses(user_id, created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_workout_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_workout_analyses_updated_at ON public.workout_analyses;
CREATE TRIGGER trigger_workout_analyses_updated_at
    BEFORE UPDATE ON public.workout_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_workout_analyses_updated_at();

-- =====================================================
-- Task 2.12: workout_plans 테이블 (주간 플랜)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES public.workout_analyses(id) ON DELETE SET NULL,

    -- 플랜 정보
    week_start_date DATE NOT NULL,
    week_number INTEGER DEFAULT 1,

    -- 일별 운동 계획 (JSON 배열)
    daily_plans JSONB NOT NULL DEFAULT '[]',
    -- [{
    --   day: 0-6 (일-토),
    --   day_label: "월요일",
    --   is_rest_day: false,
    --   focus: ["chest", "shoulder"],
    --   exercises: [{
    --     exercise_id: "...",
    --     name: "푸시업",
    --     sets: 3,
    --     reps: 12,
    --     weight: null,
    --     rest_seconds: 60
    --   }],
    --   estimated_minutes: 45,
    --   estimated_calories: 300
    -- }]

    -- 전체 통계
    total_workout_days INTEGER DEFAULT 0,
    total_estimated_minutes INTEGER DEFAULT 0,
    total_estimated_calories INTEGER DEFAULT 0,

    -- 상태
    status VARCHAR(20) DEFAULT 'active',

    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id
    ON public.workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_week
    ON public.workout_plans(user_id, week_start_date DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_workout_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_workout_plans_updated_at ON public.workout_plans;
CREATE TRIGGER trigger_workout_plans_updated_at
    BEFORE UPDATE ON public.workout_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_workout_plans_updated_at();

-- =====================================================
-- Task 2.13: workout_logs 테이블 (운동 기록)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,

    -- 완료 정보
    workout_date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    actual_duration INTEGER,
    actual_calories INTEGER,

    -- 운동별 기록 (JSON 배열)
    exercise_logs JSONB NOT NULL DEFAULT '[]',
    -- [{
    --   exercise_id: "...",
    --   exercise_name: "스쿼트",
    --   sets: [
    --     { reps: 12, weight: 40, completed: true },
    --     { reps: 10, weight: 40, completed: true }
    --   ],
    --   difficulty: 3 (1-5 체감 난이도)
    -- }]

    -- 계산된 지표
    total_volume INTEGER DEFAULT 0,
    perceived_effort INTEGER,

    -- 메모
    notes TEXT,
    mood VARCHAR(20),

    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id
    ON public.workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date
    ON public.workout_logs(user_id, workout_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_completed
    ON public.workout_logs(user_id, completed_at)
    WHERE completed_at IS NOT NULL;

-- =====================================================
-- Task 2.14: workout_streaks 테이블 (연속 기록)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.workout_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,

    -- Streak 정보
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_workout_date DATE,
    streak_start_date DATE,

    -- 배지/보상
    badges_earned JSONB DEFAULT '[]',
    milestones_reached JSONB DEFAULT '[]',

    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_workout_streaks_user_id
    ON public.workout_streaks(user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_workout_streaks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_workout_streaks_updated_at ON public.workout_streaks;
CREATE TRIGGER trigger_workout_streaks_updated_at
    BEFORE UPDATE ON public.workout_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_workout_streaks_updated_at();

-- =====================================================
-- RLS 정책 (Row Level Security)
-- =====================================================

-- workout_analyses RLS
ALTER TABLE public.workout_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout analyses"
    ON public.workout_analyses FOR SELECT
    USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own workout analyses"
    ON public.workout_analyses FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own workout analyses"
    ON public.workout_analyses FOR UPDATE
    USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can delete own workout analyses"
    ON public.workout_analyses FOR DELETE
    USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = user_id));

-- workout_plans RLS
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout plans"
    ON public.workout_plans FOR SELECT
    USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own workout plans"
    ON public.workout_plans FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own workout plans"
    ON public.workout_plans FOR UPDATE
    USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can delete own workout plans"
    ON public.workout_plans FOR DELETE
    USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = user_id));

-- workout_logs RLS
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout logs"
    ON public.workout_logs FOR SELECT
    USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own workout logs"
    ON public.workout_logs FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own workout logs"
    ON public.workout_logs FOR UPDATE
    USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can delete own workout logs"
    ON public.workout_logs FOR DELETE
    USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = user_id));

-- workout_streaks RLS
ALTER TABLE public.workout_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout streaks"
    ON public.workout_streaks FOR SELECT
    USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own workout streaks"
    ON public.workout_streaks FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own workout streaks"
    ON public.workout_streaks FOR UPDATE
    USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can delete own workout streaks"
    ON public.workout_streaks FOR DELETE
    USING (auth.uid()::text = (SELECT clerk_id FROM public.users WHERE id = user_id));

-- =====================================================
-- 권한 부여
-- =====================================================
GRANT ALL ON TABLE public.workout_analyses TO anon;
GRANT ALL ON TABLE public.workout_analyses TO authenticated;
GRANT ALL ON TABLE public.workout_analyses TO service_role;

GRANT ALL ON TABLE public.workout_plans TO anon;
GRANT ALL ON TABLE public.workout_plans TO authenticated;
GRANT ALL ON TABLE public.workout_plans TO service_role;

GRANT ALL ON TABLE public.workout_logs TO anon;
GRANT ALL ON TABLE public.workout_logs TO authenticated;
GRANT ALL ON TABLE public.workout_logs TO service_role;

GRANT ALL ON TABLE public.workout_streaks TO anon;
GRANT ALL ON TABLE public.workout_streaks TO authenticated;
GRANT ALL ON TABLE public.workout_streaks TO service_role;

-- =====================================================
-- 테이블 코멘트
-- =====================================================
COMMENT ON TABLE public.workout_analyses IS 'W-1 운동 분석 결과 저장';
COMMENT ON TABLE public.workout_plans IS 'W-1 주간 운동 계획';
COMMENT ON TABLE public.workout_logs IS 'W-1 운동 기록';
COMMENT ON TABLE public.workout_streaks IS 'W-1 연속 운동 기록 (Streak)';
