/**
 * 피드 시스템 훅
 * 피드 조회 및 무한 스크롤 지원
 */

import { useAuth, useUser } from '@clerk/clerk-expo';
import { useCallback, useEffect, useState } from 'react';

import type { FeedItem, FeedTab } from './types';
import { feedLogger } from '../utils/logger';

import { getFriendsFeed, getMyFeed, getAllFeed, toggleLike } from './index';

const PAGE_SIZE = 20;

interface UseFeedResult {
  items: FeedItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  activeTab: FeedTab;
  setActiveTab: (tab: FeedTab) => void;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  handleLike: (itemId: string) => Promise<void>;
}

/**
 * 피드 훅
 * 탭별 피드 조회 + 무한 스크롤
 */
export function useFeed(): UseFeedResult {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>('friends');
  const [offset, setOffset] = useState(0);

  // 피드 조회
  const fetchFeed = useCallback(
    async (tab: FeedTab, reset: boolean = false) => {
      if (!user?.id) return;

      const currentOffset = reset ? 0 : offset;

      if (reset) {
        setIsLoading(true);
        setOffset(0);
      } else {
        setIsLoadingMore(true);
      }

      setError(null);

      try {
        const token = await getToken();
        if (!token) throw new Error('로그인이 필요합니다.');
        let data: FeedItem[] = [];

        switch (tab) {
          case 'my':
            data = await getMyFeed(token, user.id, PAGE_SIZE, currentOffset);
            break;
          case 'friends':
            data = await getFriendsFeed(token, user.id, PAGE_SIZE, currentOffset);
            break;
          case 'all':
            data = await getAllFeed(token, PAGE_SIZE, currentOffset);
            break;
        }

        if (reset) {
          setItems(data);
        } else {
          setItems((prev) => [...prev, ...data]);
        }

        setHasMore(data.length === PAGE_SIZE);
        setOffset(currentOffset + data.length);
      } catch (err) {
        feedLogger.error('useFeed error:', err);
        setError('피드를 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [user?.id, getToken, offset]
  );

  // 탭 변경 시 새로 조회
  useEffect(() => {
    fetchFeed(activeTab, true);
  }, [activeTab, user?.id, fetchFeed]);

  // 탭 변경 핸들러
  const handleTabChange = useCallback(
    (tab: FeedTab) => {
      if (tab !== activeTab) {
        setActiveTab(tab);
      }
    },
    [activeTab]
  );

  // 새로고침
  const refetch = useCallback(async () => {
    await fetchFeed(activeTab, true);
  }, [fetchFeed, activeTab]);

  // 더 불러오기
  const loadMore = useCallback(async () => {
    if (!isLoadingMore && hasMore) {
      await fetchFeed(activeTab, false);
    }
  }, [fetchFeed, activeTab, isLoadingMore, hasMore]);

  // 좋아요 핸들러
  const handleLike = useCallback(
    async (itemId: string) => {
      if (!user?.id) return;

      // 낙관적 업데이트
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                isLiked: !item.isLiked,
                likes: item.isLiked ? item.likes - 1 : item.likes + 1,
              }
            : item
        )
      );

      // 서버 요청
      let result = { success: false, isLiked: false };
      try {
        const token = await getToken();
        if (token) result = await toggleLike(token, user.id, itemId);
      } catch (err) {
        feedLogger.error('피드 좋아요 저장 실패:', err);
      }

      if (!result.success) {
        // 실패 시 롤백
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  isLiked: !item.isLiked,
                  likes: item.isLiked ? item.likes - 1 : item.likes + 1,
                }
              : item
          )
        );
      }
    },
    [user?.id, getToken]
  );

  return {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    activeTab,
    setActiveTab: handleTabChange,
    refetch,
    loadMore,
    handleLike,
  };
}
