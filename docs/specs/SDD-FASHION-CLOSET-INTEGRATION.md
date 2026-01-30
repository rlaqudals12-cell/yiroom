# SDD: 패션 분석-옷장 관리 통합 (Fashion-Closet Integration)

> **Version**: 1.1
> **Status**: `draft`
> **Created**: 2026-01-23
> **Updated**: 2026-01-28
> **Author**: Claude Code
> **원리 참조**: [fashion-matching.md](../principles/fashion-matching.md)

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"사용자의 옷장을 완벽히 이해하고, 보유 의류만으로 최적의 코디를 자동 생성하며, 부족한 아이템을 적시에 추천하는 AI 스타일리스트"

- 옷장 의류 색상/스타일 자동 인식 95%+
- 퍼스널컬러 기반 조화도 평가 정확도 90%+
- AI 코디 생성 만족도 85%+
- 캡슐 옷장 완성도 진단 정확도 80%+

### 물리적 한계

| 한계 | 이유 | 완화 전략 |
|------|------|----------|
| 의류 촬영 품질 | 사용자 촬영 환경 다양 | 가이드라인 제공 |
| 스타일 주관성 | 개인 취향 반영 어려움 | 피드백 학습 (V2) |
| 실물 vs 이미지 | 색상 재현 차이 | 보정 알고리즘 |
| 코디 조합 폭발 | 아이템 증가 시 연산량 | 휴리스틱 필터링 |

### 100점 기준

| 지표 | 100점 기준 | 현재 목표 |
|------|-----------|----------|
| 옷장 등록 완료율 | 80% | 60% |
| 색상 조화도 정확도 | 95% | 85% |
| 코디 추천 만족도 | 4.5+/5 | 4.2+/5 |
| 어필리에이트 전환율 | 10% | 5% |

### 현재 목표: 65%

**종합 달성률**: **65%** (설계 완료, 구현 대기)

| 기능 | 달성률 | 상태 |
|------|--------|------|
| 의류 등록 UI | 70% | Draft |
| 색상 자동 추출 | 75% | ACC 연동 |
| 퍼스널컬러 조화도 | 60% | Draft |
| AI 코디 생성 | 50% | Draft |
| 캡슐 진단 | 40% | Draft |

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 3D 가상 피팅 | 기술 복잡도/비용 | 향후 연구 |
| 날씨 기반 자동 코디 | API 연동 필요 | Phase 3 |
| 소셜 공유 | 우선순위 낮음 | MAU 증가 시 |

---

## 1. 개요

### 1.1 목적

패션 분석 모듈(J-1)과 옷장 관리 시스템(Closet)을 통합하여, 사용자의 **실제 보유 의류 기반 맞춤형 스타일링 추천**을 제공한다.

### 1.2 핵심 가치

```
통합 = PC-1/PC-2 (퍼스널컬러) + C-1/C-2 (체형) + Closet (옷장)

목표:
1. 옷장 아이템 색상/스타일 자동 분석
2. 퍼스널컬러 기반 조화도 실시간 평가
3. 체형 기반 실루엣 추천
4. 기존 옷장으로 최적 코디 생성
5. 부족 아이템 → 어필리에이트 연동 구매 추천
```

### 1.3 범위

| 모듈 | 통합 방향 | 우선순위 |
|------|----------|----------|
| **PC-1/PC-2** | 색상 조화도 평가 | P0 |
| **C-1/C-2** | 실루엣 추천 | P1 |
| **J-1** | AI 코디 생성 | P0 |
| **Closet** | 옷장 등록/관리 | P0 |
| **Affiliate** | 부족 아이템 추천 | P2 |

### 1.4 성공 기준

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 옷장 등록 완료율 | 60%+ | 등록 시작 → 완료 비율 |
| 색상 조화도 정확도 | 85%+ | 전문가 평가 대비 |
| 코디 추천 만족도 | 4.2+/5 | 사용자 피드백 |
| 어필리에이트 전환율 | 5%+ | 추천 → 클릭 비율 |

---

## 2. 요구사항

### 2.1 기능 요구사항 (P0 - 필수)

| ID | 요구사항 | 설명 | 의존 모듈 |
|----|----------|------|----------|
| F-01 | 의류 사진 등록 | 사진 업로드로 아이템 등록 | Closet |
| F-02 | 색상 자동 추출 | 이미지에서 대표 색상 분석 | CIE, ACC |
| F-03 | 퍼스널컬러 조화도 | PC-1/PC-2 결과 기반 평가 | PC-1, PC-2 |
| F-04 | 기존 옷 코디 생성 | 등록된 아이템으로 조합 | J-1, Closet |
| F-05 | 코디 조화도 점수 | 색상+체형 종합 점수 | PC, C, J-1 |

### 2.2 기능 요구사항 (P1 - 중요)

| ID | 요구사항 | 설명 | 의존 모듈 |
|----|----------|------|----------|
| F-06 | 체형 기반 실루엣 | C-1/C-2 결과 기반 추천 | C-1, C-2 |
| F-07 | 계절/TPO 필터 | 상황별 코디 필터링 | J-1 |
| F-08 | 캡슐 옷장 진단 | 현재 옷장 분석 및 개선점 | Closet |
| F-09 | 착용 기록 | 코디 착용 이력 관리 | Closet |

### 2.3 기능 요구사항 (P2 - 부가)

| ID | 요구사항 | 설명 | 의존 모듈 |
|----|----------|------|----------|
| F-10 | 부족 아이템 추천 | 캡슐 완성 위한 구매 추천 | Affiliate |
| F-11 | 가격 비교 연동 | 추천 아이템 최저가 | Affiliate |
| F-12 | 옷장 공유 | 친구와 옷장/코디 공유 | Social |
| F-13 | 정리 추천 | 활용도 낮은 아이템 식별 | Closet |

### 2.4 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NF-01 | 색상 분석 속도 | 2초 이내 |
| NF-02 | 코디 생성 속도 | 3초 이내 |
| NF-03 | Mock Fallback | AI 실패 시 100% |
| NF-04 | 접근성 | data-testid 필수 |
| NF-05 | PC-1 필수 의존성 | PC-1 완료 후 접근 |

---

## 3. 데이터 흐름

### 3.1 크로스 모듈 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                 Fashion-Closet 통합 데이터 흐름                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐                                                 │
│  │   Closet   │  의류 사진 등록                                 │
│  │  (옷장)    │                                                 │
│  └─────┬──────┘                                                 │
│        │                                                        │
│        ▼                                                        │
│  ┌────────────┐                                                 │
│  │ CIE + ACC  │  이미지 분석 → 색상 추출                        │
│  │ (색상분석)  │  - dominant_color_hex                          │
│  └─────┬──────┘  - dominant_color_lab                          │
│        │         - tone (warm/cool/neutral)                    │
│        │         - season_match                                 │
│        │                                                        │
│        ├──────────────────┬─────────────────┐                   │
│        ▼                  ▼                 ▼                   │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐            │
│  │   PC-1/2   │    │   C-1/2    │    │   J-1      │            │
│  │(퍼스널컬러) │    │   (체형)   │    │(AI스타일링)│            │
│  └─────┬──────┘    └─────┬──────┘    └─────┬──────┘            │
│        │                 │                 │                    │
│        │   색상 조화도    │  실루엣 점수    │   코디 생성        │
│        │                 │                 │                    │
│        └────────────────┴─────────────────┘                    │
│                         │                                       │
│                         ▼                                       │
│                ┌────────────────┐                               │
│                │  통합 코디 추천  │                               │
│                │ (점수 + 코디)   │                               │
│                └────────┬───────┘                               │
│                         │                                       │
│            ┌────────────┼────────────┐                          │
│            ▼            ▼            ▼                          │
│       [코디 표시]   [캡슐 진단]  [부족 아이템]                   │
│                                      │                          │
│                                      ▼                          │
│                              ┌────────────┐                     │
│                              │ Affiliate  │                     │
│                              │ (구매 추천) │                     │
│                              └────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 의존성 규칙

| 기능 | 선행 조건 | 선택 조건 |
|------|----------|----------|
| 옷장 등록 | 로그인 | - |
| 색상 조화도 평가 | PC-1 완료, 아이템 등록 | PC-2 |
| 실루엣 추천 | C-1 완료, 아이템 등록 | C-2 |
| 통합 코디 생성 | PC-1 완료, 아이템 3개+ | C-1, PC-2 |
| 부족 아이템 추천 | 캡슐 진단 완료 | - |

### 3.3 캐시 무효화

| 이벤트 | 무효화 대상 | 처리 |
|--------|------------|------|
| PC-1 재분석 | 모든 아이템 조화도 | 재계산 |
| 아이템 등록/삭제 | 코디 추천, 캡슐 진단 | 재계산 |
| C-1 재분석 | 실루엣 점수 | 재계산 |

---

## 4. API 설계

### 4.1 옷장 관리 API

```typescript
// app/api/closet/items/route.ts

// GET: 옷장 아이템 목록 조회
interface GetItemsResponse {
  success: boolean;
  data: {
    items: WardrobeItemWithHarmony[];
    stats: {
      total: number;
      byCategory: Record<ItemCategory, number>;
      averageHarmonyScore: number;
    };
  };
}

// POST: 아이템 등록
interface CreateItemRequest {
  imageUrl: string;           // 업로드된 이미지 URL
  name?: string;              // 아이템 이름 (선택)
  category: ItemCategory;     // 카테고리 (필수)
  subcategory?: ItemSubcategory;
  brand?: string;
  purchaseDate?: string;
  purchasePrice?: number;
}

interface CreateItemResponse {
  success: boolean;
  data: {
    item: WardrobeItem;
    colorAnalysis: {
      dominantColorHex: string;
      dominantColorLab: LabColor;
      tone: ToneType;
      seasonMatch: Record<SeasonType, number>;
    };
    harmonyScore?: {
      score: number;          // 0-100
      feedback: string;
      userSeason: SeasonType;
    };
  };
}
```

### 4.2 통합 코디 API

```typescript
// app/api/closet/outfits/generate/route.ts

// POST: 코디 생성
interface GenerateOutfitRequest {
  occasion?: OccasionType;    // casual, work, formal, date
  weather?: WeatherCondition; // sunny, cloudy, rainy, snowy
  temperature?: 'cold' | 'cool' | 'warm' | 'hot';
  excludeItemIds?: string[];  // 제외할 아이템
  preferredColors?: string[]; // 선호 색상
}

interface GenerateOutfitResponse {
  success: boolean;
  data: {
    outfits: IntegratedOutfit[];
    usedFallback: boolean;
  };
}

interface IntegratedOutfit {
  id: string;
  items: WardrobeItem[];

  // 점수
  colorHarmonyScore: number;  // PC 기반 (0-100)
  bodyMatchScore: number;     // C 기반 (0-100)
  occasionScore: number;      // TPO 적합도 (0-100)
  overallScore: number;       // 종합 (0-100)

  // 피드백
  feedback: {
    color: string;            // "웜톤 조합이 잘 어울려요"
    silhouette: string;       // "A라인 실루엣이 체형에 적합해요"
    overall: string;          // "전체적으로 조화로운 코디예요"
  };

  // 메타데이터
  occasion: OccasionType;
  season: SeasonType | 'all';
  weatherSuitability: number; // 날씨 적합도 (0-100)
}
```

### 4.3 조화도 평가 API

```typescript
// app/api/closet/items/[id]/harmony/route.ts

// GET: 개별 아이템 조화도 조회
interface GetHarmonyResponse {
  success: boolean;
  data: {
    itemId: string;
    userSeason: SeasonType;
    userSubtype?: SeasonSubtype;

    harmonyScore: number;     // 종합 (0-100)
    toneScore: number;        // 톤 매칭 (0-100)
    saturationScore: number;  // 채도 적합도 (0-100)
    lightnessScore: number;   // 명도 적합도 (0-100)

    grade: 'S' | 'A' | 'B' | 'C' | 'D';
    feedback: string;
    recommendations: string[];

    // 조합 추천
    bestMatchItems: WardrobeItem[];  // 이 아이템과 잘 어울리는 아이템
    avoidWithItems: WardrobeItem[];  // 피해야 할 조합
  };
}
```

### 4.4 캡슐 진단 API

```typescript
// app/api/closet/capsule/analyze/route.ts

// GET: 캡슐 옷장 진단
interface CapsuleAnalysisResponse {
  success: boolean;
  data: {
    // 현재 상태
    totalItems: number;
    categoryBreakdown: Record<ItemCategory, number>;
    colorDistribution: {
      warm: number;
      cool: number;
      neutral: number;
    };

    // 점수
    capsuleScore: number;      // 0-100
    versatilityScore: number;  // 코디 다양성 (0-100)
    colorBalanceScore: number; // 색상 균형 (0-100)

    // 진단
    strengths: string[];
    weaknesses: string[];

    // 추천
    missingItems: MissingItemRecommendation[];
    underutilizedItems: WardrobeItem[];

    // 가능 코디 수
    possibleOutfitCount: number;
  };
}

interface MissingItemRecommendation {
  category: ItemCategory;
  subcategory?: ItemSubcategory;
  suggestedColor: {
    hex: string;
    name: string;
  };
  reason: string;
  priority: 'high' | 'medium' | 'low';

  // 어필리에이트 연동
  recommendedProducts?: AffiliateProduct[];
}
```

### 4.5 어필리에이트 연동 API

```typescript
// app/api/closet/recommend-products/route.ts

// POST: 부족 아이템 기반 상품 추천
interface RecommendProductsRequest {
  missingItemId?: string;     // 캡슐 진단에서 나온 누락 아이템
  category?: ItemCategory;
  color?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  brands?: string[];
}

interface RecommendProductsResponse {
  success: boolean;
  data: {
    products: AffiliateProductWithMatch[];
    totalCount: number;
  };
}

interface AffiliateProductWithMatch {
  // 기본 상품 정보
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  brand: string;
  deeplink: string;
  partner: 'coupang' | 'musinsa' | 'iherb';

  // 매칭 점수
  matchScore: {
    colorHarmony: number;     // 퍼스널컬러 조화도
    bodyShape: number;        // 체형 적합도
    capsuleCompatibility: number;  // 캡슐 호환성
    overall: number;
  };

  // 피드백
  matchFeedback: string[];    // ["봄 웜톤에 잘 어울려요", "기존 아이템 5개와 매치 가능"]
}
```

---

## 5. UI/UX 설계

### 5.1 화면 구성

| 화면 | 경로 | 설명 |
|------|------|------|
| 옷장 메인 | `/closet` | 등록된 아이템 그리드 + 조화도 표시 |
| 아이템 등록 | `/closet/add` | 사진 업로드 + 색상 분석 결과 |
| 아이템 상세 | `/closet/item/[id]` | 조화도 상세 + 추천 조합 |
| 코디 추천 | `/closet/outfits` | AI 생성 코디 목록 |
| 캡슐 분석 | `/closet/capsule` | 옷장 진단 + 개선 추천 |
| 구매 추천 | `/closet/shop` | 부족 아이템 쇼핑 |

### 5.2 옷장 메인 화면

```
┌─────────────────────────────────────────────────────────────────┐
│  내 옷장                                              [+ 추가]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐                │
│  │ [이미지]│  │ [이미지]│  │ [이미지]│  │ [이미지]│                │
│  │        │  │        │  │        │  │        │                │
│  │ ●●●●○  │  │ ●●●○○  │  │ ●●●●●  │  │ ●●○○○  │                │
│  │ 85점   │  │ 72점   │  │ 95점   │  │ 58점   │                │
│  └────────┘  └────────┘  └────────┘  └────────┘                │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  [전체] [상의] [하의] [아우터] [원피스] [신발] [액세서리]        │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  📊 내 옷장 점수                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  캡슐 점수: 72/100    코디 조합: 156개    평균 조화도: 78  │   │
│  │  [캡슐 분석 보기]     [코디 추천 받기]                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 아이템 등록 화면

```
┌─────────────────────────────────────────────────────────────────┐
│  ← 아이템 등록                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                    [📷 사진 업로드]                      │   │
│  │                    또는 드래그 앤 드롭                   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  🎨 색상 분석 결과                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  대표 색상: [■] 네이비 (#1E3A5F)                        │   │
│  │  톤: 쿨톤                                               │   │
│  │                                                         │   │
│  │  🌸 봄: 45%  ☀️ 여름: 88%  🍂 가을: 35%  ❄️ 겨울: 92%   │   │
│  │                                                         │   │
│  │  ✓ 당신의 퍼스널컬러(여름 쿨톤)와 잘 어울려요!          │   │
│  │  조화도 점수: 88/100                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  📝 아이템 정보                                                  │
│  이름: [네이비 블라우스________________]                         │
│  카테고리: [상의 ▼]  서브카테고리: [블라우스 ▼]                  │
│  브랜드: [_________________________] (선택)                      │
│  구매가격: [_______] 원 (선택)                                   │
│                                                                  │
│                                    [취소]  [등록하기]            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 통합 코디 추천 화면

```
┌─────────────────────────────────────────────────────────────────┐
│  ← 코디 추천                                     [필터] [새로고침]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  오늘의 날씨: 맑음, 15°C                                        │
│  상황: [데일리 ▼]                                               │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  추천 코디 #1                                   92점 ⭐  │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │  [상의]     +     [하의]     +     [신발]        │  │   │
│  │  │  네이비          베이지 치노        화이트 스니커즈│  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  💡 피드백                                              │   │
│  │  • 여름 쿨톤에 완벽한 색상 조합이에요                   │   │
│  │  • 직사각형 체형에 벨트로 허리 강조 추천                │   │
│  │  • 데일리룩으로 딱 좋아요                               │   │
│  │                                                         │   │
│  │  [이 코디 저장]  [착용 기록]                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  추천 코디 #2                                   85점     │   │
│  │  ...                                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.5 캡슐 분석 화면

```
┌─────────────────────────────────────────────────────────────────┐
│  ← 캡슐 옷장 분석                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 내 옷장 진단                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  캡슐 점수          코디 다양성        색상 균형         │   │
│  │  ┌────────┐        ┌────────┐        ┌────────┐        │   │
│  │  │  72    │        │  85    │        │  68    │        │   │
│  │  │ /100   │        │ /100   │        │ /100   │        │   │
│  │  └────────┘        └────────┘        └────────┘        │   │
│  │                                                         │   │
│  │  가능한 코디 조합: 156개                                │   │
│  │  총 아이템: 28개                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ✓ 잘하고 있어요                                                │
│  • 상의 종류가 다양해요 (12개)                                  │
│  • 쿨톤 아이템이 충분해요                                       │
│                                                                  │
│  ⚠️ 개선이 필요해요                                              │
│  • 아우터가 부족해요 (1개 → 3개 권장)                           │
│  • 중립색 아이템이 부족해요                                     │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  🛒 추천 구매 아이템                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. 네이비 블레이저 (아우터) - 우선순위 높음             │   │
│  │     "쿨톤에 어울리고 기존 11개 아이템과 매치 가능"       │   │
│  │     [쿠팡에서 보기] [무신사에서 보기]            AD     │   │
│  │                                                         │   │
│  │  2. 화이트 티셔츠 (상의) - 우선순위 중간                 │   │
│  │     "기본 아이템으로 코디 활용도 높음"                   │   │
│  │     [쿠팡에서 보기] [무신사에서 보기]            AD     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 핵심 알고리즘

### 6.1 색상 조화도 계산

```typescript
// lib/closet/color-harmony.ts

interface ColorHarmonyResult {
  score: number;              // 0-100
  toneScore: number;
  saturationScore: number;
  lightnessScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  feedback: string;
}

/**
 * 아이템 색상과 사용자 퍼스널컬러 조화도 계산
 * 원리: docs/principles/fashion-matching.md 섹션 2 참조
 */
function calculateColorHarmony(
  itemColor: LabColor,
  userSeason: SeasonType,
  userSubtype?: SeasonSubtype
): ColorHarmonyResult {
  const seasonConfig = SEASON_HARMONY_MAP[userSeason];

  // 1. 톤 매칭 (40%)
  const toneScore = calculateToneMatch(itemColor, userSeason);

  // 2. 채도 적합성 (30%)
  const saturationScore = calculateSaturationMatch(
    itemColor.c,
    seasonConfig.idealSaturationRange
  );

  // 3. 명도 적합성 (20%)
  const lightnessScore = calculateLightnessMatch(
    itemColor.L,
    seasonConfig.idealLightnessRange
  );

  // 4. 피해야 할 색상 체크 (-10% ~ 0%)
  const avoidPenalty = checkAvoidColors(
    itemColor,
    seasonConfig.avoidColors
  );

  // 종합 점수
  const score = Math.max(0, Math.min(100,
    toneScore * 0.4 +
    saturationScore * 0.3 +
    lightnessScore * 0.2 +
    avoidPenalty
  ));

  return {
    score: Math.round(score),
    toneScore: Math.round(toneScore),
    saturationScore: Math.round(saturationScore),
    lightnessScore: Math.round(lightnessScore),
    grade: scoreToGrade(score),
    feedback: generateColorFeedback(score, userSeason, itemColor),
  };
}

function calculateToneMatch(color: LabColor, season: SeasonType): number {
  // 웜톤 (Spring, Autumn): a* > 0, b* > 0
  // 쿨톤 (Summer, Winter): a* < 0 또는 b* < 0
  const isWarm = color.a > 0 && color.b > 0;
  const seasonWarm = season === 'spring' || season === 'autumn';

  if (isWarm === seasonWarm) {
    return 100;  // 톤 일치
  }

  // 톤 불일치 시 거리에 따라 감점
  const distance = Math.abs(color.a) + Math.abs(color.b);
  return Math.max(0, 100 - distance * 2);
}
```

### 6.2 통합 코디 점수 계산

```typescript
// lib/closet/outfit-scoring.ts

interface OutfitScore {
  colorHarmonyScore: number;
  bodyMatchScore: number;
  occasionScore: number;
  overallScore: number;
  feedback: {
    color: string;
    silhouette: string;
    overall: string;
  };
}

/**
 * 코디 종합 점수 계산
 * PC-1/PC-2 + C-1/C-2 + TPO 통합
 */
function calculateOutfitScore(
  items: WardrobeItem[],
  userProfile: UserProfile,
  occasion?: OccasionType
): OutfitScore {
  // 1. 색상 조화 점수 (40%)
  const colorHarmonyScore = calculateOutfitColorHarmony(
    items,
    userProfile.personalColor
  );

  // 2. 체형 매칭 점수 (35%)
  const bodyMatchScore = userProfile.bodyShape
    ? calculateBodyShapeMatch(items, userProfile.bodyShape)
    : 75;  // 체형 분석 미완료 시 기본값

  // 3. TPO 적합성 점수 (25%)
  const occasionScore = occasion
    ? calculateOccasionMatch(items, occasion)
    : 80;

  // 종합 점수
  const overallScore = Math.round(
    colorHarmonyScore * 0.40 +
    bodyMatchScore * 0.35 +
    occasionScore * 0.25
  );

  return {
    colorHarmonyScore,
    bodyMatchScore,
    occasionScore,
    overallScore,
    feedback: {
      color: generateColorFeedback(colorHarmonyScore, userProfile.personalColor),
      silhouette: generateSilhouetteFeedback(bodyMatchScore, userProfile.bodyShape),
      overall: generateOverallFeedback(overallScore),
    },
  };
}

/**
 * 코디 내 아이템들의 색상 조화 계산
 */
function calculateOutfitColorHarmony(
  items: WardrobeItem[],
  personalColor: PersonalColorProfile
): number {
  // 1. 각 아이템의 개별 조화도 평균
  const individualScores = items.map(item =>
    calculateColorHarmony(item.dominantColorLab, personalColor.season)
  );
  const avgIndividualScore = average(individualScores.map(s => s.score));

  // 2. 아이템 간 색상 조화 (색상환 기반)
  const interItemHarmony = calculateColorInteraction(items);

  // 3. 종합 (개별 60% + 상호 40%)
  return Math.round(avgIndividualScore * 0.6 + interItemHarmony * 0.4);
}
```

### 6.3 캡슐 진단 알고리즘

```typescript
// lib/closet/capsule-diagnosis.ts

interface CapsuleDiagnosis {
  capsuleScore: number;
  versatilityScore: number;
  colorBalanceScore: number;
  strengths: string[];
  weaknesses: string[];
  missingItems: MissingItemRecommendation[];
}

/**
 * 캡슐 옷장 진단
 * 원리: docs/principles/fashion-matching.md 섹션 4 참조
 */
function diagnoseCapsuleWardrobe(
  items: WardrobeItem[],
  userProfile: UserProfile
): CapsuleDiagnosis {
  const idealCapsule = IDEAL_CAPSULE_CONFIG;  // 33개 아이템 기준

  // 1. 카테고리 균형
  const categoryBalance = analyzeCategoryBalance(items, idealCapsule);

  // 2. 색상 균형
  const colorBalance = analyzeColorBalance(items, userProfile.personalColor);

  // 3. 코디 다양성 (가능한 조합 수)
  const possibleOutfits = countPossibleOutfits(items);
  const versatilityScore = Math.min(100, Math.round(possibleOutfits / 10));

  // 4. 캡슐 점수 계산
  const capsuleScore = Math.round(
    categoryBalance.score * 0.4 +
    colorBalance.score * 0.3 +
    versatilityScore * 0.3
  );

  // 5. 강점/약점 도출
  const { strengths, weaknesses } = analyzeStrengthsWeaknesses(
    categoryBalance,
    colorBalance,
    possibleOutfits
  );

  // 6. 부족 아이템 식별
  const missingItems = identifyMissingItems(
    items,
    idealCapsule,
    userProfile,
    categoryBalance,
    colorBalance
  );

  return {
    capsuleScore,
    versatilityScore,
    colorBalanceScore: colorBalance.score,
    strengths,
    weaknesses,
    missingItems,
  };
}

function identifyMissingItems(
  items: WardrobeItem[],
  idealCapsule: IdealCapsuleConfig,
  userProfile: UserProfile,
  categoryBalance: CategoryBalanceResult,
  colorBalance: ColorBalanceResult
): MissingItemRecommendation[] {
  const missing: MissingItemRecommendation[] = [];

  // 카테고리 부족 체크
  for (const [category, ideal] of Object.entries(idealCapsule.categories)) {
    const current = categoryBalance.counts[category as ItemCategory] || 0;
    if (current < ideal.min) {
      missing.push({
        category: category as ItemCategory,
        subcategory: ideal.prioritySubcategory,
        suggestedColor: getSuggestedColor(items, userProfile.personalColor.season),
        reason: `${categoryToKorean(category)} 아이템이 ${ideal.min - current}개 부족해요`,
        priority: current === 0 ? 'high' : 'medium',
      });
    }
  }

  // 색상 부족 체크
  if (colorBalance.needsNeutral) {
    missing.push({
      category: 'top',
      suggestedColor: getNeutralColor(userProfile.personalColor.season),
      reason: '중립색 아이템이 부족해요. 코디 활용도를 높여보세요.',
      priority: 'medium',
    });
  }

  return missing.sort((a, b) =>
    PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  );
}
```

---

## 7. 데이터 모델

### 7.1 확장된 옷장 스키마

```sql
-- 기존 wardrobe_items 테이블에 조화도 관련 컬럼 추가
ALTER TABLE wardrobe_items
  ADD COLUMN IF NOT EXISTS harmony_score INTEGER,
  ADD COLUMN IF NOT EXISTS harmony_grade TEXT,
  ADD COLUMN IF NOT EXISTS harmony_updated_at TIMESTAMPTZ;

-- 코디-분석 연결 테이블
CREATE TABLE outfit_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,

  -- 점수
  color_harmony_score INTEGER NOT NULL,
  body_match_score INTEGER,
  occasion_score INTEGER,
  overall_score INTEGER NOT NULL,

  -- 피드백 (JSONB)
  feedback JSONB,  -- { color, silhouette, overall }

  -- 메타데이터
  occasion TEXT,
  weather_condition TEXT,
  temperature_range TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책
ALTER TABLE outfit_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_outfit_analyses" ON outfit_analyses
  FOR ALL USING (
    outfit_id IN (
      SELECT id FROM outfits WHERE clerk_user_id = auth.get_user_id()
    )
  );

-- 캡슐 진단 이력
CREATE TABLE capsule_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 점수
  capsule_score INTEGER NOT NULL,
  versatility_score INTEGER NOT NULL,
  color_balance_score INTEGER NOT NULL,

  -- 진단 결과 (JSONB)
  diagnosis JSONB NOT NULL,  -- { strengths, weaknesses, missingItems }

  -- 스냅샷
  item_count INTEGER NOT NULL,
  category_breakdown JSONB NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책
ALTER TABLE capsule_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_capsule_analyses" ON capsule_analyses
  FOR ALL USING (clerk_user_id = auth.get_user_id());

-- 인덱스
CREATE INDEX idx_capsule_analyses_user ON capsule_analyses(clerk_user_id);
CREATE INDEX idx_capsule_analyses_date ON capsule_analyses(created_at DESC);
```

### 7.2 타입 정의

```typescript
// types/closet-integration.ts

export interface WardrobeItemWithHarmony extends WardrobeItem {
  harmonyScore: number | null;
  harmonyGrade: 'S' | 'A' | 'B' | 'C' | 'D' | null;
  harmonyUpdatedAt: Date | null;
}

export interface IntegratedOutfit extends Outfit {
  analysis: OutfitAnalysis;
}

export interface OutfitAnalysis {
  colorHarmonyScore: number;
  bodyMatchScore: number | null;
  occasionScore: number | null;
  overallScore: number;
  feedback: {
    color: string;
    silhouette: string | null;
    overall: string;
  };
  occasion: OccasionType | null;
  weatherCondition: WeatherCondition | null;
}

export interface CapsuleAnalysis {
  id: string;
  clerkUserId: string;
  capsuleScore: number;
  versatilityScore: number;
  colorBalanceScore: number;
  diagnosis: {
    strengths: string[];
    weaknesses: string[];
    missingItems: MissingItemRecommendation[];
  };
  itemCount: number;
  categoryBreakdown: Record<ItemCategory, number>;
  createdAt: Date;
}
```

---

## 8. P3 원자 분해 (ATOM Decomposition)

> 원리 참조: [00-first-principles.md](../../.claude/rules/00-first-principles.md) P3

### 8.1 ATOM 의존성 그래프

```
┌─────────────────────────────────────────────────────────────────┐
│                     ATOM 의존성 그래프                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase 1: 기반 구축                                             │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐              │
│  │  FC-1     │ → │  FC-2     │    │  FC-3     │              │
│  │ 타입 정의  │    │ DB 스키마  │    │ 조화도 계산 │              │
│  └─────┬─────┘    └─────┬─────┘    └─────┬─────┘              │
│        │                │                │                    │
│        └────────────────┴────────────────┤                    │
│                                          │                    │
│  Phase 2: 통합 코디                       ▼                    │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐              │
│  │  FC-4     │ ← │  FC-5     │ → │  FC-6     │              │
│  │ 자동 조화도 │    │ 코디 점수  │    │ 코디 API  │              │
│  └───────────┘    └─────┬─────┘    └─────┬─────┘              │
│                         │                │                    │
│                         ▼                ▼                    │
│                   ┌───────────┐    ┌───────────┐              │
│                   │  FC-8     │    │  FC-7     │              │
│                   │ 피드백 생성 │    │ 코디 UI   │              │
│                   └───────────┘    └───────────┘              │
│                                                                │
│  Phase 3: 캡슐 진단         Phase 4: 어필리에이트               │
│  ┌───────────┐            ┌───────────┐                       │
│  │  FC-9     │ ─────────→ │  FC-13    │                       │
│  │ 캡슐 진단  │            │ 상품 매칭  │                       │
│  └─────┬─────┘            └─────┬─────┘                       │
│        │                        │                             │
│        ▼                        ▼                             │
│  ┌───────────┐            ┌───────────┐                       │
│  │ FC-10~12  │            │ FC-14~16  │                       │
│  │ 분석 API/UI│            │ 추천 API/UI│                       │
│  └───────────┘            └───────────┘                       │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

### 8.2 Phase 1: 기반 구축 (P0)

#### ATOM FC-1: 타입 정의 확장

**예상 시간**: 1시간
**입력**: 기존 types/closet.ts, PC-1/C-1 타입
**출력**: types/closet-integration.ts

```typescript
// 출력 인터페이스
interface WardrobeItemWithHarmony extends WardrobeItem {
  harmonyScore: number | null;
  harmonyGrade: 'S' | 'A' | 'B' | 'C' | 'D' | null;
}

interface IntegratedOutfit extends Outfit {
  colorHarmonyScore: number;
  bodyMatchScore: number | null;
  overallScore: number;
  feedback: OutfitFeedback;
}
```

**성공 기준**:
- [ ] TypeScript strict mode 통과
- [ ] 기존 타입과 호환
- [ ] 모든 필드 JSDoc 주석

**의존성**: 없음

---

#### ATOM FC-2: DB 스키마 마이그레이션

**예상 시간**: 2시간
**입력**: FC-1 타입 정의
**출력**: 마이그레이션 SQL

```sql
-- 출력: supabase/migrations/YYYYMMDD_fashion_closet_integration.sql
ALTER TABLE wardrobe_items
  ADD COLUMN IF NOT EXISTS harmony_score INTEGER,
  ADD COLUMN IF NOT EXISTS harmony_grade TEXT;

CREATE TABLE outfit_analyses (...);
CREATE TABLE capsule_analyses (...);
```

**성공 기준**:
- [ ] 마이그레이션 롤백 가능
- [ ] RLS 정책 적용
- [ ] 인덱스 최적화

**의존성**: FC-1

---

#### ATOM FC-3: 색상 조화도 계산 함수

**예상 시간**: 3시간
**입력**: Lab 색상값, 사용자 퍼스널컬러
**출력**: ColorHarmonyResult

```typescript
// lib/closet/color-harmony.ts
function calculateColorHarmony(
  itemColor: LabColor,
  userSeason: SeasonType
): ColorHarmonyResult {
  // 톤 매칭 (40%) + 채도 (30%) + 명도 (20%) + 피해 색상 체크
  return { score, toneScore, grade, feedback };
}
```

**성공 기준**:
- [ ] 단위 테스트 90%+ 커버리지
- [ ] 순수 함수 (사이드 이펙트 없음)
- [ ] 원리 문서 참조 (color-science.md)

**의존성**: FC-1

---

#### ATOM FC-4: 아이템 등록 시 조화도 자동 계산

**예상 시간**: 2시간
**입력**: 아이템 등록 이벤트, FC-3 함수
**출력**: 조화도 점수 자동 저장

```typescript
// lib/closet/hooks/useItemRegistration.ts
async function onItemRegistered(item: WardrobeItem) {
  const userSeason = await getUserPersonalColor(userId);
  const harmony = calculateColorHarmony(item.dominantColorLab, userSeason);
  await updateItemHarmony(item.id, harmony);
}
```

**성공 기준**:
- [ ] PC-1 미완료 사용자 처리
- [ ] 에러 핸들링 (3단계 폴백)
- [ ] 낙관적 업데이트

**의존성**: FC-3

---

### 8.3 Phase 2: 통합 코디 (P0)

#### ATOM FC-5: 코디 점수 계산 함수

**예상 시간**: 3시간
**입력**: 아이템 배열, 사용자 프로필
**출력**: OutfitScore

```typescript
function calculateOutfitScore(
  items: WardrobeItem[],
  userProfile: UserProfile,
  occasion?: OccasionType
): OutfitScore {
  // 색상 조화 (40%) + 체형 매칭 (35%) + TPO (25%)
  return { colorHarmonyScore, bodyMatchScore, occasionScore, overallScore, feedback };
}
```

**성공 기준**:
- [ ] PC-1 + C-1 + J-1 통합
- [ ] 가중치 조정 가능
- [ ] 테스트 케이스 10개+

**의존성**: FC-3

---

#### ATOM FC-6: 통합 코디 생성 API

**예상 시간**: 3시간
**입력**: GenerateOutfitRequest
**출력**: GenerateOutfitResponse

```typescript
// app/api/closet/outfits/generate/route.ts
POST /api/closet/outfits/generate
→ { outfits: IntegratedOutfit[], usedFallback: boolean }
```

**성공 기준**:
- [ ] Rate Limiting 적용
- [ ] Mock Fallback 동작
- [ ] 응답 시간 < 3초

**의존성**: FC-5

---

#### ATOM FC-7: 코디 추천 UI 구현

**예상 시간**: 4시간
**입력**: FC-6 API 응답
**출력**: React 컴포넌트

```tsx
// components/closet/OutfitRecommendation.tsx
// 코디 카드, 점수 표시, 피드백 표시, 저장/착용 버튼
```

**성공 기준**:
- [ ] data-testid 필수
- [ ] 접근성 (WCAG 2.1 AA)
- [ ] 반응형 디자인

**의존성**: FC-6

---

#### ATOM FC-8: 피드백 생성 로직

**예상 시간**: 2시간
**입력**: 점수, 사용자 프로필
**출력**: 한국어 피드백 문자열

```typescript
function generateColorFeedback(score: number, season: SeasonType): string {
  // 점수 구간별 피드백 템플릿
  // 예: "웜톤 조합이 잘 어울려요", "톤 차이가 있어요"
}
```

**성공 기준**:
- [ ] 피드백 템플릿 다양성
- [ ] 한국어 자연스러움
- [ ] 긍정/개선 포인트 균형

**의존성**: FC-5

---

### 8.4 Phase 3: 캡슐 진단 (P1)

#### ATOM FC-9: 캡슐 진단 알고리즘

**예상 시간**: 3시간
**입력**: 옷장 아이템 배열, 사용자 프로필
**출력**: CapsuleDiagnosis

```typescript
function diagnoseCapsuleWardrobe(
  items: WardrobeItem[],
  userProfile: UserProfile
): CapsuleDiagnosis {
  // 카테고리 균형 + 색상 균형 + 코디 다양성 분석
  return { capsuleScore, strengths, weaknesses, missingItems };
}
```

**성공 기준**:
- [ ] 33개 캡슐 기준 적용
- [ ] 부족 아이템 우선순위화
- [ ] 테스트 케이스 15개+

**의존성**: FC-3

---

#### ATOM FC-10: 캡슐 분석 API

**예상 시간**: 2시간
**입력**: 사용자 ID
**출력**: CapsuleAnalysisResponse

```typescript
// app/api/closet/capsule/analyze/route.ts
GET /api/closet/capsule/analyze
→ { capsuleScore, diagnosis, missingItems, possibleOutfitCount }
```

**성공 기준**:
- [ ] 캐싱 적용 (5분)
- [ ] 이력 저장
- [ ] 응답 시간 < 2초

**의존성**: FC-9

---

#### ATOM FC-11: 캡슐 분석 UI 구현

**예상 시간**: 4시간
**입력**: FC-10 API 응답
**출력**: React 컴포넌트

```tsx
// components/closet/CapsuleAnalysis.tsx
// 점수 게이지, 강점/약점 리스트, 부족 아이템 추천
```

**성공 기준**:
- [ ] 시각화 명확성
- [ ] 개선 방향 안내
- [ ] 어필리에이트 연동 CTA

**의존성**: FC-10

---

#### ATOM FC-12: 부족 아이템 추천 로직

**예상 시간**: 2시간
**입력**: 캡슐 진단 결과, 사용자 퍼스널컬러
**출력**: MissingItemRecommendation[]

```typescript
function identifyMissingItems(
  diagnosis: CapsuleDiagnosis,
  userSeason: SeasonType
): MissingItemRecommendation[] {
  // 카테고리/색상 부족 분석 → 추천 색상/우선순위 결정
}
```

**성공 기준**:
- [ ] 퍼스널컬러 반영
- [ ] 우선순위 정렬
- [ ] 구체적 추천 (서브카테고리)

**의존성**: FC-9

---

### 8.5 Phase 4: 어필리에이트 연동 (P2)

#### ATOM FC-13: 부족 아이템 → 상품 매칭

**예상 시간**: 3시간
**입력**: MissingItemRecommendation
**출력**: AffiliateProductWithMatch[]

```typescript
async function matchProductsToMissingItem(
  missingItem: MissingItemRecommendation,
  userProfile: UserProfile
): Promise<AffiliateProductWithMatch[]> {
  // 카테고리 + 색상 + 가격대 기반 매칭
}
```

**성공 기준**:
- [ ] 퍼스널컬러 매칭률 포함
- [ ] 체형 적합도 포함
- [ ] 캡슐 호환성 점수

**의존성**: FC-12

---

#### ATOM FC-14: 상품 추천 API

**예상 시간**: 2시간
**입력**: RecommendProductsRequest
**출력**: RecommendProductsResponse

```typescript
// app/api/closet/recommend-products/route.ts
POST /api/closet/recommend-products
→ { products: AffiliateProductWithMatch[], totalCount }
```

**성공 기준**:
- [ ] 파트너사 API 통합
- [ ] 캐싱 적용
- [ ] 에러 핸들링

**의존성**: FC-13

---

#### ATOM FC-15: 구매 추천 UI 구현

**예상 시간**: 3시간
**입력**: FC-14 API 응답
**출력**: React 컴포넌트

```tsx
// components/closet/ProductRecommendation.tsx
// 상품 카드, 매칭 점수, 딥링크 버튼, AD 표시
```

**성공 기준**:
- [ ] AD 라벨 필수
- [ ] 매칭 점수 시각화
- [ ] 어필리에이트 규정 준수

**의존성**: FC-14

---

#### ATOM FC-16: 어필리에이트 링크 생성

**예상 시간**: 1시간
**입력**: 상품 ID, 사용자 ID
**출력**: 딥링크 URL

```typescript
function generateAffiliateDeeplink(
  productId: string,
  userId: string,
  partner: 'coupang' | 'musinsa'
): string {
  // 파트너별 딥링크 포맷
}
```

**성공 기준**:
- [ ] 추적 파라미터 포함
- [ ] 유효성 검증
- [ ] 로깅 연동

**의존성**: FC-14

---

### 8.6 Phase 5: 테스트 및 최적화

#### ATOM FC-17: 단위 테스트

**예상 시간**: 4시간
**입력**: FC-1~16 모든 함수
**출력**: 테스트 파일

```
tests/lib/closet/
├── color-harmony.test.ts
├── outfit-scoring.test.ts
├── capsule-diagnosis.test.ts
└── product-matching.test.ts
```

**성공 기준**:
- [ ] 커버리지 90%+
- [ ] 엣지 케이스 포함
- [ ] Mock 데이터 활용

**의존성**: FC-1~16

---

#### ATOM FC-18: 통합 테스트

**예상 시간**: 3시간
**입력**: API 라우트
**출력**: E2E 테스트

```
tests/integration/closet/
├── outfit-generation.test.ts
├── capsule-analysis.test.ts
└── affiliate-recommendation.test.ts
```

**성공 기준**:
- [ ] Happy path 검증
- [ ] 에러 시나리오
- [ ] Mock Fallback 검증

**의존성**: FC-17

---

#### ATOM FC-19: 성능 최적화

**예상 시간**: 2시간
**입력**: 성능 측정 결과
**출력**: 최적화 적용

```
- 조화도 계산 캐싱
- 코디 생성 병렬화
- DB 쿼리 최적화
```

**성공 기준**:
- [ ] 코디 생성 < 3초
- [ ] 캡슐 분석 < 2초
- [ ] Lighthouse 90+

**의존성**: FC-18

---

#### ATOM FC-20: 문서화

**예상 시간**: 2시간
**입력**: 구현 결과
**출력**: API 문서, README

```
- API 엔드포인트 문서
- 알고리즘 설명
- 사용 가이드
```

**성공 기준**:
- [ ] 모든 API 문서화
- [ ] 예시 코드 포함
- [ ] 트러블슈팅 가이드

**의존성**: FC-19

---

### 8.7 총 예상 시간

| Phase | ATOM 수 | 시간 |
|-------|---------|------|
| Phase 1 | 4 | 8h |
| Phase 2 | 4 | 12h |
| Phase 3 | 4 | 11h |
| Phase 4 | 4 | 9h |
| Phase 5 | 4 | 11h |
| **총합** | **20** | **51h** |

---

## 9. 테스트 케이스

### 9.1 색상 조화도 테스트

```typescript
// tests/lib/closet/color-harmony.test.ts

describe('calculateColorHarmony', () => {
  it('should give high score for matching tone', () => {
    const warmColor = { L: 70, a: 15, b: 20 };  // 웜톤 색상
    const result = calculateColorHarmony(warmColor, 'spring');
    expect(result.score).toBeGreaterThan(80);
  });

  it('should penalize mismatched tone', () => {
    const coolColor = { L: 70, a: -10, b: -5 };  // 쿨톤 색상
    const result = calculateColorHarmony(coolColor, 'autumn');
    expect(result.score).toBeLessThan(60);
  });

  it('should apply avoid color penalty', () => {
    const blackColor = { L: 5, a: 0, b: 0 };  // 순 검정
    const result = calculateColorHarmony(blackColor, 'spring');
    expect(result.score).toBeLessThan(50);  // 봄 웜톤은 순 검정 피해야 함
  });
});
```

### 9.2 통합 코디 테스트

```typescript
// tests/lib/closet/outfit-scoring.test.ts

describe('calculateOutfitScore', () => {
  const mockItems: WardrobeItem[] = [
    { id: '1', category: 'top', dominantColorLab: { L: 85, a: 5, b: 10 } },
    { id: '2', category: 'bottom', dominantColorLab: { L: 70, a: 3, b: 8 } },
  ];

  const mockProfile: UserProfile = {
    personalColor: { season: 'spring', subtype: 'light' },
    bodyShape: { type: 'rectangle' },
  };

  it('should calculate overall score from all components', () => {
    const result = calculateOutfitScore(mockItems, mockProfile, 'casual');

    expect(result.colorHarmonyScore).toBeDefined();
    expect(result.bodyMatchScore).toBeDefined();
    expect(result.occasionScore).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('should generate appropriate feedback', () => {
    const result = calculateOutfitScore(mockItems, mockProfile);

    expect(result.feedback.color).toBeTruthy();
    expect(result.feedback.silhouette).toBeTruthy();
    expect(result.feedback.overall).toBeTruthy();
  });
});
```

### 9.3 캡슐 진단 테스트

```typescript
// tests/lib/closet/capsule-diagnosis.test.ts

describe('diagnoseCapsuleWardrobe', () => {
  it('should identify missing categories', () => {
    const itemsWithoutOuter = [
      { id: '1', category: 'top' },
      { id: '2', category: 'bottom' },
    ];

    const result = diagnoseCapsuleWardrobe(itemsWithoutOuter, mockProfile);

    const outerMissing = result.missingItems.find(
      m => m.category === 'outerwear'
    );
    expect(outerMissing).toBeDefined();
    expect(outerMissing?.priority).toBe('high');
  });

  it('should calculate versatility based on possible outfits', () => {
    const diverseWardrobe = generateMockWardrobe(20);  // 다양한 아이템

    const result = diagnoseCapsuleWardrobe(diverseWardrobe, mockProfile);

    expect(result.versatilityScore).toBeGreaterThan(50);
  });

  it('should generate strengths and weaknesses', () => {
    const result = diagnoseCapsuleWardrobe(mockWardrobe, mockProfile);

    expect(result.strengths.length).toBeGreaterThanOrEqual(0);
    expect(result.weaknesses.length).toBeGreaterThanOrEqual(0);
  });
});
```

---

## 10. 관련 문서

### 10.1 원리 문서

| 문서 | 관계 |
|------|------|
| [fashion-matching.md](../principles/fashion-matching.md) | 핵심 원리 |
| [color-science.md](../principles/color-science.md) | 색상 조화 이론 |
| [body-mechanics.md](../principles/body-mechanics.md) | 체형 매칭 원리 |

### 10.2 ADR

| ADR | 관계 |
|-----|------|
| [ADR-011](../adr/ADR-011-cross-module-data-flow.md) | 크로스 모듈 데이터 흐름 |
| [ADR-029](../adr/ADR-029-affiliate-integration.md) | 어필리에이트 통합 |
| [ADR-034](../adr/ADR-034-product-color-classification.md) | 색상 분류 |

### 10.3 관련 스펙

| 스펙 | 관계 |
|------|------|
| [SDD-CAPSULE-WARDROBE](./SDD-CAPSULE-WARDROBE.md) | 옷장 기본 기능 |
| [SDD-PHASE-J-AI-STYLING](./SDD-PHASE-J-AI-STYLING.md) | AI 스타일링 |
| [SDD-AUTO-COLOR-CLASSIFICATION](./SDD-AUTO-COLOR-CLASSIFICATION.md) | 색상 자동 분류 |
| [SDD-AFFILIATE-INTEGRATION](./SDD-AFFILIATE-INTEGRATION.md) | 어필리에이트 통합 |

---

## 11. 리스크 및 대응

| 리스크 | 가능성 | 영향 | 대응 |
|--------|--------|------|------|
| PC-1 미완료 사용자 | 높음 | 중 | 퍼스널컬러 직접 선택 UI 제공 |
| 색상 추출 부정확 | 중 | 중 | 수동 색상 보정 옵션 |
| C-1 미완료 사용자 | 높음 | 저 | 체형 점수 기본값 적용 |
| 코디 생성 느림 | 저 | 중 | 캐싱 + 백그라운드 생성 |
| 어필리에이트 API 장애 | 중 | 저 | 상품 추천 없이 진단만 표시 |

---

## 12. 향후 확장

| 기능 | 우선순위 | 예상 시기 |
|------|----------|----------|
| AI 기반 아이템 자동 분류 | P2 | Q2 2026 |
| 가상 피팅 (AR) | P3 | Q3 2026 |
| 옷장 공유/소셜 | P2 | Q2 2026 |
| 트렌드 연동 | P2 | Q2 2026 |
| 세탁 알림 | P3 | Q3 2026 |

---

**Author**: Claude Code
**Reviewed by**: -
