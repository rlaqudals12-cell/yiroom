/**
 * 피드백 화면 — 사용자 피드백 폼
 */
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { Bug, Lightbulb, MessageSquare, HelpCircle, CheckCircle, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

import { useTheme } from '@/lib/theme';
import { ScreenContainer } from '@/components/ui';

type FeedbackType = 'bug' | 'feature' | 'general' | 'other';

interface FeedbackOption {
  type: FeedbackType;
  icon: React.ReactNode;
  label: string;
  description: string;
}

export default function FeedbackScreen(): React.JSX.Element {
  const { colors, spacing, radii, typography, brand, status } = useTheme();

  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const feedbackOptions: FeedbackOption[] = [
    {
      type: 'bug',
      icon: <Bug size={20} color={feedbackType === 'bug' ? brand.primaryForeground : status.error} />,
      label: '버그 제보',
      description: '오류나 문제점',
    },
    {
      type: 'feature',
      icon: <Lightbulb size={20} color={feedbackType === 'feature' ? brand.primaryForeground : status.warning} />,
      label: '기능 제안',
      description: '새로운 아이디어',
    },
    {
      type: 'general',
      icon: <MessageSquare size={20} color={feedbackType === 'general' ? brand.primaryForeground : brand.primary} />,
      label: '일반 의견',
      description: '사용 경험 공유',
    },
    {
      type: 'other',
      icon: <HelpCircle size={20} color={feedbackType === 'other' ? brand.primaryForeground : colors.mutedForeground} />,
      label: '기타',
      description: '그 외 문의',
    },
  ];

  const canSubmit = feedbackType && content.trim().length >= 10;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // 피드백 제출 (향후 API 연동)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('전송 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, isSubmitting]);

  if (isSubmitted) {
    return (
      <ScreenContainer testID="feedback-success-screen" scrollable={false}>
        <View style={styles.successContainer}>
          <Animated.View entering={BounceIn.delay(100)}>
            <CheckCircle size={64} color={status.success} />
          </Animated.View>
          <Animated.Text
            entering={FadeInUp.delay(300)}
            style={{
              fontSize: typography.size.xl,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
              marginTop: spacing.lg,
              marginBottom: spacing.sm,
            }}
          >
            피드백을 보냈어요!
          </Animated.Text>
          <Animated.Text
            entering={FadeInUp.delay(500)}
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              textAlign: 'center',
              lineHeight: typography.size.sm * 1.7,
            }}
          >
            소중한 의견 감사해요.{'\n'}더 나은 이룸을 만들어 갈게요.
          </Animated.Text>
          <Animated.View entering={FadeInUp.delay(700)}>
            <Pressable
              style={[
                styles.homeButton,
                {
                  backgroundColor: brand.primary,
                  borderRadius: radii.lg,
                  marginTop: spacing.xl,
                  paddingHorizontal: spacing.xl,
                  paddingVertical: spacing.md,
                },
              ]}
              onPress={() => router.replace('/(tabs)')}
              accessibilityRole="button"
              accessibilityLabel="홈으로 돌아가기"
            >
              <Text
                style={{
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.semibold,
                  color: brand.primaryForeground,
                }}
              >
                홈으로 돌아가기
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer testID="feedback-screen" scrollable={false} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
        >
          {/* 안내 */}
          <Animated.View entering={FadeInDown.delay(0).duration(300)}>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
                lineHeight: typography.size.sm * 1.7,
                marginBottom: spacing.lg,
              }}
            >
              이룸을 사용하면서 느낀 점을 알려주세요.{'\n'}여러분의 피드백이 더 나은 서비스를 만들어요.
            </Text>
          </Animated.View>

          {/* 타입 선택 */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(300)}
            style={[styles.typeGrid, { gap: spacing.sm }]}
          >
            {feedbackOptions.map((option) => {
              const isSelected = feedbackType === option.type;
              return (
                <Pressable
                  key={option.type}
                  style={[
                    styles.typeCard,
                    {
                      backgroundColor: isSelected ? brand.primary : colors.card,
                      borderColor: isSelected ? brand.primary : colors.border,
                      borderRadius: radii.lg,
                      padding: spacing.md,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFeedbackType(option.type);
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: isSelected }}
                >
                  {option.icon}
                  <Text
                    style={{
                      fontSize: typography.size.sm,
                      fontWeight: typography.weight.semibold,
                      color: isSelected ? brand.primaryForeground : colors.foreground,
                      marginTop: spacing.xs,
                    }}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.size.xs,
                      color: isSelected ? brand.primaryForeground + 'CC' : colors.mutedForeground,
                      marginTop: spacing.xxs,
                    }}
                  >
                    {option.description}
                  </Text>
                </Pressable>
              );
            })}
          </Animated.View>

          {/* 내용 입력 */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={{ marginTop: spacing.lg }}>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginBottom: spacing.sm,
              }}
            >
              내용 *
            </Text>
            <TextInput
              style={[
                styles.textarea,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.lg,
                  color: colors.foreground,
                  fontSize: typography.size.sm,
                  padding: spacing.md,
                },
              ]}
              placeholder="최소 10자 이상 작성해주세요"
              placeholderTextColor={colors.mutedForeground}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              accessibilityLabel="피드백 내용"
            />
            <Text
              style={{
                fontSize: typography.size.xs,
                color: content.length >= 10 ? colors.mutedForeground : status.error,
                marginTop: spacing.xs,
                textAlign: 'right',
              }}
            >
              {content.length}/10+
            </Text>
          </Animated.View>

          {/* 이메일 (선택) */}
          <Animated.View entering={FadeInDown.delay(300).duration(300)} style={{ marginTop: spacing.md }}>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginBottom: spacing.sm,
              }}
            >
              이메일 (선택)
            </Text>
            <TextInput
              style={[
                styles.emailInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.lg,
                  color: colors.foreground,
                  fontSize: typography.size.sm,
                  paddingHorizontal: spacing.md,
                },
              ]}
              placeholder="답변을 받으시려면 이메일을 입력해주세요"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="이메일 주소"
            />
          </Animated.View>
        </ScrollView>

        {/* 제출 버튼 */}
        <View
          style={[
            styles.submitBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              padding: spacing.md,
            },
          ]}
        >
          <Pressable
            style={[
              styles.submitButton,
              {
                backgroundColor: canSubmit ? brand.primary : colors.secondary,
                borderRadius: radii.lg,
                padding: spacing.md,
              },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="피드백 보내기"
            accessibilityState={{ disabled: !canSubmit || isSubmitting }}
          >
            <Send size={18} color={canSubmit ? brand.primaryForeground : colors.mutedForeground} />
            <Text
              style={{
                fontSize: typography.size.base,
                fontWeight: typography.weight.semibold,
                color: canSubmit ? brand.primaryForeground : colors.mutedForeground,
                marginLeft: spacing.sm,
              }}
            >
              {isSubmitting ? '보내는 중...' : '피드백 보내기'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeCard: {
    width: '48%',
    borderWidth: 1,
    alignItems: 'center',
  },
  textarea: {
    borderWidth: 1,
    minHeight: 120,
  },
  emailInput: {
    borderWidth: 1,
    height: 44,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  homeButton: {},
  submitBar: {
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
