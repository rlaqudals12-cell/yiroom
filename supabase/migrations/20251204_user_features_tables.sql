-- 사용자 기능 테이블
-- user_preferences, user_agreements, user_badges, user_feedback, user_challenges

-- 사용자 선호도 테이블
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,

  -- 뷰티 선호도
  preferred_brands TEXT[] DEFAULT '{}',
  avoided_ingredients TEXT[] DEFAULT '{}',
  price_range TEXT,
  skincare_routine_level TEXT,

  -- 영양 선호도
  dietary_restrictions TEXT[] DEFAULT '{}',
  favorite_foods TEXT[] DEFAULT '{}',
  disliked_foods TEXT[] DEFAULT '{}',

  -- 운동 선호도
  preferred_workout_types TEXT[] DEFAULT '{}',
  workout_location TEXT,
  fitness_level TEXT,

  -- 알림 선호도
  notification_time TIME,
  notification_frequency TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 동의 테이블
CREATE TABLE IF NOT EXISTS user_agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  terms_agreed BOOLEAN DEFAULT false,
  terms_agreed_at TIMESTAMPTZ,
  terms_version TEXT DEFAULT '1.0',
  privacy_agreed BOOLEAN DEFAULT false,
  privacy_agreed_at TIMESTAMPTZ,
  privacy_version TEXT DEFAULT '1.0',
  marketing_agreed BOOLEAN DEFAULT false,
  marketing_agreed_at TIMESTAMPTZ,
  marketing_withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 뱃지 테이블
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, badge_id)
);

-- 사용자 피드백 테이블
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'general', 'complaint')),
  title TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 챌린지 테이블 (간단한 버전)
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  challenge_name TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 이미지 동의 테이블
CREATE TABLE IF NOT EXISTS image_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('analysis', 'storage', 'improvement')),
  consented BOOLEAN DEFAULT false,
  consented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 푸시 구독 테이블
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT,
  auth TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_agreements_user ON user_agreements(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user ON user_feedback(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_image_consents_user ON image_consents(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(clerk_user_id);

-- RLS 정책
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- user_preferences RLS
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- user_agreements RLS
CREATE POLICY "Users can view own agreements" ON user_agreements FOR SELECT USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert own agreements" ON user_agreements FOR INSERT WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update own agreements" ON user_agreements FOR UPDATE USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- user_badges RLS
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert own badges" ON user_badges FOR INSERT WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

-- user_feedback RLS
CREATE POLICY "Users can view own feedback" ON user_feedback FOR SELECT USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert feedback" ON user_feedback FOR INSERT WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

-- user_challenges RLS
CREATE POLICY "Users can view own challenges" ON user_challenges FOR SELECT USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert own challenges" ON user_challenges FOR INSERT WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update own challenges" ON user_challenges FOR UPDATE USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- image_consents RLS
CREATE POLICY "Users can view own consents" ON image_consents FOR SELECT USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert own consents" ON image_consents FOR INSERT WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update own consents" ON image_consents FOR UPDATE USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- push_subscriptions RLS
CREATE POLICY "Users can view own subscriptions" ON push_subscriptions FOR SELECT USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert own subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update own subscriptions" ON push_subscriptions FOR UPDATE USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can delete own subscriptions" ON push_subscriptions FOR DELETE USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- 코멘트
COMMENT ON TABLE user_preferences IS '사용자 선호도 설정';
COMMENT ON TABLE user_agreements IS '사용자 약관 동의';
COMMENT ON TABLE user_badges IS '사용자 획득 뱃지';
COMMENT ON TABLE user_feedback IS '사용자 피드백';
COMMENT ON TABLE user_challenges IS '사용자 챌린지 참여';
COMMENT ON TABLE image_consents IS '이미지 분석 동의';
COMMENT ON TABLE push_subscriptions IS '푸시 알림 구독';
