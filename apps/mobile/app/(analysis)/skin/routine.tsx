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
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';

import {
  useSkincareRoutine,
  getCategoryInfo,
  type TimeOfDay,
  type RoutineStep,
} from '@/lib/skincare';

export default function SkincareRoutineScreen() {
  const { colors, isDark } = useTheme();
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
      <View style={[styles.centerContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#2e5afa" />
        <Text style={[styles.loadingText, isDark && styles.textMuted]}>
          루틴을 준비하고 있어요...
        </Text>
      </View>
    );
  }

  // 에러 상태 (피부 분석 결과 없음)
  if (error) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <View style={[styles.errorCard, isDark && styles.cardDark]}>
            <Text style={styles.errorIcon}>😢</Text>
            <Text style={[styles.errorTitle, isDark && styles.textLight]}>
              루틴을 만들 수 없어요
            </Text>
            <Text style={[styles.errorText, isDark && styles.textMuted]}>{error}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGoToAnalysis}>
              <Text style={styles.primaryButtonText}>피부 분석하러 가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#ffffff' : '#2e5afa'}
          />
        }
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.textLight]}>오늘의 스킨케어 루틴</Text>
          {skinData && (
            <Text style={[styles.subtitle, isDark && styles.textMuted]}>
              {skinTypeLabel} 피부 맞춤 루틴
            </Text>
          )}
        </View>

        {/* 개인화 노트 */}
        {personalizationNote && (
          <View style={[styles.noteCard, isDark && styles.noteCardDark]}>
            <Text style={styles.noteEmoji}>✨</Text>
            <Text style={[styles.noteText, isDark && styles.textLight]}>{personalizationNote}</Text>
          </View>
        )}

        {/* 아침/저녁 토글 */}
        <View style={[styles.toggleContainer, isDark && styles.toggleContainerDark]}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeTime === 'morning' && styles.toggleButtonActive,
              activeTime === 'morning' && isDark && styles.toggleButtonActiveDark,
            ]}
            onPress={() => handleTimeToggle('morning')}
          >
            <Text style={styles.toggleEmoji}>🌅</Text>
            <Text
              style={[
                styles.toggleText,
                activeTime === 'morning' && styles.toggleTextActive,
                isDark && styles.textMuted,
                activeTime === 'morning' && isDark && styles.textLight,
              ]}
            >
              아침 ({morningSteps.length}단계)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeTime === 'evening' && styles.toggleButtonActive,
              activeTime === 'evening' && isDark && styles.toggleButtonActiveDark,
            ]}
            onPress={() => handleTimeToggle('evening')}
          >
            <Text style={styles.toggleEmoji}>🌙</Text>
            <Text
              style={[
                styles.toggleText,
                activeTime === 'evening' && styles.toggleTextActive,
                isDark && styles.textMuted,
                activeTime === 'evening' && isDark && styles.textLight,
              ]}
            >
              저녁 ({eveningSteps.length}단계)
            </Text>
          </TouchableOpacity>
        </View>

        {/* 루틴 정보 */}
        <View style={styles.routineInfo}>
          <Text style={[styles.routineInfoText, isDark && styles.textLight]}>
            {timeLabel} 루틴 • {currentSteps.length}단계
          </Text>
          <Text style={[styles.routineTime, isDark && styles.textMuted]}>예상 {formattedTime}</Text>
        </View>

        {/* 루틴 단계 목록 */}
        <View style={styles.stepsList}>
          {currentSteps.map((step, index) => (
            <RoutineStepCard key={`${step.category}-${index}`} step={step} isDark={isDark} />
          ))}
        </View>

        {/* 하단 버튼 */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleProductRecommendation}>
            <Text style={styles.primaryButtonText}>🧴 피부 맞춤 제품 보기</Text>
          </TouchableOpacity>
          <Text style={[styles.footerNote, isDark && styles.textMuted]}>
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
function RoutineStepCard({ step, isDark }: { step: RoutineStep; isDark: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const categoryInfo = getCategoryInfo(step.category);

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity
      style={[styles.stepCard, isDark && styles.cardDark]}
      onPress={toggleExpand}
      activeOpacity={0.7}
    >
      <View style={styles.stepHeader}>
        <View style={styles.stepOrderContainer}>
          <Text style={styles.stepOrder}>{step.order}</Text>
        </View>
        <View style={styles.stepInfo}>
          <View style={styles.stepTitleRow}>
            <Text style={styles.stepEmoji}>{categoryInfo.emoji}</Text>
            <Text style={[styles.stepName, isDark && styles.textLight]}>{step.name}</Text>
            {step.isOptional && (
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalText}>선택</Text>
              </View>
            )}
          </View>
          <Text style={[styles.stepPurpose, isDark && styles.textMuted]}>{step.purpose}</Text>
          {step.duration && (
            <Text style={[styles.stepDuration, isDark && styles.textMuted]}>⏱ {step.duration}</Text>
          )}
        </View>
        <Text style={[styles.expandIcon, isDark && styles.textMuted]}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {/* 팁 (확장 시 표시) */}
      {expanded && step.tips.length > 0 && (
        <View style={[styles.tipsContainer, isDark && styles.tipsContainerDark]}>
          <Text style={[styles.tipsTitle, isDark && styles.textLight]}>💡 사용 팁</Text>
          {step.tips.map((tip, index) => (
            <Text key={index} style={[styles.tipText, isDark && styles.textMuted]}>
              • {tip}
            </Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fc',
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
    color: '#111',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  errorCard: {
    backgroundColor: '#fff',
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
    color: '#111',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: '#eef3ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    alignItems: 'flex-start',
  },
  noteCardDark: {
    backgroundColor: '#1a2744',
  },
  noteEmoji: {
    fontSize: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e5e5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleContainerDark: {
    backgroundColor: '#2a2a2a',
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
  toggleButtonActive: {
    backgroundColor: '#fff',
  },
  toggleButtonActiveDark: {
    backgroundColor: '#3a3a3a',
  },
  toggleEmoji: {
    fontSize: 16,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  toggleTextActive: {
    color: '#111',
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
    color: '#111',
  },
  routineTime: {
    fontSize: 14,
    color: '#666',
  },
  stepsList: {
    gap: 12,
    marginBottom: 24,
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  cardDark: {
    backgroundColor: '#1a1a1a',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepOrderContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2e5afa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepOrder: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
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
    color: '#111',
  },
  optionalBadge: {
    backgroundColor: '#e5e5e5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  optionalText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  stepPurpose: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  stepDuration: {
    fontSize: 12,
    color: '#999',
  },
  expandIcon: {
    fontSize: 10,
    color: '#999',
    marginLeft: 8,
  },
  tipsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tipsContainerDark: {
    borderTopColor: '#333',
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  footer: {
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2e5afa',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  textLight: {
    color: '#ffffff',
  },
  textMuted: {
    color: '#999',
  },
});
