# Cross-Encoder Re-ranking

> **ID**: RAG-OPT-2
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/rag/

---

## 1. Re-ranking 개요

### 1.1 Two-Stage Retrieval

```
Stage 1: Bi-Encoder (빠름, 덜 정확)
├── 전체 문서 → 상위 100개 후보 선별
└── 속도: ~10ms

Stage 2: Cross-Encoder (느림, 더 정확)
├── 100개 후보 → 상위 10개 재정렬
└── 속도: ~200-500ms
```

### 1.2 Bi-Encoder vs Cross-Encoder

| 특성 | Bi-Encoder | Cross-Encoder |
|------|-----------|---------------|
| 입력 | 쿼리, 문서 따로 임베딩 | 쿼리+문서 함께 입력 |
| 속도 | 매우 빠름 (벡터 검색) | 느림 (O(n) 비교) |
| 정확도 | 상대적 낮음 | 20-35% 더 높음 |
| 용도 | 1차 검색 | 2차 재정렬 |

---

## 2. 주요 Reranker 모델

### 2.1 상용 서비스

| 서비스 | 특징 | 가격 |
|--------|------|------|
| **Cohere Rerank** | 100+ 언어, API 제공 | $0.0001/검색 |
| **Cohere Rerank 3 Nimble** | 빠른 버전 | $0.00005/검색 |
| **Pinecone Rerank V0** | Enterprise 최적화 | Pinecone 연동 |

### 2.2 오픈소스 모델

| 모델 | 파라미터 | 라이선스 |
|------|---------|---------|
| **mxbai-rerank-base-v2** | 0.5B | Apache 2.0 |
| **mxbai-rerank-large-v2** | 1.5B | Apache 2.0 |
| **Jina Reranker v2** | - | Commercial |
| **ms-marco-MiniLM** | 33M | Apache 2.0 |

---

## 3. 구현

### 3.1 Cohere Rerank 연동

```typescript
// lib/rag/reranker.ts
import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY!,
});

interface RerankOptions {
  topN?: number;
  model?: 'rerank-v3.5' | 'rerank-v3.5-nimble';
  returnDocuments?: boolean;
}

export async function rerankWithCohere(
  query: string,
  documents: string[],
  options: RerankOptions = {}
): Promise<RerankResult[]> {
  const {
    topN = 10,
    model = 'rerank-v3.5',
    returnDocuments = true,
  } = options;

  const response = await cohere.rerank({
    query,
    documents,
    topN,
    model,
    returnDocuments,
  });

  return response.results.map(result => ({
    index: result.index,
    score: result.relevanceScore,
    document: returnDocuments ? documents[result.index] : undefined,
  }));
}

interface RerankResult {
  index: number;
  score: number;
  document?: string;
}
```

### 3.2 오픈소스 모델 (FlashRank)

```typescript
// lib/rag/reranker-local.ts
import { Reranker as FlashRank } from 'flashrank';

let reranker: FlashRank | null = null;

async function getReranker(): Promise<FlashRank> {
  if (!reranker) {
    reranker = new FlashRank({
      modelName: 'ms-marco-MiniLM-L-12-v2',
      cacheDir: '.cache/flashrank',
    });
    await reranker.load();
  }
  return reranker;
}

export async function rerankLocal(
  query: string,
  documents: { id: string; content: string }[],
  topN: number = 10
): Promise<RerankResult[]> {
  const ranker = await getReranker();

  const passages = documents.map(doc => ({
    id: doc.id,
    text: doc.content,
  }));

  const results = await ranker.rerank(query, passages, topN);

  return results.map(r => ({
    id: r.id,
    score: r.score,
    content: r.text,
  }));
}
```

### 3.3 Two-Stage Retrieval 통합

```typescript
// lib/rag/search-pipeline.ts
import { searchSimilarDocuments } from './vector-search';
import { rerankWithCohere } from './reranker';

interface SearchPipelineOptions {
  firstStageK?: number;  // 1차 검색 개수
  finalK?: number;       // 최종 반환 개수
  useReranking?: boolean;
  rerankModel?: string;
}

export async function searchWithReranking(
  query: string,
  options: SearchPipelineOptions = {}
): Promise<Document[]> {
  const {
    firstStageK = 50,
    finalK = 10,
    useReranking = true,
    rerankModel = 'rerank-v3.5',
  } = options;

  // Stage 1: Bi-Encoder 검색
  const candidates = await searchSimilarDocuments(query, {
    topK: firstStageK,
  });

  if (!useReranking || candidates.length === 0) {
    return candidates.slice(0, finalK);
  }

  // Stage 2: Cross-Encoder 재정렬
  const documentTexts = candidates.map(doc => doc.content);

  const reranked = await rerankWithCohere(query, documentTexts, {
    topN: finalK,
    model: rerankModel as 'rerank-v3.5',
  });

  // 원본 문서 정보와 병합
  return reranked.map(result => ({
    ...candidates[result.index],
    rerankScore: result.score,
  }));
}
```

---

## 4. 성능 최적화

### 4.1 배치 처리

```typescript
// 여러 쿼리 동시 처리
export async function batchRerank(
  queries: string[],
  documentsPerQuery: string[][]
): Promise<RerankResult[][]> {
  const promises = queries.map((query, i) =>
    rerankWithCohere(query, documentsPerQuery[i])
  );

  return Promise.all(promises);
}
```

### 4.2 캐싱

```typescript
import { LRUCache } from 'lru-cache';

const rerankCache = new LRUCache<string, RerankResult[]>({
  max: 1000,
  ttl: 1000 * 60 * 30, // 30분
});

function getCacheKey(query: string, docIds: string[]): string {
  return `${query}:${docIds.sort().join(',')}`;
}

export async function rerankWithCache(
  query: string,
  documents: { id: string; content: string }[]
): Promise<RerankResult[]> {
  const cacheKey = getCacheKey(query, documents.map(d => d.id));

  const cached = rerankCache.get(cacheKey);
  if (cached) return cached;

  const results = await rerankWithCohere(
    query,
    documents.map(d => d.content)
  );

  rerankCache.set(cacheKey, results);
  return results;
}
```

### 4.3 조건부 Reranking

```typescript
// 필요한 경우에만 reranking 적용
function shouldRerank(
  query: string,
  candidates: Document[]
): boolean {
  // 1. 후보가 적으면 불필요
  if (candidates.length <= 5) return false;

  // 2. 상위 결과 신뢰도 높으면 불필요
  const topScore = candidates[0]?.score ?? 0;
  if (topScore > 0.95) return false;

  // 3. 점수 분포가 고르면 reranking 필요
  const scoreRange = candidates[0]?.score - candidates[9]?.score;
  if (scoreRange < 0.1) return true;

  return true;
}
```

---

## 5. 비용 분석

### 5.1 Cohere 비용 계산

```typescript
// 월간 비용 추정
const COST_PER_SEARCH = 0.0001; // $0.0001/search

function estimateMonthlyCost(
  dailySearches: number,
  avgCandidatesPerSearch: number = 50
): number {
  const monthlySearches = dailySearches * 30;
  return monthlySearches * COST_PER_SEARCH;
}

// 예시: 일 10,000 검색
// 월 비용 = 10,000 * 30 * $0.0001 = $30
```

### 5.2 비용 최적화 전략

| 전략 | 설명 | 절감 효과 |
|------|------|----------|
| Nimble 모델 사용 | 속도↑, 정확도 약간↓ | 50% 절감 |
| 조건부 reranking | 필요할 때만 적용 | 30-60% 절감 |
| 캐싱 | 동일 쿼리 재사용 | 40-70% 절감 |
| 로컬 모델 | FlashRank 등 | 100% 절감 (인프라 비용만) |

---

## 6. 한국어 최적화

### 6.1 Cohere 한국어 지원

Cohere Rerank는 100+ 언어를 지원하며, 한국어도 포함됨.

```typescript
// 한국어 쿼리 그대로 사용 가능
const results = await rerankWithCohere(
  '건성 피부에 좋은 세럼 추천해줘',
  documents
);
```

### 6.2 한국어 특화 모델 대안

| 모델 | 설명 |
|------|------|
| KoBERT-based reranker | 한국어 특화, 직접 파인튜닝 필요 |
| mxbai-rerank | 다국어 지원, 한국어 성능 양호 |
| Gemini embedding + rerank | Google Gemini 활용 |

---

## 7. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] Cohere API 키 설정
- [ ] `lib/rag/reranker.ts` 파일 생성
- [ ] Two-Stage pipeline 구현

### 단기 적용 (P1)

- [ ] 캐싱 시스템 추가
- [ ] 조건부 reranking 로직
- [ ] 비용 모니터링

### 장기 적용 (P2)

- [ ] 로컬 모델 대안 검토
- [ ] A/B 테스트 (rerank vs no-rerank)
- [ ] 한국어 특화 모델 평가

---

## 8. 참고 자료

- [Pinecone Rerankers Guide](https://www.pinecone.io/learn/series/rag/rerankers/)
- [Top 7 Rerankers for RAG 2026](https://www.analyticsvidhya.com/blog/2025/06/top-rerankers-for-rag/)
- [ZeroEntropy Reranking Guide](https://www.zeroentropy.dev/articles/ultimate-guide-to-choosing-the-best-reranking-model-in-2025)
- [OpenSearch Cohere Reranking](https://docs.opensearch.org/latest/tutorials/reranking/reranking-cohere/)

---

**Version**: 1.0 | **Priority**: P1 High
