/**
 * HomeTodaySection — 알림 배너 + 오늘 할 일 목록
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme';
import { SectionHeader } from '../ui';

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

export function HomeTodaySection({
  tasks,
  notifications,
  onTaskPress,
}: HomeTodaySectionProps): React.JSX.Element {
  const { colors, brand, spacing, radii, shadows, typography, status } = useTheme();

  const remainingCount = tasks.filter((t) => !t.completed).length;

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

  return (
    <View testID="home-today-section">
      {/* 알림 배너 */}
      {notifications.length > 0 && (
        <View
          style={{
            backgroundColor: getNotificationBg(notifications[0].type),
            borderRadius: radii.lg,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 4,
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
        style={{ marginBottom: spacing.sm + 4 }}
      />

      <View
        style={[
          styles.todoCard,
          shadows.sm,
          {
            backgroundColor: colors.card,
            borderRadius: radii.xl,
          },
        ]}
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
            onPress={() => onTaskPress(task.route)}
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
              {task.completed && <Text style={styles.checkmark}>✓</Text>}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  todoCard: {
    overflow: 'hidden',
    marginBottom: 24,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  completedLabel: {
    textDecorationLine: 'line-through',
  },
  pressed: {
    opacity: 0.8,
  },
});
