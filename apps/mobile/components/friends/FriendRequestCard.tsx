/**
 * FriendRequestCard -- 친구 요청 카드
 *
 * 아바타, 이름, 공통 친구 수, 수락/거절 버튼을 표시.
 * 요청 시간은 상대적 시간("3일 전")으로 표시.
 */
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii } from '../../lib/theme';

export interface FriendRequestCardProps {
  id: string;
  name: string;
  avatar?: string;
  mutualFriends: number;
  sentAt: Date;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  style?: ViewStyle;
}

/** 날짜를 상대 시간 문자열로 변환 */
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}일 전`;

  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}개월 전`;
}

export function FriendRequestCard({
  id,
  name,
  avatar,
  mutualFriends,
  sentAt,
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
      accessibilityLabel={`${name}님의 친구 요청, 공통 친구 ${mutualFriends}명`}
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
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={[styles.avatarImage, { borderRadius: radii.full }]}
              accessibilityLabel={`${name}님의 프로필 사진`}
            />
          ) : (
            <Text style={{ fontSize: typography.size.xl, color: colors.foreground }}>
              {name.charAt(0)}
            </Text>
          )}
        </View>

        {/* 정보 */}
        <View style={[styles.info, { marginLeft: spacing.smx }]}>
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
            numberOfLines={1}
          >
            {name}
          </Text>
          <View style={[styles.metaRow, { marginTop: spacing.xxs }]}>
            {mutualFriends > 0 && (
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                }}
              >
                공통 친구 {mutualFriends}명
              </Text>
            )}
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
                marginLeft: mutualFriends > 0 ? spacing.sm : 0,
              }}
            >
              {formatRelativeTime(sentAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* 수락/거절 버튼 */}
      <View style={[styles.btnRow, { marginTop: spacing.smx, gap: spacing.sm }]}>
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            {
              backgroundColor: colors.secondary,
              borderRadius: radii.xl,
              paddingVertical: spacing.sm,
              opacity: pressed ? 0.7 : 1,
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
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            {
              backgroundColor: status.success,
              borderRadius: radii.xl,
              paddingVertical: spacing.sm,
              opacity: pressed ? 0.7 : 1,
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
              color: colors.overlayForeground,
              textAlign: 'center',
            }}
          >
            수락
          </Text>
        </Pressable>
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
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
  },
  info: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
  },
  btn: {
    flex: 1,
  },
});
