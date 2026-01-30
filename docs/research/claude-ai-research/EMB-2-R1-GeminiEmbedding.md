# Gemini Embedding API

> **ID**: EMB-2
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/rag/

---

## 1. Gemini Embedding 개요

### 1.1 모델 변경 사항 (2026)

```
⚠️ 중요: text-embedding-004 폐기됨 (2026.01.14)

마이그레이션 필요:
  text-embedding-004 → gemini-embedding-001
```

### 1.2 모델 비교

| 속성 | text-embedding-004 | gemini-embedding-001 |
|------|-------------------|---------------------|
| 상태 | ❌ 폐기됨 | ✅ 현재 |
| 차원 | 768 | 3072 (조절 가능) |
| 최대 토큰 | 2048 | 2048 |
| 언어 | 다국어 | 100+ 언어 |
| MRL | ❌ | ✅ (768, 1536, 3072) |
| 가격 | 무료 | 무료 |

### 1.3 성능 순위

```
MTEB Multilingual Leaderboard:
  gemini-embedding-001: #1 (2025.12 기준)
```

---

## 2. API 사용법

### 2.1 기본 사용

```typescript
// lib/rag/gemini-embeddings.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY!
);

export async function createGeminiEmbedding(
  text: string,
  outputDimensionality: number = 3072
): Promise<number[]> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-embedding-001',
  });

  const result = await model.embedContent({
    content: { parts: [{ text }] },
    outputDimensionality, // 768, 1536, 3072
  });

  return result.embedding.values;
}
```

### 2.2 배치 처리

```typescript
// 다중 텍스트 배치 임베딩
export async function createGeminiBatchEmbeddings(
  texts: string[],
  outputDimensionality: number = 1536
): Promise<number[][]> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-embedding-001',
  });

  // Gemini는 batchEmbedContents 지원
  const result = await model.batchEmbedContents({
    requests: texts.map(text => ({
      content: { parts: [{ text }] },
      outputDimensionality,
    })),
  });

  return result.embeddings.map(e => e.values);
}
```

### 2.3 Task Type 지정

```typescript
// 태스크 유형에 따른 최적화
type TaskType =
  | 'RETRIEVAL_QUERY'      // 검색 쿼리
  | 'RETRIEVAL_DOCUMENT'   // 문서 인덱싱
  | 'SEMANTIC_SIMILARITY'  // 유사도 계산
  | 'CLASSIFICATION'       // 분류
  | 'CLUSTERING';          // 클러스터링

export async function createTaskSpecificEmbedding(
  text: string,
  taskType: TaskType,
  title?: string
): Promise<number[]> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-embedding-001',
  });

  const request: any = {
    content: { parts: [{ text }] },
    taskType,
  };

  // 문서 임베딩 시 제목 포함 가능
  if (taskType === 'RETRIEVAL_DOCUMENT' && title) {
    request.title = title;
  }

  const result = await model.embedContent(request);
  return result.embedding.values;
}
```

---

## 3. 이룸 프로젝트 적용

### 3.1 마이그레이션 계획

```typescript
// 기존 text-embedding-004 → gemini-embedding-001

// 변경 전
const model = genAI.getGenerativeModel({
  model: 'text-embedding-004', // 폐기됨
});

// 변경 후
const model = genAI.getGenerativeModel({
  model: 'gemini-embedding-001', // 현재 모델
});
```

### 3.2 통합 임베딩 서비스

```typescript
// lib/rag/embedding-service.ts
interface EmbeddingProvider {
  name: 'gemini' | 'openai';
  createEmbedding(text: string): Promise<number[]>;
  createBatchEmbeddings(texts: string[]): Promise<number[][]>;
}

class GeminiEmbeddingProvider implements EmbeddingProvider {
  name: 'gemini' = 'gemini';

  private model;
  private dimensions: number;

  constructor(dimensions: number = 1536) {
    const genAI = new GoogleGenerativeAI(
      process.env.GOOGLE_GENERATIVE_AI_API_KEY!
    );
    this.model = genAI.getGenerativeModel({
      model: 'gemini-embedding-001',
    });
    this.dimensions = dimensions;
  }

  async createEmbedding(text: string): Promise<number[]> {
    const result = await this.model.embedContent({
      content: { parts: [{ text }] },
      outputDimensionality: this.dimensions,
    });
    return result.embedding.values;
  }

  async createBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const result = await this.model.batchEmbedContents({
      requests: texts.map(text => ({
        content: { parts: [{ text }] },
        outputDimensionality: this.dimensions,
      })),
    });
    return result.embeddings.map(e => e.values);
  }
}

// 싱글톤 인스턴스
export const geminiEmbeddings = new GeminiEmbeddingProvider(1536);
```

### 3.3 RAG 파이프라인 통합

```typescript
// lib/rag/product-search.ts
import { geminiEmbeddings } from './embedding-service';
import { supabase } from '@/lib/supabase/client';

export async function searchProducts(
  query: string,
  options: SearchOptions = {}
): Promise<Product[]> {
  const { topK = 10, threshold = 0.7 } = options;

  // 1. 쿼리 임베딩 (RETRIEVAL_QUERY)
  const queryEmbedding = await createTaskSpecificEmbedding(
    query,
    'RETRIEVAL_QUERY'
  );

  // 2. Supabase 벡터 검색
  const { data, error } = await supabase.rpc('match_products', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: topK,
  });

  if (error) throw error;
  return data;
}

export async function indexProduct(product: Product): Promise<void> {
  // 문서 임베딩 (RETRIEVAL_DOCUMENT)
  const embedding = await createTaskSpecificEmbedding(
    `${product.name} ${product.description} ${product.ingredients}`,
    'RETRIEVAL_DOCUMENT',
    product.name // 제목 포함
  );

  await supabase
    .from('products')
    .update({ embedding })
    .eq('id', product.id);
}
```

---

## 4. 차원 최적화

### 4.1 MRL (Matryoshka Representation Learning)

```typescript
// 차원별 용도
const DIMENSION_CONFIGS = {
  768: {
    use: '빠른 검색, 대규모 인덱스',
    quality: '좋음',
    storage: '50% 절감 (vs 1536)',
  },
  1536: {
    use: '표준 RAG, 균형잡힌 성능',
    quality: '매우 좋음',
    storage: '기준',
  },
  3072: {
    use: '고정밀 검색, 세밀한 유사도',
    quality: '최고',
    storage: '2배',
  },
};
```

### 4.2 동적 차원 선택

```typescript
function selectOptimalDimensions(
  indexSize: number,
  queryType: 'exact' | 'semantic'
): number {
  // 대규모 인덱스 (100만+)
  if (indexSize > 1000000) {
    return 768;
  }

  // 정확한 매칭 필요
  if (queryType === 'exact') {
    return 3072;
  }

  // 기본값
  return 1536;
}
```

---

## 5. OpenAI vs Gemini 비교

### 5.1 성능 비교

| 측면 | OpenAI 3-large | Gemini embedding-001 |
|------|---------------|---------------------|
| MTEB | 64.6% | ~65% (추정) |
| 다국어 | 54.9% | 1위 (MTEB ML) |
| 한국어 | 좋음 | 매우 좋음 |
| 속도 | 150ms | 120ms |

### 5.2 비용 비교

| 항목 | OpenAI 3-large | Gemini |
|------|---------------|--------|
| 가격 | $0.00013/1K tokens | **무료** |
| 월 100만 토큰 | $130 | $0 |
| 월 1000만 토큰 | $1,300 | $0 |

### 5.3 이룸 권장 전략

```typescript
// Gemini 우선, OpenAI 폴백
async function getEmbedding(text: string): Promise<number[]> {
  try {
    // 1차: Gemini (무료, 고품질)
    return await geminiEmbeddings.createEmbedding(text);
  } catch (error) {
    console.warn('[Embedding] Gemini failed, falling back to OpenAI');

    // 2차: OpenAI (유료, 안정적)
    return await openaiEmbeddings.createEmbedding(text);
  }
}
```

---

## 6. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] text-embedding-004 → gemini-embedding-001 마이그레이션
- [ ] 차원 설정 (1536 권장)
- [ ] 배치 처리 구현

### 단기 적용 (P1)

- [ ] TaskType 활용 (RETRIEVAL_QUERY/DOCUMENT)
- [ ] 기존 임베딩 재생성
- [ ] 에러 핸들링/폴백

### 장기 적용 (P2)

- [ ] OpenAI 폴백 시스템
- [ ] 차원 최적화 테스트
- [ ] 성능 모니터링

---

## 7. 참고 자료

- [Gemini Embedding API Docs](https://ai.google.dev/gemini-api/docs/embeddings)
- [Gemini Embedding Now GA](https://developers.googleblog.com/gemini-embedding-available-gemini-api/)
- [Google Gemini API Pricing 2026](https://www.metacto.com/blogs/the-true-cost-of-google-gemini-a-guide-to-api-pricing-and-integration)
- [Gemini Cookbook - Embeddings](https://github.com/google-gemini/cookbook/blob/main/quickstarts/Embeddings.ipynb)

---

**Version**: 1.0 | **Priority**: P1 High
