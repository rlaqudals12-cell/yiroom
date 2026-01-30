# AI-1: VLM 프롬프트 엔지니어링 고도화

> AI/ML 심화 1/8 - Vision Language Model 프롬프트 최적화 전략

---

## 1. 연구 개요

### 1.1 배경

Vision Language Model(VLM)은 이미지와 텍스트를 동시에 이해하는 멀티모달 AI 모델이다.
이룸 앱에서 피부, 체형, 퍼스널컬러 분석에 VLM(Gemini 3 Flash)을 활용하며,
프롬프트 최적화는 분석 품질과 비용에 직접적인 영향을 미친다.

### 1.2 VLM 특성

| 특성 | 설명 | 이룸 적용 |
|------|------|----------|
| 이미지 토큰화 | 16x16 패치 → 토큰 변환 | 해상도 최적화 필요 |
| 멀티모달 컨텍스트 | 이미지+텍스트 동시 처리 | 지시문 구조화 |
| Zero-shot 능력 | 예시 없이 작업 수행 | 기본 분석 가능 |
| 환각(Hallucination) | 존재하지 않는 것 생성 | 검증 로직 필요 |

---

## 2. 프롬프트 구조화 전략

### 2.1 역할 분리 패턴

```typescript
// lib/gemini/prompts/structure.ts

export interface StructuredPrompt {
  system: string;      // 역할 및 제약
  context: string;     // 배경 정보
  task: string;        // 수행할 작업
  format: string;      // 출력 형식
  examples?: string;   // Few-shot 예시 (선택)
}

export function buildVLMPrompt(prompt: StructuredPrompt): string {
  return `
## 역할
${prompt.system}

## 배경 정보
${prompt.context}

## 작업
${prompt.task}

## 출력 형식
${prompt.format}

${prompt.examples ? `## 예시\n${prompt.examples}` : ''}
`.trim();
}
```

### 2.2 피부 분석 프롬프트 예시

```typescript
// lib/gemini/prompts/skin-analysis.ts

export const SKIN_ANALYSIS_PROMPT: StructuredPrompt = {
  system: `당신은 전문 피부 분석가입니다.
이미지에서 관찰 가능한 피부 특성만 분석합니다.
의료 진단은 하지 않으며, 관찰 결과만 제공합니다.`,

  context: `분석 대상: 사용자가 업로드한 얼굴 이미지
분석 영역: T존(이마, 코), U존(볼, 턱)
평가 기준: 수분도, 유분도, 민감도, 모공, 주름`,

  task: `1. 이미지에서 피부 상태를 분석하세요.
2. 각 영역(T존/U존)별로 특성을 관찰하세요.
3. 피부 타입을 분류하세요 (건성/지성/복합성/민감성/정상).
4. 주요 피부 고민을 식별하세요.
5. 각 점수를 0-100 범위로 산출하세요.`,

  format: `반드시 다음 JSON 형식으로 응답하세요:
{
  "skinType": "복합성" | "건성" | "지성" | "민감성" | "정상",
  "scores": {
    "hydration": 0-100,
    "oiliness": 0-100,
    "sensitivity": 0-100,
    "poreVisibility": 0-100,
    "wrinkleDepth": 0-100
  },
  "concerns": ["고민1", "고민2"],
  "observations": {
    "tZone": "관찰 내용",
    "uZone": "관찰 내용"
  },
  "confidence": 0-100
}`,
};
```

---

## 3. 프롬프팅 기법

### 3.1 Zero-shot vs Few-shot

| 기법 | 장점 | 단점 | 사용 시점 |
|------|------|------|----------|
| Zero-shot | 토큰 절약, 빠른 응답 | 정확도 낮을 수 있음 | 간단한 분류 |
| Few-shot | 정확도 향상 | 토큰 비용 증가 | 복잡한 분석 |
| Chain-of-Thought | 추론 과정 확인 | 응답 길어짐 | 디버깅/검증 |

### 3.2 Chain-of-Thought for Vision

```typescript
// 시각 정보에 대한 단계별 추론
export const COT_SKIN_PROMPT = `
## 단계별 분석 지시

이미지를 분석할 때 다음 단계를 따르세요:

### 1단계: 전체 관찰
먼저 이미지 전체를 보고 조명, 화질, 촬영 조건을 평가하세요.

### 2단계: 영역별 분석
- T존(이마, 코): 유분기, 모공, 번들거림 확인
- U존(볼, 턱): 건조함, 홍조, 트러블 확인

### 3단계: 종합 판단
각 영역의 관찰 결과를 종합하여 피부 타입을 결정하세요.

### 4단계: 점수 산출
관찰 결과를 바탕으로 각 항목의 점수를 산출하세요.

각 단계의 생각 과정을 "reasoning" 필드에 기록하세요.
`;
```

### 3.3 이미지 영역 지정

```typescript
// 특정 영역에 집중하도록 유도
export const FOCUSED_REGION_PROMPT = `
분석 시 다음 영역에 주목하세요:

1. **이마 영역** (이미지 상단 1/3)
   - 유분 상태, 수평 주름 확인

2. **눈가 영역** (중앙 좌우)
   - 미세 주름, 다크서클 확인

3. **코 영역** (중앙)
   - 블랙헤드, 모공 상태 확인

4. **볼 영역** (중앙 좌우)
   - 홍조, 모공, 피부결 확인

5. **턱 영역** (하단)
   - 트러블, 유분 상태 확인
`;
```

---

## 4. 한국어 최적화

### 4.1 영어 vs 한국어 프롬프트

```typescript
// 연구 결과: 영어 프롬프트가 대부분의 언어에서
// 모국어 프롬프트와 유사한 성능 달성

// 전략: 지시문은 영어, 도메인 용어는 한국어
export const HYBRID_PROMPT = `
## System Instructions (English)
You are a professional skin analyst.
Analyze the uploaded face image.

## Domain Terms (Korean)
피부 타입: 건성, 지성, 복합성, 민감성, 정상
피부 고민: 모공, 주름, 홍조, 트러블, 색소침착
분석 영역: T존, U존

## Output Format
Respond in Korean for user-facing text.
Use the Korean terms defined above.
`;
```

### 4.2 뷰티 도메인 용어집

```typescript
// lib/gemini/prompts/beauty-glossary.ts

export const BEAUTY_GLOSSARY = {
  skinTypes: {
    dry: '건성',
    oily: '지성',
    combination: '복합성',
    sensitive: '민감성',
    normal: '정상',
  },
  concerns: {
    pores: '모공',
    wrinkles: '주름',
    redness: '홍조',
    acne: '트러블',
    pigmentation: '색소침착',
    dehydration: '수분부족',
    oiliness: '과다유분',
  },
  zones: {
    tZone: 'T존 (이마, 코)',
    uZone: 'U존 (볼, 턱)',
    eyeArea: '눈가',
    lipArea: '입술 주변',
  },
};

// 프롬프트에 용어집 포함
export function includeGlossary(prompt: string): string {
  const glossaryText = Object.entries(BEAUTY_GLOSSARY)
    .map(([category, terms]) =>
      `${category}: ${Object.values(terms).join(', ')}`
    )
    .join('\n');

  return `${prompt}\n\n## 용어 참조\n${glossaryText}`;
}
```

---

## 5. 프롬프트 버전 관리

### 5.1 템플릿 시스템

```typescript
// lib/gemini/prompts/template-system.ts

export interface PromptTemplate {
  id: string;
  version: string;
  name: string;
  category: 'skin' | 'body' | 'personalColor' | 'posture';
  prompt: StructuredPrompt;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    author: string;
    changeLog: string;
  };
  performance?: {
    avgLatency: number;
    avgTokens: number;
    successRate: number;
  };
}

// 버전별 프롬프트 저장
export const PROMPT_TEMPLATES: Map<string, PromptTemplate> = new Map([
  ['skin-v1.0', {
    id: 'skin-v1.0',
    version: '1.0.0',
    name: '피부 분석 기본',
    category: 'skin',
    prompt: SKIN_ANALYSIS_PROMPT,
    metadata: {
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
      author: 'system',
      changeLog: '초기 버전',
    },
  }],
  ['skin-v1.1', {
    id: 'skin-v1.1',
    version: '1.1.0',
    name: '피부 분석 개선',
    category: 'skin',
    prompt: SKIN_ANALYSIS_PROMPT_V2, // 개선된 버전
    metadata: {
      createdAt: new Date('2026-01-20'),
      updatedAt: new Date('2026-01-20'),
      author: 'system',
      changeLog: 'CoT 추가, 영역별 분석 강화',
    },
  }],
]);

export function getActivePrompt(category: string): PromptTemplate | null {
  // 카테고리의 최신 버전 반환
  const templates = Array.from(PROMPT_TEMPLATES.values())
    .filter(t => t.category === category)
    .sort((a, b) => b.version.localeCompare(a.version));

  return templates[0] || null;
}
```

### 5.2 A/B 테스트 구조

```typescript
// lib/gemini/prompts/ab-testing.ts

export interface ABTest {
  id: string;
  name: string;
  variants: {
    control: string;  // 기존 프롬프트 ID
    treatment: string; // 새 프롬프트 ID
  };
  trafficSplit: number; // 0-1, treatment 비율
  metrics: string[];
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'stopped';
}

export function selectVariant(
  test: ABTest,
  userId: string
): 'control' | 'treatment' {
  // 사용자별 일관된 할당 (해시 기반)
  const hash = hashUserId(userId);
  const bucket = (hash % 100) / 100;

  return bucket < test.trafficSplit ? 'treatment' : 'control';
}

// 결과 기록
export async function recordABResult(
  testId: string,
  variant: string,
  metrics: Record<string, number>
): Promise<void> {
  // Supabase에 기록
  await supabase.from('ab_test_results').insert({
    test_id: testId,
    variant,
    metrics,
    recorded_at: new Date(),
  });
}
```

---

## 6. 토큰 최적화

### 6.1 이미지 해상도와 토큰

```typescript
// 이미지 크기가 토큰 사용량에 미치는 영향
// 1024x1024 이미지 ≈ 4,096 토큰 (약 2,000-3,000 단어 분량)

export const IMAGE_SIZE_RECOMMENDATIONS = {
  skin: {
    maxSize: 1024,
    recommendedSize: 768,
    quality: 0.85,
    // 768x768 ≈ 2,304 토큰
  },
  body: {
    maxSize: 1024,
    recommendedSize: 1024,
    quality: 0.9,
    // 전신 분석은 더 높은 해상도 필요
  },
  personalColor: {
    maxSize: 512,
    recommendedSize: 512,
    quality: 0.9,
    // 색상 분석은 작은 이미지로 충분
  },
};

export function optimizeImageForAnalysis(
  imageBlob: Blob,
  category: string
): Promise<Blob> {
  const config = IMAGE_SIZE_RECOMMENDATIONS[category];
  return resizeAndCompress(imageBlob, config);
}
```

### 6.2 프롬프트 압축

```typescript
// 불필요한 반복 제거, 핵심만 유지
export function compressPrompt(prompt: string): string {
  return prompt
    // 연속 공백 제거
    .replace(/\s+/g, ' ')
    // 빈 줄 최소화
    .replace(/\n{3,}/g, '\n\n')
    // 불필요한 문구 제거
    .replace(/please|kindly|if possible/gi, '')
    .trim();
}

// 토큰 추정
export function estimateTokens(text: string): number {
  // 대략적 추정: 영어 4자 = 1토큰, 한국어 2자 = 1토큰
  const koreanChars = (text.match(/[가-힣]/g) || []).length;
  const otherChars = text.length - koreanChars;

  return Math.ceil(koreanChars / 2 + otherChars / 4);
}
```

---

## 7. 출력 형식 강제

### 7.1 JSON 스키마 제약

```typescript
// lib/gemini/prompts/output-schema.ts

import { z } from 'zod';

// 피부 분석 출력 스키마
export const SkinAnalysisOutputSchema = z.object({
  skinType: z.enum(['건성', '지성', '복합성', '민감성', '정상']),
  scores: z.object({
    hydration: z.number().min(0).max(100),
    oiliness: z.number().min(0).max(100),
    sensitivity: z.number().min(0).max(100),
    poreVisibility: z.number().min(0).max(100),
    wrinkleDepth: z.number().min(0).max(100),
  }),
  concerns: z.array(z.string()).min(0).max(5),
  observations: z.object({
    tZone: z.string(),
    uZone: z.string(),
  }),
  confidence: z.number().min(0).max(100),
});

export type SkinAnalysisOutput = z.infer<typeof SkinAnalysisOutputSchema>;

// 응답 파싱 및 검증
export function parseAndValidate<T>(
  response: string,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    // JSON 추출 (마크다운 코드 블록 처리)
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { success: false, error: 'JSON not found in response' };
    }

    const json = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    const validated = schema.parse(json);

    return { success: true, data: validated };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

---

## 8. 구현 체크리스트

### P0 (Critical)

- [ ] 역할 분리 패턴 적용
- [ ] JSON 출력 형식 강제
- [ ] Zod 스키마 검증

### P1 (High)

- [ ] 이미지 해상도 최적화
- [ ] 한국어 도메인 용어집
- [ ] 프롬프트 버전 관리

### P2 (Medium)

- [ ] A/B 테스트 구조
- [ ] Chain-of-Thought 옵션
- [ ] 토큰 사용량 모니터링

---

## 9. 참고 자료

- [NVIDIA VLM Prompt Engineering Guide](https://developer.nvidia.com/blog/vision-language-model-prompt-engineering-guide-for-image-and-video-understanding/)
- [Hugging Face VLM Explained](https://huggingface.co/blog/vlms)
- [Awesome VLM Prompting](https://github.com/JindongGu/Awesome-Prompting-on-Vision-Language-Model)
- [Towards Data Science - Prompting VLMs](https://towardsdatascience.com/prompting-with-vision-language-models-bdabe00452b7/)

---

**Version**: 1.0
**Created**: 2026-01-19
**Category**: AI/ML 심화 (1/8)
**Dependencies**: apps/web/lib/gemini.ts
