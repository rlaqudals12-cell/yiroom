/**
 * MatchList -- 매칭 제품 목록
 *
 * MatchCard 아이템을 FlatList로 렌더링.
 * 정렬 옵션(매칭률/가격/인기도)과 빈 상태 처리 포함.
 */
import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii, typography } from '../../lib/theme';
import { MatchCard, type MatchCardData } from './MatchCard';

export type MatchSortBy = 'matchRate' | 'price' | 'popularity';

interface MatchListProps {
  matches: MatchCardData[];
  onMatchPress?: (match: MatchCardData) => void;
  sortBy?: MatchSortBy;
  style?: ViewStyle;
}

/** 정렬 로직 */
function sortMatches(
  matches: MatchCardData[],
  sortBy: MatchSortBy
): MatchCardData[] {
  const sorted = [...matches];

  switch (sortBy) {
    case 'matchRate':
      return sorted.sort((a, b) => b.matchRate - a.matchRate);
    case 'price':
      // 가격 오름차순, 가격 없는 항목은 뒤로
      return sorted.sort((a, b) => {
        if (a.price === undefined && b.price === undefined) return 0;
        if (a.price === undefined) return 1;
        if (b.price === undefined) return -1;
        return a.price - b.price;
      });
    case 'popularity':
      // 인기도 기준 없을 시 매칭률 fallback
      return sorted.sort((a, b) => b.matchRate - a.matchRate);
    default:
      return sorted;
  }
}

/** 빈 상태 컴포넌트 */
function EmptyState({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }): React.JSX.Element {
  return (
    <View
      testID="match-list-empty"
      style={styles.emptyContainer}
      accessibilityLabel="매칭 결과 없음"
    >
      <Text style={styles.emptyIcon}>{'🔍'}</Text>
      <Text
        style={{
          fontSize: typography.size.base,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginTop: spacing.smx,
          textAlign: 'center',
        }}
      >
        매칭된 제품이 없어요
      </Text>
      <Text
        style={{
          fontSize: typography.size.sm,
          color: colors.mutedForeground,
          marginTop: spacing.xs,
          textAlign: 'center',
          lineHeight: typography.size.sm * typography.lineHeight.relaxed,
        }}
      >
        피부 분석을 먼저 완료하면{'\n'}나에게 맞는 제품을 추천해드려요
      </Text>
    </View>
  );
}

export function MatchList({
  matches,
  onMatchPress,
  sortBy = 'matchRate',
  style,
}: MatchListProps): React.JSX.Element {
  const { colors } = useTheme();

  // 정렬된 목록
  const sortedMatches = useMemo(
    () => sortMatches(matches, sortBy),
    [matches, sortBy]
  );

  // 아이템 키 추출
  const keyExtractor = useCallback(
    (item: MatchCardData, index: number) =>
      `${item.brand}-${item.productName}-${index}`,
    []
  );

  // 아이템 렌더링
  const renderItem = useCallback(
    ({ item, index }: { item: MatchCardData; index: number }) => (
      <MatchCard
        {...item}
        testID={`match-card-${index}`}
        onPress={() => onMatchPress?.(item)}
        style={{ marginHorizontal: spacing.md }}
      />
    ),
    [onMatchPress]
  );

  // 아이템 사이 간격
  const ItemSeparator = useCallback(
    () => <View style={{ height: spacing.smx }} />,
    []
  );

  if (sortedMatches.length === 0) {
    return (
      <View testID="match-list" style={style}>
        <EmptyState colors={colors} />
      </View>
    );
  }

  return (
    <FlatList
      testID="match-list"
      data={sortedMatches}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ItemSeparatorComponent={ItemSeparator}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: spacing.xxl },
      ]}
      showsVerticalScrollIndicator={false}
      style={style}
      accessibilityLabel={`매칭 제품 ${sortedMatches.length}개`}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
  },
});
