# 이룸 공통 컴포넌트 라이브러리

> **버전**: 1.0.0  
> **작성일**: 2025-12-18  
> **위치**: `components/common/` 또는 `components/ui/`

---

## 📋 컴포넌트 분류

| 카테고리 | 컴포넌트 수 | 설명 |
|----------|------------|------|
| **레이아웃** | 5 | 페이지 구조, 네비게이션 |
| **피드백** | 6 | 로딩, 에러, 알림 |
| **데이터 표시** | 8 | 카드, 리스트, 차트 |
| **입력** | 6 | 버튼, 폼, 선택 |
| **게이미피케이션** | 4 | 스트릭, 포인트, 배지 |

---

## 1. 레이아웃 컴포넌트

### 1.1 BottomNavigation

```tsx
// components/common/BottomNavigation.tsx

interface NavItem {
  id: string;
  icon: string;
  label: string;
  href: string;
}

interface BottomNavigationProps {
  items: NavItem[];
  activeId: string;
  variant?: 'default' | 'workout' | 'nutrition';
}

// 사용 예시
<BottomNavigation
  items={[
    { id: 'home', icon: '🏠', label: '홈', href: '/home' },
    { id: 'workout', icon: '💪', label: '운동', href: '/workout' },
    { id: 'nutrition', icon: '🥗', label: '영양', href: '/nutrition' },
    { id: 'my', icon: '👤', label: 'MY', href: '/my' },
  ]}
  activeId="home"
/>
```

### 1.2 PageHeader

```tsx
// components/common/PageHeader.tsx

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  variant?: 'default' | 'transparent';
}

// 사용 예시
<PageHeader
  title="운동 기록"
  showBack
  rightAction={<Button variant="ghost">편집</Button>}
/>
```

### 1.3 PageContainer

```tsx
// components/common/PageContainer.tsx

interface PageContainerProps {
  children: React.ReactNode;
  hasBottomNav?: boolean; // pb-20 자동 추가
  className?: string;
}

// 사용 예시
<PageContainer hasBottomNav>
  <PageHeader title="홈" />
  {/* 콘텐츠 */}
</PageContainer>
```

### 1.4 Section

```tsx
// components/common/Section.tsx

interface SectionProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// 사용 예시
<Section 
  title="✨ 오늘의 추천" 
  action={<Link href="/explore">더보기</Link>}
>
  {/* 카드들 */}
</Section>
```

### 1.5 Modal / BottomSheet

```tsx
// components/common/BottomSheet.tsx

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: 'auto' | 'half' | 'full';
}

// 사용 예시
<BottomSheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="음식 선택"
  height="half"
>
  <FoodSelector />
</BottomSheet>
```

---

## 2. 피드백 컴포넌트

### 2.1 LoadingSpinner

```tsx
// components/common/LoadingSpinner.tsx

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  fullScreen?: boolean;
  message?: string;
}

// 사용 예시
<LoadingSpinner size="lg" message="음식 인식 중..." fullScreen />
```

### 2.2 Skeleton

```tsx
// components/common/Skeleton.tsx

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
}

// 사용 예시
<Skeleton variant="card" height={120} />
<Skeleton variant="text" width="60%" />
<Skeleton variant="circular" width={48} height={48} />
```

### 2.3 EmptyState

```tsx
// components/common/EmptyState.tsx

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// 사용 예시
<EmptyState
  icon="🏋️"
  title="아직 운동 기록이 없어요"
  description="첫 운동을 시작해볼까요?"
  action={{
    label: "운동 시작하기",
    onClick: () => router.push('/workout')
  }}
/>
```

### 2.4 ErrorState

```tsx
// components/common/ErrorState.tsx

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

// 사용 예시
<ErrorState
  title="데이터를 불러올 수 없어요"
  message="네트워크 연결을 확인해주세요"
  onRetry={refetch}
/>
```

### 2.5 Toast

```tsx
// components/common/Toast.tsx
// + hooks/useToast.ts

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// 사용 예시
const { showToast } = useToast();
showToast({ type: 'success', message: '운동 완료! 🎉' });
```

### 2.6 ConfirmDialog

```tsx
// components/common/ConfirmDialog.tsx

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';
}

// 사용 예시
<ConfirmDialog
  isOpen={isOpen}
  title="운동 종료"
  message="정말 운동을 종료할까요? 진행 상황이 저장돼요."
  confirmLabel="종료하기"
  onConfirm={handleExit}
  onCancel={() => setIsOpen(false)}
/>
```

---

## 3. 데이터 표시 컴포넌트

### 3.1 ProgressRing

```tsx
// components/common/ProgressRing.tsx

interface ProgressRingProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg' | number;
  strokeWidth?: number;
  color?: string;
  gradientColors?: [string, string];
  children?: React.ReactNode;
  showPercentage?: boolean;
}

// 사용 예시
<ProgressRing progress={75} size="lg" gradientColors={['#7C3AED', '#4CD4A1']}>
  <span className="text-3xl font-bold">75%</span>
</ProgressRing>
```

### 3.2 ProgressBar

```tsx
// components/common/ProgressBar.tsx

interface ProgressBarProps {
  current: number;
  max: number;
  color?: string;
  showLabel?: boolean;
  label?: string;
  height?: 'sm' | 'md' | 'lg';
}

// 사용 예시
<ProgressBar 
  current={65} 
  max={180} 
  color="#4CD4A1" 
  label="탄수화물"
  showLabel
/>
```

### 3.3 Card

```tsx
// components/common/Card.tsx

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

// 사용 예시
<Card variant="elevated" padding="md" onClick={handleClick}>
  <CardContent />
</Card>
```

### 3.4 Badge

```tsx
// components/common/Badge.tsx

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  icon?: string;
}

// 사용 예시
<Badge variant="success" icon="✓">완료</Badge>
<Badge variant="warning">92% 매칭</Badge>
```

### 3.5 Tag

```tsx
// components/common/Tag.tsx

interface TagProps {
  children: React.ReactNode;
  color?: string;
  removable?: boolean;
  onRemove?: () => void;
}

// 사용 예시
<Tag color="#7C3AED">하체</Tag>
<Tag color="#4CD4A1" removable onRemove={handleRemove}>맨몸</Tag>
```

### 3.6 Avatar

```tsx
// components/common/Avatar.tsx

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackColor?: string;
}

// 사용 예시
<Avatar name="민지" size="md" />
<Avatar src="/profile.jpg" name="민지" size="lg" />
```

### 3.7 StatCard

```tsx
// components/common/StatCard.tsx

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  change?: number; // +/- 퍼센트
  color?: string;
}

// 사용 예시
<StatCard
  icon="🔥"
  value="750"
  label="소모 칼로리"
  change={15}
  color="#FF6B6B"
/>
```

### 3.8 ListItem

```tsx
// components/common/ListItem.tsx

interface ListItemProps {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  divider?: boolean;
}

// 사용 예시
<ListItem
  leading={<Avatar name="김치찌개" />}
  title="김치찌개"
  subtitle="200 kcal • 1인분"
  trailing={<Badge>🟢 Green</Badge>}
  onClick={handleClick}
/>
```

---

## 4. 입력 컴포넌트

### 4.1 Button

```tsx
// components/common/Button.tsx

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'full';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  gradientColors?: [string, string];
}

// 사용 예시
<Button variant="primary" size="full" loading={isLoading}>
  운동 시작하기
</Button>
<Button variant="outline" icon="📷">
  사진으로 기록
</Button>
```

### 4.2 IconButton

```tsx
// components/common/IconButton.tsx

interface IconButtonProps {
  icon: string;
  onClick: () => void;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  ariaLabel: string;
}

// 사용 예시
<IconButton icon="❤️" onClick={handleLike} ariaLabel="좋아요" />
<IconButton icon="←" onClick={goBack} variant="filled" ariaLabel="뒤로가기" />
```

### 4.3 OptionSelector

```tsx
// components/common/OptionSelector.tsx

interface Option {
  id: string;
  emoji?: string;
  label: string;
  value: string;
  description?: string;
}

interface OptionSelectorProps {
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  variant?: 'default' | 'card';
  multiSelect?: boolean;
}

// 사용 예시 (온보딩)
<OptionSelector
  options={[
    { id: '1', emoji: '🔥', label: '체중 감량', value: 'weight_loss' },
    { id: '2', emoji: '💪', label: '근력 강화', value: 'muscle_gain' },
  ]}
  value={selectedGoal}
  onChange={setSelectedGoal}
  variant="card"
/>
```

### 4.4 SearchInput

```tsx
// components/common/SearchInput.tsx

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
}

// 사용 예시
<SearchInput
  value={query}
  onChange={setQuery}
  placeholder="음식 검색..."
  onSubmit={handleSearch}
/>
```

### 4.5 Slider

```tsx
// components/common/Slider.tsx

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  unit?: string;
}

// 사용 예시
<Slider
  value={calories}
  onChange={setCalories}
  min={1200}
  max={3000}
  step={50}
  label="일일 칼로리 목표"
  showValue
  unit="kcal"
/>
```

### 4.6 Counter

```tsx
// components/common/Counter.tsx

interface CounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: 'sm' | 'md' | 'lg';
}

// 사용 예시 (음식 수량 조절)
<Counter
  value={quantity}
  onChange={setQuantity}
  min={0.5}
  max={10}
  step={0.5}
/>
```

---

## 5. 게이미피케이션 컴포넌트

### 5.1 StreakBadge

```tsx
// components/common/StreakBadge.tsx

interface StreakBadgeProps {
  days: number;
  type?: 'workout' | 'nutrition' | 'combined';
  size?: 'sm' | 'md' | 'lg';
  showAnimation?: boolean;
}

// 사용 예시
<StreakBadge days={5} type="workout" showAnimation />
<StreakBadge days={3} type="nutrition" size="lg" />
```

### 5.2 StreakCalendar

```tsx
// components/common/StreakCalendar.tsx

interface StreakCalendarProps {
  year: number;
  month: number;
  completedDates: number[];
  onDateClick?: (date: number) => void;
  onMonthChange?: (year: number, month: number) => void;
}

// 사용 예시
<StreakCalendar
  year={2024}
  month={11}
  completedDates={[1, 2, 3, 5, 6, 8, 9, 10]}
  onMonthChange={handleMonthChange}
/>
```

### 5.3 PointsBadge

```tsx
// components/common/PointsBadge.tsx

interface PointsBadgeProps {
  points: number;
  level?: number;
  showLevel?: boolean;
  size?: 'sm' | 'md';
}

// 사용 예시
<PointsBadge points={1250} level={3} showLevel />
```

### 5.4 AchievementToast

```tsx
// components/common/AchievementToast.tsx

interface AchievementToastProps {
  title: string;
  description: string;
  icon: string;
  points?: number;
  onClose: () => void;
}

// 사용 예시 (운동/기록 완료 시)
<AchievementToast
  title="3일 연속 달성! 🔥"
  description="꾸준함이 최고예요"
  icon="🏆"
  points={20}
  onClose={handleClose}
/>
```

---

## 6. 파일 구조

```
components/
├── common/
│   ├── layout/
│   │   ├── BottomNavigation.tsx
│   │   ├── PageHeader.tsx
│   │   ├── PageContainer.tsx
│   │   ├── Section.tsx
│   │   └── BottomSheet.tsx
│   ├── feedback/
│   │   ├── LoadingSpinner.tsx
│   │   ├── Skeleton.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── Toast.tsx
│   │   └── ConfirmDialog.tsx
│   ├── display/
│   │   ├── ProgressRing.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Tag.tsx
│   │   ├── Avatar.tsx
│   │   ├── StatCard.tsx
│   │   └── ListItem.tsx
│   ├── input/
│   │   ├── Button.tsx
│   │   ├── IconButton.tsx
│   │   ├── OptionSelector.tsx
│   │   ├── SearchInput.tsx
│   │   ├── Slider.tsx
│   │   └── Counter.tsx
│   └── gamification/
│       ├── StreakBadge.tsx
│       ├── StreakCalendar.tsx
│       ├── PointsBadge.tsx
│       └── AchievementToast.tsx
├── workout/          # W-1 전용 컴포넌트
├── nutrition/        # N-1 전용 컴포넌트
└── index.ts          # 배럴 export
```

---

## 7. 사용 가이드

### 7.1 Import 방식

```tsx
// 배럴 import (권장)
import { Button, Card, ProgressRing } from '@/components/common';

// 개별 import
import { Button } from '@/components/common/input/Button';
```

### 7.2 Tailwind 확장

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED',
        secondary: '#4CD4A1',
        coral: '#FF6B6B',
      },
      animation: {
        'bounce-subtle': 'bounce 1s ease-in-out 2',
        'pulse-ring': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
};
```

### 7.3 컴포넌트 생성 순서

```
1. 레이아웃 (BottomNav, PageHeader) → 모든 페이지에서 사용
2. 피드백 (LoadingSpinner, EmptyState) → UX 필수
3. 입력 (Button, OptionSelector) → 인터랙션 필수
4. 데이터 표시 (Card, ProgressRing) → 화면별 구현 시
5. 게이미피케이션 (StreakBadge) → 마지막 고도화
```

---

**컴포넌트 추가 요청 시:**
```
[컴포넌트명]을 components/common/[카테고리]/ 에 생성해줘.
Props: [props 목록]
사용 예시: [예시 코드]
```
