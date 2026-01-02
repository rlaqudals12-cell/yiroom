# SDD: UX 마이크로인터랙션 개선

> 버전: 1.0
> 작성일: 2026-01-02
> 상태: 구현 완료

---

## 1. 개요

### 1.1 목적

사용자 경험 향상을 위한 마이크로인터랙션 및 시각적 피드백 강화.

### 1.2 핵심 가치

- **즉각적 피드백**: 사용자 액션에 대한 시각적 응답
- **로딩 UX 개선**: 스켈레톤 로더로 체감 속도 향상
- **모던 디자인**: Glassmorphism으로 시각적 깊이감

### 1.3 기대 효과

| 개선 항목        | 효과                                |
| ---------------- | ----------------------------------- |
| 마이크로인터랙션 | 사용자 참여 25% 증가 (Gartner 예측) |
| 동적 애니메이션  | 참여율 15% 증가 (Toptal 연구)       |
| 축하 애니메이션  | 리텐션 18% 증가 (VWO 사례)          |

---

## 2. 버튼 탭 피드백

### 2.1 요구사항

- 탭 시 미세한 스케일 축소 (눌림 효과)
- 부드러운 트랜지션 (150ms)
- 모든 버튼 variant에 일괄 적용

### 2.2 구현

```typescript
// components/ui/button.tsx
const buttonVariants = cva(
  "... transition-all duration-150 active:scale-[0.98] active:opacity-90 ...",
  { ... }
);
```

### 2.3 CSS 클래스

| 클래스                | 값    | 설명               |
| --------------------- | ----- | ------------------ |
| `duration-150`        | 150ms | 트랜지션 지속 시간 |
| `active:scale-[0.98]` | 98%   | 탭 시 스케일       |
| `active:opacity-90`   | 90%   | 탭 시 불투명도     |

### 2.4 적용 범위

- `Button` 컴포넌트의 모든 variant (default, destructive, outline, secondary, ghost, link)
- `buttonVariants`를 사용하는 모든 요소

---

## 3. 스켈레톤 패턴

### 3.1 요구사항

- 재사용 가능한 스켈레톤 패턴 컴포넌트
- 다양한 레이아웃 지원 (카드, 리스트, 그리드)
- 로딩 상태 표현

### 3.2 컴포넌트 목록

| 컴포넌트                | 용도           | 구성                         |
| ----------------------- | -------------- | ---------------------------- |
| `CardSkeleton`          | 기본 카드 로딩 | 제목 + 본문 2줄              |
| `ListItemSkeleton`      | 리스트 아이템  | 아바타 + 텍스트 2줄          |
| `ListSkeleton`          | 리스트 전체    | ListItemSkeleton x N         |
| `StatCardSkeleton`      | 통계 카드      | 라벨 + 아이콘 + 값 + 설명    |
| `DashboardSkeleton`     | 대시보드 전체  | 통계 + 카드 + 리스트         |
| `ImageCardSkeleton`     | 이미지 카드    | 이미지 + 텍스트              |
| `ProductGridSkeleton`   | 제품 그리드    | ImageCardSkeleton x N        |
| `ChartSkeleton`         | 차트 영역      | 헤더 + 차트 플레이스홀더     |
| `ProfileHeaderSkeleton` | 프로필 헤더    | 아바타 + 이름 + 설명         |
| `FormSkeleton`          | 폼 전체        | FormFieldSkeleton x N + 버튼 |

### 3.3 구현 예시

```tsx
// components/ui/skeleton-patterns.tsx
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border bg-card p-4 space-y-3', className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}
```

### 3.4 사용법

```tsx
import { CardSkeleton, ListSkeleton } from '@/components/ui/skeleton-patterns';

// 로딩 상태
if (isLoading) {
  return <CardSkeleton />;
}

// Suspense fallback
<Suspense fallback={<ListSkeleton count={5} />}>
  <DataList />
</Suspense>;
```

---

## 4. Glassmorphism 카드

### 4.1 요구사항

- 반투명 유리 효과
- 블러 강도 조절 가능
- 다크/라이트 모드 지원
- 호버 효과 옵션

### 4.2 Props

| Prop        | 타입                 | 기본값 | 설명        |
| ----------- | -------------------- | ------ | ----------- |
| `blur`      | 'sm' \| 'md' \| 'lg' | 'md'   | 블러 강도   |
| `opacity`   | 10-90                | 20     | 배경 투명도 |
| `bordered`  | boolean              | true   | 테두리 표시 |
| `hoverable` | boolean              | false  | 호버 효과   |

### 4.3 구현

```tsx
// components/ui/glass-card.tsx
const blurStyles = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
} as const;

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ blur = 'md', opacity = 20, bordered = true, hoverable = false, ... }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl text-card-foreground shadow-lg',
        blurStyles[blur],
        `bg-white/${opacity} dark:bg-black/${opacity}`,
        bordered && 'border border-white/20 dark:border-white/10',
        hoverable && 'transition-all duration-200 hover:bg-white/30 dark:hover:bg-black/30 hover:shadow-xl',
        className
      )}
      {...props}
    />
  )
);
```

### 4.4 사용법

```tsx
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from '@/components/ui/glass-card';

<GlassCard blur="md" opacity={20} hoverable>
  <GlassCardHeader>
    <GlassCardTitle>제목</GlassCardTitle>
  </GlassCardHeader>
  <GlassCardContent>내용</GlassCardContent>
</GlassCard>;
```

### 4.5 적용 권장 위치

- 대시보드 위젯
- 플로팅 카드
- 모달 배경
- 히어로 섹션 오버레이

---

## 5. React Compiler 활성화

### 5.1 요구사항

- 자동 메모이제이션으로 불필요한 리렌더 감소
- 수동 `useMemo`/`useCallback` 의존도 감소

### 5.2 구현

```typescript
// next.config.ts
const nextConfig: NextConfig & { experimental: { reactCompiler?: boolean } } = {
  experimental: {
    reactCompiler: true,
    // ...
  },
};
```

### 5.3 요구 패키지

```bash
npm install babel-plugin-react-compiler --save-dev
```

### 5.4 기대 효과

- 리렌더 25-40% 감소
- 번들 크기 최적화
- 개발자 경험 향상

---

## 6. 구현 파일

| 파일                                  | 변경 내용                 |
| ------------------------------------- | ------------------------- |
| `components/ui/button.tsx`            | 탭 피드백 클래스 추가     |
| `components/ui/skeleton-patterns.tsx` | 신규 생성 (10개 패턴)     |
| `components/ui/glass-card.tsx`        | 신규 생성 (Glassmorphism) |
| `next.config.ts`                      | React Compiler 활성화     |

---

## 7. 접근성 고려사항

### 7.1 애니메이션

- `prefers-reduced-motion` 미디어 쿼리 존중
- 과도한 움직임 회피 (scale 2% 이내)

### 7.2 색상 대비

- Glassmorphism 사용 시 텍스트 가독성 확보
- 최소 WCAG AA 대비율 유지

### 7.3 터치 타겟

- 모든 버튼 최소 24px (WCAG 2.2)
- 현재 버튼 size 확인: default(36px), sm(32px), lg(40px), icon(36px) ✅

---

## 8. 테스트 체크리스트

- [x] 버튼 탭 피드백: 모든 variant에서 동작
- [x] 스켈레톤 패턴: 각 컴포넌트 렌더링 확인
- [x] Glassmorphism: 다크/라이트 모드 확인
- [x] React Compiler: TypeCheck 통과
- [x] 접근성: 터치 타겟 24px 이상

---

## 9. 참고

- 리서치: [UXUI-TECH-RESEARCH-2026.md](./UXUI-TECH-RESEARCH-2026.md)
- 트렌드: Gartner 2025 - 75% 앱이 마이크로인터랙션 표준 적용 예측
- 사례: 피트니스 앱 축하 애니메이션 → 리텐션 18% 증가 (VWO)
