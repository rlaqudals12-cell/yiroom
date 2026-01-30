# pgvector vs Pinecone 비교

> **ID**: VDB-2
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/rag/

---

## 1. 비교 개요

### 1.1 기본 정보

| 항목 | pgvector | Pinecone |
|------|----------|----------|
| **유형** | PostgreSQL 확장 | 관리형 벡터 DB |
| **소스** | 오픈소스 | 클로즈드 소스 |
| **호스팅** | 셀프/Supabase/AWS | 완전 관리형 |
| **통합** | SQL 기반 | REST API |

### 1.2 벤치마크 요약 (50M 벡터, 768 차원)

```
pgvector + pgvectorscale vs Pinecone:

p95 지연:
  pgvector:     Pinecone s1 대비 28x 낮음
                Pinecone p2 대비 1.4x 낮음

처리량 (QPS):
  pgvector:     471 QPS @ 99% recall
  Pinecone s1:  ~30 QPS
  Pinecone p2:  ~300 QPS

비용:
  pgvector:     Pinecone s1의 25%
                Pinecone p2의 21%
```

---

## 2. 성능 비교

### 2.1 쿼리 성능

| 지표 | pgvector | Pinecone s1 | Pinecone p2 |
|------|----------|-------------|-------------|
| QPS | 471 | ~30 | ~300 |
| p95 지연 | 낮음 | 28x 높음 | 1.4x 높음 |
| Recall @ 99% | ✅ | ✅ | - |
| Recall @ 90% | ✅ | - | ✅ |

### 2.2 정확도

```
정확도 비교:
  pgvector:   0.99 accuracy
  Pinecone:   0.94 accuracy

pgvector은 QPS 4배 이상 높으면서 정확도도 더 높음
```

### 2.3 비용 효율성

```
비용 효율성 (Supabase 벤치마크):
  pgvector:   3.6x 더 비용 효율적
  pgvector:   4x 이상 높은 QPS
```

---

## 3. 비용 분석

### 3.1 pgvector (Supabase)

```typescript
// Supabase 요금 (2026)
const supabasePricing = {
  free: {
    vectors: 50000,
    storage: '500MB',
    cost: 0,
  },
  pro: {
    vectors: 'unlimited',
    storage: '8GB',
    cost: 25, // $/month
    additionalStorage: 0.125, // $/GB
  },
  enterprise: {
    vectors: 'unlimited',
    storage: 'custom',
    cost: 'custom',
  },
};

// 예상 비용 (10M 벡터, 1536 차원)
// 저장 용량: 10M * 1536 * 4bytes = ~60GB
// Pro + 52GB 추가 = $25 + $6.5 = ~$32/월
```

### 3.2 Pinecone

```typescript
// Pinecone 요금 (2026)
const pineconePricing = {
  starter: {
    vectors: 100000,
    cost: 0,
  },
  standard: {
    storage: 0.33, // $/GB/월
    reads: 'usage-based',
    writes: 'usage-based',
  },
  enterprise: {
    cost: 'custom',
  },
};

// 예상 비용 (10M 벡터, 1536 차원)
// 저장: ~60GB * $0.33 = ~$20/월
// + 읽기/쓰기 비용 (트래픽에 따라)
// 총: $100 ~ $2000+/월 (트래픽 의존)
```

### 3.3 TCO 비교

| 시나리오 | pgvector (Supabase) | Pinecone |
|----------|---------------------|----------|
| 저트래픽 (1K 쿼리/일) | ~$32/월 | ~$100/월 |
| 중트래픽 (10K 쿼리/일) | ~$50/월 | ~$500/월 |
| 고트래픽 (100K 쿼리/일) | ~$100/월 | ~$2000/월 |

---

## 4. 기능 비교

### 4.1 검색 기능

| 기능 | pgvector | Pinecone |
|------|----------|----------|
| 코사인 유사도 | ✅ | ✅ |
| 유클리드 거리 | ✅ | ✅ |
| 내적 | ✅ | ✅ |
| 메타데이터 필터 | ✅ (SQL) | ✅ |
| 하이브리드 검색 | ✅ (Full-Text) | ✅ (Sparse) |
| 네임스페이스 | ❌ (테이블 분리) | ✅ |

### 4.2 운영 기능

| 기능 | pgvector | Pinecone |
|------|----------|----------|
| 자동 스케일링 | ❌ (수동) | ✅ |
| 백업/복구 | ✅ (PostgreSQL) | ✅ |
| 모니터링 | ✅ (pg_stat) | ✅ (대시보드) |
| 고가용성 | ✅ (레플리카) | ✅ (자동) |

### 4.3 개발 경험

| 측면 | pgvector | Pinecone |
|------|----------|----------|
| 학습 곡선 | 높음 (SQL 필요) | 낮음 |
| SDK | Supabase Client | 공식 SDK |
| 통합 복잡도 | SQL + 앱 코드 | API만 |
| 트랜잭션 | ✅ (ACID) | ❌ |

---

## 5. 장단점 정리

### 5.1 pgvector

**장점:**
- 75% 이상 비용 절감
- PostgreSQL 통합 (조인, 트랜잭션)
- 오픈소스, 벤더 락인 없음
- 기존 인프라 활용

**단점:**
- 운영 복잡도 높음
- 튜닝 필요 (인덱스, 메모리)
- 50-100M 벡터 이상 시 한계
- 자동 스케일링 없음

### 5.2 Pinecone

**장점:**
- 완전 관리형 (운영 부담 ↓)
- 간단한 API
- 자동 스케일링
- 전용 최적화

**단점:**
- 비용 높음
- 벤더 락인
- 트랜잭션 미지원
- 데이터 이전 어려움

---

## 6. 선택 가이드

### 6.1 pgvector 선택 시

```
✅ 이미 PostgreSQL/Supabase 사용 중
✅ 비용 최적화 중요
✅ 관계형 데이터와 조인 필요
✅ 벡터 수 < 50M
✅ 운영 역량 보유
```

### 6.2 Pinecone 선택 시

```
✅ 운영 부담 최소화 필요
✅ 빠른 프로토타이핑
✅ 벡터 수 > 100M (대규모)
✅ 인프라 팀 없음
✅ 예산 충분
```

### 6.3 이룸 프로젝트 권장

```
현재: pgvector (Supabase)
이유:
  1. 이미 Supabase 사용 중
  2. 제품 수 ~100K 이하
  3. 비용 효율성 중요
  4. SQL 기반 복합 쿼리 필요

향후 검토 (100M+ 벡터 시):
  - pgvectorscale 확장
  - 또는 Pinecone으로 마이그레이션
```

---

## 7. 마이그레이션 고려사항

### 7.1 pgvector → Pinecone

```typescript
// 데이터 추출
const { data } = await supabase
  .from('products')
  .select('id, embedding, name, category');

// Pinecone 업로드
for (const batch of chunk(data, 100)) {
  await pinecone.upsert({
    vectors: batch.map(item => ({
      id: item.id,
      values: item.embedding,
      metadata: { name: item.name, category: item.category },
    })),
  });
}
```

### 7.2 Pinecone → pgvector

```typescript
// Pinecone에서 추출
const results = await pinecone.query({
  vector: dummyVector,
  topK: 10000,
  includeValues: true,
  includeMetadata: true,
});

// pgvector에 삽입
for (const match of results.matches) {
  await supabase.from('products').insert({
    id: match.id,
    embedding: match.values,
    name: match.metadata.name,
  });
}
```

---

## 8. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] 현재 pgvector 성능 벤치마크
- [ ] 인덱스 최적화
- [ ] 쿼리 플랜 분석

### 단기 적용 (P1)

- [ ] pgvectorscale 평가
- [ ] 비용 모니터링
- [ ] 성능 알림 설정

### 장기 적용 (P2)

- [ ] 스케일링 계획 수립
- [ ] Pinecone POC (필요 시)
- [ ] 하이브리드 전략 검토

---

## 9. 참고 자료

- [Supabase pgvector vs Pinecone](https://supabase.com/blog/pgvector-vs-pinecone)
- [Pinecone vs pgvector Analysis](https://www.myscale.com/blog/pinecone-vs-pgvector-cost-performance-analysis/)
- [Why We Replaced Pinecone with PGVector](https://www.confident-ai.com/blog/why-we-replaced-pinecone-with-pgvector)
- [pgvector is Now Faster than Pinecone](https://www.tigerdata.com/blog/pgvector-is-now-as-fast-as-pinecone-at-75-less-cost)

---

**Version**: 1.0 | **Priority**: P1 High
