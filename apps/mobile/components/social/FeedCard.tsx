/**
 * FeedCard — 소셜 피드 카드
 *
 * 피드 게시물 카드: 사용자, 내용, 좋아요, 댓글 수.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface FeedCardProps {
  id: string;
  userName: string;
  content: string;
  timeAgo: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
  onPress?: (id: string) => void;
  style?: ViewStyle;
}

export function FeedCard({
  id,
  userName,
  content,
  timeAgo,
  likeCount,
  commentCount,
  isLiked = false,
  onLike,
  onComment,
  onPress,
  style,
}: FeedCardProps): React.JSX.Element {
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
      testID="feed-card"
      accessibilityLabel={`${userName}님의 게시물: ${content}`}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary, borderRadius: radii.full }]}>
          <Text style={{ fontSize: typography.size.sm }}>{userName.charAt(0)}</Text>
        </View>
        <View style={{ marginLeft: spacing.sm, flex: 1 }}>
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
          >
            {userName}
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
            {timeAgo}
          </Text>
        </View>
      </View>

      {/* 내용 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          color: colors.foreground,
          marginTop: spacing.sm,
          lineHeight: 20,
        }}
        numberOfLines={4}
      >
        {content}
      </Text>

      {/* 액션 */}
      <View style={[styles.actions, { marginTop: spacing.sm, gap: spacing.md }]}>
        <Pressable
          style={styles.actionBtn}
          onPress={() => onLike?.(id)}
          accessibilityLabel={`좋아요 ${likeCount}개${isLiked ? ', 좋아요함' : ''}`}
          accessibilityRole="button"
        >
          <Text style={{ fontSize: typography.size.sm }}>
            {isLiked ? '❤️' : '🤍'}
          </Text>
          <Text
            style={{
              fontSize: typography.size.xs,
              color: isLiked ? status.error : colors.mutedForeground,
              marginLeft: spacing.xxs,
            }}
          >
            {likeCount}
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionBtn}
          onPress={() => onComment?.(id)}
          accessibilityLabel={`댓글 ${commentCount}개`}
          accessibilityRole="button"
        >
          <Text style={{ fontSize: typography.size.sm }}>💬</Text>
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
              marginLeft: spacing.xxs,
            }}
          >
            {commentCount}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
