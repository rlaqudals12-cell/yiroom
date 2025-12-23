-- Migration: 게이미피케이션 - 배지 및 레벨 시스템
-- Purpose: 사용자 참여 유도를 위한 배지 수집 + 레벨 시스템
-- Date: 2025-12-24
-- Feature: Phase H-1 게이미피케이션

-- ============================================================
-- Step 1: badges 테이블 (배지 마스터 정의)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- 배지 식별
    code TEXT NOT NULL UNIQUE,           -- 고유 코드 (예: 'workout_streak_7day')
    name TEXT NOT NULL,                  -- 표시 이름
    description TEXT,                    -- 설명

    -- 배지 메타
    icon TEXT NOT NULL,                  -- 이모지 또는 아이콘 이름
    category TEXT NOT NULL CHECK (category IN ('streak', 'workout', 'nutrition', 'analysis', 'special')),
    rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),

    -- 획득 조건 (JSONB)
    requirement JSONB NOT NULL DEFAULT '{}',
    -- 예: {"type": "streak", "domain": "workout", "days": 7}
    -- 예: {"type": "count", "domain": "workout", "sessions": 100}
    -- 예: {"type": "complete", "domain": "analysis", "modules": ["pc", "skin", "body"]}

    -- XP 보상
    xp_reward INTEGER NOT NULL DEFAULT 10,

    -- 순서 (표시 정렬용)
    sort_order INTEGER DEFAULT 0,

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Step 2: user_badges 테이블 (사용자 배지 획득 기록)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,

    -- 획득 정보
    earned_at TIMESTAMPTZ DEFAULT NOW(),

    -- 중복 획득 방지
    UNIQUE(clerk_user_id, badge_id)
);

-- ============================================================
-- Step 3: user_levels 테이블 (사용자 레벨 및 XP)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL UNIQUE REFERENCES users(clerk_user_id) ON DELETE CASCADE,

    -- 레벨 및 XP
    level INTEGER NOT NULL DEFAULT 1,
    current_xp INTEGER NOT NULL DEFAULT 0,
    total_xp INTEGER NOT NULL DEFAULT 0,

    -- 티어 (계산 필드용 캐시)
    tier TEXT NOT NULL DEFAULT 'beginner' CHECK (tier IN ('beginner', 'practitioner', 'expert', 'master')),

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Step 4: 인덱스 생성
-- ============================================================

-- badges 인덱스
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);
CREATE INDEX IF NOT EXISTS idx_badges_code ON badges(code);

-- user_badges 인덱스
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned ON user_badges(earned_at DESC);

-- user_levels 인덱스
CREATE INDEX IF NOT EXISTS idx_user_levels_user ON user_levels(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_levels_level ON user_levels(level DESC);

-- ============================================================
-- Step 5: RLS 활성화
-- ============================================================
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Step 6: RLS 정책 - badges (모든 사용자 읽기 가능)
-- ============================================================
CREATE POLICY "Anyone can view badges"
    ON badges FOR SELECT
    USING (true);

-- ============================================================
-- Step 7: RLS 정책 - user_badges
-- ============================================================
CREATE POLICY "Users can view own badges"
    ON user_badges FOR SELECT
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own badges"
    ON user_badges FOR INSERT
    WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 삭제는 허용하지 않음 (배지 획득은 영구적)

-- ============================================================
-- Step 8: RLS 정책 - user_levels
-- ============================================================
CREATE POLICY "Users can view own level"
    ON user_levels FOR SELECT
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own level"
    ON user_levels FOR INSERT
    WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own level"
    ON user_levels FOR UPDATE
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub')
    WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================================
-- Step 9: 권한 부여
-- ============================================================
GRANT SELECT ON TABLE badges TO anon;
GRANT SELECT ON TABLE badges TO authenticated;
GRANT ALL ON TABLE badges TO service_role;

GRANT ALL ON TABLE user_badges TO anon;
GRANT ALL ON TABLE user_badges TO authenticated;
GRANT ALL ON TABLE user_badges TO service_role;

GRANT ALL ON TABLE user_levels TO anon;
GRANT ALL ON TABLE user_levels TO authenticated;
GRANT ALL ON TABLE user_levels TO service_role;

-- ============================================================
-- Step 10: 초기 배지 시드 데이터 (20개)
-- ============================================================

-- 운동 스트릭 배지 (6개)
INSERT INTO badges (code, name, description, icon, category, rarity, requirement, xp_reward, sort_order) VALUES
('workout_streak_3day', '3일 연속 운동', '3일 연속으로 운동을 기록했어요!', '🔥', 'streak', 'common', '{"type": "streak", "domain": "workout", "days": 3}', 10, 1),
('workout_streak_7day', '일주일 스트릭', '7일 연속 운동 달성! 습관이 되어가고 있어요.', '💪', 'streak', 'common', '{"type": "streak", "domain": "workout", "days": 7}', 25, 2),
('workout_streak_14day', '2주 파이터', '14일 연속 운동! 대단해요!', '🏃', 'streak', 'rare', '{"type": "streak", "domain": "workout", "days": 14}', 50, 3),
('workout_streak_30day', '한 달 챔피언', '30일 연속 운동! 진정한 챔피언이에요!', '🏆', 'streak', 'rare', '{"type": "streak", "domain": "workout", "days": 30}', 100, 4),
('workout_streak_60day', '철인의 의지', '60일 연속 운동! 철인의 의지를 가졌군요!', '⚡', 'streak', 'epic', '{"type": "streak", "domain": "workout", "days": 60}', 200, 5),
('workout_streak_100day', '레전드', '100일 연속 운동! 당신은 전설입니다!', '👑', 'streak', 'legendary', '{"type": "streak", "domain": "workout", "days": 100}', 500, 6),

-- 영양 스트릭 배지 (4개)
('nutrition_streak_3day', '3일 연속 기록', '3일 연속 식단을 기록했어요!', '📝', 'streak', 'common', '{"type": "streak", "domain": "nutrition", "days": 3}', 10, 10),
('nutrition_streak_7day', '일주일 기록러', '7일 연속 식단 기록! 꾸준해요!', '📊', 'streak', 'common', '{"type": "streak", "domain": "nutrition", "days": 7}', 25, 11),
('nutrition_streak_14day', '기록 마스터', '14일 연속 식단 기록! 훌륭해요!', '📈', 'streak', 'rare', '{"type": "streak", "domain": "nutrition", "days": 14}', 50, 12),
('nutrition_streak_30day', '식단 달인', '30일 연속 식단 기록! 달인이시네요!', '🥗', 'streak', 'rare', '{"type": "streak", "domain": "nutrition", "days": 30}', 100, 13),

-- 운동 업적 배지 (4개)
('workout_first', '첫 운동', '첫 운동을 기록했어요! 시작이 반이에요!', '🎯', 'workout', 'common', '{"type": "count", "domain": "workout", "sessions": 1}', 10, 20),
('workout_10_sessions', '열 번째 운동', '10번의 운동을 완료했어요!', '🎖️', 'workout', 'common', '{"type": "count", "domain": "workout", "sessions": 10}', 30, 21),
('workout_50_sessions', '오십 번 운동', '50번의 운동 달성! 대단해요!', '🥈', 'workout', 'rare', '{"type": "count", "domain": "workout", "sessions": 50}', 100, 22),
('workout_100_sessions', '백 번 운동', '100번의 운동 완료! 진정한 운동러!', '🥇', 'workout', 'epic', '{"type": "count", "domain": "workout", "sessions": 100}', 250, 23),

-- 영양 업적 배지 (3개)
('nutrition_first', '첫 기록', '첫 식단을 기록했어요!', '🍽️', 'nutrition', 'common', '{"type": "count", "domain": "nutrition", "records": 1}', 10, 30),
('nutrition_balanced_week', '균형 잡힌 일주일', '일주일 동안 영양 균형을 유지했어요!', '⚖️', 'nutrition', 'rare', '{"type": "balance", "domain": "nutrition", "days": 7}', 50, 31),
('water_goal_week', '물 마시기 달인', '일주일 동안 수분 섭취 목표를 달성했어요!', '💧', 'nutrition', 'rare', '{"type": "water", "domain": "nutrition", "days": 7}', 50, 32),

-- 분석 완료 배지 (3개)
('analysis_pc_complete', '퍼스널 컬러 마스터', '퍼스널 컬러 분석을 완료했어요!', '🎨', 'analysis', 'common', '{"type": "complete", "domain": "analysis", "module": "personal-color"}', 20, 40),
('analysis_skin_complete', '피부 분석 완료', '피부 분석을 완료했어요!', '✨', 'analysis', 'common', '{"type": "complete", "domain": "analysis", "module": "skin"}', 20, 41),
('analysis_body_complete', '체형 분석 완료', '체형 분석을 완료했어요!', '📐', 'analysis', 'common', '{"type": "complete", "domain": "analysis", "module": "body"}', 20, 42)

ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Step 11: 코멘트 추가
-- ============================================================
COMMENT ON TABLE badges IS '배지 마스터 테이블 - 달성 가능한 모든 배지 정의';
COMMENT ON COLUMN badges.code IS '배지 고유 코드 (예: workout_streak_7day)';
COMMENT ON COLUMN badges.category IS '카테고리: streak(연속), workout(운동), nutrition(영양), analysis(분석), special(특별)';
COMMENT ON COLUMN badges.rarity IS '희귀도: common(일반), rare(레어), epic(에픽), legendary(전설)';
COMMENT ON COLUMN badges.requirement IS '획득 조건 JSON (예: {"type": "streak", "days": 7})';
COMMENT ON COLUMN badges.xp_reward IS '획득 시 보상 XP';

COMMENT ON TABLE user_badges IS '사용자 배지 획득 기록';
COMMENT ON COLUMN user_badges.earned_at IS '배지 획득 시각';

COMMENT ON TABLE user_levels IS '사용자 레벨 및 XP 정보';
COMMENT ON COLUMN user_levels.level IS '현재 레벨 (1부터 시작)';
COMMENT ON COLUMN user_levels.current_xp IS '현재 레벨에서 획득한 XP';
COMMENT ON COLUMN user_levels.total_xp IS '누적 총 XP';
COMMENT ON COLUMN user_levels.tier IS '티어: beginner(1-10), practitioner(11-30), expert(31-50), master(51+)';
