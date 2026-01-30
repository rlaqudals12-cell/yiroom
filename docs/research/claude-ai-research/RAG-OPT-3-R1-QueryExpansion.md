# Query Expansion (쿼리 확장)

> **ID**: RAG-OPT-3
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/rag/

---

## 1. Query Expansion 개요

### 1.1 핵심 개념

Query Expansion은 **사용자의 짧은 질문을 여러 관점으로 확장**하여 검색 커버리지를 높이는 기법이다.

```
원본 질문:
  "건성 피부 세럼"

확장된 질문들:
  1. "건성 피부를 위한 보습 세럼"
  2. "드라이 스킨 케어 에센스"
  3. "건조한 피부에 좋은 히알루론산 세럼"
  4. "수분 부족 피부 보습 제품"
```

### 1.2 RAG에서의 역할

```
┌─────────────────────────────────────────────────┐
│                Query Expansion                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  User Query ──► LLM Query Expansion             │
│                        │                        │
│               ┌────────┼────────┐               │
│               ▼        ▼        ▼               │
│           Query 1  Query 2  Query 3             │
│               │        │        │               │
│               ▼        ▼        ▼               │
│           Search 1 Search 2 Search 3            │
│               │        │        │               │
│               └────────┼────────┘               │
│                        ▼                        │
│              Merge & Deduplicate                │
│                        │                        │
│                        ▼                        │
│              Final Results                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 2. 확장 기법

### 2.1 Multi-Query Expansion

LLM을 사용해 다양한 관점의 쿼리 생성:

```typescript
// lib/rag/query-expansion.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const MULTI_QUERY_PROMPT = `
당신은 검색 쿼리 최적화 전문가입니다.
사용자의 질문을 다양한 관점에서 재구성하여 3개의 검색 쿼리를 생성해주세요.

각 쿼리는:
- 원본 의도를 유지하면서
- 다른 키워드나 표현 사용
- 다른 관점이나 측면 강조

원본 질문: {query}

JSON 배열 형식으로 반환:
["쿼리1", "쿼리2", "쿼리3"]
`;

export async function expandQuery(query: string): Promise<string[]> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = MULTI_QUERY_PROMPT.replace('{query}', query);

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const queries = JSON.parse(text);
    return [query, ...queries]; // 원본 쿼리 포함
  } catch {
    return [query];
  }
}
```

### 2.2 동의어 확장

도메인 특화 동의어 사전 활용:

```typescript
// lib/rag/synonym-expansion.ts
const K_BEAUTY_SYNONYMS: Record<string, string[]> = {
  '세럼': ['에센스', '앰플', '부스터'],
  '건성': ['드라이', '건조한', '수분 부족'],
  '지성': ['오일리', '기름진', '유분 과다'],
  '보습': ['수분', '하이드레이팅', '모이스처'],
  '미백': ['브라이트닝', '화이트닝', '톤업'],
  '주름': ['안티에이징', '링클', '탄력'],
  '여드름': ['트러블', '브레이크아웃', '뾰루지'],
};

export function expandWithSynonyms(query: string): string[] {
  const queries = [query];

  for (const [word, synonyms] of Object.entries(K_BEAUTY_SYNONYMS)) {
    if (query.includes(word)) {
      for (const synonym of synonyms) {
        queries.push(query.replace(word, synonym));
      }
    }
  }

  return [...new Set(queries)]; // 중복 제거
}
```

### 2.3 Step-Back Prompting

구체적 질문을 더 일반적인 질문으로 확장:

```typescript
const STEP_BACK_PROMPT = `
사용자 질문을 더 넓은 맥락의 질문으로 변환해주세요.

예시:
- 원본: "레티놀 세럼 사용 순서"
- Step-back: "스킨케어 제품 사용 순서와 원칙"

원본: {query}

Step-back 질문:
`;

export async function stepBackQuery(query: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent(
    STEP_BACK_PROMPT.replace('{query}', query)
  );

  return result.response.text().trim();
}
```

---

## 3. 통합 구현

### 3.1 Query Expansion Pipeline

```typescript
// lib/rag/expanded-search.ts
import { expandQuery } from './query-expansion';
import { expandWithSynonyms } from './synonym-expansion';
import { searchSimilarDocuments } from './vector-search';

interface ExpandedSearchOptions {
  useLLMExpansion?: boolean;
  useSynonymExpansion?: boolean;
  maxQueries?: number;
  topKPerQuery?: number;
}

export async function searchWithExpansion(
  query: string,
  options: ExpandedSearchOptions = {}
): Promise<Document[]> {
  const {
    useLLMExpansion = true,
    useSynonymExpansion = true,
    maxQueries = 5,
    topKPerQuery = 20,
  } = options;

  // 1. 쿼리 확장
  let expandedQueries = [query];

  if (useLLMExpansion) {
    const llmQueries = await expandQuery(query);
    expandedQueries.push(...llmQueries);
  }

  if (useSynonymExpansion) {
    const synonymQueries = expandWithSynonyms(query);
    expandedQueries.push(...synonymQueries);
  }

  // 중복 제거 및 개수 제한
  expandedQueries = [...new Set(expandedQueries)].slice(0, maxQueries);

  // 2. 병렬 검색
  const searchPromises = expandedQueries.map(q =>
    searchSimilarDocuments(q, { topK: topKPerQuery })
  );

  const allResults = await Promise.all(searchPromises);

  // 3. 결과 병합 (RRF)
  return reciprocalRankFusion(allResults);
}
```

### 3.2 Reciprocal Rank Fusion (RRF)

```typescript
// lib/rag/fusion.ts
interface ScoredDocument {
  id: string;
  content: string;
  score: number;
}

export function reciprocalRankFusion(
  resultSets: ScoredDocument[][],
  k: number = 60 // RRF 상수
): ScoredDocument[] {
  const scores = new Map<string, { doc: ScoredDocument; score: number }>();

  for (const results of resultSets) {
    for (let rank = 0; rank < results.length; rank++) {
      const doc = results[rank];
      const rrfScore = 1 / (k + rank + 1);

      if (scores.has(doc.id)) {
        scores.get(doc.id)!.score += rrfScore;
      } else {
        scores.set(doc.id, { doc, score: rrfScore });
      }
    }
  }

  // 점수순 정렬
  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .map(({ doc, score }) => ({ ...doc, score }));
}
```

---

## 4. 한국어 최적화

### 4.1 K-뷰티 도메인 프롬프트

```typescript
const K_BEAUTY_EXPANSION_PROMPT = `
당신은 K-뷰티 전문 검색 최적화 전문가입니다.

사용자의 화장품/스킨케어 관련 질문을 확장해주세요:
1. 한국어 뷰티 용어 활용
2. 성분명 포함 (영어/한국어)
3. 피부 타입/고민 키워드 추가

원본: {query}

확장 쿼리 3개 (JSON 배열):
`;
```

### 4.2 성분명 확장

```typescript
const INGREDIENT_ALIASES: Record<string, string[]> = {
  '히알루론산': ['hyaluronic acid', 'HA', '히아루론산'],
  '레티놀': ['retinol', '비타민A', 'vitamin A'],
  '나이아신아마이드': ['niacinamide', '비타민B3', 'vitamin B3'],
  '비타민C': ['vitamin C', '아스코르브산', 'ascorbic acid'],
  '세라마이드': ['ceramide', '피부장벽'],
  'AHA': ['글리콜산', 'glycolic acid', '알파하이드록시'],
  'BHA': ['살리실산', 'salicylic acid', '베타하이드록시'],
};

export function expandIngredients(query: string): string[] {
  const queries = [query];

  for (const [ingredient, aliases] of Object.entries(INGREDIENT_ALIASES)) {
    if (query.toLowerCase().includes(ingredient.toLowerCase())) {
      for (const alias of aliases) {
        queries.push(query.replace(new RegExp(ingredient, 'gi'), alias));
      }
    }
  }

  return queries;
}
```

---

## 5. 성능 최적화

### 5.1 캐싱 전략

```typescript
import { LRUCache } from 'lru-cache';

const expansionCache = new LRUCache<string, string[]>({
  max: 1000,
  ttl: 1000 * 60 * 60, // 1시간
});

export async function expandQueryCached(query: string): Promise<string[]> {
  const normalized = query.toLowerCase().trim();

  const cached = expansionCache.get(normalized);
  if (cached) return cached;

  const expanded = await expandQuery(query);
  expansionCache.set(normalized, expanded);

  return expanded;
}
```

### 5.2 비용 최적화

| 전략 | 설명 | 절감 효과 |
|------|------|----------|
| 동의어만 사용 | LLM 호출 없이 확장 | 100% LLM 비용 절감 |
| 캐싱 | 동일 쿼리 재사용 | 70% 절감 |
| 조건부 확장 | 짧은 쿼리만 확장 | 50% 절감 |
| 작은 모델 | gemini-2.0-flash | 기본 |

### 5.3 조건부 확장

```typescript
function shouldExpand(query: string): boolean {
  // 이미 충분히 상세하면 확장 불필요
  const wordCount = query.split(/\s+/).length;
  if (wordCount > 10) return false;

  // 특정 키워드 포함하면 확장
  const expandKeywords = ['추천', '좋은', '어떤', '뭐'];
  return expandKeywords.some(kw => query.includes(kw));
}
```

---

## 6. 평가 메트릭

### 6.1 검색 품질 측정

```typescript
interface ExpansionMetrics {
  originalRecall: number;
  expandedRecall: number;
  improvement: number;
  avgQueriesGenerated: number;
  latencyMs: number;
}

async function evaluateExpansion(
  testQueries: { query: string; relevantDocs: string[] }[]
): Promise<ExpansionMetrics> {
  let totalOriginalRecall = 0;
  let totalExpandedRecall = 0;
  let totalQueries = 0;
  let totalLatency = 0;

  for (const { query, relevantDocs } of testQueries) {
    // 원본 쿼리 검색
    const originalResults = await searchSimilarDocuments(query, { topK: 10 });
    const originalRecall = calculateRecall(originalResults, relevantDocs);

    // 확장 쿼리 검색
    const startTime = performance.now();
    const expandedResults = await searchWithExpansion(query);
    totalLatency += performance.now() - startTime;

    const expandedRecall = calculateRecall(expandedResults, relevantDocs);

    totalOriginalRecall += originalRecall;
    totalExpandedRecall += expandedRecall;
    totalQueries++;
  }

  const avgOriginal = totalOriginalRecall / testQueries.length;
  const avgExpanded = totalExpandedRecall / testQueries.length;

  return {
    originalRecall: avgOriginal,
    expandedRecall: avgExpanded,
    improvement: (avgExpanded - avgOriginal) / avgOriginal * 100,
    avgQueriesGenerated: 4, // 평균 4개 쿼리
    latencyMs: totalLatency / testQueries.length,
  };
}
```

---

## 7. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] `lib/rag/query-expansion.ts` 파일 생성
- [ ] 동의어 사전 구축
- [ ] RRF 병합 함수 구현

### 단기 적용 (P1)

- [ ] LLM 기반 확장 추가
- [ ] 캐싱 시스템 구현
- [ ] K-뷰티 도메인 프롬프트

### 장기 적용 (P2)

- [ ] Step-back prompting
- [ ] A/B 테스트 구조
- [ ] 자동 평가 파이프라인

---

## 8. 참고 자료

- [Haystack Query Expansion](https://haystack.deepset.ai/blog/query-expansion)
- [LLM-QE Paper (2025)](https://arxiv.org/html/2502.17057v1)
- [Query Expansion by Prompting LLMs](https://arxiv.org/abs/2305.03653)
- [Neo4j Advanced RAG Techniques](https://neo4j.com/blog/genai/advanced-rag-techniques/)

---

**Version**: 1.0 | **Priority**: P1 High
