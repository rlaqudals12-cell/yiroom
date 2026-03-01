/**
 * FriendRequestCard — 친구 요청 카드
 *
 * 수락/거절 버튼이 있는 친구 요청 카드.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface FriendRequestCardProps {
  id: string;
  name: string;
  message?: string;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  style?: ViewStyle;
}

export function FriendRequestCard({
  id,
  name,
  message,
  onAccept,
  onDecline,
  style,
}: FriendRequestCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, status } = useTheme();

  return (
    <View
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
      testID="friend-request-card"
      accessibilityLabel={`${name}님의 친구 요청`}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.secondary, borderRadius: radii.full },
          ]}
        >
          <Text style={{ fontSize: typography.size.lg }}>{name.charAt(0)}</Text>
        </View>
        <View style={[styles.info, { marginLeft: spacing.sm }]}>
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
          >
            {name}
          </Text>
          {message && (
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
                marginTop: spacing.xxs,
              }}
              numberOfLines={1}
            >
              {message}
            </Text>
          )}
        </View>
      </View>

      {/* 버튼 */}
      <View style={[styles.btnRow, { marginTop: spacing.sm, gap: spacing.sm }]}>
        {onDecline && (
          <Pressable
            style={[
              styles.btn,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.lg,
                paddingVertical: spacing.sm,
              },
            ]}
            onPress={() => onDecline(id)}
            accessibilityLabel="친구 요청 거절"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                textAlign: 'center',
              }}
            >
              거절
            </Text>
          </Pressable>
        )}
        {onAccept && (
          <Pressable
            style={[
              styles.btn,
              {
                backgroundColor: status.success,
                borderRadius: radii.lg,
                paddingVertical: spacing.sm,
              },
            ]}
            onPress={() => onAccept(id)}
            accessibilityLabel="친구 요청 수락"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.bold,
                color: '#FFFFFF',
                textAlign: 'center',
              }}
            >
              수락
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

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
  info: {
    flex: 1,
  },
  btnRow: {
    flexDirection: 'row',
  },
  btn: {
    flex: 1,
  },
});
