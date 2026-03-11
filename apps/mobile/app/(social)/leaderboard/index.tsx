/**
 * 리더보드 페이지
 * UX v3: GlassCard + GradientText 히어로 + backgroundGradient + LinearGradient 내 순위 + ScalePressable
 */
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { GlassCard, ScreenContainer } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { getTierColor, getTierLabel, type RankingEntry } from '@/lib/social';
import { useLeaderboard, useFriendsLeaderboard, useMyRanking } from '@/lib/social/useLeaderboard';
import { useTheme, typography, radii, spacing, coloredShadow } from '@/lib/theme';

type TabType = 'all' | 'friends';
type CategoryType = 'xp' | 'level' | 'wellness' | 'workout' | 'nutrition';

const LEADERBOARD_ACCENT = '#6366F1';

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

export default function LeaderboardScreen(): React.JSX.Element {
  const { colors, isDark, module: moduleColors } = useTheme();
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

  const handleTabChange = (tab: TabType): void => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const handleCategoryChange = (category: CategoryType): void => {
    Haptics.selectionAsync();
    setActiveCategory(category);
  };

  const getRankBadge = (rankNum: number): string => {
    if (rankNum === 1) return '🥇';
    if (rankNum === 2) return '🥈';
    if (rankNum === 3) return '🥉';
    return `${rankNum}`;
  };

  const renderRankingItem = ({ item }: { item: RankingEntry }): React.JSX.Element => {
    const isMe = item.userId === user?.id;

    return (
      <GlassCard
        shadowSize="md"
        style={{
          ...styles.rankingCard,
          ...(isMe ? { borderWidth: 2, borderColor: LEADERBOARD_ACCENT } : {}),
        }}
      >
        <View style={styles.rankBadge}>
          <Text
            style={[
              styles.rankText,
              { color: colors.mutedForeground },
              item.rank <= 3 ? styles.rankTextMedal : {},
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
              isMe ? { color: LEADERBOARD_ACCENT } : {},
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
      </GlassCard>
    );
  };

  return (
    <ScreenContainer
      testID="social-leaderboard-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
      backgroundGradient="social"
    >
      {/* 내 순위 — 글래스모피즘 그라디언트 카드 */}
      {rank && (
        <Animated.View entering={FadeIn.duration(TIMING.normal)}>
          <Pressable
            style={[
              styles.myRankCard,
              { overflow: 'hidden' },
              !isDark ? coloredShadow(LEADERBOARD_ACCENT, 'md') : {},
            ]}
          >
            <LinearGradient
              colors={[LEADERBOARD_ACCENT, '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.myRankGradient}
            >
              <View style={styles.myRankInfo}>
                <Text style={styles.myRankLabel}>내 순위</Text>
                <Text style={styles.myRankValue}>
                  {rank.toLocaleString()}위 / {totalUsers.toLocaleString()}명
                </Text>
              </View>
              <View style={styles.percentileContainer}>
                <Text style={styles.percentileValue}>상위 {percentile}%</Text>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      {/* 카테고리 세그먼트 */}
      <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
        <View
          style={[styles.categoryRow, { paddingHorizontal: spacing.md, marginBottom: spacing.sm }]}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive ? LEADERBOARD_ACCENT : colors.card,
                    borderColor: isActive ? LEADERBOARD_ACCENT : colors.border,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => handleCategoryChange(cat.id)}
              >
                <Text style={{ fontSize: 12 }}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    { color: isActive ? '#FFFFFF' : colors.foreground },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* 탭 */}
      <Animated.View entering={FadeInUp.delay(120).duration(TIMING.normal)}>
        <View style={[styles.tabContainer, { backgroundColor: colors.muted }]}>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'all' ? [styles.tabActive, { backgroundColor: colors.card }] : {},
            ]}
            onPress={() => handleTabChange('all')}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.mutedForeground },
                activeTab === 'all' ? { color: LEADERBOARD_ACCENT } : {},
              ]}
            >
              전체
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'friends' ? [styles.tabActive, { backgroundColor: colors.card }] : {},
            ]}
            onPress={() => handleTabChange('friends')}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.mutedForeground },
                activeTab === 'friends' ? { color: LEADERBOARD_ACCENT } : {},
              ]}
            >
              친구
            </Text>
          </Pressable>
        </View>
      </Animated.View>

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
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radii.xl,
  },
  myRankGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.mlg,
    borderRadius: radii.xl,
  },
  myRankInfo: {
    flex: 1,
  },
  myRankLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  myRankValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
  tabActive: {},
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
    padding: 14,
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
