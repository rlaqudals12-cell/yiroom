/**
 * NotificationList - 알림 목록 컴포넌트
 * 알림 카드 목록을 FlatList로 표시한다.
 */
import React from 'react';
import { View, Text, FlatList, type ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme';
import { NotificationCard, type NotificationCardProps } from './NotificationCard';

export interface NotificationListProps {
  notifications: Omit<NotificationCardProps, 'onPress' | 'style'>[];
  onNotificationPress?: (id: string) => void;
  emptyMessage?: string;
  style?: ViewStyle;
}

export function NotificationList({
  notifications,
  onNotificationPress,
  emptyMessage = '새로운 알림이 없습니다',
  style,
}: NotificationListProps): React.ReactElement {
  const { colors, spacing, typography } = useTheme();

  if (notifications.length === 0) {
    return (
      <View
        testID="notification-list"
        accessibilityLabel="알림 없음"
        style={[{ padding: spacing.xl, alignItems: 'center' }, style]}
      >
        <Text style={{ fontSize: typography.size['2xl'], marginBottom: spacing.sm }}>🔕</Text>
        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground, textAlign: 'center' }}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View
      testID="notification-list"
      accessibilityLabel={`알림 ${notifications.length}개${unreadCount > 0 ? `, 읽지 않은 알림 ${unreadCount}개` : ''}`}
      style={style}
    >
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationCard
            {...item}
            onPress={onNotificationPress}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={{ padding: spacing.md }}
        scrollEnabled={false}
      />
    </View>
  );
}
