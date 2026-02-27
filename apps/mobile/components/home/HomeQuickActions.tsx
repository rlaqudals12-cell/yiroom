/**
 * HomeQuickActions — GlassCard AI 코치 + AnimatedCard 퀵 액션
 */
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { GlassCard, AnimatedCard } from '../ui';
import { GradientBackground } from '../ui';
import { SectionHeader } from '../ui';
import { useTheme, typography} from '../../lib/theme';
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

export function HomeQuickActions({
  actions,
  onActionPress,
  onCoachPress,
}: HomeQuickActionsProps): React.JSX.Element {
  const { colors, spacing, radii, typography, status, module: moduleColors } = useTheme();

  const coachColor = moduleColors.workout.dark;

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
      {/* AI Coach 카드 — 그라디언트 배경 */}
      <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, marginBottom: spacing.lg }]}
          onPress={handleCoachPress}
        >
          <GradientBackground
            variant="workout"
            style={{
              borderRadius: radii.xl,
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
        <SectionHeader title="빠른 시작" style={{ marginBottom: spacing.sm + 4 }} />
        <View style={[styles.actionsRow, { gap: spacing.sm + 4 }]}>
          {actions.map((action, index) => (
            <AnimatedCard
              key={action.title}
              onPress={() => handleActionPress(action.route)}
              style={{ flex: 1 }}
              testID={`quick-action-${index}`}
            >
              <View style={{ padding: spacing.sm + 2 }}>
                <View style={styles.actionHeader}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: action.color,
                    }}
                  />
                  {action.completed && (
                    <Text style={{ fontSize: 12, color: status.success, fontWeight: typography.weight.semibold }}>
                      ✓
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.semibold,
                    color: colors.foreground,
                    marginBottom: 2,
                  }}
                >
                  {action.title}
                </Text>
                <Text
                  style={{
                    fontSize: typography.size.xs - 1,
                    color: colors.mutedForeground,
                  }}
                >
                  {action.completed ? '완료됨' : action.subtitle}
                </Text>
              </View>
            </AnimatedCard>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  coachIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  coachContent: {
    flex: 1,
  },
  coachTitle: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: 2,
  },
  coachSubtitle: {
    fontSize: 12,
  },
  coachArrow: {
    fontSize: 28,
    fontWeight: '300',
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
});
