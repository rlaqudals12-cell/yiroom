/**
 * HomeQuickActions — 개인화 퀵 액션 (분석 히스토리 기반 동적 정렬)
 * 미완료 모듈 우선 표시 + 30일 경과 재분석 안내 + 최근 완료 표시
 */
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { TIMING, useAdaptiveAnimation } from '../../lib/animations';
import { useTheme, typography, spacing } from '../../lib/theme';
import { AnimatedCard } from '../ui';
import { GradientBackground } from '../ui';
import { SectionHeader } from '../ui';

/** 분석 완료 시각 정보 (개인화에 필요) */
export interface AnalysisHistory {
  personalColor: Date | null;
  skin: Date | null;
  body: Date | null;
}

// 퀵 액션 상태
type ActionStatus = 'not-started' | 'reanalysis-recommended' | 'completed';

interface QuickAction {
  title: string;
  subtitle: string;
  color: string;
  route: string;
  completed: boolean;
}

interface HomeQuickActionsProps {
  actions: QuickAction[];
  /** 분석 히스토리 — 각 모듈의 마지막 분석 일시 */
  analysisHistory?: AnalysisHistory;
  onActionPress: (route: string) => void;
  onCoachPress: () => void;
  onChatPress?: () => void;
}

// 퀵 액션 아이콘 메타 — 그라디언트 + 이모지 (웹 gradient icon square 대응)
const ACTION_META: Record<string, { emoji: string; moduleKey: 'personalColor' | 'skin' | 'body' }> =
  {
    '퍼스널 컬러': { emoji: '🎨', moduleKey: 'personalColor' },
    '피부 분석': { emoji: '💧', moduleKey: 'skin' },
    '체형 분석': { emoji: '✨', moduleKey: 'body' },
  };

// 재분석 추천 기준: 30일
const REANALYSIS_THRESHOLD_DAYS = 30;

/** 경과 일수 계산 */
function daysSince(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** 분석 상태 결정 */
function getActionStatus(
  moduleKey: 'personalColor' | 'skin' | 'body',
  history?: AnalysisHistory
): { status: ActionStatus; daysSinceAnalysis: number | null } {
  if (!history) return { status: 'not-started', daysSinceAnalysis: null };
  const lastDate = history[moduleKey];
  if (!lastDate) return { status: 'not-started', daysSinceAnalysis: null };
  const days = daysSince(lastDate);
  if (days >= REANALYSIS_THRESHOLD_DAYS) {
    return { status: 'reanalysis-recommended', daysSinceAnalysis: days };
  }
  return { status: 'completed', daysSinceAnalysis: days };
}

/** 정렬 우선순위: 미완료 > 재분석 추천 > 최근 완료 */
function getStatusPriority(s: ActionStatus): number {
  switch (s) {
    case 'not-started': return 0;
    case 'reanalysis-recommended': return 1;
    case 'completed': return 2;
  }
}

export function HomeQuickActions({
  actions,
  analysisHistory,
  onActionPress,
  onCoachPress,
  onChatPress,
}: HomeQuickActionsProps): React.JSX.Element {
  const {
    colors,
    spacing,
    radii,
    typography,
    status,
    module: moduleColors,
    shadows,
    isDark,
    brand,
  } = useTheme();

  // 접근성: 동작 줄이기 설정 시 entering 애니메이션 생략
  const { shouldAnimate } = useAdaptiveAnimation();

  // 개인화 정렬: 미완료 우선
  const sortedActions = [...actions].sort((a, b) => {
    const metaA = ACTION_META[a.title];
    const metaB = ACTION_META[b.title];
    const statusA = getActionStatus(metaA?.moduleKey ?? 'personalColor', analysisHistory);
    const statusB = getActionStatus(metaB?.moduleKey ?? 'personalColor', analysisHistory);
    return getStatusPriority(statusA.status) - getStatusPriority(statusB.status);
  });

  const handleActionPress = (route: string): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onActionPress(route);
  };

  const handleCoachPress = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCoachPress();
  };

  const handleChatPress = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChatPress?.();
  };

  return (
    <View testID="home-quick-actions">
      {/* AI Coach 카드 — 그라디언트 배경 + 글로우 섀도 */}
      <Animated.View entering={shouldAnimate ? FadeInUp.delay(200).duration(TIMING.normal) : undefined}>
        <Pressable
          style={({ pressed }) => [
            {
              opacity: pressed ? 0.9 : 1,
              marginBottom: spacing.lg,
              borderRadius: radii.xl + 4,
            },
            // 코치 카드 글로우 그림자
            isDark
              ? {}
              : (Platform.select({
                  ios: {
                    shadowColor: moduleColors.workout.base,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.2,
                    shadowRadius: 16,
                  },
                  android: { elevation: 5 },
                }) ?? {}),
          ]}
          onPress={handleCoachPress}
          accessibilityRole="button"
          accessibilityLabel="궁금한 것을 물어보세요"
          accessibilityHint="운동, 영양, 뷰티 관련 질문을 할 수 있어요"
        >
          <GradientBackground
            variant="workout"
            style={{
              borderRadius: radii.xl + 4,
              padding: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={[styles.coachIcon, { backgroundColor: `${colors.overlayForeground}33` }]}>
              <Text style={{ fontSize: 22 }}>💬</Text>
            </View>
            <View style={styles.coachContent}>
              <Text style={[styles.coachTitle, { color: colors.overlayForeground }]}>
                궁금한 것을 물어보세요
              </Text>
              <Text style={[styles.coachSubtitle, { color: `${colors.overlayForeground}D9` }]}>
                운동, 영양, 뷰티 궁금한 것 무엇이든
              </Text>
            </View>
            <Text style={[styles.coachArrow, { color: `${colors.overlayForeground}CC` }]}>›</Text>
          </GradientBackground>
        </Pressable>
      </Animated.View>

      {/* AI 채팅 카드 */}
      {onChatPress && (
        <Animated.View entering={shouldAnimate ? FadeInUp.delay(250).duration(TIMING.normal) : undefined}>
          <Pressable
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.9 : 1,
                marginBottom: spacing.lg,
                borderRadius: radii.xl + 4,
              },
              isDark
                ? {}
                : (Platform.select({
                    ios: {
                      shadowColor: brand.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                    },
                    android: { elevation: 3 },
                  }) ?? {}),
            ]}
            onPress={handleChatPress}
            accessibilityRole="button"
            accessibilityLabel="뷰티 상담"
            accessibilityHint="뷰티, 웰니스에 대해 자유롭게 대화할 수 있어요"
          >
            <View
              style={{
                borderRadius: radii.xl + 4,
                padding: spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={[styles.coachIcon, { backgroundColor: `${brand.primary}15` }]}>
                <Text style={{ fontSize: 22 }}>💬</Text>
              </View>
              <View style={styles.coachContent}>
                <Text style={[styles.coachTitle, { color: colors.foreground }]}>뷰티 상담</Text>
                <Text style={[styles.coachSubtitle, { color: colors.mutedForeground }]}>
                  뷰티, 웰니스, 라이프스타일 자유 대화
                </Text>
              </View>
              <Text style={[styles.coachArrow, { color: colors.mutedForeground }]}>›</Text>
            </View>
          </Pressable>
        </Animated.View>
      )}

      {/* 퀵 액션 */}
      <Animated.View entering={shouldAnimate ? FadeInUp.delay(300).duration(TIMING.normal) : undefined}>
        <SectionHeader title="빠른 시작" style={{ marginBottom: spacing.smx }} />
        <View style={[styles.actionsRow, { gap: spacing.smx }]}>
          {sortedActions.map((action, index) => {
            const meta = ACTION_META[action.title];
            const modColors = moduleColors[meta?.moduleKey ?? 'personalColor'];
            const { status: actionStatus, daysSinceAnalysis } = getActionStatus(
              meta?.moduleKey ?? 'personalColor',
              analysisHistory
            );
            return (
              <AnimatedCard
                key={action.title}
                onPress={() => handleActionPress(action.route)}
                style={{ flex: 1 }}
                testID={`quick-action-${index}`}
                accessibilityLabel={`${action.title}${action.completed ? ', 완료됨' : ''}`}
                accessibilityHint={action.subtitle}
              >
                <View style={{ padding: spacing.smx, alignItems: 'center' }}>
                  {/* 그라디언트 아이콘 스퀘어 (웹 w-11 h-11 rounded-xl gradient 매칭) */}
                  <View
                    style={[
                      { marginBottom: spacing.sm, borderRadius: radii.xl },
                      !isDark
                        ? (Platform.select({
                            ios: {
                              shadowColor: action.color,
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.35,
                              shadowRadius: 10,
                            },
                            android: { elevation: 4 },
                          }) ?? {})
                        : {},
                    ]}
                  >
                    <LinearGradient
                      colors={[modColors.base, modColors.dark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: radii.xl,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{meta?.emoji ?? '✦'}</Text>
                    </LinearGradient>
                  </View>
                  {/* 상태 배지: 미완료 */}
                  {actionStatus === 'not-started' && (
                    <View style={{ position: 'absolute', top: spacing.xs, right: spacing.xs }}>
                      <LinearGradient
                        colors={[brand.primary, '#A855F7']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ borderRadius: radii.full, paddingHorizontal: 6, paddingVertical: 2 }}
                      >
                        <Text style={{ fontSize: 8, color: '#FFFFFF', fontWeight: typography.weight.bold }}>
                          NEW
                        </Text>
                      </LinearGradient>
                    </View>
                  )}
                  {/* 상태 배지: 재분석 추천 */}
                  {actionStatus === 'reanalysis-recommended' && (
                    <View
                      style={{
                        position: 'absolute', top: spacing.xs, right: spacing.xs,
                        backgroundColor: '#F97316', borderRadius: radii.full,
                        paddingHorizontal: 5, paddingVertical: 2,
                      }}
                    >
                      <Text style={{ fontSize: 8, color: '#FFFFFF', fontWeight: typography.weight.bold }}>
                        재분석
                      </Text>
                    </View>
                  )}
                  {/* 상태 배지: 최근 완료 */}
                  {actionStatus === 'completed' && (
                    <View
                      style={{
                        position: 'absolute', top: spacing.xs, right: spacing.xs,
                        backgroundColor: status.success, borderRadius: radii.full,
                        width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 10, color: colors.overlayForeground, fontWeight: typography.weight.bold }}>
                        ✓
                      </Text>
                    </View>
                  )}
                  <Text
                    style={{
                      fontSize: typography.size.sm,
                      fontWeight: typography.weight.semibold,
                      color: colors.foreground,
                      marginBottom: spacing.xxs,
                      textAlign: 'center',
                    }}
                  >
                    {action.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.size.xs - 1,
                      color: actionStatus === 'not-started' ? brand.primary
                        : actionStatus === 'reanalysis-recommended' ? '#F97316'
                        : colors.mutedForeground,
                      textAlign: 'center',
                      fontWeight: actionStatus === 'not-started' ? typography.weight.semibold : undefined,
                    }}
                  >
                    {actionStatus === 'not-started' ? '시작하기'
                      : actionStatus === 'reanalysis-recommended' ? daysSinceAnalysis + '일 전'
                      : daysSinceAnalysis !== null ? daysSinceAnalysis + '일 전 완료'
                      : '완료됨'}
                  </Text>
                </View>
              </AnimatedCard>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  coachIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.smx,
  },
  coachContent: {
    flex: 1,
  },
  coachTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  coachSubtitle: {
    fontSize: typography.size.xs,
  },
  coachArrow: {
    fontSize: 28,
    fontWeight: '300',
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
});
