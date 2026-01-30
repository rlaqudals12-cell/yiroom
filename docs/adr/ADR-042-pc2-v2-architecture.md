# ADR-042: PC-2 퍼스널컬러 분석 v2 아키텍처

## 상태

`accepted`

## 날짜

2026-01-23

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"조명 환경에 영향받지 않는 과학적 퍼스널컬러 분석으로, 수학적 근거와 함께 12톤/24톤 세분화된 결과를 제공하고, CIEDE2000 기반 제품 색상 매칭까지 가능한 시스템"

- **CIE 완전 통합**: CIE-1~4 파이프라인으로 이미지 품질/조명 보정 후 분석
- **Lab 기반 분석**: sRGB → Lab 변환 후 ITA, Hue Angle, Chroma 정량 분석
- **12톤/24톤 분류**: 4계절 × 서브톤(Light/True/Bright/Muted/Deep)
- **신뢰도 전파**: CIE 각 단계 confidence 누적 계산
- **CIEDE2000 매칭**: 제품 색상과의 정밀 색차 계산

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 색공간 변환 | sRGB Gamut 외부 색상 클리핑 발생 |
| 조명 보정 | CIE-3 보정 후에도 극단적 조명에서 오차 |
| 언더톤 경계 | Warm/Cool/Neutral 경계(55°~60°)에서 애매함 |
| 개인차 | 피부 질감/메이크업에 따른 Lab 값 변동 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 계절 분류 정확도 | 95% (전문가 대비) | PC-1: 70% | Lab + AI Hybrid |
| 서브톤 분류 정확도 | 85% | 0% (미구현) | 12톤 기준 |
| 재현성 | 동일 이미지 100% 동일 결과 | PC-1: 90% | 정량 분석 |
| 제품 매칭 정확도 | CIEDE2000 ΔE < 5 | Mock | 색차 기반 |
| 신뢰도 투명성 | 각 단계 confidence 제공 | 단일값 | CIE 전파 |

### 현재 목표: 75%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 24톤 분류 | 12톤으로 충분, 복잡도 증가 (SCOPE_EXCEED) | 전문가 수요 확인 시 |
| 분광기 수준 정확도 | 전문 장비 불필요 (NOT_NEEDED) | 의료/뷰티 전문가 타겟 시 |
| 실시간 드레이핑 AR | GPU 집약적 (PERFORMANCE) | WebGPU 최적화 후 |
| 계절 변화 반영 | 데이터 수집 기간 필요 (DATA_DEPENDENCY) | 12개월 데이터 축적 후 |

## 맥락 (Context)

### PC-1의 현재 구현 및 한계점

PC-1 (퍼스널컬러 분석 v1)은 Gemini VLM 기반의 AI 분석을 통해 4계절 시스템 분류를 제공합니다. 현재 구현에서 다음과 같은 한계가 존재합니다:

| 항목 | PC-1 현재 상태 | 한계점 |
|------|---------------|--------|
| **분류 체계** | 4계절 (Spring/Summer/Autumn/Winter) | 세부 톤 구분 불가 (True/Light/Muted 등) |
| **분석 근거** | AI 텍스트 생성 | 수학적 검증 불가, 재현성 낮음 |
| **이미지 전처리** | 없음 (Gemini 직접 전달) | 조명/색온도 편차로 분석 오류 |
| **색상 추출** | 없음 | 피부 Lab 값 미제공 |
| **제품 매칭** | Mock 데이터 | 실제 색차 기반 매칭 불가 |
| **신뢰도** | 단일 값 | CIE 파이프라인 연계 불가 |

### 조명 조건에 따른 분석 오류

| 조명 조건 | 색온도 (K) | PC-1 영향 |
|----------|-----------|----------|
| 백열등 | 2700K | 웜톤 과대평가 → Spring/Autumn 오분류 |
| 형광등 | 4000-5000K | 녹색 틴트 → 뉴트럴 판정 어려움 |
| 자연광 (정오) | 5500-6500K | 최적 조건 |
| 흐린 날씨 | 6500-8000K | 쿨톤 과대평가 → Summer/Winter 오분류 |

### PC-2 필요성

1. **정확도 향상**: Lab 색공간 기반 수학적 분석으로 일관된 결과
2. **세분화된 분류**: 4계절 → 12톤(또는 24톤)으로 확장
3. **CIE 파이프라인 통합**: 이미지 품질/조명 보정 후 분석
4. **신뢰도 투명성**: 각 단계별 confidence 전파
5. **제품 매칭**: CIEDE2000 색차 기반 정밀 매칭

## 결정 (Decision)

**CIE-1~4 파이프라인 완전 통합 + Lab 기반 12톤/24톤 분류 + AI Hybrid 분석** 아키텍처를 채택합니다.

### PC-2 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PC-2 퍼스널컬러 분석 v2 아키텍처                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  사용자 이미지 입력                                                          │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                    CIE 파이프라인 (ADR-001)                       │       │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │       │
│  │  │ CIE-1   │→│ CIE-2   │→│ CIE-3   │→│ CIE-4   │            │       │
│  │  │ 품질검증 │  │ 랜드마크 │  │ AWB보정 │  │ 조명분석 │            │       │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │       │
│  │       │            │            │            │                  │       │
│  │       └──────────────────────────────────────┘                  │       │
│  │                         │                                       │       │
│  │                    confidence 전파                               │       │
│  │            (0.95 × 0.90 × 0.85 × 0.80 = 0.58)                  │       │
│  └──────────────────────────┬──────────────────────────────────────┘       │
│                             │                                               │
│                             ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                    PC-2 분석 엔진                                 │       │
│  │                                                                   │       │
│  │  ┌─────────────────────────────────────────────────────────┐     │       │
│  │  │ Stage 1: 피부 영역 Lab 추출                              │     │       │
│  │  │   ├── CIE-2 랜드마크 기반 4영역 (이마/좌볼/우볼/턱)     │     │       │
│  │  │   ├── 각 영역 RGB → XYZ → Lab 변환                      │     │       │
│  │  │   └── 가중 평균 Lab 계산                                 │     │       │
│  │  └─────────────────────────────────────────────────────────┘     │       │
│  │                             │                                     │       │
│  │                             ▼                                     │       │
│  │  ┌─────────────────────────────────────────────────────────┐     │       │
│  │  │ Stage 2: 색공간 지표 계산                                │     │       │
│  │  │   ├── ITA (Individual Typology Angle): 피부 밝기        │     │       │
│  │  │   ├── Hue Angle (h°): 언더톤 (웜/쿨)                    │     │       │
│  │  │   └── Chroma (C*): 채도                                  │     │       │
│  │  └─────────────────────────────────────────────────────────┘     │       │
│  │                             │                                     │       │
│  │                             ▼                                     │       │
│  │  ┌─────────────────────────────────────────────────────────┐     │       │
│  │  │ Stage 3: 12톤/24톤 분류                                  │     │       │
│  │  │   ├── 1차: 언더톤 판정 (h° 기반)                        │     │       │
│  │  │   │   └── < 55° = Cool, > 60° = Warm, else Neutral     │     │       │
│  │  │   ├── 2차: 계절 판정 (ITA + Undertone)                  │     │       │
│  │  │   │   └── Warm+Light → Spring, Warm+Deep → Autumn      │     │       │
│  │  │   │   └── Cool+Light → Summer, Cool+Deep → Winter      │     │       │
│  │  │   └── 3차: 서브톤 판정 (L* + C*)                        │     │       │
│  │  │       └── Light / True / Bright / Muted / Deep         │     │       │
│  │  └─────────────────────────────────────────────────────────┘     │       │
│  │                             │                                     │       │
│  │                             ▼                                     │       │
│  │  ┌─────────────────────────────────────────────────────────┐     │       │
│  │  │ Stage 4: AI Hybrid 판정                                  │     │       │
│  │  │   ├── Gemini VLM 분석 (병렬 실행)                       │     │       │
│  │  │   ├── Lab 결과 vs AI 결과 비교                          │     │       │
│  │  │   │   └── 일치: confidence +5%                          │     │       │
│  │  │   │   └── 불일치: Lab 우선, confidence -10%             │     │       │
│  │  │   └── 최종 신뢰도 산출                                   │     │       │
│  │  └─────────────────────────────────────────────────────────┘     │       │
│  │                             │                                     │       │
│  │                             ▼                                     │       │
│  │  ┌─────────────────────────────────────────────────────────┐     │       │
│  │  │ Stage 5: 제품 매칭 (선택적)                              │     │       │
│  │  │   ├── CIEDE2000 색차 계산                               │     │       │
│  │  │   ├── 파운데이션 매칭 (ΔE < 3 최적)                     │     │       │
│  │  │   └── 립스틱/의류 시즌 기반 추천                        │     │       │
│  │  └─────────────────────────────────────────────────────────┘     │       │
│  └──────────────────────────┬──────────────────────────────────────┘       │
│                             │                                               │
│                             ▼                                               │
│  PC-2 결과 출력                                                             │
│  ├── seasonType: spring | summer | autumn | winter                         │
│  ├── subType: spring-light | spring-true | spring-bright | ...            │
│  ├── undertone: warm | cool | neutral                                      │
│  ├── labValues: { L, a, b }                                                │
│  ├── confidence: 0-100 (CIE × Lab × AI 종합)                              │
│  ├── primarySeason: 90%, secondarySeason: 10% (신뢰도 구간)               │
│  └── productRecommendations: CIEDE2000 기반 매칭                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 핵심 결정 사항

#### 1. 12톤 → 24톤 서브톤 확장

| 기존 (12톤) | 확장 (24톤) | 추가 서브톤 |
|------------|-----------|------------|
| Spring (Light/True/Bright) | Spring (Light/True/Bright/Warm/Clear/Soft) | Warm, Clear, Soft |
| Summer (Light/True/Muted) | Summer (Light/True/Muted/Cool/Soft/Clear) | Cool, Soft, Clear |
| Autumn (True/Deep/Muted) | Autumn (True/Deep/Muted/Warm/Soft/Dark) | Warm, Soft, Dark |
| Winter (True/Deep/Bright) | Winter (True/Deep/Bright/Cool/Clear/Dark) | Cool, Clear, Dark |

**24톤 전환은 Phase 2**에서 진행하며, Phase 1은 12톤 시스템으로 시작합니다.

#### 2. 시즌 신뢰도 구간 제공

```typescript
interface SeasonConfidence {
  primary: {
    season: SeasonType;
    confidence: number;    // 예: 90%
  };
  secondary: {
    season: SeasonType;
    confidence: number;    // 예: 10%
  };
  isNeutral: boolean;      // 경계 영역 여부
  neutralAdvice: string;   // "웜톤과 쿨톤 양쪽 컬러가 모두 어울릴 수 있습니다"
}
```

#### 3. 드레이프 가상 시뮬레이션 UI

```typescript
// 기존 HSL 기반 드레이핑에서 Lab 기반으로 전환
interface DrapeSimulatorV2Props {
  userImageUrl: string;
  seasonType: SeasonType;
  subType: PersonalColorSubtype;
  // V2 추가
  labValues: LabColor;
  drapeColors: DrapeColorWithLab[];  // Lab 값 포함 드레이프 색상
  showLabComparison: boolean;        // Lab 비교 시각화
}

interface DrapeColorWithLab {
  hex: string;
  lab: LabColor;
  deltaE: number;          // 피부색과의 CIEDE2000 거리
  harmonyScore: number;    // 조화도 점수
}
```

#### 4. PC-1 결과와의 호환성 유지

```typescript
// PC-2 응답은 PC-1 필드를 모두 포함 (하위 호환)
interface PersonalColorV2Response extends PersonalColorV1Response {
  // PC-1 기존 필드 유지
  seasonType: SeasonType;
  tone: 'warm' | 'cool' | 'neutral';
  bestColors: ColorInfo[];
  worstColors: ColorInfo[];

  // PC-2 확장 필드
  subType: PersonalColorSubtype;
  labAnalysis: LabAnalysisResult;
  seasonConfidence: SeasonConfidence;
  cieMetrics: {
    cie1Quality: number;
    cie2Landmarks: number;
    cie3AWB: number;
    cie4Lighting: number;
    totalConfidence: number;
  };
}
```

### CIE 파이프라인 통합

#### 신뢰도 전파 모델

```
최종 PC-2 신뢰도 = CIE-1 × CIE-2 × CIE-3 × CIE-4 × Lab분류 × AI일치도

예시 (양호한 조건):
CIE-1 (품질): 0.95
CIE-2 (랜드마크): 0.92
CIE-3 (AWB): 0.88
CIE-4 (조명): 0.85
Lab 분류: 0.90
AI 일치: 1.05 (보너스)

최종 = 0.95 × 0.92 × 0.88 × 0.85 × 0.90 × 1.05 = 0.62 (62%)

예시 (열악한 조건 - 백열등):
CIE-1 (품질): 0.90
CIE-2 (랜드마크): 0.85
CIE-3 (AWB): 0.60  ← CCT 2700K 보정 한계
CIE-4 (조명): 0.45  ← 품질 'poor' 판정
Lab 분류: 0.75
AI 일치: 0.90 (불일치)

최종 = 0.90 × 0.85 × 0.60 × 0.45 × 0.75 × 0.90 = 0.14 (14%)
→ 재촬영 권장
```

#### 처리 순서

```
1. CIE-1 (이미지 품질 검증) ───────────────────┐
   └── Pass/Fail + confidence                    │
                                                 │
2. CIE-2 (얼굴 랜드마크 추출) ─────────────────┤ 병렬 가능
   └── 468점 랜드마크 + 피부 영역 좌표          │
                                                 │
3. CIE-3 (AWB 보정) ──────────────────────────┤ CIE-1 의존
   └── 보정 이미지 + CCT + gains                │
                                                 │
4. CIE-4 (조명 분석) ──────────────────────────┤ CIE-2, CIE-3 의존
   └── 균일성 + 그림자 + 품질 판정              │
                                                 ▼
5. PC-2 분석 엔진 ─────────────────────────────
   └── Lab 추출 + 12톤 분류 + AI Hybrid
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **AI Only 유지 (PC-1 개선)** | 구현 단순, 기존 코드 활용 | 재현성 낮음, 조명 민감, 근거 불투명 | `ACCURACY` - 수학적 검증 불가 |
| **Lab Only (AI 제외)** | 완전한 재현성, 비용 절감 | 복잡한 케이스 처리 어려움, 뉴트럴 판정 한계 | `UX` - 경계 사례 처리 미흡 |
| **외부 퍼스널컬러 API** | 전문 알고리즘, 빠른 도입 | 비용 높음, 의존성, 커스터마이징 제한 | `FINANCIAL_HOLD` - 비용 대비 효과 불확실 |
| **CIE 없이 Lab 분석** | 구현 간단 | 조명 편차 문제 미해결 | `ACCURACY` - AWB 없이 정확도 한계 |
| **AI + Lab Hybrid (채택)** ✅ | 정확도 + 유연성, CIE 통합 | 구현 복잡도 | **최적 균형** |

### 분류 체계 대안

| 대안 | 장점 | 단점 | 선택 |
|------|------|------|------|
| 4계절 유지 | 단순, 대중적 | 세분화 부족 | ❌ |
| 12톤 (4×3) | 충분한 세분화, 구현 용이 | 24톤 대비 제한적 | ✅ Phase 1 |
| 24톤 (4×6) | 최대 세분화 | 복잡도 증가, 경계 모호 | ✅ Phase 2 |
| 16톤 (4×4) | 균형 | 비표준, 자료 부족 | ❌ |

## 결과 (Consequences)

### 긍정적 결과

1. **분석 정확도 향상**
   - 조명 보정(CIE-3)으로 색온도 편차 문제 해결
   - Lab 수학적 분류로 일관성 확보
   - AI+Lab Hybrid로 경계 케이스 처리 개선

2. **사용자 신뢰도 향상**
   - Lab 수치 기반 근거 제공 (L*, a*, b*, ITA, h°)
   - 신뢰도 구간 (Primary 90%, Secondary 10%)
   - CIE 파이프라인 품질 지표 투명화

3. **제품 매칭 정확도**
   - CIEDE2000 색차 기반 파운데이션 매칭
   - 계절+서브톤 기반 의류/화장품 추천

4. **확장성**
   - 12톤 → 24톤 확장 용이
   - 새로운 분석 모듈 (헤어, 메이크업) 연동 가능

5. **PC-1 호환성**
   - 기존 API 응답 구조 유지
   - 점진적 마이그레이션 가능

### 부정적 결과

1. **구현 복잡도 증가**
   - CIE 파이프라인 4단계 구현 필요
   - Lab 색공간 변환 로직
   - AI+Lab 불일치 처리

2. **처리 시간 증가**
   - CIE-1~4: ~200-300ms
   - Lab 추출/분류: ~50ms
   - Gemini 호출: ~2000ms
   - 총 ~2.5s (PC-1 대비 +500ms)

3. **의존성 증가**
   - CIE-2 (MediaPipe) 의존
   - CIE-3/4 정상 동작 필수

### 리스크

| 리스크 | 확률 | 영향 | 완화 전략 |
|--------|------|------|----------|
| **CIE 파이프라인 미완성** | 중 | 고 | CIE 없이 AI-only 폴백 제공 |
| **Lab-AI 불일치 빈발** | 중 | 중 | 불일치 패턴 학습, 임계값 조정 |
| **뉴트럴 톤 판정 어려움** | 고 | 중 | AI 보조 판정, 사용자 재촬영 유도 |
| **처리 시간 초과** | 저 | 중 | 병렬 처리, 캐싱 |
| **피부 영역 추출 실패** | 저 | 고 | CIE-2 폴백 (4분할), AI-only 전환 |

## 구현 가이드

### 파일 구조

```
lib/
├── image-engine/
│   ├── cie-1/               # 이미지 품질 검증 (ADR-001)
│   ├── cie-2/               # 얼굴 랜드마크 (ADR-033)
│   ├── cie-3/               # AWB 보정 (ADR-040)
│   └── cie-4/               # 조명 분석 (ADR-041)
├── analysis/
│   └── personal-color/
│       ├── index.ts                    # 공개 API
│       ├── types.ts                    # PC-2 타입
│       ├── internal/
│       │   ├── color-convert.ts        # RGB → Lab 변환
│       │   ├── lab-extractor.ts        # 피부 영역 Lab 추출
│       │   ├── ita-calculator.ts       # ITA 계산
│       │   ├── hue-angle.ts            # Hue Angle 계산
│       │   ├── twelve-tone-classifier.ts  # 12톤 분류
│       │   ├── twenty-four-tone.ts     # 24톤 확장 (Phase 2)
│       │   ├── hybrid-analyzer.ts      # AI+Lab Hybrid
│       │   ├── season-confidence.ts    # 신뢰도 구간
│       │   ├── ciede2000.ts            # 색차 계산
│       │   └── product-matcher.ts      # 제품 매칭
│       └── __tests__/
app/api/
└── v2/
    └── analyze/
        └── personal-color/
            ├── route.ts                # PC-2 API 라우트
            └── [id]/
                └── route.ts            # 결과 조회
components/
└── analysis/
    └── personal-color/
        ├── DrapeSimulatorV2.tsx        # Lab 기반 드레이프
        ├── SeasonConfidenceBar.tsx     # 신뢰도 구간 시각화
        └── LabMetricsCard.tsx          # Lab 수치 표시
```

### 공개 API

```typescript
// lib/analysis/personal-color/index.ts
export { analyzePersonalColorV2 } from './internal/hybrid-analyzer';
export { classifyTwelveTone } from './internal/twelve-tone-classifier';
export { extractSkinLab } from './internal/lab-extractor';
export type {
  PersonalColorV2Request,
  PersonalColorV2Response,
  LabAnalysisResult,
  SeasonConfidence,
  PersonalColorSubtype,
} from './types';
```

### 핵심 타입

```typescript
// lib/analysis/personal-color/types.ts

export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';

export type PersonalColorSubtype =
  // 12톤 (Phase 1)
  | 'spring-light' | 'spring-true' | 'spring-bright'
  | 'summer-light' | 'summer-true' | 'summer-muted'
  | 'autumn-true' | 'autumn-deep' | 'autumn-muted'
  | 'winter-true' | 'winter-deep' | 'winter-bright'
  // 24톤 확장 (Phase 2)
  | 'spring-warm' | 'spring-clear' | 'spring-soft'
  | 'summer-cool' | 'summer-soft' | 'summer-clear'
  | 'autumn-warm' | 'autumn-soft' | 'autumn-dark'
  | 'winter-cool' | 'winter-clear' | 'winter-dark';

export interface LabColor {
  L: number;  // 0-100
  a: number;  // -128 ~ +127
  b: number;  // -128 ~ +127
}

export interface PersonalColorV2Response {
  success: boolean;
  data: PersonalColorAssessmentRow;
  result: {
    // 기본 분류
    seasonType: SeasonType;
    subType: PersonalColorSubtype;
    undertone: 'warm' | 'cool' | 'neutral';
    depth: 'light' | 'deep';

    // Lab 분석
    labValues: LabColor;
    ita: number;
    hueAngle: number;
    chroma: number;

    // 신뢰도
    confidence: number;
    seasonConfidence: SeasonConfidence;

    // CIE 메트릭
    cieMetrics: {
      cie1Quality: number;
      cie2Landmarks: number;
      cie3AWB: number;
      cie4Lighting: number;
      totalConfidence: number;
    };

    // 추천
    bestColors: ColorInfo[];
    worstColors: ColorInfo[];
    productRecommendations?: ProductRecommendation[];

    // 메타데이터
    analysisMethod: 'hybrid' | 'lab-only' | 'ai-only';
    analyzedAt: string;
  };
  usedMock: boolean;
}
```

### 구현 우선순위

#### Phase 1: 12톤 + CIE 통합 (Week 1-2)

| 순서 | 원자 | 의존성 | 소요시간 |
|------|------|--------|----------|
| 1 | PC2-TYPES: 타입 정의 | - | 1h |
| 2 | PC2-RGB-LAB: 색공간 변환 | PC2-TYPES | 1h |
| 3 | PC2-ITA: ITA 계산 | PC2-RGB-LAB | 0.5h |
| 4 | PC2-HUE: Hue Angle | PC2-RGB-LAB | 0.5h |
| 5 | PC2-12TONE: 12톤 분류 | PC2-ITA, PC2-HUE | 2h |
| 6 | PC2-LAB-EXTRACT: Lab 추출 | CIE-2, PC2-RGB-LAB | 2h |
| 7 | PC2-HYBRID: AI+Lab Hybrid | PC2-12TONE, Gemini | 2h |
| 8 | PC2-CONFIDENCE: 신뢰도 구간 | PC2-HYBRID | 1h |
| 9 | PC2-API: API 라우트 | PC2-HYBRID | 2h |
| 10 | PC2-TESTS: 테스트 | ALL | 3h |

#### Phase 2: 24톤 확장 (Week 3)

| 순서 | 원자 | 의존성 | 소요시간 |
|------|------|--------|----------|
| 11 | PC2-24TONE: 24톤 분류 | PC2-12TONE | 3h |
| 12 | PC2-DRAPE-V2: 드레이프 v2 | PC2-24TONE | 4h |

#### Phase 3: 제품 매칭 (Week 4)

| 순서 | 원자 | 의존성 | 소요시간 |
|------|------|--------|----------|
| 13 | PC2-CIEDE2000: 색차 계산 | PC2-RGB-LAB | 1h |
| 14 | PC2-PRODUCT: 제품 매칭 | PC2-CIEDE2000 | 2h |

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 색채학](../principles/color-science.md) - Lab 색공간, ITA, Hue Angle, 12톤 분류
- [원리: 이미지 처리](../principles/image-processing.md) - RGB→Lab 변환, 색온도, AWB

### 관련 ADR
- [ADR-001: Core Image Engine](./ADR-001-core-image-engine.md) - CIE 파이프라인 아키텍처
- [ADR-026: 색공간 HSL 결정](./ADR-026-color-space-hsl-decision.md) - Lab vs HSL 선택
- [ADR-033: 얼굴 감지 라이브러리](./ADR-033-face-detection-library.md) - MediaPipe 선택
- [ADR-040: CIE-3 조명 보정](./ADR-040-cie3-lighting-correction.md) - AWB 알고리즘
- [ADR-041: CIE-4 조명 분석](./ADR-041-cie4-lighting-analysis.md) - 조명 품질 평가

### 관련 스펙
- [SDD-PERSONAL-COLOR-v2](../specs/SDD-PERSONAL-COLOR-v2.md) - PC-2 상세 구현 스펙
- [PC1-detailed-evidence-report](../specs/PC1-detailed-evidence-report.md) - PC-1 결과 리포트
- [SDD-CIE-1-IMAGE-QUALITY](../specs/SDD-CIE-1-IMAGE-QUALITY.md) - 이미지 품질 검증
- [SDD-CIE-2-FACE-DETECTION](../specs/SDD-CIE-2-FACE-DETECTION.md) - 얼굴 랜드마크
- [SDD-CIE-3-AWB-CORRECTION](../specs/SDD-CIE-3-AWB-CORRECTION.md) - 화이트밸런스 보정
- [SDD-CIE-4-LIGHTING-ANALYSIS](../specs/SDD-CIE-4-LIGHTING-ANALYSIS.md) - 조명 분석

---

**Author**: Claude Code
**Reviewed by**: -
