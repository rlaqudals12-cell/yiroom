-- Phase 1 RLS 정책 마이그레이션
-- F-6: 프로덕션 보안 강화
-- Created: 2025-12-22

-- =====================================================
-- 1. personal_color_assessments RLS
-- =====================================================
ALTER TABLE personal_color_assessments ENABLE ROW LEVEL SECURITY;

-- 본인 데이터 조회
CREATE POLICY "Users can view own PC assessments"
  ON personal_color_assessments
  FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인 데이터 생성
CREATE POLICY "Users can insert own PC assessments"
  ON personal_color_assessments
  FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인 데이터 수정
CREATE POLICY "Users can update own PC assessments"
  ON personal_color_assessments
  FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인 데이터 삭제
CREATE POLICY "Users can delete own PC assessments"
  ON personal_color_assessments
  FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =====================================================
-- 2. skin_analyses RLS
-- =====================================================
ALTER TABLE skin_analyses ENABLE ROW LEVEL SECURITY;

-- 본인 데이터 조회
CREATE POLICY "Users can view own skin analyses"
  ON skin_analyses
  FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인 데이터 생성
CREATE POLICY "Users can insert own skin analyses"
  ON skin_analyses
  FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인 데이터 수정
CREATE POLICY "Users can update own skin analyses"
  ON skin_analyses
  FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인 데이터 삭제
CREATE POLICY "Users can delete own skin analyses"
  ON skin_analyses
  FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =====================================================
-- 3. body_analyses RLS
-- =====================================================
ALTER TABLE body_analyses ENABLE ROW LEVEL SECURITY;

-- 본인 데이터 조회
CREATE POLICY "Users can view own body analyses"
  ON body_analyses
  FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인 데이터 생성
CREATE POLICY "Users can insert own body analyses"
  ON body_analyses
  FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인 데이터 수정
CREATE POLICY "Users can update own body analyses"
  ON body_analyses
  FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인 데이터 삭제
CREATE POLICY "Users can delete own body analyses"
  ON body_analyses
  FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =====================================================
-- 4. users 테이블 RLS (추가)
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 본인 프로필 조회
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인 프로필 수정
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 프로필 생성 (Clerk 웹훅 또는 첫 로그인 시)
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =====================================================
-- 코멘트
-- =====================================================
COMMENT ON POLICY "Users can view own PC assessments" ON personal_color_assessments
  IS 'clerk_user_id 기반 본인 데이터만 조회 가능';

COMMENT ON POLICY "Users can view own skin analyses" ON skin_analyses
  IS 'clerk_user_id 기반 본인 데이터만 조회 가능';

COMMENT ON POLICY "Users can view own body analyses" ON body_analyses
  IS 'clerk_user_id 기반 본인 데이터만 조회 가능';

COMMENT ON POLICY "Users can view own profile" ON users
  IS 'clerk_user_id 기반 본인 프로필만 조회 가능';
