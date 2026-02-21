/**
 * HomeQuickActions — AI 코치 카드 + 3개 퀵 액션 버튼
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme';
import { SectionHeader } from '../ui';

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
  const { colors, spacing, radii, shadows, typography, status, module: moduleColors } = useTheme();

  // AI Coach → moduleColors.workout.dark (이전 하드코딩 #10b981 대체)
  const coachColor = moduleColors.workout.dark;

  return (
    <View testID="home-quick-actions">
      {/* AI Coach 카드 */}
      <Pressable
        style={({ pressed }) => [
          styles.coachCard,
          shadows.md,
          {
            backgroundColor: colors.card,
            borderRadius: radii.xl,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: coachColor,
            opacity: pressed ? 0.85 : 1,
            marginBottom: spacing.lg,
          },
        ]}
        onPress={onCoachPress}
      >
        <View
          style={[
            styles.coachIcon,
            {
              backgroundColor: coachColor + '15',
              width: 44,
              height: 44,
              borderRadius: 22,
            },
          ]}
        >
          <Text style={{ fontSize: 22 }}>💬</Text>
        </View>
        <View style={styles.coachContent}>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
              marginBottom: 2,
            }}
          >
            AI 코치에게 물어보세요
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm - 1,
              color: colors.mutedForeground,
            }}
          >
            운동, 영양, 뷰티 궁금한 것 무엇이든
          </Text>
        </View>
        <Text style={{ fontSize: 28, fontWeight: '300', color: coachColor }}>›</Text>
      </Pressable>

      {/* 퀵 액션 */}
      <SectionHeader title="빠른 시작" style={{ marginBottom: spacing.sm + 4 }} />
      <View style={[styles.actionsRow, { gap: spacing.sm + 4 }]}>
        {actions.map((action) => (
          <Pressable
            key={action.title}
            style={({ pressed }) => [
              styles.actionCard,
              shadows.sm,
              {
                backgroundColor: colors.card,
                borderRadius: radii.lg,
                padding: spacing.md,
                opacity: pressed ? 0.85 : 1,
              },
              action.completed && {
                borderWidth: 1,
                borderColor: status.success,
              },
            ]}
            onPress={() => onActionPress(action.route)}
          >
            <View style={styles.actionHeader}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: action.color,
                }}
              />
              {action.completed && (
                <Text
                  style={{
                    fontSize: 12,
                    color: status.success,
                    fontWeight: '600',
                  }}
                >
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
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  coachContent: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
});
