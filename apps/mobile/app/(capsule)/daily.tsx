/**
 * Daily Capsule 상세 화면
 *
 * Progressive Disclosure Level 2 기본 펼침 + CCS 상세.
 * @see docs/adr/ADR-073-one-button-daily.md
 */
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { DailyCapsuleCard } from '../../components/capsule/DailyCapsuleCard';
import { CapsuleProgressBar } from '../../components/capsule/CapsuleProgressBar';
import { ScreenContainer, GlassCard, SectionHeader, ErrorState } from '../../components/ui';
import { staggeredEntry } from '../../lib/animations';
import { useDailyCapsule } from '../../lib/capsule/hooks';
import { useTheme } from '../../lib/theme';

export default function DailyCapsuleScreen(): React.JSX.Element {
  const { colors, brand, spacing, radii, typography, isDark } = useTheme();
  const {
    capsule,
    isLoading,
    isGenerating,
    error,
    fetchToday,
    generate,
    checkItem,
    completionRate,
  } = useDailyCapsule();

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  return (
    <ScreenContainer
      backgroundGradient="beauty"
      refreshing={isLoading}
      onRefresh={fetchToday}
      testID="daily-capsule-screen"
    >
      {/* 메인 캡슐 카드 */}
      <Animated.View entering={staggeredEntry(0)} style={{ marginTop: spacing.md }}>
        <DailyCapsuleCard
          capsule={capsule}
          completionRate={completionRate}
          isGenerating={isGenerating}
          onGenerate={generate}
          onCheckItem={checkItem}
          testID="daily-capsule-card"
        />
      </Animated.View>

      {error ? (
        <Animated.View entering={staggeredEntry(1)} style={{ marginTop: spacing.sm }}>
          <ErrorState message={error.message} onRetry={fetchToday} />
        </Animated.View>
      ) : null}

      {/* CCS 상세 정보 */}
      {capsule ? (
        <Animated.View entering={staggeredEntry(1)} style={{ marginTop: spacing.lg }}>
          <SectionHeader
            title="캡슐 호환도"
            subtitle="오늘 추천 아이템들의 전체 조화도"
            style={{ marginBottom: spacing.sm }}
          />
          <GlassCard shadowSize="md" style={{ padding: spacing.md }}>
            {/* 전체 CCS */}
            <View style={styles.ccsRow}>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.medium,
                }}
              >
                전체 CCS
              </Text>
              <Text
                style={{
                  color: capsule.totalCcs >= 70 ? '#22C55E' : '#F59E0B',
                  fontSize: typography.size.xl,
                  fontWeight: typography.weight.bold,
                }}
              >
                {capsule.totalCcs}
              </Text>
            </View>

            {/* 진행 상황 */}
            <View style={{ marginTop: spacing.md }}>
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: typography.size.xs,
                  marginBottom: spacing.xs,
                }}
              >
                완료 진행률
              </Text>
              <CapsuleProgressBar
                current={capsule.items.filter((i) => i.isChecked).length}
                optimal={capsule.items.length}
                accentColor={brand.primary}
              />
            </View>

            {/* 상태 */}
            <View style={[styles.statusRow, { marginTop: spacing.md }]}>
              <View style={styles.statusItem}>
                <Text style={[styles.statusValue, { color: colors.foreground, fontWeight: typography.weight.bold }]}>
                  {capsule.items.length}
                </Text>
                <Text style={[styles.statusLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
                  총 아이템
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.statusItem}>
                <Text style={[styles.statusValue, { color: '#22C55E', fontWeight: typography.weight.bold }]}>
                  {capsule.items.filter((i) => i.isChecked).length}
                </Text>
                <Text style={[styles.statusLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
                  완료
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.statusItem}>
                <Text style={[styles.statusValue, { color: '#F59E0B', fontWeight: typography.weight.bold }]}>
                  {capsule.items.filter((i) => !i.isChecked).length}
                </Text>
                <Text style={[styles.statusLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
                  남음
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      ) : null}

      {/* 캡슐 설명 */}
      <Animated.View entering={staggeredEntry(2)} style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}>
        <GlassCard shadowSize="md" style={{ padding: spacing.md }}>
          <Text
            style={{
              color: colors.foreground,
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              marginBottom: spacing.xs,
            }}
          >
            Daily Capsule이란?
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: typography.size.xs,
              lineHeight: typography.size.xs * 1.6,
            }}
          >
            뷰티 프로필 기반으로 AI가 매일 최적의 루틴을 구성해 드려요.
            스킨케어, 메이크업, 영양, 운동 등 모든 영역에서 나에게 딱 맞는
            아이템만 엄선해요. 캡슐 호환도(CCS)가 70 이상이면 좋은 조합이에요.
          </Text>
        </GlassCard>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  ccsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 20,
  },
  statusLabel: {
    marginTop: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
  },
});
