/**
 * ActiveInsightCard — 홈 화면 활성 인사이트 카드
 *
 * CrossModuleInsight와 유사하나 홈 화면 특화:
 *   - 최대 2개 인사이트 표시 (CrossModuleInsight는 3개)
 *   - relatedModules를 소스 배지로 표시 ("퍼스널컬러 + 피부분석")
 *   - CA 추적: 노출 시 expose, 탭 시 confirm
 *   - ExplanationDepth 분기
 *
 * @see CrossModuleInsight.tsx — 패턴 원본
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useConnectionExposure } from '../../hooks/useConnectionExposure';
import type { CrossModuleInsight as InsightType } from '../../hooks/useCrossModuleInsights';
import { TIMING } from '../../lib/animations';
import type { ConnectionModule } from '../../lib/connection-awareness';
import { getModuleLabel } from '../../lib/connection-awareness';
import { useTheme } from '../../lib/theme';

// CrossModuleInsight의 모듈명 → ConnectionModule 매핑 (동일 패턴)
const MODULE_TO_CONNECTION: Record<string, ConnectionModule> = {
  skin: 'skin',
  body: 'body',
  personalColor: 'personal-color',
  workout: 'workout',
  nutrition: 'nutrition',
};

// 인사이트 모듈 목록에서 소스 배지 텍스트 생성
function buildSourceBadgeText(modules: string[]): string {
  if (modules.length === 0) return '';
  const labels = modules
    .slice(0, 2)
    .map((m) => {
      const cm = MODULE_TO_CONNECTION[m];
      return cm ? getModuleLabel(cm) : m;
    })
    .filter(Boolean);
  return labels.join(' + ');
}

export interface ActiveInsightCardProps {
  insights: InsightType[];
  style?: ViewStyle;
  testID?: string;
}

export function ActiveInsightCard({
  insights,
  style,
  testID,
}: ActiveInsightCardProps): React.JSX.Element | null {
  const { colors, spacing, radii, typography, brand, shadows, isDark } = useTheme();

  // 홈 화면에서는 최대 2개만 표시
  const visibleInsights = insights.slice(0, 2);

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
            <Sparkles size={18} color={colors.overlayForeground} />
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
          활성 인사이트
        </Text>
      </View>

      {/* 인사이트 목록 (CA 통합, 최대 2개) */}
      <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
        {visibleInsights.map((insight, idx) => (
          <ActiveInsightItemWithCA key={insight.id} insight={insight} index={idx} />
        ))}
      </View>
    </Animated.View>
  );
}

/**
 * 개별 활성 인사이트 아이템 — CA expose/confirm + 소스 배지
 */
function ActiveInsightItemWithCA({
  insight,
  index,
}: {
  insight: InsightType;
  index: number;
}): React.JSX.Element {
  const { colors, spacing, radii, typography, brand, isDark } = useTheme();

  // 인사이트 → ExposeRequest 생성
  const sourceModule = MODULE_TO_CONNECTION[insight.modules[0] ?? ''] ?? 'skin';
  const targetDomain =
    insight.modules.length > 1
      ? (MODULE_TO_CONNECTION[insight.modules[1]] ?? sourceModule)
      : sourceModule;

  const exposeRequest = {
    connectionId: `active_insight::${insight.id}`,
    sourceModule,
    targetDomain,
    connectionRule: insight.title,
  };

  const { depth, isConfirmed, confirm } = useConnectionExposure(exposeRequest);

  // depth=none이면 카드 자체를 숨김 (독립적 판단 단계)
  if (depth === 'none') return <View />;

  const showDescription = depth === 'full' || depth === 'brief';
  const sourceBadgeText = buildSourceBadgeText(insight.modules);

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
        {/* 제목 — minimal/full/brief 모두 표시 */}
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
          }}
        >
          {insight.title}
        </Text>

        {/* 설명 — full/brief만 표시 */}
        {showDescription ? (
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
        ) : null}

        {/* 소스 배지 — 연관 모듈이 있을 때만 */}
        {sourceBadgeText.length > 0 ? (
          <View
            style={[
              styles.sourceBadge,
              {
                backgroundColor: isDark ? `${brand.primary}22` : `${brand.primary}15`,
                borderRadius: radii.full,
                marginTop: spacing.xxs,
              },
            ]}
            testID={`source-badge-${insight.id}`}
          >
            <Text
              style={{
                fontSize: typography.size.xs,
                color: brand.primary,
                fontWeight: typography.weight.medium,
              }}
            >
              {sourceBadgeText}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 확인 버튼 — 미확인 && full/brief depth */}
      {!isConfirmed && (depth === 'full' || depth === 'brief') ? (
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
          testID={`confirm-active-insight-${insight.id}`}
        >
          <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>✓</Text>
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
          <Text style={{ fontSize: 12, color: isDark ? '#34d399' : '#059669' }}>✓</Text>
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
    fontSize: 22,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  confirmButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
