/**
 * FriendCard — 친구 카드
 *
 * 친구 프로필 정보와 상태를 보여주는 카드.
 */
import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface FriendCardProps {
  id: string;
  name: string;
  avatar?: string;
  statusMessage?: string;
  level?: number;
  isOnline?: boolean;
  onPress?: (id: string) => void;
  style?: ViewStyle;
}

export const FriendCard = memo(function FriendCard({
  id,
  name,
  statusMessage,
  level,
  isOnline,
  onPress,
  style,
}: FriendCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, status } = useTheme();

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
        style,
      ]}
      onPress={() => onPress?.(id)}
      disabled={!onPress}
      testID="friend-card"
      accessibilityLabel={`${name}${isOnline ? ', 온라인' : ''}${level ? `, 레벨 ${level}` : ''}`}
    >
      <View style={styles.row}>
        {/* 아바타 */}
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.secondary,
              borderRadius: radii.full,
            },
          ]}
        >
          <Text style={{ fontSize: typography.size.lg, textAlign: 'center' }}>
            {name.charAt(0)}
          </Text>
          {isOnline && (
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: status.success, borderColor: colors.card },
              ]}
            />
          )}
        </View>

        {/* 정보 */}
        <View style={[styles.info, { marginLeft: spacing.sm }]}>
          <View style={styles.nameRow}>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.bold,
                color: colors.foreground,
              }}
            >
              {name}
            </Text>
            {level !== undefined && (
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  marginLeft: spacing.xs,
                }}
              >
                Lv.{level}
              </Text>
            )}
          </View>
          {statusMessage && (
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
                marginTop: spacing.xxs,
              }}
              numberOfLines={1}
            >
              {statusMessage}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
