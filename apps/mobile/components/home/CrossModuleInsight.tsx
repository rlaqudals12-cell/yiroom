/**
 * CrossModuleInsight — 교차 모듈 인사이트 카드
 *
 * 분석/영양/운동 데이터 교차 분석 결과를 카드 리스트로 표시.
 * useCrossModuleInsights 훅 결과를 시각화.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Lightbulb } from 'lucide-react-native';
import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';
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
  const { colors, spacing, radii, typography, brand, shadows, isDark } = useTheme();

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
      {/* 헤더 — 그라디언트 아이콘 배지 (웹 gradient icon square 패턴) */}
      <View style={styles.header}>
        <View style={[
          styles.iconBadge,
          !isDark ? Platform.select({
            ios: { shadowColor: brand.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
            android: { elevation: 3 },
          }) ?? {} : {},
        ]}>
          <LinearGradient
            colors={[brand.primary, brand.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBadgeGradient}
          >
            <Lightbulb size={18} color={colors.overlayForeground} />
          </LinearGradient>
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
                borderRadius: radii.xl,
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
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconBadgeGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: typography.size['2xl'],
  },
});
