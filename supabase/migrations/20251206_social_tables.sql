-- 소셜 기능 테이블 (Phase H)
-- friendships, wellness_scores, leaderboard_cache

-- 친구 관계 테이블
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  friend_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- 웰니스 점수 테이블
CREATE TABLE IF NOT EXISTS wellness_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  score_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_score INTEGER DEFAULT 0,
  workout_score INTEGER DEFAULT 0,
  nutrition_score INTEGER DEFAULT 0,
  sleep_score INTEGER DEFAULT 0,
  mental_score INTEGER DEFAULT 0,
  breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, score_date)
);

-- 리더보드 캐시 테이블
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('workout', 'nutrition', 'wellness', 'streak')),
  time_period TEXT NOT NULL CHECK (time_period IN ('daily', 'weekly', 'monthly', 'all_time')),
  clerk_user_id TEXT NOT NULL,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(leaderboard_type, time_period, clerk_user_id)
);

-- 챌린지 테이블
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('workout', 'nutrition', 'wellness', 'custom')),
  goal_type TEXT NOT NULL CHECK (goal_type IN ('count', 'streak', 'duration', 'score')),
  goal_value INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  is_team_challenge BOOLEAN DEFAULT false,
  max_participants INTEGER,
  reward_xp INTEGER DEFAULT 0,
  reward_badge TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 챌린지 참여 테이블
CREATE TABLE IF NOT EXISTS challenge_participations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  team_id UUID,
  current_progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, clerk_user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_wellness_scores_user_date ON wellness_scores(clerk_user_id, score_date);
CREATE INDEX IF NOT EXISTS idx_leaderboard_type_period ON leaderboard_cache(leaderboard_type, time_period);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_user ON challenge_participations(clerk_user_id);

-- RLS 정책
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participations ENABLE ROW LEVEL SECURITY;

-- friendships RLS
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (user_id = (auth.jwt() ->> 'sub') OR friend_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can create friend requests"
  ON friendships FOR INSERT
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own friendships"
  ON friendships FOR UPDATE
  USING (user_id = (auth.jwt() ->> 'sub') OR friend_id = (auth.jwt() ->> 'sub'));

-- wellness_scores RLS
CREATE POLICY "Users can view own wellness scores"
  ON wellness_scores FOR SELECT
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own wellness scores"
  ON wellness_scores FOR INSERT
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own wellness scores"
  ON wellness_scores FOR UPDATE
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- leaderboard_cache RLS (공개)
CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard_cache FOR SELECT
  USING (true);

-- challenges RLS
CREATE POLICY "Anyone can view active challenges"
  ON challenges FOR SELECT
  USING (is_active = true);

-- challenge_participations RLS
CREATE POLICY "Users can view own participations"
  ON challenge_participations FOR SELECT
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can join challenges"
  ON challenge_participations FOR INSERT
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own participations"
  ON challenge_participations FOR UPDATE
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- 코멘트
COMMENT ON TABLE friendships IS '친구 관계 - 친구 요청 및 수락';
COMMENT ON TABLE wellness_scores IS '웰니스 점수 - 일일 종합 점수';
COMMENT ON TABLE leaderboard_cache IS '리더보드 캐시 - 순위 캐싱';
COMMENT ON TABLE challenges IS '챌린지 - 챌린지 템플릿';
COMMENT ON TABLE challenge_participations IS '챌린지 참여 - 사용자별 참여 현황';
