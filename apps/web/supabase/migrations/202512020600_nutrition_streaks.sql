-- Migration: nutrition_streaks 테이블 생성
-- Purpose: N-1 영양 관리 연속 기록 (Streak)
-- Date: 2025-12-02
-- Sprint: Sprint 2 (Task 2.0-f)

-- Step 1: nutrition_streaks 테이블 생성
CREATE TABLE IF NOT EXISTS public.nutrition_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

    -- Streak 정보
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_record_date DATE,
    streak_start_date DATE,

    -- 배지 및 마일스톤
    badges_earned JSONB DEFAULT '[]',
    milestones_reached JSONB DEFAULT '[]',

    -- 프리미엄 보상 (획득한 보상 기록)
    premium_rewards_claimed JSONB DEFAULT '[]',

    -- 통계
    total_days_logged INTEGER DEFAULT 0,
    total_meals_logged INTEGER DEFAULT 0,

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- 사용자당 하나
    UNIQUE(clerk_user_id)
);

-- Step 2: 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_nutrition_streaks_user
    ON nutrition_streaks(clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_nutrition_streaks_current
    ON nutrition_streaks(current_streak DESC);

-- Step 3: Row Level Security (RLS) 활성화
ALTER TABLE nutrition_streaks ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS 정책 생성
CREATE POLICY "Users can view own nutrition streaks"
    ON nutrition_streaks FOR SELECT
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own nutrition streaks"
    ON nutrition_streaks FOR INSERT
    WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own nutrition streaks"
    ON nutrition_streaks FOR UPDATE
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub')
    WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own nutrition streaks"
    ON nutrition_streaks FOR DELETE
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Step 5: updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_nutrition_streaks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_nutrition_streaks_updated_at
    BEFORE UPDATE ON nutrition_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_nutrition_streaks_updated_at();

-- Step 6: 권한 부여
GRANT ALL ON TABLE nutrition_streaks TO anon;
GRANT ALL ON TABLE nutrition_streaks TO authenticated;
GRANT ALL ON TABLE nutrition_streaks TO service_role;

-- Step 7: 코멘트 추가
COMMENT ON TABLE nutrition_streaks IS 'N-1 영양 관리 연속 기록 (Streak)';
COMMENT ON COLUMN nutrition_streaks.current_streak IS '현재 연속 일수';
COMMENT ON COLUMN nutrition_streaks.longest_streak IS '최장 연속 기록';
COMMENT ON COLUMN nutrition_streaks.last_record_date IS '마지막 기록 날짜';
COMMENT ON COLUMN nutrition_streaks.badges_earned IS '획득한 배지 배열 [{badge_id, badge_name, earned_at}]';
COMMENT ON COLUMN nutrition_streaks.milestones_reached IS '달성한 마일스톤 배열';
COMMENT ON COLUMN nutrition_streaks.premium_rewards_claimed IS '프리미엄 보상 기록 [{type, claimed_at}]';
