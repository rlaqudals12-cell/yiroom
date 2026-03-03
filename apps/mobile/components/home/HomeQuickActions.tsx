/**
 * HomeQuickActions — GlassCard AI 코치 + AnimatedCard 퀵 액션
 */
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { GlassCard, AnimatedCard } from '../ui';
import { GradientBackground } from '../ui';
import { SectionHeader } from '../ui';
import { useTheme, typography, spacing } from '../../lib/theme';
import { TIMING } from '../../lib/animations';

interface QuickAction {
  title: string;
  subtitle: string;
  color: string;
  route: string;
  completed: boolean;
}

interface HomeQuickActionsProps {
  actions: QuickAction[];
  onActionPress: (route: string) => void;
  onCoachPress: () => void;
}

// 퀵 액션 아이콘 메타 — 그라디언트 + 이모지 (웹 gradient icon square 대응)
const ACTION_META: Record<string, { emoji: string; moduleKey: 'personalColor' | 'skin' | 'body' }> = {
  '퍼스널 컬러': { emoji: '🎨', moduleKey: 'personalColor' },
  '피부 분석': { emoji: '💧', moduleKey: 'skin' },
  '체형 분석': { emoji: '✨', moduleKey: 'body' },
};

export function HomeQuickActions({
  actions,
  onActionPress,
  onCoachPress,
}: HomeQuickActionsProps): React.JSX.Element {
  const { colors, spacing, radii, typography, status, module: moduleColors, shadows, isDark, brand } = useTheme();

  const handleActionPress = (route: string): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onActionPress(route);
  };

  const handleCoachPress = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCoachPress();
  };

  return (
    <View testID="home-quick-actions">
      {/* AI Coach 카드 — 그라디언트 배경 + 글로우 섀도 */}
      <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
        <Pressable
          style={({ pressed }) => [
            {
              opacity: pressed ? 0.9 : 1,
              marginBottom: spacing.lg,
              borderRadius: radii.xl + 4,
            },
            // 코치 카드 글로우 그림자
            isDark ? {} : Platform.select({
              ios: { shadowColor: moduleColors.workout.base, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 16 },
              android: { elevation: 5 },
            }) ?? {},
          ]}
          onPress={handleCoachPress}
          accessibilityRole="button"
          accessibilityLabel="AI 코치에게 물어보세요"
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
              <Text style={[styles.coachTitle, { color: colors.overlayForeground }]}>AI 코치에게 물어보세요</Text>
              <Text style={[styles.coachSubtitle, { color: `${colors.overlayForeground}D9` }]}>운동, 영양, 뷰티 궁금한 것 무엇이든</Text>
            </View>
            <Text style={[styles.coachArrow, { color: `${colors.overlayForeground}CC` }]}>›</Text>
          </GradientBackground>
        </Pressable>
      </Animated.View>

      {/* 퀵 액션 */}
      <Animated.View entering={FadeInUp.delay(300).duration(TIMING.normal)}>
        <SectionHeader title="빠른 시작" style={{ marginBottom: spacing.smx }} />
        <View style={[styles.actionsRow, { gap: spacing.smx }]}>
          {actions.map((action, index) => {
            const meta = ACTION_META[action.title];
            const modColors = moduleColors[meta?.moduleKey ?? 'personalColor'];
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
                  <View style={[
                    { marginBottom: spacing.sm, borderRadius: radii.xl },
                    !isDark ? Platform.select({
                      ios: { shadowColor: action.color, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 },
                      android: { elevation: 3 },
                    }) ?? {} : {},
                  ]}>
                    <LinearGradient
                      colors={[modColors.base, modColors.dark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: radii.xl,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>{meta?.emoji ?? '✦'}</Text>
                    </LinearGradient>
                  </View>
                  {action.completed && (
                    <View style={{
                      position: 'absolute',
                      top: spacing.xs,
                      right: spacing.xs,
                      backgroundColor: status.success,
                      borderRadius: radii.full,
                      width: 18,
                      height: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Text style={{ fontSize: 10, color: colors.overlayForeground, fontWeight: typography.weight.bold }}>✓</Text>
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
                      color: colors.mutedForeground,
                      textAlign: 'center',
                    }}
                  >
                    {action.completed ? '완료됨' : action.subtitle}
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
