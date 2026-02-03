/**
 * 피드 상세 페이지 (댓글 기능 포함)
 */

import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
      console.error('[Feed Detail] Fetch error:', error);
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
      console.error('[Feed Detail] Like error:', error);
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
      setFeedItem((prev) =>
        prev ? { ...prev, comments: prev.comments + 1 } : null
      );
      setCommentText('');
    } catch (error) {
      console.error('[Feed Detail] Comment error:', error);
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
    <View style={[styles.commentItem, isDark && styles.commentItemDark]}>
      <View style={[styles.commentAvatar, isDark && styles.commentAvatarDark]}>
        <Text style={styles.commentAvatarText}>
          {item.userName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentUserName, isDark && styles.textLight]}>
            {item.userName}
          </Text>
          <Text style={[styles.commentTime, isDark && styles.textMuted]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        <Text style={[styles.commentText, isDark && styles.textLight]}>
          {item.content}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!feedItem) {
    return (
      <View style={[styles.errorContainer, isDark && styles.containerDark]}>
        <Text style={[styles.errorText, isDark && styles.textLight]}>
          게시물을 찾을 수 없습니다.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
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
            <View
              style={[styles.postContainer, isDark && styles.postContainerDark]}
            >
              {/* 게시물 헤더 */}
              <View style={styles.postHeader}>
                <View style={styles.userInfo}>
                  <View style={[styles.avatar, isDark && styles.avatarDark]}>
                    <Text style={styles.avatarText}>
                      {feedItem.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userMeta}>
                    <Text style={[styles.userName, isDark && styles.textLight]}>
                      {feedItem.userName}
                    </Text>
                    <Text
                      style={[styles.timestamp, isDark && styles.textMuted]}
                    >
                      {formatTime(feedItem.createdAt)}
                    </Text>
                  </View>
                </View>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>Lv.{feedItem.userLevel}</Text>
                </View>
              </View>

              {/* 게시물 컨텐츠 */}
              <View style={styles.postContent}>
                <View style={styles.typeRow}>
                  <Text style={styles.typeIcon}>
                    {FEED_TYPE_ICONS[feedItem.type] || '📝'}
                  </Text>
                  <Text style={[styles.typeLabel, isDark && styles.textMuted]}>
                    {feedItem.type}
                  </Text>
                </View>
                <Text style={[styles.contentText, isDark && styles.textLight]}>
                  {feedItem.content}
                </Text>
                {feedItem.detail && (
                  <Text style={[styles.detailText, isDark && styles.textMuted]}>
                    {feedItem.detail}
                  </Text>
                )}
              </View>

              {/* 액션 버튼 */}
              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleLike}
                >
                  <Text style={styles.actionIcon}>
                    {feedItem.isLiked ? '❤️' : '🤍'}
                  </Text>
                  <Text style={[styles.actionText, isDark && styles.textMuted]}>
                    좋아요 {feedItem.likes}
                  </Text>
                </TouchableOpacity>
                <View style={styles.actionButton}>
                  <Text style={styles.actionIcon}>💬</Text>
                  <Text style={[styles.actionText, isDark && styles.textMuted]}>
                    댓글 {comments.length}
                  </Text>
                </View>
              </View>

              {/* 댓글 헤더 */}
              <View style={styles.commentsHeader}>
                <Text
                  style={[styles.commentsTitle, isDark && styles.textLight]}
                >
                  댓글
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <Text style={[styles.emptyText, isDark && styles.textMuted]}>
                첫 번째 댓글을 작성해보세요!
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* 댓글 입력 */}
        <View
          style={[styles.inputContainer, isDark && styles.inputContainerDark]}
        >
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="댓글을 작성하세요..."
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!commentText.trim() || isSubmitting) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>전송</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fc',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fc',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    paddingBottom: 20,
  },
  postContainer: {
    backgroundColor: '#fff',
    marginBottom: 8,
    padding: 16,
  },
  postContainerDark: {
    backgroundColor: '#1a1a1a',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDark: {
    backgroundColor: '#333',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  userMeta: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  timestamp: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  postContent: {
    marginBottom: 16,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  typeLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  contentText: {
    fontSize: 16,
    color: '#111',
    lineHeight: 24,
  },
  detailText: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
    lineHeight: 22,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
    gap: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
  commentsHeader: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  emptyComments: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  commentItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentItemDark: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#333',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarDark: {
    backgroundColor: '#333',
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    gap: 10,
  },
  inputContainerDark: {
    backgroundColor: '#1a1a1a',
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#111',
  },
  inputDark: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  sendButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
