/**
 * 지표 막대 컴포넌트
 *
 * 피부 분석 등에서 개별 지표를 시각화하는 재사용 가능한 컴포넌트
 */
import { View, Text, StyleSheet } from 'react-native';

import { MetricDelta } from './ScoreChangeBadge';

export interface MetricBarProps {
  /** 지표 이름 */
  label: string;
  /** 지표 값 (0-100) */
  value: number;
  /** 이전 대비 변화량 */
  delta?: number;
  /** 다크 모드 여부 */
  isDark?: boolean;
  /** 테스트 ID */
  testID?: string;
}

/**
 * 값에 따른 색상 반환
 * - 70 이상: 초록 (좋음)
 * - 50-69: 노랑 (보통)
 * - 50 미만: 빨강 (주의)
 */
function getColor(value: number): string {
  if (value >= 70) return '#22c55e';
  if (value >= 50) return '#eab308';
  return '#ef4444';
}

export function MetricBar({
  label,
  value,
  delta,
  isDark = false,
  testID,
}: MetricBarProps) {
  return (
    <View
      style={styles.metricItem}
      accessibilityLabel={`${label}: ${value}%${delta ? `, 변화: ${delta > 0 ? '+' : ''}${delta}` : ''}`}
      testID={testID}
    >
      <View style={styles.metricHeader}>
        <Text style={[styles.metricLabel, isDark && styles.textLight]}>
          {label}
        </Text>
        <View style={styles.metricValueContainer}>
          <Text style={[styles.metricValue, isDark && styles.textMuted]}>
            {value}%
          </Text>
          {delta !== undefined && delta !== 0 && (
            <MetricDelta delta={delta} size="sm" isDark={isDark} />
          )}
        </View>
      </View>
      <View style={[styles.metricBarBg, isDark && styles.metricBarBgDark]}>
        <View
          style={[
            styles.metricBarFill,
            { width: `${value}%`, backgroundColor: getColor(value) },
          ]}
        />
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
    fontSize: 14,
    color: '#333',
  },
  metricValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  metricBarBg: {
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  metricBarBgDark: {
    backgroundColor: '#333',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  textLight: {
    color: '#ffffff',
  },
  textMuted: {
    color: '#999',
  },
});
