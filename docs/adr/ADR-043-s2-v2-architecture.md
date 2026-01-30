# ADR-043: S-2 피부 분석 v2 아키텍처

## 상태

`accepted`

## 날짜

2026-01-23

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"이미지 기반 정량 분석과 AI 분석의 교차 검증으로 과학적 근거와 함께 재현 가능한 피부 상태 분석을 제공하고, 시계열 변화 추적으로 스킨케어 효과를 측정하는 시스템"

- **CIE 완전 통합**: 조명 보정된 이미지에서 정확한 피부 색상 추출
- **6-Zone 정량 분석**: Lab a* (붉은기), GLCM (텍스처), 모공 밀도 측정
- **AI 교차 검증**: 정량 결과와 Gemini VLM 판단 비교로 신뢰도 향상
- **트렌드 추적**: 시계열 데이터로 피부 상태 변화 패턴 분석
- **성분 기반 추천**: 분석 결과와 제품 성분 DB 연동

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 모공 분석 | 고해상도(4K+) 이미지 필요, 일반 셀피로는 한계 |
| 수분/유분 | 이미지로 직접 측정 불가, 간접 추정만 가능 |
| 피부 깊이 | 표피만 분석 가능, 진피층 상태 추정 불가 |
| GLCM 정확도 | 조명/각도에 민감, 표준화 어려움 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 피부 타입 정확도 | 90% (피부과 전문의 대비) | S-1: 75% | AI + 정량 Hybrid |
| 재현성 | 동일 조건 95% 일치 | S-1: 80% | 정량 분석 |
| 6-Zone 분석 | 각 존별 독립 평가 | Mock | Lab 기반 |
| 트렌드 분석 | 7일 이상 변화 패턴 | 없음 | 시계열 |
| 처리 시간 | < 5초 | S-1: 3초 | CIE + 정량 + AI |

### 현재 목표: 70%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 피부 스캐너 수준 측정 | 전문 의료기기 영역 (SCOPE_EXCEED) | 의료기기 인증 시 |
| 진피층 분석 | 특수 촬영 장비 필요 (HARDWARE_DEPENDENCY) | UV/IR 카메라 연동 시 |
| 실시간 피부 트래킹 | GPU 집약적 (PERFORMANCE) | Edge ML 최적화 시 |
| 트러블 개수 정확 카운트 | 고해상도 + ML 모델 필요 (HIGH_COMPLEXITY) | 전용 모델 학습 시 |

## 맥락 (Context)

### S-1 현재 구현의 한계

S-1(피부 분석 v1)은 Gemini VLM에 전적으로 의존하여 분석을 수행합니다. 이 접근법은 다음 한계가 있습니다:

| 한계 | 상세 | 영향 |
|------|------|------|
| **재현성 부족** | 동일 이미지에서 다른 결과 | 사용자 신뢰도 저하 |
| **정량화 불가** | AI 주관적 판단 (0-100점) | 과학적 근거 부족 |
| **교차 검증 부재** | AI 결과 검증 불가 | 오분류 위험 |
| **CIE 미통합** | 이미지 품질/조명 보정 없음 | 환경 변수에 민감 |
| **영역별 분석 한계** | 6존 분석 Mock 의존 | 국소 문제 감지 어려움 |
| **트렌드 분석 부재** | 단순 히스토리 저장 | 변화 패턴 미제공 |

### CIE 파이프라인 성숙도

ADR-001에서 정의한 Core Image Engine이 구현 진행 중이며, S-2는 이를 완전 활용해야 합니다:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CIE 파이프라인 현황                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CIE-1 (품질 검증)     → Gemini VLM 대체 중                     │
│  CIE-2 (랜드마크)      → MediaPipe 468점 구현                   │
│  CIE-3 (조명 보정)     → ADR-040 Gray World + Von Kries        │
│  CIE-4 (조명 분석)     → ADR-041 CCT + 6-Zone Uniformity       │
│                                                                 │
│  S-2는 CIE-1~4 전체 파이프라인을 활용하는 첫 번째 모듈          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### S-2 요구사항

| 요구사항 | 우선순위 | 근거 |
|---------|---------|------|
| CIE 파이프라인 완전 통합 | P0 | 이미지 품질 보장 |
| Lab 색공간 기반 정량 분석 | P0 | 재현성/과학적 근거 |
| 6-Zone 세밀 분석 | P0 | 국소 문제 감지 |
| AI-알고리즘 하이브리드 | P0 | 교차 검증 |
| 시계열 변화 추적 | P1 | 트렌드 분석 |
| 제품 DB 연동 | P1 | 성분 기반 추천 |
| 처리 시간 < 5초 | P1 | UX |

## 결정 (Decision)

**이미지 기반 정량 분석 + AI 하이브리드 아키텍처**를 구현합니다.

### 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    S-2 피부 분석 v2 아키텍처                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  입력 이미지                                                             │
│       │                                                                 │
│       ▼                                                                 │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Stage 1: CIE 파이프라인                                            │ │
│  │   ├── CIE-1: 품질 검증 (Laplacian, 노출, 얼굴 크기)               │ │
│  │   ├── CIE-2: 랜드마크 추출 (MediaPipe 468점)                      │ │
│  │   ├── CIE-3: 조명 보정 (Gray World + Von Kries)                   │ │
│  │   └── CIE-4: 조명 분석 (CCT, 균일성, 그림자)                      │ │
│  │                                                                    │ │
│  │   출력: 보정 이미지 + 6-Zone ROI + confidence                     │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│       │                                                                 │
│       ▼                                                                 │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Stage 2: 이미지 기반 정량 분석 (병렬)                              │ │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │ │
│  │   │ 붉은기 분석      │  │ 모공 분석       │  │ 텍스처 분석     │  │ │
│  │   │ (Lab a* 기반)    │  │ (밀도/면적)     │  │ (GLCM/Ra)       │  │ │
│  │   └─────────────────┘  └─────────────────┘  └─────────────────┘  │ │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │ │
│  │   │ 색소 분석        │  │ 수분/유분 추정   │  │ 피부 타입 판정  │  │ │
│  │   │ (Lab L*/b*)     │  │ (T존/U존)       │  │ (복합성 감지)   │  │ │
│  │   └─────────────────┘  └─────────────────┘  └─────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│       │                                                                 │
│       ▼                                                                 │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Stage 3: AI 보조 분석                                              │ │
│  │   ├── Gemini VLM: 트러블 감지/유형 분류                            │ │
│  │   ├── Gemini VLM: 피부 상태 종합 평가                              │ │
│  │   └── 신뢰도 교차 검증 (정량 vs AI 결과)                          │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│       │                                                                 │
│       ▼                                                                 │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Stage 4: 종합 및 추천                                              │ │
│  │   ├── 6-Zone 점수 통합                                            │ │
│  │   ├── 이전 분석과 비교 (변화 추적)                                │ │
│  │   ├── 제품 DB 연동 (성분 기반 매칭)                               │ │
│  │   └── 개인화 추천 생성                                            │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│       │                                                                 │
│       ▼                                                                 │
│  SkinAnalysisV2Result + 제품 추천 + 트렌드 데이터                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6-Zone 영역 정의

```
┌───────────────────────────────────────┐
│           이마 (Forehead)              │
│              Zone 1                    │
├─────────────┬───────────┬─────────────┤
│    왼볼     │    코     │    오른볼    │
│   Zone 2   │  Zone 3   │   Zone 4    │
│  (U-Zone)  │ (T-Zone)  │  (U-Zone)   │
├─────────────┴───────────┴─────────────┤
│              턱 (Chin)                 │
│              Zone 5                    │
├───────────────────────────────────────┤
│            턱선 (Jaw)                  │
│              Zone 6                    │
└───────────────────────────────────────┘

T존: Zone 1 (이마) + Zone 3 (코) + Zone 5 (턱)
U존: Zone 2 (왼볼) + Zone 4 (오른볼) + Zone 6 (턱선)
```

### 피부 상태 점수 체계

| 지표 | 측정 방법 | 범위 | 가중치 |
|------|----------|------|--------|
| **수분** | Ra 역상관 추정 | 0-100 | 20% |
| **유분** | T존/U존 밝기 차이 | 0-100 | 15% |
| **민감도** | Lab a* (붉은기) | 0-100 | 20% |
| **주름** | GLCM Contrast | 0-100 | 15% |
| **탄력** | GLCM Homogeneity | 0-100 | 15% |
| **모공** | 가시성 역수 | 0-100 | 15% |

**종합 피부 점수**:
```
overallScore = Σ(score_i × weight_i)

판정:
  80-100: 매우 건강
  60-79:  양호
  40-59:  보통 (관리 필요)
  20-39:  주의 (집중 케어)
  0-19:   심각 (전문 상담)
```

### 신뢰도 전파 모델

```
최종 신뢰도 = CIE-1 × CIE-2 × CIE-3 × CIE-4 × S-2-Algo × S-2-AI

예시 (정상 조건):
  CIE-1 (품질): 0.95
  CIE-2 (랜드마크): 0.98
  CIE-3 (AWB): 0.90
  CIE-4 (조명): 0.85
  S-2-Algo (정량): 0.92
  S-2-AI (VLM): 0.88

  최종 = 0.95 × 0.98 × 0.90 × 0.85 × 0.92 × 0.88 = 0.54 (54%)

신뢰도 표시:
  ≥ 70%: "분석 결과가 정확합니다"
  50-69%: "참고용 결과입니다"
  < 50%: "재촬영을 권장합니다"
```

### 시계열 변화 추적

```typescript
interface SkinTrend {
  userId: string;
  metric: 'hydration' | 'oiliness' | 'redness' | 'pore' | 'overall';
  period: '7d' | '30d' | '90d';
  data: {
    date: string;
    value: number;
    confidence: number;
  }[];
  trend: 'improving' | 'stable' | 'declining';
  changeRate: number;  // 기간 대비 변화율 (%)
}
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **AI 전적 의존 유지 (S-1 확장)** | 구현 단순 | 재현성 부족, 정량화 불가 | `ACCURACY` - 과학적 근거 부족 |
| **이미지 분석만 (AI 제외)** | 완전한 재현성 | 트러블 분류 어려움, 종합 평가 한계 | `UX` - 사용자 친화적 설명 불가 |
| **외부 피부 분석 API (SkinAI 등)** | 검증된 기술 | 비용, 의존성, 개인정보 | `FINANCIAL_HOLD` + `PRIVACY` |
| **이미지 + AI 하이브리드** ✅ | 정량+정성 결합, 교차 검증 | 구현 복잡도 | **채택** |

### CIE 통합 수준 비교

| 수준 | 내용 | 정확도 | 복잡도 | 선택 |
|------|------|--------|--------|------|
| CIE 미사용 | 원본 이미지 직접 분석 | 낮음 | 낮음 | ❌ |
| CIE-1만 (품질 검증) | 부적합 이미지 필터링 | 중간 | 낮음 | ❌ |
| CIE-1~3 (보정까지) | 조명 보정된 이미지 분석 | 높음 | 중간 | △ |
| **CIE-1~4 (전체)** ✅ | 품질+보정+조명 평가 | 최고 | 높음 | **채택** |

## 결과 (Consequences)

### 긍정적 결과

- **재현성 확보**: 동일 이미지에서 동일 정량 결과 보장
- **과학적 근거**: Lab 색공간, GLCM 등 학술적 기반
- **교차 검증**: 정량 분석 + AI 결과 비교로 신뢰도 향상
- **세밀 분석**: 6-Zone 영역별 개별 점수 및 문제 식별
- **변화 추적**: 시계열 데이터로 피부 상태 트렌드 제공
- **제품 연동**: 성분 기반 정확한 제품 매칭

### 부정적 결과

- **처리 시간 증가**: S-1 대비 2-3초 추가 (CIE + 정량 분석)
- **구현 복잡도**: 다중 알고리즘 통합 및 유지보수
- **CIE 의존성**: CIE 장애 시 S-2 전체 영향 (Feature Flag 완화)
- **학습 곡선**: Lab/GLCM 등 원리 이해 필요

### 리스크

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| CIE 파이프라인 장애 | 분석 불가 | S-1 폴백 + Feature Flag |
| 정량-AI 결과 불일치 | 사용자 혼란 | 가중 평균 + 불일치 경고 |
| 처리 시간 초과 (>5초) | UX 저하 | 병렬 처리 + 타임아웃 |
| 새 피부 타입 미지원 | 오분류 | AI 보조 + 지속 학습 |

### 완화 전략 상세

```typescript
// Feature Flag 기반 폴백
const useS2 = await isFeatureEnabled('enableSkinAnalysisV2');

if (useS2) {
  try {
    return await analyzeSkinV2(image);  // S-2 시도
  } catch (error) {
    logger.warn('[S-2] Fallback to S-1', error);
    return await analyzeSkinV1(image);  // S-1 폴백
  }
} else {
  return await analyzeSkinV1(image);
}
```

## 구현 가이드

### 파일 구조

```
lib/analysis/skin-v2/
├── index.ts                    # 공개 API (Barrel Export)
├── types.ts                    # S-2 타입 정의
├── internal/
│   ├── pipeline.ts             # 분석 파이프라인 오케스트레이션
│   ├── quantitative/
│   │   ├── color-analysis.ts   # Lab 색공간 변환/분석
│   │   ├── redness-analysis.ts # 붉은기 정량화
│   │   ├── pore-analysis.ts    # 모공 메트릭
│   │   ├── texture-analysis.ts # GLCM/Roughness
│   │   └── skin-type.ts        # 피부 타입 판정
│   ├── ai/
│   │   ├── trouble-detector.ts # 트러블 감지 (Gemini)
│   │   └── evaluator.ts        # 종합 평가 (Gemini)
│   ├── trend/
│   │   └── tracker.ts          # 시계열 변화 추적
│   └── recommendation/
│       └── product-matcher.ts  # 제품 추천 연동
└── __tests__/
    ├── color-analysis.test.ts
    ├── redness-analysis.test.ts
    └── integration.test.ts
```

### 공개 API

```typescript
// lib/analysis/skin-v2/index.ts
export { analyzeSkinV2 } from './internal/pipeline';
export { analyzeRedness } from './internal/quantitative/redness-analysis';
export { analyzePores } from './internal/quantitative/pore-analysis';
export { analyzeTexture } from './internal/quantitative/texture-analysis';
export { getSkinTrend } from './internal/trend/tracker';
export type {
  SkinAnalysisV2Result,
  SkinZoneResult,
  RednessResult,
  PoreAnalysisResult,
  TextureResult,
  SkinTrend,
} from './types';
```

### 핵심 타입

```typescript
// lib/analysis/skin-v2/types.ts

export interface SkinAnalysisV2Result {
  // 메타데이터
  id: string;
  userId: string;
  createdAt: string;
  version: '2.0';

  // CIE 파이프라인 결과
  cieConfidence: {
    quality: number;    // CIE-1
    landmark: number;   // CIE-2
    awb: number;        // CIE-3
    lighting: number;   // CIE-4
  };

  // 정량 분석 결과
  quantitative: {
    redness: RednessResult;
    pore: PoreAnalysisResult;
    texture: TextureResult;
    pigmentation: PigmentationResult;
  };

  // AI 분석 결과
  aiAnalysis: {
    trouble: TroubleDetectionResult;
    evaluation: SkinEvaluationResult;
    aiConfidence: number;
  };

  // 종합 점수
  scores: {
    hydration: number;     // 수분 0-100
    oiliness: number;      // 유분 0-100
    sensitivity: number;   // 민감도 0-100
    wrinkles: number;      // 주름 0-100
    elasticity: number;    // 탄력 0-100
    pore: number;          // 모공 0-100
    overall: number;       // 종합 0-100
  };

  // 6-Zone 상세
  zoneResults: {
    forehead: SkinZoneResult;
    cheekLeft: SkinZoneResult;
    nose: SkinZoneResult;
    cheekRight: SkinZoneResult;
    chin: SkinZoneResult;
    jaw: SkinZoneResult;
  };

  // 피부 타입
  skinType: 'dry' | 'normal' | 'oily' | 'combination' | 'sensitive';
  skinTypeConfidence: number;

  // 변화 추적 (이전 분석 대비)
  change?: {
    previousId: string;
    daysSinceLast: number;
    overallChange: number;  // % (양수=개선)
    changedMetrics: Array<{
      metric: string;
      change: number;
      trend: 'improving' | 'stable' | 'declining';
    }>;
  };

  // 추천
  recommendations: {
    priorityConcerns: string[];
    ingredients: string[];
    avoidIngredients: string[];
    routineSuggestions: string[];
    products?: ProductRecommendation[];
  };

  // 신뢰도
  overallConfidence: number;
  usedFallback: boolean;
}
```

### 사용 예시

```typescript
// app/api/analyze/skin/v2/route.ts
import { analyzeSkinV2 } from '@/lib/analysis/skin-v2';
import { processWithCIE } from '@/lib/image-engine';

export async function POST(request: Request) {
  const { userId } = await auth();
  const { imageBase64 } = await request.json();

  // 1. CIE 파이프라인 실행
  const cieResult = await processWithCIE(imageBase64, {
    modules: ['CIE-1', 'CIE-2', 'CIE-3', 'CIE-4'],
  });

  if (!cieResult.isAcceptable) {
    return json({
      success: false,
      error: cieResult.feedback,
      shouldRetake: true,
    });
  }

  // 2. S-2 분석 실행
  const result = await analyzeSkinV2({
    correctedImage: cieResult.correctedImage,
    landmarks: cieResult.landmarks,
    cieConfidence: cieResult.confidence,
    userId,
  });

  // 3. DB 저장
  await saveSkinAnalysis(userId, result);

  return json({
    success: true,
    data: result,
  });
}
```

## 테스트 시나리오

| 시나리오 | 입력 | 예상 결과 |
|---------|------|----------|
| 정상 이미지 | 자연광, 정면, 고품질 | overallConfidence > 0.7 |
| 붉은기 높음 | a* > 15 영역 다수 | sensitivity 점수 낮음, 진정 성분 추천 |
| T존 지성 | T존 밝기 높음 | skinType='combination', 유분 조절 추천 |
| 모공 확대 | 밀도 높음, 면적 큼 | pore 점수 낮음, 모공 케어 추천 |
| 이전 대비 개선 | 이전 분석 존재 | change.overallChange > 0 |
| CIE 실패 | 조명 불량 | S-1 폴백, usedFallback=true |

## 마이그레이션 전략

### Phase 1: S-1/S-2 공존 (2주)

```typescript
// Feature Flag 기반 점진적 롤아웃
const S2_ROLLOUT = {
  '2026-01-30': 5,   // 5% 사용자
  '2026-02-06': 25,  // 25% 사용자
  '2026-02-13': 50,  // 50% 사용자
  '2026-02-20': 100, // 전체 사용자
};
```

### Phase 2: S-1 deprecated (4주 후)

- S-1 API 유지 (하위 호환)
- 새 분석은 S-2로 전환
- S-1 결과에 "v2 사용 권장" 표시

### Phase 3: S-1 제거 (8주 후)

- S-1 코드 제거
- S-1 DB 데이터는 마이그레이션 또는 보관

## 관련 문서

### 원리 문서 (과학적 기초)

- [원리: 피부 생리학](../principles/skin-physiology.md) - T존/U존, 모공, 붉은기/트러블
- [원리: 이미지 처리](../principles/image-processing.md) - Laplacian, CCT, AWB
- [원리: 색채학](../principles/color-science.md) - Lab 색공간, ITA

### 관련 ADR

- [ADR-001: Core Image Engine](./ADR-001-core-image-engine.md) - CIE 파이프라인 아키텍처
- [ADR-003: AI 모델 선택](./ADR-003-ai-model-selection.md) - Gemini 선택 근거
- [ADR-007: Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md) - 폴백 패턴
- [ADR-010: AI 파이프라인](./ADR-010-ai-pipeline.md) - AI 분석 흐름
- [ADR-040: CIE-3 조명 보정](./ADR-040-cie3-lighting-correction.md) - AWB 알고리즘
- [ADR-041: CIE-4 조명 분석](./ADR-041-cie4-lighting-analysis.md) - 조명 품질 평가

### 관련 스펙

- [SDD-SKIN-ANALYSIS-v2](../specs/SDD-SKIN-ANALYSIS-v2.md) - S-2 상세 구현 스펙
- [SDD-VISUAL-SKIN-REPORT](../specs/SDD-VISUAL-SKIN-REPORT.md) - 시각적 피부 리포트

## 구현 스펙

이 ADR을 구현하는 스펙 문서:

| 스펙 | 상태 | 설명 |
|------|------|------|
| [SDD-SKIN-ANALYSIS-v2](../specs/SDD-SKIN-ANALYSIS-v2.md) | ✅ 작성 완료 | S-2 상세 알고리즘 및 구현 |

---

**Author**: Claude Code
**Reviewed by**: -
