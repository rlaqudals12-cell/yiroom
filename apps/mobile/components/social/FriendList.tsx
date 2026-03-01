/**
 * FriendList — 친구 목록
 *
 * 전체 친구 목록 표시. 온라인/오프라인 구분, 검색 가능.
 */
import React from 'react';
import { View, Text, FlatList, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';
import { FriendCard, type FriendCardProps } from './FriendCard';

export interface FriendListProps {
  friends: Omit<FriendCardProps, 'onPress' | 'style'>[];
  onFriendPress?: (id: string) => void;
  emptyMessage?: string;
  style?: ViewStyle;
}

export function FriendList({
  friends,
  onFriendPress,
  emptyMessage = '아직 친구가 없어요',
  style,
}: FriendListProps): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();

  const onlineCount = friends.filter((f) => f.isOnline).length;

  if (friends.length === 0) {
    return (
      <View style={[styles.empty, style]} testID="friend-list">
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
            textAlign: 'center',
          }}
        >
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={style}
      testID="friend-list"
      accessibilityLabel={`친구 ${friends.length}명, 온라인 ${onlineCount}명`}
    >
      <Text
        style={{
          fontSize: typography.size.sm,
          color: colors.mutedForeground,
          marginBottom: spacing.sm,
        }}
      >
        친구 {friends.length}명 · 온라인 {onlineCount}명
      </Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FriendCard {...item} onPress={onFriendPress} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: 32,
  },
});
