/**
 * 피드백 보내기 화면
 *
 * 사용자가 앱에 대한 피드백/건의를 보낼 수 있다.
 */
import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, Linking } from 'react-native';

import { useTheme } from '../../lib/theme';
import { ScreenContainer } from '../../components/ui';

type FeedbackCategory = 'bug' | 'feature' | 'improvement' | 'other';

const CATEGORIES: { id: FeedbackCategory; label: string; emoji: string }[] = [
  { id: 'bug', label: '버그 신고', emoji: '🐛' },
  { id: 'feature', label: '기능 요청', emoji: '💡' },
  { id: 'improvement', label: '개선 제안', emoji: '✨' },
  { id: 'other', label: '기타', emoji: '💬' },
];

export default function FeedbackScreen(): React.ReactElement {
  const { colors, brand, spacing, radii, typography } = useTheme();

  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [message, setMessage] = useState('');

  const isValid = category !== null && message.trim().length >= 10;

  const handleSubmit = (): void => {
    if (!isValid) return;

    const subject = `[이룸 피드백] ${CATEGORIES.find((c) => c.id === category)?.label ?? '기타'}`;
    const body = `카테고리: ${CATEGORIES.find((c) => c.id === category)?.label}\n\n${message}`;
    const mailto = `mailto:support@yiroom.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(mailto).catch(() => {
      Alert.alert('오류', '이메일 앱을 열 수 없어요. support@yiroom.app으로 직접 보내주세요.');
    });
  };

  return (
    <ScreenContainer testID="feedback-screen" edges={['bottom']}>
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        피드백 보내기
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.lg,
        }}
      >
        이룸을 더 좋게 만들어주세요
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
        카테고리
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
        {CATEGORIES.map((cat) => {
          const selected = category === cat.id;
          return (
            <Pressable
              key={cat.id}
              accessibilityLabel={`${cat.label}${selected ? ', 선택됨' : ''}`}
              onPress={() => setCategory(cat.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: spacing.smx,
                paddingVertical: spacing.sm,
                borderRadius: radii.full,
                backgroundColor: selected ? brand.primary + '20' : colors.secondary,
                borderWidth: 1,
                borderColor: selected ? brand.primary : 'transparent',
                gap: spacing.xs,
              }}
            >
              <Text style={{ fontSize: typography.size.sm }}>{cat.emoji}</Text>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: selected ? brand.primary : colors.foreground,
                  fontWeight: selected ? typography.weight.semibold : typography.weight.normal,
                }}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 메시지 입력 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        내용 (최소 10자)
      </Text>
      <TextInput
        testID="feedback-message-input"
        value={message}
        onChangeText={setMessage}
        placeholder="어떤 점이 불편하거나 개선되면 좋겠는지 알려주세요..."
        placeholderTextColor={colors.mutedForeground}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: spacing.md,
          fontSize: typography.size.base,
          color: colors.foreground,
          minHeight: 150,
          marginBottom: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      />

      {/* 보내기 버튼 */}
      <Pressable
        testID="feedback-submit"
        accessibilityLabel="피드백 보내기"
        onPress={handleSubmit}
        disabled={!isValid}
        style={{
          backgroundColor: isValid ? brand.primary : colors.secondary,
          borderRadius: radii.lg,
          paddingVertical: spacing.smx,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: isValid ? brand.primaryForeground : colors.mutedForeground,
          }}
        >
          보내기
        </Text>
      </Pressable>

      {/* 이메일 안내 */}
      <Text
        style={{
          fontSize: typography.size.xs,
          color: colors.mutedForeground,
          textAlign: 'center',
          marginTop: spacing.sm,
        }}
      >
        support@yiroom.app으로 전송돼요
      </Text>
    </ScreenContainer>
  );
}
