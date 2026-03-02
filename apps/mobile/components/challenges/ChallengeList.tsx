/**
 * ChallengeList -- 챌린지 목록
 *
 * FlatList 기반 챌린지 카드 리스트.
 * 빈 상태일 때 EmptyState 컴포넌트로 안내 메시지 표시.
 */
import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme, spacing } from '../../lib/theme';
import { EmptyState } from '../common/EmptyState';

import { ChallengeCard, type ChallengeCardProps } from './ChallengeCard';

export interface ChallengeListProps {
  /** 챌린지 데이터 배열 */
  challenges: ChallengeCardProps[];
  /** 챌린지 카드 클릭 핸들러 */
  onChallengePress?: (id: string) => void;
  /** 빈 상태 메시지 (기본: "진행 중인 챌린지가 없어요") */
  emptyMessage?: string;
  /** 추가 스타일 */
  style?: ViewStyle;
  /** 테스트 ID */
  testID?: string;
}

export function ChallengeList({
  challenges,
  onChallengePress,
  emptyMessage = '진행 중인 챌린지가 없어요',
  style,
  testID = 'challenge-list',
}: ChallengeListProps): React.JSX.Element {
  const { colors, typography } = useTheme();

  const renderItem = useCallback(
    ({ item }: { item: ChallengeCardProps }) => (
      <ChallengeCard
        {...item}
        onPress={onChallengePress}
      />
    ),
    [onChallengePress],
  );

  const keyExtractor = useCallback(
    (item: ChallengeCardProps) => item.id,
    [],
  );

  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  if (challenges.length === 0) {
    return (
      <View testID={testID} style={style}>
        <EmptyState
          icon={<Text style={{ fontSize: 32 }}>🏆</Text>}
          title="챌린지 없음"
          description={emptyMessage}
        />
      </View>
    );
  }

  return (
    <FlatList
      testID={testID}
      data={challenges}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={renderSeparator}
      contentContainerStyle={[styles.contentContainer, style]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: spacing.md,
  },
  separator: {
    height: spacing.smx,
  },
});
