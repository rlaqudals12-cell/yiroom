/**
 * ScoreChangeBadge 컴포넌트
 *
 * 이전 분석 대비 점수 변화를 시각적으로 표시합니다.
 * - 상승: 초록색 + 상승 아이콘
 * - 하락: 빨간색 + 하락 아이콘
 * - 유지: 회색 + 유지 아이콘
 *
 * @example
 * ```tsx
 * <ScoreChangeBadge delta={5} />  // +5점
 * <ScoreChangeBadge delta={-3} /> // -3점
 * <ScoreChangeBadge delta={0} />  // 0점
 * ```
 */
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

// ============================================
// 타입 정의
// ============================================

export interface ScoreChangeBadgeProps {
  /** 점수 변화량 (양수: 상승, 음수: 하락, 0: 유지) */
  delta: number;
  /** 배지 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 이전 점수 표시 여부 */
  showPreviousScore?: boolean;
  /** 이전 점수 */
  previousScore?: number;
  /** 애니메이션 활성화 */
  animate?: boolean;
  /** 다크 모드 */
  isDark?: boolean;
}

// ============================================
// 상수
// ============================================

// 크기별 스타일
const SIZE_CONFIG = {
  sm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 11,
    iconSize: 12,
    gap: 2,
  },
  md: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    iconSize: 14,
    gap: 4,
  },
  lg: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 15,
    iconSize: 18,
    gap: 6,
  },
} as const;

// 방향별 색상
const DIRECTION_COLORS = {
  up: {
    bg: '#dcfce7', // emerald-100
    bgDark: 'rgba(16, 185, 129, 0.2)', // emerald-500/20
    text: '#059669', // emerald-600
    textDark: '#34d399', // emerald-400
  },
  down: {
    bg: '#fee2e2', // red-100
    bgDark: 'rgba(239, 68, 68, 0.2)', // red-500/20
    text: '#dc2626', // red-600
    textDark: '#f87171', // red-400
  },
  neutral: {
    bg: '#f3f4f6', // gray-100
    bgDark: 'rgba(107, 114, 128, 0.2)', // gray-500/20
    text: '#4b5563', // gray-600
    textDark: '#9ca3af', // gray-400
  },
} as const;

// ============================================
// 메인 컴포넌트
// ============================================

export function ScoreChangeBadge({
  delta,
  size = 'md',
  showPreviousScore = false,
  previousScore,
  animate = true,
  isDark = false,
}: ScoreChangeBadgeProps) {
  const config = SIZE_CONFIG[size];

  // 방향 결정
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';
  const colors = DIRECTION_COLORS[direction];

  // 아이콘 선택
  const IconComponent =
    direction === 'up'
      ? TrendingUp
      : direction === 'down'
        ? TrendingDown
        : Minus;

  // 접두사
  const prefix = delta > 0 ? '+' : '';

  // 애니메이션 값
  const opacity = useSharedValue(animate ? 0 : 1);
  const scale = useSharedValue(animate ? 0.8 : 1);

  useEffect(() => {
    if (animate) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    }
  }, [animate, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // 접근성 라벨
  const accessibilityLabel = `점수 변화: ${delta > 0 ? '상승' : delta < 0 ? '하락' : '유지'} ${prefix}${delta}점`;

  return (
    <Animated.View
      style={[
        styles.badge,
        animatedStyle,
        {
          backgroundColor: isDark ? colors.bgDark : colors.bg,
          paddingHorizontal: config.paddingHorizontal,
          paddingVertical: config.paddingVertical,
          gap: config.gap,
        },
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
    >
      <IconComponent
        size={config.iconSize}
        color={isDark ? colors.textDark : colors.text}
      />
      <Text
        style={[
          styles.text,
          {
            fontSize: config.fontSize,
            color: isDark ? colors.textDark : colors.text,
          },
        ]}
      >
        {prefix}
        {Math.abs(delta)}점
      </Text>
      {showPreviousScore && previousScore !== undefined && (
        <Text
          style={[
            styles.previousScore,
            {
              fontSize: config.fontSize * 0.9,
              color: isDark ? colors.textDark : colors.text,
            },
          ]}
        >
          (이전: {previousScore}점)
        </Text>
      )}
    </Animated.View>
  );
}

// ============================================
// MetricDelta 컴포넌트 (지표 옆 작은 변화량)
// ============================================

export interface MetricDeltaProps {
  /** 변화량 */
  delta: number;
  /** 크기 */
  size?: 'xs' | 'sm';
  /** 다크 모드 */
  isDark?: boolean;
}

/**
 * 지표 옆에 표시되는 작은 변화량 표시
 *
 * @example
 * ```tsx
 * <View style={{ flexDirection: 'row' }}>
 *   <Text>수분도: 85점</Text>
 *   <MetricDelta delta={3} />
 * </View>
 * ```
 */
export function MetricDelta({
  delta,
  size = 'xs',
  isDark = false,
}: MetricDeltaProps) {
  if (delta === 0) return null;

  const isPositive = delta > 0;
  const fontSize = size === 'xs' ? 10 : 12;
  const color = isPositive
    ? isDark
      ? '#34d399'
      : '#10b981'
    : isDark
      ? '#f87171'
      : '#ef4444';

  return (
    <Text
      style={[styles.metricDelta, { fontSize, color }]}
      accessibilityLabel={`변화: ${isPositive ? '+' : ''}${delta}`}
    >
      {isPositive ? '\u2191' : '\u2193'}
      {Math.abs(delta)}
    </Text>
  );
}

// ============================================
// 스타일
// ============================================

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
  },
  text: {
    fontWeight: '600',
  },
  previousScore: {
    opacity: 0.7,
    marginLeft: 4,
  },
  metricDelta: {
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default ScoreChangeBadge;
