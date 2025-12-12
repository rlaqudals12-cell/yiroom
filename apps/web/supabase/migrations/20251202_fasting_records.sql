-- Migration: fasting_records 테이블 생성
-- Purpose: N-1 간헐적 단식 기록 (Task 2.18)
-- Date: 2025-12-02
-- Sprint: Sprint 2

-- Step 1: fasting_records 테이블 생성
CREATE TABLE IF NOT EXISTS fasting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 단식 시간 정보
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  target_hours INTEGER NOT NULL,
  actual_hours DECIMAL(4,1),

  -- 완료 상태
  is_completed BOOLEAN DEFAULT FALSE,

  -- 메모
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_fasting_records_clerk_user ON fasting_records(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_fasting_records_start ON fasting_records(clerk_user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_fasting_records_completed ON fasting_records(clerk_user_id, is_completed);

-- Step 3: RLS 정책 활성화
ALTER TABLE fasting_records ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS 정책 생성 (clerk_user_id 기반)
CREATE POLICY "Users can view own fasting_records"
  ON fasting_records FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own fasting_records"
  ON fasting_records FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own fasting_records"
  ON fasting_records FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own fasting_records"
  ON fasting_records FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Step 5: 코멘트 추가
COMMENT ON TABLE fasting_records IS 'N-1 간헐적 단식 기록';
COMMENT ON COLUMN fasting_records.clerk_user_id IS 'Clerk 사용자 ID';
COMMENT ON COLUMN fasting_records.start_time IS '단식 시작 시간';
COMMENT ON COLUMN fasting_records.end_time IS '단식 종료 시간';
COMMENT ON COLUMN fasting_records.target_hours IS '목표 단식 시간';
COMMENT ON COLUMN fasting_records.actual_hours IS '실제 단식 시간';
COMMENT ON COLUMN fasting_records.is_completed IS '완료 여부';
COMMENT ON COLUMN fasting_records.notes IS '메모';
