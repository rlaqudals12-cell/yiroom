# HyDE (Hypothetical Document Embeddings)

> **ID**: RAG-OPT-1
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/rag/

---

## 1. HyDE 개요

### 1.1 핵심 원리

HyDE(Hypothetical Document Embeddings)는 **"가상의 답변 문서"**를 생성하여 검색 품질을 향상시키는 기법이다.

```
기존 RAG:
  짧은 질문 → 임베딩 → 긴 문서 매칭 (불일치)

HyDE:
  짧은 질문 → LLM이 가상 답변 생성 → 가상 답변 임베딩 → 문서 매칭 (일치도 ↑)
```

### 1.2 왜 효과적인가?

| 문제 | HyDE 해결책 |
|------|------------|
| 질문과 문서의 의미 공간 불일치 | 가상 답변이 문서와 유사한 형태 |
| 짧은 쿼리의 정보 부족 | 가상 문서가 풍부한 컨텍스트 제공 |
| 키워드 기반 검색 한계 | 의미적 유사성 기반 매칭 |

---

## 2. 동작 방식

### 2.1 4단계 프로세스

```
1. 질문 입력
   └── "건성 피부에 좋은 성분은?"

2. LLM으로 가상 문서 생성 (5개 권장)
   └── "건성 피부에는 히알루론산, 세라마이드, 글리세린이 효과적입니다.
        히알루론산은 피부 수분을 유지하고..."

3. 가상 문서들을 임베딩 → 평균 벡터 계산
   └── [0.12, 0.45, ...] (평균화된 단일 벡터)

4. 실제 문서와 유사도 검색
   └── 가상 답변과 가장 유사한 실제 문서 반환
```

### 2.2 프롬프트 템플릿

```typescript
const HYDE_PROMPT = `
당신은 K-뷰티 전문가입니다.
다음 질문에 대한 상세한 답변 문서를 작성해주세요.
실제로 정확하지 않아도 됩니다. 관련 패턴만 포함하면 됩니다.

질문: {query}

답변 문서:
`;
```

---

## 3. 구현

### 3.1 기본 구현

```typescript
// lib/rag/hyde.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createEmbedding } from './embeddings';
import { searchSimilarDocuments } from './vector-search';

interface HyDEOptions {
  numHypothetical?: number;  // 생성할 가상 문서 수
  temperature?: number;      // LLM 창의성
  maxTokens?: number;        // 가상 문서 최대 길이
}

export async function hydeSearch(
  query: string,
  options: HyDEOptions = {}
): Promise<Document[]> {
  const {
    numHypothetical = 5,
    temperature = 0.7,
    maxTokens = 512,
  } = options;

  // 1. 가상 문서 생성
  const hypotheticalDocs = await generateHypotheticalDocuments(
    query,
    numHypothetical,
    temperature,
    maxTokens
  );

  // 2. 각 가상 문서 임베딩
  const embeddings = await Promise.all(
    hypotheticalDocs.map(doc => createEmbedding(doc))
  );

  // 3. 임베딩 평균 계산
  const avgEmbedding = averageEmbeddings(embeddings);

  // 4. 유사 문서 검색
  const documents = await searchSimilarDocuments(avgEmbedding, {
    topK: 10,
    threshold: 0.7,
  });

  return documents;
}

async function generateHypotheticalDocuments(
  query: string,
  count: number,
  temperature: number,
  maxTokens: number
): Promise<string[]> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
당신은 K-뷰티 전문가입니다.
다음 질문에 대한 상세한 답변 문서를 ${count}개 작성해주세요.
각 답변은 다른 관점이나 측면을 다뤄야 합니다.
JSON 배열 형식으로 반환해주세요.

질문: ${query}

형식: ["답변1", "답변2", ...]
`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens * count,
    },
  });

  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch {
    // JSON 파싱 실패 시 단일 문서로 처리
    return [text];
  }
}

function averageEmbeddings(embeddings: number[][]): number[] {
  const dimension = embeddings[0].length;
  const avg = new Array(dimension).fill(0);

  for (const embedding of embeddings) {
    for (let i = 0; i < dimension; i++) {
      avg[i] += embedding[i];
    }
  }

  return avg.map(v => v / embeddings.length);
}
```

### 3.2 A/B 테스트 구조

```typescript
// lib/rag/search.ts
import { hydeSearch } from './hyde';
import { directSearch } from './direct-search';

export async function search(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult> {
  const useHyde = options.strategy === 'hyde' ||
                  (options.strategy === 'auto' && shouldUseHyde(query));

  const startTime = performance.now();

  const documents = useHyde
    ? await hydeSearch(query, options.hydeOptions)
    : await directSearch(query, options.directOptions);

  const duration = performance.now() - startTime;

  return {
    documents,
    metadata: {
      strategy: useHyde ? 'hyde' : 'direct',
      duration,
      query,
    },
  };
}

// HyDE 사용 여부 자동 판단
function shouldUseHyde(query: string): boolean {
  // 짧은 질문 (5단어 미만)은 HyDE 효과적
  const wordCount = query.split(/\s+/).length;

  // 질문형인 경우 HyDE 효과적
  const isQuestion = /\?$|뭐|무엇|어떤|어떻게|왜/.test(query);

  return wordCount < 5 || isQuestion;
}
```

---

## 4. 한국어 최적화

### 4.1 K-뷰티 도메인 프롬프트

```typescript
const K_BEAUTY_HYDE_PROMPT = `
당신은 한국 화장품 및 스킨케어 전문가입니다.

다음 질문에 대해:
1. 한국어로 자연스럽게 답변
2. K-뷰티 관련 성분명, 제품 유형 포함
3. 피부 과학 용어 적절히 사용
4. 200-300자 분량

질문: {query}
`;
```

### 4.2 도메인별 템플릿

```typescript
const DOMAIN_TEMPLATES: Record<string, string> = {
  skincare: `피부 관리 전문가로서...`,
  makeup: `메이크업 아티스트로서...`,
  haircare: `헤어 케어 전문가로서...`,
  nutrition: `영양 전문가로서...`,
};

function getPromptTemplate(domain: string): string {
  return DOMAIN_TEMPLATES[domain] || DOMAIN_TEMPLATES.skincare;
}
```

---

## 5. 성능 최적화

### 5.1 캐싱 전략

```typescript
// lib/rag/hyde-cache.ts
import { LRUCache } from 'lru-cache';

const hydeCache = new LRUCache<string, string[]>({
  max: 500,
  ttl: 1000 * 60 * 60, // 1시간
});

export async function getCachedHypotheticalDocs(
  query: string
): Promise<string[] | undefined> {
  const normalized = normalizeQuery(query);
  return hydeCache.get(normalized);
}

export function cacheHypotheticalDocs(
  query: string,
  docs: string[]
): void {
  const normalized = normalizeQuery(query);
  hydeCache.set(normalized, docs);
}

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}
```

### 5.2 비용 최적화

| 전략 | 설명 | 절감 효과 |
|------|------|----------|
| 가상 문서 수 감소 | 5개 → 3개 | 토큰 40% 절감 |
| 캐싱 | 동일 질문 재사용 | API 호출 70% 절감 |
| 짧은 가상 문서 | 512 → 256 토큰 | 토큰 50% 절감 |
| 조건부 HyDE | 짧은 질문만 적용 | API 호출 60% 절감 |

---

## 6. 한계 및 대안

### 6.1 HyDE 한계

| 상황 | 문제 |
|------|------|
| LLM이 도메인 지식 없을 때 | 잘못된 가상 문서 생성 |
| 매우 구체적인 질문 | 일반적 답변 생성 |
| 실시간 정보 필요 | 최신 정보 반영 불가 |

### 6.2 대안 전략

```typescript
// 하이브리드 접근
async function hybridSearch(query: string): Promise<Document[]> {
  // 1. 직접 검색
  const directResults = await directSearch(query);

  // 2. HyDE 검색
  const hydeResults = await hydeSearch(query);

  // 3. 결과 병합 (RRF)
  return reciprocalRankFusion([directResults, hydeResults]);
}
```

---

## 7. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] `lib/rag/hyde.ts` 파일 생성
- [ ] 기본 HyDE 함수 구현
- [ ] 기존 product-qa.ts 통합

### 단기 적용 (P1)

- [ ] A/B 테스트 구조 구현
- [ ] 캐싱 시스템 추가
- [ ] 도메인별 프롬프트 템플릿

### 장기 적용 (P2)

- [ ] 성능 메트릭 수집
- [ ] 자동 최적화 로직
- [ ] 하이브리드 검색 통합

---

## 8. 참고 자료

- [Precise Zero-Shot Dense Retrieval (원 논문)](https://arxiv.org/abs/2212.10496)
- [Haystack HyDE Documentation](https://docs.haystack.deepset.ai/docs/hypothetical-document-embeddings-hyde)
- [Zilliz HyDE Guide](https://zilliz.com/learn/improve-rag-and-information-retrieval-with-hyde-hypothetical-document-embeddings)
- [Machine Learning Plus - HyDE Explained](https://machinelearningplus.com/gen-ai/hypothetical-document-embedding-hyde-a-smarter-rag-method-to-search-documents/)

---

**Version**: 1.0 | **Priority**: P1 High
