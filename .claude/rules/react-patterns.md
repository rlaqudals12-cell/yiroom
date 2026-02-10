---
paths:
  - '**/*.tsx'
  - '**/*.jsx'
  - '**/components/**'
  - '**/hooks/**'
---

# React 19 패턴

> React 컴포넌트 파일에만 적용

---

## 컴포넌트 구조

```tsx
// 1. imports
// 2. types
// 3. constants
// 4. component
// 5. sub-components (필요시)
```

## 서버 vs 클라이언트

- 기본값: 서버 컴포넌트
- `'use client'`는 필요한 경우에만 (이벤트, 훅)
- 클라이언트 경계는 최대한 작게

## 컴포넌트 규칙

- 함수형 컴포넌트 + Hooks 사용
- 최상위 컨테이너에 `data-testid` 필수

```tsx
export default function UserCard({ user }: UserCardProps) {
  return <div data-testid="user-card">{/* ... */}</div>;
}
```

## 훅 규칙

- 커스텀 훅은 `use` 접두사 필수
- 훅은 컴포넌트 최상위에서만 호출
- 조건부 훅 호출 금지

## 기존 훅 활용

| 훅                  | 용도                         |
| ------------------- | ---------------------------- |
| `useUserMatching`   | 사용자 프로필 기반 제품 매칭 |
| `useBeautyProducts` | 화장품 목록 + 매칭률         |
| `useDebounce`       | 입력 디바운싱 (300ms)        |
| `useInfiniteScroll` | 무한 스크롤                  |

```typescript
// 좋은 예: 기존 훅 활용
const { hasAnalysis, calculateProductMatch } = useUserMatching();
const matchRate = hasAnalysis ? calculateProductMatch(product) : 75;
```

## Props 패턴

```tsx
// 좋은 예: 명시적 타입
type ButtonProps = {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
};

// 나쁜 예
const Button = (props: any) => ...
```

## 상태 관리

- 로컬 상태: useState, useReducer
- 다단계 폼: Zustand (`lib/stores/`)
- 서버 상태: TanStack Query

## Dynamic Import

```typescript
export const ChartDynamic = dynamic(() => import('./Chart'), {
  ssr: false,
  loading: () => null,
});
```

## 접근성

- Dialog에 `DialogDescription` 필수
- 이미지에 `alt` 필수
- 버튼/링크에 명확한 라벨

```tsx
<DialogHeader>
  <DialogTitle>제목</DialogTitle>
  <VisuallyHidden asChild>
    <DialogDescription>설명</DialogDescription>
  </VisuallyHidden>
</DialogHeader>
```

## React 19 신기능

### `use` Hook

서버 컴포넌트에서 Promise나 Context를 직접 읽을 수 있다.

```tsx
import { use } from 'react';

export default function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);
  return <div>{user.name}</div>;
}
```

- `use`는 조건부 호출 가능 (일반 Hook과 다름)
- Suspense 바운더리 안에서 사용

### Server Actions

서버 뮤테이션을 `'use server'` 지시어로 정의한다.

```tsx
// lib/actions/profile.ts
'use server';

export async function updateProfile(formData: FormData) {
  const name = formData.get('name') as string;
  await supabase.from('users').update({ name }).eq('id', userId);
}

// 사용: form action 바인딩
<form action={updateProfile}>
  <input name="name" />
  <button type="submit">저장</button>
</form>;
```

### `useFormStatus`

폼 제출 상태를 추적한다.

```tsx
'use client';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? '처리 중...' : '저장'}
    </button>
  );
}
```

### 이룸 적용 기준

- 대부분 기존 API 라우트 패턴 유지
- Server Actions는 단순 폼 제출에만 적용
- 복잡한 비즈니스 로직은 API 라우트 사용

---

**Version**: 1.1 | **Updated**: 2026-02-11 | React 19 신기능 (use, Server Actions, useFormStatus) 추가
