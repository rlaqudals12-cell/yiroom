-- Phase J P3-B: 저장된 코디 테이블
-- 사용자가 저장한 전체 코디 (의상+악세서리+메이크업) 조합

CREATE TABLE IF NOT EXISTS saved_outfits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,

  -- 코디 정보
  outfit_id TEXT NOT NULL,           -- Mock 데이터의 outfit.id
  season_type TEXT NOT NULL,         -- spring, summer, autumn, winter
  occasion TEXT NOT NULL,            -- daily, work, date, party

  -- 스냅샷 데이터 (Mock 데이터 변경에도 저장 시점 데이터 유지)
  outfit_snapshot JSONB NOT NULL,    -- FullOutfit 전체 데이터

  -- 사용자 메모
  note TEXT,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_saved_outfits_clerk_user_id ON saved_outfits(clerk_user_id);
CREATE INDEX idx_saved_outfits_season_type ON saved_outfits(season_type);
CREATE INDEX idx_saved_outfits_occasion ON saved_outfits(occasion);
CREATE INDEX idx_saved_outfits_created_at ON saved_outfits(created_at DESC);

-- 중복 저장 방지 (같은 사용자가 같은 outfit_id를 중복 저장 불가)
CREATE UNIQUE INDEX idx_saved_outfits_unique ON saved_outfits(clerk_user_id, outfit_id);

-- RLS 정책
ALTER TABLE saved_outfits ENABLE ROW LEVEL SECURITY;

-- 자신의 저장 코디만 조회
CREATE POLICY "Users can view own saved outfits"
  ON saved_outfits FOR SELECT
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- 자신의 코디만 저장
CREATE POLICY "Users can insert own saved outfits"
  ON saved_outfits FOR INSERT
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

-- 자신의 저장 코디만 삭제
CREATE POLICY "Users can delete own saved outfits"
  ON saved_outfits FOR DELETE
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- 자신의 저장 코디만 수정 (메모 등)
CREATE POLICY "Users can update own saved outfits"
  ON saved_outfits FOR UPDATE
  USING (clerk_user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_saved_outfits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_saved_outfits_updated_at
  BEFORE UPDATE ON saved_outfits
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_outfits_updated_at();

-- 코멘트
COMMENT ON TABLE saved_outfits IS 'Phase J P3-B: 사용자 저장 코디';
COMMENT ON COLUMN saved_outfits.outfit_id IS 'Mock 데이터 outfit.id 참조';
COMMENT ON COLUMN saved_outfits.outfit_snapshot IS '저장 시점의 전체 코디 데이터 (JSONB)';
