/**
 * 스킨케어 루틴 화면 (모바일) — 웹 API 정본 소비 thin client (ADR-118)
 *
 * @description
 *   고민 파생·케어 단계·shelf-우선 배치·스킨 사이클링은 웹 /api/routine/daily가 조립한다(정본 1곳).
 *   이 화면은 결과를 렌더만 한다 — 로컬 루틴 생성 로직 없음. 웹 루틴 페이지 구성을 미러링:
 *   케어 단계 카드 · 목표 칩(읽기) · 아침/저녁 스텝(스펙명·이유·"어떻게 하나요?" how-to·"내 ○○" 보유 배지)
 *   · 저녁 포커스 · 주간 7칸 사이클.
 *
 *   분석 0건이면 지어내지 않고 CTA로 유도한다. 오프라인이면 마지막 루틴을 stale 배너와 함께 보여준다.
 *
 * @see apps/web/app/(main)/analysis/skin/routine/page.tsx
 * @see apps/mobile/lib/api/routine.ts
 */

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { getCategoryInfo, type ProductCategory } from '@/lib/skincare';
import { moduleColors, useTheme, typography, radii, spacing } from '@/lib/theme';

import { ProgressiveDisclosure } from '../../../components/common';
import { ScreenContainer, GlassCard, DataStateWrapper } from '../../../components/ui';
import { useDailyRoutine } from '../../../hooks/useDailyRoutine';
import { TIMING } from '../../../lib/animations';
import type { DailyRoutineData, RoutineStepData, WeeklyCycleDay } from '../../../lib/api/routine';

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export default function SkincareRoutineScreen() {
  const { data, stale, isLoading, error, refetch } = useDailyRoutine();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    refetch();
    // 훅이 isLoading을 토글하므로 즉시 리셋해도 스켈레톤이 노출된다
    setRefreshing(false);
  }, [refetch]);

  const handleGoToAnalysis = useCallback(() => {
    router.push('/(analysis)/skin');
  }, []);

  const hasRoutine = !!data && data.hasSkinAnalysis;

  return (
    <ScreenContainer
      testID="analysis-skin-routine-screen"
      backgroundGradient="analysis"
      edges={['bottom']}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <DataStateWrapper
        isLoading={isLoading}
        // stale 캐시가 있으면 data가 채워지므로 error는 데이터가 아예 없을 때만 노출
        error={error && !data ? error : null}
        onRetry={refetch}
        emptyConfig={{
          icon: <Text style={{ fontSize: 48 }}>🧴</Text>,
          title: '아직 맞춤 루틴이 없어요',
          description: '피부 분석을 하면 맞춤 루틴을 만들어드려요.',
          actionLabel: '피부 분석하러 가기',
          onAction: handleGoToAnalysis,
        }}
        isEmpty={!hasRoutine}
      >
        {hasRoutine ? <RoutineContent data={data} stale={stale} /> : null}
      </DataStateWrapper>
    </ScreenContainer>
  );
}

/**
 * 루틴 본문 — data.hasSkinAnalysis === true 보장.
 */
function RoutineContent({ data, stale }: { data: DailyRoutineData; stale: boolean }) {
  const { colors } = useTheme();
  const [activeTime, setActiveTime] = useState<'morning' | 'evening'>('morning');

  const morning = data.morning ?? [];
  const evening = data.evening ?? [];
  const currentSteps = activeTime === 'morning' ? morning : evening;
  const timeLabel = activeTime === 'morning' ? '아침' : '저녁';

  const handleTimeToggle = useCallback((time: 'morning' | 'evening') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTime(time);
  }, []);

  return (
    <View>
      {/* 오프라인 배너 — 마지막 루틴임을 정직하게 안내 */}
      {stale && (
        <View
          style={[styles.staleBanner, { backgroundColor: colors.muted }]}
          testID="routine-stale"
        >
          <Text style={[styles.staleText, { color: colors.mutedForeground }]}>
            오프라인 — 마지막 루틴이에요
          </Text>
        </View>
      )}

      {/* 헤더 */}
      <Animated.View entering={FadeInUp.delay(0).duration(TIMING.normal)} style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>오늘의 스킨케어 루틴</Text>
        {data.skinTypeLabel ? (
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {data.skinTypeLabel} 피부 맞춤 루틴
          </Text>
        ) : null}
      </Animated.View>

      {/* 개인화 노트 */}
      {data.personalizationNote ? (
        <GlassCard shadowSize="md" style={{ ...styles.noteCard }}>
          <Text style={styles.noteEmoji}>✨</Text>
          <Text style={[styles.noteText, { color: colors.foreground }]}>
            {data.personalizationNote}
          </Text>
        </GlassCard>
      ) : null}

      {/* 목표 칩 (읽기) */}
      {data.goals && data.goals.length > 0 && (
        <View style={styles.chipRow} testID="routine-goal-chips">
          {data.goals.map((g) => (
            <View
              key={g.id}
              style={[styles.chip, { backgroundColor: colors.muted, borderRadius: radii.full }]}
            >
              <Text style={[styles.chipText, { color: colors.foreground }]}>{g.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 케어 단계 카드 */}
      {data.carePhase && data.carePhase.message ? (
        <GlassCard shadowSize="md" style={{ ...styles.phaseCard }} testID="routine-care-phase">
          <View style={styles.phaseHeader}>
            <View
              style={[
                styles.phaseDot,
                {
                  backgroundColor:
                    data.carePhase.phase === 'barrier' ? '#F59E0B' : moduleColors.skin.base,
                },
              ]}
            />
            <Text style={[styles.phaseLabel, { color: colors.foreground }]}>
              {data.carePhase.label}
            </Text>
          </View>
          <Text style={[styles.phaseMessage, { color: colors.mutedForeground }]}>
            {data.carePhase.message}
          </Text>
        </GlassCard>
      ) : null}

      {/* 아침/저녁 토글 */}
      <View style={[styles.toggleContainer, { backgroundColor: colors.muted }]}>
        <Pressable
          style={[
            styles.toggleButton,
            activeTime === 'morning' && { backgroundColor: colors.card },
          ]}
          onPress={() => handleTimeToggle('morning')}
          testID="routine-toggle-morning"
        >
          <Text style={styles.toggleEmoji}>🌅</Text>
          <Text
            style={[
              styles.toggleText,
              { color: colors.mutedForeground },
              activeTime === 'morning' && { color: colors.foreground },
            ]}
          >
            아침 ({morning.length}단계)
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.toggleButton,
            activeTime === 'evening' && { backgroundColor: colors.card },
          ]}
          onPress={() => handleTimeToggle('evening')}
          testID="routine-toggle-evening"
        >
          <Text style={styles.toggleEmoji}>🌙</Text>
          <Text
            style={[
              styles.toggleText,
              { color: colors.mutedForeground },
              activeTime === 'evening' && { color: colors.foreground },
            ]}
          >
            저녁 ({evening.length}단계)
          </Text>
        </Pressable>
      </View>

      {/* 오늘 저녁 포커스 + 주간 사이클 (저녁 탭에서만) */}
      {activeTime === 'evening' && data.eveningFocus && data.eveningFocus.label ? (
        <GlassCard shadowSize="md" style={{ ...styles.focusCard }} testID="routine-evening-focus">
          <Text style={[styles.focusLabel, { color: colors.foreground }]}>
            오늘 저녁: {data.eveningFocus.label}
          </Text>
          {data.eveningFocus.reason ? (
            <Text style={[styles.focusReason, { color: colors.mutedForeground }]}>
              {data.eveningFocus.reason}
            </Text>
          ) : null}
          {data.weeklyCycle && data.weeklyCycle.length > 0 && (
            <View style={styles.weekRow} testID="routine-weekly-cycle">
              {data.weeklyCycle.map((day) => (
                <WeeklyCell key={day.dow} day={day} />
              ))}
            </View>
          )}
        </GlassCard>
      ) : null}

      {/* 루틴 정보 */}
      <View style={styles.routineInfo}>
        <Text style={[styles.routineInfoText, { color: colors.foreground }]}>
          {timeLabel} 루틴 • {currentSteps.length}단계
        </Text>
      </View>

      {/* 단계 목록 */}
      <View style={styles.stepsList}>
        {currentSteps.map((step, index) => (
          <RoutineStepCard key={`${step.category}-${index}`} step={step} />
        ))}
      </View>

      {/* 하단 안내 */}
      <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
        내 피부 분석과 화장대를 반영한 맞춤 루틴이에요
      </Text>
    </View>
  );
}

/** 주간 사이클 한 칸 */
function WeeklyCell({ day }: { day: WeeklyCycleDay }) {
  const { colors, brand } = useTheme();
  const isRecovery = day.focus === 'recovery';
  return (
    <View style={styles.weekCell} testID="routine-week-cell">
      <Text style={[styles.weekDow, { color: colors.mutedForeground }]}>
        {DOW_LABELS[day.dow] ?? ''}
      </Text>
      <View
        style={[styles.weekDot, { backgroundColor: isRecovery ? colors.border : brand.primary }]}
      />
      <Text numberOfLines={2} style={[styles.weekFocus, { color: colors.foreground }]}>
        {day.label}
      </Text>
    </View>
  );
}

/**
 * 루틴 단계 카드 — 스펙명·이유·보유 배지 + "어떻게 하나요?" how-to(ProgressiveDisclosure).
 */
function RoutineStepCard({ step }: { step: RoutineStepData }) {
  const { colors, brand } = useTheme();
  const categoryInfo = getCategoryInfo(step.category as ProductCategory);
  const title = step.specName || step.name;

  const summary = (
    <View style={styles.stepHeader}>
      <View style={styles.stepOrderContainer}>
        <Text style={[styles.stepOrder, { color: colors.card }]}>{step.order}</Text>
      </View>
      <View style={styles.stepInfo}>
        <View style={styles.stepTitleRow}>
          <Text style={styles.stepEmoji}>{categoryInfo?.emoji ?? '🧴'}</Text>
          <Text style={[styles.stepName, { color: colors.foreground }]}>{title}</Text>
          {step.isOptional && (
            <View style={[styles.optionalBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.optionalText, { color: colors.mutedForeground }]}>선택</Text>
            </View>
          )}
        </View>
        {step.specReason ? (
          <Text style={[styles.stepReason, { color: colors.mutedForeground }]}>
            {step.specReason}
          </Text>
        ) : (
          <Text style={[styles.stepReason, { color: colors.mutedForeground }]}>{step.purpose}</Text>
        )}
        {step.ownedProduct ? (
          <View
            style={[styles.ownedBadge, { backgroundColor: brand.primary }]}
            testID="routine-owned-badge"
          >
            <Text style={styles.ownedText}>내 {step.ownedProduct.name}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  // how-to가 있으면 "어떻게 하나요?"로 펼치기, 없으면 요약만
  const howto = step.howto;
  const detail = howto ? (
    <View style={[styles.howtoBox, { borderTopColor: colors.border }]}>
      <Text style={[styles.howtoRow, { color: colors.foreground }]}>
        <Text style={styles.howtoKey}>적당량 </Text>
        {howto.amount}
      </Text>
      <Text style={[styles.howtoRow, { color: colors.foreground }]}>
        <Text style={styles.howtoKey}>방법 </Text>
        {howto.method}
      </Text>
      {howto.waitTime ? (
        <Text style={[styles.howtoRow, { color: colors.mutedForeground }]}>{howto.waitTime}</Text>
      ) : null}
      {howto.tips?.map((tip, i) => (
        <Text key={i} style={[styles.howtoTip, { color: colors.mutedForeground }]}>
          • {tip}
        </Text>
      ))}
    </View>
  ) : null;

  return (
    <GlassCard shadowSize="md" style={{ ...styles.stepCard }}>
      {howto ? (
        <ProgressiveDisclosure
          summary={summary}
          detail={detail}
          expandLabel="어떻게 하나요?"
          collapseLabel="접기"
        />
      ) : (
        summary
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  staleBanner: {
    paddingHorizontal: spacing.smx,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    marginBottom: spacing.smx,
    alignItems: 'center',
  },
  staleText: {
    fontSize: typography.size.xs,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
  },
  noteCard: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.smx,
    alignItems: 'flex-start',
  },
  noteEmoji: {
    fontSize: typography.size.xl,
  },
  noteText: {
    flex: 1,
    fontSize: typography.size.sm,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.smx,
    paddingVertical: spacing.xs,
  },
  chipText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  phaseCard: {
    marginBottom: spacing.md,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  phaseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  phaseLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  phaseMessage: {
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: radii.xl,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.smx,
    borderRadius: radii.xl,
    gap: 6,
  },
  toggleEmoji: {
    fontSize: typography.size.base,
  },
  toggleText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  focusCard: {
    marginBottom: spacing.md,
  },
  focusLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  focusReason: {
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginBottom: spacing.smx,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weekDow: {
    fontSize: 11,
    fontWeight: typography.weight.medium,
  },
  weekDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weekFocus: {
    fontSize: 9,
    textAlign: 'center',
  },
  routineInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  routineInfoText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  stepsList: {
    gap: spacing.smx,
    marginBottom: spacing.lg,
  },
  stepCard: {
    marginBottom: 0,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepOrderContainer: {
    width: 28,
    height: 28,
    borderRadius: radii.xlg,
    backgroundColor: moduleColors.skin.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.smx,
  },
  stepOrder: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  stepEmoji: {
    fontSize: typography.size.lg,
  },
  stepName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    flexShrink: 1,
  },
  optionalBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: 4,
  },
  optionalText: {
    fontSize: 11,
    fontWeight: typography.weight.medium,
  },
  stepReason: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.xs,
  },
  ownedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: 6,
    marginTop: spacing.xxs,
  },
  ownedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: typography.weight.semibold,
  },
  howtoBox: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.xs,
  },
  howtoRow: {
    fontSize: 13,
    lineHeight: 19,
  },
  howtoKey: {
    fontWeight: typography.weight.semibold,
  },
  howtoTip: {
    fontSize: 12,
    lineHeight: 18,
  },
  footerNote: {
    fontSize: typography.size.xs,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
