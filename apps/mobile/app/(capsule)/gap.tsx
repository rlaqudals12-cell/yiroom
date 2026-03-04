/**
 * 갭 분석 + 쇼핑 컴패니언 화면
 *
 * 캡슐에서 부족한 카테고리를 식별하고 추천/재활용 CTA 제공.
 * @see docs/adr/ADR-075-shopping-companion.md
 */
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { GapCard } from '../../components/capsule/GapCard';
import { ScreenContainer, GlassCard, SectionHeader } from '../../components/ui';
import { staggeredEntry } from '../../lib/animations';
import { useBeautyProfile } from '../../lib/capsule/hooks';
import { useTheme } from '../../lib/theme';

// 갭 아이템 (Phase 5d에서 API 연동 예정, 현재 placeholder)
interface GapItem {
  category: string;
  reason: string;
  canReuse: boolean;
}

export default function GapAnalysisScreen(): React.JSX.Element {
  const { colors, brand, spacing, radii, typography, isDark } = useTheme();
  const { profile } = useBeautyProfile();

  // 미완성 모듈 기반 갭 추론
  const allModules = ['skin', 'fashion', 'nutrition', 'workout', 'hair', 'makeup', 'personal-color', 'oral', 'body'];
  const completedModules = profile?.completedModules ?? [];
  const gaps: GapItem[] = allModules
    .filter((m) => !completedModules.includes(m))
    .map((m) => ({
      category: MODULE_LABELS[m] ?? m,
      reason: `${MODULE_LABELS[m] ?? m} 분석을 완료하면 더 정확한 추천을 받을 수 있어요`,
      canReuse: false,
    }));

  return (
    <ScreenContainer
      backgroundGradient="beauty"
      testID="gap-analysis-screen"
    >
      {/* 헤더 */}
      <Animated.View entering={staggeredEntry(0)} style={{ marginTop: spacing.md }}>
        <GlassCard shadowSize="lg" style={{ padding: spacing.lg }}>
          <Text
            style={{
              color: colors.foreground,
              fontSize: typography.size.lg,
              fontWeight: typography.weight.bold,
            }}
          >
            갭 분석
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: typography.size.sm,
              marginTop: spacing.xs,
              lineHeight: typography.size.sm * 1.5,
            }}
          >
            캡슐 호환도를 높이기 위해 필요한 항목을 확인하세요.
            분석을 완료하면 더 정확한 추천을 받을 수 있어요.
          </Text>
          <View style={[styles.summaryRow, { marginTop: spacing.md }]}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.foreground, fontWeight: typography.weight.bold }]}>
                {completedModules.length}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
                완료
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#F59E0B', fontWeight: typography.weight.bold }]}>
                {gaps.length}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
                미완성
              </Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* 갭 리스트 */}
      {gaps.length > 0 ? (
        <Animated.View entering={staggeredEntry(1)} style={{ marginTop: spacing.lg }}>
          <SectionHeader
            title="보완이 필요한 영역"
            subtitle={`${gaps.length}개 영역의 분석이 필요해요`}
            style={{ marginBottom: spacing.sm }}
          />
          <View style={styles.gapList}>
            {gaps.map((gap) => (
              <GapCard key={gap.category} gap={gap} testID={`gap-${gap.category}`} />
            ))}
          </View>
        </Animated.View>
      ) : (
        <Animated.View entering={staggeredEntry(1)} style={{ marginTop: spacing.lg }}>
          <GlassCard shadowSize="md" style={{ padding: spacing.lg, alignItems: 'center' }}>
            <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>🎉</Text>
            <Text
              style={{
                color: colors.foreground,
                fontSize: typography.size.base,
                fontWeight: typography.weight.bold,
                textAlign: 'center',
              }}
            >
              모든 분석을 완료했어요!
            </Text>
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: typography.size.sm,
                textAlign: 'center',
                marginTop: spacing.xs,
              }}
            >
              최적의 캡슐 조합을 누리세요
            </Text>
          </GlassCard>
        </Animated.View>
      )}
    </ScreenContainer>
  );
}

const MODULE_LABELS: Record<string, string> = {
  skin: '스킨케어',
  fashion: '패션',
  nutrition: '영양',
  workout: '운동',
  hair: '헤어',
  makeup: '메이크업',
  'personal-color': '퍼스널컬러',
  oral: '구강건강',
  body: '바디케어',
};

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
  },
  summaryLabel: {
    marginTop: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
  },
  gapList: {
    gap: 10,
  },
});
