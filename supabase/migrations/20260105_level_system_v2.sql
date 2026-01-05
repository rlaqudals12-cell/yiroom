-- Migration: 등급 시스템 v2 (활동 카운트 기반)
-- Purpose: 누적 활동 기반 레벨 시스템 (하락 없음, 미니멀 디자인)
-- Date: 2026-01-05
-- Spec: docs/SPEC-LEVEL-SYSTEM.md

-- ============================================================
-- Step 1: user_levels 테이블 확장
-- ============================================================
ALTER TABLE user_levels ADD COLUMN IF NOT EXISTS
  total_activity_count INTEGER DEFAULT 0;

ALTER TABLE user_levels ADD COLUMN IF NOT EXISTS
  level_updated_at TIMESTAMPTZ DEFAULT NOW();

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_levels_activity_count
  ON user_levels(total_activity_count);

-- ============================================================
-- Step 2: activity_logs 테이블 생성
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

  -- 활동 정보
  activity_type TEXT NOT NULL,
  activity_id UUID,  -- 원본 레코드 ID (optional)
  points INTEGER NOT NULL DEFAULT 1,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 유효성 검사
  CONSTRAINT valid_activity_type CHECK (
    activity_type IN ('workout', 'meal', 'water', 'analysis', 'review', 'checkin')
  )
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_activity_logs_user
  ON activity_logs(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date
  ON activity_logs(clerk_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type
  ON activity_logs(clerk_user_id, activity_type);

-- ============================================================
-- Step 3: RLS 정책 - activity_logs
-- ============================================================
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 삭제/수정 불가 (하락 없음 원칙)

-- ============================================================
-- Step 4: 권한 부여
-- ============================================================
GRANT SELECT, INSERT ON TABLE activity_logs TO anon;
GRANT SELECT, INSERT ON TABLE activity_logs TO authenticated;
GRANT ALL ON TABLE activity_logs TO service_role;

-- ============================================================
-- Step 5: 레벨 계산 함수
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_level_from_activity(activity_count INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE
    WHEN activity_count >= 1000 THEN 5
    WHEN activity_count >= 300 THEN 4
    WHEN activity_count >= 100 THEN 3
    WHEN activity_count >= 30 THEN 2
    ELSE 1
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- Step 6: 레벨 업데이트 트리거 함수
-- ============================================================
CREATE OR REPLACE FUNCTION update_user_level_on_activity()
RETURNS TRIGGER AS $$
DECLARE
  new_total INTEGER;
  current_level INTEGER;
  new_level INTEGER;
BEGIN
  -- 총 활동 포인트 계산
  SELECT COALESCE(SUM(points), 0) INTO new_total
  FROM activity_logs
  WHERE clerk_user_id = NEW.clerk_user_id;

  -- 현재 레벨 조회
  SELECT level INTO current_level
  FROM user_levels
  WHERE clerk_user_id = NEW.clerk_user_id;

  -- 새 레벨 계산
  new_level := calculate_level_from_activity(new_total);

  -- user_levels 레코드가 없으면 생성
  IF NOT FOUND THEN
    INSERT INTO user_levels (clerk_user_id, level, total_activity_count, level_updated_at)
    VALUES (NEW.clerk_user_id, new_level, new_total, NOW());
  -- 레벨이 상승한 경우에만 레벨 업데이트 (하락 방지)
  ELSIF new_level > COALESCE(current_level, 1) THEN
    UPDATE user_levels
    SET level = new_level,
        total_activity_count = new_total,
        level_updated_at = NOW(),
        updated_at = NOW()
    WHERE clerk_user_id = NEW.clerk_user_id;
  ELSE
    -- 활동 수만 업데이트
    UPDATE user_levels
    SET total_activity_count = new_total,
        updated_at = NOW()
    WHERE clerk_user_id = NEW.clerk_user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Step 7: 트리거 생성
-- ============================================================
DROP TRIGGER IF EXISTS on_activity_log_insert ON activity_logs;
CREATE TRIGGER on_activity_log_insert
  AFTER INSERT ON activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level_on_activity();

-- ============================================================
-- Step 8: 레벨 상수 테이블 (참조용)
-- ============================================================
CREATE TABLE IF NOT EXISTS level_definitions (
  level INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  color_name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  color_tailwind TEXT NOT NULL,
  icon TEXT NOT NULL,
  min_activity INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 레벨 정의 데이터
INSERT INTO level_definitions (level, name, color_name, color_hex, color_tailwind, icon, min_activity) VALUES
(1, 'Lv.1', 'Slate', '#94A3B8', 'slate-400', '○', 0),
(2, 'Lv.2', 'Teal', '#14B8A6', 'teal-500', '◐', 30),
(3, 'Lv.3', 'Blue', '#3B82F6', 'blue-500', '◑', 100),
(4, 'Lv.4', 'Violet', '#8B5CF6', 'violet-500', '◕', 300),
(5, 'Lv.5', 'Amber', '#F59E0B', 'amber-500', '●', 1000)
ON CONFLICT (level) DO UPDATE SET
  name = EXCLUDED.name,
  color_name = EXCLUDED.color_name,
  color_hex = EXCLUDED.color_hex,
  color_tailwind = EXCLUDED.color_tailwind,
  icon = EXCLUDED.icon,
  min_activity = EXCLUDED.min_activity;

-- RLS (모든 사용자 읽기 가능)
ALTER TABLE level_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view level definitions"
  ON level_definitions FOR SELECT
  USING (true);

GRANT SELECT ON TABLE level_definitions TO anon;
GRANT SELECT ON TABLE level_definitions TO authenticated;
GRANT ALL ON TABLE level_definitions TO service_role;

-- ============================================================
-- Step 9: 코멘트 추가
-- ============================================================
COMMENT ON TABLE activity_logs IS '사용자 활동 로그 - 레벨 계산 기준';
COMMENT ON COLUMN activity_logs.activity_type IS '활동 유형: workout, meal, water, analysis, review, checkin';
COMMENT ON COLUMN activity_logs.points IS '활동당 포인트 (기본 1, 분석 2, 리뷰 3)';
COMMENT ON COLUMN user_levels.total_activity_count IS '누적 활동 포인트 (activity_logs SUM)';
COMMENT ON COLUMN user_levels.level_updated_at IS '마지막 레벨 변경 시각';
COMMENT ON TABLE level_definitions IS '레벨 정의 참조 테이블 (색상, 아이콘 등)';
