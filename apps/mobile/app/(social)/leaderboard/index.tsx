/**
 * 리더보드 페이지
 */

import * as Haptics from 'expo-haptics';
import { useUser } from '@clerk/clerk-expo';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getTierColor,
  getTierLabel,
  type RankingEntry,
} from '../../../lib/social';
import {
  useLeaderboard,
  useFriendsLeaderboard,
  useMyRanking,
} from '../../../lib/social/useLeaderboard';

type TabType = 'all' | 'friends';

export default function LeaderboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState<TabType>('all');

  const {
    rankings: allRankings,
    isLoading: allLoading,
    refetch: refetchAll,
  } = useLeaderboard();
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
          isDark && styles.rankingCardDark,
          isMe && styles.rankingCardMe,
        ]}
      >
        <View style={styles.rankBadge}>
          <Text
            style={[styles.rankText, item.rank <= 3 && styles.rankTextMedal]}
          >
            {getRankBadge(item.rank)}
          </Text>
        </View>

        <View style={styles.avatarContainer}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                isDark && styles.avatarPlaceholderDark,
              ]}
            >
              <Text style={styles.avatarText}>
                {item.displayName.charAt(0)}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.tierDot,
              { backgroundColor: getTierColor(item.tier) },
            ]}
          />
        </View>

        <View style={styles.userInfo}>
          <Text
            style={[
              styles.userName,
              isDark && styles.textLight,
              isMe && styles.userNameMe,
            ]}
          >
            {item.displayName} {isMe && '(나)'}
          </Text>
          <View style={styles.userMeta}>
            <Text style={[styles.tierText, { color: getTierColor(item.tier) }]}>
              {getTierLabel(item.tier)}
            </Text>
            <Text style={[styles.levelText, isDark && styles.textMuted]}>
              Lv.{item.level}
            </Text>
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreValue, isDark && styles.textLight]}>
            {item.score.toLocaleString()}
          </Text>
          <Text style={[styles.scoreLabel, isDark && styles.textMuted]}>
            XP
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
    >
      {/* 내 순위 카드 */}
      {rank && (
        <View style={[styles.myRankCard, isDark && styles.myRankCardDark]}>
          <View style={styles.myRankInfo}>
            <Text style={styles.myRankLabel}>내 순위</Text>
            <Text style={styles.myRankValue}>
              {rank.toLocaleString()}위 / {totalUsers.toLocaleString()}명
            </Text>
          </View>
          <View style={styles.percentileContainer}>
            <Text style={styles.percentileValue}>상위 {percentile}%</Text>
          </View>
        </View>
      )}

      {/* 탭 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => handleTabChange('all')}
        >
          <Text
            style={[
              styles.tabText,
              isDark && styles.textMuted,
              activeTab === 'all' && styles.tabTextActive,
            ]}
          >
            전체
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => handleTabChange('friends')}
        >
          <Text
            style={[
              styles.tabText,
              isDark && styles.textMuted,
              activeTab === 'friends' && styles.tabTextActive,
            ]}
          >
            친구
          </Text>
        </TouchableOpacity>
      </View>

      {/* 리더보드 목록 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : rankings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={[styles.emptyText, isDark && styles.textMuted]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  myRankCardDark: {
    backgroundColor: '#7c3aed',
  },
  myRankInfo: {
    flex: 1,
  },
  myRankLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  myRankValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  percentileContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  percentileValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#8b5cf6',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  rankingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
  },
  rankingCardDark: {
    backgroundColor: '#1a1a1a',
  },
  rankingCardMe: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  rankBadge: {
    width: 36,
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
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
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderDark: {
    backgroundColor: '#333',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  tierDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  userNameMe: {
    color: '#8b5cf6',
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
  },
  levelText: {
    fontSize: 12,
    color: '#666',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
