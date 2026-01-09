-- skin_analyses 테이블 확장 (이미지 동의 연결 + 피부 활력도)
-- SDD-VISUAL-SKIN-REPORT.md §4.3.2

-- 기존 테이블에 컬럼 추가 (nullable로 하위 호환성 유지)
ALTER TABLE skin_analyses
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_consent_id UUID REFERENCES image_consents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS skin_vitality_score INTEGER CHECK (skin_vitality_score BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS vitality_factors JSONB;  -- {"positive": [...], "negative": [...]}

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_skin_analyses_consent
  ON skin_analyses(image_consent_id);

-- 코멘트
COMMENT ON COLUMN skin_analyses.image_url IS '분석에 사용된 이미지 URL (동의 시에만 저장)';
COMMENT ON COLUMN skin_analyses.image_consent_id IS '연결된 이미지 동의 레코드';
COMMENT ON COLUMN skin_analyses.skin_vitality_score IS '피부 활력도 점수 (0-100)';
COMMENT ON COLUMN skin_analyses.vitality_factors IS '활력도 구성 요소 {"positive": [...], "negative": [...]}';
