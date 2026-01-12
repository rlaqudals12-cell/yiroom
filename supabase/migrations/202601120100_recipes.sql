-- Migration: 레시피 데이터베이스 (M-2: 영양 고도화)
-- Purpose: 레시피 테이블 및 사용자 즐겨찾기 시스템
-- Date: 2026-01-12

-- ============================================================
-- Part 1: 레시피 테이블
-- ============================================================

-- 레시피 메인 테이블
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,

  -- 영양 정보
  calories INTEGER,
  protein DECIMAL(5,1),
  carbs DECIMAL(5,1),
  fat DECIMAL(5,1),

  -- 메타데이터
  cook_time INTEGER,                    -- 조리 시간 (분 단위)
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  servings INTEGER DEFAULT 1,           -- 기본 인분

  -- 태그 및 목표
  nutrition_goals TEXT[],               -- ['diet', 'bulk', 'lean', 'maintenance']
  tags TEXT[],                          -- 검색용 태그 (예: ['한식', '닭고기', '다이어트'])

  -- 조리법
  steps JSONB NOT NULL,                 -- ["1단계 설명", "2단계 설명", ...]
  tips TEXT[],                          -- 요리 팁 (선택)

  -- 미디어 및 출처
  image_url TEXT,
  source TEXT,                          -- 레시피 출처 (예: '이룸 팀 레시피', '외부 출처명')

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Part 2: 레시피 재료 테이블
-- ============================================================

-- 레시피별 재료 정보
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 레시피 참조
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,

  -- 재료 정보
  name TEXT NOT NULL,                   -- 재료명 (예: '닭가슴살')
  amount DECIMAL(10,2),                 -- 양 (예: 200)
  unit TEXT,                            -- 단위 (예: 'g', 'ml', '개', '큰술')

  -- 선택 사항
  is_optional BOOLEAN DEFAULT FALSE,    -- 선택 재료 여부

  -- 분류
  category TEXT,                        -- vegetable, meat, seafood, dairy, grain, seasoning, etc.

  -- 추가 설명
  notes TEXT,                           -- 예: '한입 크기로 썰어주세요', '다진 것'

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Part 3: 사용자 즐겨찾기 테이블
-- ============================================================

-- 사용자별 즐겨찾기 레시피
CREATE TABLE IF NOT EXISTS user_favorite_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 사용자 및 레시피
  clerk_user_id TEXT NOT NULL,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 중복 방지
  UNIQUE (clerk_user_id, recipe_id)
);

-- ============================================================
-- Part 4: 인덱스
-- ============================================================

-- recipes 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_recipes_nutrition_goals ON recipes USING GIN (nutrition_goals);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_cook_time ON recipes(cook_time);
CREATE INDEX IF NOT EXISTS idx_recipes_created ON recipes(created_at DESC);

-- recipe_ingredients 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_name ON recipe_ingredients(name);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_category ON recipe_ingredients(category);

-- user_favorite_recipes 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_favorite_recipes_user ON user_favorite_recipes(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_recipes_recipe ON user_favorite_recipes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_recipes_created ON user_favorite_recipes(clerk_user_id, created_at DESC);

-- ============================================================
-- Part 5: RLS 정책
-- ============================================================

-- Recipes RLS (모두 읽기 가능)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view recipes" ON recipes;
CREATE POLICY "Anyone can view recipes"
  ON recipes FOR SELECT
  USING (true);

-- Recipe Ingredients RLS (모두 읽기 가능)
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view recipe ingredients" ON recipe_ingredients;
CREATE POLICY "Anyone can view recipe ingredients"
  ON recipe_ingredients FOR SELECT
  USING (true);

-- User Favorite Recipes RLS (본인만 접근)
ALTER TABLE user_favorite_recipes ENABLE ROW LEVEL SECURITY;

-- 본인 즐겨찾기 조회
DROP POLICY IF EXISTS "Users can view own favorite recipes" ON user_favorite_recipes;
CREATE POLICY "Users can view own favorite recipes"
  ON user_favorite_recipes FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인 즐겨찾기 추가
DROP POLICY IF EXISTS "Users can add own favorite recipes" ON user_favorite_recipes;
CREATE POLICY "Users can add own favorite recipes"
  ON user_favorite_recipes FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인 즐겨찾기 삭제
DROP POLICY IF EXISTS "Users can delete own favorite recipes" ON user_favorite_recipes;
CREATE POLICY "Users can delete own favorite recipes"
  ON user_favorite_recipes FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================================
-- Part 6: 권한 부여
-- ============================================================

GRANT SELECT ON TABLE recipes TO authenticated;
GRANT SELECT ON TABLE recipes TO anon;

GRANT SELECT ON TABLE recipe_ingredients TO authenticated;
GRANT SELECT ON TABLE recipe_ingredients TO anon;

GRANT SELECT, INSERT, DELETE ON TABLE user_favorite_recipes TO authenticated;

GRANT ALL ON TABLE recipes TO service_role;
GRANT ALL ON TABLE recipe_ingredients TO service_role;
GRANT ALL ON TABLE user_favorite_recipes TO service_role;

-- ============================================================
-- Part 7: 트리거 - updated_at 자동 갱신
-- ============================================================

-- recipes 테이블 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recipes_updated_at ON recipes;
CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_recipes_updated_at();

-- ============================================================
-- Part 8: 코멘트
-- ============================================================

COMMENT ON TABLE recipes IS '레시피 메인 테이블 - 100+ 영양 맞춤 레시피';
COMMENT ON TABLE recipe_ingredients IS '레시피 재료 목록 - 각 레시피별 필요 재료';
COMMENT ON TABLE user_favorite_recipes IS '사용자 즐겨찾기 레시피 - 북마크 기능';

COMMENT ON COLUMN recipes.nutrition_goals IS '영양 목표: diet(다이어트), bulk(벌크업), lean(린매스업), maintenance(유지)';
COMMENT ON COLUMN recipes.difficulty IS '난이도: easy(쉬움), medium(보통), hard(어려움)';
COMMENT ON COLUMN recipes.cook_time IS '조리 시간 (분 단위)';
COMMENT ON COLUMN recipes.steps IS 'JSON 배열 형식 조리 단계';

COMMENT ON COLUMN recipe_ingredients.category IS '재료 분류: vegetable, meat, seafood, dairy, grain, seasoning 등';
COMMENT ON COLUMN recipe_ingredients.is_optional IS '선택 재료 여부 (없어도 조리 가능)';
COMMENT ON COLUMN recipe_ingredients.notes IS '재료 설명 (예: 한입 크기로 썰기)';
