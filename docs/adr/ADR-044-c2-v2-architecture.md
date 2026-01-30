# ADR-044: C-2 체형분석 v2 아키텍처

## 상태

`accepted`

## 날짜

2026-01-23

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"CIE 파이프라인과 MediaPipe Pose를 활용한 정량적 체형 분석으로, 7-Type 체형 분류와 자세 분석을 통합 제공하고, 운동/스타일링 모듈과 연동하는 시스템"

- **CIE 통합**: 전신 이미지 품질 검증 및 조명 보정
- **7-Type 분류**: 기존 5타입 + 다이아몬드형, 타원형 추가
- **자세 분석**: CVA (거북목), Cobb angle (척추측만), 골반 틸트 측정
- **정량 + AI Hybrid**: MediaPipe 측정값 + Gemini 종합 판단
- **모듈 연동**: W-1 운동, W-2 스트레칭, J-1 스타일 추천 연계

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 단일 이미지 | 정면/측면 모두 필요, 단일 이미지로 한계 |
| 의류 영향 | 타이트한 의류 착용 필요, 헐렁한 옷은 오차 |
| 2D 한계 | 3D 체형을 2D로 추정, 깊이 정보 손실 |
| MediaPipe 정확도 | 포즈 랜드마크 ±2cm 오차 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 체형 분류 정확도 | 85% (전문 스타일리스트 대비) | C-1: 70% | 7-Type |
| WHR/SHR 정확도 | ±0.05 오차 | C-1: ±0.1 | MediaPipe |
| 자세 분석 정확도 | CVA ±2° | 없음 | Pose 랜드마크 |
| 한국인 정규화 | 표준 데이터 기반 백분위 | 없음 | 국민건강영양조사 |
| 모듈 연동 | W-1, W-2, J-1 완전 연동 | 부분 | 체형별 추천 |

### 현재 목표: 70%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 3D 바디 스캔 | Depth 센서 필요 (HARDWARE_DEPENDENCY) | LiDAR 보급 시 |
| 의료급 자세 분석 | 전문 장비 영역 (SCOPE_EXCEED) | 물리치료 연동 시 |
| 실시간 자세 교정 | GPU 집약적 (PERFORMANCE) | Edge ML 최적화 시 |
| 11-Type 이상 세분화 | 실용적 가치 낮음 (NOT_NEEDED) | 패션 전문가 요청 시 |

## 맥락 (Context)

### C-1 (체형분석 v1) 현재 상태

C-1은 Gemini VLM 기반 체형 분석으로, 다음과 같은 기능을 제공합니다:
- 5가지 체형 분류 (삼각형, 역삼각형, 직사각형, 모래시계형, 사과형)
- WHR/SHR 비율 추정
- 기본 스타일링 추천

### C-1의 한계점

| 한계 | 영향 | 근본 원인 |
|------|------|----------|
| **이미지 전처리 부재** | 조명/품질에 따른 분석 오차 | CIE 파이프라인 미통합 |
| **정량적 측정 불가** | 각도/대칭성 수치 미제공 | MediaPipe 미활용 |
| **자세 분석 부재** | 체형-자세 연관성 파악 불가 | 별도 자세 모듈 없음 |
| **7-Type 미지원** | 다이아몬드/타원형 미분류 | 알고리즘 한계 |
| **운동 연동 약함** | 체형별 맞춤 운동 제한적 | W-1 연동 미흡 |
| **신뢰도 전파 없음** | 분석 품질 불투명 | CIE 미통합 |

### C-2 필요성

1. **CIE 파이프라인 통합**: 이미지 품질 검증(CIE-1), 조명 보정(CIE-3), 조명 분석(CIE-4)을 통한 입력 품질 보장
2. **Hybrid 분석**: Gemini VLM + MediaPipe Pose 조합으로 정성적+정량적 분석
3. **자세 분석 통합**: 거북목, 굽은등, 골반 틀어짐 등 자세 문제 감지
4. **7-Type 확장**: 기존 5타입 + 다이아몬드형, 타원형 추가
5. **운동/스타일링 연동**: W-1, J-1 모듈과 체계적 연동

## 결정 (Decision)

**CIE 통합 Hybrid Body Analyzer**를 C-2로 구현합니다.

### 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         C-2 Hybrid Body Analyzer                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    CIE Pipeline (이미지 전처리)                         │   │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐           │   │
│  │  │ CIE-1   │───▶│ CIE-2   │───▶│ CIE-3   │───▶│ CIE-4   │           │   │
│  │  │품질 검증│    │랜드마크 │    │조명 보정│    │조명 분석│           │   │
│  │  │(전신)  │    │(Pose)   │    │(AWB)   │    │(CCT)   │           │   │
│  │  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘           │   │
│  │       │conf:0.9      │conf:0.85     │conf:0.8      │conf:0.85       │   │
│  │       └──────────────┴──────────────┴──────────────┘                │   │
│  │                              │                                       │   │
│  │                              ▼                                       │   │
│  │                     신뢰도 전파: 0.9 × 0.85 × 0.8 × 0.85 = 0.52     │   │
│  └──────────────────────────────┼───────────────────────────────────────┘   │
│                                 │                                           │
│         ┌───────────────────────┼───────────────────────┐                   │
│         │                       │                       │                   │
│         ▼                       ▼                       ▼                   │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐             │
│  │ Body Shape  │        │   Posture   │        │ AI Vision   │             │
│  │  Analyzer   │        │  Analyzer   │        │  (Gemini)   │             │
│  ├─────────────┤        ├─────────────┤        ├─────────────┤             │
│  │• 7-Type 분류│        │• CVA 측정   │        │• 전체 인상  │             │
│  │• WHR/SHR    │        │• 척추 정렬  │        │• 교차 검증  │             │
│  │• 한국인정규화│        │• 골반 틸트  │        │• 추천 생성  │             │
│  └──────┬──────┘        └──────┬──────┘        └──────┬──────┘             │
│         │                      │                      │                     │
│         └──────────────────────┼──────────────────────┘                     │
│                                ▼                                            │
│                    ┌─────────────────────┐                                  │
│                    │  Result Integrator  │                                  │
│                    │• 정량+AI 병합       │                                  │
│                    │• 체형↔자세 상관분석 │                                  │
│                    │• 종합 신뢰도 산출   │                                  │
│                    └──────────┬──────────┘                                  │
│                               │                                             │
│         ┌─────────────────────┼─────────────────────┐                       │
│         ▼                     ▼                     ▼                       │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                 │
│  │ 스타일 추천  │      │ 운동 추천   │      │스트레칭 추천│                 │
│  │   (J-1)    │      │   (W-1)    │      │   (W-2)    │                 │
│  └─────────────┘      └─────────────┘      └─────────────┘                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 핵심 결정 사항

#### 1. CIE-1~4 파이프라인 완전 통합

| CIE 단계 | C-2 적용 내용 |
|---------|-------------|
| **CIE-1** | 전신 이미지 품질 검증 (해상도 480×640+, 전신 감지) |
| **CIE-2** | MediaPipe Pose 33개 랜드마크 추출 |
| **CIE-3** | 피부 영역 제외 화이트밸런스 보정 |
| **CIE-4** | 조명 균일성 분석, 그림자 감지 |

신뢰도 전파:
```
C-2 최종 신뢰도 = CIE-1 × CIE-2 × CIE-3 × CIE-4 × 체형분석 × AI분석
```

#### 2. 7-Type 체형 분류 시스템

| 체형 | 한글명 | SHR 조건 | WHR 조건 | 특징 |
|------|--------|---------|---------|------|
| Rectangle | 직사각형 | 0.95-1.05 | 0.8-0.9 | 어깨≈허리≈힙 |
| Inverted Triangle | 역삼각형 | >1.15 | <0.85 | 어깨>>힙 |
| Triangle/Pear | 삼각형/배형 | <0.95 | <0.85 | 힙>>어깨 |
| Hourglass | 모래시계 | 0.95-1.05 | <0.75 | 어깨≈힙, 허리↓ |
| **Oval** | 타원형 | 0.9-1.1 | >0.9 | 허리>어깨, 허리>힙 |
| **Diamond** | 다이아몬드 | 0.9-1.1 | <0.8 | 허리>어깨, 허리>힙, 균형 |
| Apple | 사과형 | any | >0.95 | 허리≥어깨≥힙 |

#### 3. 자세 분석 (Posture Analysis)

MediaPipe Pose 기반 정량적 자세 측정:

| 자세 항목 | 측정 방법 | 정상 범위 | 이상 판정 |
|----------|----------|----------|----------|
| **CVA (거북목)** | 귀-C7-수평선 각도 | 50°-65° | <40° 심각 |
| **흉추 후만** | T2-T12 Cobb 각도 | 20°-40° | >55° 심각 |
| **골반 기울기** | ASIS-PSIS 각도 | 4°-15° | >20° 전방경사 |
| **좌우 대칭성** | 어깨/골반 수평 편차 | <2° | >5° 비대칭 |

자세 점수 알고리즘:
```typescript
overallPostureScore =
  CVA점수 × 0.30 +
  흉추후만점수 × 0.25 +
  골반기울기점수 × 0.25 +
  대칭성점수 × 0.20
```

#### 4. 체형-자세 상관관계 분석

| 체형 | 흔한 자세 문제 | 추천 교정 |
|------|--------------|----------|
| 역삼각형 | 라운드숄더 | 흉추 신전, 능형근 강화 |
| 삼각형 | 골반 전방경사 | 장요근 스트레칭, 코어 강화 |
| 사과형 | 요추 과신전 | 복근 강화, 햄스트링 스트레칭 |
| 직사각형 | (상대적으로 양호) | 전반적 균형 유지 |

#### 5. 운동/스타일링 연동

**W-1 (운동 모듈) 연동**:
```typescript
interface C2toW1Data {
  bodyShape: BodyShape7;
  postureIssues: PostureIssue[];
  muscleImbalance: MuscleImbalance[];
  recommendedExercises: Exercise[];
}
```

**J-1 (스타일링 모듈) 연동**:
```typescript
interface C2toJ1Data {
  bodyShape: BodyShape7;
  proportions: BodyProportions;
  recommendedStyles: StyleRecommendation[];
  avoidStyles: StyleRecommendation[];
}
```

### 파일 구조

```
lib/analysis/body/
├── index.ts                    # Barrel export
├── types.ts                    # C-2 타입 정의
├── hybrid-analyzer.ts          # Hybrid 분석 메인
├── internal/
│   ├── cie-integration.ts      # CIE 파이프라인 연동
│   ├── shape-classifier-v2.ts  # 7-Type 분류기
│   ├── posture-analyzer.ts     # 자세 분석기
│   ├── correlation-engine.ts   # 체형↔자세 상관관계
│   ├── ratio-calculator.ts     # 비율 계산 (개선)
│   ├── angle-calculator.ts     # 각도 계산
│   ├── korean-normalizer.ts    # 한국인 정규화
│   └── recommendation-engine.ts # 추천 엔진
└── __tests__/
    └── c2-analyzer.test.ts
```

### 타입 정의

```typescript
// C-2 주요 타입
type BodyShape7 =
  | 'rectangle'
  | 'invertedTriangle'
  | 'triangle'
  | 'hourglass'
  | 'oval'
  | 'diamond'
  | 'apple';

interface C2AnalysisInput {
  imageBase64: string;
  gender: 'male' | 'female';
  ageGroup?: '20s' | '30s' | '40s' | '50s';
  heightCm?: number;
  options?: {
    includePosture?: boolean;  // 자세 분석 포함 (기본: true)
    includeRecommendations?: boolean;  // 추천 포함 (기본: true)
    cieLevel?: 'full' | 'minimal';  // CIE 파이프라인 수준
  };
}

interface C2AnalysisOutput {
  success: boolean;

  // CIE 파이프라인 결과
  cie: {
    quality: CIE1Result;
    landmarks: CIE2Result;
    awb?: CIE3Result;
    lighting?: CIE4Result;
    pipelineConfidence: number;  // 0-1
  };

  // 체형 분석
  bodyShape: {
    type: BodyShape7;
    koreanName: string;
    confidence: number;
    alternativeTypes: Array<{ type: BodyShape7; confidence: number }>;
    description: string;
  };

  // 비율 측정
  ratios: {
    shr: number;  // Shoulder-to-Hip
    whr: number;  // Waist-to-Hip
    whtr: number; // Waist-to-Height
    upperLowerRatio: number;
    koreanPercentile: Record<string, number>;
  };

  // 자세 분석 (옵션)
  posture?: {
    cva: { value: number; grade: string; issue?: string };
    thoracicKyphosis: { value: number; grade: string; issue?: string };
    pelvicTilt: { value: number; grade: string; issue?: string };
    symmetry: { value: number; grade: string; issue?: string };
    overallScore: number;  // 0-100
    overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    primaryIssues: string[];
  };

  // 체형-자세 상관관계
  correlation?: {
    bodyShapePostureLink: string;
    riskFactors: string[];
    preventiveMeasures: string[];
  };

  // 추천 (옵션)
  recommendations?: {
    styling: StylingRecommendation[];
    exercises: ExerciseRecommendation[];
    stretching: StretchingRecommendation[];
  };

  // 메타데이터
  metadata: {
    analysisVersion: 'C-2';
    processingTime: number;
    usedFallback: boolean;
    overallConfidence: number;
  };
}
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **AI Only (C-1 유지)** | 구현 단순, 유지보수 용이 | 정량 측정 불가, CIE 미통합 | `LOW_ROI` - 측정 정확도 한계 |
| **MediaPipe Only** | 정량 측정 정확, 오프라인 가능 | 시각적 인상 분석 불가 | `ACCURACY` - 미묘한 특성 놓침 |
| **외부 Body Analysis API** | 검증된 정확도 | 비용, 의존성, 프라이버시 | `FINANCIAL_HOLD` - 비용 대비 효과 불확실 |
| **3D 스캔 기반** | 최고 정확도 | 특수 장비 필요, 접근성 낮음 | `SCALE` - 모바일 배포 불가 |
| **Hybrid (AI + MediaPipe)** ✅ | 정성+정량, CIE 통합, 신뢰도 전파 | 구현 복잡도 | **채택** |

### CIE 통합 수준 비교

| 수준 | CIE 단계 | 정확도 | 처리 시간 | 선택 |
|------|---------|--------|----------|------|
| 없음 | - | 기준 | ~1s | C-1 현재 |
| Minimal | CIE-1, CIE-2 | +15% | ~1.5s | 경량 옵션 |
| **Full** | CIE-1~4 | +30% | ~2.5s | ✅ 기본값 |

## 결과 (Consequences)

### 긍정적 결과

- **분석 정확도 향상**: CIE 전처리로 입력 품질 보장, 신뢰도 투명성
- **정량적 측정**: CVA, Cobb 각도 등 수치 기반 자세 평가
- **체형-자세 연관 분석**: 체형별 자세 문제 예측 및 예방 조언
- **7-Type 확장**: 더 세분화된 체형 분류로 맞춤 추천 개선
- **모듈 연동 강화**: W-1/W-2/J-1과 데이터 기반 연동

### 부정적 결과

- **처리 시간 증가**: C-1 (~1s) → C-2 (~2.5s)
- **구현 복잡도**: CIE 통합, 상관관계 엔진, 7-Type 알고리즘
- **의존성 증가**: MediaPipe, CIE 모듈, 다중 모듈 연동

### 리스크

| 리스크 | 확률 | 영향 | 완화 전략 |
|--------|------|------|----------|
| MediaPipe 랜드마크 감지 실패 | 중 | 중 | AI 단독 분석으로 폴백 |
| CIE 파이프라인 지연 | 중 | 중 | 타임아웃 + Minimal CIE 옵션 |
| 자세-체형 상관관계 오류 | 낮 | 낮 | 의료 면책 고지, 참고용 명시 |
| 7-Type 오분류 | 중 | 중 | 대안 체형 2개 함께 표시 |

## 구현 가이드

### 우선순위별 구현 순서

| 순서 | 항목 | 예상 시간 | 의존성 |
|------|------|----------|--------|
| 1 | CIE-1 전신 검증 확장 | 4h | - |
| 2 | CIE-2 Pose 랜드마크 통합 | 6h | 1 |
| 3 | 7-Type 분류 알고리즘 | 8h | 2 |
| 4 | 자세 분석기 (CVA, Cobb) | 8h | 2 |
| 5 | 체형-자세 상관관계 엔진 | 4h | 3, 4 |
| 6 | 추천 엔진 (W-1, J-1 연동) | 6h | 5 |
| 7 | API 라우트 및 UI 통합 | 8h | 6 |

**총 예상 시간**: 44시간

### 신뢰도 전파 구현

```typescript
// lib/analysis/body/internal/confidence-propagator.ts

interface ConfidencePipeline {
  cie1: number;      // 품질 검증
  cie2: number;      // 랜드마크 추출
  cie3?: number;     // AWB (옵션)
  cie4?: number;     // 조명 분석 (옵션)
  shapeClassifier: number;
  postureAnalyzer?: number;
  aiAnalyzer?: number;
}

function calculateOverallConfidence(pipeline: ConfidencePipeline): number {
  const required = pipeline.cie1 * pipeline.cie2 * pipeline.shapeClassifier;

  const optional = [
    pipeline.cie3 ?? 1.0,
    pipeline.cie4 ?? 1.0,
    pipeline.postureAnalyzer ?? 1.0,
    pipeline.aiAnalyzer ?? 1.0,
  ];

  const optionalProduct = optional.reduce((acc, v) => acc * v, 1.0);

  return required * optionalProduct;
}
```

### 폴백 전략

```typescript
// 3단계 폴백
async function analyzeBodyWithFallback(input: C2AnalysisInput): Promise<C2AnalysisOutput> {
  try {
    // Level 1: Full Hybrid (CIE + MediaPipe + AI)
    return await analyzeHybrid(input, { cieLevel: 'full' });
  } catch (error) {
    console.warn('[C-2] Full hybrid failed, trying minimal');

    try {
      // Level 2: Minimal Hybrid (CIE-1,2 + MediaPipe)
      return await analyzeHybrid(input, { cieLevel: 'minimal' });
    } catch (error) {
      console.warn('[C-2] Minimal failed, using AI only');

      // Level 3: AI Only (C-1 호환)
      return await analyzeAIOnly(input);
    }
  }
}
```

## 리서치 티켓

```
[C-2-R1] 7-Type 체형 분류 임계값 검증
────────────────────────────────────────
리서치 질문:
1. Size Korea 8차 데이터에서 타원형/다이아몬드형 분포는?
2. 한국인 SHR/WHR 분포에서 7-Type 임계값 최적화
3. 남녀별 임계값 차이 정량화

예상 출력:
- 한국인 특화 7-Type 임계값 테이블
- 분류 정확도 벤치마크 (목표: 85%+)
```

```
[C-2-R2] 체형-자세 상관관계 문헌 조사
────────────────────────────────────────
리서치 질문:
1. 체형별 흔한 자세 문제 학술 근거
2. CVA/Cobb 각도와 체형의 통계적 연관성
3. 체형별 맞춤 교정 운동 효과 연구

예상 출력:
- 체형-자세 상관관계 테이블 (논문 근거)
- 체형별 추천 교정 프로토콜
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 체형 역학](../principles/body-mechanics.md) - MediaPipe 랜드마크, 체형 비율, 자세 평가
- [원리: 이미지 처리](../principles/image-processing.md) - 이미지 전처리, 품질 검증

### 관련 ADR
- [ADR-001: Core Image Engine](./ADR-001-core-image-engine.md) - CIE 파이프라인 아키텍처
- [ADR-040: CIE-3 조명 보정](./ADR-040-cie3-lighting-correction.md) - AWB 알고리즘
- [ADR-041: CIE-4 조명 분석](./ADR-041-cie4-lighting-analysis.md) - 조명 품질 평가
- [ADR-003: AI 모델 선택](./ADR-003-ai-model-selection.md) - Gemini 선택 근거
- [ADR-031: 운동 모듈 아키텍처](./ADR-031-workout-module.md) - W-1 연동
- [ADR-011: 크로스 모듈 데이터 플로우](./ADR-011-cross-module-data-flow.md) - 모듈 간 데이터 연동

### 관련 스펙
- [SDD-BODY-ANALYSIS](../specs/SDD-BODY-ANALYSIS.md) - C-1 체형분석 스펙
- [SDD-BODY-ANALYSIS-v2](../specs/SDD-BODY-ANALYSIS-v2.md) - C-2 상세 설계

### 의료 면책

```
⚠️ 중요 의료 면책

이 문서의 체형/자세 분석은 웰니스 및 피트니스 참고 목적이며,
의료 진단이나 물리치료를 대체하지 않습니다.

다음 사항은 반드시 전문가 상담이 필요합니다:
- 만성 통증 또는 급성 부상
- 척추측만증, 추간판탈출 등 척추 질환
- CVA < 40° 또는 Cobb 각도 > 40° (심각한 자세 이상)
- 관절 가동 범위 제한

자세 점수 및 교정 운동 제안은 참고용이며,
물리치료사 또는 정형외과 전문의와 상담 후 실행하세요.
```

---

**Author**: Claude Code
**Reviewed by**: -
