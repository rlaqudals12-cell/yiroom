-- Migration: foods 테이블 생성 (공용 음식 DB)
-- Purpose: N-1 음식 영양정보 마스터 데이터
-- Date: 2025-12-01
-- Version: v2.6

-- Step 1: foods 테이블 생성
CREATE TABLE IF NOT EXISTS public.foods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- 기본 정보
    name TEXT NOT NULL,
    name_en TEXT,
    category TEXT NOT NULL,

    -- 서빙 정보
    serving_size TEXT DEFAULT '1인분',
    serving_grams INTEGER,

    -- 영양 정보 (100g 기준 또는 1인분 기준)
    calories INTEGER NOT NULL,
    protein DECIMAL(5,1),
    carbs DECIMAL(5,1),
    fat DECIMAL(5,1),
    fiber DECIMAL(5,1),
    sugar DECIMAL(5,1),
    sodium INTEGER,

    -- 신호등 시스템
    traffic_light TEXT CHECK (traffic_light IN ('green', 'yellow', 'red')),

    -- 부가 정보
    is_korean BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
CREATE INDEX IF NOT EXISTS idx_foods_name_gin ON foods USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_traffic_light ON foods(traffic_light);
CREATE INDEX IF NOT EXISTS idx_foods_is_korean ON foods(is_korean);

-- Step 3: 텍스트 검색을 위한 확장 (이미 있으면 무시)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Step 4: 권한 부여 (공용 테이블 - 모든 사용자 읽기 가능)
GRANT SELECT ON TABLE foods TO anon;
GRANT SELECT ON TABLE foods TO authenticated;
GRANT ALL ON TABLE foods TO service_role;

-- Step 5: 코멘트 추가
COMMENT ON TABLE foods IS 'N-1 음식 영양정보 마스터 테이블 (공용)';
COMMENT ON COLUMN foods.name IS '음식명 (한글)';
COMMENT ON COLUMN foods.name_en IS '음식명 (영문)';
COMMENT ON COLUMN foods.category IS '카테고리 (rice/soup/side/meat/seafood/noodle/bread/beverage/fruit/fastfood)';
COMMENT ON COLUMN foods.serving_size IS '1회 제공량 설명';
COMMENT ON COLUMN foods.serving_grams IS '1회 제공량 그램';
COMMENT ON COLUMN foods.calories IS '칼로리 (kcal)';
COMMENT ON COLUMN foods.protein IS '단백질 (g)';
COMMENT ON COLUMN foods.carbs IS '탄수화물 (g)';
COMMENT ON COLUMN foods.fat IS '지방 (g)';
COMMENT ON COLUMN foods.fiber IS '식이섬유 (g)';
COMMENT ON COLUMN foods.sugar IS '당류 (g)';
COMMENT ON COLUMN foods.sodium IS '나트륨 (mg)';
COMMENT ON COLUMN foods.traffic_light IS '신호등 (green/yellow/red)';
COMMENT ON COLUMN foods.is_korean IS '한국 음식 여부';
COMMENT ON COLUMN foods.tags IS '태그 배열 (low_carb, high_protein 등)';
