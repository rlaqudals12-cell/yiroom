/**
 * 피드 상세 페이지 (댓글 기능 포함)
 */

import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';

// eslint-disable-next-line import/order -- monitoring import
import { captureError } from '../../lib/monitoring/sentry';
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/ui';
import { useTheme, typography, radii, spacing } from '@/lib/theme';

import type { FeedItem } from '../../lib/feed/types';
import { useClerkSupabaseClient } from '../../lib/supabase';

// 피드 타입별 아이콘
const FEED_TYPE_ICONS: Record<string, string> = {
  badge: '🏆',
  challenge: '🎯',
  analysis: '🔬',
  workout: '💪',
  nutrition: '🥗',
};

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  content: string;
  createdAt: Date;
}

export default function FeedDetailScreen() {
  const { colors, brand, typography, spacing, radii} = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [feedItem, setFeedItem] = useState<FeedItem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 피드 상세 조회
  const fetchFeedItem = useCallback(async () => {
    if (!id || !supabase) return;

    setIsLoading(true);

    try {
      // 피드 아이템 조회
      const { data: feedData, error: feedError } = await supabase
        .from('feed_items')
        .select(
          `
          *,
          user:users!user_id(id, display_name, avatar_url, level)
        `
        )
        .eq('id', id)
        .single();

      if (feedError) throw feedError;

      if (feedData) {
        const userData = feedData.user as {
          id: string;
          display_name: string;
          avatar_url: string | null;
          level: number;
        };

        setFeedItem({
          id: feedData.id,
          userId: feedData.user_id,
          userName: userData?.display_name || '사용자',
          userAvatar: userData?.avatar_url || null,
          userLevel: userData?.level || 1,
          type: feedData.type,
          content: feedData.content,
          detail: feedData.detail,
          createdAt: new Date(feedData.created_at),
          likes: feedData.likes_count || 0,
          comments: feedData.comments_count || 0,
          isLiked: false, // TODO: 실제 좋아요 상태 조회
        });
      }

      // 댓글 조회
      const { data: commentsData, error: commentsError } = await supabase
        .from('feed_comments')
        .select(
          `
          *,
          user:users!user_id(id, display_name, avatar_url)
        `
        )
        .eq('feed_item_id', id)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      if (commentsData) {
        setComments(
          commentsData.map((c) => {
            const cUser = c.user as {
              id: string;
              display_name: string;
              avatar_url: string | null;
            };
            return {
              id: c.id,
              userId: c.user_id,
              userName: cUser?.display_name || '사용자',
              userAvatar: cUser?.avatar_url || null,
              content: c.content,
              createdAt: new Date(c.created_at),
            };
          })
        );
      }
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        screen: 'feed-detail',
        tags: { module: 'feed', action: 'fetch' },
      });
      Alert.alert('오류', '게시물을 불러올 수 없습니다.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id, supabase, router]);

  useEffect(() => {
    fetchFeedItem();
  }, [fetchFeedItem]);

  // 좋아요 토글
  const handleLike = async () => {
    if (!feedItem || !user?.id || !supabase) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // 낙관적 업데이트
    setFeedItem((prev) =>
      prev
        ? {
            ...prev,
            isLiked: !prev.isLiked,
            likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
          }
        : null
    );

    try {
      if (feedItem.isLiked) {
        await supabase
          .from('feed_likes')
          .delete()
          .eq('feed_item_id', feedItem.id)
          .eq('user_id', user.id);
      } else {
        await supabase.from('feed_likes').insert({
          feed_item_id: feedItem.id,
          user_id: user.id,
        });
      }
    } catch (error) {
      // 롤백
      setFeedItem((prev) =>
        prev
          ? {
              ...prev,
              isLiked: !prev.isLiked,
              likes: prev.isLiked ? prev.likes + 1 : prev.likes - 1,
            }
          : null
      );
      captureError(error instanceof Error ? error : new Error(String(error)), {
        screen: 'feed-detail',
        tags: { module: 'feed', action: 'like' },
      });
    }
  };

  // 댓글 작성
  const handleSubmitComment = async () => {
    if (!commentText.trim() || !user?.id || !supabase || !feedItem) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('feed_comments')
        .insert({
          feed_item_id: feedItem.id,
          user_id: user.id,
          content: commentText.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // 새 댓글 추가
      const newComment: Comment = {
        id: data.id,
        userId: user.id,
        userName: user.firstName || '나',
        userAvatar: user.imageUrl || null,
        content: data.content,
        createdAt: new Date(data.created_at),
      };

      setComments((prev) => [...prev, newComment]);
      setFeedItem((prev) => (prev ? { ...prev, comments: prev.comments + 1 } : null));
      setCommentText('');
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        screen: 'feed-detail',
        tags: { module: 'feed', action: 'comment' },
      });
      Alert.alert('오류', '댓글을 작성할 수 없습니다.');
    } finally {
      setIsSubmitting(false);
    }
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

  const renderComment = ({ item }: { item: Comment }) => (
    <View
      style={[
        styles.commentItem,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
      ]}
    >
      <View style={[styles.commentAvatar, { backgroundColor: colors.muted }]}>
        <Text style={[styles.commentAvatarText, { color: colors.mutedForeground }]}>
          {item.userName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentUserName, { color: colors.foreground }]}>
            {item.userName}
          </Text>
          <Text style={[styles.commentTime, { color: colors.mutedForeground }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        <Text style={[styles.commentText, { color: colors.foreground }]}>{item.content}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!feedItem) {
    return (
      <ScreenContainer scrollable={false} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.foreground }]}>
            게시물을 찾을 수 없습니다.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      testID="feed-detail-screen"
      scrollable={false}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          ListHeaderComponent={
            <View style={[styles.postContainer, { backgroundColor: colors.card }]}>
              {/* 게시물 헤더 */}
              <View style={styles.postHeader}>
                <View style={styles.userInfo}>
                  <View style={[styles.avatar, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.avatarText, { color: colors.mutedForeground }]}>
                      {feedItem.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userMeta}>
                    <Text style={[styles.userName, { color: colors.foreground }]}>
                      {feedItem.userName}
                    </Text>
                    <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
                      {formatTime(feedItem.createdAt)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.levelBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.levelText, { color: brand.primary }]}>Lv.{feedItem.userLevel}</Text>
                </View>
              </View>

              {/* 게시물 컨텐츠 */}
              <View style={styles.postContent}>
                <View style={styles.typeRow}>
                  <Text style={styles.typeIcon}>{FEED_TYPE_ICONS[feedItem.type] || '📝'}</Text>
                  <Text style={[styles.typeLabel, { color: colors.mutedForeground }]}>
                    {feedItem.type}
                  </Text>
                </View>
                <Text style={[styles.contentText, { color: colors.foreground }]}>
                  {feedItem.content}
                </Text>
                {feedItem.detail && (
                  <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                    {feedItem.detail}
                  </Text>
                )}
              </View>

              {/* 액션 버튼 */}
              <View style={[styles.postActions, { borderTopColor: colors.border }]}>
                <Pressable style={styles.actionButton} onPress={handleLike}>
                  <Text style={styles.actionIcon}>{feedItem.isLiked ? '❤️' : '🤍'}</Text>
                  <Text style={[styles.actionText, { color: colors.mutedForeground }]}>
                    좋아요 {feedItem.likes}
                  </Text>
                </Pressable>
                <View style={styles.actionButton}>
                  <Text style={styles.actionIcon}>💬</Text>
                  <Text style={[styles.actionText, { color: colors.mutedForeground }]}>
                    댓글 {comments.length}
                  </Text>
                </View>
              </View>

              {/* 댓글 헤더 */}
              <View style={[styles.commentsHeader, { borderTopColor: colors.border }]}>
                <Text style={[styles.commentsTitle, { color: colors.foreground }]}>댓글</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                첫 번째 댓글을 작성해보세요!
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* 댓글 입력 */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.card, borderTopColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
            placeholder="댓글을 작성하세요..."
            placeholderTextColor={colors.mutedForeground}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[
              styles.sendButton,
              { backgroundColor: brand.primary },
              (!commentText.trim() || isSubmitting) && { backgroundColor: colors.border },
            ]}
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.overlayForeground} />
            ) : (
              <Text style={[styles.sendButtonText, { color: brand.primaryForeground }]}>전송</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: typography.size.base,
  },
  listContent: {
    paddingBottom: spacing.mlg,
  },
  postContainer: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  userMeta: {
    marginLeft: spacing.smx,
  },
  userName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  timestamp: {
    fontSize: 13,
    marginTop: spacing.xxs,
  },
  levelBadge: {
    paddingHorizontal: spacing.smx,
    paddingVertical: 6,
    borderRadius: radii.xlg,
  },
  levelText: {
    fontSize: 13,
    fontWeight: typography.weight.semibold,
  },
  postContent: {
    marginBottom: spacing.md,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.smd,
  },
  typeIcon: {
    fontSize: typography.size.lg,
    marginRight: spacing.sm,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: typography.weight.medium,
  },
  contentText: {
    fontSize: typography.size.base,
    lineHeight: 24,
  },
  detailText: {
    fontSize: 15,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: typography.size.xl,
    marginRight: spacing.sm,
  },
  actionText: {
    fontSize: typography.size.sm,
  },
  commentsHeader: {
    marginTop: spacing.mlg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  commentsTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  emptyComments: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.size.sm,
  },
  commentItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  commentContent: {
    flex: 1,
    marginLeft: spacing.smx,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  commentUserName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  commentTime: {
    fontSize: typography.size.xs,
  },
  commentText: {
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.smx,
    borderTopWidth: 1,
    gap: spacing.smd,
  },
  input: {
    flex: 1,
    borderRadius: radii.circle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smd,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: 18,
    paddingVertical: spacing.smd,
    borderRadius: radii.circle,
    minWidth: 60,
    alignItems: 'center',
  },
  sendButtonDisabled: {},
  sendButtonText: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
});
