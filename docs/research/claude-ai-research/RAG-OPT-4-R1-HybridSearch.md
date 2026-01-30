# Hybrid Search (하이브리드 검색)

> **ID**: RAG-OPT-4
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/rag/

---

## 1. Hybrid Search 개요

### 1.1 핵심 개념

Hybrid Search는 **BM25(키워드)** + **Vector(의미)** 검색을 결합하여 검색 품질을 극대화하는 기법이다.

```
┌────────────────────────────────────────────────┐
│              Hybrid Search                      │
├────────────────────────────────────────────────┤
│                                                │
│  Query ─────┬──────────────────────┐           │
│             │                      │           │
│             ▼                      ▼           │
│     ┌──────────────┐      ┌──────────────┐    │
│     │   BM25       │      │   Vector     │    │
│     │  (키워드)     │      │  (의미)      │    │
│     └──────────────┘      └──────────────┘    │
│             │                      │           │
│             └──────────┬───────────┘           │
│                        ▼                       │
│              ┌─────────────────┐              │
│              │  Fusion (RRF)   │              │
│              └─────────────────┘              │
│                        │                       │
│                        ▼                       │
│              Final Results                     │
│                                                │
└────────────────────────────────────────────────┘
```

### 1.2 왜 하이브리드인가?

| 검색 방식 | 장점 | 단점 |
|----------|------|------|
| **BM25** | 정확한 키워드 매칭, 빠름 | 동의어/맥락 이해 못함 |
| **Vector** | 의미적 유사성, 동의어 처리 | 정확한 키워드 놓칠 수 있음 |
| **Hybrid** | 두 장점 결합 | 구현 복잡도 증가 |

### 1.3 성능 향상

```
2025 Weaviate Benchmark:
- Pure Vector Search:  NDCG@10 = 0.65
- Hybrid Search:       NDCG@10 = 0.92 (+42%)

2026 Fortune 500 AI Teams:
- 65%가 Hybrid Search 채택
```

---

## 2. BM25 구현

### 2.1 BM25 알고리즘 개요

```
BM25 Score = IDF * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * dl/avgdl))

- IDF: Inverse Document Frequency (희귀 단어 가중치)
- tf: Term Frequency (문서 내 단어 빈도)
- k1: 단어 빈도 포화 파라미터 (보통 1.2-2.0)
- b: 문서 길이 정규화 파라미터 (보통 0.75)
- dl: Document Length
- avgdl: Average Document Length
```

### 2.2 JavaScript 구현

```typescript
// lib/rag/bm25.ts
interface BM25Options {
  k1?: number;
  b?: number;
}

export class BM25 {
  private k1: number;
  private b: number;
  private documents: string[] = [];
  private tokenizedDocs: string[][] = [];
  private idf: Map<string, number> = new Map();
  private avgdl: number = 0;

  constructor(options: BM25Options = {}) {
    this.k1 = options.k1 ?? 1.5;
    this.b = options.b ?? 0.75;
  }

  fit(documents: string[]): void {
    this.documents = documents;
    this.tokenizedDocs = documents.map(doc => this.tokenize(doc));

    // 평균 문서 길이
    const totalLength = this.tokenizedDocs.reduce(
      (sum, doc) => sum + doc.length, 0
    );
    this.avgdl = totalLength / documents.length;

    // IDF 계산
    const df = new Map<string, number>();
    for (const tokens of this.tokenizedDocs) {
      const uniqueTokens = new Set(tokens);
      for (const token of uniqueTokens) {
        df.set(token, (df.get(token) ?? 0) + 1);
      }
    }

    const N = documents.length;
    for (const [token, count] of df) {
      this.idf.set(token, Math.log((N - count + 0.5) / (count + 0.5) + 1));
    }
  }

  search(query: string, topK: number = 10): { index: number; score: number }[] {
    const queryTokens = this.tokenize(query);
    const scores: { index: number; score: number }[] = [];

    for (let i = 0; i < this.documents.length; i++) {
      const docTokens = this.tokenizedDocs[i];
      const dl = docTokens.length;
      let score = 0;

      for (const token of queryTokens) {
        const tf = docTokens.filter(t => t === token).length;
        const idf = this.idf.get(token) ?? 0;

        score += idf * (tf * (this.k1 + 1)) /
                 (tf + this.k1 * (1 - this.b + this.b * dl / this.avgdl));
      }

      scores.push({ index: i, score });
    }

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }
}
```

### 2.3 Supabase + pgvector BM25

```sql
-- PostgreSQL Full-Text Search 설정
ALTER TABLE products ADD COLUMN search_vector tsvector;

UPDATE products SET search_vector =
  setweight(to_tsvector('korean', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('korean', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('korean', coalesce(ingredients, '')), 'C');

CREATE INDEX idx_products_search ON products USING GIN(search_vector);

-- BM25 스타일 검색 (ts_rank)
SELECT *, ts_rank(search_vector, plainto_tsquery('korean', $1)) as rank
FROM products
WHERE search_vector @@ plainto_tsquery('korean', $1)
ORDER BY rank DESC
LIMIT 20;
```

---

## 3. Hybrid Search 구현

### 3.1 LangChain Ensemble Retriever

```typescript
// lib/rag/hybrid-search.ts
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';

export async function hybridSearch(
  query: string,
  options: HybridSearchOptions = {}
): Promise<Document[]> {
  const {
    vectorWeight = 0.7,
    bm25Weight = 0.3,
    topK = 20,
  } = options;

  // 1. Vector Search
  const vectorResults = await vectorStore.similaritySearch(query, topK);

  // 2. BM25 Search
  const bm25Results = await bm25Search(query, topK);

  // 3. Fusion (RRF)
  return reciprocalRankFusion(
    [vectorResults, bm25Results],
    [vectorWeight, bm25Weight]
  );
}
```

### 3.2 Supabase 통합 구현

```typescript
// lib/rag/supabase-hybrid.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface HybridSearchOptions {
  topK?: number;
  vectorWeight?: number;
  bm25Weight?: number;
  threshold?: number;
}

export async function supabaseHybridSearch(
  query: string,
  embedding: number[],
  options: HybridSearchOptions = {}
): Promise<Document[]> {
  const {
    topK = 20,
    vectorWeight = 0.7,
    bm25Weight = 0.3,
    threshold = 0.5,
  } = options;

  // 병렬 실행
  const [vectorResults, bm25Results] = await Promise.all([
    // Vector Search
    supabase.rpc('match_products', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: topK,
    }),

    // Full-Text Search (BM25)
    supabase
      .from('products')
      .select('*')
      .textSearch('search_vector', query, {
        type: 'websearch',
        config: 'korean',
      })
      .limit(topK),
  ]);

  if (vectorResults.error) throw vectorResults.error;
  if (bm25Results.error) throw bm25Results.error;

  // RRF Fusion
  return weightedRRF(
    [vectorResults.data, bm25Results.data],
    [vectorWeight, bm25Weight]
  );
}
```

### 3.3 Reciprocal Rank Fusion

```typescript
// lib/rag/fusion.ts
interface FusionOptions {
  k?: number; // RRF constant
}

export function reciprocalRankFusion<T extends { id: string }>(
  resultSets: T[][],
  weights?: number[],
  options: FusionOptions = {}
): T[] {
  const { k = 60 } = options;
  const normalizedWeights = weights ?? resultSets.map(() => 1);

  const scores = new Map<string, { item: T; score: number }>();

  for (let setIdx = 0; setIdx < resultSets.length; setIdx++) {
    const results = resultSets[setIdx];
    const weight = normalizedWeights[setIdx];

    for (let rank = 0; rank < results.length; rank++) {
      const item = results[rank];
      const rrfScore = weight * (1 / (k + rank + 1));

      if (scores.has(item.id)) {
        scores.get(item.id)!.score += rrfScore;
      } else {
        scores.set(item.id, { item, score: rrfScore });
      }
    }
  }

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .map(({ item, score }) => ({ ...item, fusionScore: score }));
}
```

---

## 4. 가중치 최적화

### 4.1 쿼리 유형별 가중치

```typescript
interface QueryProfile {
  type: 'keyword' | 'semantic' | 'mixed';
  vectorWeight: number;
  bm25Weight: number;
}

function analyzeQuery(query: string): QueryProfile {
  // 제품명, 성분명 등 정확한 키워드 포함
  const hasExactTerms = /^[가-힣A-Za-z]+$/.test(query.trim()) ||
                        INGREDIENT_LIST.some(i => query.includes(i));

  // 질문형, 설명형 쿼리
  const isSemanticQuery = /\?|추천|좋은|어떤|방법/.test(query);

  if (hasExactTerms && !isSemanticQuery) {
    return { type: 'keyword', vectorWeight: 0.3, bm25Weight: 0.7 };
  }

  if (isSemanticQuery && !hasExactTerms) {
    return { type: 'semantic', vectorWeight: 0.8, bm25Weight: 0.2 };
  }

  return { type: 'mixed', vectorWeight: 0.6, bm25Weight: 0.4 };
}

// 동적 가중치 적용
export async function adaptiveHybridSearch(query: string): Promise<Document[]> {
  const profile = analyzeQuery(query);

  return hybridSearch(query, {
    vectorWeight: profile.vectorWeight,
    bm25Weight: profile.bm25Weight,
  });
}
```

### 4.2 학습 기반 가중치

```typescript
// 클릭 데이터 기반 가중치 최적화
async function optimizeWeights(
  queries: string[],
  clicks: { query: string; docId: string }[]
): Promise<{ vectorWeight: number; bm25Weight: number }> {
  // Grid search로 최적 가중치 탐색
  let bestScore = 0;
  let bestWeights = { vectorWeight: 0.5, bm25Weight: 0.5 };

  for (let vw = 0.1; vw <= 0.9; vw += 0.1) {
    const bw = 1 - vw;
    let totalScore = 0;

    for (const { query, docId } of clicks) {
      const results = await hybridSearch(query, { vectorWeight: vw, bm25Weight: bw });
      const rank = results.findIndex(r => r.id === docId);

      if (rank >= 0) {
        totalScore += 1 / (rank + 1); // MRR 스타일
      }
    }

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestWeights = { vectorWeight: vw, bm25Weight: bw };
    }
  }

  return bestWeights;
}
```

---

## 5. 성능 최적화

### 5.1 병렬 실행

```typescript
// 두 검색을 병렬로 실행
const [vectorResults, bm25Results] = await Promise.all([
  vectorSearch(query),
  bm25Search(query),
]);
```

### 5.2 캐싱

```typescript
import { LRUCache } from 'lru-cache';

const hybridCache = new LRUCache<string, Document[]>({
  max: 1000,
  ttl: 1000 * 60 * 15, // 15분
});

export async function cachedHybridSearch(query: string): Promise<Document[]> {
  const cacheKey = `hybrid:${query.toLowerCase().trim()}`;

  const cached = hybridCache.get(cacheKey);
  if (cached) return cached;

  const results = await hybridSearch(query);
  hybridCache.set(cacheKey, results);

  return results;
}
```

### 5.3 인덱스 최적화

```sql
-- Vector Index (HNSW)
CREATE INDEX idx_products_embedding ON products
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Full-Text Index (GIN)
CREATE INDEX idx_products_fts ON products
USING GIN(search_vector);

-- 복합 쿼리 최적화
CREATE INDEX idx_products_category_fts ON products(category)
WHERE search_vector IS NOT NULL;
```

---

## 6. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] BM25 클래스 구현
- [ ] Supabase Full-Text Search 설정
- [ ] RRF Fusion 함수 구현

### 단기 적용 (P1)

- [ ] 동적 가중치 시스템
- [ ] 캐싱 레이어 추가
- [ ] 성능 메트릭 수집

### 장기 적용 (P2)

- [ ] 학습 기반 가중치 최적화
- [ ] A/B 테스트 프레임워크
- [ ] Cross-encoder reranking 통합

---

## 7. 참고 자료

- [Superlinked VectorHub - Hybrid Search](https://superlinked.com/vectorhub/articles/optimizing-rag-with-hybrid-search-reranking)
- [VectorChord Hybrid Search](https://docs.vectorchord.ai/vectorchord/use-case/hybrid-search.html)
- [Meilisearch Hybrid Search RAG](https://www.meilisearch.com/blog/hybrid-search-rag)
- [NetApp Hybrid RAG Guide](https://community.netapp.com/t5/Tech-ONTAP-Blogs/Hybrid-RAG-in-the-Real-World-Graphs-BM25-and-the-End-of-Black-Box-Retrieval/ba-p/464834)

---

**Version**: 1.0 | **Priority**: P1 High
