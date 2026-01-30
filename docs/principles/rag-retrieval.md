# RAG 검색 원리

> 이 문서는 이룸 제품 검색 및 추천 시스템의 기반이 되는 RAG(Retrieval-Augmented Generation) 원리를 설명한다.
>
> **소스 리서치**: RAG-OPT-1~4, EMB-1~4, VDB-1~4

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 의미 기반 검색 시스템"

- 100% 의미 이해: 동의어, 유사 표현 완벽 인식
- 하이브리드 검색: 키워드(BM25) + 벡터(Semantic) 최적 결합
- Two-Stage Retrieval: 빠른 후보 선별 + 정밀 재정렬
- 개인화 랭킹: 사용자 선호도/분석 결과 기반 순위 조정
- 실시간 인덱싱: 신규 제품 5분 이내 검색 가능
- 다국어 지원: 한국어/영어 동시 의미 검색
- 환각 방지: 검색 결과 기반 응답으로 환각 최소화
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **임베딩 품질** | 도메인 특화 용어 임베딩 정확도 한계 |
| **벡터 DB 비용** | 대규모 벡터 저장/검색 비용 |
| **지연 시간** | Cross-Encoder 재정렬은 200-500ms 추가 |
| **데이터 의존** | 임베딩 품질은 학습 데이터에 의존 |
| **환각 완전 제거** | RAG도 환각 완전 제거 불가 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **Recall@100** | 95% 이상 관련 문서 포함 |
| **MRR@10** | 0.8 이상 (정답이 상위에 위치) |
| **검색 지연** | < 200ms (p95) |
| **하이브리드 가중치** | 쿼리별 동적 α 최적화 |
| **임베딩 차원** | 1536차원 이상 |
| **청크 전략** | 의미 단위 분할, 512 토큰 이하 |
| **인덱스 갱신** | 5분 이내 실시간 반영 |

### 현재 목표

**70%** - MVP RAG 시스템

- ✅ 코사인 유사도 기반 벡터 검색
- ✅ Bi-Encoder/Cross-Encoder 이론 이해
- ✅ 하이브리드 검색 원리 (BM25 + Vector)
- ✅ Two-Stage Retrieval 설계
- ⏳ Supabase pgvector 적용 (60%)
- ⏳ 하이브리드 가중치 튜닝 (50%)
- ⏳ 개인화 랭킹 (40%)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| Cross-Encoder 재정렬 | 지연 시간 증가, MVP 제외 | Phase 3 |
| 파인튜닝 임베딩 | 도메인 데이터 축적 필요 | Phase 4 |
| 다국어 동시 검색 | 복잡도 증가 | Phase 5 |
| 실시간 인덱싱 | 인프라 비용 | Phase 3 |

---

## 1. 핵심 개념

### 1.1 벡터 공간과 의미적 유사성

**임베딩(Embedding)**은 텍스트를 고차원 벡터 공간에 매핑하는 과정이다.

```
텍스트 → 임베딩 모델 → [d1, d2, d3, ..., dn] (n차원 벡터)

예시:
"건성 피부 세럼" → [0.12, -0.34, 0.56, ..., 0.89]  (1536차원)
"dry skin serum" → [0.11, -0.33, 0.55, ..., 0.88]  (유사 벡터)
```

**의미적 유사성**: 의미가 비슷한 텍스트는 벡터 공간에서 가까운 위치에 매핑된다.

### 1.2 Bi-Encoder vs Cross-Encoder

| 구분 | Bi-Encoder | Cross-Encoder |
|------|------------|---------------|
| **처리 방식** | 쿼리/문서 독립 임베딩 | 쿼리+문서 동시 처리 |
| **속도** | 빠름 (~10ms) | 느림 (~200-500ms) |
| **정확도** | 낮음 (recall 위주) | 높음 (precision 위주) |
| **용도** | 초기 후보 선별 | 최종 순위 결정 |

**Two-Stage Retrieval**:
```
Stage 1: Bi-Encoder → 상위 100개 후보 선별 (빠름, 대규모)
Stage 2: Cross-Encoder → 상위 10개 재정렬 (정확, 소규모)
```

### 1.3 하이브리드 검색의 원리

**키워드 검색 (BM25)**: 정확한 단어 매칭
**벡터 검색 (Semantic)**: 의미적 유사성

```
"히알루론산 세럼" 검색 시:

BM25: "히알루론산" 정확히 포함한 문서 우선
Vector: "히알루론산", "HA", "hyaluronic acid" 모두 유사하게 처리

→ 둘을 결합하면 정확성 + 의미 이해 동시 확보
```

---

## 2. 수학적/물리학적 기반

### 2.1 코사인 유사도 (Cosine Similarity)

두 벡터 간의 각도를 측정하여 유사도를 계산:

```
cos(θ) = (A · B) / (||A|| × ||B||)

A · B = Σ(ai × bi)           // 내적
||A|| = √(Σ ai²)             // L2 노름

범위: -1 ~ 1
  1: 완전 동일
  0: 무관
 -1: 완전 반대
```

**적용 예시**:
```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dotProduct / (normA * normB);
}
```

### 2.2 BM25 스코어링

**BM25 (Best Matching 25)**는 TF-IDF의 확률적 개선 버전:

```
BM25(q, d) = Σ IDF(qi) × (tf × (k1 + 1)) / (tf + k1 × (1 - b + b × dl/avgdl))

파라미터:
- IDF(qi): 역문서 빈도 (희귀 단어 가중치)
- tf: 문서 내 단어 빈도
- k1: 포화 파라미터 (1.2-2.0, 기본 1.5)
- b: 문서 길이 정규화 (0.75)
- dl: 문서 길이
- avgdl: 평균 문서 길이
```

**IDF 계산**:
```
IDF(q) = ln((N - n(q) + 0.5) / (n(q) + 0.5) + 1)

N: 전체 문서 수
n(q): 쿼리 단어 q를 포함하는 문서 수
```

### 2.3 RRF (Reciprocal Rank Fusion)

여러 검색 결과를 하나로 병합:

```
RRF_score(d) = Σ 1 / (k + rank_i(d))

k: 상수 (기본 60)
rank_i(d): i번째 검색에서 문서 d의 순위

예시:
문서 A: BM25 순위 1, Vector 순위 3
RRF = 1/(60+1) + 1/(60+3) = 0.0164 + 0.0159 = 0.0323
```

**k 값 영향**:
- k=60 (표준): 균형 잡힌 병합
- 높은 k: 순위 차이 완화
- 낮은 k: 상위 결과 더 우대

### 2.4 HNSW 그래프 탐색

**Hierarchical Navigable Small World**:

```
검색 복잡도: O(log N)
메모리: O(N × M × d)

M: 레이어당 최대 연결 수
d: 벡터 차원

ef_construction: 그래프 구성 시 후보 수 (64)
ef_search: 검색 시 후보 수 (40-100)
```

---

## 3. RAG 최적화 기법

### 3.1 HyDE (Hypothetical Document Embeddings)

**원리**: 짧은 질문을 가상의 상세한 답변 문서로 변환하여 의미 공간 정렬

```
쿼리: "건성 피부 세럼"
         ↓
LLM 생성 가상 문서:
"건성 피부를 위한 세럼은 히알루론산, 세라마이드 등
보습 성분이 풍부해야 합니다. 피부 장벽 강화와
수분 유지에 효과적인 제품을 선택하세요..."
         ↓
가상 문서 임베딩 → 실제 문서와 유사도 비교
```

**이룸 적용**:
- 짧은 쿼리 (< 5단어)에만 적용
- K-뷰티 도메인 프롬프트 사용
- LRU 캐시로 동일 쿼리 재사용

### 3.2 Cross-Encoder Reranking

**원리**: 초기 후보를 더 정확한 모델로 재평가

```
Stage 1: Bi-Encoder
쿼리 → [임베딩] → 100개 후보 선별 (10ms)

Stage 2: Cross-Encoder
[쿼리 + 후보1] → 점수
[쿼리 + 후보2] → 점수
...
→ 상위 10개 반환 (200ms)
```

**성능 향상**: +20-35% 정확도

### 3.3 Query Expansion

**기법**:

1. **Multi-Query**: LLM으로 다양한 관점의 쿼리 생성
2. **동의어 확장**: 도메인 사전 기반
3. **Step-Back**: 구체적 → 일반 질문 변환

```
원본: "건성 피부 세럼"

Multi-Query:
- "건성 피부에 좋은 세럼"
- "수분 공급 세럼 추천"
- "건조한 피부 보습 에센스"

동의어 확장:
- 세럼 ↔ 에센스 ↔ serum
- 건성 ↔ 드라이 ↔ dry
- 히알루론산 ↔ HA ↔ hyaluronic acid
```

---

## 4. 구현 도출

### 4.1 원리 → 알고리즘

| 원리 | 알고리즘 | 구현 |
|------|---------|------|
| 의미 공간 정렬 | HyDE | `hyde.ts` |
| 정확도 향상 | Reranking | `reranker.ts` |
| 커버리지 증가 | Query Expansion | `query-expansion.ts` |
| 키워드+의미 | Hybrid Search | `hybrid-search.ts` |

### 4.2 통합 파이프라인

```typescript
// RAG 검색 파이프라인
async function ragSearch(query: string): Promise<SearchResult[]> {
  // 1. Query Expansion (선택적)
  const expandedQueries = await expandQuery(query);

  // 2. 병렬 검색
  const [vectorResults, bm25Results] = await Promise.all([
    vectorSearch(expandedQueries),
    bm25Search(expandedQueries),
  ]);

  // 3. RRF 병합
  const mergedResults = rrfMerge(vectorResults, bm25Results, { k: 60 });

  // 4. Reranking (상위 N개만)
  const rerankedResults = await rerank(query, mergedResults.slice(0, 50));

  return rerankedResults.slice(0, 10);
}
```

### 4.3 임베딩 서비스

```typescript
// 임베딩 모델 추상화
interface EmbeddingService {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

// Gemini 우선, OpenAI 폴백
class HybridEmbeddingService implements EmbeddingService {
  async embed(text: string): Promise<number[]> {
    try {
      return await geminiEmbed(text);  // 무료
    } catch {
      return await openaiEmbed(text);  // 유료 폴백
    }
  }
}
```

---

## 5. 벡터 데이터베이스 설정

### 5.1 pgvector 인덱스

**⚠️ 버전 요구사항**:
- **pgvector 0.5.0+** 필수 (HNSW 인덱스 지원)
- Supabase는 2024년 1월부터 pgvector 0.5.1+ 기본 제공
- 버전 확인: `SELECT extversion FROM pg_extension WHERE extname = 'vector';`

```sql
-- pgvector 확장 활성화 (최초 1회)
CREATE EXTENSION IF NOT EXISTS vector;

-- HNSW 인덱스 생성 (권장, pgvector 0.5.0+)
CREATE INDEX idx_products_embedding ON products
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 검색 시 ef_search 설정
SET hnsw.ef_search = 100;  -- recall 95%+

-- IVFFlat 인덱스 (pgvector 0.4.0+, 레거시 대안)
-- CREATE INDEX idx_products_embedding_ivf ON products
-- USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### 5.2 메모리 계산

```
HNSW 메모리 = 벡터 수 × 차원 × 4 bytes × 2.5

예시:
100K 벡터 × 1536 차원 × 4 × 2.5 = ~1.5GB
```

### 5.3 파티셔닝 (100K+ 시)

```sql
-- 카테고리별 파티셔닝
CREATE TABLE products PARTITION BY LIST (category);

CREATE TABLE products_skincare PARTITION OF products
  FOR VALUES IN ('skincare');
CREATE TABLE products_makeup PARTITION OF products
  FOR VALUES IN ('makeup');
```

---

## 6. 이룸 도메인 최적화

### 6.1 K-뷰티 동의어 사전

```typescript
const K_BEAUTY_SYNONYMS: Record<string, string[]> = {
  // 제품 유형
  '세럼': ['에센스', 'serum', 'essence', '앰플'],
  '로션': ['에멀젼', 'lotion', 'emulsion'],
  '크림': ['모이스처라이저', 'cream', 'moisturizer'],

  // 피부 타입
  '건성': ['드라이', 'dry', '건조한'],
  '지성': ['오일리', 'oily', '지성 피부'],
  '복합성': ['combination', '콤비네이션'],
  '민감성': ['sensitive', '예민한'],

  // 성분
  '히알루론산': ['HA', 'hyaluronic acid', '히아루론산'],
  '나이아신아마이드': ['비타민B3', 'niacinamide', '니코틴아마이드'],
  '레티놀': ['비타민A', 'retinol', 'retinoid'],
};
```

### 6.2 도메인 프롬프트 (HyDE용)

```typescript
const HYDE_PROMPT = `
당신은 K-뷰티 전문가입니다.
다음 질문에 대해 상세한 제품 설명을 작성하세요.
성분명, 피부 타입, 효능을 반드시 포함하세요.

질문: {query}
`;
```

---

## 7. 성능 목표 및 메트릭

### 7.1 검색 품질 메트릭

| 메트릭 | 현재 | 목표 | 설명 |
|--------|------|------|------|
| **Recall@10** | 65% | 90%+ | 상위 10개에 관련 문서 포함 비율 |
| **NDCG@10** | 0.65 | 0.85+ | 순위 고려한 정확도 |
| **MRR** | 0.45 | 0.70+ | 첫 관련 문서 순위 역수 평균 |

### 7.2 응답 시간

| 단계 | 현재 | 목표 |
|------|------|------|
| Vector Search | 50ms | 30ms |
| BM25 Search | 30ms | 20ms |
| Reranking | 300ms | 200ms |
| **총 응답** | 500ms | 300ms |

### 7.3 비용

| 항목 | 월 비용 |
|------|--------|
| Embedding (Gemini) | $0 (무료) |
| Reranking (Cohere) | $20-30 |
| DB (Supabase Pro) | $25-50 |
| **총계** | $45-80 |

---

## 8. 검증 방법

### 8.1 검색 품질 평가

```typescript
// 테스트 데이터셋
const testQueries = [
  {
    query: '건성 피부 세럼',
    relevantProductIds: ['prod_001', 'prod_015', 'prod_023'],
  },
  // ...
];

// Recall 계산
function calculateRecall(results: Product[], relevant: string[]): number {
  const found = results.filter(r => relevant.includes(r.id)).length;
  return found / relevant.length;
}
```

### 8.2 A/B 테스트

```typescript
// Feature Flag 기반 A/B 테스트
const searchVariant = useFeatureFlag('search-algorithm');

const results = searchVariant === 'hybrid'
  ? await hybridSearch(query)
  : await vectorOnlySearch(query);

// 메트릭 수집
trackMetric('search_variant', searchVariant);
trackMetric('click_position', clickedPosition);
```

### 8.3 원리 준수 체크리스트

```
□ 코사인 유사도가 정규화된 벡터에서 계산되는가?
□ BM25 k1, b 파라미터가 표준 범위인가?
□ RRF k=60 상수가 사용되는가?
□ HNSW ef_search가 recall 요구사항을 충족하는가?
□ HyDE가 짧은 쿼리에만 적용되는가?
□ Reranking이 상위 N개에만 적용되는가?
```

---

## 9. 참고 자료

### 학술 자료

- **BM25**: Robertson, S., & Zaragoza, H. (2009). The Probabilistic Relevance Framework
- **HNSW**: Malkov, Y. A., & Yashunin, D. A. (2018). Efficient and Robust Approximate Nearest Neighbor Search
- **HyDE**: Gao, L., et al. (2022). Precise Zero-Shot Dense Retrieval without Relevance Labels
- **RRF**: Cormack, G. V., et al. (2009). Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods

### 기술 문서

- Gemini Embedding API: https://ai.google.dev/gemini-api/docs/embeddings
- pgvector 문서: https://github.com/pgvector/pgvector
- Cohere Rerank: https://docs.cohere.com/docs/rerank

---

## 10. 관련 문서

| 문서 | 관계 |
|------|------|
| [ai-inference.md](./ai-inference.md) | AI 추론, Gemini API |
| [security-patterns.md](./security-patterns.md) | API 보안, Rate Limiting |
| [design-system.md](./design-system.md) | UI 검색 결과 표시 |

---

## 11. ADR 역참조

이 원리 문서를 참조하는 ADR 목록:

| ADR | 제목 | 관련 내용 |
|-----|------|----------|
| [ADR-014](../adr/ADR-014-caching-strategy.md) | 캐싱 전략 | 하이브리드 검색, HyDE |
| [ADR-016](../adr/ADR-016-web-mobile-sync.md) | 웹-모바일 싱크 | 벡터 데이터 동기화 |
| [ADR-029](../adr/ADR-029-affiliate-integration.md) | 어필리에이트 통합 | 제품 매칭 RAG 파이프라인 |

---

**Version**: 1.1 | **Created**: 2026-01-19 | **Updated**: 2026-01-19
**소스 리서치**: RAG-OPT-1-R1, RAG-OPT-2-R1, RAG-OPT-3-R1, RAG-OPT-4-R1, EMB-1-R1, EMB-2-R1, EMB-3-R1, EMB-4-R1, VDB-1-R1, VDB-2-R1, VDB-3-R1, VDB-4-R1
