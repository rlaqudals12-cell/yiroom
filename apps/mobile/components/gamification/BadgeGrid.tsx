/**
 * BadgeGrid — 뱃지 그리드
 *
 * 여러 뱃지를 그리드로 표시. 해금된 뱃지 수 요약.
 */
import React from 'react';
import { View, Text, FlatList, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';
import { BadgeCard, type BadgeCardProps } from './BadgeCard';

export interface BadgeGridProps {
  badges: Omit<BadgeCardProps, 'onPress' | 'style'>[];
  onBadgePress?: (id: string) => void;
  style?: ViewStyle;
}

export function BadgeGrid({
  badges,
  onBadgePress,
  style,
}: BadgeGridProps): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <View
      style={style}
      testID="badge-grid"
      accessibilityLabel={`뱃지 ${badges.length}개 중 ${unlockedCount}개 해금`}
    >
      <View style={[styles.header, { marginBottom: spacing.sm }]}>
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
          }}
        >
          뱃지
        </Text>
        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
          {unlockedCount}/{badges.length}
        </Text>
      </View>
      <FlatList
        data={badges}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <View style={[styles.gridItem, { padding: spacing.xs }]}>
            <BadgeCard {...item} onPress={onBadgePress} />
          </View>
        )}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridItem: {
    flex: 1 / 3,
  },
});
