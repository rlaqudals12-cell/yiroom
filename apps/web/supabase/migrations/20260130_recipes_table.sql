-- Migration: recipes 테이블 생성
-- Purpose: Coach RAG 영양 추천용 레시피 데이터베이스
-- Date: 2026-01-30
-- Author: Claude Code
-- Issue: Plan v8.1 P3 - nutrition-rag.ts MOCK_RECIPES → DB 전환
-- Rollback: DROP TABLE IF EXISTS recipes;

-- ============================================
-- 전방 마이그레이션 (Forward Migration)
-- ============================================

-- 1. 레시피 테이블 생성
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  calories INTEGER NOT NULL DEFAULT 0,
  protein REAL NOT NULL DEFAULT 0,
  carbs REAL NOT NULL DEFAULT 0,
  fat REAL NOT NULL DEFAULT 0,
  cook_time INTEGER NOT NULL DEFAULT 0, -- 분 단위
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  goal TEXT CHECK (goal IN ('diet', 'bulk', 'lean', 'maintenance', NULL)),
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  source TEXT, -- 레시피 출처 (외부 API 연동 시)
  external_id TEXT, -- 외부 API ID
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_recipes_goal ON recipes(goal);
CREATE INDEX IF NOT EXISTS idx_recipes_calories ON recipes(calories);
CREATE INDEX IF NOT EXISTS idx_recipes_protein ON recipes(protein);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_ingredients ON recipes USING GIN(ingredients);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);

-- 3. RLS 정책 (공개 읽기, 관리자만 쓰기)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 읽기 허용 (공유 레시피 DB)
CREATE POLICY "recipes_public_read" ON recipes
  FOR SELECT
  USING (true);

-- 4. 코멘트
COMMENT ON TABLE recipes IS '영양 코치용 레시피 데이터베이스';
COMMENT ON COLUMN recipes.name IS '레시피 이름';
COMMENT ON COLUMN recipes.description IS '레시피 설명';
COMMENT ON COLUMN recipes.calories IS '칼로리 (kcal)';
COMMENT ON COLUMN recipes.protein IS '단백질 (g)';
COMMENT ON COLUMN recipes.carbs IS '탄수화물 (g)';
COMMENT ON COLUMN recipes.fat IS '지방 (g)';
COMMENT ON COLUMN recipes.cook_time IS '조리 시간 (분)';
COMMENT ON COLUMN recipes.difficulty IS '난이도 (easy/medium/hard)';
COMMENT ON COLUMN recipes.ingredients IS '재료 목록 (배열)';
COMMENT ON COLUMN recipes.goal IS '영양 목표 (diet/bulk/lean/maintenance)';
COMMENT ON COLUMN recipes.tags IS '태그 (배열)';
COMMENT ON COLUMN recipes.source IS '레시피 출처';
COMMENT ON COLUMN recipes.external_id IS '외부 API 레시피 ID';

-- 5. 초기 시드 데이터 (MOCK_RECIPES 기반)
INSERT INTO recipes (name, description, calories, protein, carbs, fat, cook_time, difficulty, ingredients, goal, tags)
VALUES
  (
    '닭가슴살 샐러드',
    '고단백 저칼로리 다이어트 샐러드',
    350, 35, 15, 12, 15, 'easy',
    ARRAY['닭가슴살', '양상추', '토마토', '오이', '올리브오일', '레몬즙'],
    'diet',
    ARRAY['고단백', '저칼로리', '다이어트', '샐러드']
  ),
  (
    '연어 아보카도 덮밥',
    '오메가3 풍부한 건강 덮밥',
    520, 28, 45, 22, 20, 'medium',
    ARRAY['연어', '아보카도', '현미밥', '간장', '와사비', '참깨'],
    'lean',
    ARRAY['오메가3', '건강식', '덮밥', '연어']
  ),
  (
    '단백질 오트밀',
    '아침 식사용 고단백 오트밀',
    420, 25, 55, 10, 10, 'easy',
    ARRAY['오트밀', '우유', '단백질파우더', '바나나', '블루베리', '꿀'],
    'bulk',
    ARRAY['고단백', '아침식사', '벌크업', '오트밀']
  ),
  (
    '토마토 달걀 볶음',
    '간단하고 영양 균형 잡힌 요리',
    280, 15, 18, 16, 10, 'easy',
    ARRAY['달걀', '토마토', '파', '소금', '식용유'],
    'maintenance',
    ARRAY['간단요리', '달걀', '균형식', '한식']
  ),
  (
    '그릭 요거트 볼',
    '간편한 고단백 간식',
    300, 20, 35, 8, 5, 'easy',
    ARRAY['그릭요거트', '그래놀라', '블루베리', '꿀', '아몬드'],
    'diet',
    ARRAY['간식', '고단백', '요거트', '다이어트']
  ),
  (
    '소고기 브로콜리 볶음',
    '근육 성장을 위한 고단백 요리',
    450, 38, 12, 28, 20, 'medium',
    ARRAY['소고기', '브로콜리', '마늘', '간장', '굴소스', '참기름'],
    'bulk',
    ARRAY['고단백', '벌크업', '소고기', '저탄수화물']
  ),
  (
    '두부 스테이크',
    '식물성 단백질 풍부한 건강식',
    320, 22, 18, 18, 25, 'medium',
    ARRAY['두부', '양파', '마늘', '간장', '올리브오일', '파프리카'],
    'lean',
    ARRAY['식물성단백질', '두부', '비건', '건강식']
  ),
  (
    '참치 김밥',
    '도시락용 균형 잡힌 한끼',
    480, 24, 58, 14, 30, 'hard',
    ARRAY['참치캔', '밥', '김', '당근', '시금치', '단무지', '계란'],
    'maintenance',
    ARRAY['도시락', '김밥', '균형식', '한식']
  );

-- ============================================
-- 롤백 스크립트 (별도 파일로 관리)
-- ============================================
-- DROP TABLE IF EXISTS recipes;
