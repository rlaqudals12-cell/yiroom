# ADR-053: M-1 메이크업 분석 아키텍처

## 상태

`accepted`

## 날짜

2026-01-23

## 맥락 (Context)

이룸 플랫폼에 메이크업 분석 모듈(M-1)을 추가하여 사용자에게 개인화된 메이크업 추천을 제공해야 합니다. M-1 모듈은 다음 분석 영역을 포함합니다:

1. **립 컬러 분류**: Lab 색공간 기반 8개 카테고리
2. **아이섀도우 톤**: 7개 톤 카테고리 분류
3. **블러셔 컬러**: 6개 컬러 카테고리 분류
4. **컨투어링 가이드**: 얼굴형별 음영 기법
5. **파운데이션 매칭**: 피부톤 Lab 값 기반

### 모듈 간 의존성

```
┌─────────────┐     ┌─────────────┐
│    PC-1     │────▶│    M-1      │
│ 퍼스널컬러   │     │ 메이크업분석 │
└─────────────┘     └──────┬──────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       │            │    N-1      │
       │            │   영양분석   │
       │            └─────────────┘
       │                   ▲
       ▼                   │
┌─────────────┐            │
│    S-1      │────────────┘
│   피부분석   │
└─────────────┘
```

### 핵심 요구사항

- PC-1(퍼스널컬러) 결과를 기반으로 메이크업 팔레트 추천
- S-1(피부분석) 결과를 기반으로 베이스 메이크업 추천
- N-1(영양분석)으로 피부 개선 영양소 알림 전달

## P1: 궁극의 형태 (Ultimate Form)

> 원리 참조: [00-first-principles.md](../../.claude/rules/00-first-principles.md) P1

### 이상적 최종 상태

**제약이 없다면**:
- 얼굴 사진 한 장으로 완벽한 메이크업 팔레트 추천
- AR 기반 실시간 메이크업 시뮬레이션
- 얼굴형별 3D 컨투어링 가이드
- 브랜드별 정확한 파운데이션 매칭
- 시즌/트렌드 기반 동적 추천
- 메이크업 튜토리얼 영상 자동 생성

### 물리적 한계

| 제약 | 현실 | 완화 |
|------|------|------|
| 피부톤 정확도 | 조명 영향 | CIE-3 AWB 보정 |
| AR 시뮬레이션 | 성능 부담 | Phase 2로 연기 |
| 브랜드 DB | 파트너 제품만 | 어필리에이트 확대 |
| 실시간 트렌드 | 데이터 수집 필요 | 수동 업데이트 |

### 100점 기준

| 항목 | 100점 기준 | 현재 목표 |
|------|-----------|----------|
| 립 컬러 매칭 정확도 | 95%+ | 80% |
| 파운데이션 매칭 | 반품률 5% 미만 | 15% |
| 조화도 점수 신뢰도 | 상관관계 0.9+ | 0.7 |
| PC-1 연동 | 완전 통합 | 시즌 기반 추천 |
| 사용자 만족도 | NPS 60+ | NPS 35+ |

### 현재 목표

**Phase 1: 50%** (기본 분석 기능)
- Lab 색공간 기반 립/블러셔 분류
- 아이섀도우 톤 추천
- 정적 컨투어링 가이드
- PC-1 연동 색상 조화도
- S-1 연동 파운데이션 추천

### 의도적 제외

| 제외 항목 | 사유 | 재검토 시점 |
|----------|------|------------|
| AR 메이크업 시뮬레이션 | 구현 복잡도 | Phase 2 |
| 3D 컨투어링 | 기술 성숙도 | Phase 3 |
| 튜토리얼 영상 생성 | AI 비용 | MAU 10K+ |
| 브랜드 정밀 매칭 | DB 구축 필요 | 파트너십 시 |

---

## 결정 (Decision)

### 1. 색상 분류: Lab 색공간 채택

립 컬러, 블러셔 등 메이크업 색상 분류에 **Lab 색공간**을 사용합니다.

```typescript
// lib/makeup/types.ts
interface LabRange {
  L: [number, number];  // 명도 범위 (0-100)
  a: [number, number];  // 빨강-초록 축 (-128 ~ +127)
  b: [number, number];  // 노랑-파랑 축 (-128 ~ +127)
}

type LipCategory =
  | 'nude'   // 내추럴
  | 'pink'   // 핑크
  | 'coral'  // 코랄
  | 'red'    // 레드
  | 'berry'  // 베리
  | 'mauve'  // 모브
  | 'brown'  // 브라운
  | 'mlbb';  // My Lips But Better

const LIP_COLOR_RANGES: Record<LipCategory, LabRange> = {
  nude:  { L: [55, 75], a: [5, 15],  b: [10, 25] },
  pink:  { L: [50, 70], a: [20, 40], b: [-10, 10] },
  coral: { L: [55, 70], a: [25, 45], b: [20, 40] },
  red:   { L: [35, 55], a: [40, 65], b: [15, 35] },
  berry: { L: [25, 45], a: [30, 50], b: [-15, 5] },
  mauve: { L: [40, 60], a: [15, 30], b: [-10, 5] },
  brown: { L: [30, 50], a: [15, 30], b: [20, 40] },
  mlbb:  { L: [45, 65], a: [10, 25], b: [5, 20] },
};
```

### 2. 아이섀도우 톤 분류

7개 톤 카테고리로 분류합니다:

```typescript
type EyeshadowCategory =
  | 'neutral-brown'  // 뉴트럴 브라운
  | 'warm-brown'     // 웜 브라운
  | 'cool-brown'     // 쿨 브라운
  | 'pink-tone'      // 핑크 톤
  | 'smoky'          // 스모키
  | 'colorful'       // 컬러풀
  | 'glitter';       // 글리터

const EYESHADOW_SEASON_MATCH: Record<Season, EyeshadowCategory[]> = {
  spring: ['warm-brown', 'pink-tone', 'colorful', 'glitter'],
  summer: ['cool-brown', 'pink-tone', 'neutral-brown'],
  autumn: ['warm-brown', 'neutral-brown', 'smoky'],
  winter: ['cool-brown', 'smoky', 'colorful', 'glitter'],
};
```

### 3. 블러셔 컬러 분류

6개 컬러 카테고리로 분류합니다:

```typescript
type BlusherCategory =
  | 'peach'     // 피치
  | 'coral'     // 코랄
  | 'rose'      // 로즈
  | 'pink'      // 핑크
  | 'burgundy'  // 버건디
  | 'bronzer';  // 브론저

const BLUSHER_COLOR_RANGES: Record<BlusherCategory, LabRange> = {
  peach:    { L: [65, 80], a: [15, 30], b: [20, 35] },
  coral:    { L: [60, 75], a: [25, 40], b: [25, 40] },
  rose:     { L: [55, 70], a: [20, 35], b: [-5, 10] },
  pink:     { L: [60, 75], a: [25, 40], b: [-10, 5] },
  burgundy: { L: [35, 50], a: [25, 40], b: [5, 20] },
  bronzer:  { L: [45, 60], a: [10, 25], b: [25, 45] },
};
```

### 4. 컨투어링 가이드 (Phase 1)

Phase 1에서는 **정적 가이드 이미지** 방식을 채택합니다:

```typescript
interface ContouringGuide {
  faceShape: FaceShape;
  shadingAreas: string[];      // 셰이딩 위치
  highlightAreas: string[];    // 하이라이트 위치
  intensity: 'light' | 'medium' | 'bold';
  guideImageUrl: string;       // 가이드 이미지
}

const CONTOURING_GUIDES: Record<FaceShape, ContouringGuide> = {
  round: {
    faceShape: 'round',
    shadingAreas: ['볼 양쪽', '턱선'],
    highlightAreas: ['이마 중앙', '코', '턱 끝'],
    intensity: 'medium',
    guideImageUrl: '/guides/contouring/round.svg',
  },
  oblong: {
    faceShape: 'oblong',
    shadingAreas: ['이마 상단', '턱 끝'],
    highlightAreas: ['볼 중앙', '눈 아래'],
    intensity: 'medium',
    guideImageUrl: '/guides/contouring/oblong.svg',
  },
  // ... 나머지 얼굴형
};
```

### 5. AI 분석 파이프라인

**Gemini 3 Flash + Mock Fallback** 전략을 사용합니다:

```typescript
// app/api/analyze/makeup/route.ts
const MAKEUP_ANALYSIS_CONFIG = {
  timeout: 3000,        // 3초 타임아웃
  maxRetries: 2,        // 최대 2회 재시도
  retryDelay: 1000,     // 재시도 간격 1초
  fallbackEnabled: true,
};

interface MakeupAnalysisResult {
  // 기본 정보
  id: string;
  createdAt: string;
  confidence: number;
  usedFallback: boolean;

  // 퍼스널컬러 연동
  season: Season;

  // 추천 팔레트
  lipColors: LipRecommendation[];
  eyeshadows: EyeshadowRecommendation[];
  blushers: BlusherRecommendation[];

  // 컨투어링
  contouringGuide: ContouringGuide;

  // 파운데이션 (S-1 연동)
  foundationMatch: FoundationRecommendation;

  // 종합 조화도
  harmonyScore: HarmonyScore;
}
```

### 6. 파운데이션 매칭 알고리즘

피부톤 Lab 값을 활용하여 파운데이션을 매칭합니다:

```typescript
interface SkinToneAnalysis {
  undertone: 'warm' | 'cool' | 'neutral';
  depth: 'fair' | 'light' | 'medium' | 'tan' | 'deep';
  labValues: { L: number; a: number; b: number };
}

function determineUndertone(lab: LabColor): Undertone {
  const { a, b } = lab;

  // a > 0: 붉은기, b > 0: 노란기
  const warmScore = b * 1.5 + (a < 5 ? 0 : a * 0.5);
  const coolScore = -b * 1.5 + (a > 0 ? a * 0.8 : 0);

  if (Math.abs(warmScore - coolScore) < 5) {
    return 'neutral';
  }
  return warmScore > coolScore ? 'warm' : 'cool';
}

function matchFoundation(skinTone: SkinToneAnalysis): FoundationRecommendation {
  return {
    undertone: skinTone.undertone,
    depth: skinTone.depth,
    recommendedBase: skinTone.undertone === 'warm' ? '황금빛 베이스' :
                     skinTone.undertone === 'cool' ? '핑크 베이스' :
                     '뉴트럴 베이스',
    finish: // S-1 피부 타입에 따라 결정
  };
}
```

### 7. 크로스 모듈 연동

```typescript
// M-1 → N-1 영양 알림 생성
interface CrossModuleAlert {
  type: 'skin_tone_nutrition' | 'collagen_boost';
  source: 'M-1';
  priority: 'high' | 'medium' | 'low';
  message: string;
  nutritionSuggestions: string[];
}

function generateMakeupNutritionAlerts(
  makeupResult: MakeupAnalysisResult,
  skinResult: SkinAnalysisResult
): CrossModuleAlert[] {
  const alerts: CrossModuleAlert[] = [];

  // 피부톤 균일도 개선 알림
  if (makeupResult.harmonyScore.breakdown.lightnessHarmony < 60) {
    alerts.push({
      type: 'skin_tone_nutrition',
      source: 'M-1',
      priority: 'medium',
      message: '피부톤 균일도 개선을 위한 영양소를 추천합니다',
      nutritionSuggestions: ['비타민 C', '나이아신아마이드', '글루타치온', '비타민 E'],
    });
  }

  return alerts;
}
```

## 대안 (Alternatives Considered)

### 색상 분류 방식

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| HSL 색공간 | 브라우저 기본 지원, 빠른 연산 | 인간 지각과 불일치, 피부톤 조화 계산 어려움 | `LOW_ROI` - 메이크업 색상 매칭에 부적합 |
| **Lab 색공간** | 인간 지각 일치, 피부톤 조화 계산 용이 | 변환 연산 필요 | **선택됨** |
| RGB 직접 사용 | 간단한 구현 | 색상 분류 정확도 낮음 | `LOW_QUALITY` - 전문적 분석 불가 |

### 컨투어링 구현 방식

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **정적 가이드 이미지** | 간단한 구현, 빠른 로딩 | 개인화 제한 | **Phase 1 선택** |
| AR 실시간 시뮬레이션 | 높은 개인화 | 복잡한 구현, 성능 부담 | `HIGH_COMPLEXITY` - Phase 2로 연기 |
| AI 생성 가이드 | 완전 개인화 | Gemini 비용, 응답 시간 | `FINANCIAL_HOLD` - 비용 대비 효과 검증 필요 |

### AI 모델 선택

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **Gemini 3 Flash** | 빠른 응답, 저비용, VLM 지원 | 정밀도 제한 | **선택됨** |
| Gemini 3 Pro | 높은 정확도 | 비용 3배, 느린 응답 | `FINANCIAL_HOLD` - Flash로 충분 |
| 자체 ML 모델 | 완전 제어 | 학습 데이터, 유지보수 비용 | `HIGH_COMPLEXITY` - 리소스 부족 |

## 결과 (Consequences)

### 긍정적 결과

- **Lab 색공간 활용**: 피부톤과 메이크업 색상 간 조화도를 정확하게 계산
- **크로스 모듈 통합**: PC-1, S-1 결과를 활용한 종합적 추천
- **일관된 품질**: Mock Fallback으로 서비스 안정성 확보
- **확장 가능성**: Phase 2에서 AR 시뮬레이션 추가 용이

### 부정적 결과

- **Lab 변환 오버헤드**: RGB → Lab 변환에 추가 연산 필요
- **Phase 1 제한**: 컨투어링이 정적 가이드로 제한됨
- **외부 의존성**: Gemini API 가용성에 의존

### 리스크

| 리스크 | 확률 | 영향 | 완화 방안 |
|--------|------|------|----------|
| Gemini API 타임아웃 | 중간 | 중간 | Mock Fallback 활성화 |
| Lab 변환 성능 저하 | 낮음 | 낮음 | 서버 사이드 변환, 캐싱 |
| 색상 분류 부정확 | 낮음 | 중간 | 사용자 피드백 수집, 범위 조정 |

## 구현 가이드

### 파일 구조

```
lib/makeup/
├── index.ts                    # 공개 API (Barrel Export)
├── types.ts                    # 타입 정의
├── constants.ts                # Lab 범위, 시즌 매칭 상수
├── internal/
│   ├── lip-classifier.ts       # 립 컬러 분류
│   ├── eyeshadow-classifier.ts # 아이섀도우 분류
│   ├── blusher-classifier.ts   # 블러셔 분류
│   ├── contouring-guide.ts     # 컨투어링 가이드
│   ├── foundation-matcher.ts   # 파운데이션 매칭
│   └── harmony-calculator.ts   # 조화도 계산

app/api/analyze/makeup/
└── route.ts                    # API 엔드포인트

components/makeup/
├── MakeupPaletteCard.tsx       # 팔레트 추천 카드
├── ContouringGuideView.tsx     # 컨투어링 가이드 뷰
├── FoundationMatchCard.tsx     # 파운데이션 매칭 카드
└── MakeupHarmonyScore.tsx      # 조화도 점수 표시
```

### API 엔드포인트

```typescript
// POST /api/analyze/makeup
// Request
interface MakeupAnalysisRequest {
  imageBase64: string;
  personalColorResult?: PersonalColorResult;  // PC-1 결과 (옵션)
  skinAnalysisResult?: SkinAnalysisResult;    // S-1 결과 (옵션)
}

// Response
interface MakeupAnalysisResponse {
  success: boolean;
  data?: MakeupAnalysisResult;
  error?: {
    code: string;
    message: string;
  };
}
```

### Gemini 프롬프트 구조

```typescript
const MAKEUP_ANALYSIS_PROMPT = `
이미지를 분석하여 메이크업 추천을 생성해주세요.

분석 항목:
1. 얼굴형 판정 (oval, round, oblong, square, heart, diamond)
2. 피부톤 Lab 값 추정 (L: 0-100, a: -128~127, b: -128~127)
3. 언더톤 판정 (warm, cool, neutral)
4. 퍼스널컬러 시즌 확인 (spring, summer, autumn, winter)

출력 형식 (JSON):
{
  "faceShape": "...",
  "skinTone": { "L": ..., "a": ..., "b": ... },
  "undertone": "...",
  "season": "...",
  "confidence": 0-100
}
`;
```

### Mock Fallback 데이터

```typescript
// lib/makeup/internal/mock-data.ts
export function generateMakeupMock(season?: Season): MakeupAnalysisResult {
  const defaultSeason = season ?? 'spring';

  return {
    id: `mock_${Date.now()}`,
    createdAt: new Date().toISOString(),
    confidence: 0,  // Mock 데이터 명시
    usedFallback: true,
    season: defaultSeason,
    lipColors: SEASON_MAKEUP_PALETTES[defaultSeason].lipColors.map(color => ({
      category: color,
      matchRate: 80,
      hex: LIP_COLOR_HEX[color],
    })),
    // ... 나머지 Mock 데이터
  };
}
```

## 리서치 티켓

```
[ADR-053-R1] 한국인 피부톤 메이크업 색상 조화 연구
────────────────────────────────────────────────
리서치 질문:
1. 한국인 피부톤 분포에 최적화된 Lab 범위 조정
2. 립 컬러 8개 카테고리의 한국 시장 적합성 검증
3. 시즌별 메이크업 팔레트 선호도 데이터

예상 출력:
- 조정된 Lab 범위 상수
- 카테고리 명칭 한국어화
- 시즌별 추천 우선순위
```

```
[ADR-053-R2] AR 컨투어링 시뮬레이션 기술 조사 (Phase 2)
────────────────────────────────────────────────────
리서치 질문:
1. WebAR vs Native AR 성능 비교
2. 얼굴 메쉬 기반 음영 시뮬레이션 라이브러리
3. 실시간 렌더링 최적화 기법

예상 출력:
- Phase 2 AR 기능 구현 계획
- 기술 스택 선정
```

## 관련 문서

### 원리 문서 (과학적 기초)

- [원리: 헤어 & 메이크업 분석](../principles/hair-makeup-analysis.md) - Lab 범위, 조화도 계산, 크로스 모듈
- [원리: 색채학](../principles/color-science.md) - Lab 색공간, 웜/쿨톤 이론
- [원리: 피부 생리학](../principles/skin-physiology.md) - 피부 타입, 피부톤 분석

### 관련 ADR

- [ADR-001: Core Image Engine](./ADR-001-core-image-engine.md) - 이미지 처리 파이프라인
- [ADR-003: AI 모델 선택](./ADR-003-ai-model-selection.md) - Gemini 3 Flash 선택 근거
- [ADR-026: HSL 색공간 사용 결정](./ADR-026-color-space-hsl-decision.md) - Lab 확장 계획

### 관련 스펙

- [SDD-MAKEUP-ANALYSIS](../specs/SDD-MAKEUP-ANALYSIS.md) - M-1 모듈 구현 스펙
- [cross-module-insights-hair-makeup](../specs/cross-module-insights-hair-makeup.md) - 크로스 모듈 연동

### 관련 규칙

- [Prompt Engineering Rules](../../.claude/rules/prompt-engineering.md)
- [AI Integration Rules](../../.claude/rules/ai-integration.md)

---

**Author**: Claude Code
**Reviewed by**: -
