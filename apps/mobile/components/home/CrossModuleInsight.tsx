/**
 * CrossModuleInsight — 교차 모듈 인사이트 카드
 *
 * 분석/영양/운동 데이터 교차 분석 결과를 카드 리스트로 표시.
 * useCrossModuleInsights 훅 결과를 시각화.
 */
import { Lightbulb } from 'lucide-react-native';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme, typography } from '../../lib/theme';
import { TIMING } from '../../lib/animations';
import type { CrossModuleInsight as InsightType } from '../../hooks/useCrossModuleInsights';

interface CrossModuleInsightProps {
  insights: InsightType[];
  /** 최대 표시 개수 (기본 3) */
  maxItems?: number;
  style?: ViewStyle;
  testID?: string;
}

export function CrossModuleInsight({
  insights,
  maxItems = 3,
  style,
  testID,
}: CrossModuleInsightProps): React.JSX.Element | null {
  const { colors, spacing, radii, typography, brand, shadows } = useTheme();

  const visibleInsights = insights.slice(0, maxItems);

  if (visibleInsights.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.normal)}
      testID={testID}
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
        <View style={[styles.iconBadge, { backgroundColor: brand.primary + '20' }]}>
          <Lightbulb size={18} color={brand.primary} />
        </View>
        <Text
          style={{
            flex: 1,
            marginLeft: spacing.sm,
            fontSize: typography.size.base,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
          }}
        >
          맞춤 인사이트
        </Text>
      </View>

      {/* 인사이트 목록 */}
      <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
        {visibleInsights.map((insight, idx) => (
          <Animated.View
            key={insight.id}
            entering={FadeInUp.delay(idx * 80).duration(TIMING.normal)}
            style={[
              styles.insightItem,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.lg,
                padding: spacing.sm + 2,
              },
            ]}
          >
            <Text style={styles.emoji}>{insight.emoji}</Text>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                }}
              >
                {insight.title}
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  marginTop: spacing.xxs,
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                }}
              >
                {insight.description}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>
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
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: typography.size['2xl'],
  },
});
