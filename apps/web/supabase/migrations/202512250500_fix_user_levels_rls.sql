-- ============================================================
-- user_levels RLS 정책 수정
-- Phase H Sprint 2: 리더보드 기능을 위한 공개 읽기 정책 추가
-- ============================================================

-- 기존 SELECT 정책 삭제 (본인만 조회 가능 → 모두 조회 가능으로 변경)
DROP POLICY IF EXISTS "Users can view own level" ON user_levels;

-- 새로운 SELECT 정책: 모든 사용자의 레벨 조회 가능 (리더보드용)
-- 레벨 정보는 공개 데이터로 취급 (게임에서 다른 유저 레벨 보는 것과 동일)
CREATE POLICY "Anyone can view user levels"
  ON user_levels FOR SELECT
  USING (true);

-- INSERT/UPDATE 정책은 그대로 유지 (본인만 수정 가능)
-- "Users can insert own level" - 유지
-- "Users can update own level" - 유지

-- ============================================================
-- 코멘트 업데이트
-- ============================================================
COMMENT ON POLICY "Anyone can view user levels" ON user_levels IS
  '리더보드 기능을 위해 모든 사용자의 레벨/XP 정보 공개 조회 허용';
