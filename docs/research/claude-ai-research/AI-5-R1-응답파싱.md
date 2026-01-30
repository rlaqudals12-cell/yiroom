# AI-5: LLM 응답 파싱 및 검증

> AI/ML 심화 5/8 - JSON 구조화 출력 및 스키마 검증

---

## 1. 연구 개요

### 1.1 구조화된 출력의 중요성

LLM의 자유 형식 텍스트 응답은 파싱 오류의 주요 원인이다.
JSON 스키마 강제를 통해 **파싱 오류를 최대 90% 감소**시킬 수 있다.

### 1.2 발전 과정

| 세대 | 방식 | 문제점 |
|------|------|--------|
| 1세대 | JSON Mode | 형식은 맞지만 필드 누락 가능 |
| 2세대 | Function Calling | 복잡한 중첩 구조 처리 어려움 |
| 3세대 | Structured Output | 스키마 100% 준수 보장 |

---

## 2. Structured Output 구현

### 2.1 Gemini API 설정

```typescript
// lib/gemini/structured-output.ts

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// 피부 분석 결과 스키마
const skinAnalysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    skinType: {
      type: SchemaType.STRING,
      enum: ['건성', '지성', '복합성', '민감성', '정상'],
      description: '피부 타입',
    },
    scores: {
      type: SchemaType.OBJECT,
      properties: {
        hydration: { type: SchemaType.INTEGER, minimum: 0, maximum: 100 },
        oiliness: { type: SchemaType.INTEGER, minimum: 0, maximum: 100 },
        sensitivity: { type: SchemaType.INTEGER, minimum: 0, maximum: 100 },
        poreVisibility: { type: SchemaType.INTEGER, minimum: 0, maximum: 100 },
        wrinkleDepth: { type: SchemaType.INTEGER, minimum: 0, maximum: 100 },
      },
      required: ['hydration', 'oiliness', 'sensitivity'],
    },
    concerns: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      maxItems: 5,
    },
    confidence: {
      type: SchemaType.INTEGER,
      minimum: 0,
      maximum: 100,
    },
  },
  required: ['skinType', 'scores', 'confidence'],
};

export async function analyzeWithStructuredOutput(
  imageBase64: string,
  prompt: string
): Promise<SkinAnalysisResult> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: skinAnalysisSchema,
    },
  });

  const result = await model.generateContent([
    { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
    { text: prompt },
  ]);

  // 스키마가 강제되므로 항상 유효한 JSON 반환
  const response = JSON.parse(result.response.text());

  return response as SkinAnalysisResult;
}
```

### 2.2 Zod 스키마 동기화

```typescript
// lib/schemas/analysis.ts

import { z } from 'zod';

// Zod 스키마 정의
export const skinAnalysisSchema = z.object({
  skinType: z.enum(['건성', '지성', '복합성', '민감성', '정상']),
  scores: z.object({
    hydration: z.number().int().min(0).max(100),
    oiliness: z.number().int().min(0).max(100),
    sensitivity: z.number().int().min(0).max(100),
    poreVisibility: z.number().int().min(0).max(100).optional(),
    wrinkleDepth: z.number().int().min(0).max(100).optional(),
  }),
  concerns: z.array(z.string()).max(5).default([]),
  observations: z.object({
    tZone: z.string().optional(),
    uZone: z.string().optional(),
  }).optional(),
  recommendations: z.array(z.string()).max(5).default([]),
  confidence: z.number().int().min(0).max(100),
});

export type SkinAnalysisResult = z.infer<typeof skinAnalysisSchema>;

// Zod → Gemini 스키마 변환
export function zodToGeminiSchema(zodSchema: z.ZodType): any {
  // 간소화된 변환 (실제로는 더 복잡한 로직 필요)
  if (zodSchema instanceof z.ZodObject) {
    const shape = zodSchema.shape;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToGeminiSchema(value as z.ZodType);
      if (!(value as z.ZodType).isOptional()) {
        required.push(key);
      }
    }

    return {
      type: 'OBJECT',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  if (zodSchema instanceof z.ZodString) {
    return { type: 'STRING' };
  }

  if (zodSchema instanceof z.ZodNumber) {
    const checks = (zodSchema as any)._def.checks || [];
    const result: any = { type: 'NUMBER' };

    for (const check of checks) {
      if (check.kind === 'int') result.type = 'INTEGER';
      if (check.kind === 'min') result.minimum = check.value;
      if (check.kind === 'max') result.maximum = check.value;
    }

    return result;
  }

  if (zodSchema instanceof z.ZodArray) {
    return {
      type: 'ARRAY',
      items: zodToGeminiSchema(zodSchema.element),
    };
  }

  if (zodSchema instanceof z.ZodEnum) {
    return {
      type: 'STRING',
      enum: zodSchema.options,
    };
  }

  return { type: 'STRING' };
}
```

---

## 3. 응답 파싱 전략

### 3.1 다중 파싱 전략

```typescript
// lib/gemini/response-parser.ts

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  parseMethod?: string;
}

export function parseResponse<T>(
  response: string,
  schema: z.ZodSchema<T>
): ParseResult<T> {
  // 전략 1: 직접 JSON 파싱
  const directResult = tryDirectParse(response, schema);
  if (directResult.success) {
    return { ...directResult, parseMethod: 'direct' };
  }

  // 전략 2: Markdown 코드 블록 추출
  const codeBlockResult = tryCodeBlockParse(response, schema);
  if (codeBlockResult.success) {
    return { ...codeBlockResult, parseMethod: 'codeBlock' };
  }

  // 전략 3: JSON 객체 추출
  const extractResult = tryExtractJson(response, schema);
  if (extractResult.success) {
    return { ...extractResult, parseMethod: 'extract' };
  }

  // 전략 4: 부분 파싱 (가능한 필드만)
  const partialResult = tryPartialParse(response, schema);
  if (partialResult.success) {
    return { ...partialResult, parseMethod: 'partial' };
  }

  return {
    success: false,
    error: '응답을 파싱할 수 없습니다.',
  };
}

function tryDirectParse<T>(
  response: string,
  schema: z.ZodSchema<T>
): ParseResult<T> {
  try {
    const parsed = JSON.parse(response.trim());
    const validated = schema.parse(parsed);
    return { success: true, data: validated };
  } catch {
    return { success: false };
  }
}

function tryCodeBlockParse<T>(
  response: string,
  schema: z.ZodSchema<T>
): ParseResult<T> {
  // ```json ... ``` 패턴 매칭
  const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (!codeBlockMatch) {
    return { success: false };
  }

  try {
    const parsed = JSON.parse(codeBlockMatch[1].trim());
    const validated = schema.parse(parsed);
    return { success: true, data: validated };
  } catch {
    return { success: false };
  }
}

function tryExtractJson<T>(
  response: string,
  schema: z.ZodSchema<T>
): ParseResult<T> {
  // 첫 번째 { 와 마지막 } 사이 추출
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { success: false };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const validated = schema.parse(parsed);
    return { success: true, data: validated };
  } catch {
    return { success: false };
  }
}

function tryPartialParse<T>(
  response: string,
  schema: z.ZodSchema<T>
): ParseResult<T> {
  // 부분 스키마로 변환 (모든 필드 optional)
  const partialSchema = schema.partial();

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { success: false };

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = partialSchema.parse(parsed);

    // 필수 필드 확인
    const fullValidation = schema.safeParse(validated);
    if (fullValidation.success) {
      return { success: true, data: fullValidation.data };
    }

    // 부분 데이터 + 기본값으로 보완
    const withDefaults = fillDefaults(validated, schema);
    const finalValidation = schema.safeParse(withDefaults);

    if (finalValidation.success) {
      return { success: true, data: finalValidation.data };
    }

    return { success: false, error: 'Missing required fields' };
  } catch {
    return { success: false };
  }
}
```

### 3.2 기본값 보완

```typescript
// lib/gemini/defaults.ts

// 분석 유형별 기본값
export const ANALYSIS_DEFAULTS = {
  skin: {
    skinType: '복합성' as const,
    scores: {
      hydration: 50,
      oiliness: 50,
      sensitivity: 30,
      poreVisibility: 40,
      wrinkleDepth: 20,
    },
    concerns: [],
    recommendations: [],
    confidence: 0,
  },
  personalColor: {
    season: 'spring' as const,
    subSeason: 'light' as const,
    colorPalette: [],
    recommendations: [],
    confidence: 0,
  },
  body: {
    bodyType: 'rectangle' as const,
    posture: 'normal' as const,
    measurements: {},
    recommendations: [],
    confidence: 0,
  },
};

export function fillDefaults<T>(
  partial: Partial<T>,
  schema: z.ZodSchema<T>,
  analysisType: keyof typeof ANALYSIS_DEFAULTS
): T {
  const defaults = ANALYSIS_DEFAULTS[analysisType];

  return {
    ...defaults,
    ...partial,
  } as T;
}
```

---

## 4. 검증 및 정규화

### 4.1 응답 검증 파이프라인

```typescript
// lib/gemini/validation-pipeline.ts

export interface ValidationResult<T> {
  isValid: boolean;
  data: T | null;
  warnings: string[];
  errors: string[];
  normalized: boolean;
}

export async function validateAndNormalize<T>(
  rawResponse: string,
  schema: z.ZodSchema<T>,
  options: {
    allowPartial?: boolean;
    strict?: boolean;
  } = {}
): Promise<ValidationResult<T>> {
  const result: ValidationResult<T> = {
    isValid: false,
    data: null,
    warnings: [],
    errors: [],
    normalized: false,
  };

  // 1. 파싱
  const parseResult = parseResponse(rawResponse, schema);

  if (!parseResult.success) {
    result.errors.push(parseResult.error || '파싱 실패');

    if (options.allowPartial) {
      // 부분 데이터 허용 시 기본값 사용
      result.data = getDefaults(schema) as T;
      result.warnings.push('기본값이 사용되었습니다.');
      result.normalized = true;
      result.isValid = true;
    }

    return result;
  }

  result.data = parseResult.data!;
  result.isValid = true;

  // 2. 범위 정규화
  result.data = normalizeRanges(result.data);

  // 3. 논리적 일관성 검증
  const consistencyWarnings = checkConsistency(result.data);
  result.warnings.push(...consistencyWarnings);

  // 4. 비정상 값 감지
  const anomalyWarnings = detectAnomalies(result.data);
  result.warnings.push(...anomalyWarnings);

  return result;
}

// 범위 정규화 (0-100 범위 강제)
function normalizeRanges<T>(data: T): T {
  if (typeof data !== 'object' || data === null) return data;

  const normalized = { ...data };

  for (const [key, value] of Object.entries(normalized)) {
    if (typeof value === 'number') {
      // 점수 필드는 0-100 범위로 클램핑
      if (key.includes('score') || key.includes('Score') ||
          ['hydration', 'oiliness', 'sensitivity', 'confidence'].includes(key)) {
        (normalized as any)[key] = Math.max(0, Math.min(100, value));
      }
    } else if (typeof value === 'object') {
      (normalized as any)[key] = normalizeRanges(value);
    }
  }

  return normalized;
}

// 논리적 일관성 검증
function checkConsistency(data: any): string[] {
  const warnings: string[] = [];

  // 예: 피부 분석에서 건성인데 유분도가 높은 경우
  if (data.skinType === '건성' && data.scores?.oiliness > 60) {
    warnings.push('건성 피부이지만 유분도가 높게 측정되었습니다. 결과를 다시 확인해 주세요.');
  }

  // 예: 신뢰도가 낮은데 점수가 극단적인 경우
  if (data.confidence < 50) {
    const scores = Object.values(data.scores || {}) as number[];
    const hasExtreme = scores.some(s => s > 90 || s < 10);
    if (hasExtreme) {
      warnings.push('신뢰도가 낮지만 극단적인 점수가 있습니다. 재분석을 권장합니다.');
    }
  }

  return warnings;
}

// 비정상 값 감지
function detectAnomalies(data: any): string[] {
  const warnings: string[] = [];

  // 모든 점수가 동일한 경우 (AI 오류 가능성)
  if (data.scores) {
    const scores = Object.values(data.scores) as number[];
    const uniqueScores = new Set(scores);
    if (uniqueScores.size === 1 && scores.length > 3) {
      warnings.push('모든 점수가 동일합니다. 분석 오류일 수 있습니다.');
    }
  }

  return warnings;
}
```

---

## 5. 에러 처리

### 5.1 파싱 에러 유형

```typescript
// lib/gemini/errors.ts

export enum ParseErrorType {
  INVALID_JSON = 'INVALID_JSON',
  SCHEMA_MISMATCH = 'SCHEMA_MISMATCH',
  MISSING_REQUIRED = 'MISSING_REQUIRED',
  TYPE_MISMATCH = 'TYPE_MISMATCH',
  RANGE_VIOLATION = 'RANGE_VIOLATION',
  EMPTY_RESPONSE = 'EMPTY_RESPONSE',
}

export class ParseError extends Error {
  constructor(
    public type: ParseErrorType,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

export function handleParseError(
  error: ParseError,
  analysisType: string
): {
  userMessage: string;
  action: 'retry' | 'fallback' | 'manual';
} {
  switch (error.type) {
    case ParseErrorType.EMPTY_RESPONSE:
    case ParseErrorType.INVALID_JSON:
      return {
        userMessage: 'AI 응답 처리 중 문제가 발생했습니다. 다시 시도합니다.',
        action: 'retry',
      };

    case ParseErrorType.SCHEMA_MISMATCH:
    case ParseErrorType.MISSING_REQUIRED:
      return {
        userMessage: '분석 결과가 불완전합니다. 기본값으로 대체합니다.',
        action: 'fallback',
      };

    case ParseErrorType.TYPE_MISMATCH:
    case ParseErrorType.RANGE_VIOLATION:
      return {
        userMessage: '분석 결과를 정규화했습니다.',
        action: 'fallback',
      };

    default:
      return {
        userMessage: '알 수 없는 오류가 발생했습니다.',
        action: 'manual',
      };
  }
}
```

---

## 6. 모니터링

### 6.1 파싱 성공률 추적

```typescript
// lib/analytics/parsing-metrics.ts

export interface ParsingMetrics {
  timestamp: Date;
  analysisType: string;
  parseMethod: string;
  success: boolean;
  errorType?: string;
  normalized: boolean;
  responseLength: number;
}

export async function trackParsingMetrics(metrics: ParsingMetrics): Promise<void> {
  await supabase.from('parsing_metrics').insert(metrics);
}

export async function getParsingSuccessRate(
  analysisType: string,
  days: number = 7
): Promise<{
  successRate: number;
  byMethod: Record<string, number>;
  commonErrors: Array<{ type: string; count: number }>;
}> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const { data } = await supabase
    .from('parsing_metrics')
    .select('*')
    .eq('analysis_type', analysisType)
    .gte('timestamp', startDate.toISOString());

  const total = data?.length || 0;
  const successful = data?.filter(d => d.success).length || 0;

  // 메서드별 성공률
  const byMethod: Record<string, number> = {};
  data?.forEach(d => {
    if (!byMethod[d.parse_method]) {
      byMethod[d.parse_method] = 0;
    }
    if (d.success) {
      byMethod[d.parse_method]++;
    }
  });

  // 일반적인 에러
  const errorCounts: Record<string, number> = {};
  data?.filter(d => !d.success).forEach(d => {
    errorCounts[d.error_type || 'unknown'] =
      (errorCounts[d.error_type || 'unknown'] || 0) + 1;
  });

  const commonErrors = Object.entries(errorCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    successRate: total > 0 ? successful / total : 0,
    byMethod,
    commonErrors,
  };
}
```

---

## 7. 구현 체크리스트

### P0 (Critical)

- [ ] Zod 스키마 정의
- [ ] 다중 파싱 전략
- [ ] 기본값 보완

### P1 (High)

- [ ] Gemini Structured Output 연동
- [ ] 범위 정규화
- [ ] 파싱 에러 처리

### P2 (Medium)

- [ ] 논리적 일관성 검증
- [ ] 파싱 성공률 모니터링
- [ ] 에러 유형별 대응

---

## 8. 참고 자료

- [Agenta Structured Outputs Guide](https://agenta.ai/blog/the-guide-to-structured-outputs-and-function-calling-with-llms)
- [vLLM Structured Outputs](https://developers.redhat.com/articles/2025/06/03/structured-outputs-vllm-guiding-ai-responses)
- [Structured Output AI Reliability](https://www.cognitivetoday.com/2025/10/structured-output-ai-reliability/)
- [JSON Schema Enforcement](https://modelmetry.com/blog/how-to-ensure-llm-output-adheres-to-a-json-schema)

---

**Version**: 1.0
**Created**: 2026-01-19
**Category**: AI/ML 심화 (5/8)
