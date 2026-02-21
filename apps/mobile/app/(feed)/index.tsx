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
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

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
  const { colors, isDark } = useTheme();
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
      <TouchableOpacity
        style={[styles.feedCard, isDark && styles.feedCardDark]}
        onPress={() => handleItemPress(item.id)}
        activeOpacity={0.7}
      >
        {/* 헤더 */}
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View
              style={[
                styles.avatar,
                isDark && styles.avatarDark,
                item.userAvatar ? {} : { backgroundColor: isDark ? '#333' : '#e5e5e5' },
              ]}
            >
              <Text style={styles.avatarText}>{item.userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userMeta}>
              <Text style={[styles.userName, isDark && styles.textLight]}>{item.userName}</Text>
              <Text style={[styles.timestamp, isDark && styles.textMuted]}>
                {formatTime(item.createdAt)}
              </Text>
            </View>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv.{item.userLevel}</Text>
          </View>
        </View>

        {/* 컨텐츠 */}
        <View style={styles.cardContent}>
          <View style={styles.typeRow}>
            <Text style={styles.typeIcon}>{FEED_TYPE_ICONS[item.type] || '📝'}</Text>
            <Text style={[styles.typeLabel, isDark && styles.textMuted]}>
              {FEED_TYPE_LABELS[item.type] || item.type}
            </Text>
          </View>
          <Text style={[styles.contentText, isDark && styles.textLight]}>{item.content}</Text>
          {item.detail && (
            <Text style={[styles.detailText, isDark && styles.textMuted]} numberOfLines={2}>
              {item.detail}
            </Text>
          )}
        </View>

        {/* 액션 */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleLikePress(item.id)}>
            <Text style={styles.actionIcon}>{item.isLiked ? '❤️' : '🤍'}</Text>
            <Text style={[styles.actionText, isDark && styles.textMuted]}>{item.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleItemPress(item.id)}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={[styles.actionText, isDark && styles.textMuted]}>{item.comments}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={[styles.emptyTitle, isDark && styles.textLight]}>아직 피드가 없어요</Text>
        <Text style={[styles.emptySubtitle, isDark && styles.textMuted]}>
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
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['bottom']}>
      {/* 탭 */}
      <View style={[styles.tabContainer, isDark && styles.tabContainerDark]}>
        {(['my', 'friends', 'all'] as FeedTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => handleTabChange(tab)}
          >
            <Text
              style={[
                styles.tabText,
                isDark && styles.textMuted,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {TAB_LABELS[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 에러 */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refetch}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 로딩 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={[styles.loadingText, isDark && styles.textMuted]}>
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
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={isDark ? '#6366f1' : '#6366f1'}
            />
          }
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingHorizontal: 16,
  },
  tabContainerDark: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#333',
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fee2e2',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  retryText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  feedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  feedCardDark: {
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDark: {
    backgroundColor: '#333',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  userMeta: {
    marginLeft: 10,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
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
    fontSize: 16,
    marginRight: 6,
  },
  typeLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  contentText: {
    fontSize: 15,
    color: '#111',
    lineHeight: 22,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
