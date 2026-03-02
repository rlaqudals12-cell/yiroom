/**
 * 지표 막대 컴포넌트
 *
 * 피부 분석 등에서 개별 지표를 시각화하는 재사용 가능한 컴포넌트
 */
import { View, Text, StyleSheet } from 'react-native';

import { useTheme, typography } from '@/lib/theme';

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

export function MetricBar({ label, value, delta, testID }: MetricBarProps) {
  const { colors, status, typography } = useTheme();

  // 값에 따른 상태 색상 (70+: 좋음, 50-69: 보통, <50: 주의)
  const barColor = value >= 70 ? status.success : value >= 50 ? status.warning : status.error;

  return (
    <View
      style={styles.metricItem}
      accessibilityRole="adjustable"
      accessibilityLabel={`${label}: ${value}%${delta ? `, 변화: ${delta > 0 ? '+' : ''}${delta}` : ''}`}
      accessibilityValue={{ min: 0, max: 100, now: value }}
      testID={testID}
    >
      <View style={styles.metricHeader}>
        <Text style={[styles.metricLabel, { color: colors.foreground }]}>{label}</Text>
        <View style={styles.metricValueContainer}>
          <Text style={[styles.metricValue, { color: colors.mutedForeground }]}>{value}%</Text>
          {delta !== undefined && delta !== 0 && <MetricDelta delta={delta} size="sm" />}
        </View>
      </View>
      <View style={[styles.metricBarBg, { backgroundColor: colors.border }]}>
        <View style={[styles.metricBarFill, { width: `${value}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metricItem: {
    gap: 6,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: typography.size.sm,
  },
  metricValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
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
