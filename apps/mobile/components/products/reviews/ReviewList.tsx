/**
 * 리뷰 목록 컴포넌트
 * @description 정렬/필터 + 무한 스크롤 리뷰 목록
 */

import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { useAppPreferencesStore } from '@/lib/stores';

import { ReviewCard, ReviewData } from './ReviewCard';

export type ReviewSortBy = 'recent' | 'helpful' | 'rating_high' | 'rating_low';

interface ReviewListProps {
  /** 리뷰 목록 */
  reviews: ReviewData[];
  /** 현재 사용자 ID */
  currentUserId?: string;
  /** 정렬 옵션 */
  sortBy: ReviewSortBy;
  /** 정렬 변경 핸들러 */
  onSortChange: (sort: ReviewSortBy) => void;
  /** 더 불러오기 가능 여부 */
  hasMore: boolean;
  /** 더 불러오기 핸들러 */
  onLoadMore: () => void;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 도움됨 토글 핸들러 */
  onHelpful?: (reviewId: string, isHelpful: boolean) => Promise<void>;
  /** 수정 핸들러 */
  onEdit?: (review: ReviewData) => void;
  /** 삭제 핸들러 */
  onDelete?: (reviewId: string) => void;
}

const SORT_OPTIONS: { value: ReviewSortBy; label: string }[] = [
  { value: 'recent', label: '최신순' },
  { value: 'helpful', label: '도움순' },
  { value: 'rating_high', label: '평점 높은순' },
  { value: 'rating_low', label: '평점 낮은순' },
];

export function ReviewList({
  reviews,
  currentUserId,
  sortBy,
  onSortChange,
  hasMore,
  onLoadMore,
  isLoading,
  onHelpful,
  onEdit,
  onDelete,
}: ReviewListProps) {
  const hapticEnabled = useAppPreferencesStore((state) => state.hapticEnabled);

  const handleSortPress = useCallback(
    (sort: ReviewSortBy) => {
      if (sort === sortBy) return;

      if (hapticEnabled) {
        Haptics.selectionAsync();
      }
      onSortChange(sort);
    },
    [sortBy, onSortChange, hapticEnabled]
  );

  const renderSortOption = (option: { value: ReviewSortBy; label: string }) => {
    const isSelected = sortBy === option.value;

    return (
      <Pressable
        key={option.value}
        onPress={() => handleSortPress(option.value)}
        style={[styles.sortButton, isSelected && styles.sortButtonSelected]}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <Text style={[styles.sortText, isSelected && styles.sortTextSelected]}>
          {option.label}
        </Text>
      </Pressable>
    );
  };

  const renderReview = useCallback(
    ({ item }: { item: ReviewData }) => (
      <ReviewCard
        review={item}
        currentUserId={currentUserId}
        onHelpfulToggle={onHelpful}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ),
    [currentUserId, onHelpful, onEdit, onDelete]
  );

  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <Pressable
        onPress={onLoadMore}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.loadMoreButton,
          pressed && styles.loadMoreButtonPressed,
        ]}
        accessibilityRole="button"
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#6B7280" />
        ) : (
          <Text style={styles.loadMoreText}>더 보기</Text>
        )}
      </Pressable>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#6B7280" />
          <Text style={styles.emptyText}>리뷰를 불러오는 중...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyTitle}>아직 리뷰가 없어요</Text>
        <Text style={styles.emptyText}>첫 번째 리뷰를 작성해보세요!</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 정렬 옵션 */}
      <View style={styles.sortContainer}>
        {SORT_OPTIONS.map(renderSortOption)}
      </View>

      {/* 리뷰 목록 */}
      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={
          reviews.length === 0 ? styles.emptyList : undefined
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} // 부모 ScrollView 사용
      />
    </View>
  );
}

/**
 * 리뷰 정렬 함수
 */
export function sortReviews(
  reviews: ReviewData[],
  sortBy: ReviewSortBy
): ReviewData[] {
  return [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'helpful':
        return b.helpfulCount - a.helpfulCount;
      case 'rating_high':
        return b.rating - a.rating;
      case 'rating_low':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sortContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  sortButtonSelected: {
    backgroundColor: '#1F2937',
  },
  sortText: {
    fontSize: 13,
    color: '#6B7280',
  },
  sortTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  loadMoreButtonPressed: {
    backgroundColor: '#E5E7EB',
  },
  loadMoreText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
});
