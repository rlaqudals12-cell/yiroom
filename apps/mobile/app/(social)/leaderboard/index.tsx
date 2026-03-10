/**
 * 리더보드 페이지
 */

import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';

import { ScreenContainer } from '@/components/ui';
import { getTierColor, getTierLabel, type RankingEntry } from '@/lib/social';
import { useLeaderboard, useFriendsLeaderboard, useMyRanking } from '@/lib/social/useLeaderboard';
import { useTheme, typography, radii, spacing } from '@/lib/theme';

type TabType = 'all' | 'friends';
type CategoryType = 'xp' | 'level' | 'wellness' | 'workout' | 'nutrition';

const CATEGORIES: { id: CategoryType; label: string; emoji: string }[] = [
  { id: 'xp', label: 'XP', emoji: '⭐' },
  { id: 'level', label: '레벨', emoji: '🏅' },
  { id: 'wellness', label: '웰니스', emoji: '💚' },
  { id: 'workout', label: '운동', emoji: '💪' },
  { id: 'nutrition', label: '영양', emoji: '🥗' },
];

const CATEGORY_SCORE_LABELS: Record<CategoryType, string> = {
  xp: 'XP',
  level: 'Lv',
  wellness: '점',
  workout: 'kcal',
  nutrition: '점',
};

export default function LeaderboardScreen() {
  // typography, spacing, radii는 모듈 스코프 import 사용 (섀도잉 방지)
  const { colors, brand, module: moduleColors } = useTheme();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('xp');

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

  const handleCategoryChange = (category: CategoryType) => {
    Haptics.selectionAsync();
    setActiveCategory(category);
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
          <Text
            style={[
              styles.userName,
              { color: colors.foreground },
              isMe && { color: brand.primary },
            ]}
          >
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
          <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>
            {CATEGORY_SCORE_LABELS[activeCategory]}
          </Text>
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

      {/* 카테고리 세그먼트 */}
      <View
        style={[styles.categoryRow, { paddingHorizontal: spacing.md, marginBottom: spacing.sm }]}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            style={[
              styles.categoryChip,
              {
                backgroundColor: activeCategory === cat.id ? brand.primary : colors.card,
                borderColor: activeCategory === cat.id ? brand.primary : colors.border,
                borderWidth: 1,
              },
            ]}
            onPress={() => handleCategoryChange(cat.id)}
          >
            <Text style={{ fontSize: 12 }}>{cat.emoji}</Text>
            <Text
              style={[
                styles.categoryLabel,
                { color: activeCategory === cat.id ? brand.primaryForeground : colors.foreground },
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </View>

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
    padding: spacing.mlg,
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
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  percentileContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: radii.circle,
  },
  percentileValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.xl,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.smd,
    alignItems: 'center',
    borderRadius: radii.xl,
  },
  tabActive: {
    // backgroundColor set inline via colors.card
  },
  tabText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.smd,
  },
  rankingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    padding: 14,
  },
  rankingCardMe: {
    borderWidth: 2,
  },
  rankBadge: {
    width: 36,
    alignItems: 'center',
    marginRight: spacing.smd,
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
    marginLeft: spacing.smx,
  },
  userName: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },

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
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  categoryChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
    gap: spacing.xxs,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: typography.weight.semibold,
  },
});
