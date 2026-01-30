# ADR-032: 스마트 매칭 아키텍처 (Phase J)

## 상태

`accepted`

## 날짜

2026-01-19

## 맥락 (Context)

이룸은 모든 분석 결과(PC-1, S-1, C-1, W-1, N-1)를 통합하여 화장품, 보충제, 운동 장비, 건강식품을 지능적으로 추천하는 시스템이 필요합니다.

### 요구사항

1. **다중 요소 매칭**: 피부타입, 퍼스널컬러, 체형, 운동 목표, 영양 목표 통합
2. **인기도 반영**: 가격 접근성, 브랜드 인지도, 리뷰 점수
3. **사이즈 추천**: 브랜드별 사이즈 차트 기반 예측
4. **가격 모니터링**: 다중 플랫폼 가격 비교 및 알림
5. **피드백 학습**: 사용자 구매/핏 피드백 반영

## P1: 궁극의 형태 (Ultimate Form)

> 원리 참조: [00-first-principles.md](../../.claude/rules/00-first-principles.md) P1

### 이상적 최종 상태

**제약이 없다면**:
- 모든 제품 DB 실시간 연동 (가격, 재고, 리뷰)
- 사용자별 100% 개인화된 추천 (구매 이력, 피드백 반영)
- 완벽한 사이즈 예측 (브랜드별 편차 0%)
- 실시간 가격 알림 및 자동 구매
- 5개 분석 모듈 완전 통합 시너지

### 물리적 한계

| 제약 | 현실 | 완화 |
|------|------|------|
| 제품 DB 범위 | 파트너 제품만 | 어필리에이트 확대 |
| 사이즈 정확도 | 브랜드별 편차 | 피드백 학습 |
| 실시간 가격 | API 제한 | 주기적 크롤링 |
| 개인화 수준 | 콜드 스타트 문제 | 기본 스코어링 |

### 100점 기준

| 항목 | 100점 기준 | 현재 목표 |
|------|-----------|----------|
| 매칭 정확도 | 사용자 만족 95%+ | 75% |
| 사이즈 추천 정확도 | 반품률 5% 미만 | 15% |
| 가격 정보 최신성 | 실시간 | 24시간 이내 |
| 모듈 연동 | 5개 완전 통합 | 3개 부분 통합 |
| 전환율 | 15%+ | 8% |

### 현재 목표

**Phase 1: 60%** (기본 매칭 시스템)
- 도메인 스코어 + 인기도 보정
- 기본 사이즈 추천 (브랜드 차트 기반)
- 가격 비교 (주요 파트너 3곳)
- PC-1, S-1, C-1 연동

### 의도적 제외

| 제외 항목 | 사유 | 재검토 시점 |
|----------|------|------------|
| 협업 필터링 | 콜드 스타트 문제 | MAU 10K+ |
| ML 랭킹 | 설명 가능성 필요 | Phase 2 |
| 자동 구매 | 결제 시스템 미구축 | 구독 도입 시 |
| 글로벌 파트너 | 한국 시장 우선 | 글로벌 확장 시 |

---

## 결정 (Decision)

**다중 요소 스코어링 + 인기도 보정 시스템** 아키텍처 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                스마트 매칭 아키텍처 (Phase J)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  사용자 프로필 조립                                          │
│  ├── PC-1 → 시즌 타입, 컬러 톤                              │
│  ├── S-1 → 피부 타입, 피부 고민                             │
│  ├── C-1 → 체형, 신체 치수                                  │
│  ├── W-1 → 운동 목표, 타겟 근육, 스킬 레벨                  │
│  └── N-1 → 영양 목표, 식이 제한                             │
│                                                              │
│  스코어 계산 (0-100점)                                       │
│  ├── 도메인 점수 (0-50점)                                   │
│  │   ├── 화장품: 피부타입(30) + 피부고민(30) + 컬러(20)     │
│  │   ├── 보충제: 피부효과(30) + 영양목표(30) + 운동시너지(20) │
│  │   ├── 운동장비: 타겟근육(40) + 스킬레벨(30) + 공간(10)   │
│  │   └── 건강식품: 운동목표(40) + 식이제한(30)              │
│  │                                                           │
│  └── 인기도 보정 (0-50점)                                   │
│      ├── 가격 접근성: 저가(+15), 중가(+8), 고가(0)          │
│      ├── 인기 브랜드: 올영 베스트셀러 등 (+12)              │
│      ├── 리뷰 수: 10k+(+15), 1k+(+10), 100+(+5)             │
│      └── 평점: 4.5+★(+10), 4.0+★(+5)                        │
│                                                              │
│  결과 생성                                                   │
│  ├── 매치 점수 정렬                                         │
│  ├── 매치 이유 생성 (왜 이 제품인지)                        │
│  ├── 사이즈 추천 (의류/장비)                                │
│  └── 가격 비교 (쿠팡, 올영, 무신사 등)                      │
│                                                              │
│  부가 기능                                                   │
│  ├── 가격 알림: 목표가 도달 시 푸시                         │
│  ├── 재입고 알림: 품절 상품 재입고 시                       │
│  ├── 유사 상품: 품절/예산 초과 시 대안                      │
│  └── 피드백 수집: 구매 후 핏/만족도                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 매칭 스코어 계산

```typescript
interface MatchScore {
  total: number;           // 0-100
  domainScore: number;     // 0-50
  popularityScore: number; // 0-50
  reasons: string[];       // 매치 이유
}

function calculateMatchScore(
  product: Product,
  profile: UserProfile
): MatchScore {
  // 1. 도메인 점수 (카테고리별)
  const domainScore = calculateDomainScore(product, profile);

  // 2. 인기도 점수
  const popularityScore = calculatePopularityScore(product);

  // 3. 총점
  const total = Math.min(100, domainScore + popularityScore);

  return {
    total,
    domainScore,
    popularityScore,
    reasons: generateMatchReasons(product, profile, domainScore),
  };
}
```

### 카테고리별 도메인 스코어

```typescript
function calculateDomainScore(
  product: Product,
  profile: UserProfile
): number {
  switch (product.category) {
    case 'cosmetic':
      return calculateCosmeticScore(product, profile);
    case 'supplement':
      return calculateSupplementScore(product, profile);
    case 'equipment':
      return calculateEquipmentScore(product, profile);
    case 'healthFood':
      return calculateHealthFoodScore(product, profile);
    default:
      return 0;
  }
}

// 화장품 매칭 (최대 50점)
function calculateCosmeticScore(product: Product, profile: UserProfile): number {
  let score = 0;

  // 피부 타입 매치 (0-30점)
  if (product.suitableSkinTypes?.includes(profile.skinType)) {
    score += 30;
  }

  // 피부 고민 매치 (0-30점)
  const concernMatch = profile.skinConcerns?.filter(
    c => product.targetConcerns?.includes(c)
  ).length ?? 0;
  score += Math.min(30, concernMatch * 10);

  // 퍼스널컬러 매치 - 메이크업만 (0-20점)
  if (product.subCategory === 'makeup' &&
      product.suitableSeasons?.includes(profile.personalColorSeason)) {
    score += 20;
  }

  return Math.min(50, score);
}

// 보충제 매칭 (최대 50점)
function calculateSupplementScore(product: Product, profile: UserProfile): number {
  let score = 0;

  // 피부 효과 매치 (0-30점)
  if (product.skinBenefits?.some(b => profile.skinConcerns?.includes(b))) {
    score += 30;
  }

  // 영양 목표 매치 (0-30점)
  if (product.nutritionGoals?.some(g => profile.nutritionGoals?.includes(g))) {
    score += 30;
  }

  // 운동 시너지 (0-20점)
  if (product.workoutSynergy?.some(s => profile.workoutGoals?.includes(s))) {
    score += 20;
  }

  return Math.min(50, score);
}
```

### 인기도 보정 스코어

```typescript
function calculatePopularityScore(product: Product): number {
  let score = 0;

  // 가격 접근성 (0-15점)
  if (product.priceRange === 'budget') score += 15;
  else if (product.priceRange === 'mid') score += 8;
  // premium: 0점

  // 인기 브랜드 (0-12점)
  if (POPULAR_BRANDS.includes(product.brand)) {
    score += 12;
  }

  // 리뷰 수 (0-15점)
  if (product.reviewCount >= 10000) score += 15;
  else if (product.reviewCount >= 1000) score += 10;
  else if (product.reviewCount >= 100) score += 5;

  // 평점 (0-10점)
  if (product.rating >= 4.5 && product.reviewCount >= 100) score += 10;
  else if (product.rating >= 4.0 && product.reviewCount >= 100) score += 5;

  return Math.min(50, score);
}

// 인기 브랜드 목록
const POPULAR_BRANDS = {
  skincare: ['라운드랩', '아누아', '토리든', '달바', '닥터지', '클레어스'],
  supplements: ['종근당건강', '뉴트리원', '센트룸', '솔가', 'GNC'],
  equipment: ['하이퍼', '핏번', '나이키', '아디다스'],
  healthFood: ['마이프로틴', '옵티멈 뉴트리션', '머슬팜'],
};
```

### 사이즈 추천 시스템

```typescript
interface SizeRecommendation {
  recommendedSize: string;
  confidence: 'high' | 'medium' | 'low';
  alternativeSize?: string;
  reasoning: string;
}

function recommendSize(
  product: Product,
  measurements: UserBodyMeasurements,
  sizeHistory: UserSizeHistory[]
): SizeRecommendation {
  // 1. 브랜드별 사이즈 차트 조회
  const sizeChart = getBrandSizeChart(product.brand);

  // 2. 사용자 치수 기반 추천
  const baseRecommendation = matchSizeFromMeasurements(
    sizeChart,
    measurements
  );

  // 3. 구매 이력 보정
  const adjustedSize = adjustFromHistory(
    baseRecommendation,
    sizeHistory,
    product.brand
  );

  return adjustedSize;
}
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 협업 필터링 | 유사 사용자 패턴 | 콜드 스타트 문제 | `COLD_START` - 초기 데이터 부족 |
| 콘텐츠 기반만 | 콜드 스타트 없음 | 발견성 제한 | `LOW_DISCOVERY` - 새 제품 추천 어려움 |
| ML 랭킹 | 정교한 순위 | 설명 불가 | `LOW_EXPLAINABILITY` - 이유 설명 중요 |
| 단순 규칙 | 투명함 | 개인화 제한 | `LOW_PERSONALIZATION` |

## 결과 (Consequences)

### 긍정적 결과

- **통합 개인화**: 5개 모듈 데이터 활용
- **설명 가능**: 왜 이 제품인지 명확히 표시
- **구매 전환**: 인기도 보정으로 접근성 높은 제품 우선
- **사이즈 정확도**: 브랜드별 차트 + 피드백 학습

### 부정적 결과

- **복잡한 스코어링**: 유지보수 비용
- **브랜드 편향**: 인기 브랜드 과대 노출 가능

### 리스크 완화

- 복잡도 → **모듈화된 스코어 계산 함수**
- 편향 → **"숨은 보석" 섹션으로 신규 브랜드 노출**

## 구현 가이드

### 파일 구조

```
lib/products/
├── matching.ts               # 매칭 스코어 계산
├── popularity.ts             # 인기도 스코어
├── size-recommendation.ts    # 사이즈 추천
├── price-comparison.ts       # 가격 비교
└── notifications.ts          # 알림 관리

types/smart-matching.ts       # 타입 정의 (640+ lines)

supabase/migrations/
└── 202512290300_phase_j_smart_matching.sql
    ├── user_preferences       # 사용자 설정
    ├── user_body_measurements # 신체 치수
    ├── user_size_history      # 구매 이력
    ├── brand_size_charts      # 브랜드 사이즈
    ├── price_watch            # 가격 모니터링
    ├── price_history          # 가격 이력
    ├── user_feedback          # 피드백
    └── smart_notifications    # 알림
```

### 알림 타입

```typescript
type NotificationType =
  | 'price_drop'       // 가격 하락
  | 'restock'          // 재입고
  | 'expiry_warning'   // 만료 임박 (보충제)
  | 'similar_product'  // 유사 제품 추천
  | 'size_back'        // 사이즈 재입고
  | 'review_update'    // 리뷰 업데이트
  | 'promotion'        // 프로모션
  | 'weekly_digest';   // 주간 요약
```

### API 엔드포인트

```typescript
// 제품 추천
GET /api/products/recommend
  ?category=cosmetic
  &limit=20

// 가격 모니터링 등록
POST /api/products/watch
  { productId, targetPrice }

// 피드백 제출
POST /api/products/feedback
  { productId, type, rating, comment }

// 사이즈 추천
GET /api/products/:id/size
  ?brand=xxx
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 크로스도메인 시너지](../principles/cross-domain-synergy.md) - 모듈 간 시너지 점수
- [원리: RAG 검색](../principles/rag-retrieval.md) - 제품 검색 최적화

### 관련 ADR/스펙
- [ADR-011: Cross-Module Data Flow](./ADR-011-cross-module-data-flow.md) - 프로필 조립
- [ADR-029: Affiliate Integration](./ADR-029-affiliate-integration.md) - 어필리에이트 연동
- [ADR-014: Caching Strategy](./ADR-014-caching-strategy.md) - 캐싱 전략
- [SDD-PHASE-J-AI-STYLING](../specs/SDD-PHASE-J-AI-STYLING.md) - Phase J 스펙

---

**Author**: Claude Code
**Reviewed by**: -
