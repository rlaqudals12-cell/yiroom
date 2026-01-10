# 모바일 앱 고도화 스펙

> apps/mobile 피부 분석 결과 화면 개선

## 1. 개요

### 1.1 목적

웹에서 구현된 피부 분석 UX 개선사항을 모바일 앱에 적용

### 1.2 범위

- 피부 분석 결과 화면 개선
- CircularProgress 네이티브 구현
- ScoreChangeBadge 네이티브 구현
- 스와이프 탭 네비게이션

---

## 2. 구현 대상

### 2.1 웹 → 모바일 포팅 컴포넌트

| 웹 컴포넌트        | 모바일 구현            | 설명                         |
| ------------------ | ---------------------- | ---------------------------- |
| `CircularProgress` | `CircularProgress.tsx` | SVG → react-native-svg       |
| `ScoreChangeBadge` | `ScoreChangeBadge.tsx` | 델타 표시                    |
| `useSwipeTab`      | 네이티브 제스처        | react-native-gesture-handler |

### 2.2 파일 구조

```
apps/mobile/
├── components/
│   └── analysis/
│       ├── CircularProgress.tsx    # 신규
│       ├── ScoreChangeBadge.tsx    # 신규
│       └── SkinResultCard.tsx      # 수정
├── app/
│   └── (analysis)/
│       └── skin/
│           └── result.tsx          # 수정
└── hooks/
    └── useSwipeNavigation.ts       # 신규 (옵션)
```

---

## 3. 기술 구현

### 3.1 CircularProgress (React Native)

```typescript
// components/analysis/CircularProgress.tsx
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, withTiming } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showScore?: boolean;
}

export function CircularProgress({
  score,
  size = 120,
  strokeWidth = 10,
  showScore = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: withTiming(
      circumference * (1 - score / 100),
      { duration: 1200 }
    ),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={getGradeColor(score).start} />
            <Stop offset="100%" stopColor={getGradeColor(score).end} />
          </LinearGradient>
        </Defs>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e5e5"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#grad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {showScore && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      )}
    </View>
  );
}
```

### 3.2 ScoreChangeBadge

```typescript
// components/analysis/ScoreChangeBadge.tsx
import { View, Text } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

interface ScoreChangeBadgeProps {
  delta: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreChangeBadge({ delta, size = 'md' }: ScoreChangeBadgeProps) {
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const color = delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : '#6b7280';

  return (
    <View style={[styles.badge, styles[size]]}>
      <Icon size={iconSizes[size]} color={color} />
      <Text style={[styles.text, { color }]}>
        {delta > 0 ? '+' : ''}{delta}
      </Text>
    </View>
  );
}
```

### 3.3 스와이프 네비게이션

```typescript
// 기존 expo-router의 탭 스와이프 활용
// 또는 react-native-pager-view 사용

import PagerView from 'react-native-pager-view';

<PagerView
  style={styles.pagerView}
  initialPage={0}
  onPageSelected={(e) => setActiveTab(e.nativeEvent.position)}
>
  <View key="overview">
    <OverviewTab />
  </View>
  <View key="details">
    <DetailsTab />
  </View>
  <View key="history">
    <HistoryTab />
  </View>
</PagerView>
```

---

## 4. 의존성

### 4.1 필요 패키지

```bash
# 이미 설치됨
react-native-svg
react-native-reanimated

# 필요시 추가
react-native-pager-view  # 스와이프 탭용
```

---

## 5. 테스트

- [ ] CircularProgress 애니메이션 테스트
- [ ] ScoreChangeBadge 델타 표시 테스트
- [ ] 스와이프 네비게이션 테스트
- [ ] 접근성 테스트 (VoiceOver/TalkBack)

---

## 6. 예상 파일 수

- 신규: 3-4개
- 수정: 2-3개

---

**작성일**: 2026-01-10
**작성자**: Claude Code
