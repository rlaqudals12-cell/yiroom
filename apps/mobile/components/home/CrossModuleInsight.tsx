/**
 * CrossModuleInsight — 교차 모듈 인사이트 카드 + ConnectionAwareness 내재화 추적
 *
 * 분석/영양/운동 데이터 교차 분석 결과를 카드 리스트로 표시.
 * CA 통합: 인사이트 노출 시 expose, "이해했어요" 시 confirm
 * 내재화 상태에 따라 설명 깊이 분기 (full → brief → minimal → none)
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Lightbulb } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useConnectionExposure } from '../../hooks/useConnectionExposure';
import type { CrossModuleInsight as InsightType } from '../../hooks/useCrossModuleInsights';
import { TIMING } from '../../lib/animations';
import type { ConnectionModule, ExposeRequest } from '../../lib/connection-awareness';
import { useTheme, typography } from '../../lib/theme';

// 모바일 인사이트 모듈 → ConnectionAwareness 모듈 매핑
const MODULE_TO_CONNECTION: Record<string, ConnectionModule> = {
  skin: 'skin',
  body: 'body',
  personalColor: 'personal-color',
  workout: 'workout',
  nutrition: 'nutrition',
};

// 인사이트 → ExposeRequest 변환
function insightToExposeRequest(insight: InsightType): ExposeRequest {
  const sourceModule = insight.modules[0] ?? 'skin';
  const targetDomain =
    insight.modules.length > 1
      ? (MODULE_TO_CONNECTION[insight.modules[1]] ?? 'skin')
      : (MODULE_TO_CONNECTION[sourceModule] ?? 'skin');

  return {
    connectionId: `cross_insight::${insight.id}`,
    sourceModule: MODULE_TO_CONNECTION[sourceModule] ?? (sourceModule as ConnectionModule),
    targetDomain,
    connectionRule: insight.title,
  };
}

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
      {/* 헤더 — 그라디언트 아이콘 배지 */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconBadge,
            !isDark
              ? (Platform.select({
                  ios: {
                    shadowColor: brand.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                  },
                  android: { elevation: 3 },
                }) ?? {})
              : {},
          ]}
        >
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

      {/* 인사이트 목록 (CA 통합) */}
      <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
        {visibleInsights.map((insight, idx) => (
          <InsightItemWithCA key={insight.id} insight={insight} index={idx} />
        ))}
      </View>
    </Animated.View>
  );
}

/**
 * 개별 인사이트 카드 — CA expose/confirm 통합
 */
function InsightItemWithCA({
  insight,
  index,
}: {
  insight: InsightType;
  index: number;
}): React.JSX.Element {
  const { colors, spacing, radii, typography, isDark } = useTheme();

  const exposeRequest = insightToExposeRequest(insight);
  const { depth, isConfirmed, confirm } = useConnectionExposure(exposeRequest);

  // 내재화 상태에 따른 설명 깊이 분기
  const showDescription = depth === 'full' || depth === 'brief';
  const showTitle = depth !== 'none';
  // independent(none) 단계에서는 카드 자체를 숨김
  if (depth === 'none') return <View />;

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).duration(TIMING.normal)}
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
        {showTitle && (
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
            }}
          >
            {insight.title}
          </Text>
        )}
        {showDescription && (
          <Text
            numberOfLines={depth === 'brief' ? 1 : 2}
            style={{
              marginTop: spacing.xxs,
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
            }}
          >
            {insight.description}
          </Text>
        )}
      </View>

      {/* 확인 버튼 — 아직 확인 안 한 경우만 */}
      {!isConfirmed && depth !== 'minimal' ? (
        <Pressable
          onPress={confirm}
          hitSlop={8}
          style={[
            styles.confirmButton,
            {
              backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
              borderRadius: radii.md,
            },
          ]}
          testID={`confirm-insight-${insight.id}`}
        >
          <Check size={14} color={isDark ? '#94a3b8' : '#64748b'} />
        </Pressable>
      ) : isConfirmed ? (
        <View
          style={[
            styles.confirmButton,
            {
              backgroundColor: isDark ? '#064e3b' : '#d1fae5',
              borderRadius: radii.md,
            },
          ]}
        >
          <Check size={14} color={isDark ? '#34d399' : '#059669'} />
        </View>
      ) : null}
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
  confirmButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
