# Product DB 데이터 입력 가이드

> **작성일**: 2025-12-04
> **버전**: 2.0
> **목적**: Product DB v1 초기 데이터 입력 방법 안내

---

## 1. 개요

### 데이터 수량 (완료)

| 카테고리 | 목표 | 현재 시드 | 상태 |
|----------|------|----------|------|
| 클렌저 | 20개 | 20개 | ✅ |
| 토너 | 20개 | 20개 | ✅ |
| 세럼/에센스 | 25개 | 25개 | ✅ |
| 수분크림 | 20개 | 20개 | ✅ |
| 선크림 | 15개 | 15개 | ✅ |
| 메이크업 | 33개 | 33개 | ✅ |
| 마스크 | 2개 | 2개 | ✅ |
| **화장품 소계** | **135개** | **135개** | ✅ |
| 영양제 | 30개 | 30개 | ✅ |
| **총계** | **165개** | **165개** | ✅ |

---

## 2. 시드 스크립트 사용법

### 환경 변수 설정

```bash
# .env.local에 추가
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### 스크립트 실행

```bash
# 시드 데이터 입력
npx tsx scripts/seed-products.ts
```

### 출력 예시

```
🚀 Product DB 시드 시작
========================================

📦 화장품 데이터 입력 시작...
  총 30개 제품 발견
  ✅ 30개 화장품 입력 완료

💊 영양제 데이터 입력 시작...
  총 20개 제품 발견
  ✅ 20개 영양제 입력 완료

🔍 데이터 검증...
  화장품: 30개
  영양제: 20개
  총: 50개

✅ 시드 완료!
```

---

## 3. 시드 데이터 파일 형식

### 화장품 (data/seeds/cosmetic-products.json)

```json
{
  "products": [
    {
      "name": "제품명",
      "brand": "브랜드명",
      "category": "toner",
      "subcategory": null,
      "price_range": "budget",
      "price_krw": 18000,
      "skin_types": ["dry", "sensitive", "normal"],
      "concerns": ["hydration", "redness"],
      "key_ingredients": ["히알루론산", "판테놀"],
      "avoid_ingredients": [],
      "personal_color_seasons": null,
      "image_url": null,
      "purchase_url": null,
      "rating": 4.5,
      "review_count": 15000
    }
  ]
}
```

#### 필드 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | ✅ | 제품명 |
| brand | string | ✅ | 브랜드명 |
| category | string | ✅ | cleanser, toner, serum, moisturizer, sunscreen, mask, makeup |
| subcategory | string | - | foam, oil, gel, essence, cream, sheet, lip, eye, foundation, powder, contour |
| price_range | string | - | budget (<30,000), mid (30,000-50,000), premium (>50,000) |
| price_krw | number | - | 실제 가격 (원) |
| skin_types | string[] | - | dry, oily, combination, sensitive, normal |
| concerns | string[] | - | acne, aging, whitening, hydration, pore, redness |
| key_ingredients | string[] | - | 주요 성분 |
| avoid_ingredients | string[] | - | 피해야 할 성분 |
| personal_color_seasons | string[] | - | Spring, Summer, Autumn, Winter (메이크업용) |
| rating | number | - | 평점 (0-5) |
| review_count | number | - | 리뷰 수 |

### 영양제 (data/seeds/supplement-products.json)

```json
{
  "products": [
    {
      "name": "제품명",
      "brand": "브랜드명",
      "category": "probiotic",
      "benefits": ["digestion", "immunity"],
      "main_ingredients": [
        {"name": "유산균 혼합분말", "amount": 100, "unit": "mg"}
      ],
      "target_concerns": ["소화불량", "장건강", "면역력"],
      "price_krw": 25000,
      "dosage": "1일 1포",
      "serving_size": 1,
      "total_servings": 60,
      "rating": 4.6,
      "review_count": 50000,
      "warnings": []
    }
  ]
}
```

#### 필드 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | ✅ | 제품명 |
| brand | string | ✅ | 브랜드명 |
| category | string | ✅ | vitamin, mineral, protein, omega, probiotic, collagen, other |
| benefits | string[] | - | skin, hair, energy, immunity, digestion, sleep, muscle, bone |
| main_ingredients | object[] | - | {name, amount, unit} 배열 |
| target_concerns | string[] | - | 한국어 고민 (피부건조, 탈모 등) |
| dosage | string | - | 복용량 (1일 1정 등) |
| warnings | string[] | - | 주의사항 |

---

## 4. 데이터 수집 소스

### 화장품

| 소스 | URL | 특징 |
|------|-----|------|
| 올리브영 | oliveyoung.co.kr | 국내 최대 H&B, 리뷰 풍부 |
| 화해 | hwahae.co.kr | 성분 분석, 피부 타입별 추천 |
| 글로우픽 | glowpick.com | 리뷰 기반 랭킹 |
| 시코르 | chicor.com | 프리미엄 브랜드 |

### 영양제

| 소스 | URL | 특징 |
|------|-----|------|
| 아이허브 | kr.iherb.com | 해외 직구, 성분 상세 |
| 필라이즈 | pillyze.com | 성분 분석, 조합 추천 |
| GNC | gnc.co.kr | 프리미엄 영양제 |
| 약사랑 약국 | - | 국내 제품 |

---

## 5. 수동 데이터 추가

### Supabase Studio에서 직접 입력

1. Supabase Dashboard 접속
2. Table Editor → cosmetic_products 또는 supplement_products
3. Insert row 클릭
4. 필드 입력 후 Save

### SQL INSERT 사용

```sql
-- 화장품 추가
INSERT INTO cosmetic_products (
  name, brand, category, price_range, price_krw,
  skin_types, concerns, key_ingredients, rating, review_count
) VALUES (
  '제품명', '브랜드', 'serum', 'mid', 35000,
  ARRAY['dry', 'normal'], ARRAY['hydration'], ARRAY['히알루론산'],
  4.5, 10000
);

-- 영양제 추가
INSERT INTO supplement_products (
  name, brand, category, benefits, main_ingredients,
  target_concerns, price_krw, dosage, rating, review_count
) VALUES (
  '제품명', '브랜드', 'vitamin',
  ARRAY['energy', 'immunity'],
  '[{"name": "비타민C", "amount": 1000, "unit": "mg"}]'::jsonb,
  ARRAY['피로', '면역력'],
  20000, '1일 1정', 4.5, 5000
);
```

---

## 6. 데이터 검증

### 필수 확인 사항

- [ ] category 값이 유효한지 확인
- [ ] price_range와 price_krw 일관성
- [ ] skin_types/concerns 배열 값이 유효한지
- [ ] 메이크업 제품의 personal_color_seasons 입력
- [ ] rating이 0-5 범위인지

### 검증 쿼리

```sql
-- 카테고리별 제품 수
SELECT category, COUNT(*) as count
FROM cosmetic_products
WHERE is_active = true
GROUP BY category;

-- 브랜드별 제품 수
SELECT brand, COUNT(*) as count
FROM cosmetic_products
WHERE is_active = true
GROUP BY brand
ORDER BY count DESC;

-- 퍼스널 컬러 미입력 메이크업
SELECT name, brand, subcategory
FROM cosmetic_products
WHERE category = 'makeup'
  AND personal_color_seasons IS NULL;
```

---

## 7. 다음 단계

### 우선순위

1. **시드 데이터 실행** - 현재 50개 입력
2. **카테고리별 추가** - 목표 165개까지
3. **이미지 URL 추가** - 제품 이미지 (선택)
4. **구매 URL 추가** - 어필리에이트 링크 (Phase C)

### Phase C 준비

- 크롤러 개발 검토
- 가격 실시간 업데이트 시스템
- 사용자 리뷰 통합

---

**버전**: 1.0 | **최종 업데이트**: 2025-12-04
