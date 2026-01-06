-- Migration: 소셜 기능 (비동기 응원 + 커뮤니티 통계)
-- Purpose: 친구 응원 시스템 및 익명 그룹 통계
-- Date: 2026-01-06

-- ============================================================
-- Part 1: 비동기 응원 시스템
-- ============================================================

-- 응원 메시지 테이블
CREATE TABLE IF NOT EXISTS encouragements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 발신자/수신자
  from_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

  -- 메시지 정보
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'custom',  -- 'custom', 'preset', 'reaction'

  -- 관련 활동 (선택)
  activity_type TEXT,  -- 'workout', 'meal', 'water', 'checkin'
  activity_id UUID,

  -- 읽음 상태
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 자기 자신에게 응원 불가
  CONSTRAINT no_self_encouragement CHECK (from_user_id != to_user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_encouragements_to_user ON encouragements(to_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_encouragements_from_user ON encouragements(from_user_id);
CREATE INDEX IF NOT EXISTS idx_encouragements_created ON encouragements(to_user_id, created_at DESC);

-- 친구 활동 알림 테이블
CREATE TABLE IF NOT EXISTS friend_activity_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 알림 대상 (받는 사람)
  user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

  -- 활동한 친구
  friend_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

  -- 활동 정보
  activity_type TEXT NOT NULL,  -- 'workout', 'meal', 'water', 'checkin', 'level_up'
  activity_id UUID,
  activity_summary TEXT,  -- "아침 식단을 기록했어요", "운동을 완료했어요"

  -- 읽음 상태
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_friend_notifications_user ON friend_activity_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_friend_notifications_created ON friend_activity_notifications(user_id, created_at DESC);

-- ============================================================
-- Part 2: 익명 그룹 통계
-- ============================================================

-- 일일 커뮤니티 통계 (집계 캐시)
CREATE TABLE IF NOT EXISTS daily_community_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 날짜 (YYYY-MM-DD 형식)
  stat_date DATE NOT NULL UNIQUE,

  -- 활동별 카운트
  meal_records_count INTEGER DEFAULT 0,
  water_records_count INTEGER DEFAULT 0,
  workout_records_count INTEGER DEFAULT 0,
  checkin_count INTEGER DEFAULT 0,

  -- 활동 사용자 수 (중복 제거)
  active_users_count INTEGER DEFAULT 0,

  -- 메타데이터
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_community_stats_date ON daily_community_stats(stat_date DESC);

-- ============================================================
-- Part 3: RLS 정책
-- ============================================================

-- Encouragements RLS
ALTER TABLE encouragements ENABLE ROW LEVEL SECURITY;

-- 받은 응원 조회
DROP POLICY IF EXISTS "Users can view received encouragements" ON encouragements;
CREATE POLICY "Users can view received encouragements"
  ON encouragements FOR SELECT
  USING (to_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 보낸 응원 조회
DROP POLICY IF EXISTS "Users can view sent encouragements" ON encouragements;
CREATE POLICY "Users can view sent encouragements"
  ON encouragements FOR SELECT
  USING (from_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 응원 보내기 (친구에게만 - friendships 테이블 있을 때)
-- 참고: friendships 테이블이 없으면 본인 외 누구에게나 보낼 수 있음
DROP POLICY IF EXISTS "Users can send encouragements to friends" ON encouragements;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'friendships') THEN
    CREATE POLICY "Users can send encouragements to friends"
      ON encouragements FOR INSERT
      WITH CHECK (
        from_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND EXISTS (
          SELECT 1 FROM friendships
          WHERE status = 'accepted'
          AND (
            (user_id = from_user_id AND friend_id = to_user_id)
            OR (friend_id = from_user_id AND user_id = to_user_id)
          )
        )
      );
  ELSE
    -- friendships 테이블 없으면 기본 정책 (본인만 보낼 수 있음)
    CREATE POLICY "Users can send encouragements to friends"
      ON encouragements FOR INSERT
      WITH CHECK (
        from_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
      );
  END IF;
END $$;

-- 받은 응원 읽음 처리
DROP POLICY IF EXISTS "Users can update received encouragements" ON encouragements;
CREATE POLICY "Users can update received encouragements"
  ON encouragements FOR UPDATE
  USING (to_user_id = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (to_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Friend Activity Notifications RLS
ALTER TABLE friend_activity_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON friend_activity_notifications;
CREATE POLICY "Users can view own notifications"
  ON friend_activity_notifications FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own notifications" ON friend_activity_notifications;
CREATE POLICY "Users can update own notifications"
  ON friend_activity_notifications FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Daily Community Stats RLS (읽기 전용 - 모든 사용자)
ALTER TABLE daily_community_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view community stats" ON daily_community_stats;
CREATE POLICY "Anyone can view community stats"
  ON daily_community_stats FOR SELECT
  USING (true);

-- ============================================================
-- Part 4: 권한 부여
-- ============================================================

GRANT SELECT, INSERT, UPDATE ON TABLE encouragements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE friend_activity_notifications TO authenticated;
GRANT SELECT ON TABLE daily_community_stats TO authenticated;
GRANT SELECT ON TABLE daily_community_stats TO anon;

GRANT ALL ON TABLE encouragements TO service_role;
GRANT ALL ON TABLE friend_activity_notifications TO service_role;
GRANT ALL ON TABLE daily_community_stats TO service_role;

-- ============================================================
-- Part 5: 트리거 - 활동 시 친구에게 알림
-- ============================================================

CREATE OR REPLACE FUNCTION notify_friends_on_activity()
RETURNS TRIGGER AS $$
DECLARE
  friend_record RECORD;
  activity_summary TEXT;
  has_friendships BOOLEAN;
BEGIN
  -- friendships 테이블 존재 여부 확인
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'friendships'
  ) INTO has_friendships;

  -- friendships 테이블 없으면 스킵
  IF NOT has_friendships THEN
    RETURN NEW;
  END IF;

  -- 활동 요약 생성
  activity_summary := CASE TG_TABLE_NAME
    WHEN 'meal_records' THEN '식단을 기록했어요'
    WHEN 'water_records' THEN '물을 마셨어요'
    WHEN 'workout_logs' THEN '운동을 완료했어요'
    ELSE '활동을 기록했어요'
  END;

  -- 친구들에게 알림 생성
  FOR friend_record IN
    SELECT CASE
      WHEN user_id = NEW.clerk_user_id THEN friend_id
      ELSE user_id
    END AS friend_user_id
    FROM friendships
    WHERE status = 'accepted'
    AND (user_id = NEW.clerk_user_id OR friend_id = NEW.clerk_user_id)
  LOOP
    INSERT INTO friend_activity_notifications (
      user_id,
      friend_id,
      activity_type,
      activity_id,
      activity_summary
    ) VALUES (
      friend_record.friend_user_id,
      NEW.clerk_user_id,
      TG_TABLE_NAME,
      NEW.id,
      activity_summary
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (meal_records, water_records, workout_logs에 적용)
-- 주의: 이 트리거는 해당 테이블이 존재할 때만 작동
DO $$
BEGIN
  -- meal_records 트리거
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meal_records') THEN
    DROP TRIGGER IF EXISTS on_meal_record_notify_friends ON meal_records;
    CREATE TRIGGER on_meal_record_notify_friends
      AFTER INSERT ON meal_records
      FOR EACH ROW
      EXECUTE FUNCTION notify_friends_on_activity();
  END IF;

  -- water_records 트리거
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'water_records') THEN
    DROP TRIGGER IF EXISTS on_water_record_notify_friends ON water_records;
    CREATE TRIGGER on_water_record_notify_friends
      AFTER INSERT ON water_records
      FOR EACH ROW
      EXECUTE FUNCTION notify_friends_on_activity();
  END IF;

  -- workout_logs 트리거
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workout_logs') THEN
    DROP TRIGGER IF EXISTS on_workout_log_notify_friends ON workout_logs;
    CREATE TRIGGER on_workout_log_notify_friends
      AFTER INSERT ON workout_logs
      FOR EACH ROW
      EXECUTE FUNCTION notify_friends_on_activity();
  END IF;
END $$;

-- ============================================================
-- Part 6: 커뮤니티 통계 업데이트 함수
-- ============================================================

CREATE OR REPLACE FUNCTION update_daily_community_stats()
RETURNS void AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  INSERT INTO daily_community_stats (stat_date, meal_records_count, water_records_count, workout_records_count, checkin_count, active_users_count)
  VALUES (
    today,
    (SELECT COUNT(*) FROM meal_records WHERE DATE(created_at) = today),
    (SELECT COUNT(*) FROM water_records WHERE DATE(created_at) = today),
    (SELECT COUNT(*) FROM workout_logs WHERE DATE(created_at) = today),
    (SELECT COUNT(*) FROM activity_logs WHERE DATE(created_at) = today AND activity_type = 'checkin'),
    (SELECT COUNT(DISTINCT clerk_user_id) FROM activity_logs WHERE DATE(created_at) = today)
  )
  ON CONFLICT (stat_date) DO UPDATE SET
    meal_records_count = EXCLUDED.meal_records_count,
    water_records_count = EXCLUDED.water_records_count,
    workout_records_count = EXCLUDED.workout_records_count,
    checkin_count = EXCLUDED.checkin_count,
    active_users_count = EXCLUDED.active_users_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Part 7: 코멘트
-- ============================================================

COMMENT ON TABLE encouragements IS '비동기 응원 메시지 - 친구 간 응원';
COMMENT ON TABLE friend_activity_notifications IS '친구 활동 알림 - 친구가 기록 시 알림';
COMMENT ON TABLE daily_community_stats IS '일일 커뮤니티 통계 캐시 - 익명 그룹 통계';
COMMENT ON FUNCTION update_daily_community_stats() IS 'Cron으로 호출하여 일일 통계 업데이트';
