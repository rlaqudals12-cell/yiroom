# 오프라인 지원 원리 (Offline Support)

> 이 문서는 이룸 모바일 앱의 오프라인 기능 (lib/offline)의 기반이 되는 원리를 설명한다.

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완전한 오프라인 우선 앱"

- 네트워크 연결 없이 모든 핵심 기능 사용 가능
- 온라인 복귀 시 자동 동기화 (무손실)
- 충돌 해결 규칙의 100% 예측 가능성
- 오프라인 상태에서도 실시간 피드백 제공
- 캐시 적중률 95%+ (반복 접근 데이터)
- 동기화 지연 < 5초 (온라인 복귀 후)
```

### 물리적 한계

| 항목          | 한계                                    |
| ------------- | --------------------------------------- |
| AI 분석       | 네트워크 필수 (Gemini API 호출)         |
| 초기 데이터   | 최초 1회 온라인 동기화 필수             |
| 저장 공간     | 모바일 기기의 AsyncStorage 용량 제한    |
| 실시간 동기화 | 네트워크 없이 멀티 디바이스 동기화 불가 |
| 대용량 이미지 | 전체 이미지 캐싱 시 저장 공간 부족      |

### 100점 기준

- 캐시 TTL 기반 자동 무효화 (최소 24시간 유효)
- 동기화 큐 지속성 (앱 종료 후에도 보존)
- 지수 백오프 재시도 (최대 3회, 1s → 2s → 4s)
- 네트워크 상태 변경 감지 < 1초
- 충돌 해결: Last-Write-Wins (LWW) 기본, 사용자 선택 지원
- 저장 공간 제한 시 LRU 자동 정리

### 현재 목표: 70%

- AsyncStorage 기반 캐싱
- 동기화 큐 (SyncQueue) 구현
- 네트워크 상태 모니터링 (NetInfo)
- stale-while-revalidate 패턴
- 캐시 TTL 및 만료 처리
- 운동/식단/수분 기록 오프라인 지원

### 의도적 제외

| 제외 항목            | 이유                       | 재검토 시점                   |
| -------------------- | -------------------------- | ----------------------------- |
| AI 분석 오프라인     | 모델 크기로 로컬 실행 불가 | On-device AI 보급 시          |
| 이미지 전체 캐싱     | 저장 공간 부족             | 사용자 선택적 캐싱 UX 구현 시 |
| 멀티 디바이스 동기화 | 복잡도 높음                | 유료 플랜 도입 시             |
| 양방향 충돌 해결 UI  | MVP 범위 초과              | 사용자 피드백 후              |
| SQLite 마이그레이션  | AsyncStorage 충분          | 데이터 100MB 초과 시          |

---

## 1. 핵심 개념

### 1.1 Offline-First 패턴

로컬 데이터를 우선 사용하고, 네트워크를 보조적으로 활용하는 설계 철학.

**원칙:**

```
1. 로컬 먼저, 네트워크 나중 (Local First)
2. 낙관적 업데이트 (Optimistic Updates)
3. 충돌 감지 및 해결 (Conflict Resolution)
4. 자동 동기화 (Auto Sync)
```

**데이터 흐름:**

```
사용자 액션
    ↓
┌─────────────────────────────────────────────────────────────┐
│                       로컬 저장소                            │
│  (AsyncStorage/IndexedDB)                                   │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   캐시      │    │ 동기화 큐    │    │   상태      │     │
│  │  (Cache)    │    │ (SyncQueue)  │    │  (State)    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
    ↓ (온라인 시)
┌─────────────────────────────────────────────────────────────┐
│                       원격 서버                              │
│  (Supabase)                                                 │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Stale-While-Revalidate (SWR)

캐시된 데이터를 즉시 반환하면서, 백그라운드에서 최신 데이터를 가져오는 패턴.

**장점:**

- 즉각적인 UI 응답
- 네트워크 지연 숨김
- 항상 최신 데이터 유지

**구현:**

```typescript
// 1. 캐시에서 즉시 반환
const cached = await getCache(key);
if (cached) {
  // UI에 즉시 표시
  render(cached);
}

// 2. 백그라운드에서 갱신
fetchFromNetwork(key).then((data) => {
  setCache(key, data);
  render(data); // UI 업데이트
});
```

### 1.3 동기화 큐 (Sync Queue)

오프라인 상태에서 발생한 변경 사항을 저장하고, 온라인 복귀 시 순차적으로 동기화.

**큐 항목 구조:**

```typescript
interface SyncQueueItem {
  id: string;
  type: 'workout_log' | 'meal_record' | 'water_record';
  action: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  maxRetries: number;
}
```

---

## 2. 수학적/물리학적 기반

### 2.1 지수 백오프 (Exponential Backoff)

재시도 간격을 점진적으로 증가시켜 서버 부하를 줄이는 알고리즘.

**공식:**

```
delay(n) = baseDelay × 2^(n-1) + jitter

여기서:
- n = 재시도 횟수 (1, 2, 3, ...)
- baseDelay = 기본 대기 시간 (1000ms)
- jitter = 랜덤 추가 시간 (0 ~ 100ms)
```

**예시:**

```
재시도 1: 1000ms + jitter
재시도 2: 2000ms + jitter
재시도 3: 4000ms + jitter
재시도 4: 8000ms + jitter (최대 제한 적용)
```

**이룸 적용:**

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 8000,
  jitterMax: 100,
};

function calculateDelay(retryCount: number): number {
  const exponentialDelay = RETRY_CONFIG.baseDelay * Math.pow(2, retryCount - 1);
  const jitter = Math.random() * RETRY_CONFIG.jitterMax;
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelay);
}
```

### 2.2 LRU 캐시 (Least Recently Used)

가장 오래 사용되지 않은 항목을 먼저 제거하는 캐시 교체 알고리즘.

**원리:**

```
캐시 접근 시:
1. 해당 항목을 리스트의 맨 앞으로 이동 (MRU)
2. 캐시가 가득 차면 맨 뒤 항목 제거 (LRU)

시간 복잡도: O(1) (HashMap + DoublyLinkedList 조합)
```

**캐시 구조:**

```
[MRU] ←→ item1 ←→ item2 ←→ item3 ←→ ... ←→ itemN [LRU]
                                              ↑
                                         제거 대상
```

### 2.3 TTL (Time To Live)

캐시 항목의 유효 기간을 설정하여 자동 만료 처리.

**검증 로직:**

```typescript
function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

function getCacheWithTTL<T>(key: string): T | null {
  const item = storage.get(key);

  if (!item) return null;

  if (item.expiresAt && isExpired(item.expiresAt)) {
    storage.remove(key);
    return null; // 만료됨
  }

  return item.data;
}
```

**권장 TTL 값:**

| 데이터 유형   | TTL    | 이유                |
| ------------- | ------ | ------------------- |
| 분석 결과     | 24시간 | 자주 변경되지 않음  |
| 제품 정보     | 1시간  | 가격/재고 변동 가능 |
| 사용자 프로필 | 7일    | 거의 변경되지 않음  |
| 피드 데이터   | 5분    | 실시간성 중요       |

### 2.4 Last-Write-Wins (LWW)

충돌 해결 시 가장 최근 타임스탬프를 가진 데이터가 승리하는 전략.

**충돌 감지:**

```
서버 버전: { data: "A", updatedAt: "2026-02-03T10:00:00Z" }
로컬 버전: { data: "B", updatedAt: "2026-02-03T10:05:00Z" }

→ 로컬 버전 선택 (더 최근)
```

**한계:**

- 동시 수정 시 데이터 손실 가능
- 시계 동기화 필요
- 복잡한 병합 로직 불가

---

## 3. 구현 도출

### 3.1 저장소 선택

| 플랫폼       | 저장소       | 용량   | 이유                   |
| ------------ | ------------ | ------ | ---------------------- |
| React Native | AsyncStorage | ~6MB   | 공식 지원, 충분한 용량 |
| Web          | IndexedDB    | ~50MB+ | 대용량 지원, 비동기    |

### 3.2 캐시 구조

```typescript
// 캐시 항목 구조
interface CacheItem<T> {
  data: T;
  metadata: {
    key: string;
    expiresAt: string | null; // ISO 날짜, null = 무기한
    updatedAt: string; // 마지막 업데이트
    version: number; // 충돌 감지용
  };
}

// 저장 키 네이밍 규칙
const CACHE_KEYS = {
  userProfile: '@yiroom_cache/user/{userId}',
  analysisResult: '@yiroom_cache/analysis/{type}/{id}',
  productList: '@yiroom_cache/products/{category}',
  feedItems: '@yiroom_cache/feed/{tab}',
};
```

### 3.3 동기화 큐 처리

```
오프라인 액션 발생
       ↓
   큐에 추가
       ↓
   로컬 저장소
       ↓
   [대기]
       ↓
   온라인 복귀 감지
       ↓
┌──────────────────────────────┐
│     동기화 프로세스          │
│                              │
│  1. 큐에서 항목 추출         │
│  2. 서버 API 호출            │
│  3. 성공 → 큐에서 제거       │
│  4. 실패 → 재시도 카운터++   │
│  5. 최대 재시도 초과 → 에러  │
│                              │
└──────────────────────────────┘
```

### 3.4 네트워크 상태 감지

```typescript
// NetInfo를 이용한 상태 감지
const updateNetworkStatus = (state: NetInfoState) => {
  const newStatus = state.isConnected
    ? state.isInternetReachable === false
      ? 'offline'
      : 'online'
    : 'offline';

  setStatus(newStatus);

  // 온라인 복귀 시 동기화 트리거
  if (newStatus === 'online') {
    processSyncQueue();
  }
};
```

---

## 4. 검증 방법

### 4.1 캐싱 테스트

```
시나리오 1: 캐시 적중
1. 데이터 저장
2. TTL 내 조회
3. 캐시된 데이터 반환 확인

시나리오 2: 캐시 만료
1. 데이터 저장 (TTL: 1초)
2. 2초 대기
3. 조회 시 null 반환 확인

시나리오 3: SWR 패턴
1. 캐시 데이터 저장
2. getCacheOrFetch 호출
3. 캐시 데이터 즉시 반환 확인
4. 백그라운드 갱신 확인
```

### 4.2 동기화 테스트

```
시나리오 1: 오프라인 큐잉
1. 네트워크 비활성화
2. 기록 생성 액션
3. 큐에 항목 추가 확인
4. 로컬 저장 확인

시나리오 2: 온라인 동기화
1. 큐에 항목 있는 상태
2. 네트워크 활성화
3. 서버 동기화 확인
4. 큐 비워짐 확인

시나리오 3: 재시도 로직
1. 서버 일시 오류 시뮬레이션
2. 재시도 횟수 확인 (지수 백오프)
3. 최대 재시도 후 에러 처리
```

### 4.3 성능 테스트

| 지표          | 목표      | 측정 방법                 |
| ------------- | --------- | ------------------------- |
| 캐시 저장     | < 50ms    | AsyncStorage.setItem 시간 |
| 캐시 조회     | < 30ms    | AsyncStorage.getItem 시간 |
| 동기화 처리   | < 2s/항목 | processSyncQueue 시간     |
| 네트워크 감지 | < 1s      | NetInfo 이벤트 딜레이     |

---

## 5. 관련 문서

### ADR

- [ADR-041: 오프라인 지원 전략](../adr/ADR-041-offline-support-strategy.md)

### 스펙

- [SPEC-MOBILE-OFFLINE](../specs/mobile/offline.md)

### 코드

```
apps/mobile/lib/offline/
├── index.ts          # Barrel export
├── types.ts          # 타입 정의
├── cache.ts          # 캐싱 유틸리티
├── syncQueue.ts      # 동기화 큐
├── useNetworkStatus.ts   # 네트워크 상태 훅
└── useOffline.ts     # 통합 오프라인 훅
```

---

**Version**: 1.0 | **Created**: 2026-02-03
**관련 모듈**: lib/offline, useOffline, useNetworkStatus
**적용 대상**: 운동 기록 (W-1), 식단 기록 (N-1), 수분 기록
