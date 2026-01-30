# ADR-046: OH-1 구강건강 분석 모듈 아키텍처

## 상태

`accepted`

## 날짜

2026-01-23

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"구강 건강 자가 관리의 첫 단계로, 치아 색상과 잇몸 건강 상태를 AI로 분석하고 퍼스널컬러와 조화로운 미백 목표와 맞춤 구강관리 제품을 추천하는 시스템"

- **VITA 셰이드 매칭**: CIEDE2000 기반 치아 색상 분류
- **잇몸 건강 스크리닝**: Lab a* 기반 염증 지표 평가
- **PC-1 연계**: 퍼스널컬러와 조화로운 미백 목표 제안
- **제품 추천**: 구강 상태별 맞춤 제품 매칭
- **면책 고지**: 의료 진단 대체 불가 명확히 표시

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 의료 대체 불가 | 전문 치과 검진 대체 불가, 스크리닝 목적만 |
| 이미지 품질 | 구강 내부 조명 불균일, 그림자 발생 |
| VITA 정확도 | 전문 셰이드 가이드 대비 ±1-2 셰이드 오차 |
| 잇몸 분석 | 표면 색상만 분석, 깊이/치주낭 측정 불가 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| VITA 셰이드 정확도 | ±1 셰이드 | - | CIEDE2000 |
| 잇몸 염증 감지율 | 85% | - | Lab a* 기반 |
| PC-1 연계율 | 100% | - | 미백 목표 계산 |
| 면책 고지 표시율 | 100% | - | 법적 필수 |
| 제품 매칭 정확도 | 80% | - | 성분-상태 매칭 |

### 현재 목표: 70%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 치주낭 깊이 측정 | 전문 장비 필요 (HARDWARE_DEPENDENCY) | 의료기기 연동 시 |
| 충치 진단 | 의료행위 (LEGAL_HOLD) | N/A (영구 제외) |
| 교정 필요성 판단 | 치과 전문 영역 (SCOPE_EXCEED) | N/A (영구 제외) |
| AR 미백 시뮬레이션 | GPU 집약적 (PERFORMANCE) | WebGPU 최적화 후 |

## 맥락 (Context)

### 배경

구강 건강은 전신 건강과 밀접하게 연관되어 있다:

- **당뇨병-치주질환 양방향 관계**: 치주염 환자는 당뇨 발생 위험 2배, 당뇨 환자는 치주염 3배
- **심혈관 질환**: 치주균이 혈관 내피 손상, 동맥경화 촉진
- **호흡기 질환**: 구강 세균이 폐렴 원인 (특히 고령자)
- **심리적 영향**: 치아 심미성이 자존감, 사회적 상호작용에 영향

### 문제

1. **전문 검진 접근성**: 정기적 치과 방문이 어려운 사용자 다수
2. **자가 관리 한계**: 육안으로는 초기 잇몸 염증, 착색 정도 파악 어려움
3. **제품 선택 어려움**: 수많은 구강관리 제품 중 본인에게 맞는 제품 선별 곤란
4. **퍼스널컬러 연계 부재**: 미백 목표 설정 시 피부톤 조화 고려 없음

### 요구사항

- 치아 사진 분석을 통한 색상(VITA 셰이드) 매칭
- 잇몸 건강 상태 스크리닝 (염증 지표)
- 퍼스널컬러(PC-1)와 연계한 조화로운 미백 목표 제안
- 개인 구강 상태에 맞는 제품 추천
- **의료 진단 대체 불가** 명확히 고지

## 결정 (Decision)

### 1. 분석 아키텍처

OH-1은 기존 CIE (Core Image Engine) 파이프라인을 **구강 이미지용으로 조정**하여 재사용한다.

```
┌─────────────────────────────────────────────────────────────────┐
│                    OH-1 분석 파이프라인                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [입력]                                                          │
│  구강 이미지 (입 벌림, 치아 노출)                                  │
│         ↓                                                        │
│  [CIE-1 재사용: 이미지 품질 검증]                                  │
│  - 해상도 체크 (최소 640x480)                                     │
│  - 조명 균일성 (구강 내부 특성 고려)                               │
│  - 모션 블러 검출                                                 │
│         ↓                                                        │
│  [영역 세그멘테이션]                                              │
│  ┌─────────────┬─────────────┐                                   │
│  │ 치아 영역    │ 잇몸 영역    │                                   │
│  │ (RGB→Lab)   │ (a* 분석)   │                                   │
│  └──────┬──────┴──────┬──────┘                                   │
│         ↓             ↓                                          │
│  [치아 색상 분석]   [잇몸 건강 분석]                               │
│  - CIEDE2000      - 염증 지표 (a* 평균)                           │
│  - VITA 셰이드    - 붉은 영역 비율                                │
│         ↓             ↓                                          │
│  [퍼스널컬러 연계]                                                │
│  - PC-1 결과 조회                                                 │
│  - 시즌별 미백 목표 계산                                          │
│  - 과도한 미백 경고                                               │
│         ↓                                                        │
│  [제품 추천 엔진]                                                 │
│  - 성분-상태 매칭                                                 │
│  - 케어 루틴 생성                                                 │
│         ↓                                                        │
│  [출력]                                                          │
│  OralHealthAssessment + ProductRecommendation + Disclaimer       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. 분석 항목

| 항목 | 방법 | 정확도 목표 | 출처 |
|------|------|-----------|------|
| **치아 색상** | Lab 색공간 + CIEDE2000 | ΔE < 2.7 (임상 허용) | ISO/CIE 11664-6 |
| **잇몸 염증** | a* 값 분석 (붉은기) | AUC 87% | 연구 문헌 |
| **치석 의심** | Gemini VLM 시각 분석 | 참고용 (스크리닝) | - |
| **치열 정렬** | Gemini VLM 시각 분석 | 참고용 (스크리닝) | - |

### 3. AI 파이프라인 결정

**색상 분석**: 알고리즘 기반 (Gemini 미사용)
- RGB → Lab 변환은 수학적 공식 (확정적)
- CIEDE2000 색차 계산은 ISO 표준 공식
- VITA 셰이드 매칭은 데이터베이스 검색

**잇몸/치석/치열 분석**: Gemini VLM 사용
- 시각적 패턴 인식 필요
- ADR-010 AI 파이프라인 아키텍처 준수
- ADR-007 Mock Fallback 전략 적용

```typescript
// lib/gemini/prompts/oral-health.ts
export function oralHealthPrompt(imageBase64: string): string {
  return `
당신은 구강 건강 스크리닝 AI 보조원입니다.

⚠️ 중요: 이 분석은 의료 진단을 대체하지 않습니다.
정확한 진단은 치과 전문의 상담이 필요합니다.

다음 항목을 분석해주세요:

1. 잇몸 상태
   - 색상 (분홍색/붉음/창백)
   - 부기 여부
   - 출혈 징후

2. 치석 의심 영역
   - 치은연상 치석 (황백색)
   - 주로 하악 전치 설면, 상악 구치 협면 확인

3. 치열 정렬
   - 총생, 이개, 돌출 여부
   - 전반적 정렬 상태

다음 JSON 형식으로만 응답:
{
  "gumAssessment": {
    "color": "pink" | "red" | "pale",
    "swelling": boolean,
    "bleedingSigns": boolean,
    "overallStatus": "healthy" | "mild_concern" | "needs_attention"
  },
  "tartarAssessment": {
    "visible": boolean,
    "areas": string[],
    "severity": "none" | "mild" | "moderate"
  },
  "alignmentAssessment": {
    "overallAlignment": "good" | "mild_misalignment" | "moderate_misalignment",
    "notes": string
  },
  "confidence": number
}
`;
}
```

### 4. CIE 파이프라인 재사용

| CIE 모듈 | OH-1 적용 | 조정 사항 |
|----------|----------|----------|
| CIE-1 이미지 품질 | 재사용 | sharpness 임계값 조정 (구강 내부 특성) |
| CIE-2 얼굴 검출 | 미사용 | 구강은 얼굴 검출 불필요 |
| CIE-3 AWB 보정 | 부분 재사용 | 구강 내부 조명 특성 고려 |
| CIE-4 조명 분석 | 미사용 | 구강 내부는 다른 조명 조건 |

### 5. 구강 이미지 가이드

```typescript
// lib/oral-health/internal/image-guide.ts
export const ORAL_IMAGE_REQUIREMENTS = {
  // 권장 촬영 조건
  mouthOpening: {
    description: '입을 크게 벌려 앞니와 잇몸이 보이도록',
    minTeethVisible: 6,  // 최소 앞니 6개 노출
  },
  lighting: {
    type: 'indirect',  // 직사광선 피함
    brightness: 'moderate',
    avoid: ['strong shadows', 'flash reflection'],
  },
  camera: {
    distance: '20-30cm',
    angle: 'front-facing',
    focus: 'teeth and gums',
  },
  // 검증 규칙
  validation: {
    minResolution: { width: 640, height: 480 },
    maxFileSize: 10 * 1024 * 1024,  // 10MB
    acceptedFormats: ['jpeg', 'png'],
  },
};
```

### 6. 의료 면책 고지 전략

```typescript
// lib/oral-health/internal/disclaimer.ts
export const MEDICAL_DISCLAIMER = {
  // 분석 결과 페이지 상단 필수 표시
  header: {
    icon: 'info',
    text: '본 서비스는 의료 진단을 대체하지 않습니다.',
    emphasis: 'always-visible',
  },

  // 치과 방문 권장 조건
  dentalVisitTriggers: [
    { condition: 'inflammationScore > 50', message: '잇몸 염증 지표가 높습니다.' },
    { condition: 'tartarSeverity === "moderate"', message: '치석 제거가 필요해 보입니다.' },
    { condition: 'gumStatus === "needs_attention"', message: '잇몸 상태 확인이 필요합니다.' },
  ],

  // AI 분석 한계 명시
  limitations: [
    '치주낭 깊이 측정 불가 (Probing 필요)',
    '골소실 정도 확인 불가 (X-ray 필요)',
    '충치 깊이 판단 불가 (X-ray 필요)',
    '치아 동요도 확인 불가 (촉진 필요)',
  ],

  // 법적 문구
  legal: {
    ko: '이 서비스는 자가 관리 보조 목적이며, 치과 진단을 대체할 수 없습니다. ' +
        '정확한 진단과 치료는 반드시 치과 전문의와 상담하세요.',
    en: 'This service is for self-care assistance only and cannot replace dental diagnosis. ' +
        'Please consult a dental professional for accurate diagnosis and treatment.',
  },
};
```

### 7. 모듈 경계 정의 (P8 준수)

```
lib/oral-health/
├── index.ts                      # 공개 API (Barrel Export)
├── types.ts                      # 공개 타입 재export
├── tooth-color-analyzer.ts       # 치아 색상 분석 (공개)
├── gum-health-analyzer.ts        # 잇몸 건강 분석 (공개)
├── whitening-goal-calculator.ts  # 미백 목표 계산 (공개)
├── product-recommender.ts        # 제품 추천 (공개)
└── internal/                     # 내부 구현 (외부 접근 금지)
    ├── lab-converter.ts          # RGB→Lab 변환
    ├── ciede2000.ts              # CIEDE2000 색차
    ├── vita-database.ts          # VITA 셰이드 DB
    ├── season-shade-map.ts       # 시즌-셰이드 매핑
    ├── inflammation-detector.ts  # 염증 탐지
    ├── gum-segmenter.ts          # 잇몸 세그멘테이션
    ├── image-guide.ts            # 이미지 가이드
    └── disclaimer.ts             # 면책 조항
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **Gemini 전면 사용** | 구현 단순, 빠른 개발 | 색상 분석 정확도 낮음, 비용 증가 | 색상 분석은 수학적 공식이 더 정확 |
| **외부 치아 분석 API** | 전문 의료 AI, 높은 정확도 | 비용 높음, 의존성 증가, 개인정보 외부 전송 | 자가 관리 목적에 과도한 투자 |
| **머신러닝 자체 모델** | 커스텀 최적화 가능 | 학습 데이터 수집 어려움, 개발 기간 장기 | Phase 3 확장 모듈에 부적합 |

### 선택 근거

**하이브리드 접근법** 선택:
- 색상 분석: 알고리즘 기반 (CIEDE2000 ISO 표준)
- 시각 분석: Gemini VLM (잇몸, 치석, 치열)
- 제품 추천: 규칙 기반 (성분-상태 매칭)

이유:
1. 색상 분석은 수학적 공식이 AI보다 정확하고 일관됨
2. 시각적 패턴 인식은 VLM이 효과적
3. 제품 추천은 ML보다 규칙 기반이 설명 가능성 높음 (P4: 단순화)

## 결과 (Consequences)

### 긍정적 결과

1. **기존 파이프라인 재사용**: CIE-1 이미지 품질 검증 활용 → 개발 시간 단축
2. **과학적 근거 기반**: CIEDE2000 ISO 표준, 연구 문헌 기반 잇몸 분석
3. **퍼스널컬러 시너지**: PC-1 연계로 통합 웰니스 경험 제공
4. **확장성**: 알고리즘 + VLM 하이브리드로 향후 개선 용이
5. **법적 안전**: 면책 조항 체계화로 의료 규제 리스크 최소화

### 부정적 결과

1. **구강 이미지 특수성**: 얼굴 분석과 다른 조명/각도 조건 → 사용자 가이드 필요
2. **분석 한계 명시 필요**: AI 스크리닝의 한계를 사용자에게 명확히 전달해야 함
3. **제품 DB 의존성**: 구강관리 제품 데이터베이스 구축/유지 필요

### 리스크

| 리스크 | 가능성 | 영향 | 완화 방안 |
|--------|--------|------|----------|
| 잘못된 분석으로 인한 민원 | 중 | 높 | 면책 조항 명확화, 치과 방문 권고 강조 |
| 의료기기 규제 적용 | 낮 | 높 | "자가 관리 보조" 목적 명시, 진단 기능 제외 |
| 이미지 품질 불량 | 높 | 중 | 상세한 촬영 가이드, 품질 검증 강화 |

## 구현 가이드

### API 엔드포인트

```typescript
// POST /api/analyze/oral-health
interface OralHealthRequest {
  imageBase64: string;
  analysisType: 'tooth_color' | 'gum_health' | 'full';
  personalColorSeason?: 'spring' | 'summer' | 'autumn' | 'winter';
  oralProfile?: UserOralProfile;
}

interface OralHealthResponse {
  success: boolean;
  data: {
    assessment: OralHealthAssessment;
    productRecommendations?: OralProductRecommendation;
  };
  disclaimer: string;  // 필수 포함
}
```

### Mock Fallback (ADR-007 준수)

```typescript
// lib/gemini/fallback/oral-health.ts
export function generateMockOralHealthAnalysis(): GeminiOralHealthResult {
  return {
    gumAssessment: {
      color: 'pink',
      swelling: false,
      bleedingSigns: false,
      overallStatus: 'healthy',
    },
    tartarAssessment: {
      visible: false,
      areas: [],
      severity: 'none',
    },
    alignmentAssessment: {
      overallAlignment: 'good',
      notes: '전반적으로 양호한 치열입니다.',
    },
    confidence: 0.5,
    _meta: {
      isMock: true,
      mockReason: 'gemini_timeout',
    },
  };
}
```

### 뱃지 연동

```typescript
// 구강건강 분석 완료 시 뱃지 부여
const ORAL_HEALTH_BADGE = {
  id: 'oral_health',
  name: '구강건강 체커',
  description: '구강 건강 분석을 완료했습니다.',
  icon: '🦷',
};
```

## 리서치 티켓

```
[ADR-046-R1] 구강 이미지 품질 검증 임계값 최적화
────────────────────────────────────────────────
리서치 질문:
1. 구강 내부 촬영 시 최적의 sharpness 임계값은?
2. 타액 반사광이 분석에 미치는 영향과 보정 방법
3. 스마트폰 전면 카메라 vs 후면 카메라 품질 차이

예상 출력:
- CIE-1 파라미터 조정값
- 구강 이미지 전처리 알고리즘
```

```
[ADR-046-R2] 잇몸 염증 탐지 알고리즘 검증
──────────────────────────────────────────
리서치 질문:
1. a* 값 임계값 최적화 (현재 10/15/20)
2. 조명 조건에 따른 a* 보정 필요 여부
3. 다양한 피부톤에서의 잇몸 색상 정규화

예상 출력:
- 최적화된 염증 탐지 파라미터
- 피부톤별 보정 계수
```

## 관련 문서

### 원리 문서 (P2: 원리 우선)

- [oral-health.md](../principles/oral-health.md) - 치아 구조, VITA 셰이드, 미백 화학, 충치/치석 메커니즘
- [color-science.md](../principles/color-science.md) - Lab 색공간, CIEDE2000 색차 공식

### 관련 ADR

- [ADR-001: Core Image Engine](./ADR-001-core-image-engine.md) - CIE 파이프라인 재사용 근거
- [ADR-003: AI 모델 선택](./ADR-003-ai-model-selection.md) - Gemini Flash 선택
- [ADR-007: Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md) - AI 실패 시 Mock 전환
- [ADR-010: AI 파이프라인 아키텍처](./ADR-010-ai-pipeline.md) - 프롬프트 분리 패턴

### 구현 스펙

- [SDD-OH-1-ORAL-HEALTH.md](../specs/SDD-OH-1-ORAL-HEALTH.md) - 상세 구현 스펙

### 규칙 참조

- [encapsulation.md](../../.claude/rules/encapsulation.md) - 모듈 경계 (P8)
- [prompt-engineering.md](../../.claude/rules/prompt-engineering.md) - VLM 프롬프트 작성
- [hybrid-data-pattern.md](../../.claude/rules/hybrid-data-pattern.md) - Mock Fallback 패턴

---

**Author**: Claude Code
**Reviewed by**: -
