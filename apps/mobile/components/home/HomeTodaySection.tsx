/**
 * HomeTodaySection — 알림 배너 + GlassCard 오늘 할 일 목록
 */
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { TIMING, useAdaptiveAnimation } from '../../lib/animations';
import type { ContextSuggestion } from '../../lib/recommendations/context-aware';
import { useTheme, typography, spacing } from '../../lib/theme';
import { GlassCard } from '../ui';
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
  /** 시간대×요일 기반 문맥 제안 (선택) */
  contextSuggestion?: ContextSuggestion;
  onTaskPress: (route: string) => void;
  onSuggestionPress?: (route: string) => void;
}

// 시간대별 한국어 인사 (웹 교차 모듈 패턴 포팅)
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '좋은 새벽이에요';
  if (hour < 12) return '좋은 아침이에요';
  if (hour < 18) return '좋은 오후예요';
  return '좋은 저녁이에요';
}

// 모듈 색상 키 → 이모지 매핑
const SUGGESTION_EMOJI: Record<string, string> = {
  skin: '✨',
  workout: '💪',
  nutrition: '🥗',
  personalColor: '🎨',
  body: '📐',
};

export function HomeTodaySection({
  tasks,
  notifications,
  contextSuggestion,
  onTaskPress,
  onSuggestionPress,
}: HomeTodaySectionProps): React.JSX.Element {
  const { colors, spacing, radii, typography, status, brand, shadows, module: moduleColors } = useTheme();

  // 접근성: 동작 줄이기 설정 시 entering 애니메이션 생략
  const { shouldAnimate } = useAdaptiveAnimation();

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
      entering={shouldAnimate ? FadeInUp.delay(100).duration(TIMING.normal) : undefined}
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

      {/* 알림 배너 — 아이콘 + 색상 보더 + 그림자 */}
      {notifications.length > 0 && (
        <View
          style={{
            backgroundColor: getNotificationBg(notifications[0].type),
            borderRadius: radii.xl,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.smx,
            marginBottom: spacing.md,
            borderWidth: 1.5,
            borderColor: getNotificationBg(notifications[0].type).replace('20', '50'),
            flexDirection: 'row',
            alignItems: 'center',
            ...shadows.md,
          }}
        >
          <Text style={{ fontSize: 16, marginRight: spacing.sm }}>
            {notifications[0].type === 'success'
              ? '🎉'
              : notifications[0].type === 'warning'
                ? '⚠️'
                : '💡'}
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.cardForeground,
              flex: 1,
            }}
          >
            {notifications[0].message}
          </Text>
        </View>
      )}

      {/* 시간대 문맥 제안 */}
      {contextSuggestion && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSuggestionPress?.(contextSuggestion.route);
          }}
          style={({ pressed }) => [
            {
              backgroundColor: `${moduleColors[contextSuggestion.moduleColor]?.base ?? brand.primary}12`,
              borderRadius: radii.xl,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.smx,
              marginBottom: spacing.md,
              borderWidth: 1,
              borderColor: `${moduleColors[contextSuggestion.moduleColor]?.base ?? brand.primary}30`,
              flexDirection: 'row' as const,
              alignItems: 'center' as const,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={contextSuggestion.message}
          accessibilityHint={contextSuggestion.actionLabel}
        >
          <Text style={{ fontSize: 18, marginRight: spacing.sm }}>
            {SUGGESTION_EMOJI[contextSuggestion.moduleColor] ?? '💡'}
          </Text>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.cardForeground,
                marginBottom: 2,
              }}
            >
              {contextSuggestion.message}
            </Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: moduleColors[contextSuggestion.moduleColor]?.base ?? brand.primary,
                fontWeight: typography.weight.semibold,
              }}
            >
              {contextSuggestion.actionLabel} →
            </Text>
          </View>
        </Pressable>
      )}

      {/* 오늘 할 일 */}
      <SectionHeader
        title="오늘 할 일"
        action={{ label: `${remainingCount}개 남음`, onPress: () => {} }}
        style={{ marginBottom: spacing.smx }}
      />

      <GlassCard
        intensity={50}
        shadowSize="lg"
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
              {task.completed && (
                <Text style={[styles.checkmark, { color: colors.overlayForeground }]}>✓</Text>
              )}
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
    paddingVertical: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
