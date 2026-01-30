# ADR-050: Fashion-Closet 크로스모듈 아키텍처

## 상태

`accepted`

## 날짜

2026-01-23

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"실제 보유 의류 기반 개인화 스타일링 추천으로, PC-1/C-1 분석 결과와 옷장 아이템을 연동하여 최적의 코디를 생성하고 부족 아이템 구매까지 연결하는 시스템"

- **색상 연동**: 옷장 아이템 Lab 색상 추출 → PC-1 조화도 평가
- **체형 연동**: C-1 결과 기반 실루엣 적합도 계산
- **통합 코디**: 보유 아이템으로 TPO별 코디 생성
- **캡슐 진단**: 부족 아이템 식별 → 어필리에이트 추천
- **종합 점수**: 색상(40%) + 체형(35%) + TPO(25%)

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 아이템 등록 | 사용자 수동 업로드 필요, 자동 인식 한계 |
| 색상 정확도 | 이미지 조명에 따른 Lab 추출 오차 |
| 코디 조합 | 아이템 수 증가 시 조합 경우의 수 폭발 |
| 취향 반영 | 객관적 점수 ≠ 사용자 취향 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| PC-1 색상 연동률 | 100% | 0% | Lab 조화도 |
| C-1 체형 연동률 | 100% | 0% | 실루엣 점수 |
| 코디 생성 성공률 | 90% | 0% | 5개 이상 아이템 |
| 부족 아이템 매칭 | 80% | 0% | 어필리에이트 |
| 사용자 코디 채택률 | 30% | - | UX 지표 |

### 현재 목표: 65%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| AI 의류 자동 인식 | 모델 학습 필요 (HIGH_COMPLEXITY) | 의류 데이터셋 확보 시 |
| 날씨 기반 추천 | 외부 API 의존 (SCOPE_EXCEED) | Phase 3 |
| 가상 피팅 AR | GPU 집약적 (PERFORMANCE) | WebGPU 최적화 후 |
| 브랜드별 사이즈 DB | 데이터 수집 비용 (DATA_DEPENDENCY) | 파트너십 확보 시 |

## 맥락 (Context)

이룸의 옷장 관리(Closet)와 스타일링 AI(J-1)를 통합하여 **실제 보유 의류 기반 맞춤형 스타일링 추천**을 제공해야 합니다.

### 문제 정의

1. **데이터 분산**: PC-1(퍼스널컬러), C-1(체형), Closet(옷장)이 독립적으로 존재
2. **연동 부재**: 분석 결과가 옷장 아이템 평가에 활용되지 않음
3. **추천 한계**: 일반적인 스타일 추천만 가능, 개인 옷장 기반 코디 불가
4. **수익화 연결**: 부족 아이템 식별 후 어필리에이트 연동 미비

### 요구사항

1. **색상 연동**: 옷장 아이템 색상을 Lab 색공간으로 추출하여 PC-1 조화도 평가
2. **체형 연동**: C-1 결과 기반 실루엣 적합도 계산
3. **통합 코디**: 실제 보유 아이템으로 코디 생성
4. **구매 연결**: 캡슐 진단 → 부족 아이템 → 어필리에이트 추천

## 결정 (Decision)

**Directed Acyclic Graph (DAG) 기반 크로스모듈 데이터 흐름** 아키텍처 채택:

### 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────────────┐
│                Fashion-Closet 크로스모듈 데이터 흐름                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────┐                                                     │
│  │     Closet     │  아이템 등록 (사진 업로드)                           │
│  │    (옷장)      │                                                     │
│  └───────┬────────┘                                                     │
│          │                                                              │
│          ▼                                                              │
│  ┌────────────────┐                                                     │
│  │  CIE + ACC     │  이미지 분석 → Lab 색상 추출                         │
│  │  (색상분석)    │  - dominant_color_hex                               │
│  │               │  - dominant_color_lab { L, a, b }                    │
│  │               │  - tone (warm/cool/neutral)                          │
│  │               │  - season_match { spring, summer, autumn, winter }   │
│  └───────┬────────┘                                                     │
│          │                                                              │
│          ├─────────────────────┬─────────────────────┐                  │
│          ▼                     ▼                     ▼                  │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐        │
│  │    PC-1/PC-2   │    │    C-1/C-2     │    │      J-1       │        │
│  │  (퍼스널컬러)   │    │    (체형)      │    │  (AI스타일링)   │        │
│  │               │    │               │    │               │        │
│  │  • 톤 매칭     │    │  • 실루엣 점수 │    │  • 코디 생성    │        │
│  │  • 채도 적합   │    │  • 균형감 평가 │    │  • TPO 분석    │        │
│  │  • 명도 적합   │    │  • 비율 보정   │    │  • 조합 최적화  │        │
│  └───────┬────────┘    └───────┬────────┘    └───────┬────────┘        │
│          │                     │                     │                  │
│          │   색상 조화도        │  체형 매칭 점수      │  코디 생성       │
│          │   (40%)             │  (35%)              │  결과            │
│          │                     │                     │                  │
│          └──────────────┬──────┴─────────────────────┘                  │
│                         │                                               │
│                         ▼                                               │
│               ┌──────────────────┐                                      │
│               │   통합 점수 계산   │                                      │
│               │                  │                                      │
│               │  종합 = 색상(40%)│                                      │
│               │       + 체형(35%)│                                      │
│               │       + TPO(25%) │                                      │
│               └────────┬─────────┘                                      │
│                        │                                                │
│          ┌─────────────┼─────────────┐                                  │
│          ▼             ▼             ▼                                  │
│     [코디 추천]   [캡슐 진단]   [부족 아이템]                             │
│                                      │                                  │
│                                      ▼                                  │
│                              ┌────────────────┐                         │
│                              │   Affiliate    │                         │
│                              │  (구매 추천)    │                         │
│                              │               │                         │
│                              │  쿠팡/무신사   │                         │
│                              │  iHerb        │                         │
│                              └────────────────┘                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 통합 방식

#### 1. 옷장 아이템 색상 연동 (Lab 색공간 자동 추출)

```typescript
// lib/closet/color-extraction.ts

interface ItemColorAnalysis {
  dominantColorHex: string;
  dominantColorLab: LabColor;
  tone: 'warm' | 'cool' | 'neutral';
  seasonMatch: Record<SeasonType, number>;
}

/**
 * 아이템 이미지에서 Lab 색상 자동 추출
 * CIE 파이프라인 + ACC (Auto Color Classification) 연동
 */
async function extractItemColor(imageUrl: string): Promise<ItemColorAnalysis> {
  // 1. 이미지 전처리 (CIE-1)
  const preprocessed = await preprocessImage(imageUrl);

  // 2. Dominant Color 추출 (K-means 클러스터링)
  const dominantRgb = await extractDominantColor(preprocessed);

  // 3. RGB → Lab 변환
  const dominantLab = rgbToLab(dominantRgb);

  // 4. 톤 판별 (a*, b* 기반)
  const tone = classifyTone(dominantLab);

  // 5. 계절별 매칭도 계산
  const seasonMatch = calculateSeasonMatch(dominantLab);

  return {
    dominantColorHex: rgbToHex(dominantRgb),
    dominantColorLab: dominantLab,
    tone,
    seasonMatch,
  };
}
```

#### 2. 퍼스널컬러 연동 (톤/채도/명도 조화도 계산)

```typescript
// lib/closet/color-harmony.ts

interface ColorHarmonyResult {
  score: number;           // 종합 조화도 (0-100)
  toneScore: number;       // 톤 매칭 (40%)
  saturationScore: number; // 채도 적합도 (30%)
  lightnessScore: number;  // 명도 적합도 (20%)
  avoidPenalty: number;    // 피해야 할 색상 패널티 (-10% ~ 0%)
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
  const config = SEASON_HARMONY_CONFIG[userSeason];

  // 1. 톤 매칭 (40%)
  const toneScore = matchTone(itemColor, userSeason);

  // 2. 채도 적합성 (30%)
  const saturationScore = matchSaturation(itemColor.c, config.idealSaturationRange);

  // 3. 명도 적합성 (20%)
  const lightnessScore = matchLightness(itemColor.L, config.idealLightnessRange);

  // 4. 피해야 할 색상 패널티 (-10% ~ 0%)
  const avoidPenalty = checkAvoidColors(itemColor, config.avoidColors);

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
    avoidPenalty,
    grade: scoreToGrade(score),
    feedback: generateColorFeedback(score, userSeason, itemColor),
  };
}
```

#### 3. 체형 연동 (실루엣 적합도 계산)

```typescript
// lib/closet/body-matching.ts

interface BodyMatchResult {
  score: number;           // 종합 체형 매칭 (0-100)
  silhouetteScore: number; // 실루엣 적합도
  balanceScore: number;    // 균형감
  proportionScore: number; // 비율 보정
  recommendations: string[];
}

/**
 * 체형 기반 아이템 적합도 계산
 * 원리: docs/principles/body-mechanics.md 참조
 */
function calculateBodyMatch(
  userBodyShape: BodyShapeType,
  itemCategories: ItemCategory[]
): BodyMatchResult {
  const compatibility = SILHOUETTE_COMPATIBILITY[userBodyShape];

  let silhouetteScore = 0;
  let matchedCount = 0;

  for (const category of itemCategories) {
    if (compatibility[category] !== undefined) {
      silhouetteScore += compatibility[category];
      matchedCount++;
    }
  }

  silhouetteScore = matchedCount > 0
    ? silhouetteScore / matchedCount
    : 75; // 기본값

  return {
    score: Math.round(silhouetteScore),
    silhouetteScore,
    balanceScore: 75, // 추후 상세 구현
    proportionScore: 75,
    recommendations: generateBodyRecommendations(userBodyShape, itemCategories),
  };
}
```

#### 4. 통합 코디 점수 계산 (가중 평균)

```typescript
// lib/closet/outfit-scoring.ts

interface OutfitScore {
  colorHarmonyScore: number;  // PC 기반 (0-100)
  bodyMatchScore: number;     // C 기반 (0-100)
  occasionScore: number;      // TPO 적합도 (0-100)
  overallScore: number;       // 종합 (0-100)
  feedback: OutfitFeedback;
}

/**
 * 통합 코디 점수 계산
 * 가중치: 색상 40% + 체형 35% + TPO 25%
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
    ? calculateBodyMatch(
        userProfile.bodyShape.type,
        items.map(i => i.category)
      ).score
    : 75; // 체형 분석 미완료 시 기본값

  // 3. TPO 적합성 점수 (25%)
  const occasionScore = occasion
    ? calculateOccasionMatch(items, occasion)
    : 80; // 기본값

  // 종합 점수 (가중 평균)
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
```

### 캐시 전략

| 이벤트 | 무효화 대상 | 처리 방식 |
|--------|------------|----------|
| **옷장 아이템 추가/삭제** | 코디 추천 캐시, 캡슐 진단 캐시 | 즉시 무효화 + 재계산 |
| **PC-1/PC-2 재분석** | 모든 아이템 조화도, 코디 점수 | 전체 재계산 (백그라운드) |
| **C-1/C-2 재분석** | 실루엣 점수, 코디 점수 | 전체 재계산 (백그라운드) |
| **24시간 경과** | 코디 추천 | TTL 기반 자동 만료 |

```typescript
// lib/closet/cache-invalidation.ts

async function onWardrobeChanged(userId: string, changeType: 'add' | 'delete') {
  // 관련 캐시 무효화
  await invalidateCache(`outfit-recommendations:${userId}`);
  await invalidateCache(`capsule-diagnosis:${userId}`);

  console.log(`[Closet] Wardrobe changed (${changeType}), caches invalidated for ${userId}`);
}

async function onAnalysisUpdated(
  userId: string,
  analysisType: 'pc' | 'body'
) {
  // 모든 아이템 조화도 재계산 (백그라운드)
  await queueBackgroundJob('recalculate-harmony', { userId, analysisType });

  // 캐시 무효화
  await invalidateCache(`item-harmony:${userId}:*`);
  await invalidateCache(`outfit-recommendations:${userId}`);

  console.log(`[Closet] ${analysisType} analysis updated, harmony recalculation queued for ${userId}`);
}
```

### 의존성 규칙

| 기능 | 필수 선행 조건 | 선택 조건 | 폴백 처리 |
|------|--------------|----------|----------|
| 옷장 등록 | 로그인 | - | - |
| 색상 조화도 평가 | PC-1 완료, 아이템 등록 | PC-2 | PC-1 없으면 수동 퍼스널컬러 선택 UI |
| 실루엣 추천 | C-1 완료, 아이템 등록 | C-2 | C-1 없으면 기본 체형 점수(75) |
| 통합 코디 생성 | PC-1 완료, 아이템 3개+ | C-1, PC-2 | 부족 시 최소 조건 안내 |
| 부족 아이템 추천 | 캡슐 진단 완료 | - | - |

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **단순 룩북 연동** | 구현 단순, 빠른 출시 | 개인화 부족, 실제 옷장 미반영 | `LOW_PERSONALIZATION` - 핵심 가치(통합 자기 이해) 불충족 |
| **외부 스타일링 API** | 전문 알고리즘 활용 | 비용 증가, 데이터 외부 전송, API 종속 | `PRIVACY_COST` - 사용자 옷장 데이터 외부 전송 부적절 |
| **독립 모듈 유지** | 결합도 최소, 장애 격리 | 중복 분석, 통합 인사이트 불가 | `LOW_SYNERGY` - 크로스모듈 시너지 불가 |
| **완전 연결 (Full Mesh)** | 풍부한 데이터 활용 | 복잡도 폭발, 순환 의존성 위험 | `HIGH_COMPLEXITY` - 유지보수 어려움 |

### 선택 결정 근거

**DAG 기반 크로스모듈** 선택:
- P8 (모듈 경계): 단방향 데이터 흐름으로 순환 의존성 방지
- P4 (단순화): 필요한 연동만 선택적 구현
- 제1원칙: "통합된 자기 이해에 기여하는가?" - 옷장+분석 통합으로 실제 활용 가치 창출

## 결과 (Consequences)

### 긍정적 결과

- **개인화 극대화**: 실제 보유 아이템 + 분석 결과 기반 맞춤 코디
- **수익화 연결**: 캡슐 진단 → 부족 아이템 → 어필리에이트 자연스러운 흐름
- **UX 향상**: "내 옷으로 오늘 뭘 입을까?" 질문에 직접 답변
- **데이터 축적**: 착용 기록 → 선호도 학습 → 추천 정확도 향상

### 부정적 결과

- **PC-1 강결합**: PC-1 장애 시 색상 조화도 계산 불가
  - **완화**: 수동 퍼스널컬러 선택 폴백 UI
- **복잡한 캐시**: 다중 모듈 변경 시 캐시 관리 복잡
  - **완화**: 캐시 무효화 이벤트 중앙 관리
- **초기 진입 장벽**: PC-1 + 아이템 3개+ 필요
  - **완화**: 점진적 온보딩 (PC-1 먼저 → 아이템 등록 유도)

### 리스크

| 리스크 | 가능성 | 영향 | 대응 |
|--------|--------|------|------|
| PC-1 미완료 사용자 다수 | 높음 | 중 | 퍼스널컬러 직접 선택 UI 제공 |
| 색상 추출 부정확 | 중 | 중 | 수동 색상 보정 옵션 + 피드백 수집 |
| 코디 생성 지연 | 저 | 중 | 캐싱 + 백그라운드 프리페치 |
| 어필리에이트 API 장애 | 중 | 저 | 캡슐 진단만 표시 (상품 추천 제외) |

## 구현 가이드

### 파일 구조

```
lib/closet/
├── index.ts                    # 공개 API (Barrel Export)
├── types.ts                    # 공개 타입
├── color-extraction.ts         # 색상 추출 로직
├── color-harmony.ts            # PC 연동 조화도 계산
├── body-matching.ts            # C 연동 체형 매칭
├── outfit-scoring.ts           # 통합 코디 점수
├── capsule-diagnosis.ts        # 캡슐 옷장 진단
├── cache-invalidation.ts       # 캐시 무효화 이벤트
└── internal/                   # 내부 구현
    ├── constants.ts            # 계절별 설정, 체형별 호환성
    └── helpers.ts              # 유틸리티 함수

app/api/closet/
├── items/
│   ├── route.ts                # GET: 목록, POST: 등록
│   └── [id]/
│       ├── route.ts            # GET/PUT/DELETE
│       └── harmony/route.ts    # GET: 개별 조화도
├── outfits/
│   └── generate/route.ts       # POST: 코디 생성
├── capsule/
│   └── analyze/route.ts        # GET: 캡슐 진단
└── recommend-products/route.ts  # POST: 부족 아이템 상품 추천
```

### DB 스키마 확장

```sql
-- 아이템 조화도 컬럼 추가
ALTER TABLE wardrobe_items
  ADD COLUMN IF NOT EXISTS harmony_score INTEGER,
  ADD COLUMN IF NOT EXISTS harmony_grade TEXT,
  ADD COLUMN IF NOT EXISTS harmony_updated_at TIMESTAMPTZ;

-- 코디 분석 테이블
CREATE TABLE outfit_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,
  color_harmony_score INTEGER NOT NULL,
  body_match_score INTEGER,
  occasion_score INTEGER,
  overall_score INTEGER NOT NULL,
  feedback JSONB,
  occasion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책
ALTER TABLE outfit_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_outfit_analyses" ON outfit_analyses
  FOR ALL USING (
    outfit_id IN (SELECT id FROM outfits WHERE clerk_user_id = auth.get_user_id())
  );
```

### 의존성 체크 미들웨어

```typescript
// lib/closet/dependency-check.ts

export async function requirePC1ForHarmony(userId: string): Promise<PersonalColorResult | null> {
  const pc1 = await getLatestPC1Analysis(userId);

  if (!pc1) {
    // 폴백: 수동 선택 UI로 유도
    return null;
  }

  return pc1;
}

// API 라우트에서 사용
export async function POST(req: Request) {
  const { userId } = await auth.protect();

  const pc1 = await requirePC1ForHarmony(userId);

  if (!pc1) {
    return NextResponse.json({
      success: false,
      requiresPC1: true,
      fallbackAvailable: true,
      message: '퍼스널컬러 분석을 먼저 완료하거나, 직접 선택해주세요.',
    }, { status: 412 });
  }

  // ... 조화도 계산 진행
}
```

## 리서치 티켓

```
[ADR-050-R1] Fashion-Closet 크로스모듈 최적화
────────────────────────────────────────────
claude.ai 딥 리서치 요청:

1. 패션 추천 시스템에서 색상 조화도와 체형 적합도 가중치 최적화 연구
   - 사용자 만족도 기반 가중치 조정 방법론
   - A/B 테스트 설계

2. 캡슐 옷장 진단 알고리즘 개선
   - 코디 다양성 지표 (Outfit Versatility Index)
   - 색상 균형 최적화 (Color Balance Optimization)

3. 크로스모듈 캐시 일관성 전략
   - 분산 환경에서 다중 모듈 캐시 무효화 패턴
   - 최종 일관성 vs 강력한 일관성 trade-off

→ 결과를 lib/closet/ 가중치 튜닝 및 캐시 전략에 적용
```

## 관련 문서

### 원리 문서 (과학적 기초)

- [원리: 패션 매칭](../principles/fashion-matching.md) - 색상 조화 이론, 체형별 실루엣, 캡슐 옷장 설계
- [원리: 색채학](../principles/color-science.md) - Lab 색공간, 퍼스널컬러 분류
- [원리: 체형 역학](../principles/body-mechanics.md) - 5대 체형 분류, 실루엣 원리
- [원리: 크로스도메인 시너지](../principles/cross-domain-synergy.md) - 모듈 간 데이터 의존성

### 관련 ADR

- [ADR-011: Cross-Module Data Flow](./ADR-011-cross-module-data-flow.md) - 기본 크로스모듈 흐름
- [ADR-029: 어필리에이트 통합](./ADR-029-affiliate-integration.md) - 부족 아이템 → 상품 추천
- [ADR-034: 상품 색상 자동 분류](./ADR-034-product-color-classification.md) - ACC (Auto Color Classification)
- [ADR-014: 캐싱 전략](./ADR-014-caching-strategy.md) - 캐시 무효화 패턴

### 구현 스펙

- [SDD-FASHION-CLOSET-INTEGRATION](../specs/SDD-FASHION-CLOSET-INTEGRATION.md) - 상세 구현 스펙
- [SDD-CAPSULE-WARDROBE](../specs/SDD-CAPSULE-WARDROBE.md) - 옷장 기본 기능
- [SDD-PHASE-J-AI-STYLING](../specs/SDD-PHASE-J-AI-STYLING.md) - AI 스타일링 모듈
- [SDD-AUTO-COLOR-CLASSIFICATION](../specs/SDD-AUTO-COLOR-CLASSIFICATION.md) - 색상 자동 분류

---

**Author**: Claude Code
**Reviewed by**: -
