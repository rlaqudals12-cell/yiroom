/**
 * AnnouncementCard - 공지사항 카드 컴포넌트
 * 공지사항 항목을 표시한다.
 */
import React, { memo } from 'react';
import { View, Text, Pressable, type ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme';

export type AnnouncementType = 'notice' | 'update' | 'event' | 'maintenance';

export interface AnnouncementCardProps {
  id: string;
  type: AnnouncementType;
  title: string;
  summary?: string;
  date: string;
  isPinned?: boolean;
  onPress?: (id: string) => void;
  style?: ViewStyle;
}

const TYPE_CONFIG: Record<AnnouncementType, { emoji: string; label: string }> = {
  notice: { emoji: '📢', label: '공지' },
  update: { emoji: '🆕', label: '업데이트' },
  event: { emoji: '🎉', label: '이벤트' },
  maintenance: { emoji: '🔧', label: '점검' },
};

export const AnnouncementCard = memo(function AnnouncementCard({
  id,
  type,
  title,
  summary,
  date,
  isPinned = false,
  onPress,
  style,
}: AnnouncementCardProps): React.ReactElement {
  const { colors, brand, status, spacing, radii, typography } = useTheme();

  const config = TYPE_CONFIG[type];

  return (
    <Pressable
      testID="announcement-card"
      accessibilityLabel={`${config.label}: ${title}${isPinned ? ', 고정됨' : ''}`}
      onPress={() => onPress?.(id)}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          borderLeftWidth: isPinned ? 4 : 0,
          borderLeftColor: isPinned ? brand.primary : undefined,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
        <Text style={{ fontSize: typography.size.base, marginRight: spacing.xs }}>{config.emoji}</Text>

        <View
          style={{
            backgroundColor:
              type === 'maintenance' ? status.warning + '20' : brand.primary + '15',
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xxs,
            borderRadius: radii.full,
            marginRight: spacing.sm,
          }}
        >
          <Text
            style={{
              fontSize: typography.size.xs,
              fontWeight: typography.weight.semibold,
              color: type === 'maintenance' ? status.warning : brand.primary,
            }}
          >
            {config.label}
          </Text>
        </View>

        {isPinned && (
          <Text style={{ fontSize: typography.size.xs, color: brand.primary }}>📌</Text>
        )}

        <View style={{ flex: 1 }} />

        <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
          {date}
        </Text>
      </View>

      <Text
        style={{
          fontSize: typography.size.base,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: summary ? spacing.xxs : 0,
        }}
        numberOfLines={2}
      >
        {title}
      </Text>

      {summary ? (
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
          }}
          numberOfLines={2}
        >
          {summary}
        </Text>
      ) : null}
    </Pressable>
  );
});
