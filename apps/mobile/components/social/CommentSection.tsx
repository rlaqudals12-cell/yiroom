/**
 * CommentSection — 댓글 섹션
 *
 * 피드/활동에 대한 댓글 목록과 입력.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface Comment {
  id: string;
  userName: string;
  content: string;
  timeAgo: string;
}

export interface CommentSectionProps {
  comments: Comment[];
  onSubmit?: (content: string) => void;
  style?: ViewStyle;
}

export function CommentSection({
  comments,
  onSubmit,
  style,
}: CommentSectionProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, brand } = useTheme();
  const [text, setText] = useState('');

  const handleSubmit = (): void => {
    if (text.trim() && onSubmit) {
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
        style,
      ]}
      testID="comment-section"
      accessibilityLabel={`댓글 ${comments.length}개`}
    >
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        댓글 {comments.length}
      </Text>

      {/* 댓글 목록 */}
      {comments.map((comment) => (
        <View
          key={comment.id}
          style={[styles.commentRow, { marginBottom: spacing.sm }]}
          accessibilityLabel={`${comment.userName}: ${comment.content}`}
        >
          <View style={styles.commentHeader}>
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.bold,
                color: colors.foreground,
              }}
            >
              {comment.userName}
            </Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
                marginLeft: spacing.xs,
              }}
            >
              {comment.timeAgo}
            </Text>
          </View>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.foreground,
              marginTop: spacing.xxs,
            }}
          >
            {comment.content}
          </Text>
        </View>
      ))}

      {/* 입력 */}
      {onSubmit && (
        <View style={[styles.inputRow, { gap: spacing.sm }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.xl,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.sm,
                fontSize: typography.size.sm,
                color: colors.foreground,
              },
            ]}
            value={text}
            onChangeText={setText}
            placeholder="댓글 작성..."
            placeholderTextColor={colors.mutedForeground}
            accessibilityLabel="댓글 입력"
            testID="comment-input"
          />
          <Pressable
            onPress={handleSubmit}
            accessibilityLabel="댓글 전송"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.bold,
                color: brand.primary,
              }}
            >
              전송
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  commentRow: {},
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
  },
});
