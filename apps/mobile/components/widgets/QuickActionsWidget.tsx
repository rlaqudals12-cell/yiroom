/**
 * 빠른 실행 위젯 미리보기
 * 원탭 액션 버튼 위젯
 */

import * as Haptics from 'expo-haptics';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';

import { useTheme, typography, radii , spacing } from '../../lib/theme';
import { widgetLogger } from '../../lib/utils/logger';
import { WIDGET_DEEP_LINKS, QuickActionType } from '../../lib/widgets/types';

interface QuickActionsWidgetProps {
  size?: 'small' | 'medium';
  onAction?: (action: QuickActionType) => void;
}

// 빠른 액션 정의
const QUICK_ACTIONS = [
  { type: 'addWater' as QuickActionType, icon: '💧', label: '물 추가' },
  { type: 'startWorkout' as QuickActionType, icon: '🏃', label: '운동 시작' },
  { type: 'logMeal' as QuickActionType, icon: '📸', label: '식사 기록' },
  { type: 'viewDashboard' as QuickActionType, icon: '📊', label: '대시보드' },
];

export function QuickActionsWidget({ size = 'medium', onAction }: QuickActionsWidgetProps) {
  const { colors, typography } = useTheme();

  const handlePress = async (action: QuickActionType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (onAction) {
      onAction(action);
    } else {
      // 딥링크로 앱 내 화면 이동
      const deepLink = WIDGET_DEEP_LINKS[action];
      try {
        await Linking.openURL(deepLink);
      } catch (error) {
        widgetLogger.error('Failed to open deep link:', error);
      }
    }
  };

  // 소형 위젯 (2x1)
  if (size === 'small') {
    return (
      <View style={[styles.containerSmall, { backgroundColor: colors.card }]}>
        <View style={styles.smallGrid}>
          {QUICK_ACTIONS.slice(0, 2).map((action) => (
            <Pressable
              key={action.type}
              style={[styles.smallButton, { backgroundColor: colors.muted }]}
              onPress={() => handlePress(action.type)}
            >
              <Text style={styles.buttonIcon}>{action.icon}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  // 중형 위젯 (4x1)
  return (
    <View
      testID="quick-actions-widget"
      style={[styles.containerMedium, { backgroundColor: colors.card }]}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>빠른 실행</Text>
      <View style={styles.actionsRow}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.type}
            style={[styles.actionButton, { backgroundColor: colors.muted }]}
            onPress={() => handlePress(action.type)}
          >
            <Text style={styles.buttonIcon}>{action.icon}</Text>
            <Text style={[styles.buttonLabel, { color: colors.mutedForeground }]}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerSmall: {
    width: 155,
    height: 155,
    borderRadius: 22,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  containerMedium: {
    width: 329,
    height: 155,
    borderRadius: 22,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.smx,
  },
  smallGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  smallButton: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flex: 1,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    padding: spacing.smx,
    borderRadius: radii.xl,
    minWidth: 64,
  },
  buttonIcon: {
    fontSize: typography.size['2xl'],
    marginBottom: spacing.xs,
  },
  buttonLabel: {
    fontSize: 11,
    fontWeight: typography.weight.medium,
  },
});
