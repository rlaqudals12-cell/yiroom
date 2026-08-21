-- Smart Matching 알림의 인증 사용자 쓰기 정책
-- 왜: 기존 API는 본인 행만 만들고 지우지만 테이블에는 SELECT/UPDATE 정책만 있어
-- 모바일의 알림 생성·삭제가 항상 RLS에서 거부되었다.

DROP POLICY IF EXISTS "Users can insert own notifications" ON smart_notifications;
CREATE POLICY "Users can insert own notifications"
  ON smart_notifications
  FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users can delete own notifications" ON smart_notifications;
CREATE POLICY "Users can delete own notifications"
  ON smart_notifications
  FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Rollback:
-- DROP POLICY IF EXISTS "Users can insert own notifications" ON smart_notifications;
-- DROP POLICY IF EXISTS "Users can delete own notifications" ON smart_notifications;
