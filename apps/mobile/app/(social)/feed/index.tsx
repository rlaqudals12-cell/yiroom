/**
 * 피드 페이지
 * 소셜 타임라인 (내 피드 / 친구 피드 / 전체)
 */

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

import { feedTypeConfig, formatRelativeTime, type FeedItem, type FeedTab } from '../../../lib/feed';
import { useFeed } from '../../../lib/feed/useFeed';
import { shareLogger } from '../../../lib/utils/logger';

const TABS: { id: FeedTab; label: string }[] = [
  { id: 'my', label: '내 피드' },
  { id: 'friends', label: '친구 피드' },
  { id: 'all', label: '전체' },
];

export default function FeedScreen() {
  const { colors, module: moduleColors } = useTheme();
  const router = useRouter();

  const {
    items,
    isLoading,
    isLoadingMore,
    activeTab,
    setActiveTab,
    refetch,
    loadMore,
    handleLike,
  } = useFeed();

  // 공유 핸들러
  const handleShare = useCallback(async (item: FeedItem) => {
    Haptics.selectionAsync();
    try {
      await Share.share({
        message: `${item.userName}님: ${item.content}${item.detail ? '\n' + item.detail : ''}`,
      });
    } catch (error) {
      shareLogger.error('Share error:', error);
    }
  }, []);

  // 좋아요 핸들러
  const onLike = useCallback(
    async (itemId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await handleLike(itemId);
    },
    [handleLike]
  );

  // 탭 변경 핸들러
  const onTabChange = useCallback(
    (tab: FeedTab) => {
      Haptics.selectionAsync();
      setActiveTab(tab);
    },
    [setActiveTab]
  );

  // 피드 카드 렌더링
  const renderFeedItem = useCallback(
    ({ item }: { item: FeedItem }) => {
      const config = feedTypeConfig[item.type];

      return (
        <View style={[styles.feedCard, { backgroundColor: colors.card }]}>
          {/* 사용자 정보 */}
          <View style={styles.cardHeader}>
            <View style={styles.userInfo}>
              {item.userAvatar ? (
                <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.avatarText, { color: colors.mutedForeground }]}>
                    {item.userName.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.userMeta}>
                <Text style={[styles.userName, { color: colors.foreground }]}>{item.userName}</Text>
                <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                  {formatRelativeTime(item.createdAt)}
                </Text>
              </View>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: config.color + '20' }]}>
              <Text style={styles.typeBadgeEmoji}>{config.emoji}</Text>
            </View>
          </View>

          {/* 콘텐츠 */}
          <View style={styles.cardContent}>
            <Text style={[styles.contentText, { color: colors.foreground }]}>{item.content}</Text>
            {item.detail && (
              <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                {item.detail}
              </Text>
            )}
          </View>

          {/* 배지 특별 표시 */}
          {item.type === 'badge' && (
            <View style={styles.badgeHighlight}>
              <Text style={styles.badgeHighlightEmoji}>🏆</Text>
              <Text style={styles.badgeHighlightText}>배지 획득!</Text>
            </View>
          )}

          {/* 인터랙션 버튼 */}
          <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.actionButton} onPress={() => onLike(item.id)}>
              <Text style={item.isLiked ? styles.likeIconActive : styles.likeIcon}>
                {item.isLiked ? '❤️' : '🤍'}
              </Text>
              <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>
                {item.likes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>
                {item.comments}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={() => handleShare(item)}
            >
              <Text style={styles.actionIcon}>📤</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [colors, onLike, handleShare]
  );

  // 리스트 푸터 (로딩 표시)
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={moduleColors.body.dark} />
      </View>
    );
  }, [isLoadingMore]);

  // 빈 상태 렌더링
  const renderEmpty = useCallback(() => {
    if (isLoading) return null;

    const emptyMessages: Record<FeedTab, { title: string; subtitle: string }> = {
      my: {
        title: '아직 내 활동이 없어요',
        subtitle: '운동이나 영양 기록을 시작해보세요',
      },
      friends: {
        title: '친구 활동이 없어요',
        subtitle: '친구를 추가하면 활동을 볼 수 있어요',
      },
      all: {
        title: '활동이 없어요',
        subtitle: '첫 번째 활동을 시작해보세요',
      },
    };

    const message = emptyMessages[activeTab];

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>👥</Text>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{message.title}</Text>
        <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
          {message.subtitle}
        </Text>
        {activeTab === 'friends' && (
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/(social)/friends/search');
            }}
          >
            <Text style={styles.emptyButtonText}>친구 찾기</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [isLoading, activeTab, colors, router]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={moduleColors.body.dark} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            피드 불러오는 중...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      {/* 탭 바 */}
      <View style={[styles.tabBar, { backgroundColor: colors.background }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
            onPress={() => onTabChange(tab.id)}
          >
            <Text
              style={[styles.tabButtonText, activeTab === tab.id && styles.tabButtonTextActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 피드 리스트 */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderFeedItem}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={refetch}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
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
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e5e5e5',
  },
  tabButtonActive: {
    backgroundColor: '#8b5cf6',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  feedCard: {
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    fontSize: 18,
    fontWeight: '600',
  },
  userMeta: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    marginTop: 2,
  },
  typeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadgeEmoji: {
    fontSize: 18,
  },
  cardContent: {
    marginBottom: 12,
  },
  contentText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  detailText: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  badgeHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  badgeHighlightEmoji: {
    fontSize: 24,
  },
  badgeHighlightText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b45309',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    gap: 4,
  },
  shareButton: {
    marginLeft: 'auto',
    marginRight: 0,
  },
  actionIcon: {
    fontSize: 18,
  },
  likeIcon: {
    fontSize: 18,
  },
  likeIconActive: {
    fontSize: 18,
  },
  actionCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
