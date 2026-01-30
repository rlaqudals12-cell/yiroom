# ADR-016: 웹-모바일 데이터 동기화

## 상태

`accepted`

## 날짜

2026-01-15

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"모든 플랫폼에서 데이터가 완벽하게 동기화되어 사용자가 기기 전환을 인식하지 못하는 상태"

- **완벽한 실시간 동기화**: 한 기기에서 변경 시 모든 기기에 < 100ms 반영
- **지능형 충돌 해결**: AI가 컨텍스트를 이해하고 자동으로 최적의 병합 수행
- **오프라인 투명성**: 온라인/오프라인 경계가 사용자에게 보이지 않음
- **예측적 프리페칭**: 사용자 행동 예측하여 필요한 데이터 선제적 동기화

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 네트워크 지연 | 글로벌 RTT 최소 50-200ms |
| 동시 편집 충돌 | 두 기기에서 동시 수정 시 완전 자동 해결 불가 |
| 오프라인 기간 | 장기 오프라인 후 대량 충돌 가능 |
| 모바일 배터리 | 실시간 구독 시 배터리 소모 증가 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 동기화 지연 | < 100ms | 500ms | Realtime 구독 |
| 충돌 발생률 | < 0.1% | 2% | 버전 벡터 |
| 자동 해결률 | 95% | 70% | 규칙 기반 |
| 데이터 일관성 | 99.99% | 99.5% | 최종 일관성 |

### 현재 목표: 80%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| CRDT 구현 | 복잡도 대비 ROI 낮음 (HIGH_COMPLEXITY) | 동시 편집 빈번 시 |
| 실시간 Presence | 핵심 기능 아님 | 소셜 기능 확장 시 |
| P2P 동기화 | 인프라 복잡도 | 오프라인 협업 필요 시 |
| 3-way 병합 | 구현 복잡도 | 문서 편집 기능 도입 시 |

---

## 맥락 (Context)

이룸은 웹(Next.js)과 모바일(Expo React Native) 두 플랫폼을 운영합니다. 현재 두 앱이 동일한 Supabase 데이터베이스를 공유하지만, **데이터 동기화 전략이 명확하지 않습니다**:

1. **오프라인 데이터**: 모바일에서 오프라인 작성 후 동기화 시 충돌 가능
2. **실시간 동기화**: 웹에서 변경한 데이터가 모바일에 즉시 반영되지 않음
3. **일관성 문제**: 동시 편집 시 마지막 쓰기 우선(Last Write Wins) 외 전략 부재
4. **캐시 무효화**: 한 플랫폼에서의 변경이 다른 플랫폼 캐시에 반영되지 않음

## 결정 (Decision)

**이벤트 기반 동기화 + 버전 벡터** 전략 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                   데이터 동기화 아키텍처                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 실시간 구독 (Supabase Realtime)                          │
│     └── 분석 결과, 운동 로그, 식단 기록 변경 구독            │
│                                                              │
│  2. 낙관적 업데이트 (Optimistic Update)                      │
│     └── UI 즉시 반영 → 서버 확인 → 롤백/충돌 해결           │
│                                                              │
│  3. 버전 벡터 (Version Vector)                               │
│     └── updated_at + device_id로 충돌 감지                   │
│                                                              │
│  4. 충돌 해결 전략                                           │
│     └── 사용자 선택 / 자동 병합 / 서버 우선                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 동기화 대상 데이터

| 데이터 유형 | 동기화 방식 | 충돌 해결 |
|------------|-----------|----------|
| **분석 결과** | 서버 우선 | 최신 분석 유지 |
| **운동 로그** | 병합 | 시간 기반 정렬 |
| **식단 기록** | 병합 | 시간 기반 정렬 |
| **사용자 설정** | 최신 우선 | updated_at 비교 |
| **위시리스트** | 합집합 | 중복 제거 |

### 버전 관리 스키마

```typescript
interface SyncMetadata {
  version: number;           // 증가하는 버전 번호
  updated_at: string;        // ISO 8601 타임스탬프
  updated_by: string;        // clerk_user_id
  device_id: string;         // 기기 식별자
  sync_status: 'synced' | 'pending' | 'conflict';
}
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 폴링 방식 | 간단한 구현 | 배터리 소모, 지연 | `LOW_ROI` |
| CRDT | 자동 충돌 해결 | 복잡도 높음 | `HIGH_COMPLEXITY` |
| 서버 전용 동기화 | 오프라인 불가 | UX 저하 | `NOT_NEEDED` |

## 결과 (Consequences)

### 긍정적 결과

- **실시간 경험**: 플랫폼 간 즉각적인 데이터 반영
- **오프라인 지원**: 모바일에서 오프라인 작업 후 동기화
- **충돌 최소화**: 버전 벡터로 충돌 사전 감지

### 부정적 결과

- **복잡도 증가**: 동기화 로직 관리 필요
- **저장소 오버헤드**: sync_metadata 컬럼 추가

## 구현 가이드

### Supabase Realtime 구독

```typescript
// hooks/useSyncedData.ts
export function useSyncedData<T>(table: string, userId: string) {
  const [data, setData] = useState<T[]>([]);

  useEffect(() => {
    const subscription = supabase
      .channel(`${table}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `clerk_user_id=eq.${userId}`,
        },
        (payload) => {
          handleRealtimeChange(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [table, userId]);

  return { data, sync: triggerSync };
}
```

### 충돌 해결 UI

```typescript
interface ConflictResolution {
  showConflictModal: boolean;
  localVersion: SyncMetadata;
  serverVersion: SyncMetadata;
  onResolve: (choice: 'local' | 'server' | 'merge') => void;
}
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 디자인 시스템](../principles/design-system.md) - 크로스 플랫폼 UI 패턴
- [원리: RAG 검색](../principles/rag-retrieval.md) - 데이터 동기화 패턴

### 관련 ADR/스펙
- [ADR-017: Offline Support](./ADR-017-offline-support.md)
- [ADR-014: Caching Strategy](./ADR-014-caching-strategy.md)

---

**Author**: Claude Code
**Reviewed by**: -
