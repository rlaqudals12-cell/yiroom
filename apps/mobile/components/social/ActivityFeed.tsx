/**
 * ActivityFeed — 활동 피드
 *
 * 친구들의 최근 활동을 보여주는 피드 리스트.
 */
import React from 'react';
import { View, Text, FlatList, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme, spacing} from '../../lib/theme';

export interface ActivityItem {
  id: string;
  userName: string;
  action: string;
  detail?: string;
  timeAgo: string;
  emoji?: string;
}

export interface ActivityFeedProps {
  activities: ActivityItem[];
  emptyMessage?: string;
  style?: ViewStyle;
}

export function ActivityFeed({
  activities,
  emptyMessage = '아직 활동이 없어요',
  style,
}: ActivityFeedProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows } = useTheme();

  if (activities.length === 0) {
    return (
      <View style={[styles.empty, style]} testID="activity-feed">
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
      testID="activity-feed"
      accessibilityLabel={`활동 피드, ${activities.length}개 항목`}
    >
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.item,
              {
                backgroundColor: colors.card,
                borderRadius: radii.xl,
                padding: spacing.sm,
                ...shadows.sm,
              },
            ]}
            accessibilityLabel={`${item.userName}님이 ${item.action}`}
          >
            <View style={styles.row}>
              {item.emoji && (
                <Text style={{ fontSize: typography.size.lg, marginRight: spacing.sm }}>
                  {item.emoji}
                </Text>
              )}
              <View style={styles.content}>
                <Text style={{ fontSize: typography.size.sm, color: colors.foreground }}>
                  <Text style={{ fontWeight: typography.weight.bold }}>{item.userName}</Text>
                  {' '}{item.action}
                </Text>
                {item.detail && (
                  <Text
                    style={{
                      fontSize: typography.size.xs,
                      color: colors.mutedForeground,
                      marginTop: spacing.xxs,
                    }}
                    numberOfLines={2}
                  >
                    {item.detail}
                  </Text>
                )}
              </View>
              <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
                {item.timeAgo}
              </Text>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: spacing.xl,
  },
  item: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
});
