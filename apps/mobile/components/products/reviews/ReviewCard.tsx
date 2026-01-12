/**
 * 리뷰 카드 컴포넌트
 * @description 개별 리뷰 표시 및 상호작용
 */

import * as Haptics from 'expo-haptics';
import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Image, Alert } from 'react-native';

import { useAppPreferencesStore } from '@/lib/stores';

import { StarRating, getRatingColor } from './StarRating';

export interface ReviewData {
  id: string;
  userId: string;
  userName: string;
  userImageUrl?: string;
  rating: number;
  title?: string;
  content?: string;
  helpfulCount: number;
  isHelpful?: boolean;
  verifiedPurchase?: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface ReviewCardProps {
  /** 리뷰 데이터 */
  review: ReviewData;
  /** 현재 사용자 ID (본인 리뷰 판별) */
  currentUserId?: string;
  /** 도움됨 토글 핸들러 */
  onHelpfulToggle?: (reviewId: string, isHelpful: boolean) => Promise<void>;
  /** 수정 핸들러 */
  onEdit?: (review: ReviewData) => void;
  /** 삭제 핸들러 */
  onDelete?: (reviewId: string) => void;
}

export function ReviewCard({
  review,
  currentUserId,
  onHelpfulToggle,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  const hapticEnabled = useAppPreferencesStore((state) => state.hapticEnabled);
  const [isHelpful, setIsHelpful] = useState(review.isHelpful || false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [isLoading, setIsLoading] = useState(false);

  const isOwner = currentUserId === review.userId;

  // 도움됨 토글
  const handleHelpfulToggle = useCallback(async () => {
    if (!onHelpfulToggle || isLoading) return;

    // 낙관적 업데이트
    const newIsHelpful = !isHelpful;
    setIsHelpful(newIsHelpful);
    setHelpfulCount((prev) => prev + (newIsHelpful ? 1 : -1));

    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsLoading(true);
    try {
      await onHelpfulToggle(review.id, newIsHelpful);
    } catch {
      // 롤백
      setIsHelpful(!newIsHelpful);
      setHelpfulCount((prev) => prev + (newIsHelpful ? -1 : 1));
    } finally {
      setIsLoading(false);
    }
  }, [onHelpfulToggle, isHelpful, isLoading, hapticEnabled, review.id]);

  // 더보기 메뉴
  const handleMorePress = useCallback(() => {
    if (!isOwner) return;

    Alert.alert('리뷰 관리', '선택하세요', [
      {
        text: '수정',
        onPress: () => onEdit?.(review),
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          Alert.alert('리뷰 삭제', '정말 삭제하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            {
              text: '삭제',
              style: 'destructive',
              onPress: () => onDelete?.(review.id),
            },
          ]);
        },
      },
      { text: '취소', style: 'cancel' },
    ]);
  }, [isOwner, onEdit, onDelete, review]);

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
    return `${Math.floor(diffDays / 365)}년 전`;
  };

  return (
    <View style={styles.container} accessibilityRole="summary">
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {review.userImageUrl ? (
            <Image
              source={{ uri: review.userImageUrl }}
              style={styles.avatar}
              accessibilityLabel={`${review.userName} 프로필 이미지`}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{review.userName.charAt(0)}</Text>
            </View>
          )}

          <View style={styles.userMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{review.userName}</Text>
              {review.verifiedPurchase && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>구매인증</Text>
                </View>
              )}
            </View>
            <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
          </View>
        </View>

        {isOwner && (
          <Pressable
            onPress={handleMorePress}
            style={styles.moreButton}
            accessibilityRole="button"
            accessibilityLabel="더보기"
          >
            <Text style={styles.moreIcon}>⋮</Text>
          </Pressable>
        )}
      </View>

      {/* 별점 */}
      <View style={styles.ratingRow}>
        <StarRating rating={review.rating} size="small" />
        <Text
          style={[styles.ratingText, { color: getRatingColor(review.rating) }]}
        >
          {review.rating.toFixed(1)}
        </Text>
      </View>

      {/* 제목 */}
      {review.title && <Text style={styles.title}>{review.title}</Text>}

      {/* 내용 */}
      {review.content && <Text style={styles.content}>{review.content}</Text>}

      {/* 액션 */}
      <View style={styles.actions}>
        <Pressable
          onPress={handleHelpfulToggle}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.helpfulButton,
            isHelpful && styles.helpfulButtonActive,
            pressed && styles.helpfulButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`도움됨 ${helpfulCount}명`}
          accessibilityState={{ selected: isHelpful }}
        >
          <Text
            style={[styles.helpfulIcon, isHelpful && styles.helpfulIconActive]}
          >
            👍
          </Text>
          <Text
            style={[styles.helpfulText, isHelpful && styles.helpfulTextActive]}
          >
            도움됨 {helpfulCount > 0 && `(${helpfulCount})`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  userMeta: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  verifiedBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  verifiedText: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  moreIcon: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  content: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  helpfulButtonActive: {
    backgroundColor: '#DBEAFE',
  },
  helpfulButtonPressed: {
    opacity: 0.7,
  },
  helpfulIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  helpfulIconActive: {
    opacity: 1,
  },
  helpfulText: {
    fontSize: 13,
    color: '#6B7280',
  },
  helpfulTextActive: {
    color: '#2563EB',
    fontWeight: '500',
  },
});
