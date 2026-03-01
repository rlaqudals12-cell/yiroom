/**
 * NotificationCard - 알림 카드 컴포넌트
 * 개별 알림 정보를 표시한다.
 */
import React, { memo } from 'react';
import { View, Text, Pressable, type ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme';

export type NotificationType = 'analysis' | 'workout' | 'nutrition' | 'social' | 'system';

export interface NotificationCardProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead?: boolean;
  onPress?: (id: string) => void;
  style?: ViewStyle;
}

const TYPE_EMOJI: Record<NotificationType, string> = {
  analysis: '🔬',
  workout: '💪',
  nutrition: '🍽️',
  social: '👥',
  system: '🔔',
};

export const NotificationCard = memo(function NotificationCard({
  id,
  type,
  title,
  message,
  timestamp,
  isRead = false,
  onPress,
  style,
}: NotificationCardProps): React.ReactElement {
  const { colors, brand, spacing, radii, typography } = useTheme();

  return (
    <Pressable
      testID="notification-card"
      accessibilityLabel={`${title}, ${isRead ? '읽음' : '읽지 않음'}`}
      onPress={() => onPress?.(id)}
      style={[
        {
          backgroundColor: isRead ? colors.card : brand.primary + '08',
          borderRadius: radii.lg,
          padding: spacing.md,
          flexDirection: 'row',
          gap: spacing.smx,
        },
        style,
      ]}
    >
      {/* 이모지 */}
      <Text style={{ fontSize: typography.size.xl }}>{TYPE_EMOJI[type]}</Text>

      {/* 내용 */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xxs }}>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: isRead ? typography.weight.normal : typography.weight.bold,
              color: colors.foreground,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {!isRead && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: radii.full,
                backgroundColor: brand.primary,
                marginLeft: spacing.sm,
              }}
            />
          )}
        </View>

        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
            marginBottom: spacing.xs,
          }}
          numberOfLines={2}
        >
          {message}
        </Text>

        <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
          {timestamp}
        </Text>
      </View>
    </Pressable>
  );
});
