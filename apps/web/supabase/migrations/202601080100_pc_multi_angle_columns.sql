-- PC-1 다각도 분석용 컬럼 추가
-- Date: 2026-01-08
-- Description: 다각도 촬영 지원을 위한 추가 컬럼

-- 좌측 이미지 URL
ALTER TABLE personal_color_assessments
ADD COLUMN IF NOT EXISTS left_image_url TEXT;

-- 우측 이미지 URL
ALTER TABLE personal_color_assessments
ADD COLUMN IF NOT EXISTS right_image_url TEXT;

-- 분석에 사용된 이미지 수
ALTER TABLE personal_color_assessments
ADD COLUMN IF NOT EXISTS images_count INT DEFAULT 1;

-- 분석 신뢰도 (high/medium/low)
ALTER TABLE personal_color_assessments
ADD COLUMN IF NOT EXISTS analysis_reliability TEXT DEFAULT 'medium'
    CHECK (analysis_reliability IN ('high', 'medium', 'low'));

-- 코멘트 추가
COMMENT ON COLUMN personal_color_assessments.left_image_url IS '좌측 얼굴 이미지 URL (다각도 분석용)';
COMMENT ON COLUMN personal_color_assessments.right_image_url IS '우측 얼굴 이미지 URL (다각도 분석용)';
COMMENT ON COLUMN personal_color_assessments.images_count IS '분석에 사용된 이미지 수 (1-3)';
COMMENT ON COLUMN personal_color_assessments.analysis_reliability IS '분석 신뢰도 (high: 다각도+손목, medium: 정면만, low: 품질 낮음)';
