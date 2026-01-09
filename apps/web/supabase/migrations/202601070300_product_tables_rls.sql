-- 제품 테이블 RLS 정책 추가
-- HIGH: 모든 제품 테이블에 공개 읽기 + 관리자 쓰기 정책
-- 생성일: 2026-01-07

-- =====================================================
-- 1. cosmetic_products - 화장품
-- =====================================================
ALTER TABLE cosmetic_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cosmetic products"
  ON cosmetic_products FOR SELECT
  USING (true);

-- Service role만 쓰기 가능 (anon/authenticated는 불가)
CREATE POLICY "Service role can manage cosmetic products"
  ON cosmetic_products FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 2. supplement_products - 영양제
-- =====================================================
ALTER TABLE supplement_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view supplement products"
  ON supplement_products FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage supplement products"
  ON supplement_products FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 3. workout_equipment - 운동 기구
-- =====================================================
ALTER TABLE workout_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view workout equipment"
  ON workout_equipment FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage workout equipment"
  ON workout_equipment FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 4. health_foods - 건강식품
-- =====================================================
ALTER TABLE health_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view health foods"
  ON health_foods FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage health foods"
  ON health_foods FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 5. foods - 음식 데이터
-- =====================================================
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view foods"
  ON foods FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage foods"
  ON foods FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 6. ingredients - 성분 데이터
-- =====================================================
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ingredients"
  ON ingredients FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage ingredients"
  ON ingredients FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 7. cosmetic_ingredients - 화장품 성분
-- =====================================================
ALTER TABLE cosmetic_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cosmetic ingredients"
  ON cosmetic_ingredients FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage cosmetic ingredients"
  ON cosmetic_ingredients FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 8. ingredient_interactions - 성분 상호작용
-- =====================================================
ALTER TABLE ingredient_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ingredient interactions"
  ON ingredient_interactions FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage ingredient interactions"
  ON ingredient_interactions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 9. badges - 배지 정의 (공개)
-- =====================================================
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view badges" ON badges;
CREATE POLICY "Anyone can view badges"
  ON badges FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage badges" ON badges;
CREATE POLICY "Service role can manage badges"
  ON badges FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 10. challenges - 챌린지 정의 (공개)
-- =====================================================
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view challenges" ON challenges;
CREATE POLICY "Anyone can view challenges"
  ON challenges FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage challenges" ON challenges;
CREATE POLICY "Service role can manage challenges"
  ON challenges FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 11. announcements - 공지사항 (공개)
-- =====================================================
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active announcements" ON announcements;
CREATE POLICY "Anyone can view active announcements"
  ON announcements FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Service role can manage announcements" ON announcements;
CREATE POLICY "Service role can manage announcements"
  ON announcements FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 12. faqs - FAQ (공개)
-- =====================================================
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published faqs" ON faqs;
CREATE POLICY "Anyone can view published faqs"
  ON faqs FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Service role can manage faqs" ON faqs;
CREATE POLICY "Service role can manage faqs"
  ON faqs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 13. affiliate_partners - 어필리에이트 파트너
-- =====================================================
ALTER TABLE affiliate_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active partners" ON affiliate_partners;
CREATE POLICY "Anyone can view active partners"
  ON affiliate_partners FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Service role can manage partners" ON affiliate_partners;
CREATE POLICY "Service role can manage partners"
  ON affiliate_partners FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 14. affiliate_products - 어필리에이트 제품
-- =====================================================
ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active affiliate products" ON affiliate_products;
CREATE POLICY "Anyone can view active affiliate products"
  ON affiliate_products FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Service role can manage affiliate products" ON affiliate_products;
CREATE POLICY "Service role can manage affiliate products"
  ON affiliate_products FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 코멘트
-- =====================================================
COMMENT ON POLICY "Anyone can view cosmetic products" ON cosmetic_products
  IS '모든 사용자가 화장품 목록 조회 가능';

COMMENT ON POLICY "Anyone can view supplement products" ON supplement_products
  IS '모든 사용자가 영양제 목록 조회 가능';

COMMENT ON POLICY "Anyone can view workout equipment" ON workout_equipment
  IS '모든 사용자가 운동 기구 목록 조회 가능';

COMMENT ON POLICY "Anyone can view health foods" ON health_foods
  IS '모든 사용자가 건강식품 목록 조회 가능';

-- 마이그레이션 완료 로그
DO $$
BEGIN
  RAISE NOTICE 'Product tables RLS policies added successfully';
END $$;
