/**
 * 스킨케어 루틴 화면 (모바일)
 * @description 웹과 동기화된 아침/저녁 스킨케어 루틴 표시
 * @version 1.0
 * @date 2026-01-11
 */

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { ScreenContainer, DataStateWrapper } from '../../../components/ui';
import { staggeredEntry } from '../../../lib/animations';
import {
  useSkincareRoutine,
  getCategoryInfo,
  type TimeOfDay,
  type RoutineStep,
} from '@/lib/skincare';
import { moduleColors, useTheme, typography, radii , spacing } from '@/lib/theme';

export default function SkincareRoutineScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const {
    loading,
    error,
    skinData,
    activeTime,
    morningSteps,
    eveningSteps,
    currentSteps,
    personalizationNote,
    skinTypeLabel,
    timeLabel,
    formattedTime,
    setActiveTime,
    refresh,
  } = useSkincareRoutine();

  // 새로고침 핸들러
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // 시간대 토글
  const handleTimeToggle = useCallback(
    (time: TimeOfDay) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveTime(time);
    },
    [setActiveTime]
  );

  // 피부 분석으로 이동
  const handleGoToAnalysis = useCallback(() => {
    router.push('/(analysis)/skin');
  }, []);

  // 제품 추천으로 이동
  const handleProductRecommendation = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/products',
      params: {
        skinType: skinData?.skin_type || '',
        category: 'skincare',
      },
    });
  }, [skinData]);

  return (
    <ScreenContainer
      testID="analysis-skin-routine-screen"
      edges={['bottom']}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <DataStateWrapper
        isLoading={loading}
        error={error}
        onRetry={handleGoToAnalysis}
        emptyConfig={{
          icon: <Text style={{ fontSize: 48 }}>😢</Text>,
          title: '루틴을 만들 수 없어요',
          description: '피부 분석을 먼저 진행해주세요.',
          actionLabel: '피부 분석하러 가기',
          onAction: handleGoToAnalysis,
        }}
        isEmpty={!skinData}
      >
        {/* 헤더 */}
        <Animated.View entering={staggeredEntry(0)} style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>오늘의 스킨케어 루틴</Text>
          {skinData && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {skinTypeLabel} 피부 맞춤 루틴
            </Text>
          )}
        </Animated.View>

        {/* 개인화 노트 */}
        {personalizationNote && (
          <Animated.View entering={staggeredEntry(1)} style={[styles.noteCard, { backgroundColor: colors.secondary }]}>
            <Text style={styles.noteEmoji}>✨</Text>
            <Text style={[styles.noteText, { color: colors.foreground }]}>
              {personalizationNote}
            </Text>
          </Animated.View>
        )}

        {/* 아침/저녁 토글 */}
        <Animated.View entering={staggeredEntry(2)} style={[styles.toggleContainer, { backgroundColor: colors.muted }]}>
          <Pressable
            style={[
              styles.toggleButton,
              activeTime === 'morning' && { backgroundColor: colors.card },
            ]}
            onPress={() => handleTimeToggle('morning')}
          >
            <Text style={styles.toggleEmoji}>🌅</Text>
            <Text
              style={[
                styles.toggleText,
                { color: colors.mutedForeground },
                activeTime === 'morning' && { color: colors.foreground },
              ]}
            >
              아침 ({morningSteps.length}단계)
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.toggleButton,
              activeTime === 'evening' && { backgroundColor: colors.card },
            ]}
            onPress={() => handleTimeToggle('evening')}
          >
            <Text style={styles.toggleEmoji}>🌙</Text>
            <Text
              style={[
                styles.toggleText,
                { color: colors.mutedForeground },
                activeTime === 'evening' && { color: colors.foreground },
              ]}
            >
              저녁 ({eveningSteps.length}단계)
            </Text>
          </Pressable>
        </Animated.View>

        {/* 루틴 정보 */}
        <View style={styles.routineInfo}>
          <Text style={[styles.routineInfoText, { color: colors.foreground }]}>
            {timeLabel} 루틴 • {currentSteps.length}단계
          </Text>
          <Text style={[styles.routineTime, { color: colors.mutedForeground }]}>
            예상 {formattedTime}
          </Text>
        </View>

        {/* 루틴 단계 목록 */}
        <View style={styles.stepsList}>
          {currentSteps.map((step, index) => (
            <RoutineStepCard key={`${step.category}-${index}`} step={step} />
          ))}
        </View>

        {/* 하단 버튼 */}
        <View style={styles.footer}>
          <Pressable style={styles.primaryButton} onPress={handleProductRecommendation}>
            <Text style={[styles.primaryButtonText, { color: colors.card }]}>🧴 피부 맞춤 제품 보기</Text>
          </Pressable>
          <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
            파트너사 링크를 통해 구매하시면 이룸에 도움이 돼요
          </Text>
        </View>
      </DataStateWrapper>
    </ScreenContainer>
  );
}

/**
 * 루틴 단계 카드 컴포넌트
 */
function RoutineStepCard({ step }: { step: RoutineStep }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const categoryInfo = getCategoryInfo(step.category);

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

  return (
    <Pressable
      style={[styles.stepCard, { backgroundColor: colors.card }]}
      onPress={toggleExpand}

    >
      <View style={styles.stepHeader}>
        <View style={styles.stepOrderContainer}>
          <Text style={[styles.stepOrder, { color: colors.card }]}>{step.order}</Text>
        </View>
        <View style={styles.stepInfo}>
          <View style={styles.stepTitleRow}>
            <Text style={styles.stepEmoji}>{categoryInfo.emoji}</Text>
            <Text style={[styles.stepName, { color: colors.foreground }]}>{step.name}</Text>
            {step.isOptional && (
              <View style={[styles.optionalBadge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.optionalText, { color: colors.mutedForeground }]}>선택</Text>
              </View>
            )}
          </View>
          <Text style={[styles.stepPurpose, { color: colors.mutedForeground }]}>
            {step.purpose}
          </Text>
          {step.duration && (
            <Text style={[styles.stepDuration, { color: colors.mutedForeground }]}>
              ⏱ {step.duration}
            </Text>
          )}
        </View>
        <Text style={[styles.expandIcon, { color: colors.mutedForeground }]}>
          {expanded ? '▲' : '▼'}
        </Text>
      </View>

      {/* 팁 (확장 시 표시) */}
      {expanded && step.tips.length > 0 && (
        <View style={[styles.tipsContainer, { borderTopColor: colors.border }]}>
          <Text style={[styles.tipsTitle, { color: colors.foreground }]}>💡 사용 팁</Text>
          {step.tips.map((tip, index) => (
            <Text key={index} style={[styles.tipText, { color: colors.mutedForeground }]}>
              • {tip}
            </Text>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.mlg,
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
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.mlg,
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
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: radii.xl,
    padding: spacing.xs,
    marginBottom: spacing.mlg,
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
  routineTime: {
    fontSize: typography.size.sm,
  },
  stepsList: {
    gap: spacing.smx,
    marginBottom: spacing.lg,
  },
  stepCard: {
    borderRadius: radii.xl,
    padding: spacing.md,
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
  },
  stepEmoji: {
    fontSize: typography.size.lg,
  },
  stepName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
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
  stepPurpose: {
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  stepDuration: {
    fontSize: typography.size.xs,
  },
  expandIcon: {
    fontSize: 10,
    marginLeft: spacing.sm,
  },
  tipsContainer: {
    marginTop: spacing.smx,
    paddingTop: spacing.smx,
    borderTopWidth: 1,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  footer: {
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: moduleColors.skin.base,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.smx,
  },
  primaryButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  footerNote: {
    fontSize: typography.size.xs,
    textAlign: 'center',
  },
});
