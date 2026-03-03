/**
 * 피드 댓글 화면
 * 특정 피드 아이템의 댓글 목록 + 댓글 작성
 */
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ScreenContainer } from '@/components/ui';

import { useTheme, typography, spacing, radii } from '@/lib/theme';

import { useClerkSupabaseClient } from '../../../lib/supabase';
import { formatRelativeTime } from '../../../lib/feed';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

export default function CommentsScreen(): React.JSX.Element {
  const { colors, brand, spacing, radii, typography } = useTheme();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSending, setIsSending] = useState(false);

  // 댓글 조회 — activity의 metadata.comments_list에 저장
  const fetchComments = useCallback(async () => {
    if (!activityId) return;

    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('user_activities')
        .select('metadata')
        .eq('id', activityId)
        .maybeSingle();

      const commentsList = data?.metadata?.comments_list ?? [];
      setComments(
        commentsList.map((c: Record<string, unknown>) => ({
          id: String(c.id ?? ''),
          userId: String(c.user_id ?? ''),
          userName: String(c.user_name ?? '사용자'),
          content: String(c.content ?? ''),
          createdAt: new Date(String(c.created_at ?? new Date().toISOString())),
        }))
      );
    } catch {
      // 조용히 실패
    } finally {
      setIsLoading(false);
    }
  }, [activityId, supabase]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // 댓글 작성
  const handleSend = async (): Promise<void> => {
    if (!newComment.trim() || !user?.id || !activityId || isSending) return;

    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // 현재 metadata 조회
      const { data: activity } = await supabase
        .from('user_activities')
        .select('metadata')
        .eq('id', activityId)
        .maybeSingle();

      const currentMeta = activity?.metadata ?? {};
      const currentCommentsList = currentMeta.comments_list ?? [];
      const currentCount = currentMeta.comments ?? 0;

      const newEntry = {
        id: `comment_${Date.now()}`,
        user_id: user.id,
        user_name: user.firstName || '나',
        content: newComment.trim(),
        created_at: new Date().toISOString(),
      };

      // metadata 업데이트
      await supabase
        .from('user_activities')
        .update({
          metadata: {
            ...currentMeta,
            comments: currentCount + 1,
            comments_list: [...currentCommentsList, newEntry],
          },
        })
        .eq('id', activityId);

      // 낙관적 업데이트
      setComments((prev) => [
        ...prev,
        {
          id: newEntry.id,
          userId: user.id,
          userName: newEntry.user_name,
          content: newEntry.content,
          createdAt: new Date(),
        },
      ]);
      setNewComment('');
    } catch {
      // 조용히 실패
    } finally {
      setIsSending(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }): React.JSX.Element => (
    <View style={[styles.commentCard, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
      <View style={styles.commentHeader}>
        <View style={[styles.commentAvatar, { backgroundColor: colors.muted }]}>
          <Text style={[styles.commentAvatarText, { color: colors.mutedForeground }]}>
            {item.userName.charAt(0)}
          </Text>
        </View>
        <Text style={[styles.commentUser, { color: colors.foreground, fontWeight: typography.weight.semibold, fontSize: typography.size.sm }]}>
          {item.userName}
        </Text>
        <Text style={[styles.commentTime, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
          {formatRelativeTime(item.createdAt)}
        </Text>
      </View>
      <Text style={[styles.commentContent, { color: colors.foreground, fontSize: typography.size.sm }]}>
        {item.content}
      </Text>
    </View>
  );

  return (
    <ScreenContainer scrollable={false} contentPadding={0} testID="comments-screen" edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={brand.primary} />
          </View>
        ) : comments.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 40, marginBottom: spacing.sm }}>💬</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontSize: typography.size.sm }]}>
              아직 댓글이 없어요. 첫 댓글을 남겨보세요!
            </Text>
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            contentContainerStyle={{ padding: spacing.md, gap: spacing.smx }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* 댓글 입력 */}
        <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.commentInput,
              {
                backgroundColor: colors.muted,
                color: colors.foreground,
                borderRadius: radii.full,
                fontSize: typography.size.sm,
              },
            ]}
            placeholder="댓글을 입력하세요..."
            placeholderTextColor={colors.mutedForeground}
            value={newComment}
            onChangeText={setNewComment}
            maxLength={300}
            testID="comment-input"
          />
          <Pressable
            style={[
              styles.sendButton,
              {
                backgroundColor: newComment.trim() ? brand.primary : colors.muted,
                borderRadius: radii.full,
              },
            ]}
            onPress={handleSend}
            disabled={!newComment.trim() || isSending}
            testID="comment-send-button"
          >
            {isSending ? (
              <ActivityIndicator size="small" color={brand.primaryForeground} />
            ) : (
              <Text style={{ color: newComment.trim() ? brand.primaryForeground : colors.mutedForeground, fontWeight: typography.weight.bold }}>
                전송
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center' },
  commentCard: { padding: spacing.smx },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  commentAvatar: { width: 28, height: 28, borderRadius: radii.xlg, justifyContent: 'center', alignItems: 'center' },
  commentAvatarText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  commentUser: {},
  commentTime: { marginLeft: 'auto' },
  commentContent: { lineHeight: 20, paddingLeft: 36 },
  inputBar: { flexDirection: 'row', padding: spacing.smx, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  commentInput: { flex: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.smd },
  sendButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.smd },
});
