/**
 * LeaderboardList — 리더보드 리스트
 *
 * 전체 리더보드 목록. FlatList 기반.
 */
import React from 'react';
import { View, Text, FlatList, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';
import { LeaderboardCard, type LeaderboardCardProps } from './LeaderboardCard';

export interface LeaderboardListProps {
  entries: Omit<LeaderboardCardProps, 'onPress' | 'style'>[];
  currentUserId?: string;
  onEntryPress?: () => void;
  emptyMessage?: string;
  style?: ViewStyle;
}

export function LeaderboardList({
  entries,
  onEntryPress,
  emptyMessage = '리더보드가 비어있습니다',
  style,
}: LeaderboardListProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows } = useTheme();

  if (entries.length === 0) {
    return (
      <View
        style={[styles.empty, { padding: spacing.xl }]}
        testID="leaderboard-list"
        accessibilityLabel={emptyMessage}
      >
        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground, textAlign: 'center' }}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
        style,
      ]}
      testID="leaderboard-list"
      accessibilityLabel={`리더보드 ${entries.length}명`}
    >
      <Text
        style={{
          fontSize: typography.size.base,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        리더보드
      </Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => `rank-${item.rank}`}
        renderItem={({ item }) => (
          <LeaderboardCard {...item} onPress={onEntryPress} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {},
});
