/**
 * FeedbackForm - 피드백 폼 컴포넌트
 * 사용자 피드백을 입력받는 폼을 표시한다.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, type ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme';

export type FeedbackCategory = 'bug' | 'feature' | 'improvement' | 'other';

export interface FeedbackFormProps {
  onSubmit?: (data: { category: FeedbackCategory; title: string; content: string }) => void;
  isSubmitting?: boolean;
  style?: ViewStyle;
}

const CATEGORIES: { id: FeedbackCategory; label: string; emoji: string }[] = [
  { id: 'bug', label: '버그 신고', emoji: '🐛' },
  { id: 'feature', label: '기능 요청', emoji: '💡' },
  { id: 'improvement', label: '개선 제안', emoji: '✨' },
  { id: 'other', label: '기타', emoji: '📝' },
];

export function FeedbackForm({
  onSubmit,
  isSubmitting = false,
  style,
}: FeedbackFormProps): React.ReactElement {
  const { colors, brand, spacing, radii, typography } = useTheme();
  const [category, setCategory] = useState<FeedbackCategory>('improvement');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = useCallback(() => {
    if (!title.trim() || !content.trim()) return;
    onSubmit?.({ category, title: title.trim(), content: content.trim() });
  }, [category, title, content, onSubmit]);

  const isValid = title.trim().length > 0 && content.trim().length > 0;

  return (
    <View
      testID="feedback-form"
      accessibilityLabel="피드백 작성"
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: typography.size.xl,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.md,
        }}
      >
        피드백 보내기
      </Text>

      {/* 카테고리 선택 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        유형
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            accessibilityLabel={`${cat.label}${category === cat.id ? ', 선택됨' : ''}`}
            onPress={() => setCategory(cat.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.smx,
              paddingVertical: spacing.xs,
              borderRadius: radii.full,
              backgroundColor: category === cat.id ? brand.primary : colors.secondary,
            }}
          >
            <Text style={{ fontSize: typography.size.sm }}>{cat.emoji}</Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: category === cat.id ? brand.primaryForeground : colors.foreground,
                fontWeight: category === cat.id ? typography.weight.semibold : typography.weight.normal,
              }}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 제목 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        제목
      </Text>
      <TextInput
        testID="feedback-title-input"
        accessibilityLabel="피드백 제목"
        value={title}
        onChangeText={setTitle}
        placeholder="제목을 입력해주세요"
        placeholderTextColor={colors.mutedForeground}
        style={{
          backgroundColor: colors.background,
          borderRadius: radii.xl,
          padding: spacing.smx,
          fontSize: typography.size.base,
          color: colors.foreground,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      />

      {/* 내용 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        내용
      </Text>
      <TextInput
        testID="feedback-content-input"
        accessibilityLabel="피드백 내용"
        value={content}
        onChangeText={setContent}
        placeholder="상세 내용을 입력해주세요"
        placeholderTextColor={colors.mutedForeground}
        multiline
        numberOfLines={4}
        style={{
          backgroundColor: colors.background,
          borderRadius: radii.xl,
          padding: spacing.smx,
          fontSize: typography.size.base,
          color: colors.foreground,
          marginBottom: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
          minHeight: 100,
          textAlignVertical: 'top',
        }}
      />

      {/* 제출 버튼 */}
      <Pressable
        testID="feedback-submit-button"
        accessibilityLabel="피드백 보내기"
        onPress={handleSubmit}
        disabled={!isValid || isSubmitting}
        style={{
          backgroundColor: isValid && !isSubmitting ? brand.primary : colors.secondary,
          borderRadius: radii.xl,
          paddingVertical: spacing.smx,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: isValid && !isSubmitting ? brand.primaryForeground : colors.mutedForeground,
          }}
        >
          {isSubmitting ? '보내는 중...' : '보내기'}
        </Text>
      </Pressable>
    </View>
  );
}
