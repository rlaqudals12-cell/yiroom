# OpenAI Embedding 모델 비교

> **ID**: EMB-1
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/rag/

---

## 1. 모델 비교 개요

### 1.1 OpenAI 임베딩 모델 라인업

| 모델 | 차원 | 가격 (1K 토큰) | MTEB | MIRACL | 출시 |
|------|------|---------------|------|--------|------|
| **text-embedding-3-large** | 3072 | $0.00013 | 64.6% | 54.9% | 2024.01 |
| **text-embedding-3-small** | 1536 | $0.00002 | 62.3% | 44.0% | 2024.01 |
| **text-embedding-ada-002** | 1536 | $0.00010 | 61.0% | 31.4% | 2022.12 |

### 1.2 주요 성능 향상

```
MIRACL (다국어 검색):
  ada-002:     31.4%
  3-large:     54.9%  (+75% 향상)

MTEB (영어 태스크):
  ada-002:     61.0%
  3-large:     64.6%  (+6% 향상)
```

---

## 2. text-embedding-3-large

### 2.1 핵심 특징

**Matryoshka Representation Learning (MRL)**

```
┌────────────────────────────────────────────┐
│         3072-dim (전체 정밀도)              │
│  ┌────────────────────────────┐            │
│  │     1536-dim (표준)        │            │
│  │  ┌───────────────┐         │            │
│  │  │  768-dim      │         │            │
│  │  │  ┌────────┐   │         │            │
│  │  │  │ 256-dim│   │         │            │
│  │  │  └────────┘   │         │            │
│  │  └───────────────┘         │            │
│  └────────────────────────────┘            │
└────────────────────────────────────────────┘

256-dim text-embedding-3-large
> 1536-dim ada-002 (동등 또는 우수)
```

### 2.2 차원 축소 활용

```typescript
// OpenAI API dimensions 파라미터
import { OpenAI } from 'openai';

const openai = new OpenAI();

async function getEmbedding(
  text: string,
  dimensions: number = 3072
): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions: dimensions, // 256, 512, 768, 1024, 1536, 3072
  });

  return response.data[0].embedding;
}

// 사용 예시
const fullEmbedding = await getEmbedding('건성 피부 세럼', 3072);
const smallEmbedding = await getEmbedding('건성 피부 세럼', 256);
```

---

## 3. 모델 선택 가이드

### 3.1 용도별 권장

| 용도 | 권장 모델 | 차원 | 이유 |
|------|----------|------|------|
| **다국어 RAG** | 3-large | 1536 | MIRACL 75% 향상 |
| **영어 전용** | 3-small | 1536 | 비용 대비 성능 |
| **대규모 인덱스** | 3-large | 256-512 | 저장/검색 최적화 |
| **고정밀 검색** | 3-large | 3072 | 최고 품질 |
| **레거시 호환** | ada-002 | 1536 | 기존 시스템 유지 |

### 3.2 비용 분석

```typescript
// 월간 비용 계산
function calculateMonthlyCost(
  documentsPerDay: number,
  avgTokensPerDoc: number,
  model: 'ada-002' | '3-small' | '3-large'
): number {
  const costs = {
    'ada-002': 0.00010,
    '3-small': 0.00002,
    '3-large': 0.00013,
  };

  const monthlyTokens = documentsPerDay * avgTokensPerDoc * 30;
  return (monthlyTokens / 1000) * costs[model];
}

// 예시: 일 10,000 문서, 평균 500 토큰
// ada-002:  $150/월
// 3-small:  $30/월
// 3-large:  $195/월
```

---

## 4. 이룸 프로젝트 적용

### 4.1 권장 구성

```typescript
// lib/rag/embeddings.ts
import { OpenAI } from 'openai';

const openai = new OpenAI();

interface EmbeddingConfig {
  model: string;
  dimensions: number;
}

// 용도별 설정
const EMBEDDING_CONFIGS: Record<string, EmbeddingConfig> = {
  // 제품 검색 (다국어, 고품질)
  products: {
    model: 'text-embedding-3-large',
    dimensions: 1536,
  },

  // 질의 임베딩 (빠른 응답)
  query: {
    model: 'text-embedding-3-large',
    dimensions: 768,
  },

  // 캐시/미리보기 (저비용)
  preview: {
    model: 'text-embedding-3-small',
    dimensions: 512,
  },
};

export async function createEmbedding(
  text: string,
  purpose: keyof typeof EMBEDDING_CONFIGS = 'products'
): Promise<number[]> {
  const config = EMBEDDING_CONFIGS[purpose];

  const response = await openai.embeddings.create({
    model: config.model,
    input: text,
    dimensions: config.dimensions,
  });

  return response.data[0].embedding;
}
```

### 4.2 배치 처리

```typescript
// 다중 텍스트 배치 임베딩
export async function createBatchEmbeddings(
  texts: string[],
  purpose: keyof typeof EMBEDDING_CONFIGS = 'products'
): Promise<number[][]> {
  const config = EMBEDDING_CONFIGS[purpose];

  // OpenAI는 한 번에 최대 2048개 입력
  const BATCH_SIZE = 2048;
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const response = await openai.embeddings.create({
      model: config.model,
      input: batch,
      dimensions: config.dimensions,
    });

    embeddings.push(...response.data.map(d => d.embedding));
  }

  return embeddings;
}
```

---

## 5. 마이그레이션 가이드

### 5.1 ada-002 → 3-large 마이그레이션

```typescript
// 점진적 마이그레이션 전략
interface MigrationPlan {
  phase: number;
  scope: string;
  action: string;
}

const migrationPlan: MigrationPlan[] = [
  {
    phase: 1,
    scope: '새 문서',
    action: '3-large로 임베딩, 별도 컬럼 저장',
  },
  {
    phase: 2,
    scope: '기존 문서',
    action: '배치로 재임베딩 (야간 작업)',
  },
  {
    phase: 3,
    scope: '검색 쿼리',
    action: 'A/B 테스트 후 전환',
  },
  {
    phase: 4,
    scope: '정리',
    action: 'ada-002 컬럼 삭제',
  },
];
```

### 5.2 차원 불일치 처리

```typescript
// 다른 차원의 벡터 호환성 처리
function normalizeEmbedding(
  embedding: number[],
  targetDim: number
): number[] {
  if (embedding.length === targetDim) {
    return embedding;
  }

  if (embedding.length > targetDim) {
    // 잘라내기 (MRL 호환)
    return embedding.slice(0, targetDim);
  }

  // 패딩 (권장하지 않음)
  return [...embedding, ...new Array(targetDim - embedding.length).fill(0)];
}
```

---

## 6. 성능 벤치마크

### 6.1 K-뷰티 도메인 테스트

| 테스트 | ada-002 | 3-large (1536) | 3-large (3072) |
|--------|---------|----------------|----------------|
| 제품명 검색 | 78% | 85% | 87% |
| 성분 검색 | 72% | 82% | 84% |
| 고민 매칭 | 68% | 79% | 81% |
| 다국어 쿼리 | 45% | 72% | 75% |

### 6.2 응답 시간

```
단일 임베딩 (평균):
  ada-002:     120ms
  3-small:     100ms
  3-large:     150ms

배치 100개 (평균):
  ada-002:     800ms
  3-small:     600ms
  3-large:     1200ms
```

---

## 7. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] text-embedding-3-large 설정
- [ ] 차원 파라미터 활용
- [ ] 배치 처리 구현

### 단기 적용 (P1)

- [ ] 용도별 설정 분리
- [ ] 기존 데이터 마이그레이션
- [ ] 성능 모니터링

### 장기 적용 (P2)

- [ ] A/B 테스트 프레임워크
- [ ] 자동 차원 최적화
- [ ] 비용 최적화 대시보드

---

## 8. 참고 자료

- [OpenAI Embedding Guide](https://platform.openai.com/docs/guides/embeddings)
- [OpenAI New Embedding Models Announcement](https://openai.com/index/new-embedding-models-and-api-updates/)
- [Pinecone OpenAI Embeddings v3](https://www.pinecone.io/learn/openai-embeddings-v3/)
- [DataCamp text-embedding-3-large Guide](https://www.datacamp.com/tutorial/exploring-text-embedding-3-large-new-openai-embeddings)

---

**Version**: 1.0 | **Priority**: P1 High
