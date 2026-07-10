-- Migration: 시드 유래 가짜 평점 데이터 정정 (데이터 정정 스크립트 — 스키마 변경 없음)
-- Purpose: 시드 JSON에서 지어낸 rating/review_count(실측 소스 0)를 null로 되돌려
--          라이브 표면의 "★4.5 (25,000)" 류 가짜 렌더와 평점 기반 추천 정렬 오염을 제거한다.
-- Date: 2026-07-11
-- Author: Claude Code (배치 C: prod 가짜 평점 정리)
-- Apply: ⚠️ 대시보드 SQL Editor 수동 gap-apply (파괴적 db push 금지 — prod RLS 구패턴 환경)
-- Rollback: 불필요/불가 — 원본 값 자체가 허구이므로 복원 대상이 아님.
--           (참고: 제거 전 원본은 git 이력 data/seeds/*.json HEAD~1에 남아 있음)
--
-- ============================================
-- 시드 유래 행 식별 근거 (2026-07-11 코드 전수 조사)
-- ============================================
-- 각 테이블의 rating/review_count 기록 경로는 아래가 전부다:
--   cosmetic_products:
--     ① scripts/seed-products.ts + app/api/admin/seed-products/route.ts
--        → data/seeds/cosmetic-products.json (500행, rating 4.x·review_count 최대 25,000 임의 기입)
--     ② scripts/collect-makeup-catalog.mts (네이버 수집기)
--        → rating 명시적 미기록(null), review_count 컬럼 기본값 0
--   supplement_products: ①과 동일 시드 경로만 존재 (200행)
--   workout_equipment / health_foods: scripts/seed-product-db-v2.ts만 존재 (50/100행,
--     health_foods는 taste_rating/mixability_rating도 임의 기입)
--   그 외: UPDATE 경로 없음. 트리거는 updated_at 갱신뿐(202512040300/0500 확인).
--   사용자 리뷰는 별도 테이블(product_reviews)로, 이 컬럼들을 집계 갱신하지 않음.
--
-- ∴ 이 4개 테이블에서 rating IS NOT NULL 또는 review_count > 0 인 행 = 전부 시드 유래 허구값.
--   (실측 평점이 존재할 수 있는 affiliate_products는 대상 아님 — 파트너 API 실데이터)
--
-- ============================================
-- 사전 확인 (적용 전 실행 권장 — 예상: cosmetic ~500, supplement ~200,
--            workout_equipment ~50, health_foods ~100)
-- ============================================
-- SELECT 'cosmetic_products' AS t, COUNT(*) FROM cosmetic_products
--   WHERE rating IS NOT NULL OR COALESCE(review_count, 0) > 0
-- UNION ALL
-- SELECT 'supplement_products', COUNT(*) FROM supplement_products
--   WHERE rating IS NOT NULL OR COALESCE(review_count, 0) > 0
-- UNION ALL
-- SELECT 'workout_equipment', COUNT(*) FROM workout_equipment
--   WHERE rating IS NOT NULL OR COALESCE(review_count, 0) > 0
-- UNION ALL
-- SELECT 'health_foods', COUNT(*) FROM health_foods
--   WHERE rating IS NOT NULL OR COALESCE(review_count, 0) > 0
--      OR taste_rating IS NOT NULL OR mixability_rating IS NOT NULL;

-- ============================================
-- 데이터 정정 (Forward)
-- ============================================

-- 1. 화장품: 시드 500행의 가짜 평점 제거 (수집기 행은 이미 rating=null·review_count=0 → 무영향)
UPDATE cosmetic_products
SET rating = NULL,
    review_count = NULL
WHERE rating IS NOT NULL
   OR COALESCE(review_count, 0) > 0;

-- 2. 영양제: 시드 200행 동일 패턴
UPDATE supplement_products
SET rating = NULL,
    review_count = NULL
WHERE rating IS NOT NULL
   OR COALESCE(review_count, 0) > 0;

-- 3. 운동 기구: 시드 50행 (W-1 UI 숨김 상태지만 코드/DB 유지 — 데이터도 정직하게)
UPDATE workout_equipment
SET rating = NULL,
    review_count = NULL
WHERE rating IS NOT NULL
   OR COALESCE(review_count, 0) > 0;

-- 4. 건강식품: 시드 100행 + 맛/용해성 평점도 임의 기입이었음
UPDATE health_foods
SET rating = NULL,
    review_count = NULL,
    taste_rating = NULL,
    mixability_rating = NULL
WHERE rating IS NOT NULL
   OR COALESCE(review_count, 0) > 0
   OR taste_rating IS NOT NULL
   OR mixability_rating IS NOT NULL;

-- ============================================
-- 사후 검증 (전부 0이어야 함)
-- ============================================
-- SELECT 'cosmetic_products' AS t, COUNT(*) FROM cosmetic_products
--   WHERE rating IS NOT NULL OR COALESCE(review_count, 0) > 0
-- UNION ALL
-- SELECT 'supplement_products', COUNT(*) FROM supplement_products
--   WHERE rating IS NOT NULL OR COALESCE(review_count, 0) > 0
-- UNION ALL
-- SELECT 'workout_equipment', COUNT(*) FROM workout_equipment
--   WHERE rating IS NOT NULL OR COALESCE(review_count, 0) > 0
-- UNION ALL
-- SELECT 'health_foods', COUNT(*) FROM health_foods
--   WHERE rating IS NOT NULL OR COALESCE(review_count, 0) > 0
--      OR taste_rating IS NOT NULL OR mixability_rating IS NOT NULL;
