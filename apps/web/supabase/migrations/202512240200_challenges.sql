-- ============================================================
-- 챌린지 시스템 테이블
-- Phase H Sprint 4: 챌린지 시스템 구현
-- ============================================================

-- 1. challenges 테이블 (챌린지 마스터)
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,           -- 고유 코드 (예: 'workout_7day')
  name TEXT NOT NULL,                   -- 한국어 이름
  description TEXT,                     -- 설명
  icon TEXT NOT NULL DEFAULT '🏆',      -- 이모지 아이콘

  -- 유형
  domain TEXT NOT NULL,                 -- 'workout' | 'nutrition' | 'skin' | 'combined'
  duration_days INTEGER NOT NULL,       -- 기간 (일)

  -- 목표 조건 (JSONB)
  target JSONB NOT NULL DEFAULT '{}',
  -- 예: { "type": "streak", "days": 7 }
  -- 예: { "type": "count", "workouts": 5 }
  -- 예: { "type": "daily", "waterCups": 8 }

  -- 보상
  reward_xp INTEGER DEFAULT 50,
  reward_badge_id UUID REFERENCES badges(id) ON DELETE SET NULL,

  -- 메타
  difficulty TEXT DEFAULT 'easy',       -- 'easy' | 'medium' | 'hard'
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. user_challenges 테이블 (사용자 챌린지 참여)
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,

  -- 상태
  status TEXT DEFAULT 'in_progress',    -- 'in_progress' | 'completed' | 'failed' | 'abandoned'

  -- 기간
  started_at TIMESTAMPTZ DEFAULT NOW(),
  target_end_at TIMESTAMPTZ NOT NULL,   -- 목표 종료일
  completed_at TIMESTAMPTZ,             -- 실제 완료일

  -- 진행 상황 (JSONB)
  progress JSONB DEFAULT '{}',
  -- 예: { "currentDays": 5, "totalDays": 7 }
  -- 예: { "completedDays": [1, 2, 3, 5], "missedDays": [4] }

  -- 보상 수령 여부
  reward_claimed BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 동일 챌린지 중복 참여 방지 (진행 중인 경우)
  CONSTRAINT unique_active_challenge UNIQUE (clerk_user_id, challenge_id)
);

-- ============================================================
-- RLS 정책
-- ============================================================

-- challenges: 모든 사용자 조회 가능
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges"
  ON challenges FOR SELECT
  USING (is_active = true);

-- user_challenges: 본인만 조회/수정 가능
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges"
  ON user_challenges FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own challenges"
  ON user_challenges FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own challenges"
  ON user_challenges FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- ============================================================
-- 인덱스
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_challenges_domain ON challenges(domain);
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_sort ON challenges(sort_order);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON user_challenges(status);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge ON user_challenges(challenge_id);

-- ============================================================
-- 초기 챌린지 데이터 시드
-- ============================================================

INSERT INTO challenges (code, name, description, icon, domain, duration_days, target, reward_xp, difficulty, sort_order) VALUES
-- 운동 챌린지
('workout_streak_7', '7일 연속 운동', '7일 연속으로 운동을 완료하세요!', '🔥', 'workout', 7,
  '{"type": "streak", "days": 7}'::jsonb, 50, 'easy', 1),
('workout_streak_14', '14일 연속 운동', '2주 연속으로 운동을 완료하세요!', '💪', 'workout', 14,
  '{"type": "streak", "days": 14}'::jsonb, 100, 'medium', 2),
('workout_streak_30', '30일 연속 운동', '한 달 연속으로 운동을 완료하세요!', '🏆', 'workout', 30,
  '{"type": "streak", "days": 30}'::jsonb, 200, 'hard', 3),
('workout_5_per_week', '주 5회 운동', '일주일 동안 5회 운동을 완료하세요.', '⚡', 'workout', 7,
  '{"type": "count", "workouts": 5}'::jsonb, 30, 'easy', 4),
('workout_total_10', '10회 운동 완료', '30일 안에 10회 운동을 완료하세요.', '🎯', 'workout', 30,
  '{"type": "count", "workouts": 10}'::jsonb, 80, 'medium', 5),

-- 영양 챌린지
('nutrition_streak_7', '7일 연속 식단 기록', '7일 연속으로 식단을 기록하세요!', '📝', 'nutrition', 7,
  '{"type": "streak", "days": 7}'::jsonb, 50, 'easy', 10),
('nutrition_streak_14', '14일 연속 식단 기록', '2주 연속으로 식단을 기록하세요!', '📊', 'nutrition', 14,
  '{"type": "streak", "days": 14}'::jsonb, 100, 'medium', 11),
('water_8cups_7days', '7일 물 8잔 마시기', '7일 연속 매일 물 8잔을 마시세요.', '💧', 'nutrition', 7,
  '{"type": "daily", "waterCups": 8}'::jsonb, 40, 'easy', 12),
('calorie_goal_7days', '7일 칼로리 목표 달성', '7일 연속 칼로리 목표를 달성하세요.', '🥗', 'nutrition', 7,
  '{"type": "daily", "calorieGoal": true}'::jsonb, 50, 'medium', 13),
('protein_goal_14days', '14일 단백질 목표 달성', '2주 연속 단백질 목표를 달성하세요.', '🥩', 'nutrition', 14,
  '{"type": "daily", "proteinGoal": true}'::jsonb, 80, 'medium', 14),

-- 복합 챌린지
('wellness_7day', '7일 웰니스 챌린지', '7일 연속 운동과 식단 기록을 모두 완료하세요.', '✨', 'combined', 7,
  '{"type": "combined", "workout": true, "nutrition": true}'::jsonb, 100, 'medium', 20),
('total_wellness_30', '30일 토탈 웰니스', '한 달간 운동, 영양, 수분 섭취 목표를 꾸준히 달성하세요.', '🌟', 'combined', 30,
  '{"type": "combined", "workout": true, "nutrition": true, "water": true}'::jsonb, 300, 'hard', 21)

ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION update_user_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_challenges_updated_at ON user_challenges;
CREATE TRIGGER trigger_user_challenges_updated_at
  BEFORE UPDATE ON user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_user_challenges_updated_at();
