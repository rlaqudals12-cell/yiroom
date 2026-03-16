/**
 * 크로스도메인 챌린지 목록 컴포넌트
 *
 * FlatList로 여러 크로스도메인 챌린지를 리스트로 표시
 *
 * @see lib/gamification/cross-domain-challenges.ts
 */

import React from 'react';
import { View, Text, FlatList, StyleSheet, type ViewStyle } from 'react-native';

import type {
  CrossDomainProgressView,
  CrossDomainChallengeDefinition,
} from '@/lib/gamification/cross-domain-challenges';

import { CrossDomainChallengeCard } from './CrossDomainChallengeCard';
import { useTheme } from '../../lib/theme';

// ============================================
// Props
// ============================================

export interface CrossDomainChallengeListProps {
  /** 챌린지 진행 뷰 목록 */
  views: CrossDomainProgressView[];
  /** 챌린지 정의 맵 (ID -> 정의) */
  definitions?: Map<string, CrossDomainChallengeDefinition>;
  /** "도전하기" 핸들러 */
  onJoin?: (challengeId: string) => void;
  /** 참여 중인 챌린지 ID 목록 */
  joinedIds?: string[];
  /** 스타일 */
  style?: ViewStyle;
}

// ============================================
// 컴포넌트
// ============================================

export function CrossDomainChallengeList({
  views,
  definitions,
  onJoin,
  joinedIds = [],
  style,
}: CrossDomainChallengeListProps): React.JSX.Element {
  const { colors } = useTheme();

  if (views.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="cross-domain-challenge-list-empty">
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          참여 가능한 크로스도메인 챌린지가 없어요.
        </Text>
        <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>
          레벨을 올리면 새로운 챌린지가 열려요!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={views}
      keyExtractor={(item) => item.challengeId}
      renderItem={({ item }) => (
        <CrossDomainChallengeCard
          view={item}
          definition={definitions?.get(item.challengeId)}
          onJoin={onJoin}
          isJoined={joinedIds.includes(item.challengeId)}
        />
      )}
      contentContainerStyle={[styles.listContent, style]}
      showsVerticalScrollIndicator={false}
      testID="cross-domain-challenge-list"
    />
  );
}

export default CrossDomainChallengeList;

// ============================================
// 스타일
// ============================================

const styles = StyleSheet.create({
  listContent: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
