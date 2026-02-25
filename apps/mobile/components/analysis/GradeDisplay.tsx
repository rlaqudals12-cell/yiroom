/**
 * 분석 등급 표시 컴포넌트
 *
 * 신뢰도 점수(0-100)를 기반으로 Diamond/Gold/Silver/Bronze 등급을
 * 시각적으로 표시합니다. 수평 프로그레스 바와 마일스톤 마커를 포함하며,
 * 마운트 시 애니메이션으로 채워집니다.
 *
 * @example
 * ```tsx
 * <GradeDisplay confidence={92} />
 * <GradeDisplay confidence={75} showProgress={false} />
 * ```
 */
import { useEffect } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';

import { useTheme } from '../../lib/theme';

// ============================================
// 등급 계산 헬퍼
// ============================================

interface GradeInfo {
  /** 등급 영문명 */
  name: string;
  /** 등급 대표 색상 */
  color: string;
  /** 등급 아이콘 문자 */
  icon: string;
}

/** 신뢰도 점수로 등급 정보를 반환하는 헬퍼 */
export function getGrade(confidence: number): GradeInfo {
  const clamped = Math.max(0, Math.min(100, confidence));

  if (clamped >= 95) {
    return { name: 'Diamond', color: '#60A5FA', icon: '\u25C6' };
  }
  if (clamped >= 85) {
    return { name: 'Gold', color: '#F59E0B', icon: '\u2605' };
  }
  if (clamped >= 70) {
    return { name: 'Silver', color: '#9CA3AF', icon: '\u25CF' };
  }
  return { name: 'Bronze', color: '#CD7F32', icon: '\u25B2' };
}

// ============================================
// 프로그레스 바 마일스톤
// ============================================

const MILESTONES = [70, 85, 95] as const;

// ============================================
// Props 타입
// ============================================

export interface GradeDisplayProps {
  /** 신뢰도 점수 (0-100) */
  confidence: number;
  /** 프로그레스 바 표시 여부 */
  showProgress?: boolean;
  /** 등급 라벨 표시 여부 */
  showLabel?: boolean;
  /** 컨테이너 스타일 오버라이드 */
  style?: ViewStyle;
  /** 테스트 ID */
  testID?: string;
}

// ============================================
// 메인 컴포넌트
// ============================================

export function GradeDisplay({
  confidence,
  showProgress = true,
  showLabel = true,
  style,
  testID = 'grade-display',
}: GradeDisplayProps): React.JSX.Element {
  const { colors, spacing, radii, typography, isDark } = useTheme();
  const reduceMotion = useReducedMotion();

  const clamped = Math.max(0, Math.min(100, confidence));
  const grade = getGrade(clamped);

  // 프로그레스 바 애니메이션
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      // 접근성: 모션 줄이기 설정 시 즉시 적용
      progress.value = clamped;
    } else {
      progress.value = withTiming(clamped, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [clamped, reduceMotion, progress]);

  // 프로그레스 바 채움 애니메이션 스타일
  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  // 트랙 배경색
  const trackBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  return (
    <View
      testID={testID}
      style={[styles.container, { padding: spacing.md }, style]}
      accessibilityRole="summary"
      accessibilityLabel={`분석 등급 ${grade.name}, 신뢰도 ${clamped}%`}
    >
      {/* 상단: 아이콘 + 등급명 + 퍼센티지 */}
      {showLabel && (
        <View style={styles.header}>
          <View style={styles.gradeInfo}>
            <Text
              style={[
                styles.gradeIcon,
                {
                  color: grade.color,
                  fontSize: typography.size.lg,
                },
              ]}
            >
              {grade.icon}
            </Text>
            <Text
              style={[
                styles.gradeName,
                {
                  color: grade.color,
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.bold,
                },
              ]}
            >
              {grade.name}
            </Text>
          </View>
          <Text
            style={[
              styles.percentage,
              {
                color: colors.foreground,
                fontSize: typography.size.lg,
                fontWeight: typography.weight.bold,
              },
            ]}
          >
            {clamped}%
          </Text>
        </View>
      )}

      {/* 하단: 프로그레스 바 + 마일스톤 */}
      {showProgress && (
        <View style={[styles.progressSection, showLabel && { marginTop: spacing.sm }]}>
          {/* 트랙 */}
          <View
            style={[
              styles.track,
              {
                backgroundColor: trackBg,
                borderRadius: radii.full,
                height: 8,
              },
            ]}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: clamped }}
          >
            {/* 채움 바 */}
            <Animated.View
              style={[
                styles.fill,
                {
                  backgroundColor: grade.color,
                  borderRadius: radii.full,
                },
                fillStyle,
              ]}
            />

            {/* 마일스톤 마커 */}
            {MILESTONES.map((milestone) => (
              <View
                key={milestone}
                style={[
                  styles.milestone,
                  {
                    left: `${milestone}%`,
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.3)'
                      : 'rgba(0, 0, 0, 0.2)',
                  },
                ]}
              />
            ))}
          </View>

          {/* 마일스톤 라벨 */}
          <View style={styles.milestoneLabels}>
            {MILESTONES.map((milestone) => (
              <Text
                key={milestone}
                style={[
                  styles.milestoneLabel,
                  {
                    left: `${milestone}%`,
                    color: colors.mutedForeground,
                    fontSize: typography.size.xs,
                  },
                ]}
              >
                {milestone}
              </Text>
            ))}
          </View>
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
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gradeIcon: {
    lineHeight: 24,
  },
  gradeName: {
    lineHeight: 24,
  },
  percentage: {
    lineHeight: 24,
  },
  progressSection: {
    width: '100%',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  milestone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    borderRadius: 1,
  },
  milestoneLabels: {
    position: 'relative',
    height: 18,
    marginTop: 4,
  },
  milestoneLabel: {
    position: 'absolute',
    // 마커 중앙 정렬을 위해 transform은 RN에서 텍스트에 적용 어려우므로
    // marginLeft로 보정
    marginLeft: -8,
    fontVariant: ['tabular-nums'],
  },
});
