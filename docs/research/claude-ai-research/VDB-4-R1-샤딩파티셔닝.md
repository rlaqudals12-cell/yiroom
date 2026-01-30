# 벡터 DB 샤딩 및 파티셔닝

> **ID**: VDB-4
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/supabase/

---

## 1. 개요

### 1.1 수평 확장 필요성

```
벡터 데이터 성장 시나리오:
  Phase 1:   10K 벡터   → 단일 노드 충분
  Phase 2:  100K 벡터   → 인덱스 최적화 필요
  Phase 3:    1M 벡터   → 메모리 증설 필요
  Phase 4:   10M 벡터   → 파티셔닝 필요
  Phase 5:  100M+ 벡터  → 샤딩 필요
```

### 1.2 핵심 개념

| 개념 | 설명 | 목적 |
|------|------|------|
| **샤딩** | 데이터를 여러 노드에 분산 | 쓰기 확장성 |
| **파티셔닝** | 테이블을 논리적으로 분할 | 읽기 효율성 |
| **복제** | 데이터 사본 생성 | 고가용성, 읽기 확장 |

---

## 2. 파티셔닝 전략

### 2.1 PostgreSQL 테이블 파티셔닝

```sql
-- 범위 파티셔닝 (날짜 기반)
CREATE TABLE products (
  id uuid,
  name text,
  embedding vector(1536),
  created_at timestamptz,
  category text
) PARTITION BY RANGE (created_at);

-- 월별 파티션 생성
CREATE TABLE products_2026_01 PARTITION OF products
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE products_2026_02 PARTITION OF products
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

### 2.2 리스트 파티셔닝 (카테고리 기반)

```sql
-- 카테고리별 파티셔닝
CREATE TABLE products (
  id uuid,
  name text,
  embedding vector(1536),
  category text
) PARTITION BY LIST (category);

-- 카테고리별 파티션
CREATE TABLE products_skincare PARTITION OF products
  FOR VALUES IN ('skincare', 'moisturizer', 'serum');

CREATE TABLE products_makeup PARTITION OF products
  FOR VALUES IN ('makeup', 'foundation', 'lipstick');

CREATE TABLE products_haircare PARTITION OF products
  FOR VALUES IN ('haircare', 'shampoo', 'conditioner');

-- 각 파티션에 벡터 인덱스
CREATE INDEX idx_products_skincare_emb ON products_skincare
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_products_makeup_emb ON products_makeup
  USING hnsw (embedding vector_cosine_ops);
```

### 2.3 해시 파티셔닝

```sql
-- 해시 파티셔닝 (균등 분산)
CREATE TABLE products (
  id uuid,
  name text,
  embedding vector(1536)
) PARTITION BY HASH (id);

-- 4개 파티션
CREATE TABLE products_p0 PARTITION OF products
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE products_p1 PARTITION OF products
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE products_p2 PARTITION OF products
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE products_p3 PARTITION OF products
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

---

## 3. 샤딩 전략

### 3.1 벡터 인식 샤딩

```
벡터 클러스터 기반 샤딩:
┌────────────────────────────────────────────┐
│                                            │
│  Cluster 1 (뷰티)    Cluster 2 (건강)       │
│  ┌──────────────┐   ┌──────────────┐      │
│  │  Shard 1     │   │  Shard 2     │      │
│  │  ●●●●●●      │   │  ○○○○○○      │      │
│  └──────────────┘   └──────────────┘      │
│                                            │
│  쿼리 시: 관련 클러스터만 검색              │
│                                            │
└────────────────────────────────────────────┘
```

### 3.2 샤드 수 권장

```typescript
// 샤드 수 계산
function recommendShardCount(vectorCount: number): number {
  // 권장: 1-2 샤드 / 50-200M 벡터
  const shardsPerUnit = 2;
  const vectorsPerUnit = 200_000_000;

  const shards = Math.ceil(vectorCount / vectorsPerUnit) * shardsPerUnit;

  // 최소 1, 최대 64
  return Math.max(1, Math.min(shards, 64));
}

// 예시
// 1억 벡터 → 1-2 샤드
// 10억 벡터 → 10-20 샤드
```

### 3.3 수동 샤딩 문제점

```
수동 샤딩의 문제:

1. 데이터 불균형 (핫스팟)
   - 특정 샤드에 데이터 집중
   - 일부 노드 과부하

2. 리샤딩 어려움
   - 샤드 수 변경 시 대규모 데이터 이동
   - 다운타임 발생

3. 메타데이터 오버헤드
   - 샤드 수 증가 → 관리 복잡도 증가
```

---

## 4. 분산 검색 패턴

### 4.1 Scatter-Gather 패턴

```typescript
// scatter-gather 검색 구현
async function distributedVectorSearch(
  queryVector: number[],
  shards: DatabaseConnection[],
  topK: number
): Promise<SearchResult[]> {
  // 1. Scatter: 모든 샤드에 병렬 쿼리
  const shardResults = await Promise.all(
    shards.map(shard =>
      shard.query(
        `SELECT id, name, embedding <=> $1 AS distance
         FROM products
         ORDER BY distance
         LIMIT $2`,
        [queryVector, topK * 2] // 여유분 확보
      )
    )
  );

  // 2. Gather: 결과 병합 및 정렬
  const allResults = shardResults.flat();
  allResults.sort((a, b) => a.distance - b.distance);

  // 3. 상위 K개 반환
  return allResults.slice(0, topK);
}
```

### 4.2 라우팅 기반 검색

```typescript
// 카테고리 기반 라우팅
async function routedVectorSearch(
  queryVector: number[],
  category: string,
  topK: number
): Promise<SearchResult[]> {
  // 1. 관련 샤드 결정
  const targetShard = getShardByCategory(category);

  // 2. 단일 샤드 검색 (효율적)
  const results = await targetShard.query(
    `SELECT id, name, embedding <=> $1 AS distance
     FROM products
     WHERE category = $2
     ORDER BY distance
     LIMIT $3`,
    [queryVector, category, topK]
  );

  return results;
}

function getShardByCategory(category: string): DatabaseConnection {
  const categoryMapping = {
    skincare: 'shard_beauty',
    makeup: 'shard_beauty',
    haircare: 'shard_beauty',
    supplements: 'shard_health',
    fitness: 'shard_health',
  };

  return getConnection(categoryMapping[category] || 'shard_default');
}
```

---

## 5. Supabase 파티셔닝 구현

### 5.1 기본 파티션 테이블

```sql
-- 부모 테이블 생성
CREATE TABLE products_partitioned (
  id uuid DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  embedding vector(1536),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id, category)
) PARTITION BY LIST (category);

-- RLS 활성화
ALTER TABLE products_partitioned ENABLE ROW LEVEL SECURITY;

-- 파티션 생성
CREATE TABLE products_skincare PARTITION OF products_partitioned
  FOR VALUES IN ('skincare');

CREATE TABLE products_makeup PARTITION OF products_partitioned
  FOR VALUES IN ('makeup');

CREATE TABLE products_other PARTITION OF products_partitioned
  DEFAULT;
```

### 5.2 검색 함수

```sql
-- 파티션 인식 검색 함수
CREATE OR REPLACE FUNCTION match_products_partitioned(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  category text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF filter_category IS NOT NULL THEN
    -- 특정 파티션만 검색 (최적화)
    RETURN QUERY
    SELECT
      p.id,
      p.name,
      p.category,
      1 - (p.embedding <=> query_embedding) AS similarity
    FROM products_partitioned p
    WHERE p.category = filter_category
      AND 1 - (p.embedding <=> query_embedding) > match_threshold
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count;
  ELSE
    -- 전체 검색
    RETURN QUERY
    SELECT
      p.id,
      p.name,
      p.category,
      1 - (p.embedding <=> query_embedding) AS similarity
    FROM products_partitioned p
    WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count;
  END IF;
END;
$$;
```

---

## 6. 고급 전략

### 6.1 계층적 파티셔닝

```sql
-- 2단계 파티셔닝: 카테고리 → 날짜
CREATE TABLE products (
  id uuid,
  name text,
  category text,
  created_at date,
  embedding vector(1536)
) PARTITION BY LIST (category);

-- 카테고리 파티션 (1단계)
CREATE TABLE products_skincare PARTITION OF products
  FOR VALUES IN ('skincare')
  PARTITION BY RANGE (created_at);

-- 날짜 서브파티션 (2단계)
CREATE TABLE products_skincare_2026_q1
  PARTITION OF products_skincare
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
```

### 6.2 자동 파티션 관리

```sql
-- 파티션 자동 생성 함수
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  partition_date date;
  partition_name text;
  start_date date;
  end_date date;
BEGIN
  -- 다음 달 파티션 생성
  partition_date := date_trunc('month', CURRENT_DATE + interval '1 month');
  partition_name := 'products_' || to_char(partition_date, 'YYYY_MM');
  start_date := partition_date;
  end_date := partition_date + interval '1 month';

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF products
     FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date
  );

  -- 인덱스 생성
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %I
     USING hnsw (embedding vector_cosine_ops)',
    partition_name || '_emb_idx', partition_name
  );
END;
$$;
```

---

## 7. 모니터링

### 7.1 파티션 상태 확인

```sql
-- 파티션별 크기 확인
SELECT
  child.relname AS partition_name,
  pg_size_pretty(pg_relation_size(child.oid)) AS size,
  pg_stat_get_live_tuples(child.oid) AS row_count
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname = 'products_partitioned'
ORDER BY child.relname;
```

### 7.2 쿼리 분석

```sql
-- 파티션 프루닝 확인
EXPLAIN (ANALYZE, VERBOSE)
SELECT * FROM products_partitioned
WHERE category = 'skincare'
  AND embedding <=> $1 < 0.3;

-- 좋은 결과: 특정 파티션만 스캔
-- 나쁜 결과: 모든 파티션 스캔
```

---

## 8. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] 현재 데이터 규모 확인
- [ ] 파티셔닝 필요 여부 평가
- [ ] 기본 카테고리 파티션 계획

### 단기 적용 (P1)

- [ ] 파티션 테이블 마이그레이션
- [ ] 검색 함수 최적화
- [ ] 모니터링 설정

### 장기 적용 (P2)

- [ ] 자동 파티션 관리
- [ ] 샤딩 전략 검토 (100M+)
- [ ] 분산 검색 구현

---

## 9. 참고 자료

- [Milvus Sharding Guide](https://milvus.io/blog/why-manual-sharding-is-a-bad-idea-for-vector-databases-and-how-to-fix-it.md)
- [Weaviate Scaling Guide](https://weaviate.io/blog/scaling-and-weaviate)
- [Zilliz Horizontal Scaling](https://zilliz.com/ai-faq/what-does-it-mean-for-a-vector-database-to-scale-horizontally-and-how-do-systems-achieve-this-for-example-through-sharding-the-vector-index-across-multiple-nodes-or-partitions)
- [Vector DB Sharding Best Practices](https://medium.com/@CarlosMartes/mastering-sharding-partitioning-and-segments-for-scalable-vector-databases-1f7b2ded3015)

---

**Version**: 1.0 | **Priority**: P1 High
