/**
 * LeaderboardList -- 리더보드 목록
 *
 * FlatList 기반 리더보드 엔트리 리스트.
 * 본인 항목 자동 스크롤, 기간별 헤더 표시.
 */
import React, { useCallback, useRef, useEffect } from 'react';
import { FlatList, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme, spacing } from '../../lib/theme';
import { EmptyState } from '../common/EmptyState';

import { LeaderboardEntry, type LeaderboardEntryProps } from './LeaderboardEntry';

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'allTime';

/** 기간 라벨 한국어 매핑 */
const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  weekly: '이번 주',
  monthly: '이번 달',
  allTime: '전체',
};

export interface LeaderboardListProps {
  /** 리더보드 엔트리 배열 */
  entries: LeaderboardEntryProps[];
  /** 기간 유형 */
  period: LeaderboardPeriod;
  /** 추가 스타일 */
  style?: ViewStyle;
  /** 테스트 ID */
  testID?: string;
}

export function LeaderboardList({
  entries,
  period,
  style,
  testID = 'leaderboard-list',
}: LeaderboardListProps): React.JSX.Element {
  const { colors, typography, radii, spacing } = useTheme();
  const listRef = useRef<FlatList>(null);

  // 본인 항목으로 자동 스크롤
  useEffect(() => {
    if (entries.length === 0) return;
    const myIndex = entries.findIndex((e) => e.isMe);
    if (myIndex > 0) {
      // 약간의 딜레이 후 스크롤 (레이아웃 완료 대기)
      const timer = setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: myIndex,
          animated: true,
          viewOffset: 100,
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [entries]);

  const renderItem = useCallback(
    ({ item }: { item: LeaderboardEntryProps }) => (
      <LeaderboardEntry {...item} />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: LeaderboardEntryProps) => `${item.rank}-${item.name}`,
    [],
  );

  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  const renderHeader = useCallback(
    () => (
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text
          style={{
            color: colors.foreground,
            fontSize: typography.size.lg,
            fontWeight: typography.weight.bold,
          }}
        >
          {PERIOD_LABELS[period]} 순위
        </Text>
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: typography.size.xs,
          }}
        >
          {entries.length}명 참여
        </Text>
      </View>
    ),
    [period, entries.length, colors, typography],
  );

  if (entries.length === 0) {
    return (
      <View testID={testID} style={style}>
        <EmptyState
          icon={<Text style={{ fontSize: 32 }}>📊</Text>}
          title="순위 정보 없음"
          description="아직 참여자가 없어요. 첫 번째 참가자가 되어보세요!"
        />
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      testID={testID}
      data={entries}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={renderSeparator}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={[styles.contentContainer, style]}
      showsVerticalScrollIndicator={false}
      onScrollToIndexFailed={() => {
        // 스크롤 실패 시 무시 (레이아웃 미완료)
      }}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.smx,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
  },
  separator: {
    height: spacing.xxs,
  },
});
