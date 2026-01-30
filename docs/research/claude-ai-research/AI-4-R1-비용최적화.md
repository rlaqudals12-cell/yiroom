# AI-4: LLM 비용 최적화

> AI/ML 심화 4/8 - 토큰 사용량 절감 및 캐싱 전략

---

## 1. 연구 개요

### 1.1 비용 최적화의 중요성

연구에 따르면 전략적 LLM 비용 최적화로 **최대 80-98% 비용 절감**이 가능하다.
이룸 앱에서 Gemini API 호출 비용을 최적화하면 운영 비용을 크게 줄일 수 있다.

### 1.2 비용 구조

| 항목 | Gemini 3 Flash | 비고 |
|------|---------------|------|
| 입력 토큰 | $0.075/1M | 텍스트 |
| 출력 토큰 | $0.30/1M | 텍스트 |
| 이미지 입력 | $0.0625/1K 토큰 | 1024x1024 ≈ 4K 토큰 |

---

## 2. 캐싱 전략

### 2.1 Prefix Caching (Provider-Level)

```typescript
// Anthropic: 90% 비용 절감, 85% 지연 감소
// OpenAI: 자동 활성화, 50% 비용 절감

// Gemini Context Caching 예시
// lib/gemini/caching.ts

import { GoogleGenerativeAI, CachedContent } from '@google/generative-ai';

export async function analyzeWithContextCache(
  systemPrompt: string,
  userInput: string,
  imageBase64: string
): Promise<AnalysisResult> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

  // 시스템 프롬프트 캐싱 (5분간 유효)
  const cachedContent: CachedContent = await genAI.cacheContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
    ],
    ttl: 300, // 5분
  });

  // 캐시된 컨텍스트로 모델 생성
  const model = genAI.getGenerativeModelFromCachedContent(cachedContent);

  // 분석 실행 (시스템 프롬프트 토큰 절약)
  const result = await model.generateContent([
    { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
    { text: userInput },
  ]);

  return parseResult(result);
}
```

### 2.2 Semantic Caching

```typescript
// lib/cache/semantic-cache.ts

import { createClient } from '@upstash/redis';
import { embed } from '@/lib/embeddings';

interface SemanticCacheConfig {
  similarityThreshold: number;  // 0.85-0.95 권장
  ttlSeconds: number;
  maxEntries: number;
}

const DEFAULT_CONFIG: SemanticCacheConfig = {
  similarityThreshold: 0.9,
  ttlSeconds: 3600,  // 1시간
  maxEntries: 1000,
};

export class SemanticCache {
  private redis = createClient();

  constructor(private config = DEFAULT_CONFIG) {}

  async get(query: string): Promise<CacheHit | null> {
    // 쿼리 임베딩 생성
    const queryEmbedding = await embed(query);

    // 유사한 캐시 검색
    const results = await this.redis.call(
      'FT.SEARCH',
      'cache_idx',
      `*=>[KNN 5 @embedding $vec AS score]`,
      'PARAMS', '2', 'vec', Buffer.from(new Float32Array(queryEmbedding).buffer),
      'SORTBY', 'score', 'ASC',
      'LIMIT', '0', '1'
    ) as any[];

    if (results.length > 1) {
      const topResult = results[1];
      const score = parseFloat(topResult.score);

      // 유사도 임계값 확인
      if (score >= this.config.similarityThreshold) {
        console.log(`[SemanticCache] Hit with similarity ${score.toFixed(3)}`);
        return {
          value: topResult.value,
          similarity: score,
          cached: true,
        };
      }
    }

    return null;
  }

  async set(query: string, value: any): Promise<void> {
    const embedding = await embed(query);
    const key = `cache:${hashQuery(query)}`;

    await this.redis.hset(key, {
      query,
      value: JSON.stringify(value),
      embedding: Buffer.from(new Float32Array(embedding).buffer),
      createdAt: Date.now(),
    });

    await this.redis.expire(key, this.config.ttlSeconds);
  }
}

// 사용 예시
export async function analyzeWithSemanticCache(
  analysisType: string,
  input: AnalysisInput
): Promise<AnalysisResult> {
  const cache = new SemanticCache();
  const cacheKey = `${analysisType}:${input.prompt}`;

  // 캐시 확인
  const cached = await cache.get(cacheKey);
  if (cached) {
    return {
      ...cached.value,
      _fromCache: true,
      _cacheSimilarity: cached.similarity,
    };
  }

  // API 호출
  const result = await callGeminiAPI(input);

  // 캐시 저장
  await cache.set(cacheKey, result);

  return result;
}
```

### 2.3 응답 캐싱 (분석별)

```typescript
// lib/cache/analysis-cache.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

export interface AnalysisCacheEntry {
  inputHash: string;
  analysisType: string;
  result: any;
  tokensUsed: number;
  createdAt: Date;
  expiresAt: Date;
}

// 이미지 해시 생성 (중복 분석 방지)
export function hashImage(imageBase64: string): string {
  return createHash('sha256')
    .update(imageBase64.slice(0, 10000)) // 앞부분만 해시
    .digest('hex')
    .slice(0, 16);
}

export async function getOrAnalyze(
  supabase: SupabaseClient,
  userId: string,
  analysisType: string,
  imageBase64: string,
  analyzeFn: () => Promise<AnalysisResult>
): Promise<{ result: AnalysisResult; fromCache: boolean; tokensSaved?: number }> {
  const inputHash = hashImage(imageBase64);

  // 1. 캐시 확인 (동일 이미지, 24시간 이내)
  const { data: cached } = await supabase
    .from('analysis_cache')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('analysis_type', analysisType)
    .eq('input_hash', inputHash)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (cached) {
    console.log(`[Cache] Hit for ${analysisType}, saved ~${cached.tokens_used} tokens`);
    return {
      result: cached.result,
      fromCache: true,
      tokensSaved: cached.tokens_used,
    };
  }

  // 2. 새로운 분석 실행
  const result = await analyzeFn();

  // 3. 캐시 저장
  const tokensUsed = estimateTokensUsed(imageBase64, result);

  await supabase.from('analysis_cache').upsert({
    clerk_user_id: userId,
    analysis_type: analysisType,
    input_hash: inputHash,
    result,
    tokens_used: tokensUsed,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  return { result, fromCache: false };
}
```

---

## 3. 토큰 절감 기법

### 3.1 프롬프트 최적화

```typescript
// lib/gemini/prompts/optimization.ts

// 연구: 프롬프트 최적화로 최대 35% 토큰 절감

export function optimizePrompt(prompt: string): string {
  return prompt
    // 1. 불필요한 공백 제거
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')

    // 2. 장황한 표현 축약
    .replace(/in order to/gi, 'to')
    .replace(/as well as/gi, 'and')
    .replace(/due to the fact that/gi, 'because')
    .replace(/for the purpose of/gi, 'for')

    // 3. 불필요한 예의 표현 제거
    .replace(/please|kindly|if you could|if possible/gi, '')

    // 4. 반복 지시 제거
    .replace(/(remember to|make sure to|be sure to)/gi, '')

    .trim();
}

// 토큰 수 추정
export function estimateTokens(text: string): number {
  // 대략적 추정
  // 영어: 4자 = 1토큰
  // 한국어: 2자 = 1토큰
  const koreanChars = (text.match(/[가-힣]/g) || []).length;
  const otherChars = text.length - koreanChars;

  return Math.ceil(koreanChars / 2 + otherChars / 4);
}

// 프롬프트 버전별 토큰 비교
export function comparePromptVersions(
  original: string,
  optimized: string
): { originalTokens: number; optimizedTokens: number; savings: number } {
  const originalTokens = estimateTokens(original);
  const optimizedTokens = estimateTokens(optimized);
  const savings = ((originalTokens - optimizedTokens) / originalTokens) * 100;

  return { originalTokens, optimizedTokens, savings };
}
```

### 3.2 이미지 최적화

```typescript
// lib/image/optimize-for-ai.ts

export interface ImageOptimizationConfig {
  maxSize: number;        // 최대 픽셀 크기
  quality: number;        // 압축 품질 (0-1)
  format: 'jpeg' | 'webp';
}

// 분석 유형별 최적 설정
export const ANALYSIS_IMAGE_CONFIG: Record<string, ImageOptimizationConfig> = {
  skin: {
    maxSize: 768,    // 768x768 ≈ 2.3K 토큰 (1024x1024의 57%)
    quality: 0.85,
    format: 'jpeg',
  },
  personalColor: {
    maxSize: 512,    // 색상 분석은 낮은 해상도로 충분
    quality: 0.9,
    format: 'jpeg',
  },
  body: {
    maxSize: 1024,   // 전신 분석은 더 높은 해상도 필요
    quality: 0.85,
    format: 'jpeg',
  },
  posture: {
    maxSize: 768,
    quality: 0.85,
    format: 'jpeg',
  },
};

export async function optimizeImageForAnalysis(
  imageBlob: Blob,
  analysisType: string
): Promise<{ optimized: Blob; tokensSaved: number }> {
  const config = ANALYSIS_IMAGE_CONFIG[analysisType] || ANALYSIS_IMAGE_CONFIG.skin;

  const img = await createImageBitmap(imageBlob);
  const originalTokens = estimateImageTokens(img.width, img.height);

  // 리사이즈 필요 여부 확인
  const maxDimension = Math.max(img.width, img.height);
  const scale = maxDimension > config.maxSize
    ? config.maxSize / maxDimension
    : 1;

  const newWidth = Math.round(img.width * scale);
  const newHeight = Math.round(img.height * scale);

  // Canvas로 리사이즈
  const canvas = new OffscreenCanvas(newWidth, newHeight);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, newWidth, newHeight);

  // Blob으로 변환
  const optimized = await canvas.convertToBlob({
    type: `image/${config.format}`,
    quality: config.quality,
  });

  const optimizedTokens = estimateImageTokens(newWidth, newHeight);
  const tokensSaved = originalTokens - optimizedTokens;

  console.log(`[ImageOptimize] ${originalTokens} → ${optimizedTokens} tokens (saved ${tokensSaved})`);

  return { optimized, tokensSaved };
}

// 이미지 토큰 추정 (ViT 기준: 16x16 패치)
function estimateImageTokens(width: number, height: number): number {
  const patchSize = 16;
  const patches = Math.ceil(width / patchSize) * Math.ceil(height / patchSize);
  return patches;
}
```

### 3.3 모델 라우팅 (Cascade)

```typescript
// lib/ai/model-router.ts

// 연구: 적절한 라우팅으로 87% 비용 절감 가능

export interface ModelConfig {
  id: string;
  costPerMToken: number;  // $ per million tokens
  capability: 'basic' | 'standard' | 'advanced';
}

export const MODELS: ModelConfig[] = [
  { id: 'gemini-2.0-flash', costPerMToken: 0.075, capability: 'standard' },
  { id: 'gemini-2.0-pro', costPerMToken: 1.25, capability: 'advanced' },
];

export type QueryComplexity = 'simple' | 'standard' | 'complex';

// 쿼리 복잡도 분류
export function classifyQueryComplexity(
  analysisType: string,
  context: AnalysisContext
): QueryComplexity {
  // 간단한 분석: 기본 모델로 충분
  if (analysisType === 'personalColor' && context.imageQuality > 80) {
    return 'simple';
  }

  // 복잡한 분석: 고급 모델 필요
  if (
    analysisType === 'skin' &&
    context.concerns.length > 3
  ) {
    return 'complex';
  }

  return 'standard';
}

// 복잡도 기반 모델 선택
export function selectModel(complexity: QueryComplexity): ModelConfig {
  switch (complexity) {
    case 'simple':
    case 'standard':
      return MODELS.find(m => m.capability === 'standard')!;
    case 'complex':
      return MODELS.find(m => m.capability === 'advanced')!;
  }
}

// 사용 예시
export async function routeAnalysis(
  analysisType: string,
  input: AnalysisInput
): Promise<{ result: AnalysisResult; model: string; cost: number }> {
  const complexity = classifyQueryComplexity(analysisType, input.context);
  const model = selectModel(complexity);

  console.log(`[Router] Using ${model.id} for ${complexity} query`);

  const result = await callModel(model.id, input);
  const tokensUsed = result.tokensUsed;
  const cost = (tokensUsed / 1_000_000) * model.costPerMToken;

  return { result: result.data, model: model.id, cost };
}
```

---

## 4. 비용 모니터링

### 4.1 토큰 사용량 추적

```typescript
// lib/analytics/token-tracking.ts

export interface TokenUsage {
  timestamp: Date;
  analysisType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  imageTokens: number;
  totalTokens: number;
  costUSD: number;
  cached: boolean;
  userId?: string;
}

export async function trackTokenUsage(usage: TokenUsage): Promise<void> {
  // Supabase에 저장
  await supabase.from('token_usage').insert(usage);

  // 일일 예산 확인
  await checkDailyBudget();
}

async function checkDailyBudget(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('token_usage')
    .select('cost_usd')
    .gte('timestamp', today);

  const totalCost = data?.reduce((sum, row) => sum + row.cost_usd, 0) || 0;
  const dailyBudget = parseFloat(process.env.DAILY_AI_BUDGET || '100');

  if (totalCost > dailyBudget * 0.8) {
    console.warn(`[Budget] 80% of daily budget used: $${totalCost.toFixed(2)}/$${dailyBudget}`);
    // 알림 전송
  }

  if (totalCost > dailyBudget) {
    console.error(`[Budget] Daily budget exceeded: $${totalCost.toFixed(2)}/$${dailyBudget}`);
    // 서비스 제한 또는 알림
  }
}
```

### 4.2 비용 대시보드 데이터

```typescript
// lib/analytics/cost-dashboard.ts

export interface CostSummary {
  period: 'day' | 'week' | 'month';
  totalCost: number;
  byAnalysisType: Record<string, number>;
  byModel: Record<string, number>;
  cacheHitRate: number;
  tokensSaved: number;
  costSaved: number;
}

export async function getCostSummary(
  period: 'day' | 'week' | 'month'
): Promise<CostSummary> {
  const startDate = getStartDate(period);

  const { data } = await supabase
    .from('token_usage')
    .select('*')
    .gte('timestamp', startDate.toISOString());

  const totalCost = data?.reduce((sum, row) => sum + row.cost_usd, 0) || 0;

  // 분석 유형별
  const byAnalysisType: Record<string, number> = {};
  data?.forEach(row => {
    byAnalysisType[row.analysis_type] =
      (byAnalysisType[row.analysis_type] || 0) + row.cost_usd;
  });

  // 모델별
  const byModel: Record<string, number> = {};
  data?.forEach(row => {
    byModel[row.model] = (byModel[row.model] || 0) + row.cost_usd;
  });

  // 캐시 히트율
  const cachedCount = data?.filter(row => row.cached).length || 0;
  const cacheHitRate = data?.length ? cachedCount / data.length : 0;

  // 절약량 (캐시로 인한)
  const tokensSaved = data?.reduce(
    (sum, row) => sum + (row.cached ? row.total_tokens : 0), 0
  ) || 0;

  return {
    period,
    totalCost,
    byAnalysisType,
    byModel,
    cacheHitRate,
    tokensSaved,
    costSaved: (tokensSaved / 1_000_000) * 0.15, // 평균 비용으로 추정
  };
}
```

---

## 5. 구현 체크리스트

### P0 (Critical)

- [ ] 이미지 해상도 최적화
- [ ] 동일 이미지 캐싱
- [ ] 토큰 사용량 로깅

### P1 (High)

- [ ] 프롬프트 최적화
- [ ] 일일 예산 모니터링
- [ ] 캐시 히트율 추적

### P2 (Medium)

- [ ] Semantic 캐싱
- [ ] 모델 라우팅 (복잡도 기반)
- [ ] 비용 대시보드

---

## 6. 참고 자료

- [LLM Cost Optimization: 80% Reduction](https://ai.koombea.com/blog/llm-cost-optimization)
- [Token Optimization Strategies](https://www.glukhov.org/post/2025/11/cost-effective-llm-applications/)
- [Context Caching Guide](https://phase2online.com/2025/04/28/optimizing-llm-costs-with-context-caching/)
- [Prompt Caching Infrastructure](https://introl.com/blog/prompt-caching-infrastructure-llm-cost-latency-reduction-guide-2025)

---

**Version**: 1.0
**Created**: 2026-01-19
**Category**: AI/ML 심화 (4/8)
