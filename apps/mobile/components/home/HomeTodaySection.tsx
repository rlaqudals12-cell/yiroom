/**
 * HomeTodaySection — 알림 배너 + GlassCard 오늘 할 일 목록
 */
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { GlassCard } from '../ui';
import { useTheme, typography, spacing } from '../../lib/theme';
import { SectionHeader } from '../ui';
import { TIMING } from '../../lib/animations';

interface TodoTask {
  id: string;
  label: string;
  completed: boolean;
  route: string;
}

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
}

interface HomeTodaySectionProps {
  tasks: TodoTask[];
  notifications: Notification[];
  onTaskPress: (route: string) => void;
}

// 시간대별 한국어 인사 (웹 교차 모듈 패턴 포팅)
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '좋은 새벽이에요';
  if (hour < 12) return '좋은 아침이에요';
  if (hour < 18) return '좋은 오후예요';
  return '좋은 저녁이에요';
}

export function HomeTodaySection({
  tasks,
  notifications,
  onTaskPress,
}: HomeTodaySectionProps): React.JSX.Element {
  const { colors, spacing, radii, typography, status, brand } = useTheme();

  const remainingCount = tasks.filter((t) => !t.completed).length;
  const greeting = getTimeGreeting();

  // 알림 타입별 배경색
  const getNotificationBg = (type: Notification['type']): string => {
    switch (type) {
      case 'success':
        return status.success + '20';
      case 'warning':
        return status.warning + '20';
      default:
        return status.info + '20';
    }
  };

  const handleTaskPress = (route: string): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTaskPress(route);
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(100).duration(TIMING.normal)}
      testID="home-today-section"
    >
      {/* 시간대별 인사 */}
      <Text
        style={{
          fontSize: typography.size.lg,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
        accessibilityRole="header"
      >
        {greeting}
      </Text>

      {/* 알림 배너 */}
      {notifications.length > 0 && (
        <View
          style={{
            backgroundColor: getNotificationBg(notifications[0].type),
            borderRadius: radii.lg,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.smx,
            marginBottom: spacing.md,
          }}
        >
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.cardForeground,
            }}
          >
            {notifications[0].message}
          </Text>
        </View>
      )}

      {/* 오늘 할 일 */}
      <SectionHeader
        title="오늘 할 일"
        action={{ label: `${remainingCount}개 남음`, onPress: () => {} }}
        style={{ marginBottom: spacing.smx }}
      />

      <GlassCard
        intensity={50}
        style={{ padding: 0, marginBottom: spacing.lg, borderRadius: radii.xl, overflow: 'hidden' }}
      >
        {tasks.map((task, index) => (
          <Pressable
            key={task.id}
            style={({ pressed }) => [
              styles.todoItem,
              index < tasks.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
              pressed && styles.pressed,
            ]}
            onPress={() => handleTaskPress(task.route)}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: task.completed ? status.success : colors.border,
                  backgroundColor: task.completed ? status.success : 'transparent',
                },
              ]}
            >
              {task.completed && <Text style={[styles.checkmark, { color: colors.overlayForeground }]}>✓</Text>}
            </View>
            <Text
              style={[
                {
                  fontSize: typography.size.base - 1,
                  color: task.completed ? colors.mutedForeground : colors.cardForeground,
                  flex: 1,
                },
                task.completed && styles.completedLabel,
              ]}
            >
              {task.label}
            </Text>
          </Pressable>
        ))}
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    marginRight: spacing.smx,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  completedLabel: {
    textDecorationLine: 'line-through',
  },
  pressed: {
    opacity: 0.8,
  },
});
