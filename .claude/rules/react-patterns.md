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

---

**Version**: 1.0 | **Updated**: 2026-01-15 | coding-standards React 부분 추출
