-- Migration: daily_checkins 테이블 생성
-- Purpose: 일일 체크인 (기분/에너지/피부 상태 기록)
-- Date: 2025-12-22
-- Feature: DailyCheckin 컴포넌트

-- Step 1: daily_checkins 테이블 생성
CREATE TABLE IF NOT EXISTS public.daily_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

    -- 체크인 데이터
    mood TEXT NOT NULL CHECK (mood IN ('great', 'okay', 'bad')),
    energy TEXT NOT NULL CHECK (energy IN ('high', 'medium', 'low')),
    skin_condition TEXT NOT NULL CHECK (skin_condition IN ('great', 'okay', 'bad')),

    -- 추가 메모 (선택적)
    notes TEXT,

    -- 체크인 시간
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- 하루에 하나의 체크인만 허용
    UNIQUE(clerk_user_id, check_date)
);

-- Step 2: 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user
    ON daily_checkins(clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_date
    ON daily_checkins(check_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date
    ON daily_checkins(clerk_user_id, check_date DESC);

-- Step 3: Row Level Security (RLS) 활성화
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS 정책 생성
CREATE POLICY "Users can view own daily checkins"
    ON daily_checkins FOR SELECT
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own daily checkins"
    ON daily_checkins FOR INSERT
    WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own daily checkins"
    ON daily_checkins FOR UPDATE
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub')
    WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own daily checkins"
    ON daily_checkins FOR DELETE
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Step 5: 권한 부여
GRANT ALL ON TABLE daily_checkins TO anon;
GRANT ALL ON TABLE daily_checkins TO authenticated;
GRANT ALL ON TABLE daily_checkins TO service_role;

-- Step 6: 코멘트 추가
COMMENT ON TABLE daily_checkins IS '일일 체크인 - 오늘의 나 기록';
COMMENT ON COLUMN daily_checkins.mood IS '기분 상태: great(좋아요), okay(보통), bad(안좋아요)';
COMMENT ON COLUMN daily_checkins.energy IS '에너지 레벨: high(활력), medium(적당), low(피곤)';
COMMENT ON COLUMN daily_checkins.skin_condition IS '피부 상태: great(촉촉), okay(괜찮음), bad(건조/트러블)';
COMMENT ON COLUMN daily_checkins.notes IS '추가 메모 (선택적)';
COMMENT ON COLUMN daily_checkins.check_date IS '체크인 날짜 (하루 1회 제한용)';
