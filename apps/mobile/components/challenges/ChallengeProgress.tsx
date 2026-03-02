/**
 * ChallengeProgress -- 챌린지 진행률 시각화
 *
 * SVG 원형 게이지 또는 바 형태로 현재 값 대비 목표 표시.
 * Reanimated SVG stroke 애니메이션 포함.
 */
import React, { useEffect } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme, spacing } from '../../lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ChallengeProgressProps {
  /** 현재 달성 값 */
  current: number;
  /** 목표 값 */
  target: number;
  /** 단위 (예: 'km', '회', '분') */
  unit: string;
  /** 라벨 (예: '달리기', '스쿼트') */
  label: string;
  /** 게이지 크기 (기본 100) */
  size?: number;
  /** 선 두께 (기본 10) */
  strokeWidth?: number;
  /** 애니메이션 활성화 (기본 true) */
  animated?: boolean;
  /** 추가 스타일 */
  style?: ViewStyle;
  /** 테스트 ID */
  testID?: string;
}

export function ChallengeProgress({
  current,
  target,
  unit,
  label,
  size = 100,
  strokeWidth = 10,
  animated = true,
  style,
  testID = 'challenge-progress',
}: ChallengeProgressProps): React.JSX.Element {
  const { colors, module, typography, spacing } = useTheme();
  const accentColor = module.workout.base;
  const accentLight = module.workout.light;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // 진행률 클램프 (0~1)
  const ratio = target > 0 ? Math.min(current / target, 1) : 0;
  const percentage = Math.round(ratio * 100);

  // SVG stroke 애니메이션
  const progress = useSharedValue(animated ? 0 : ratio);

  useEffect(() => {
    if (animated) {
      progress.value = withTiming(ratio, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progress.value = ratio;
    }
  }, [ratio, animated, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View
      testID={testID}
      style={[styles.container, style]}
      accessibilityLabel={`${label}: ${current}${unit} / ${target}${unit}, ${percentage}% 달성`}
      accessibilityRole="progressbar"
    >
      {/* 원형 게이지 */}
      <View style={[styles.gaugeContainer, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          {/* 배경 트랙 */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.muted}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* 프로그레스 */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={accentColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* 중앙 텍스트 */}
        <View style={styles.centerText}>
          <Text
            style={{
              fontSize: size * 0.2,
              fontWeight: typography.weight.bold,
              color: accentColor,
            }}
          >
            {percentage}%
          </Text>
        </View>
      </View>

      {/* 라벨 + 수치 */}
      <Text
        style={[
          styles.label,
          {
            color: colors.foreground,
            fontSize: typography.size.sm,
            fontWeight: typography.weight.semibold,
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.valueText,
          {
            color: colors.mutedForeground,
            fontSize: typography.size.xs,
          },
        ]}
      >
        {current}{unit} / {target}{unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  valueText: {
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
});
