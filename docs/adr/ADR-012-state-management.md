# ADR-012: 상태 관리 계층 아키텍처

## 상태

`accepted`

## 날짜

2026-01-15

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"상태 관리가 투명하고 예측 가능하며 자동 최적화되는 상태"

- **자동 선택**: 상태 유형에 따라 도구가 자동 결정
- **제로 중복 요청**: 동일 데이터 요청 100% 캐시 적중
- **Optimistic UI**: 모든 사용자 액션에 즉각적 피드백
- **오프라인 퍼스트**: 네트워크 없이도 핵심 기능 동작

### 물리적 한계

| 항목 | 한계 |
|------|------|
| React 리렌더링 | Context 변경 시 하위 컴포넌트 전체 리렌더링 |
| 메모리 제한 | 모바일 기기의 제한된 캐시 용량 |
| 동기화 지연 | Server/Client 상태 간 최소 RTT 지연 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 중복 API 요청 | 0% | 15% | React Query 도입 시 해결 |
| 상태 선택 일관성 | 100% | 85% | 가이드라인 준수율 |
| 캐시 적중률 | 90% | 60% | staleTime 최적화 |
| 리렌더링 최적화 | < 3회/상호작용 | 5회 | memo/selector 적용 |

### 현재 목표: 70%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| React Query 즉시 도입 | 현재 규모에서 과도 | DAU 1000+ |
| 글로벌 상태 관리자 (Redux) | Zustand로 충분 | 상태 복잡도 증가 시 |
| Optimistic UI 전면 적용 | 롤백 복잡도 | Phase 2 |

---

## 맥락 (Context)

이룸 프로젝트의 상태 관리가 **일관성 없이 혼재**:

1. **Zustand**: `lib/stores/` (workoutInputStore, productCompareStore)
2. **useState**: 대부분의 컴포넌트
3. **직접 fetch**: React Query 없이 API 호출

**문제점**:
- 중복 API 요청 발생 (동일 데이터 여러 번 fetch)
- Zustand vs useState 선택 기준 불명확
- 서버 상태와 클라이언트 상태 경계 모호

## 결정 (Decision)

**4계층 상태 관리** 아키텍처 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                   State Management Layers                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 4: Global App State                                   │
│  ├── Clerk (인증 상태)                                       │
│  ├── Offline Status (lib/offline/)                          │
│  └── Analytics Context                                       │
│                                                              │
│  Layer 3: Server State (데이터)                              │
│  ├── 추후 React Query 도입                                  │
│  ├── 현재: SWR 패턴 유사하게 직접 구현                      │
│  └── TTL: 30초 (분석 결과), 5분 (제품 목록)                 │
│                                                              │
│  Layer 2: Form State (다단계 폼)                             │
│  ├── Zustand + persist                                       │
│  ├── 위치: lib/stores/                                       │
│  └── 용도: 다단계 폼만 (페이지 간 지속 필요)                │
│                                                              │
│  Layer 1: Component Local State                              │
│  ├── useState, useReducer                                    │
│  └── 용도: UI 토글, 입력 필드 등 즉각 반응                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 상태 유형별 선택 기준

| 상태 유형 | 도구 | 예시 |
|----------|------|------|
| **UI 토글** | useState | 모달 열기, 탭 선택 |
| **폼 입력** | useState | 검색어, 필터 |
| **다단계 폼** | Zustand | 운동 온보딩, 식단 기록 |
| **API 데이터** | (React Query) | 제품 목록, 분석 결과 |
| **인증** | Clerk | 사용자 정보, 토큰 |
| **오프라인** | Context | 네트워크 상태 |

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| Redux | 강력한 DevTools | 보일러플레이트 | `HIGH_COMPLEXITY` |
| Jotai | 원자적 상태 | 러닝커브 | `ALT_SUFFICIENT` |
| Context 전용 | 간단 | 리렌더링 이슈 | `LOW_ROI` |

## 결과 (Consequences)

### 긍정적 결과

- **명확한 선택 기준**: 상태 유형별 도구 결정 용이
- **캐싱 효율**: 서버 상태 중복 요청 방지
- **유지보수 용이**: 예측 가능한 상태 흐름

### 부정적 결과

- **초기 설정**: React Query 도입 시 마이그레이션 필요
- **학습 비용**: 팀원 교육 필요

## 구현 가이드

### Zustand 스토어 표준

```typescript
// lib/stores/workoutInputStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WorkoutInputStore {
  // State
  goal: WorkoutGoal | null;
  experience: ExperienceLevel | null;

  // Actions
  setGoal: (goal: WorkoutGoal) => void;
  setExperience: (exp: ExperienceLevel) => void;
  reset: () => void;
}

export const useWorkoutInputStore = create<WorkoutInputStore>()(
  persist(
    (set) => ({
      goal: null,
      experience: null,
      setGoal: (goal) => set({ goal }),
      setExperience: (experience) => set({ experience }),
      reset: () => set({ goal: null, experience: null }),
    }),
    {
      name: 'workout-input',  // localStorage 키
      partialize: (state) => ({ goal: state.goal }),  // 일부만 persist
    }
  )
);
```

### 서버 상태 패턴 (현재)

```typescript
// hooks/useBeautyProducts.ts
export function useBeautyProducts(filters: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      setIsLoading(true);
      try {
        const data = await productService.search(filters);
        if (!cancelled) setProducts(data);
      } catch (e) {
        if (!cancelled) setError(e as Error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchProducts();
    return () => { cancelled = true; };
  }, [filters]);

  return { products, isLoading, error };
}
```

### 향후 React Query 도입 시

```typescript
// hooks/useBeautyProducts.ts (React Query 버전)
import { useQuery } from '@tanstack/react-query';

export function useBeautyProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ['products', 'beauty', filters],
    queryFn: () => productService.search(filters),
    staleTime: 5 * 60 * 1000,  // 5분
    gcTime: 10 * 60 * 1000,    // 10분
  });
}
```

### 선택 기준 플로우차트

```
상태가 필요한가?
├─ 단일 컴포넌트 내 UI? → useState
├─ 여러 컴포넌트 공유?
│   ├─ 다단계 폼 (페이지 간 지속)? → Zustand
│   ├─ 서버 데이터? → (React Query)
│   └── 글로벌 앱 상태? → Context
└─ 인증 관련? → Clerk
```

## 리서치 티켓

```
[ADR-012-R1] 상태 관리 최적화 전략
────────────────────────────────────
claude.ai 딥 리서치 요청:
1. Zustand vs Jotai vs Valtio 성능 벤치마크 (React 19 환경)
2. Server Components와 클라이언트 상태 동기화 패턴
3. Optimistic UI 업데이트 시 상태 롤백 전략

→ 결과를 Claude Code에서 lib/stores/ 및 hooks/ 상태 관리에 적용
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 디자인 시스템](../principles/design-system.md) - UI 상태 패턴, 컴포넌트 구조

### 관련 ADR/스펙
- [ADR-011: Cross-Module Data Flow](./ADR-011-cross-module-data-flow.md)
- [React Patterns](../../.claude/rules/react-patterns.md) - 상태 관리 패턴

---

**Author**: Claude Code
**Reviewed by**: -
