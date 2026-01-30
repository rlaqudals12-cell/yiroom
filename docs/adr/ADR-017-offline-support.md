# ADR-017: 오프라인 지원 아키텍처

## 상태

`accepted`

## 날짜

2026-01-15

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"네트워크 상태와 무관하게 모든 기능이 완벽하게 작동하는 상태"

- **완전한 오프라인 기능**: 모든 핵심 기능이 오프라인에서 동작
- **투명한 동기화**: 온라인 복귀 시 사용자 개입 없이 자동 동기화
- **무손실 데이터**: 어떤 상황에서도 사용자 데이터 유실 없음
- **예측적 캐싱**: 사용자 패턴 학습하여 필요한 데이터 선제적 캐싱

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 저장소 용량 | 모바일 AsyncStorage ~50MB, IndexedDB ~500MB |
| AI 분석 | 네트워크 필수 (Gemini API 호출) |
| 실시간 데이터 | 가격, 재고 등 외부 데이터는 온라인 필수 |
| 배터리 | 백그라운드 동기화 시 배터리 소모 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 오프라인 기능 커버리지 | 90% | 60% | 기록 기능 중심 |
| 동기화 성공률 | 99.9% | 98% | 재시도 포함 |
| 데이터 유실률 | 0% | 0.1% | 충돌 시 |
| 캐시 히트율 | 95% | 80% | 자주 조회 데이터 |

### 현재 목표: 80%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 오프라인 AI 분석 | 모델 용량 (1GB+) | 엣지 AI 경량화 시 |
| WatermelonDB | 러닝커브 대비 ROI (HIGH_COMPLEXITY) | 대규모 오프라인 필요 시 |
| Service Worker (웹) | 모바일 우선 전략 | PWA 전환 시 |
| 백그라운드 동기화 (iOS) | iOS 제한 | 앱 포어그라운드 시만 |

---

## 맥락 (Context)

모바일 앱(Expo)에서 **네트워크 연결 없이도 핵심 기능을 사용**할 수 있어야 합니다:

1. **지하철/비행기**: 네트워크 없는 환경에서 운동/식단 기록
2. **불안정한 연결**: 끊김 시에도 데이터 유실 방지
3. **빠른 응답**: 로컬 캐시로 즉각적인 UI 반응
4. **동기화 복구**: 온라인 복귀 시 자동 동기화

현재 `lib/offline/` 디렉토리에 기본 구현이 있으나, **체계적인 전략이 부재**합니다.

## 결정 (Decision)

**3계층 오프라인 아키텍처** 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                   Offline Architecture                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: 읽기 캐시 (Read Cache)                             │
│  ├── 용도: 자주 조회하는 데이터 로컬 저장                   │
│  ├── 저장소: AsyncStorage (모바일), LocalStorage (웹)       │
│  ├── TTL: 24시간 (분석), 7일 (설정)                         │
│  └── 크기: 최대 50MB                                        │
│                                                              │
│  Layer 2: 쓰기 큐 (Write Queue)                              │
│  ├── 용도: 오프라인 변경사항 임시 저장                      │
│  ├── 저장소: IndexedDB (웹), SQLite (모바일)                │
│  ├── 형식: { operation, table, data, timestamp }            │
│  └── 동기화: FIFO 순서로 서버 전송                          │
│                                                              │
│  Layer 3: 상태 관리 (Sync State)                             │
│  ├── 용도: 동기화 상태 추적                                 │
│  ├── 상태: online, offline, syncing, error                  │
│  └── UI: 동기화 인디케이터 표시                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 오프라인 지원 기능

| 기능 | 오프라인 모드 | 동기화 방식 |
|------|-------------|------------|
| **운동 기록** | ✅ 완전 지원 | 자동 동기화 |
| **식단 기록** | ✅ 완전 지원 | 자동 동기화 |
| **물 섭취** | ✅ 완전 지원 | 자동 동기화 |
| **분석 결과 조회** | ✅ 캐시에서 조회 | - |
| **AI 분석 요청** | ❌ 온라인 필수 | - |
| **제품 검색** | ⚠️ 캐시된 항목만 | - |

### 쓰기 큐 스키마

```typescript
interface OfflineOperation {
  id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
}
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| Service Worker (PWA) | 웹 표준 | 모바일 제한적 | `ALT_SUFFICIENT` |
| Redux Persist | 간단 | 대용량 불가 | `LOW_ROI` |
| WatermelonDB | 강력한 동기화 | 러닝커브 | `HIGH_COMPLEXITY` |

## 결과 (Consequences)

### 긍정적 결과

- **UX 향상**: 네트워크 상태와 무관한 즉각 반응
- **데이터 안전**: 오프라인 변경사항 유실 방지
- **배터리 효율**: 배치 동기화로 네트워크 사용 최소화

### 부정적 결과

- **저장소 관리**: 캐시 크기 제한 및 정리 필요
- **동기화 복잡도**: 충돌 해결 로직 필요 (ADR-016 참조)

## 구현 가이드

### 오프라인 컨텍스트 (모바일)

```typescript
// contexts/OfflineContext.tsx
export const OfflineProvider: React.FC = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOps, setPendingOps] = useState<OfflineOperation[]>([]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);

      if (state.isConnected) {
        syncPendingOperations();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <OfflineContext.Provider value={{ isOnline, pendingOps }}>
      {children}
    </OfflineContext.Provider>
  );
};
```

### 쓰기 큐 관리

```typescript
// lib/offline/write-queue.ts
export async function enqueueOperation(op: Omit<OfflineOperation, 'id' | 'status'>) {
  const operation: OfflineOperation = {
    ...op,
    id: generateUUID(),
    status: 'pending',
  };

  await AsyncStorage.setItem(
    `offline:op:${operation.id}`,
    JSON.stringify(operation)
  );

  // 온라인이면 즉시 동기화 시도
  if (await isOnline()) {
    await syncOperation(operation);
  }
}
```

### 동기화 인디케이터 UI

```tsx
// components/SyncIndicator.tsx
export function SyncIndicator() {
  const { isOnline, pendingOps } = useOffline();

  if (isOnline && pendingOps.length === 0) return null;

  return (
    <View style={styles.indicator}>
      {!isOnline && <Icon name="cloud-off" />}
      {pendingOps.length > 0 && (
        <Text>{pendingOps.length}개 동기화 대기</Text>
      )}
    </View>
  );
}
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 디자인 시스템](../principles/design-system.md) - 오프라인 UX 패턴

### 관련 ADR/스펙
- [ADR-016: Web-Mobile Sync](./ADR-016-web-mobile-sync.md)
- [ADR-014: Caching Strategy](./ADR-014-caching-strategy.md)

---

**Author**: Claude Code
**Reviewed by**: -
