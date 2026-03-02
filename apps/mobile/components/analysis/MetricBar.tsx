/**
 * 지표 막대 컴포넌트
 *
 * 피부 분석 등에서 개별 지표를 시각화하는 재사용 가능한 컴포넌트.
 * 웹 GradeDisplay 등급 색상 시스템 동기화:
 *  85+: Diamond(cyan), 70-84: Gold(amber), 50-69: Silver(gray), <50: Bronze(orange)
 */
import { View, Text, StyleSheet } from 'react-native';

import { useTheme, typography } from '@/lib/theme';
import { gradeColors } from '@/lib/theme/tokens';

import { MetricDelta } from './ScoreChangeBadge';

export interface MetricBarProps {
  /** 지표 이름 */
  label: string;
  /** 지표 값 (0-100) */
  value: number;
  /** 이전 대비 변화량 */
  delta?: number;
  /** 다크 모드 여부 (deprecated — useTheme 내부 사용) */
  isDark?: boolean;
  /** 테스트 ID */
  testID?: string;
}

// 웹 4-tier 등급 색상 시스템 (Diamond/Gold/Silver/Bronze)
function getMetricGrade(value: number): {
  color: string;
  label: string;
  bgColor: string;
} {
  if (value >= 85) {
    return { color: gradeColors.diamond.base, label: 'A+', bgColor: `${gradeColors.diamond.light}40` };
  }
  if (value >= 70) {
    return { color: gradeColors.gold.base, label: 'A', bgColor: `${gradeColors.gold.light}40` };
  }
  if (value >= 50) {
    return { color: gradeColors.silver.base, label: 'B', bgColor: `${gradeColors.silver.light}40` };
  }
  return { color: gradeColors.bronze.base, label: 'C', bgColor: `${gradeColors.bronze.light}40` };
}

export function MetricBar({ label, value, delta, testID }: MetricBarProps) {
  const { colors, isDark, typography } = useTheme();

  const grade = getMetricGrade(value);
  // 트랙 배경: 웹 bg-muted 대응
  const trackBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <View
      style={styles.metricItem}
      accessibilityRole="adjustable"
      accessibilityLabel={`${label}: ${value}%${delta ? `, 변화: ${delta > 0 ? '+' : ''}${delta}` : ''}`}
      accessibilityValue={{ min: 0, max: 100, now: value }}
      testID={testID}
    >
      <View style={styles.metricHeader}>
        <View style={styles.metricLabelRow}>
          <Text style={[styles.metricLabel, { color: colors.foreground, fontWeight: typography.weight.medium }]}>
            {label}
          </Text>
          {/* 웹 인라인 등급 배지 (text-xs px-1.5 py-0.5 rounded) */}
          <View style={[styles.gradeBadge, { backgroundColor: grade.bgColor }]}>
            <Text style={[styles.gradeBadgeText, { color: grade.color }]}>
              {grade.label}
            </Text>
          </View>
        </View>
        <View style={styles.metricValueContainer}>
          <Text style={[styles.metricValue, { color: grade.color, fontWeight: typography.weight.semibold }]}>
            {value}
          </Text>
          {delta !== undefined && delta !== 0 && <MetricDelta delta={delta} size="sm" />}
        </View>
      </View>
      <View style={[styles.metricBarBg, { backgroundColor: trackBg }]}>
        <View style={[styles.metricBarFill, { width: `${value}%`, backgroundColor: grade.color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metricItem: {
    gap: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: typography.size.sm,
  },
  metricValue: {
    fontSize: typography.size.sm,
  },
  // 웹 인라인 등급 배지: text-xs font-medium px-1.5 py-0.5 rounded
  gradeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gradeBadgeText: {
    fontSize: 10,
    fontWeight: typography.weight.semibold,
  },
  metricBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
