# ADR-010: AI 파이프라인 아키텍처

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"모든 AI 분석이 재사용 가능한 파이프라인 단계로 조합되는 시스템"

- 공통: client, config, retry, timeout, fallback
- 도메인별: analyzers/ 폴더에 분리
- 프롬프트: prompts/ 폴더에 버전 관리
```

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| 파이프라인 분해 | gemini.ts 1500줄 → 10개 파일 |
| 프롬프트 분리 | 도메인별 독립 파일 |
| 재사용율 | retry/timeout 100% 공유 |

### 현재 달성률

**25%** - 구조 설계됨, gemini.ts 여전히 모놀리식

---

## 상태

`accepted`

## 날짜

2026-01-15

## 맥락 (Context)

현재 `lib/gemini.ts`가 **1,500줄 이상의 모놀리식 파일**로 다음 문제 발생:

1. **책임 과다**: PC-1, S-1, C-1, N-1 프롬프트 + 설정 + 재시도 + Mock이 한 파일에
2. **중복 코드**: 각 분석마다 타임아웃/재시도 로직 반복
3. **테스트 어려움**: 개별 프롬프트 테스트 불가
4. **유지보수 어려움**: 프롬프트 수정 시 전체 파일 검토 필요

## 결정 (Decision)

**Pipeline 패턴**으로 AI 모듈 분해:

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Pipeline Architecture                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  lib/gemini/                                                 │
│  ├── client.ts              (Gemini 클라이언트 초기화)       │
│  ├── config.ts              (모델 설정, 파라미터)            │
│  ├── types.ts               (공통 타입)                      │
│  │                                                           │
│  ├── pipeline/              (실행 파이프라인)                │
│  │   ├── with-retry.ts      (재시도 로직)                    │
│  │   ├── with-timeout.ts    (타임아웃 처리)                  │
│  │   ├── with-fallback.ts   (Mock 전환)                      │
│  │   └── compose.ts         (파이프라인 조합)                │
│  │                                                           │
│  ├── analyzers/             (도메인별 분석기)                │
│  │   ├── personal-color.ts  (PC-1 분석)                      │
│  │   ├── skin.ts            (S-1 분석)                       │
│  │   ├── body.ts            (C-1 분석)                       │
│  │   └── food.ts            (N-1 분석)                       │
│  │                                                           │
│  ├── prompts/               (프롬프트 템플릿)                │
│  │   ├── personal-color.ts  (PC-1 프롬프트)                  │
│  │   ├── skin.ts            (S-1 프롬프트)                   │
│  │   ├── body.ts            (C-1 프롬프트)                   │
│  │   └── food.ts            (N-1 프롬프트)                   │
│  │                                                           │
│  └── fallback/              (Mock 생성)                      │
│      ├── personal-color.ts                                   │
│      ├── skin.ts                                             │
│      ├── body.ts                                             │
│      └── food.ts                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 현상 유지 | 변경 없음 | 1,500줄 유지보수 | `LOW_ROI` |
| 외부 라이브러리 | 검증된 구조 | 의존성 증가 | `ALT_SUFFICIENT` |

## 결과 (Consequences)

### 긍정적 결과

- **단일 책임**: 각 파일이 하나의 역할만 담당
- **테스트 용이**: 프롬프트별 독립 테스트 가능
- **재사용성**: 파이프라인 조합으로 새 분석 쉽게 추가
- **버전 관리**: 프롬프트 변경 히스토리 추적 용이

### 부정적 결과

- **파일 수 증가**: 1개 → 15개+
- **리팩토링 비용**: 기존 코드 분해 필요

## 구현 가이드

### 파이프라인 조합 패턴

```typescript
// lib/gemini/pipeline/compose.ts
export function createAnalysisPipeline<TInput, TOutput>(
  analyzer: Analyzer<TInput, TOutput>,
  fallbackGenerator: () => TOutput
) {
  return compose(
    withTimeout(3000),
    withRetry(2),
    withFallback(fallbackGenerator)
  )(analyzer);
}

// 사용 예시
// lib/gemini/analyzers/skin.ts
import { createAnalysisPipeline } from '../pipeline/compose';
import { skinPrompt } from '../prompts/skin';
import { generateMockSkinAnalysis } from '../fallback/skin';

export const analyzeSkin = createAnalysisPipeline(
  async (input: SkinInput) => {
    const prompt = skinPrompt(input);
    return await callGemini(prompt);
  },
  generateMockSkinAnalysis
);
```

### 프롬프트 분리 패턴

```typescript
// lib/gemini/prompts/skin.ts
export function skinPrompt(input: SkinInput): string {
  return `
당신은 전문 피부과학 기반 AI 분석가입니다.

⚠️ 이미지 분석 전 조건 확인:
${formatConditions(input.conditions)}

📊 분석 기준:
${formatCriteria(input.skinType)}

다음 JSON 형식으로만 응답해주세요:
${JSON.stringify(SKIN_SCHEMA, null, 2)}
`;
}

// 프롬프트 버전 관리
export const SKIN_PROMPT_VERSION = '2.1.0';
```

### Mock Fallback 표준

```typescript
// lib/gemini/fallback/skin.ts
export function generateMockSkinAnalysis(input: SkinInput): SkinResult {
  const baseScore = 70 + Math.floor(Math.random() * 20);

  return {
    overallScore: baseScore,
    hydration: baseScore - 5 + Math.floor(Math.random() * 10),
    oiliness: input.skinType === 'oily' ? 75 : 45,
    // ...
    _meta: {
      isMock: true,
      mockReason: 'gemini_timeout',
      confidence: 0.5,
    }
  };
}
```

## 마이그레이션 계획

| 단계 | 작업 | 예상 시간 |
|------|------|----------|
| 1 | client.ts, config.ts 분리 | 1시간 |
| 2 | pipeline/ 폴더 생성 | 2시간 |
| 3 | prompts/ 분리 (4개) | 2시간 |
| 4 | analyzers/ 분리 (4개) | 2시간 |
| 5 | fallback/ 이동 및 정리 | 1시간 |
| 6 | 기존 gemini.ts를 facade로 변환 | 1시간 |
| 7 | 테스트 작성 | 2시간 |

**총 예상**: 11시간

## 리서치 티켓

```
[ADR-010-R1] AI 파이프라인 패턴 최적화
────────────────────────────────────
claude.ai 딥 리서치 요청:
1. Function composition vs middleware 패턴 성능 비교
2. TypeScript 제네릭을 활용한 타입 안전 파이프라인 설계
3. AI 분석 결과 스트리밍 vs 일괄 응답 UX 비교

→ 결과를 Claude Code에서 lib/gemini/pipeline/에 적용
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: AI 추론](../principles/ai-inference.md) - VLM, 프롬프트 엔지니어링, 신뢰도

### 관련 ADR
- [ADR-003: AI 모델 선택](./ADR-003-ai-model-selection.md)
- [ADR-007: Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md)

### 구현 스펙
- [SDD-S1-PROFESSIONAL-ANALYSIS](../specs/SDD-S1-PROFESSIONAL-ANALYSIS.md) - 피부 분석
- [SDD-S1-SKINCARE-SOLUTION-TAB](../specs/SDD-S1-SKINCARE-SOLUTION-TAB.md) - 스킨케어 솔루션
- [SDD-PHASE-J-AI-STYLING](../specs/SDD-PHASE-J-AI-STYLING.md) - AI 스타일링
- [SDD-PHASE-J-P2-ACCESSORY-MAKEUP](../specs/SDD-PHASE-J-P2-ACCESSORY-MAKEUP.md) - 액세서리/메이크업
- [SDD-PROFESSIONAL-ENHANCEMENT](../specs/SDD-PROFESSIONAL-ENHANCEMENT.md) - 전문가 기능

### 관련 규칙
- [Prompt Engineering Rules](../../.claude/rules/prompt-engineering.md)

---

**Author**: Claude Code
**Reviewed by**: -
