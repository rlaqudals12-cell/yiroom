# 벡터 인덱스 전략: IVFFlat vs HNSW

> **ID**: VDB-3
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/supabase/

---

## 1. 인덱스 유형 개요

### 1.1 비교 요약

| 특성 | IVFFlat | HNSW |
|------|---------|------|
| **알고리즘** | 클러스터링 기반 | 그래프 기반 |
| **빌드 시간** | 빠름 (128초) | 느림 (4065초, 32x) |
| **인덱스 크기** | 작음 (257MB) | 큼 (729MB, 2.8x) |
| **쿼리 속도** | 느림 (2.6 QPS) | 빠름 (40.5 QPS, 15.5x) |
| **Recall** | 높음 (0.998) | 높음 (0.998) |
| **업데이트 내성** | 낮음 | 높음 |

### 1.2 알고리즘 원리

```
IVFFlat (Inverted File Flat):
┌────────────────────────────────────────┐
│  오프라인: k-means 클러스터링           │
│                                        │
│    ●●●     ○○○     △△△                │
│   클러스터1  클러스터2  클러스터3          │
│                                        │
│  온라인: 쿼리와 가장 가까운 클러스터 탐색  │
│  → 해당 클러스터 내에서만 검색           │
└────────────────────────────────────────┘

HNSW (Hierarchical Navigable Small Worlds):
┌────────────────────────────────────────┐
│  다층 그래프 구조                       │
│                                        │
│  Layer 2:  ○───────────○ (희소)        │
│              ↓                         │
│  Layer 1:  ○──○──○──○──○ (중간)        │
│              ↓                         │
│  Layer 0:  ●●●●●●●●●●●● (조밀)         │
│                                        │
│  검색: 상위 레이어 → 하위 레이어로 탐색  │
└────────────────────────────────────────┘
```

---

## 2. IVFFlat 상세

### 2.1 인덱스 생성

```sql
-- IVFFlat 인덱스 생성
CREATE INDEX idx_products_ivfflat ON products
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- lists 파라미터 계산
-- 권장: rows / 1000
-- 10만 행 → lists = 100
-- 100만 행 → lists = 1000
-- 1000만 행 → lists = 10000
```

### 2.2 검색 파라미터

```sql
-- probes: 검색할 클러스터 수
-- 높을수록 recall ↑, 속도 ↓
SET ivfflat.probes = 10;

-- 권장값
-- recall 90%: probes = sqrt(lists)
-- recall 99%: probes = lists / 10
```

### 2.3 장단점

**장점:**
- 빠른 인덱스 빌드
- 적은 메모리 사용
- 단순한 구조

**단점:**
- 데이터 업데이트 시 성능 저하
- 클러스터 재계산 필요
- 쿼리 속도 상대적 느림

### 2.4 적합한 경우

```
✅ 배치 업데이트 (일일 1회 등)
✅ 메모리 제한 환경
✅ 인덱스 재구축 허용
✅ 중소 규모 데이터 (< 10M)
```

---

## 3. HNSW 상세

### 3.1 인덱스 생성

```sql
-- HNSW 인덱스 생성
CREATE INDEX idx_products_hnsw ON products
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 파라미터 설명
-- m: 레이어당 최대 연결 수 (기본 16, 범위 2-100)
--    높을수록: recall ↑, 메모리 ↑, 빌드 시간 ↑
-- ef_construction: 그래프 구성 시 후보 리스트 (기본 64, 범위 4-1000)
--    높을수록: recall ↑, 빌드 시간 ↑
```

### 3.2 검색 파라미터

```sql
-- ef_search: 검색 시 후보 리스트 크기
-- 높을수록 recall ↑, 속도 ↓
SET hnsw.ef_search = 100;

-- 권장값
-- recall 90%: ef_search = 40
-- recall 95%: ef_search = 100
-- recall 99%: ef_search = 200
```

### 3.3 장단점

**장점:**
- 15x 이상 빠른 쿼리
- 실시간 업데이트 내성
- 높은 recall 유지

**단점:**
- 32x 느린 인덱스 빌드
- 2.8x 많은 메모리 사용
- 파라미터 튜닝 필요

### 3.4 적합한 경우

```
✅ 실시간 검색 필요
✅ 빈번한 데이터 업데이트
✅ 충분한 메모리
✅ 대규모 데이터 (> 10M)
```

---

## 4. 벤치마크 비교

### 4.1 빌드 시간

| 데이터 크기 | IVFFlat | HNSW | 비율 |
|------------|---------|------|------|
| 100K | 5초 | 30초 | 6x |
| 1M | 50초 | 400초 | 8x |
| 10M | 500초 | 4000초 | 8x |

### 4.2 쿼리 속도 (QPS @ 99% recall)

| 데이터 크기 | IVFFlat | HNSW | 비율 |
|------------|---------|------|------|
| 100K | 50 | 500 | 10x |
| 1M | 10 | 150 | 15x |
| 10M | 2 | 40 | 20x |

### 4.3 메모리 사용

| 차원 | 벡터 수 | IVFFlat | HNSW |
|------|--------|---------|------|
| 768 | 1M | 3GB | 8GB |
| 1536 | 1M | 6GB | 15GB |
| 3072 | 1M | 12GB | 30GB |

---

## 5. 파라미터 튜닝 가이드

### 5.1 IVFFlat 튜닝

```typescript
// lists 계산
function calculateLists(rowCount: number): number {
  // 기본: rows / 1000
  // 최소: 10, 최대: rowCount / 10
  const lists = Math.floor(rowCount / 1000);
  return Math.max(10, Math.min(lists, rowCount / 10));
}

// probes 계산
function calculateProbes(lists: number, targetRecall: number): number {
  if (targetRecall >= 0.99) return Math.ceil(lists / 10);
  if (targetRecall >= 0.95) return Math.ceil(Math.sqrt(lists) * 2);
  return Math.ceil(Math.sqrt(lists));
}
```

### 5.2 HNSW 튜닝

```typescript
// m 설정
function calculateM(dataSize: string): number {
  // 작은 데이터: 4-8
  // 중간 데이터: 12-16
  // 큰 데이터: 24-48
  const sizes = {
    small: 8,   // < 100K
    medium: 16, // 100K - 10M
    large: 32,  // > 10M
  };
  return sizes[dataSize];
}

// ef_construction 설정
function calculateEfConstruction(m: number): number {
  // 일반적으로 m의 4배
  return m * 4;
}

// ef_search 설정
function calculateEfSearch(targetRecall: number): number {
  if (targetRecall >= 0.99) return 200;
  if (targetRecall >= 0.95) return 100;
  return 40;
}
```

---

## 6. 이룸 프로젝트 권장

### 6.1 현재 상황

```
- 제품 수: ~10,000 (성장 중)
- 목표: 100,000+
- 업데이트 빈도: 일일 배치
- 검색 빈도: 높음 (실시간)
```

### 6.2 권장 설정

```sql
-- HNSW 권장 (쿼리 속도 중요)
CREATE INDEX idx_products_hnsw ON products
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 검색 시 설정
SET hnsw.ef_search = 100;
```

### 6.3 성장 단계별 전략

| 단계 | 벡터 수 | 인덱스 | 이유 |
|------|--------|--------|------|
| 현재 | 10K | HNSW | 실시간 검색 |
| 성장 | 100K | HNSW | 업데이트 내성 |
| 대규모 | 1M+ | HNSW + 파티셔닝 | 스케일링 |

---

## 7. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] 현재 인덱스 유형 확인
- [ ] HNSW 인덱스로 변경
- [ ] ef_search 파라미터 설정

### 단기 적용 (P1)

- [ ] 벤치마크 테스트
- [ ] 파라미터 최적화
- [ ] 모니터링 설정

### 장기 적용 (P2)

- [ ] 데이터 증가 모니터링
- [ ] 파티셔닝 계획
- [ ] 인덱스 재구축 자동화

---

## 8. 참고 자료

- [pgvector HNSW vs IVFFlat Study](https://medium.com/@bavalpreetsinghh/pgvector-hnsw-vs-ivfflat-a-comprehensive-study-21ce0aaab931)
- [AWS pgvector Indexing Deep Dive](https://aws.amazon.com/blogs/database/optimize-generative-ai-applications-with-pgvector-indexing-a-deep-dive-into-ivfflat-and-hnsw-techniques/)
- [Vector Indexes Comparison](https://kodesage.ai/blog/vector-indexes-hnsw-vs-ivfflat-vs-ivf-rabitq)
- [Tembo Vector Indexes Guide](https://legacy.tembo.io/blog/vector-indexes-in-pgvector/)

---

**Version**: 1.0 | **Priority**: P1 High
