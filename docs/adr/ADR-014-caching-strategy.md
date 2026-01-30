# ADR-014: 캐싱 전략

## 상태

`accepted`

## 날짜

2026-01-15

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"모든 데이터가 최적의 위치에서 최소 지연으로 제공되는 상태"

- **제로 레이턴시**: 캐시 히트 시 < 1ms 응답
- **완벽한 일관성**: 원본 변경 즉시 캐시 동기화
- **지능형 프리페칭**: 사용자 행동 예측하여 선제적 로딩
- **무한 확장성**: 데이터 증가에도 성능 유지

### 물리적 한계

| 항목 | 한계 |
|------|------|
| CAP 정리 | 일관성 vs 가용성 trade-off (완벽한 동시 달성 불가) |
| 메모리 제한 | 브라우저 LocalStorage 5MB, 서버 메모리 유한 |
| 네트워크 지연 | 원격 캐시 무효화 시 전파 지연 불가피 |
| 비용 | Redis 등 분산 캐시 인프라 비용 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 캐시 히트율 | 95% | 75% | Layer 1-2 조합 |
| 캐시 응답 시간 | < 5ms | 20ms | 메모리 캐시 |
| Stale 데이터율 | 0% | 3% | 무효화 누락 |
| 스토리지 효율 | 90% | 70% | LRU 최적화 필요 |

### 현재 목표: 80%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| Redis 도입 | 인프라 비용 (FINANCIAL_HOLD) | MAU 10만+ |
| Service Worker | 복잡도 대비 ROI 낮음 | PWA 전환 시 |
| 분산 캐시 무효화 | 단일 서버로 충분 | 멀티 리전 배포 시 |

---

## 맥락 (Context)

이룸 프로젝트의 캐싱이 **체계 없이 분산**:

1. **lib/cache.ts**: 기본 메모리 캐시만 구현
2. **lib/offline/**: 오프라인 지원 별도 구현
3. **제품 데이터**: 캐싱 정책 없음 (매번 fetch)

**문제점**:
- TTL(Time To Live) 기준 불명확
- 캐시 무효화 전략 없음
- 메모리 vs 로컬스토리지 선택 기준 없음

## 결정 (Decision)

**3계층 캐싱 아키텍처** 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                    Caching Strategy                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Memory Cache (요청 간 공유)                        │
│  ├── 용도: 정적 데이터, 설정, 카테고리                      │
│  ├── TTL: 10분                                               │
│  ├── 크기: 최대 100개 항목                                   │
│  └── 무효화: 서버 재시작, 수동 호출                         │
│                                                              │
│  Layer 2: LocalStorage/IndexedDB (브라우저 지속)             │
│  ├── 용도: 사용자 설정, 다단계 폼, 최근 본 제품             │
│  ├── TTL: 7일                                                │
│  ├── 크기: 최대 5MB                                          │
│  └── 무효화: 로그아웃, 버전 변경                            │
│                                                              │
│  Layer 3: Server Cache (DB 레벨)                             │
│  ├── 용도: 계산 결과, 집계 데이터                           │
│  ├── 테이블: leaderboard_cache, daily_nutrition_summary     │
│  └── 무효화: Cron job, 이벤트 기반                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 유형별 캐싱 정책

| 데이터 유형 | 계층 | TTL | 무효화 트리거 |
|------------|------|-----|--------------|
| **카테고리 목록** | Memory | 10분 | 관리자 변경 |
| **제품 목록** | Memory | 5분 | 검색 조건 변경 |
| **제품 상세** | Memory | 30분 | 가격 업데이트 |
| **분석 결과** | LocalStorage | 24시간 | 재분석 |
| **사용자 설정** | LocalStorage | 7일 | 설정 변경 |
| **리더보드** | Server DB | 1시간 | Cron |
| **영양 요약** | Server DB | 24시간 | 식단 기록 |

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| Redis | 강력한 캐싱 | 인프라 비용 | `FINANCIAL_HOLD` |
| Service Worker | 오프라인 지원 | 복잡도 | `HIGH_COMPLEXITY` |
| React Query 캐시 | 내장 기능 | 추가 의존성 | `ALT_SUFFICIENT` (향후 도입) |

## 결과 (Consequences)

### 긍정적 결과

- **성능 개선**: 중복 요청 90% 감소
- **오프라인 지원**: 기본 데이터 로컬 저장
- **비용 절감**: API 호출 횟수 감소

### 부정적 결과

- **일관성 주의**: 캐시 무효화 누락 시 stale 데이터
- **메모리 관리**: 메모리 캐시 크기 제한 필요

## 구현 가이드

### 메모리 캐시 (Layer 1)

```typescript
// lib/cache/memory.ts
interface CacheEntry<T> {
  value: T;
  expiry: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 100;

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    // LRU: 최대 크기 초과 시 가장 오래된 항목 삭제
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const memoryCache = new MemoryCache();
```

### LocalStorage 캐시 (Layer 2)

```typescript
// lib/cache/local.ts
interface LocalCacheEntry<T> {
  value: T;
  expiry: number;
  version: string;
}

const CACHE_VERSION = '1.0.0';

export function getLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`yiroom:${key}`);
    if (!raw) return null;

    const entry: LocalCacheEntry<T> = JSON.parse(raw);

    // 버전 불일치 시 무효화
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(`yiroom:${key}`);
      return null;
    }

    // TTL 만료 시 무효화
    if (Date.now() > entry.expiry) {
      localStorage.removeItem(`yiroom:${key}`);
      return null;
    }

    return entry.value;
  } catch {
    return null;
  }
}

export function setLocal<T>(key: string, value: T, ttlMs: number): void {
  const entry: LocalCacheEntry<T> = {
    value,
    expiry: Date.now() + ttlMs,
    version: CACHE_VERSION,
  };
  localStorage.setItem(`yiroom:${key}`, JSON.stringify(entry));
}

export function invalidateLocal(pattern: string): void {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(`yiroom:${pattern}`)) {
      localStorage.removeItem(key);
    }
  }
}
```

### 캐시 키 네이밍 규칙

```typescript
// 형식: {domain}:{action}:{id}
const cacheKeys = {
  // 제품
  products: (filters: string) => `products:list:${filters}`,
  productDetail: (id: string) => `products:detail:${id}`,

  // 분석
  analysis: (userId: string, type: string) => `analysis:${type}:${userId}`,

  // 사용자
  userSettings: (userId: string) => `user:settings:${userId}`,
  recentProducts: (userId: string) => `user:recent:${userId}`,
};
```

### 무효화 이벤트

```typescript
// lib/cache/invalidation.ts
export async function onProductPriceUpdate(productId: string): Promise<void> {
  memoryCache.invalidate(`products:detail:${productId}`);
  memoryCache.invalidate(`products:list:`);  // 모든 목록 캐시

  console.log(`[Cache] Invalidated product cache: ${productId}`);
}

export async function onAnalysisComplete(
  userId: string,
  type: 'pc1' | 's1' | 'c1'
): Promise<void> {
  invalidateLocal(`analysis:${type}:${userId}`);
  invalidateLocal(`coach:context:${userId}`);

  console.log(`[Cache] Invalidated analysis cache: ${type}`);
}
```

## 리서치 티켓

```
[ADR-014-R1] 캐싱 전략 최적화
────────────────────────────────────
claude.ai 딥 리서치 요청:
1. Stale-While-Revalidate vs Cache-Then-Network 패턴 성능 비교
2. IndexedDB를 활용한 대용량 오프라인 데이터 캐싱 전략
3. React Query/SWR의 캐시 무효화 패턴과 자체 구현 비교

→ 결과를 Claude Code에서 lib/cache/ 캐싱 레이어에 적용
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: RAG 검색](../principles/rag-retrieval.md) - 캐싱, 검색 최적화

### 관련 ADR
- [ADR-011: Cross-Module Data Flow](./ADR-011-cross-module-data-flow.md)
- [ADR-012: 상태 관리](./ADR-012-state-management.md)

### 구현 스펙
- [SDD-HYBRID-DATA-EXTENSION](../specs/SDD-HYBRID-DATA-EXTENSION.md) - 하이브리드 데이터 패턴

---

**Author**: Claude Code
**Reviewed by**: -
