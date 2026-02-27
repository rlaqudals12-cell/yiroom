/**
 * 리더보드 페이지
 */

import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Image } from 'expo-image';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useTheme, typography, radii , spacing } from '@/lib/theme';
import { ScreenContainer } from '../../../components/ui';

import { getTierColor, getTierLabel, type RankingEntry } from '../../../lib/social';
import {
  useLeaderboard,
  useFriendsLeaderboard,
  useMyRanking,
} from '../../../lib/social/useLeaderboard';

type TabType = 'all' | 'friends';

export default function LeaderboardScreen() {
  const { colors, brand, module: moduleColors, typography } = useTheme();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState<TabType>('all');

  const { rankings: allRankings, isLoading: allLoading, refetch: refetchAll } = useLeaderboard();
  const {
    rankings: friendRankings,
    isLoading: friendsLoading,
    refetch: refetchFriends,
  } = useFriendsLeaderboard();
  const { rank, totalUsers, percentile } = useMyRanking();

  const isLoading = activeTab === 'all' ? allLoading : friendsLoading;
  const rankings = activeTab === 'all' ? allRankings : friendRankings;
  const refetch = activeTab === 'all' ? refetchAll : refetchFriends;

  const handleTabChange = (tab: TabType) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const getRankBadge = (rankNum: number) => {
    if (rankNum === 1) return '🥇';
    if (rankNum === 2) return '🥈';
    if (rankNum === 3) return '🥉';
    return `${rankNum}`;
  };

  const renderRankingItem = ({ item }: { item: RankingEntry }) => {
    const isMe = item.userId === user?.id;

    return (
      <View
        style={[
          styles.rankingCard,
          { backgroundColor: colors.card },
          isMe && [styles.rankingCardMe, { borderColor: brand.primary }],
        ]}
      >
        <View style={styles.rankBadge}>
          <Text
            style={[
              styles.rankText,
              { color: colors.mutedForeground },
              item.rank <= 3 && styles.rankTextMedal,
            ]}
          >
            {getRankBadge(item.rank)}
          </Text>
        </View>

        <View style={styles.avatarContainer}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} transition={200} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
              <Text style={[styles.avatarText, { color: colors.mutedForeground }]}>
                {item.displayName.charAt(0)}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.tierDot,
              { backgroundColor: getTierColor(item.tier), borderColor: colors.card },
            ]}
          />
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.foreground }, isMe && { color: brand.primary }]}>
            {item.displayName} {isMe && '(나)'}
          </Text>
          <View style={styles.userMeta}>
            <Text style={[styles.tierText, { color: getTierColor(item.tier) }]}>
              {getTierLabel(item.tier)}
            </Text>
            <Text style={[styles.levelText, { color: colors.mutedForeground }]}>
              Lv.{item.level}
            </Text>
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreValue, { color: colors.foreground }]}>
            {item.score.toLocaleString()}
          </Text>
          <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>XP</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer
      testID="social-leaderboard-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
    >
      {/* 내 순위 카드 */}
      {rank && (
        <View style={[styles.myRankCard, { backgroundColor: brand.primary }]}>
          <View style={styles.myRankInfo}>
            <Text style={[styles.myRankLabel, { color: brand.primaryForeground }]}>내 순위</Text>
            <Text style={[styles.myRankValue, { color: brand.primaryForeground }]}>
              {rank.toLocaleString()}위 / {totalUsers.toLocaleString()}명
            </Text>
          </View>
          <View style={styles.percentileContainer}>
            <Text style={[styles.percentileValue, { color: brand.primaryForeground }]}>
              상위 {percentile}%
            </Text>
          </View>
        </View>
      )}

      {/* 탭 */}
      <View style={[styles.tabContainer, { backgroundColor: colors.muted }]}>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'all' && [styles.tabActive, { backgroundColor: colors.card }],
          ]}
          onPress={() => handleTabChange('all')}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.mutedForeground },
              activeTab === 'all' && { color: brand.primary },
            ]}
          >
            전체
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'friends' && [styles.tabActive, { backgroundColor: colors.card }],
          ]}
          onPress={() => handleTabChange('friends')}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.mutedForeground },
              activeTab === 'friends' && { color: brand.primary },
            ]}
          >
            친구
          </Text>
        </Pressable>
      </View>

      {/* 리더보드 목록 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={moduleColors.body.dark} />
        </View>
      ) : rankings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {activeTab === 'friends'
              ? '친구를 추가하면 리더보드를 볼 수 있어요'
              : '아직 리더보드 데이터가 없어요'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={rankings}
          keyExtractor={(item) => item.userId}
          renderItem={renderRankingItem}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    borderRadius: radii.xl,
    padding: 20,
  },
  myRankInfo: {
    flex: 1,
  },
  myRankLabel: {
    fontSize: 13,
    opacity: 0.8,
    marginBottom: spacing.xs,
  },
  myRankValue: {
    fontSize: 20,
    fontWeight: typography.weight.bold,
  },
  percentileContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  percentileValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radii.lg,
  },
  tabActive: {
    // backgroundColor set inline via colors.card
  },
  tabText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  tabTextActive: {},
  listContent: {
    padding: spacing.md,
    gap: 10,
  },
  rankingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
  },
  rankingCardMe: {
    borderWidth: 2,
  },
  rankBadge: {
    width: 36,
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
  rankTextMedal: {
    fontSize: 22,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  tierDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: radii.sm,
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
  userNameMe: {},
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 3,
  },
  tierText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  levelText: {
    fontSize: typography.size.xs,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  scoreLabel: {
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
