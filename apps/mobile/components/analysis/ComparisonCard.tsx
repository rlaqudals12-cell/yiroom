/**
 * ComparisonCard — 이전↔현재 분석 비교 카드
 *
 * 동일 모듈의 이전/현재 분석 결과를 나란히 비교.
 * 각 지표별 변화량을 ScoreChangeBadge / MetricDelta로 시각화.
 */
import { ArrowRight } from 'lucide-react-native';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme, radii , spacing } from '../../lib/theme';
import { TIMING } from '../../lib/animations';
import { MetricDelta } from './ScoreChangeBadge';

interface MetricComparison {
  label: string;
  previous: number;
  current: number;
  /** 높을수록 좋은 지표인지 (기본 true) */
  higherIsBetter?: boolean;
}

interface ComparisonCardProps {
  title: string;
  metrics: MetricComparison[];
  /** 전체 점수 (이전) */
  previousTotal?: number;
  /** 전체 점수 (현재) */
  currentTotal?: number;
  /** 첫 분석 여부 — true면 격려 메시지 표시 */
  isFirstAnalysis?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export type { MetricComparison, ComparisonCardProps };

export function ComparisonCard({
  title,
  metrics,
  previousTotal,
  currentTotal,
  isFirstAnalysis = false,
  style,
  testID,
}: ComparisonCardProps): React.JSX.Element {
  const { colors, spacing, radii, typography, status, shadows } = useTheme();

  const totalDelta =
    previousTotal !== undefined && currentTotal !== undefined
      ? currentTotal - previousTotal
      : null;

  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.normal)}
      testID={testID}
      accessibilityLabel={`${title}: ${metrics.length}개 지표 비교${totalDelta !== null ? `, 총점 ${totalDelta > 0 ? '+' : ''}${totalDelta}점` : ''}`}
      style={[
        styles.container,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          borderColor: colors.border,
          padding: spacing.md,
        },
        style,
      ]}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text
          style={{
            flex: 1,
            fontSize: typography.size.base,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
          }}
        >
          {title}
        </Text>
        {totalDelta !== null && (
          <View
            style={[
              styles.totalBadge,
              {
                backgroundColor:
                  totalDelta > 0
                    ? status.success + '20'
                    : totalDelta < 0
                      ? status.error + '20'
                      : colors.secondary,
              },
            ]}
          >
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
                color:
                  totalDelta > 0
                    ? status.success
                    : totalDelta < 0
                      ? status.error
                      : colors.mutedForeground,
              }}
            >
              {totalDelta > 0 ? '+' : ''}
              {totalDelta}점
            </Text>
          </View>
        )}
      </View>

      {/* 컬럼 헤더 */}
      <View style={[styles.columnHeader, { marginTop: spacing.sm }]}>
        <Text
          style={[
            styles.columnLabel,
            { color: colors.mutedForeground, fontSize: typography.size.xs },
          ]}
        >
          지표
        </Text>
        <Text
          style={[
            styles.columnValue,
            { color: colors.mutedForeground, fontSize: typography.size.xs },
          ]}
        >
          이전
        </Text>
        <View style={{ width: 20 }} />
        <Text
          style={[
            styles.columnValue,
            { color: colors.mutedForeground, fontSize: typography.size.xs },
          ]}
        >
          현재
        </Text>
        <Text
          style={[
            styles.columnDelta,
            { color: colors.mutedForeground, fontSize: typography.size.xs },
          ]}
        >
          변화
        </Text>
      </View>

      {/* 지표 행 */}
      {metrics.map((metric, idx) => {
        const delta = metric.current - metric.previous;
        const isLast = idx === metrics.length - 1;

        return (
          <Animated.View
            entering={FadeInUp.delay(idx * 60).duration(TIMING.normal)}
            key={metric.label}
            style={[
              styles.metricRow,
              {
                paddingVertical: spacing.xs,
                borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.columnLabel,
                {
                  fontSize: typography.size.sm,
                  color: colors.foreground,
                },
              ]}
            >
              {metric.label}
            </Text>
            <Text
              style={[
                styles.columnValue,
                {
                  fontSize: typography.size.sm,
                  color: colors.mutedForeground,
                },
              ]}
            >
              {metric.previous}
            </Text>
            <ArrowRight size={12} color={colors.mutedForeground} />
            <Text
              style={[
                styles.columnValue,
                {
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                },
              ]}
            >
              {metric.current}
            </Text>
            <View style={styles.columnDelta}>
              <MetricDelta delta={delta} size="sm" />
            </View>
          </Animated.View>
        );
      })}

      {/* 빈 상태 */}
      {metrics.length === 0 && (
        <View style={[styles.emptyState, { marginTop: spacing.sm }]}>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              textAlign: 'center',
            }}
          >
            {isFirstAnalysis
              ? '첫 분석이에요! 다음 분석부터 변화를 추적할 수 있어요'
              : '비교할 이전 데이터가 없어요'}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  columnLabel: {
    flex: 1,
  },
  columnValue: {
    width: 36,
    textAlign: 'center',
  },
  columnDelta: {
    width: 40,
    alignItems: 'flex-end',
  },
  emptyState: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});
