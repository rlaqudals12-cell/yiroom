# SDD: 마일스톤 축하 시스템

> 버전: 1.0
> 작성일: 2026-01-02
> 상태: 구현 완료
> 관련 스펙: [GAMIFICATION-SPEC.md](./phase-next/GAMIFICATION-SPEC.md)

---

## 1. 개요

### 1.1 목적

사용자의 누적 활동 달성을 축하하여 동기 부여 및 리텐션 향상.

### 1.2 핵심 가치

- **부담 없는 축하**: 압박감 없이 긍정적 피드백만 제공
- **누적 기반**: 스트릭(연속)이 아닌 누적 횟수 기준
- **비침습적**: 짧은 Toast로 자연스럽게 축하

### 1.3 기존 시스템과 차이

| 시스템       | 기준      | 압박감                  |
| ------------ | --------- | ----------------------- |
| 스트릭       | 연속 일수 | 끊기면 리셋 (부담)      |
| **마일스톤** | 누적 횟수 | 언제나 증가 (부담 없음) |
| 배지         | 조건 달성 | 다양한 조건 (중립)      |

---

## 2. 기능 요구사항

### 2.1 마일스톤 정의

| 타입            | 마일스톤 | 아이콘 | 메시지                     |
| --------------- | -------- | ------ | -------------------------- |
| workout         | 10회     | 💪     | "꾸준히 하고 계시네요"     |
| workout         | 50회     | 🏋️     | "반백 돌파!"               |
| workout         | 100회    | 🎯     | "100회 달성, 대단해요!"    |
| nutrition       | 10회     | 🥗     | "건강한 식단 기록 중"      |
| nutrition       | 50회     | 🍎     | "50번째 기록!"             |
| nutrition       | 100회    | ⭐     | "100회, 꾸준함의 힘!"      |
| closet          | 10개     | 👕     | "옷장이 풍성해지고 있어요" |
| closet          | 50개     | 👗     | "패션 컬렉터!"             |
| personal_record | -        | 🏆     | 개인 기록 갱신             |

### 2.2 트리거 조건

```typescript
// 이전 카운트 < 마일스톤 <= 현재 카운트
const milestone = MILESTONES.find(
  (m) => m.type === type && m.threshold > previousCount && m.threshold <= currentCount
);
```

### 2.3 표시 방식

| 요소      | 값                            |
| --------- | ----------------------------- |
| 위치      | top-center                    |
| 지속 시간 | 4000ms (4초)                  |
| 스타일    | Custom Toast (MilestoneToast) |

---

## 3. 데이터 구조

### 3.1 Milestone 타입

```typescript
export interface Milestone {
  id: string;
  type: 'workout' | 'nutrition' | 'closet' | 'personal_record';
  title: string;
  description: string;
  icon: string;
  threshold: number;
}
```

### 3.2 마일스톤 상수

```typescript
export const MILESTONES: Milestone[] = [
  {
    id: 'workout_10',
    type: 'workout',
    title: '운동 10회 달성!',
    description: '꾸준히 하고 계시네요',
    icon: '💪',
    threshold: 10,
  },
  // ...
];
```

---

## 4. 구현 명세

### 4.1 마일스톤 체크 함수

```typescript
// lib/milestones.ts
export function checkNewMilestone(
  type: Milestone['type'],
  previousCount: number,
  currentCount: number
): Milestone | null {
  return (
    MILESTONES.find(
      (m) => m.type === type && m.threshold > previousCount && m.threshold <= currentCount
    ) || null
  );
}
```

### 4.2 Server Action 통합

```typescript
// workout/session/actions.ts
export async function saveWorkoutLogAction(...): Promise<SaveWorkoutResult | null> {
  // 이전 운동 횟수 조회
  const { count: previousCount } = await supabase
    .from('workout_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // 운동 저장...

  // 마일스톤 체크
  const currentCount = (previousCount || 0) + 1;
  const milestone = checkNewMilestone('workout', previousCount || 0, currentCount);

  return {
    log: data,
    milestone,
    totalWorkouts: currentCount,
  };
}
```

### 4.3 클라이언트 Hook

```typescript
// hooks/useMilestone.tsx
export function useMilestone() {
  const showMilestoneToast = useCallback((milestone: Milestone) => {
    toast.custom(
      () => <MilestoneToast milestone={milestone} />,
      { duration: 4000, position: 'top-center' }
    );
  }, []);

  const checkAndCelebrate = useCallback(
    (type: Milestone['type'], previousCount: number, currentCount: number) => {
      const newMilestone = checkNewMilestone(type, previousCount, currentCount);
      if (newMilestone) {
        showMilestoneToast(newMilestone);
      }
      return newMilestone;
    },
    [showMilestoneToast]
  );

  return { showMilestoneToast, checkAndCelebrate };
}
```

### 4.4 Toast 컴포넌트

```tsx
// components/gamification/MilestoneToast.tsx
export function MilestoneToast({ milestone }: { milestone: Milestone }) {
  return (
    <div data-testid="milestone-toast" className="flex items-center gap-3 p-1">
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full text-2xl',
          'shadow-lg border-2',
          TYPE_COLORS[milestone.type]
        )}
      >
        {milestone.icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-primary">축하해요!</span>
        <span className="font-semibold">{milestone.title}</span>
        <span className="text-xs text-muted-foreground">{milestone.description}</span>
      </div>
    </div>
  );
}
```

---

## 5. 타입별 색상

| 타입            | 배경색                            |
| --------------- | --------------------------------- |
| workout         | `bg-orange-100 border-orange-200` |
| nutrition       | `bg-green-100 border-green-200`   |
| closet          | `bg-purple-100 border-purple-200` |
| personal_record | `bg-blue-100 border-blue-200`     |

---

## 6. 구현 파일

| 파일                                         | 역할                  |
| -------------------------------------------- | --------------------- |
| `lib/milestones.ts`                          | 상수 및 유틸리티 함수 |
| `components/gamification/MilestoneToast.tsx` | Toast UI              |
| `hooks/useMilestone.tsx`                     | 클라이언트 Hook       |
| `workout/session/actions.ts`                 | Server Action 통합    |

---

## 7. 테스트 체크리스트

- [x] 10회 달성 시 마일스톤 감지
- [x] 50회, 100회 마일스톤 감지
- [x] Toast 4초 후 자동 닫힘
- [x] 중복 달성 시 표시 안 함
- [x] 타입별 색상 적용

---

## 8. 향후 개선

- [ ] 영양 기록 마일스톤 통합
- [ ] 옷장 아이템 마일스톤 통합
- [ ] 마일스톤 달성 DB 기록 (user_milestones 테이블)
- [ ] 마일스톤 히스토리 페이지

---

## 9. 참고

- 상위 스펙: [GAMIFICATION-SPEC.md](./phase-next/GAMIFICATION-SPEC.md)
- 리서치: [APP-ENHANCEMENT-RESEARCH-2026.md](./APP-ENHANCEMENT-RESEARCH-2026.md)
