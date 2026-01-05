-- =============================================================================
-- 통합 사용자 선호/기피 시스템 (User Preferences)
-- @description 영양/운동/뷰티/컬러 도메인 통합 Preference 테이블
-- @version 1.1
-- @see docs/SDD-USER-PREFERENCES.md
-- =============================================================================

-- 테이블 존재 여부 체크 후 생성
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') THEN

    -- 통합 사용자 선호/기피 테이블
    CREATE TABLE user_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clerk_user_id TEXT NOT NULL,

      -- 분류
      domain TEXT NOT NULL,           -- beauty, style, nutrition, workout, color
      item_type TEXT NOT NULL,        -- ingredient, food, exercise, etc.

      -- 항목 정보
      item_id UUID,                   -- FK (옵션: 각 도메인 테이블 참조)
      item_name TEXT NOT NULL,
      item_name_en TEXT,

      -- 선호/기피
      is_favorite BOOLEAN NOT NULL DEFAULT true,

      -- 기피 상세 (i18n 친화적)
      avoid_level TEXT,               -- dislike, avoid, cannot, danger (일상어 기반)
      avoid_reason TEXT,              -- allergy, injury, religious, taste, etc.
      avoid_note TEXT,

      -- 메타
      priority INTEGER DEFAULT 3,     -- 1-5
      source TEXT DEFAULT 'user',     -- user, analysis, recommendation
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),

      -- 제약 조건
      CONSTRAINT user_preferences_unique
        UNIQUE (clerk_user_id, domain, item_type, item_name),
      CONSTRAINT user_preferences_avoid_level_check
        CHECK (avoid_level IS NULL OR avoid_level IN ('dislike', 'avoid', 'cannot', 'danger')),
      CONSTRAINT user_preferences_domain_check
        CHECK (domain IN ('beauty', 'style', 'nutrition', 'workout', 'color')),
      CONSTRAINT user_preferences_priority_check
        CHECK (priority >= 1 AND priority <= 5)
    );

    -- 코멘트
    COMMENT ON TABLE user_preferences IS '통합 사용자 선호/기피 시스템';
    COMMENT ON COLUMN user_preferences.domain IS '도메인: beauty, style, nutrition, workout, color';
    COMMENT ON COLUMN user_preferences.item_type IS '아이템 타입: ingredient, food, exercise, etc.';
    COMMENT ON COLUMN user_preferences.is_favorite IS 'true=좋아함, false=기피';
    COMMENT ON COLUMN user_preferences.avoid_level IS '기피 수준: dislike(비선호), avoid(회피), cannot(불가), danger(위험)';
    COMMENT ON COLUMN user_preferences.avoid_reason IS '기피 이유: allergy, injury, religious, taste, etc.';

    RAISE NOTICE 'Created table: user_preferences';

  ELSE
    RAISE NOTICE 'Table user_preferences already exists, skipping creation';
  END IF;
END $$;

-- =============================================================================
-- RLS 정책
-- =============================================================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 생성
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can create their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON user_preferences;

-- SELECT: 본인 데이터만 조회
CREATE POLICY "Users can view their own preferences"
  ON user_preferences
  FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- INSERT: 본인 데이터만 추가
CREATE POLICY "Users can create their own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- UPDATE: 본인 데이터만 수정
CREATE POLICY "Users can update their own preferences"
  ON user_preferences
  FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- DELETE: 본인 데이터만 삭제
CREATE POLICY "Users can delete their own preferences"
  ON user_preferences
  FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- =============================================================================
-- 인덱스
-- =============================================================================

-- 인덱스 존재 여부 체크 후 생성
DO $$
BEGIN
  -- 사용자별 조회
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_preferences_user') THEN
    CREATE INDEX idx_user_preferences_user ON user_preferences(clerk_user_id);
    RAISE NOTICE 'Created index: idx_user_preferences_user';
  END IF;

  -- 도메인별 조회
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_preferences_domain') THEN
    CREATE INDEX idx_user_preferences_domain ON user_preferences(domain, item_type);
    RAISE NOTICE 'Created index: idx_user_preferences_domain';
  END IF;

  -- 선호/기피 필터
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_preferences_favorite') THEN
    CREATE INDEX idx_user_preferences_favorite ON user_preferences(clerk_user_id, is_favorite);
    RAISE NOTICE 'Created index: idx_user_preferences_favorite';
  END IF;

  -- 위험/불가 항목 빠른 조회 (부분 인덱스)
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_preferences_critical') THEN
    CREATE INDEX idx_user_preferences_critical ON user_preferences(clerk_user_id, avoid_level)
      WHERE avoid_level IN ('cannot', 'danger');
    RAISE NOTICE 'Created index: idx_user_preferences_critical';
  END IF;
END $$;

-- =============================================================================
-- updated_at 자동 갱신 트리거
-- =============================================================================

-- 트리거 함수 (재사용)
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();
