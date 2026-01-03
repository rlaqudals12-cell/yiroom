-- 시각 분석 데이터 테이블
-- SDD: SDD-VISUAL-ANALYSIS-ENGINE.md Phase 4
-- 용도: MediaPipe 랜드마크, 색소 분석, 드레이핑 결과 저장

-- 테이블 존재 여부 확인 후 생성
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analysis_visual_data') THEN

    CREATE TABLE analysis_visual_data (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clerk_user_id TEXT NOT NULL,

      -- 연결 (둘 중 하나 또는 둘 다)
      skin_analysis_id UUID REFERENCES skin_analyses(id) ON DELETE SET NULL,
      personal_color_id UUID REFERENCES personal_color_assessments(id) ON DELETE SET NULL,

      -- MediaPipe 랜드마크 (468개 3D 좌표) - 최근 5회만 유지
      landmark_data JSONB NOT NULL,
      -- 예: { "landmarks": [[x, y, z], ...], "face_oval": [...], "left_eye": [...] }

      -- 색소 분석 결과 (S-1+)
      pigment_analysis JSONB,
      -- 예: { "melanin_avg": 0.45, "hemoglobin_avg": 0.32, "distribution": [...] }

      -- 드레이핑 결과 (PC-1+)
      draping_results JSONB,
      -- 예: { "best_colors": ["#FF7F50", ...], "uniformity_scores": {...}, "metal_test": "gold" }

      -- 시너지 분석
      synergy_insight JSONB,
      -- 예: { "message": "...", "color_adjustment": "muted", "reason": "high_redness" }

      -- 메타데이터
      analysis_mode TEXT CHECK (analysis_mode IN ('basic', 'standard', 'detailed')),
      device_tier TEXT CHECK (device_tier IN ('high', 'medium', 'low')),
      device_info JSONB, -- { "userAgent": "...", "screen": {...} }
      processing_time_ms INTEGER,

      created_at TIMESTAMPTZ DEFAULT now(),

      -- users 테이블 연결
      CONSTRAINT fk_visual_user FOREIGN KEY (clerk_user_id)
        REFERENCES users(clerk_user_id) ON DELETE CASCADE
    );

    -- 인덱스 생성
    CREATE INDEX idx_visual_data_user ON analysis_visual_data(clerk_user_id);
    CREATE INDEX idx_visual_data_skin ON analysis_visual_data(skin_analysis_id);
    CREATE INDEX idx_visual_data_color ON analysis_visual_data(personal_color_id);
    CREATE INDEX idx_visual_data_created ON analysis_visual_data(created_at DESC);

    RAISE NOTICE 'analysis_visual_data 테이블 생성 완료';

  ELSE
    RAISE NOTICE 'analysis_visual_data 테이블이 이미 존재합니다';
  END IF;
END $$;

-- RLS 활성화
ALTER TABLE analysis_visual_data ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (조건부 생성)
DO $$
BEGIN
  -- SELECT 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'analysis_visual_data' AND policyname = 'Users can view own visual data'
  ) THEN
    CREATE POLICY "Users can view own visual data" ON analysis_visual_data
      FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');
  END IF;

  -- INSERT 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'analysis_visual_data' AND policyname = 'Users can insert own visual data'
  ) THEN
    CREATE POLICY "Users can insert own visual data" ON analysis_visual_data
      FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');
  END IF;

  -- UPDATE 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'analysis_visual_data' AND policyname = 'Users can update own visual data'
  ) THEN
    CREATE POLICY "Users can update own visual data" ON analysis_visual_data
      FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');
  END IF;

  -- DELETE 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'analysis_visual_data' AND policyname = 'Users can delete own visual data'
  ) THEN
    CREATE POLICY "Users can delete own visual data" ON analysis_visual_data
      FOR DELETE USING (clerk_user_id = auth.jwt() ->> 'sub');
  END IF;
END $$;

-- 랜드마크 데이터 정리 함수 (사용자당 최근 5회만 유지)
CREATE OR REPLACE FUNCTION cleanup_old_visual_data()
RETURNS void AS $$
BEGIN
  -- 90일 이상 된 데이터 삭제
  DELETE FROM analysis_visual_data
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- 사용자당 최근 5회 초과 데이터 삭제 (랜드마크 용량 관리)
  DELETE FROM analysis_visual_data
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (
        PARTITION BY clerk_user_id ORDER BY created_at DESC
      ) as rn
      FROM analysis_visual_data
    ) ranked
    WHERE rn > 5
  );
END;
$$ LANGUAGE plpgsql;

-- 정리 함수 권한 설정
GRANT EXECUTE ON FUNCTION cleanup_old_visual_data() TO service_role;

-- 코멘트
COMMENT ON TABLE analysis_visual_data IS '시각 분석 데이터 (S-1+ 광원 시뮬레이션, PC-1+ 드레이핑)';
COMMENT ON COLUMN analysis_visual_data.landmark_data IS 'MediaPipe 468개 3D 랜드마크 좌표';
COMMENT ON COLUMN analysis_visual_data.pigment_analysis IS '멜라닌/헤모글로빈 색소 분석 결과';
COMMENT ON COLUMN analysis_visual_data.draping_results IS '드레이핑 시뮬레이션 결과 (베스트 컬러, 균일도)';
COMMENT ON COLUMN analysis_visual_data.synergy_insight IS 'S-1 → PC-1 시너지 인사이트';
