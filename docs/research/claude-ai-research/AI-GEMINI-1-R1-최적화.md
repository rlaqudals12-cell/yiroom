# Gemini 3 Flash 최적화

> **ID**: AI-GEMINI-OPT
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/gemini.ts

---

## 1. 현재 구현 분석

### 현재 상태

```typescript
// apps/web/lib/gemini.ts
// 현재 구현된 기능:

✅ Gemini 3 Flash 모델 사용
✅ 이미지 분석 (피부, 퍼스널컬러, 체형 등)
✅ 구조화된 JSON 응답 (Zod 스키마)
✅ 기본 에러 핸들링
✅ 분석 타입별 프롬프트 분리

// 개선 필요 항목:
❌ 토큰 최적화
❌ 응답 시간 최적화
❌ 비용 최적화
❌ 캐싱 전략
❌ 병렬 처리
❌ 폴백 전략
```

---

## 2. 모델 선택 가이드

### 2.1 Gemini 모델 비교 (2026)

| 모델 | 속도 | 비용 | 품질 | 추천 용도 |
|------|------|------|------|----------|
| **Gemini 3 Flash** | 매우 빠름 | 저렴 | 좋음 | 실시간 분석 (현재 사용) |
| **Gemini 3 Pro** | 보통 | 중간 | 매우 좋음 | 복잡한 분석 |
| **Gemini 3 Ultra** | 느림 | 비쌈 | 최고 | 정밀 진단급 |

### 2.2 이룸 모듈별 권장

```typescript
// lib/gemini/model-selector.ts
export const MODEL_BY_ANALYSIS = {
  // 실시간 피드백 필요 - Flash
  'personal-color': 'gemini-3-flash',
  'makeup': 'gemini-3-flash',
  'hair': 'gemini-3-flash',

  // 정밀도 중요 - Pro (향후)
  'skin': 'gemini-3-flash', // 현재 Flash, 추후 Pro 전환 고려
  'body': 'gemini-3-flash',
  'posture': 'gemini-3-flash',

  // 복합 분석 - Pro
  'comprehensive': 'gemini-3-pro',
} as const;
```

---

## 3. 프롬프트 최적화

### 3.1 토큰 절약 원칙

```typescript
// ❌ 비효율적: 장황한 프롬프트
const badPrompt = `
당신은 전문적인 피부 분석가입니다. 사용자가 제공한 이미지를
분석하여 피부 타입, 피부 상태, 그리고 개선을 위한 추천 사항을
상세하게 제공해주세요. 다음 항목들을 포함해주세요:
1. 피부 타입 (건성, 지성, 복합성, 민감성 중 하나)
2. 수분도 점수 (0-100)
3. 유분도 점수 (0-100)
...
`;

// ✅ 효율적: 간결한 구조화 프롬프트
const goodPrompt = `
Analyze the facial skin image.
Output JSON only:
{
  "skinType": "dry"|"oily"|"combination"|"sensitive",
  "hydration": 0-100,
  "oiliness": 0-100,
  "sensitivity": 0-100,
  "concerns": ["wrinkles"|"acne"|"pigmentation"|"pores"],
  "recommendations": [max 3 items]
}
`;
```

### 3.2 시스템 프롬프트 최적화

```typescript
// lib/gemini/prompts/system.ts
export const SYSTEM_PROMPTS = {
  // 공통 베이스 (짧게)
  base: 'Expert beauty AI. Respond JSON only. Korean for text values.',

  // 분석별 특화 (짧게)
  skin: 'Focus: skin type, hydration, concerns, Korean skincare tips.',
  personalColor: 'Focus: undertone, season type, best colors.',
  body: 'Focus: proportions, body type, Korean fashion fit.',
};
```

### 3.3 Few-Shot 예시 최소화

```typescript
// ❌ 비효율적: 너무 많은 예시
const badFewShot = [
  { input: '...', output: '...' },
  { input: '...', output: '...' },
  { input: '...', output: '...' },
  // 토큰 낭비
];

// ✅ 효율적: 1-2개 핵심 예시만
const goodFewShot = [
  {
    role: 'user',
    parts: [{ text: 'Example: combination skin with T-zone oiliness' }],
  },
  {
    role: 'model',
    parts: [{
      text: JSON.stringify({
        skinType: 'combination',
        hydration: 55,
        oiliness: 70,
        concerns: ['pores', 'oiliness'],
      }),
    }],
  },
];
```

---

## 4. 응답 시간 최적화

### 4.1 이미지 전처리

```typescript
// lib/gemini/image-preprocessing.ts
export async function preprocessImage(
  base64: string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<string> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.85,
  } = options;

  // Canvas로 리사이징
  const img = await loadImage(base64);
  const scale = Math.min(
    maxWidth / img.width,
    maxHeight / img.height,
    1 // 원본보다 커지지 않게
  );

  const canvas = document.createElement('canvas');
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', quality);
}

// 분석 타입별 이미지 설정
export const IMAGE_SETTINGS = {
  'personal-color': { maxWidth: 512, maxHeight: 512, quality: 0.9 },
  'skin': { maxWidth: 1024, maxHeight: 1024, quality: 0.9 },
  'body': { maxWidth: 768, maxHeight: 1024, quality: 0.85 },
  'posture': { maxWidth: 768, maxHeight: 1024, quality: 0.85 },
};
```

### 4.2 스트리밍 응답

```typescript
// lib/gemini/streaming.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function* streamAnalysis(
  imageBase64: string,
  analysisType: string
): AsyncGenerator<string> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash' });

  const result = await model.generateContentStream([
    { text: getPromptForType(analysisType) },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
      },
    },
  ]);

  for await (const chunk of result.stream) {
    yield chunk.text();
  }
}

// 클라이언트에서 사용
async function handleStreamingAnalysis() {
  const response = await fetch('/api/analyze/skin/stream', {
    method: 'POST',
    body: JSON.stringify({ imageBase64 }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    // 부분 결과 표시
    updatePartialResult(text);
  }
}
```

### 4.3 타임아웃 및 재시도

```typescript
// lib/gemini/with-retry.ts
interface RetryOptions {
  maxRetries?: number;
  timeout?: number;
  backoff?: 'linear' | 'exponential';
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 2, timeout = 10000, backoff = 'exponential' } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('Request timeout'));
          });
        }),
      ]);

      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = backoff === 'exponential'
          ? 1000 * Math.pow(2, attempt)
          : 1000 * (attempt + 1);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
```

---

## 5. 비용 최적화

### 5.1 토큰 사용량 추적

```typescript
// lib/gemini/usage-tracker.ts
interface UsageRecord {
  userId: string;
  analysisType: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: Date;
}

export async function trackUsage(
  userId: string,
  analysisType: string,
  response: GenerateContentResult
) {
  const usage = response.response.usageMetadata;

  const record: UsageRecord = {
    userId,
    analysisType,
    inputTokens: usage?.promptTokenCount ?? 0,
    outputTokens: usage?.candidatesTokenCount ?? 0,
    cost: calculateCost(usage),
    timestamp: new Date(),
  };

  // Supabase에 저장
  await supabase.from('ai_usage_logs').insert(record);

  return record;
}

function calculateCost(usage: UsageMetadata | undefined): number {
  if (!usage) return 0;

  // Gemini 3 Flash 가격 (예시)
  const inputCostPer1k = 0.00025; // $0.00025 per 1K input tokens
  const outputCostPer1k = 0.0005; // $0.0005 per 1K output tokens

  return (
    (usage.promptTokenCount / 1000) * inputCostPer1k +
    (usage.candidatesTokenCount / 1000) * outputCostPer1k
  );
}
```

### 5.2 캐싱 전략

```typescript
// lib/gemini/cache.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// 이미지 해시 기반 캐싱
export async function getCachedAnalysis(
  imageHash: string,
  analysisType: string
): Promise<AnalysisResult | null> {
  const cacheKey = `analysis:${analysisType}:${imageHash}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached as string);
  }

  return null;
}

export async function setCachedAnalysis(
  imageHash: string,
  analysisType: string,
  result: AnalysisResult,
  ttlSeconds: number = 86400 // 24시간
): Promise<void> {
  const cacheKey = `analysis:${analysisType}:${imageHash}`;
  await redis.set(cacheKey, JSON.stringify(result), { ex: ttlSeconds });
}

// 이미지 해시 생성
export async function hashImage(base64: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(base64);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### 5.3 배치 처리

```typescript
// lib/gemini/batch.ts
export async function batchAnalyze(
  images: string[],
  analysisType: string,
  concurrency: number = 3
): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];

  // 청크로 분할
  for (let i = 0; i < images.length; i += concurrency) {
    const chunk = images.slice(i, i + concurrency);

    // 병렬 처리
    const chunkResults = await Promise.all(
      chunk.map(image => analyzeSingle(image, analysisType))
    );

    results.push(...chunkResults);

    // Rate limit 방지
    if (i + concurrency < images.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}
```

---

## 6. 품질 향상

### 6.1 응답 검증

```typescript
// lib/gemini/validation.ts
import { z } from 'zod';

const SkinAnalysisSchema = z.object({
  skinType: z.enum(['dry', 'oily', 'combination', 'sensitive', 'normal']),
  hydration: z.number().min(0).max(100),
  oiliness: z.number().min(0).max(100),
  sensitivity: z.number().min(0).max(100),
  concerns: z.array(z.string()).max(5),
  recommendations: z.array(z.string()).max(3),
  confidence: z.number().min(0).max(100).optional(),
});

export async function validateAndParse<T>(
  response: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  // JSON 추출 (마크다운 코드블록 처리)
  const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                    response.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  const parsed = JSON.parse(jsonStr);

  return schema.parse(parsed);
}
```

### 6.2 신뢰도 점수

```typescript
// lib/gemini/confidence.ts
export interface AnalysisWithConfidence<T> {
  result: T;
  confidence: number;
  factors: {
    imageQuality: number;
    lightingCondition: number;
    facialClarity: number;
  };
}

export async function analyzeWithConfidence(
  imageBase64: string,
  analysisType: string
): Promise<AnalysisWithConfidence<unknown>> {
  // 이미지 품질 사전 평가
  const imageQuality = await assessImageQuality(imageBase64);

  // 분석 실행
  const result = await analyze(imageBase64, analysisType);

  // 신뢰도 계산
  const confidence = calculateConfidence(imageQuality, result);

  return {
    result,
    confidence,
    factors: imageQuality,
  };
}

function calculateConfidence(
  quality: ImageQuality,
  result: AnalysisResult
): number {
  // 가중 평균
  const weights = {
    imageQuality: 0.3,
    lightingCondition: 0.3,
    facialClarity: 0.2,
    resultConsistency: 0.2,
  };

  return Math.round(
    quality.sharpness * weights.imageQuality +
    quality.lighting * weights.lightingCondition +
    quality.faceDetection * weights.facialClarity +
    (result.confidence ?? 80) * weights.resultConsistency
  );
}
```

---

## 7. 폴백 전략

### 7.1 3단계 폴백

```typescript
// lib/gemini/fallback.ts
export async function analyzeWithFallback(
  imageBase64: string,
  analysisType: string
): Promise<{ result: AnalysisResult; source: 'ai' | 'fallback' | 'error' }> {
  // 1단계: 정상 분석
  try {
    const result = await withRetry(
      () => analyze(imageBase64, analysisType),
      { maxRetries: 2, timeout: 10000 }
    );

    return { result, source: 'ai' };
  } catch (error) {
    console.error('[Gemini] Primary analysis failed:', error);
  }

  // 2단계: 캐시된 유사 결과
  try {
    const cached = await findSimilarCachedResult(imageBase64, analysisType);
    if (cached) {
      return { result: { ...cached, isCached: true }, source: 'fallback' };
    }
  } catch (error) {
    console.error('[Gemini] Cache fallback failed:', error);
  }

  // 3단계: Mock 데이터
  const mock = generateMockResult(analysisType);
  return { result: { ...mock, isMock: true }, source: 'error' };
}
```

### 7.2 Feature Flag 연동

```typescript
// lib/gemini/feature-flags.ts
import { isFeatureEnabled } from '@/lib/feature-flags/server';

export async function shouldUseFallback(): Promise<boolean> {
  // AI 분석 비활성화 플래그
  const aiEnabled = await isFeatureEnabled('enableAIAnalysis');
  if (!aiEnabled) return true;

  // Mock 폴백 허용 플래그
  const allowFallback = await isFeatureEnabled('allowMockFallback');
  return allowFallback;
}
```

---

## 8. 모니터링

### 8.1 메트릭 수집

```typescript
// lib/gemini/metrics.ts
interface GeminiMetrics {
  analysisType: string;
  duration: number;
  tokens: { input: number; output: number };
  success: boolean;
  error?: string;
  confidence?: number;
}

export async function recordMetrics(metrics: GeminiMetrics) {
  // Vercel Analytics / Sentry로 전송
  console.log('[Gemini Metrics]', metrics);

  // Supabase에도 저장 (분석용)
  await supabase.from('ai_metrics').insert({
    ...metrics,
    created_at: new Date().toISOString(),
  });
}

// 사용 래퍼
export async function analyzeWithMetrics(
  imageBase64: string,
  analysisType: string
): Promise<AnalysisResult> {
  const start = Date.now();
  let metrics: Partial<GeminiMetrics> = { analysisType };

  try {
    const result = await analyze(imageBase64, analysisType);
    metrics = {
      ...metrics,
      duration: Date.now() - start,
      success: true,
      confidence: result.confidence,
    };
    return result;
  } catch (error) {
    metrics = {
      ...metrics,
      duration: Date.now() - start,
      success: false,
      error: (error as Error).message,
    };
    throw error;
  } finally {
    await recordMetrics(metrics as GeminiMetrics);
  }
}
```

---

## 9. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] 이미지 전처리 (리사이징)
- [ ] 프롬프트 최적화 (토큰 절약)
- [ ] 타임아웃 + 재시도 로직
- [ ] 응답 검증 (Zod)

### 단기 적용 (P1)

- [ ] 캐싱 구현 (Redis)
- [ ] 토큰 사용량 추적
- [ ] 신뢰도 점수 계산
- [ ] 폴백 전략 구현

### 장기 적용 (P2)

- [ ] 스트리밍 응답
- [ ] 배치 처리
- [ ] 비용 대시보드
- [ ] A/B 테스트 (모델별)

---

## 10. 참고 자료

- [Google AI SDK Docs](https://ai.google.dev/docs)
- [Gemini API Reference](https://ai.google.dev/api/rest/v1beta/models)
- [Prompt Engineering Guide](https://ai.google.dev/docs/prompt_best_practices)
- [Vision API Best Practices](https://ai.google.dev/docs/vision_quickstart)

---

**Version**: 1.0 | **Priority**: P0 Critical
