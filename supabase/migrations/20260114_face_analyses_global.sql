-- Migration: F-1 얼굴형 분석 테이블 (글로벌 다민족 지원)
-- Purpose: 전 세계 인종의 얼굴형, 이목구비, 스타일 퍼스널리티 분석 결과 저장
-- Date: 2026-01-14
-- Related Spec: SDD-GLOBAL-DESIGN-SPECIFICATION.md

-- ============================================
-- F-1 얼굴형 분석 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS face_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 이미지 (PC-1 재사용 가능)
  face_image_url TEXT NOT NULL,
  reused_from_pc_id UUID, -- PC-1 이미지 재사용 시 참조

  -- ============================================
  -- 글로벌 다민족 지원 필드
  -- ============================================

  -- 인종/민족 (자동 감지, 선택적)
  ethnicity TEXT CHECK (ethnicity IN (
    'east_asian',      -- 동아시아 (한국, 중국, 일본)
    'southeast_asian', -- 동남아시아 (베트남, 태국, 필리핀)
    'south_asian',     -- 남아시아 (인도, 파키스탄)
    'caucasian',       -- 유럽/백인
    'african',         -- 아프리카
    'hispanic',        -- 중남미
    'middle_eastern',  -- 중동
    'mixed'            -- 혼혈
  )),

  -- Monk Scale 스킨톤 (10단계, Google 표준)
  skin_tone TEXT CHECK (skin_tone IN (
    'monk_01', 'monk_02', 'monk_03', 'monk_04', 'monk_05',
    'monk_06', 'monk_07', 'monk_08', 'monk_09', 'monk_10'
  )),

  -- ============================================
  -- 얼굴형 분석 결과
  -- ============================================

  face_shape TEXT CHECK (face_shape IN (
    'oval',     -- 계란형
    'round',    -- 둥근형
    'square',   -- 각진형
    'oblong',   -- 긴형
    'heart',    -- 하트형
    'diamond'   -- 다이아몬드형
  )),
  face_shape_confidence INT CHECK (face_shape_confidence BETWEEN 0 AND 100),

  -- ============================================
  -- 측정값
  -- ============================================

  forehead_width FLOAT,
  cheekbone_width FLOAT,
  jawline_width FLOAT,
  face_length FLOAT,
  length_width_ratio FLOAT,
  forehead_jawline_ratio FLOAT,

  -- 얼굴 삼등분 비율
  upper_face_ratio FLOAT,  -- 이마~눈썹
  middle_face_ratio FLOAT, -- 눈썹~코끝
  lower_face_ratio FLOAT,  -- 코끝~턱끝

  -- ============================================
  -- 눈 분석 (글로벌 8종 쌍꺼풀 지원)
  -- ============================================

  eye_shape TEXT CHECK (eye_shape IN (
    'almond',     -- 아몬드형
    'round',      -- 둥근형
    'downturned', -- 처진눈
    'upturned'    -- 올라간눈
  )),

  eye_spacing TEXT CHECK (eye_spacing IN (
    'close',    -- 가까움
    'standard', -- 표준
    'wide'      -- 넓음
  )),

  -- 글로벌 확장 쌍꺼풀 유형 (8종)
  eyelid_type TEXT CHECK (eyelid_type IN (
    -- 동아시아 유형 (기존 5종)
    'monolid',     -- 무쌍 (홑꺼풀)
    'inner',       -- 속쌍 (안쪽 쌍꺼풀)
    'inline',      -- 인라인
    'in-outline',  -- 인아웃라인
    'outline',     -- 아웃라인
    -- 글로벌 추가 유형 (3종)
    'hooded',      -- 후드형 (눈꺼풀이 덮음)
    'deep_set',    -- 깊은눈 (눈두덩이 깊음)
    'prominent'    -- 돌출형 (눈두덩이 튀어나옴)
  )),

  -- ============================================
  -- 코 분석 (글로벌 확장)
  -- ============================================

  nose_type TEXT CHECK (nose_type IN (
    -- 동아시아 유형
    'flat',        -- 납작한 코
    'low_bridge',  -- 낮은 콧대
    -- 유럽/중동 유형
    'high_bridge', -- 높은 콧대
    'roman',       -- 로만노즈 (중간에 볼록)
    'aquiline',    -- 매부리코
    -- 아프리카/남아시아 유형
    'wide_alar',   -- 넓은 코날개
    'nubian',      -- 누비안 (길고 넓음)
    -- 공통 유형
    'button',      -- 들창코
    'straight'     -- 직선형
  )),

  nose_length_ratio FLOAT,
  nose_width TEXT CHECK (nose_width IN ('narrow', 'standard', 'wide')),

  -- ============================================
  -- 입술 분석
  -- ============================================

  lip_ratio TEXT,
  lip_fullness TEXT CHECK (lip_fullness IN ('thin', 'medium', 'full')),
  cupid_bow TEXT CHECK (cupid_bow IN ('defined', 'subtle', 'flat')),
  lip_corner TEXT CHECK (lip_corner IN ('upturned', 'straight', 'downturned')),

  -- ============================================
  -- 눈썹 분석
  -- ============================================

  eyebrow_shape TEXT CHECK (eyebrow_shape IN (
    'arched',   -- 아치형
    'straight', -- 일자
    'angular',  -- 각진형
    'rounded'   -- 둥근형
  )),

  -- ============================================
  -- 스타일 퍼스널리티 (7종)
  -- ============================================

  style_personality TEXT CHECK (style_personality IN (
    'classic',   -- 클래식
    'dramatic',  -- 드라마틱
    'natural',   -- 내추럴
    'elegant',   -- 엘레강스
    'romantic',  -- 로맨틱
    'sexy',      -- 섹시
    'creative'   -- 크리에이티브
  )),

  image_type TEXT CHECK (image_type IN (
    'active',  -- 활동적
    'beauty',  -- 뷰티
    'cute',    -- 귀여움
    'luxury'   -- 럭셔리
  )),

  -- ============================================
  -- 추천 결과 (JSONB)
  -- ============================================

  hair_recommendations JSONB,
  makeup_recommendations JSONB,
  glasses_recommendations JSONB,
  earring_recommendations JSONB,
  necklace_recommendations JSONB,

  -- TPO 스타일 가이드 (5종 상황별)
  tpo_style_guide JSONB,
  /*
  예시 구조:
  {
    "work": { "makeup": "...", "hair": "...", "accessories": "..." },
    "date": { ... },
    "interview": { ... },
    "wedding_guest": { ... },
    "casual": { ... }
  }
  */

  -- ============================================
  -- 분석 메타데이터
  -- ============================================

  analysis_reliability TEXT DEFAULT 'medium'
    CHECK (analysis_reliability IN ('high', 'medium', 'low')),
  ai_model_version TEXT DEFAULT 'gemini-3-flash',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- ============================================
  -- 외래 키
  -- ============================================

  CONSTRAINT face_analyses_clerk_user_id_fkey
    FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id),
  CONSTRAINT face_analyses_reused_from_pc_fkey
    FOREIGN KEY (reused_from_pc_id) REFERENCES personal_color_assessments(id)
);

-- ============================================
-- 인덱스
-- ============================================

CREATE INDEX IF NOT EXISTS idx_face_analyses_clerk_user_id
  ON face_analyses(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_face_analyses_created_at
  ON face_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_face_analyses_face_shape
  ON face_analyses(face_shape);
CREATE INDEX IF NOT EXISTS idx_face_analyses_ethnicity
  ON face_analyses(ethnicity);
CREATE INDEX IF NOT EXISTS idx_face_analyses_skin_tone
  ON face_analyses(skin_tone);
CREATE INDEX IF NOT EXISTS idx_face_analyses_style_personality
  ON face_analyses(style_personality);

-- ============================================
-- RLS 정책
-- ============================================

ALTER TABLE face_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own face analyses"
  ON face_analyses FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own face analyses"
  ON face_analyses FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own face analyses"
  ON face_analyses FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own face analyses"
  ON face_analyses FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- ============================================
-- 코멘트
-- ============================================

COMMENT ON TABLE face_analyses IS 'F-1 얼굴형 분석 결과 (글로벌 다민족 지원)';
COMMENT ON COLUMN face_analyses.reused_from_pc_id IS 'PC-1 이미지 재사용 시 참조 ID';
COMMENT ON COLUMN face_analyses.ethnicity IS '자동 감지된 인종/민족 (선택적, 사용자에게 표시하지 않음)';
COMMENT ON COLUMN face_analyses.skin_tone IS 'Monk Scale 스킨톤 (Google 2022 표준, 10단계)';
COMMENT ON COLUMN face_analyses.eyelid_type IS '글로벌 쌍꺼풀 유형 (동아시아 5종 + 글로벌 3종)';
COMMENT ON COLUMN face_analyses.nose_type IS '글로벌 코 유형 (9종)';
COMMENT ON COLUMN face_analyses.style_personality IS '7가지 스타일 퍼스널리티';
COMMENT ON COLUMN face_analyses.tpo_style_guide IS 'TPO별 스타일 가이드 (5종 상황)';
