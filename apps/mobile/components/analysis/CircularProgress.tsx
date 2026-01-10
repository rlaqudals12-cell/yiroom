/**
 * CircularProgress 컴포넌트
 *
 * 점수를 원형 게이지로 시각화하며, 등급별 그라데이션 색상과
 * 0 -> 점수 애니메이션을 지원합니다.
 *
 * @example
 * ```tsx
 * <CircularProgress score={85} size="lg" animate />
 * ```
 */
import { useEffect } from 'react';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

// React import 추가 (useDerivedValue에서 사용)

// ============================================
// 타입 정의
// ============================================

export type AnalysisGrade = 'diamond' | 'gold' | 'silver' | 'bronze';

export interface CircularProgressProps {
  /** 현재 점수 (0-100) */
  score: number;
  /** 컴포넌트 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 애니메이션 활성화 */
  animate?: boolean;
  /** 애니메이션 지속 시간 (ms) */
  duration?: number;
  /** 점수 표시 여부 */
  showScore?: boolean;
  /** 등급 라벨 표시 여부 */
  showGradeLabel?: boolean;
  /** 다크 모드 */
  isDark?: boolean;
}

// ============================================
// 상수
// ============================================

// 크기별 설정
const SIZE_CONFIG = {
  sm: {
    size: 80,
    strokeWidth: 6,
    fontSize: 18,
    labelSize: 10,
  },
  md: {
    size: 120,
    strokeWidth: 8,
    fontSize: 24,
    labelSize: 12,
  },
  lg: {
    size: 160,
    strokeWidth: 10,
    fontSize: 32,
    labelSize: 14,
  },
} as const;

// 등급별 설정
interface GradeConfig {
  grade: AnalysisGrade;
  label: string;
  minScore: number;
  maxScore: number;
  colors: { start: string; end: string };
  textColor: string;
}

const GRADE_CONFIGS: GradeConfig[] = [
  {
    grade: 'diamond',
    label: '다이아몬드',
    minScore: 85,
    maxScore: 101,
    colors: { start: '#06b6d4', end: '#3b82f6' }, // cyan-500 -> blue-500
    textColor: '#06b6d4',
  },
  {
    grade: 'gold',
    label: '골드',
    minScore: 70,
    maxScore: 85,
    colors: { start: '#f59e0b', end: '#f97316' }, // amber-500 -> orange-500
    textColor: '#f59e0b',
  },
  {
    grade: 'silver',
    label: '실버',
    minScore: 50,
    maxScore: 70,
    colors: { start: '#6b7280', end: '#64748b' }, // gray-500 -> slate-500
    textColor: '#6b7280',
  },
  {
    grade: 'bronze',
    label: '브론즈',
    minScore: 0,
    maxScore: 50,
    colors: { start: '#f97316', end: '#ef4444' }, // orange-500 -> red-500
    textColor: '#f97316',
  },
];

// 점수 -> 등급 변환
function getGradeFromScore(score: number): GradeConfig {
  const clampedScore = Math.max(0, Math.min(100, score));
  const config = GRADE_CONFIGS.find(
    (c) => clampedScore >= c.minScore && clampedScore < c.maxScore
  );
  return config || GRADE_CONFIGS[GRADE_CONFIGS.length - 1];
}

// ============================================
// Animated Circle 컴포넌트
// ============================================

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ============================================
// 메인 컴포넌트
// ============================================

export function CircularProgress({
  score,
  size = 'md',
  animate = true,
  duration = 1200,
  showScore = true,
  showGradeLabel = false,
  isDark = false,
}: CircularProgressProps) {
  const config = SIZE_CONFIG[size];
  const gradeConfig = getGradeFromScore(score);

  // SVG 원형 게이지 계산
  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = config.size / 2;

  // 애니메이션 값
  const progress = useSharedValue(animate ? 0 : score);
  const displayScore = useSharedValue(animate ? 0 : score);

  // 애니메이션 실행
  useEffect(() => {
    if (animate) {
      progress.value = withTiming(score, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
      displayScore.value = withTiming(score, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progress.value = score;
      displayScore.value = score;
    }
  }, [score, animate, duration, progress, displayScore]);

  // 애니메이션 props (strokeDashoffset)
  const animatedProps = useAnimatedProps(() => {
    const offset = circumference - (progress.value / 100) * circumference;
    return {
      strokeDashoffset: offset,
    };
  });

  // 표시 점수 추출
  const [animatedScore, setAnimatedScore] = React.useState(animate ? 0 : score);

  useDerivedValue(() => {
    runOnJS(setAnimatedScore)(Math.round(displayScore.value));
  });

  // 그라데이션 ID (고유)
  const gradientId = `circular-progress-${size}-${gradeConfig.grade}`;

  return (
    <View
      style={[styles.container, { width: config.size, height: config.size }]}
      accessibilityLabel={`피부 점수 ${score}점, ${gradeConfig.label} 등급`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: score }}
    >
      <Svg
        width={config.size}
        height={config.size}
        viewBox={`0 0 ${config.size} ${config.size}`}
      >
        {/* 그라데이션 정의 */}
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={gradeConfig.colors.start} />
            <Stop offset="100%" stopColor={gradeConfig.colors.end} />
          </LinearGradient>
        </Defs>

        {/* 배경 원 */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={isDark ? '#333333' : '#e5e5e5'}
          strokeWidth={config.strokeWidth}
        />

        {/* Progress 원 */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>

      {/* 중앙 콘텐츠 */}
      {showScore && (
        <View style={styles.scoreContainer}>
          <Text
            style={[
              styles.scoreText,
              {
                fontSize: config.fontSize,
                color: gradeConfig.textColor,
              },
            ]}
          >
            {animatedScore}
            <Text
              style={[styles.scoreUnit, { fontSize: config.fontSize * 0.5 }]}
            >
              점
            </Text>
          </Text>
          {showGradeLabel && (
            <Text
              style={[
                styles.gradeLabel,
                {
                  fontSize: config.labelSize,
                  color: gradeConfig.textColor,
                },
              ]}
            >
              {gradeConfig.label}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ============================================
// 스타일
// ============================================

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontWeight: '700',
  },
  scoreUnit: {
    fontWeight: '400',
  },
  gradeLabel: {
    marginTop: 2,
    fontWeight: '500',
  },
});

export default CircularProgress;
