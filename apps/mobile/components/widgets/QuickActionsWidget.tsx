/**
 * 빠른 실행 위젯 미리보기
 * 원탭 액션 버튼 위젯
 */

import * as Haptics from 'expo-haptics';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

import { useTheme } from '../../lib/theme';
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
  const { isDark } = useTheme();

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
      <View style={[styles.containerSmall, isDark && styles.containerDark]}>
        <View style={styles.smallGrid}>
          {QUICK_ACTIONS.slice(0, 2).map((action) => (
            <TouchableOpacity
              key={action.type}
              style={[styles.smallButton, isDark && styles.buttonDark]}
              onPress={() => handlePress(action.type)}
            >
              <Text style={styles.buttonIcon}>{action.icon}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // 중형 위젯 (4x1)
  return (
    <View style={[styles.containerMedium, isDark && styles.containerDark]}>
      <Text style={[styles.title, isDark && styles.textLight]}>빠른 실행</Text>
      <View style={styles.actionsRow}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.type}
            style={[styles.actionButton, isDark && styles.buttonDark]}
            onPress={() => handlePress(action.type)}
          >
            <Text style={styles.buttonIcon}>{action.icon}</Text>
            <Text style={[styles.buttonLabel, isDark && styles.textMuted]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerSmall: {
    width: 155,
    height: 155,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
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
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  smallGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  smallButton: {
    width: 56,
    height: 56,
    backgroundColor: '#f5f3ff',
    borderRadius: 16,
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
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#f5f3ff',
    minWidth: 64,
  },
  buttonDark: {
    backgroundColor: '#2a2a4e',
  },
  buttonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  buttonLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
