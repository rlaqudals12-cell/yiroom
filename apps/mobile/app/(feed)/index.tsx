/**
 * 피드 목록 페이지
 */

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme, typography} from '@/lib/theme';

import { ScreenContainer } from '../../components/ui';

import type { FeedItem, FeedTab } from '../../lib/feed/types';
import { useFeed } from '../../lib/feed/useFeed';

// 피드 타입별 아이콘
const FEED_TYPE_ICONS: Record<string, string> = {
  badge: '🏆',
  challenge: '🎯',
  analysis: '🔬',
  workout: '💪',
  nutrition: '🥗',
};

// 피드 타입별 라벨
const FEED_TYPE_LABELS: Record<string, string> = {
  badge: '뱃지 획득',
  challenge: '챌린지',
  analysis: '분석 완료',
  workout: '운동 기록',
  nutrition: '식단 기록',
};

// 탭 라벨
const TAB_LABELS: Record<FeedTab, string> = {
  my: '내 활동',
  friends: '친구',
  all: '전체',
};

export default function FeedScreen() {
  const { colors, brand, status, typography } = useTheme();
  const router = useRouter();

  const {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore: _hasMore,
    activeTab,
    setActiveTab,
    refetch,
    loadMore,
    handleLike,
  } = useFeed();

  const handleTabChange = (tab: FeedTab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const handleItemPress = (itemId: string) => {
    Haptics.selectionAsync();
    router.push(`/(feed)/${itemId}`);
  };

  const handleLikePress = async (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await handleLike(itemId);
  };

  // 시간 포맷
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    return (
      <Pressable
        style={[styles.feedCard, { backgroundColor: colors.card }]}
        onPress={() => handleItemPress(item.id)}

      >
        {/* 헤더 */}
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.muted }]}>
              <Text style={[styles.avatarText, { color: colors.mutedForeground }]}>
                {item.userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userMeta}>
              <Text style={[styles.userName, { color: colors.foreground }]}>{item.userName}</Text>
              <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
                {formatTime(item.createdAt)}
              </Text>
            </View>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.levelText, { color: brand.primary }]}>Lv.{item.userLevel}</Text>
          </View>
        </View>

        {/* 컨텐츠 */}
        <View style={styles.cardContent}>
          <View style={styles.typeRow}>
            <Text style={styles.typeIcon}>{FEED_TYPE_ICONS[item.type] || '📝'}</Text>
            <Text style={[styles.typeLabel, { color: colors.mutedForeground }]}>
              {FEED_TYPE_LABELS[item.type] || item.type}
            </Text>
          </View>
          <Text style={[styles.contentText, { color: colors.foreground }]}>{item.content}</Text>
          {item.detail && (
            <Text style={[styles.detailText, { color: colors.mutedForeground }]} numberOfLines={2}>
              {item.detail}
            </Text>
          )}
        </View>

        {/* 액션 */}
        <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
          <Pressable style={styles.actionButton} onPress={() => handleLikePress(item.id)}>
            <Text style={styles.actionIcon}>{item.isLiked ? '❤️' : '🤍'}</Text>
            <Text style={[styles.actionText, { color: colors.mutedForeground }]}>{item.likes}</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={() => handleItemPress(item.id)}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={[styles.actionText, { color: colors.mutedForeground }]}>
              {item.comments}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={brand.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>아직 피드가 없어요</Text>
        <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
          {activeTab === 'my'
            ? '활동을 시작해보세요!'
            : activeTab === 'friends'
              ? '친구를 추가하고 활동을 확인해보세요!'
              : '첫 번째 게시물의 주인공이 되어보세요!'}
        </Text>
      </View>
    );
  };

  return (
    <ScreenContainer
      testID="feed-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
    >
      {/* 탭 */}
      <View
        style={[
          styles.tabContainer,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        {(['my', 'friends', 'all'] as FeedTab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomWidth: 2, borderBottomColor: brand.primary }]}
            onPress={() => handleTabChange(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.mutedForeground },
                activeTab === tab && { color: brand.primary, fontWeight: typography.weight.semibold },
              ]}
            >
              {TAB_LABELS[tab]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 에러 */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: status.error + '20' }]}>
          <Text style={[styles.errorText, { color: status.error }]}>{error}</Text>
          <Pressable onPress={refetch}>
            <Text style={[styles.retryText, { color: brand.primary }]}>다시 시도</Text>
          </Pressable>
        </View>
      )}

      {/* 로딩 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brand.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            피드를 불러오는 중...
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderFeedItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={brand.primary} />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  tabActive: {},
  tabText: {
    fontSize: 15,
    fontWeight: typography.weight.medium,
  },
  tabTextActive: {},
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: typography.size.sm,
  },
  retryText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: typography.size.sm,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  feedCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  userMeta: {
    marginLeft: 10,
  },
  userName: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
  timestamp: {
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  cardContent: {
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIcon: {
    fontSize: typography.size.base,
    marginRight: 6,
  },
  typeLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailText: {
    fontSize: typography.size.sm,
    marginTop: 6,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: typography.size.lg,
    marginRight: 6,
  },
  actionText: {
    fontSize: typography.size.sm,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
