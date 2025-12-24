-- ============================================================
-- 리더보드 테이블
-- Phase H Sprint 2: 랭킹 시스템
-- ============================================================

-- 1. leaderboard_cache 테이블 (성능 최적화용 캐시)
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기간 정보
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'all_time')),
  category TEXT NOT NULL CHECK (category IN ('workout', 'nutrition', 'wellness', 'xp', 'level')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- 랭킹 데이터 (JSONB)
  rankings JSONB NOT NULL DEFAULT '[]',
  -- 예: [
  --   { "rank": 1, "userId": "...", "displayName": "...", "score": 100, "avatarUrl": "..." },
  --   { "rank": 2, "userId": "...", "displayName": "...", "score": 95, "avatarUrl": "..." }
  -- ]

  -- 총 참가자 수
  total_participants INTEGER DEFAULT 0,

  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 중복 방지
  CONSTRAINT unique_leaderboard UNIQUE (period, category, start_date)
);

-- ============================================================
-- RLS 정책
-- ============================================================

ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 조회 가능 (공개 리더보드)
CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard_cache FOR SELECT
  USING (true);

-- Service Role만 수정 가능
CREATE POLICY "Service role can manage leaderboard"
  ON leaderboard_cache FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- ============================================================
-- 인덱스
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard_cache(period);
CREATE INDEX IF NOT EXISTS idx_leaderboard_category ON leaderboard_cache(category);
CREATE INDEX IF NOT EXISTS idx_leaderboard_dates ON leaderboard_cache(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leaderboard_lookup ON leaderboard_cache(period, category, start_date);

-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION update_leaderboard_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_leaderboard_cache_updated_at ON leaderboard_cache;
CREATE TRIGGER trigger_leaderboard_cache_updated_at
  BEFORE UPDATE ON leaderboard_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard_cache_updated_at();
