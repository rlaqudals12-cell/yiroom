# pgvector 성능 최적화

> **ID**: VDB-1
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/supabase/

---

## 1. pgvector 개요

### 1.1 현재 상태

```
이룸 프로젝트 현황:
- Supabase + pgvector 사용
- 임베딩 차원: 1536 (OpenAI) / 3072 (Gemini)
- 현재 규모: ~10,000 제품
- 목표 규모: 100,000+ 제품
```

### 1.2 pgvector 0.8.0 개선사항 (2026)

| 개선 항목 | 효과 |
|----------|------|
| 쿼리 처리 | 최대 9배 빠름 |
| 검색 정확도 | 최대 100배 향상 |
| 비용 추정 | 더 정확한 쿼리 플래너 |
| 반복 스캔 | 필요한 행을 찾을 때까지 계속 |

---

## 2. 인덱스 설정

### 2.1 HNSW 인덱스 (권장)

```sql
-- HNSW 인덱스 생성
CREATE INDEX idx_products_embedding ON products
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 파라미터 설명
-- m: 레이어당 최대 연결 수 (기본 16)
-- ef_construction: 그래프 구성 시 후보 리스트 크기 (기본 64)
```

### 2.2 검색 파라미터 튜닝

```sql
-- 검색 시 동적 후보 리스트 크기 (기본 40)
SET hnsw.ef_search = 100;

-- 세션 전체 또는 트랜잭션 단위로 설정 가능
BEGIN;
SET LOCAL hnsw.ef_search = 200;
-- 높은 recall 필요한 쿼리
COMMIT;
```

### 2.3 IVFFlat 인덱스 (대안)

```sql
-- IVFFlat 인덱스 생성
CREATE INDEX idx_products_embedding_ivf ON products
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- lists 권장값: rows / 1000
-- 100,000 행 → lists = 100
-- 1,000,000 행 → lists = 1000

-- 검색 시 프로브 수 설정
SET ivfflat.probes = 10;
```

---

## 3. 메모리 최적화

### 3.1 핵심 설정

```sql
-- 인덱스 빌드용 메모리
ALTER SYSTEM SET maintenance_work_mem = '2GB';

-- 작업 메모리 (쿼리당)
ALTER SYSTEM SET work_mem = '256MB';

-- 공유 버퍼 (총 RAM의 25%)
ALTER SYSTEM SET shared_buffers = '4GB';

-- 유효 캐시 크기 (총 RAM의 75%)
ALTER SYSTEM SET effective_cache_size = '12GB';

-- 설정 적용
SELECT pg_reload_conf();
```

### 3.2 메모리 요구사항 계산

```typescript
// 인덱스 메모리 추정
function estimateIndexMemory(
  vectorCount: number,
  dimensions: number,
  indexType: 'hnsw' | 'ivfflat'
): number {
  const bytesPerFloat = 4;
  const vectorSize = dimensions * bytesPerFloat;

  if (indexType === 'hnsw') {
    // HNSW: 벡터 + 그래프 연결 (약 2-3배)
    return vectorCount * vectorSize * 2.5;
  }

  // IVFFlat: 벡터 + 메타데이터 (약 1.1배)
  return vectorCount * vectorSize * 1.1;
}

// 예시: 100,000 벡터, 1536 차원
// HNSW:    ~1.5GB
// IVFFlat: ~0.7GB
```

---

## 4. 쿼리 최적화

### 4.1 쿼리 플랜 분석

```sql
-- 쿼리 플랜 확인
EXPLAIN (ANALYZE, VERBOSE, BUFFERS)
SELECT id, name, embedding <=> $1 AS distance
FROM products
ORDER BY embedding <=> $1
LIMIT 10;

-- 좋은 플랜: Index Scan using idx_products_embedding
-- 나쁜 플랜: Seq Scan on products
```

### 4.2 효율적인 검색 쿼리

```sql
-- 기본 유사도 검색
SELECT id, name, 1 - (embedding <=> $1) AS similarity
FROM products
WHERE embedding <=> $1 < 0.3  -- 임계값 필터
ORDER BY embedding <=> $1
LIMIT 10;

-- 메타데이터 필터 + 벡터 검색
SELECT id, name, 1 - (embedding <=> $1) AS similarity
FROM products
WHERE category = 'skincare'
  AND embedding <=> $1 < 0.3
ORDER BY embedding <=> $1
LIMIT 10;
```

### 4.3 Supabase RPC 함수

```sql
-- 최적화된 검색 함수
CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM products p
  WHERE
    (filter_category IS NULL OR p.category = filter_category)
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 5. pgvectorscale 확장

### 5.1 개요

pgvectorscale은 Timescale에서 개발한 pgvector 보완 확장으로, **대규모 벡터 검색 성능을 획기적으로 향상**시킨다.

```
벤치마크 (50M Cohere 임베딩, 768 차원):
- Pinecone s1 대비: 28x 낮은 p95 지연, 16x 높은 처리량
- Pinecone p2 대비: 1.4x 낮은 p95 지연, 1.5x 높은 처리량
- 비용: Pinecone의 21-25%
```

### 5.2 설치 및 사용

```sql
-- 확장 설치
CREATE EXTENSION IF NOT EXISTS vectorscale;

-- DiskANN 인덱스 생성 (대규모 데이터용)
CREATE INDEX idx_products_diskann ON products
USING diskann (embedding);

-- 스트리밍 디스크 ANN으로 메모리 효율적
```

---

## 6. 모니터링

### 6.1 인덱스 상태 확인

```sql
-- 인덱스 크기 확인
SELECT
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexrelname LIKE '%embedding%';

-- 인덱스 사용 통계
SELECT
  indexrelname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE indexrelname LIKE '%embedding%';
```

### 6.2 쿼리 성능 모니터링

```sql
-- 느린 쿼리 확인
SELECT
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE query LIKE '%<=>%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 7. 스케일링 전략

### 7.1 수직 확장

| 규모 | RAM | CPU | 인덱스 |
|------|-----|-----|--------|
| ~100K 벡터 | 8GB | 4 cores | HNSW |
| ~1M 벡터 | 32GB | 8 cores | HNSW |
| ~10M 벡터 | 128GB | 16 cores | HNSW/DiskANN |

### 7.2 수평 확장 (파티셔닝)

```sql
-- 테이블 파티셔닝 (카테고리별)
CREATE TABLE products_partitioned (
  id uuid,
  name text,
  category text,
  embedding vector(1536)
) PARTITION BY LIST (category);

CREATE TABLE products_skincare
  PARTITION OF products_partitioned
  FOR VALUES IN ('skincare');

CREATE TABLE products_makeup
  PARTITION OF products_partitioned
  FOR VALUES IN ('makeup');

-- 각 파티션에 인덱스
CREATE INDEX ON products_skincare
  USING hnsw (embedding vector_cosine_ops);
```

---

## 8. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] HNSW 인덱스 생성
- [ ] ef_search 파라미터 튜닝
- [ ] 쿼리 플랜 분석

### 단기 적용 (P1)

- [ ] 메모리 설정 최적화
- [ ] RPC 함수 최적화
- [ ] 모니터링 설정

### 장기 적용 (P2)

- [ ] pgvectorscale 평가
- [ ] 파티셔닝 전략
- [ ] 읽기 레플리카

---

## 9. 참고 자료

- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [Crunchy Data pgvector Performance](https://www.crunchydata.com/blog/pgvector-performance-for-developers)
- [AWS pgvector 0.8.0 Improvements](https://aws.amazon.com/blogs/database/supercharging-vector-search-performance-and-relevance-with-pgvector-0-8-0-on-amazon-aurora-postgresql/)
- [pgvectorscale GitHub](https://github.com/timescale/pgvectorscale)

---

**Version**: 1.0 | **Priority**: P1 High
