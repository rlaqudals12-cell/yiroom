# 어필리에이트 API 비교 및 모듈별 제품 매핑 리서치

> **ID**: AFFILIATE-API-R1
> **Date**: 2026-02-10
> **Status**: Completed
> **Purpose**: P7 1단계 - 어필리에이트 파트너 API 비교, 모듈별 제품 카테고리 매핑, 글로벌 확장성 평가
> **관련 ADR**: ADR-029 (어필리에이트 통합), ADR-054 (어필리에이트 우선 수익화)
> **선행 리서치**: RECOMMENDATION-ENGINE-RESEARCH.md (추천 엔진 설계)

---

## 0. 리서치 질문

1. 각 어필리에이트 API의 제품 검색/데이터 수준은?
2. 모듈별(PC-1~M-1) 어떤 제품 카테고리를 어떤 파트너에서 가져와야 하는가?
3. 글로벌 시장에서 동일 아키텍처로 확장 가능한가?
4. API 폐기/변경 리스크는?
5. 현재 코드베이스(lib/products/)와의 통합 전략은?

---

## 1. 어필리에이트 API 비교 (2026-02 기준)

### 1.1 한국 시장

| 플랫폼            | API 유무          | 제품 검색           | 이미지 | 가격       | 커미션              | 특이사항                            |
| ----------------- | ----------------- | ------------------- | ------ | ---------- | ------------------- | ----------------------------------- |
| **쿠팡 Partners** | O (Open API)      | O (키워드/카테고리) | O      | O (실시간) | 3-10%               | 가장 완성도 높음                    |
| **올리브영**      | X (직접 API 없음) | X                   | X      | X          | 13% (네트워크 경유) | Involve Asia/FlexOffers 경유만 가능 |
| **무신사**        | 제한적            | 제한적              | O      | O          | 5-8%                | 파트너 계약 필요                    |
| **네이버 쇼핑**   | O (검색 API)      | O                   | O      | O          | 2-5%                | 복잡한 인증                         |

#### 쿠팡 Partners API 상세

- **공식 문서**: [developers.coupangcorp.com](https://developers.coupangcorp.com/hc/en-us)
- **파트너 개발자 포털**: [partner-developers.coupangcorp.com](https://partner-developers.coupangcorp.com/hc/en-us)
- **기능**: 제품 등록/조회/검색, HMAC 인증
- **강점**: 한국 최대 이커머스, 모든 카테고리 커버, 실시간 가격/재고
- **제약**: 한국 시장 한정

#### 올리브영 (간접 연동)

- **어필리에이트**: [Involve Asia](https://app.involve.asia/directory/olive-young-global-affiliate-program), FlexOffers 경유
- **커미션**: 13% (글로벌), 10일 쿠키
- **2026 확장**: Sephora 파트너십으로 미국/캐나다 700개 매장 + 태국/홍콩/말레이시아/싱가포르 48개 매장 진출 예정 (2026년 가을)
- **제약**: 제품 검색 API 없음 → 수동 큐레이션 또는 스크래핑 필요
- **출처**: [Sephora x Olive Young 파트너십](https://newsroom.sephora.com/sephora-and-olive-young-partner-to-bring-the-best-of-korean-beauty-to-sephora-consumers/)

### 1.2 글로벌 시장

| 플랫폼                  | API 유무          | 제품 검색     | 이미지 | 가격 | 커미션          | 특이사항                      |
| ----------------------- | ----------------- | ------------- | ------ | ---- | --------------- | ----------------------------- |
| **Amazon Creators API** | O (신규)          | O             | O      | O    | 1-10%           | PA-API 후속, 2026년 필수 전환 |
| **CJ Affiliate**        | O (네트워크)      | 네트워크 경유 | O      | O    | 5-10% (Sephora) | Sephora, Ulta 포함            |
| **iHerb**               | X (공식 API 없음) | X             | X      | X    | 5-10%           | 제3자 스크래퍼만 존재         |
| **Rakuten**             | O (네트워크)      | 네트워크 경유 | O      | O    | 다양            | 럭셔리 브랜드 강점            |

#### Amazon Creators API (핵심 - PA-API 대체)

- **공식 문서**: [PA-API 5.0 (레거시)](https://webservices.amazon.com/paapi5/documentation/)
- **중요**: PA-API는 **2026년 4월 30일 폐기**. 신규 가입 불가. Creators API로 전환 필수
- **Creators API 특징**:
  - OAuth 2.0 토큰 기반 (AWS 키 불가)
  - 동일 기능: Search/Get/Variations
  - 케이싱 변경: `ItemIds` → `itemIds`, `PartnerTag` → `partnerTag`
  - 제품 검색, 가격, 이미지, 리뷰 데이터 모두 제공
- **글로벌 커버리지**: 20+ 국가 Amazon 마켓플레이스
- **뷰티 카테고리**: "Beauty" SearchIndex로 화장품/스킨케어/헤어케어 전체 검색 가능
- **출처**: [Amazon Creators API 마이그레이션 가이드](https://www.keywordrush.com/blog/amazon-creator-api-what-changed-and-how-to-switch/)

#### CJ Affiliate (Sephora, Ulta)

- **Sephora**: CJ Affiliate 경유, 커미션 5-10%
- **Ulta**: Impact 프로그램, 커미션 ~2%
- **강점**: 한 번 네트워크 연동으로 수천 뷰티 브랜드 접근
- **제약**: 제품 검색 API가 아닌 딥링크 생성 + 전환 추적 위주
- **출처**: [Sephora Affiliate](https://www.sephora.com/beauty/affiliates), [Ulta Affiliate](https://www.ulta.com/company/affiliate)

#### iHerb (건강/뷰티 보충제)

- **공식 API**: 없음
- **대안**: Apify, RapidAPI 등 제3자 스크래핑 서비스
- **어필리에이트**: 자체 프로그램 운영 (5-10%), 185+ 국가
- **제약**: 제품 데이터 수동 관리 필요
- **출처**: [RapidAPI iHerb](https://rapidapi.com/daniel.hpassos/api/iherb-product-data-api)

---

## 2. 모듈별 제품 카테고리 매핑

### 2.1 현재 구현 현황

| 모듈            | DB 테이블                    | RecommendedProducts | 시드 데이터 | image_url | affiliate_url |
| --------------- | ---------------------------- | ------------------- | ----------- | --------- | ------------- |
| PC-1 퍼스널컬러 | cosmetic_products (makeup)   | O                   | 500개       | **null**  | **null**      |
| S-1 피부        | cosmetic_products (skincare) | O                   | 500개       | **null**  | **null**      |
| C-1 체형        | workout_equipment            | O                   | 있음        | **null**  | **null**      |
| H-1 헤어        | **없음**                     | **X**               | **없음**    | -         | -             |
| M-1 메이크업    | cosmetic_products 일부       | **X**               | 부분적      | **null**  | **null**      |

### 2.2 모듈 → 제품 카테고리 → 어필리에이트 파트너 매핑

```
PC-1 (퍼스널컬러) → 메이크업 (립, 아이, 블러셔, 파운데이션)
  ├── KR: 올리브영 (Involve Asia 경유) + 쿠팡
  ├── US: Sephora (CJ Affiliate) + Amazon Creators API
  └── Global: Amazon Creators API

S-1 (피부) → 스킨케어 (클렌저, 토너, 세럼, 수분크림, 선크림)
  ├── KR: 올리브영 (Involve Asia) + 쿠팡
  ├── US: Sephora (CJ) + Amazon
  └── Global: Amazon + iHerb (보충제 경유)

C-1 (체형) → 운동 기구 (덤벨, 밴드, 매트, 폼롤러)
  ├── KR: 쿠팡
  ├── US: Amazon
  └── Global: Amazon

H-1 (헤어) → 헤어케어 (샴푸, 컨디셔너, 트리트먼트, 두피케어)
  ├── KR: 올리브영 + 쿠팡
  ├── US: Sephora (CJ) + Amazon
  └── Global: Amazon + iHerb

M-1 (메이크업) → 메이크업 (파운데이션, 립, 아이, 컨투어링)
  ├── KR: 올리브영 + 쿠팡
  ├── US: Sephora (CJ) + Ulta
  └── Global: Amazon + Sephora
```

### 2.3 H-1 헤어 분석 — 필요 제품 카테고리

현재 `cosmetic_products` 테이블 카테고리에 헤어케어가 **없음**.

| 필요 카테고리 | DB 처리 방안             | 매칭 기준                |
| ------------- | ------------------------ | ------------------------ |
| shampoo       | cosmetic_products에 추가 | hair_type, scalp_type    |
| conditioner   | cosmetic_products에 추가 | hair_type, damage_level  |
| treatment     | cosmetic_products에 추가 | concerns (damage, frizz) |
| scalp_care    | cosmetic_products에 추가 | scalp_type, concerns     |
| hair_oil      | cosmetic_products에 추가 | hair_type                |
| hair_styling  | cosmetic_products에 추가 | hair_type, style_goal    |

**결정 필요**: 새 테이블 vs cosmetic_products 확장 → ADR에서 결정

### 2.4 M-1 메이크업 분석 — 매핑 로직

현재 PC-1과 M-1이 동일한 `makeup` 카테고리를 공유하지만 필터링 기준이 다름:

| 기준         | PC-1 필터            | M-1 필터                      |
| ------------ | -------------------- | ----------------------------- |
| 색상         | personalColorSeasons | undertone + 분석 추천색       |
| 얼굴형       | 없음                 | faceShape (컨투어링용)        |
| 피부톤       | season 기반          | 직접 톤 분석                  |
| 서브카테고리 | 전체 메이크업        | foundation/lip/eye/blush 각각 |

---

## 3. 글로벌 확장성 평가

### 3.1 아키텍처 호환성

현재 `lib/products/` Adapter 패턴으로 확장 가능:

```typescript
// 기존 인터페이스 (lib/products/affiliate.ts)
trackAffiliateClick(input); // → affiliate_clicks 테이블
openAffiliateLink(url, type, id, userId); // → 새 탭 + 트래킹

// 확장 필요: Partner Adapter 인터페이스
interface PartnerAdapter {
  partnerId: string;
  searchProducts(query: ProductQuery): Promise<PartnerProduct[]>;
  generateAffiliateUrl(productId: string, userId?: string): string;
  getProductDetails(productId: string): Promise<PartnerProduct | null>;
}
```

### 3.2 지역별 파트너 라우팅

```typescript
// 사용자 로케일 → 파트너 자동 선택
const PARTNER_ROUTING: Record<string, string[]> = {
  'ko-KR': ['coupang', 'oliveyoung'],
  'en-US': ['amazon-us', 'sephora'],
  'en-GB': ['amazon-uk', 'awin'],
  'ja-JP': ['amazon-jp', 'rakuten-jp'],
  default: ['amazon-us', 'iherb'],
};
```

### 3.3 리스크 평가

| 리스크                          | 영향 | 대응                                               |
| ------------------------------- | ---- | -------------------------------------------------- |
| Amazon PA-API 폐기 (2026-04-30) | 높음 | Creators API로 즉시 시작                           |
| 올리브영 API 부재               | 중간 | 시드 데이터 + 수동 큐레이션, Sephora 파트너십 활용 |
| iHerb API 부재                  | 낮음 | 보충제는 Amazon으로 대체 가능                      |
| CJ 네트워크 승인                | 중간 | 트래픽 확보 후 신청 (MAU 1K+)                      |

---

## 4. 현재 코드베이스와의 Gap 분석

### 4.1 이미 있는 것 (재사용 가능)

| 구성요소            | 파일                                              | 상태                            |
| ------------------- | ------------------------------------------------- | ------------------------------- |
| 매칭 알고리즘       | lib/products/matching.ts                          | ✅ 완전 구현 (대중성 보정 포함) |
| 어필리에이트 트래킹 | lib/products/affiliate.ts                         | ✅ 클릭 추적 + 통계             |
| Repository 패턴     | lib/products/repositories/                        | ✅ 4개 제품 타입                |
| 통합 검색           | lib/products/services/search.ts                   | ✅ 카테고리별 검색              |
| 추천 UI             | components/analysis/RecommendedProducts.tsx       | ✅ PC-1/S-1/C-1 지원            |
| 타입 시스템         | types/product.ts                                  | ✅ 4개 제품 타입 완전 정의      |
| 시드 데이터         | data/seeds/cosmetic-products.json                 | ⚠️ 500개, image_url null        |
| DB 테이블           | 4개 (cosmetic, supplement, equipment, healthfood) | ✅ 스키마 + GIN 인덱스          |

### 4.2 없는 것 (구현 필요)

| 구성요소                       | 필요성                                 | 우선순위       |
| ------------------------------ | -------------------------------------- | -------------- |
| **Partner Adapter 인터페이스** | API 호출 추상화                        | 높음           |
| **이미지 URL 채우기**          | 제품 카드에 이미지 없음                | 높음           |
| **H-1 추천 연동**              | RecommendedProducts에 hair 타입 없음   | 중간           |
| **M-1 추천 연동**              | RecommendedProducts에 makeup 타입 없음 | 중간           |
| **헤어케어 카테고리**          | DB에 shampoo 등 카테고리 없음          | 중간           |
| **로케일 기반 파트너 라우팅**  | 글로벌 확장 시                         | 낮음 (Phase 2) |
| **가격 실시간 동기화**         | API 배치 호출                          | 낮음 (Phase 2) |

---

## 5. 권장 실행 순서

### Phase 1: 즉시 가능 (코드 변경만, API 연동 없음)

1. **시드 데이터에 image_url 추가** — 올리브영/쿠팡 제품 이미지 URL
2. **시드 데이터에 purchase_url 추가** — 쿠팡/올리브영 딥링크
3. **H-1 추천 UI 연동** — RecommendedProducts에 `hair` 타입 추가
4. **M-1 추천 UI 연동** — RecommendedProducts에 `makeup` 타입 추가
5. **헤어케어 카테고리 추가** — cosmetic_products에 shampoo/conditioner 등

### Phase 2: 쿠팡 Partners API 연동 (한국 시장)

1. Partner Adapter 인터페이스 설계
2. 쿠팡 어댑터 구현 (제품 검색 + 딥링크)
3. 가격/이미지 배치 동기화 (하루 1회)
4. 올리브영 수동 큐레이션 (API 없으므로)

### Phase 3: 글로벌 확장 (Amazon Creators API)

1. Amazon Creators API 어댑터 구현
2. 로케일 기반 파트너 라우팅
3. CJ Affiliate 네트워크 연동 (Sephora)
4. 다국어 제품명/설명 처리

---

## 6. 참고 자료

- [Coupang Open API](https://developers.coupangcorp.com/hc/en-us)
- [Coupang Partner Developers](https://partner-developers.coupangcorp.com/hc/en-us)
- [Amazon PA-API 5.0 (레거시, 2026-04-30 폐기)](https://webservices.amazon.com/paapi5/documentation/)
- [Amazon Creators API 마이그레이션](https://www.keywordrush.com/blog/amazon-creator-api-what-changed-and-how-to-switch/)
- [Sephora Affiliate Program](https://www.sephora.com/beauty/affiliates)
- [Ulta Beauty Affiliate](https://www.ulta.com/company/affiliate)
- [Olive Young Global Affiliate (Involve Asia)](https://app.involve.asia/directory/olive-young-global-affiliate-program)
- [Sephora x Olive Young 파트너십 (2026 가을)](https://newsroom.sephora.com/sephora-and-olive-young-partner-to-bring-the-best-of-korean-beauty-to-sephora-consumers/)
- [35 Best Beauty Affiliate Programs 2026](https://tapfiliate.com/blog/beauty-affiliate-programs/)
- [Olive Young 커미션 상세](https://getlasso.co/affiliate/olive-young/)

---

**Version**: 1.0 | **Created**: 2026-02-10
