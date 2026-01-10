-- ============================================================
-- 사용자 알림 설정 테이블
-- Launch + Phase B: 웹/모바일 알림 설정 동기화
-- ============================================================

-- 1. user_notification_settings: 사용자별 알림 설정
CREATE TABLE IF NOT EXISTS user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,

  -- 전체 활성화
  enabled BOOLEAN NOT NULL DEFAULT false,

  -- 운동 알림
  workout_reminder BOOLEAN NOT NULL DEFAULT true,
  workout_reminder_time TIME NOT NULL DEFAULT '09:00',
  streak_warning BOOLEAN NOT NULL DEFAULT true,

  -- 영양 알림
  nutrition_reminder BOOLEAN NOT NULL DEFAULT true,
  meal_reminder_breakfast TIME DEFAULT '08:30',
  meal_reminder_lunch TIME DEFAULT '12:30',
  meal_reminder_dinner TIME DEFAULT '18:30',
  water_reminder BOOLEAN NOT NULL DEFAULT true,
  water_reminder_interval INTEGER NOT NULL DEFAULT 2, -- 시간 단위

  -- 소셜 알림
  social_notifications BOOLEAN NOT NULL DEFAULT true,

  -- 성취 알림
  achievement_notifications BOOLEAN NOT NULL DEFAULT true,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. user_push_tokens: 모바일 푸시 토큰 (Expo)
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 같은 사용자의 같은 토큰 중복 방지
  UNIQUE (clerk_user_id, push_token)
);

-- ============================================================
-- 인덱스
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_notification_settings_user
  ON user_notification_settings(clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user
  ON user_push_tokens(clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_push_tokens_active
  ON user_push_tokens(is_active, clerk_user_id);

-- ============================================================
-- RLS 정책
-- ============================================================

ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

-- user_notification_settings RLS
CREATE POLICY "Users can view their own notification settings"
  ON user_notification_settings FOR SELECT
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own notification settings"
  ON user_notification_settings FOR INSERT
  TO authenticated
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own notification settings"
  ON user_notification_settings FOR UPDATE
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- user_push_tokens RLS
CREATE POLICY "Users can view their own push tokens"
  ON user_push_tokens FOR SELECT
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own push tokens"
  ON user_push_tokens FOR INSERT
  TO authenticated
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own push tokens"
  ON user_push_tokens FOR UPDATE
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own push tokens"
  ON user_push_tokens FOR DELETE
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- ============================================================
-- Trigger: updated_at 자동 갱신
-- ============================================================

CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_settings_updated_at
  BEFORE UPDATE ON user_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();

CREATE TRIGGER trigger_push_tokens_updated_at
  BEFORE UPDATE ON user_push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();

-- ============================================================
-- 주석
-- ============================================================

COMMENT ON TABLE user_notification_settings IS '사용자별 알림 설정 (웹/모바일 공유)';
COMMENT ON TABLE user_push_tokens IS '모바일 푸시 알림 토큰 (Expo)';

COMMENT ON COLUMN user_notification_settings.workout_reminder_time IS '운동 리마인더 시간 (HH:MM)';
COMMENT ON COLUMN user_notification_settings.water_reminder_interval IS '수분 섭취 알림 간격 (시간 단위)';
COMMENT ON COLUMN user_push_tokens.platform IS 'ios, android, web 중 하나';
