-- Ingredient Interactions System
-- Sprint 2: 성분 충돌 경고
-- Created: 2025-12-19

-- ============================================
-- 1. 성분 상호작용 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS ingredient_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 성분 쌍
  ingredient_a TEXT NOT NULL,
  ingredient_b TEXT NOT NULL,

  -- 상호작용 유형
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'contraindication',  -- 금기 (절대 같이 복용 X)
    'caution',           -- 주의 (의사 상담 권장)
    'synergy',           -- 시너지 (같이 먹으면 좋음)
    'timing'             -- 시간 분리 필요
  )),

  -- 심각도
  severity TEXT CHECK (severity IN ('high', 'medium', 'low')),

  -- 상세 정보
  description TEXT NOT NULL,
  recommendation TEXT,
  source TEXT,           -- 출처 (논문, FDA 등)

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 중복 방지 (성분 쌍 + 유형)
  UNIQUE(ingredient_a, ingredient_b, interaction_type)
);

-- 인덱스 (양방향 검색)
CREATE INDEX IF NOT EXISTS idx_interactions_a ON ingredient_interactions(ingredient_a);
CREATE INDEX IF NOT EXISTS idx_interactions_b ON ingredient_interactions(ingredient_b);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON ingredient_interactions(interaction_type);

-- ============================================
-- 2. RLS 정책 (공개 읽기 전용)
-- ============================================
ALTER TABLE ingredient_interactions ENABLE ROW LEVEL SECURITY;

-- 공개 읽기
CREATE POLICY "Public can read interactions"
  ON ingredient_interactions
  FOR SELECT
  USING (true);

-- 관리자만 수정 (service_role 사용)
-- INSERT/UPDATE/DELETE는 RLS 정책 없음 → service_role만 가능

-- ============================================
-- 3. 초기 데이터 시드
-- ============================================

-- 금기 (contraindication) - 절대 같이 복용 X
INSERT INTO ingredient_interactions (ingredient_a, ingredient_b, interaction_type, severity, description, recommendation, source)
VALUES
  ('철분', '칼슘', 'contraindication', 'high', '철분과 칼슘은 같은 수용체를 통해 흡수되어 서로의 흡수를 방해합니다.', '최소 2시간 간격을 두고 복용하세요.', 'NIH Office of Dietary Supplements'),
  ('아연', '구리', 'contraindication', 'high', '아연과 구리는 흡수 경쟁 관계로, 과량의 아연은 구리 결핍을 유발할 수 있습니다.', '아연 보충제 복용 시 구리 섭취량을 확인하세요.', 'Linus Pauling Institute'),
  ('비타민E', '와파린', 'contraindication', 'high', '고용량 비타민E는 혈액응고를 방해하여 와파린의 효과를 증가시킬 수 있습니다.', '혈액응고제 복용 중이라면 의사와 상담하세요.', 'FDA Drug Interactions'),
  ('마그네슘', '비스포스포네이트', 'contraindication', 'high', '마그네슘이 비스포스포네이트의 흡수를 방해합니다.', '비스포스포네이트 복용 후 2시간 이상 간격을 두세요.', 'Clinical Pharmacology'),
  ('칼슘', '철분', 'contraindication', 'high', '칼슘이 철분의 흡수를 최대 50%까지 감소시킬 수 있습니다.', '철분제는 칼슘 보충제와 다른 시간에 복용하세요.', 'American Journal of Clinical Nutrition')
ON CONFLICT DO NOTHING;

-- 주의 (caution) - 의사 상담 권장
INSERT INTO ingredient_interactions (ingredient_a, ingredient_b, interaction_type, severity, description, recommendation, source)
VALUES
  ('오메가3', '아스피린', 'caution', 'medium', '오메가3와 아스피린 모두 혈액 점도를 낮추어 출혈 위험이 증가할 수 있습니다.', '수술 전이나 출혈 경향이 있다면 의사와 상담하세요.', 'American Heart Association'),
  ('비타민K', '와파린', 'caution', 'high', '비타민K는 혈액응고에 필수적이며, 와파린의 항응고 효과를 감소시킵니다.', '와파린 복용 중 비타민K 섭취량을 일정하게 유지하세요.', 'FDA Drug Safety'),
  ('마그네슘', '항생제', 'caution', 'medium', '마그네슘이 퀴놀론계, 테트라사이클린계 항생제의 흡수를 방해합니다.', '항생제 복용 2시간 전후로 마그네슘을 피하세요.', 'Clinical Infectious Diseases'),
  ('세인트존스워트', 'SSRI', 'caution', 'high', '세인트존스워트와 SSRI 병용 시 세로토닌 증후군 위험이 있습니다.', '항우울제 복용 중이라면 세인트존스워트를 피하세요.', 'FDA MedWatch'),
  ('은행잎추출물', '항응고제', 'caution', 'medium', '은행잎은 혈소판 응집을 억제하여 출혈 위험을 높일 수 있습니다.', '항응고제 복용 중이라면 은행잎 보충제를 피하세요.', 'Journal of Clinical Pharmacology'),
  ('감초', '혈압약', 'caution', 'medium', '감초의 글리시리진 성분이 혈압을 높이고 칼륨을 낮출 수 있습니다.', '고혈압이나 심장질환이 있다면 감초 섭취를 제한하세요.', 'European Medicines Agency')
ON CONFLICT DO NOTHING;

-- 시간 분리 필요 (timing)
INSERT INTO ingredient_interactions (ingredient_a, ingredient_b, interaction_type, severity, description, recommendation, source)
VALUES
  ('갑상선약', '칼슘', 'timing', 'high', '칼슘이 갑상선 호르몬제의 흡수를 방해합니다.', '갑상선약 복용 후 최소 4시간 간격을 두고 칼슘을 섭취하세요.', 'Thyroid Journal'),
  ('프로바이오틱스', '항생제', 'timing', 'medium', '항생제가 프로바이오틱스의 생균을 죽일 수 있습니다.', '항생제 복용 후 2시간 이상 간격을 두고 프로바이오틱스를 복용하세요.', 'Gut Microbiome Research'),
  ('철분', '커피', 'timing', 'medium', '커피의 폴리페놀이 철분 흡수를 방해합니다.', '철분제 복용 전후 1시간은 커피를 피하세요.', 'American Journal of Clinical Nutrition'),
  ('철분', '녹차', 'timing', 'medium', '녹차의 타닌이 철분 흡수를 방해합니다.', '철분제와 녹차는 2시간 간격을 두세요.', 'European Journal of Clinical Nutrition'),
  ('섬유질', '약물', 'timing', 'low', '고용량 섬유질이 약물의 흡수를 지연시킬 수 있습니다.', '섬유질 보충제는 다른 약물과 1-2시간 간격을 두세요.', 'Pharmacotherapy Journal')
ON CONFLICT DO NOTHING;

-- 시너지 (synergy) - 같이 먹으면 좋음
INSERT INTO ingredient_interactions (ingredient_a, ingredient_b, interaction_type, severity, description, recommendation, source)
VALUES
  ('비타민D', '칼슘', 'synergy', 'low', '비타민D가 칼슘의 장내 흡수를 촉진합니다.', '칼슘 보충제는 비타민D와 함께 복용하면 효과적입니다.', 'Endocrine Society Guidelines'),
  ('비타민C', '철분', 'synergy', 'low', '비타민C가 비헴철의 흡수를 2-3배 증가시킵니다.', '철분제를 비타민C가 풍부한 음식이나 보충제와 함께 복용하세요.', 'Journal of Nutrition'),
  ('오메가3', '비타민E', 'synergy', 'low', '비타민E가 오메가3 지방산의 산화를 방지합니다.', '오메가3 보충제에 비타민E가 포함된 제품을 선택하세요.', 'Lipids in Health and Disease'),
  ('비타민D', '마그네슘', 'synergy', 'low', '마그네슘이 비타민D를 활성형으로 전환하는 데 필요합니다.', '비타민D 복용 시 마그네슘 섭취도 확인하세요.', 'Journal of the American Osteopathic Association'),
  ('비타민B12', '엽산', 'synergy', 'low', 'B12와 엽산은 DNA 합성과 적혈구 생성에 함께 작용합니다.', 'B-complex 형태로 함께 복용하면 효과적입니다.', 'Nutrition Reviews'),
  ('아연', '비타민A', 'synergy', 'low', '아연이 비타민A의 수송과 활용에 필요합니다.', '비타민A 보충 시 아연 상태도 확인하세요.', 'American Journal of Clinical Nutrition'),
  ('비타민K2', '비타민D', 'synergy', 'low', '비타민K2가 비타민D에 의해 흡수된 칼슘을 뼈로 운반합니다.', '비타민D와 K2를 함께 복용하면 골건강에 더 효과적입니다.', 'Osteoporosis International'),
  ('CoQ10', '비타민E', 'synergy', 'low', 'CoQ10과 비타민E가 함께 항산화 작용을 강화합니다.', '심혈관 건강을 위해 함께 복용을 고려하세요.', 'Biofactors Journal')
ON CONFLICT DO NOTHING;

-- 추가 금기/주의 사항
INSERT INTO ingredient_interactions (ingredient_a, ingredient_b, interaction_type, severity, description, recommendation, source)
VALUES
  ('비타민A', '레티노이드', 'contraindication', 'high', '비타민A와 레티노이드(여드름 치료제) 병용 시 비타민A 과다증 위험이 있습니다.', '레티노이드 복용 중에는 비타민A 보충제를 피하세요.', 'Dermatology Guidelines'),
  ('멜라토닌', '혈압약', 'caution', 'medium', '멜라토닌이 일부 혈압약의 효과를 변화시킬 수 있습니다.', '혈압약 복용 중 멜라토닌 사용 시 의사와 상담하세요.', 'Journal of Pineal Research'),
  ('인삼', '당뇨약', 'caution', 'medium', '인삼이 혈당 수치에 영향을 줄 수 있습니다.', '당뇨약 복용 중이라면 인삼 복용 시 혈당을 주의깊게 모니터링하세요.', 'Diabetes Care'),
  ('크롬', '갑상선약', 'timing', 'medium', '크롬이 갑상선 호르몬제의 흡수에 영향을 줄 수 있습니다.', '갑상선약과 3-4시간 간격을 두고 크롬을 복용하세요.', 'Thyroid Research')
ON CONFLICT DO NOTHING;
