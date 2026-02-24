/**
 * ScoreGauge — SVG 원형 게이지
 *
 * 0-100 점수를 원형 프로그레스로 시각화.
 * Reanimated SVG stroke 애니메이션 포함.
 */
import { useEffect } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '../../lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreGaugeProps {
  /** 현재 점수 (0-max) */
  score: number;
  /** 최대값 (기본 100) */
  max?: number;
  /** 게이지 색상 (기본 brand.primary) */
  color?: string;
  /** 중앙 하단 라벨 */
  label?: string;
  /** 게이지 크기 (기본 80) */
  size?: number;
  /** 선 두께 (기본 8) */
  strokeWidth?: number;
  /** 애니메이션 활성화 (기본 true) */
  animated?: boolean;
  /** 애니메이션 딜레이 (ms) */
  delay?: number;
  /** 값 표시 포맷 (기본 정수) */
  formatValue?: (value: number) => string;
  /** 단위 텍스트 (예: '%', '점') */
  unit?: string;
  style?: ViewStyle;
  testID?: string;
}

export function ScoreGauge({
  score,
  max = 100,
  color,
  label,
  size = 80,
  strokeWidth = 8,
  animated = true,
  delay = 0,
  formatValue,
  unit,
  style,
  testID,
}: ScoreGaugeProps): React.JSX.Element {
  const { colors, brand, typography } = useTheme();
  const gaugeColor = color ?? brand.primary;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(score, max));
  const targetRatio = max > 0 ? clampedScore / max : 0;

  // SVG stroke 애니메이션
  const progress = useSharedValue(animated ? 0 : targetRatio);

  useEffect(() => {
    if (animated) {
      progress.value = withDelay(delay, withTiming(targetRatio, { duration: 800 }));
    } else {
      progress.value = targetRatio;
    }
  }, [animated, delay, targetRatio, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const displayText = formatValue
    ? formatValue(clampedScore)
    : `${Math.round(clampedScore)}`;

  return (
    <View
      style={[styles.container, { width: size, height: size }, style]}
      testID={testID}
      accessibilityLabel={`${label ?? '점수'} ${displayText}${unit ?? ''}`}
      accessibilityRole="progressbar"
    >
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
          stroke={gaugeColor}
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
            fontSize: size * 0.22,
            fontWeight: typography.weight.bold,
            color: gaugeColor,
          }}
        >
          {displayText}
          {unit && (
            <Text style={{ fontSize: size * 0.13, fontWeight: typography.weight.medium }}>
              {unit}
            </Text>
          )}
        </Text>
        {label && (
          <Text
            style={{
              fontSize: Math.max(size * 0.11, 9),
              color: colors.mutedForeground,
              marginTop: 1,
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
