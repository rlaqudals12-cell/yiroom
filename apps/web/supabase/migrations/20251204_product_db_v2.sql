-- Product DB v2: 운동 기구 + 건강식품 테이블
-- 버전: 2.0
-- 작성일: 2025-12-04
-- 목적: 제품 DB 확장 (운동 기구, 건강식품 추가)

-- ================================================
-- 1. workout_equipment (운동 기구 테이블)
-- ================================================
CREATE TABLE IF NOT EXISTS workout_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'dumbbell',      -- 덤벨
    'barbell',       -- 바벨
    'kettlebell',    -- 케틀벨
    'resistance_band', -- 저항 밴드
    'pull_up_bar',   -- 풀업바/치닝바
    'yoga_mat',      -- 요가매트
    'foam_roller',   -- 폼롤러
    'jump_rope',     -- 줄넘기
    'ab_roller',     -- 복근 롤러
    'bench',         -- 벤치
    'rack',          -- 랙/스쿼트랙
    'cardio',        -- 유산소 기구 (러닝머신, 사이클 등)
    'accessory',     -- 액세서리 (글러브, 스트랩 등)
    'wearable',      -- 웨어러블 (스마트워치, 심박계 등)
    'other'          -- 기타
  )),
  subcategory TEXT, -- 세부 카테고리

  -- 가격 정보
  price_krw INTEGER,
  price_range TEXT CHECK (price_range IN ('budget', 'mid', 'premium')),

  -- 제품 스펙
  weight_kg DECIMAL(5,2), -- 무게 (덤벨/바벨 등)
  weight_range TEXT, -- 조절식의 경우 범위 (예: "2-20kg")
  material TEXT, -- 재질
  size TEXT, -- 사이즈/크기
  color_options TEXT[], -- 색상 옵션

  -- 용도
  target_muscles TEXT[], -- 타겟 근육군
  exercise_types TEXT[], -- 운동 타입 (strength, cardio, flexibility, etc.)
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'all')),
  use_location TEXT CHECK (use_location IN ('home', 'gym', 'outdoor', 'all')),

  -- 메타데이터
  image_url TEXT,
  purchase_url TEXT,
  affiliate_url TEXT, -- 어필리에이트 링크
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,

  -- 특징/장점
  features TEXT[], -- 주요 특징
  pros TEXT[], -- 장점
  cons TEXT[], -- 단점

  -- 활성화 상태
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 복합 유니크 제약 (시드 upsert용)
  UNIQUE(name, brand)
);

-- workout_equipment 인덱스
CREATE INDEX IF NOT EXISTS idx_workout_equipment_category ON workout_equipment(category);
CREATE INDEX IF NOT EXISTS idx_workout_equipment_brand ON workout_equipment(brand);
CREATE INDEX IF NOT EXISTS idx_workout_equipment_target_muscles ON workout_equipment USING GIN(target_muscles);
CREATE INDEX IF NOT EXISTS idx_workout_equipment_exercise_types ON workout_equipment USING GIN(exercise_types);
CREATE INDEX IF NOT EXISTS idx_workout_equipment_skill_level ON workout_equipment(skill_level);
CREATE INDEX IF NOT EXISTS idx_workout_equipment_use_location ON workout_equipment(use_location);
CREATE INDEX IF NOT EXISTS idx_workout_equipment_is_active ON workout_equipment(is_active) WHERE is_active = true;

-- workout_equipment 코멘트
COMMENT ON TABLE workout_equipment IS '운동 기구/장비 제품 DB';
COMMENT ON COLUMN workout_equipment.category IS '기구 카테고리: dumbbell, barbell, kettlebell, resistance_band, etc.';
COMMENT ON COLUMN workout_equipment.target_muscles IS '타겟 근육군: chest, back, shoulders, arms, legs, core, full_body';
COMMENT ON COLUMN workout_equipment.exercise_types IS '운동 타입: strength, cardio, flexibility, balance, plyometric';
COMMENT ON COLUMN workout_equipment.affiliate_url IS '어필리에이트/제휴 링크';

-- ================================================
-- 2. health_foods (건강식품 테이블)
-- ================================================
CREATE TABLE IF NOT EXISTS health_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'protein_powder',  -- 프로틴 파우더
    'protein_bar',     -- 프로틴 바
    'meal_replacement', -- 식사 대용식
    'energy_drink',    -- 에너지 음료
    'sports_drink',    -- 스포츠 음료
    'bcaa',            -- BCAA/아미노산
    'creatine',        -- 크레아틴
    'pre_workout',     -- 프리워크아웃
    'post_workout',    -- 포스트워크아웃
    'diet_food',       -- 다이어트 식품
    'healthy_snack',   -- 건강 스낵
    'superfood',       -- 슈퍼푸드
    'functional_food', -- 기능성 식품
    'other'            -- 기타
  )),
  subcategory TEXT, -- 세부 카테고리 (예: whey, casein, plant-based)

  -- 가격 정보
  price_krw INTEGER,
  price_per_serving INTEGER, -- 1회분 가격

  -- 영양 정보 (1회 섭취량 기준)
  serving_size TEXT, -- 1회 섭취량 (예: "30g", "1스쿱")
  servings_per_container INTEGER, -- 총 섭취 횟수
  calories_per_serving INTEGER,
  protein_g DECIMAL(5,1),
  carbs_g DECIMAL(5,1),
  sugar_g DECIMAL(5,1),
  fat_g DECIMAL(5,1),
  fiber_g DECIMAL(5,1),
  sodium_mg INTEGER,

  -- 추가 성분
  additional_nutrients JSONB, -- {name: string, amount: number, unit: string, daily_value_percent: number}[]

  -- 특성
  flavor_options TEXT[], -- 맛 옵션
  dietary_info TEXT[], -- 식이 정보 (vegan, gluten-free, lactose-free, keto, etc.)
  allergens TEXT[], -- 알레르기 유발 성분

  -- 용도
  benefits TEXT[], -- 효능 (muscle_gain, weight_loss, energy, recovery, etc.)
  best_time TEXT CHECK (best_time IN ('pre_workout', 'post_workout', 'morning', 'anytime')), -- 섭취 시간
  target_users TEXT[], -- 타겟 사용자 (athletes, beginners, weight_loss, muscle_gain)

  -- 메타데이터
  image_url TEXT,
  purchase_url TEXT,
  affiliate_url TEXT,
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,

  -- 특징/장점
  features TEXT[],
  taste_rating DECIMAL(2,1), -- 맛 평점
  mixability_rating DECIMAL(2,1), -- 용해성 평점 (파우더류)

  -- 활성화 상태
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 복합 유니크 제약 (시드 upsert용)
  UNIQUE(name, brand)
);

-- health_foods 인덱스
CREATE INDEX IF NOT EXISTS idx_health_foods_category ON health_foods(category);
CREATE INDEX IF NOT EXISTS idx_health_foods_brand ON health_foods(brand);
CREATE INDEX IF NOT EXISTS idx_health_foods_benefits ON health_foods USING GIN(benefits);
CREATE INDEX IF NOT EXISTS idx_health_foods_dietary_info ON health_foods USING GIN(dietary_info);
CREATE INDEX IF NOT EXISTS idx_health_foods_target_users ON health_foods USING GIN(target_users);
CREATE INDEX IF NOT EXISTS idx_health_foods_is_active ON health_foods(is_active) WHERE is_active = true;

-- health_foods 코멘트
COMMENT ON TABLE health_foods IS '건강식품/스포츠 영양 제품 DB';
COMMENT ON COLUMN health_foods.category IS '식품 카테고리: protein_powder, protein_bar, bcaa, creatine, etc.';
COMMENT ON COLUMN health_foods.dietary_info IS '식이 정보: vegan, gluten_free, lactose_free, keto, sugar_free, organic';
COMMENT ON COLUMN health_foods.benefits IS '효능: muscle_gain, weight_loss, energy, recovery, endurance';
COMMENT ON COLUMN health_foods.additional_nutrients IS 'JSON 형식의 추가 영양 성분 정보';

-- ================================================
-- 3. updated_at 트리거
-- ================================================
-- workout_equipment 트리거
DROP TRIGGER IF EXISTS update_workout_equipment_updated_at ON workout_equipment;
CREATE TRIGGER update_workout_equipment_updated_at
  BEFORE UPDATE ON workout_equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- health_foods 트리거
DROP TRIGGER IF EXISTS update_health_foods_updated_at ON health_foods;
CREATE TRIGGER update_health_foods_updated_at
  BEFORE UPDATE ON health_foods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 4. RLS 정책
-- ================================================
ALTER TABLE workout_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_foods ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (활성화된 제품만)
DROP POLICY IF EXISTS "Public read active workout equipment" ON workout_equipment;
CREATE POLICY "Public read active workout equipment"
  ON workout_equipment FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Public read active health foods" ON health_foods;
CREATE POLICY "Public read active health foods"
  ON health_foods FOR SELECT
  USING (is_active = true);

-- Service Role만 쓰기 허용
DROP POLICY IF EXISTS "Service role full access workout equipment" ON workout_equipment;
CREATE POLICY "Service role full access workout equipment"
  ON workout_equipment FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access health foods" ON health_foods;
CREATE POLICY "Service role full access health foods"
  ON health_foods FOR ALL
  USING (auth.role() = 'service_role');

-- ================================================
-- 5. 기존 테이블에 affiliate_url 컬럼 추가
-- ================================================
ALTER TABLE cosmetic_products ADD COLUMN IF NOT EXISTS affiliate_url TEXT;
ALTER TABLE supplement_products ADD COLUMN IF NOT EXISTS affiliate_url TEXT;

COMMENT ON COLUMN cosmetic_products.affiliate_url IS '어필리에이트/제휴 링크';
COMMENT ON COLUMN supplement_products.affiliate_url IS '어필리에이트/제휴 링크';

-- ================================================
-- 6. 제품 가격 히스토리 테이블 (실시간 가격 추적용)
-- ================================================
CREATE TABLE IF NOT EXISTS product_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type TEXT NOT NULL CHECK (product_type IN (
    'cosmetic', 'supplement', 'workout_equipment', 'health_food'
  )),
  product_id UUID NOT NULL,
  price_krw INTEGER NOT NULL,
  source TEXT, -- 가격 출처 (naver, coupang, etc.)
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 가격 히스토리 인덱스
CREATE INDEX IF NOT EXISTS idx_price_history_product ON product_price_history(product_type, product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON product_price_history(recorded_at DESC);

COMMENT ON TABLE product_price_history IS '제품 가격 변동 히스토리 (실시간 가격 추적)';

-- 가격 히스토리 RLS
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read price history" ON product_price_history;
CREATE POLICY "Public read price history"
  ON product_price_history FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role full access price history" ON product_price_history;
CREATE POLICY "Service role full access price history"
  ON product_price_history FOR ALL
  USING (auth.role() = 'service_role');
