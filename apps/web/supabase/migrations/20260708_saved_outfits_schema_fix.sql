-- Migration: saved_outfits 스키마 충돌 해소
-- Date: 2026-07-08
-- Author: Claude Code
-- Purpose:
--   prod의 saved_outfits는 옷장 코디용 `item_ids UUID[] NOT NULL` +
--   `occasion CHECK (casual/formal/workout/date/travel)`를 가지는데,
--   /outfit(스타일링 스냅샷 저장)은 item_ids 없이 occasion 'daily'/'work'/'party'로
--   INSERT하므로 NOT NULL·CHECK 위반으로 저장이 항상 실패했다.
--   두 용도(옷장 코디 행 / 스타일링 스냅샷 행)가 공존할 수 있도록 완화한다.
-- Rollback (하단 주석 참조)

-- 1. item_ids: 환경 수렴 (로컬 202601110700 스키마엔 컬럼 자체가 없음)
--    + 기본값 빈 배열 + NULL 허용 — 스냅샷 저장 행은 item_ids가 필요 없다
ALTER TABLE saved_outfits ADD COLUMN IF NOT EXISTS item_ids UUID[] DEFAULT '{}'::uuid[];
ALTER TABLE saved_outfits ALTER COLUMN item_ids SET DEFAULT '{}'::uuid[];
ALTER TABLE saved_outfits ALTER COLUMN item_ids DROP NOT NULL;

-- 1-b. outfit_snapshot: 옷장 코디 행은 스냅샷이 없다 (prod에 NULL 행 실존) —
--      로컬 202601110700의 NOT NULL을 완화해 두 행 형태 공존을 허용
ALTER TABLE saved_outfits ALTER COLUMN outfit_snapshot DROP NOT NULL;

-- 2. occasion CHECK 확장: 기존 옷장 5종 + /outfit(FullOutfit)이 실제 사용하는 값
--    /outfit 사용 값 = OutfitOccasion('daily' | 'work' | 'date' | 'party') — types/styling.ts
--    기존 제약 이름이 환경마다 다를 수 있어 occasion을 참조하는 CHECK를 찾아 제거 후 재생성
DO $$
DECLARE
  v_constraint_name TEXT;
BEGIN
  SELECT con.conname INTO v_constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'saved_outfits'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%occasion%';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE saved_outfits DROP CONSTRAINT %I', v_constraint_name);
  END IF;
END $$;

ALTER TABLE saved_outfits
  ADD CONSTRAINT saved_outfits_occasion_check
  CHECK (
    occasion IN (
      -- 옷장 코디 (기존)
      'casual', 'formal', 'workout', 'date', 'travel',
      -- /outfit 스타일링 스냅샷 (OutfitOccasion)
      'daily', 'work', 'party'
    )
  );

COMMENT ON CONSTRAINT saved_outfits_occasion_check ON saved_outfits IS
  '옷장 코디(casual/formal/workout/date/travel) + 스타일링 스냅샷(daily/work/date/party) 겸용';

-- ============================================
-- Rollback:
-- ALTER TABLE saved_outfits DROP CONSTRAINT IF EXISTS saved_outfits_occasion_check;
-- ALTER TABLE saved_outfits
--   ADD CONSTRAINT saved_outfits_occasion_check
--   CHECK (occasion IN ('casual', 'formal', 'workout', 'date', 'travel'));
-- ALTER TABLE saved_outfits ALTER COLUMN item_ids DROP DEFAULT;
-- ALTER TABLE saved_outfits ALTER COLUMN item_ids SET NOT NULL;  -- 주의: NULL 행 존재 시 실패
-- ============================================
