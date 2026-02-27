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
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useSkincareRoutine,
  getCategoryInfo,
  type TimeOfDay,
  type RoutineStep,
} from '@/lib/skincare';
import { moduleColors, useTheme } from '@/lib/theme';

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

  // 로딩 상태
  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={moduleColors.skin.base} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          루틴을 준비하고 있어요...
        </Text>
      </View>
    );
  }

  // 에러 상태 (피부 분석 결과 없음)
  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <View style={styles.errorContainer}>
          <View style={[styles.errorCard, { backgroundColor: colors.card }]}>
            <Text style={styles.errorIcon}>😢</Text>
            <Text style={[styles.errorTitle, { color: colors.foreground }]}>
              루틴을 만들 수 없어요
            </Text>
            <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error}</Text>
            <Pressable style={styles.primaryButton} onPress={handleGoToAnalysis}>
              <Text style={[styles.primaryButtonText, { color: colors.card }]}>피부 분석하러 가기</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      testID="analysis-skin-routine-screen"
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.foreground}
          />
        }
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>오늘의 스킨케어 루틴</Text>
          {skinData && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {skinTypeLabel} 피부 맞춤 루틴
            </Text>
          )}
        </View>

        {/* 개인화 노트 */}
        {personalizationNote && (
          <View style={[styles.noteCard, { backgroundColor: colors.secondary }]}>
            <Text style={styles.noteEmoji}>✨</Text>
            <Text style={[styles.noteText, { color: colors.foreground }]}>
              {personalizationNote}
            </Text>
          </View>
        )}

        {/* 아침/저녁 토글 */}
        <View style={[styles.toggleContainer, { backgroundColor: colors.muted }]}>
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
        </View>

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
      </ScrollView>
    </SafeAreaView>
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
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  errorCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  noteCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    alignItems: 'flex-start',
  },
  noteEmoji: {
    fontSize: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  toggleEmoji: {
    fontSize: 16,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  routineInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routineInfoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  routineTime: {
    fontSize: 14,
  },
  stepsList: {
    gap: 12,
    marginBottom: 24,
  },
  stepCard: {
    borderRadius: 16,
    padding: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepOrderContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: moduleColors.skin.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepOrder: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  stepEmoji: {
    fontSize: 18,
  },
  stepName: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  optionalText: {
    fontSize: 11,
    fontWeight: '500',
  },
  stepPurpose: {
    fontSize: 13,
    marginBottom: 4,
  },
  stepDuration: {
    fontSize: 12,
  },
  expandIcon: {
    fontSize: 10,
    marginLeft: 8,
  },
  tipsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  footer: {
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: moduleColors.skin.base,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
  },
});
