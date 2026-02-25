/**
 * SkeletonLoader — 시머(shimmer) 스타일 로딩 플레이스홀더
 *
 * ActivityIndicator 대신 사용하는 콘텐츠 영역별 스켈레톤 컴포넌트.
 * 웹의 animate-pulse 패턴과 동일한 UX를 제공한다.
 *
 * 서브 컴포넌트:
 * - SkeletonLoader: 기본 (width/height/borderRadius 설정 가능)
 * - SkeletonText: 텍스트 플레이스홀더
 * - SkeletonCircle: 원형 플레이스홀더
 * - SkeletonCard: 카드형 플레이스홀더
 *
 * 접근성: useReducedMotion() 활성화 시 애니메이션 없이 정적 배경만 표시.
 */
import { useEffect } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useTheme } from '../../lib/theme';

// ---------------------------------------------------------------------------
// 공통 훅: 시머 opacity 애니메이션
// ---------------------------------------------------------------------------

/** 시머 애니메이션 opacity 값을 반환하는 내부 훅 */
function useShimmerOpacity(shouldAnimate: boolean): SharedValue<number> {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (!shouldAnimate) {
      // 접근성 모드: 정적 opacity
      opacity.value = 0.6;
      return;
    }

    // 0.3 → 1.0 → 0.3 무한 반복 (1.5초 주기)
    opacity.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [shouldAnimate, opacity]);

  return opacity;
}

// ---------------------------------------------------------------------------
// SkeletonLoader — 기본 컴포넌트
// ---------------------------------------------------------------------------

interface SkeletonLoaderProps {
  /** 너비 (숫자 또는 퍼센트 문자열). 기본값: '100%' */
  width?: ViewStyle['width'];
  /** 높이. 기본값: 16 */
  height?: number;
  /** 보더 반지름. 기본값: 4 */
  borderRadius?: number;
  /** 추가 스타일 */
  style?: ViewStyle;
  /** 테스트 식별자 */
  testID?: string;
}

export function SkeletonLoader({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
  testID,
}: SkeletonLoaderProps): React.JSX.Element {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const opacity = useShimmerOpacity(!reduceMotion);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        { backgroundColor: colors.muted, width, height, borderRadius },
        animatedStyle,
        style,
      ]}
      testID={testID}
      accessibilityRole="none"
      accessibilityLabel="로딩 중"
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonText — 텍스트 플레이스홀더
// ---------------------------------------------------------------------------

interface SkeletonTextProps {
  /** 추가 스타일 (width 오버라이드 등) */
  style?: ViewStyle;
  /** 테스트 식별자 */
  testID?: string;
}

export function SkeletonText({ style, testID }: SkeletonTextProps): React.JSX.Element {
  return (
    <SkeletonLoader
      height={14}
      borderRadius={4}
      style={style}
      testID={testID ?? 'skeleton-text'}
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonCircle — 원형 플레이스홀더
// ---------------------------------------------------------------------------

interface SkeletonCircleProps {
  /** 원의 지름. 기본값: 48 */
  size?: number;
  /** 추가 스타일 */
  style?: ViewStyle;
  /** 테스트 식별자 */
  testID?: string;
}

export function SkeletonCircle({
  size = 48,
  style,
  testID,
}: SkeletonCircleProps): React.JSX.Element {
  return (
    <SkeletonLoader
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
      testID={testID ?? 'skeleton-circle'}
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonCard — 카드형 플레이스홀더
// ---------------------------------------------------------------------------

interface SkeletonCardProps {
  /** 추가 스타일 */
  style?: ViewStyle;
  /** 테스트 식별자 */
  testID?: string;
}

export function SkeletonCard({ style, testID }: SkeletonCardProps): React.JSX.Element {
  const { radii } = useTheme();

  return (
    <SkeletonLoader
      height={120}
      borderRadius={radii.lg}
      style={style}
      testID={testID ?? 'skeleton-card'}
    />
  );
}

// ---------------------------------------------------------------------------
// 정적 스타일
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
