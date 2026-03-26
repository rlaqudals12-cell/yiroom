/**
 * 제품 AI Q&A 채팅 화면
 *
 * 제품에 대한 질문을 AI에게 채팅 형식으로 묻고 답변을 받는다.
 * FAQ 제안 버튼 + 자유 입력 지원.
 */
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Send, ArrowLeft, Bot, User } from 'lucide-react-native';
import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { ScreenContainer } from '../../components/ui';
import { useTheme, typography, radii, spacing } from '../../lib/theme';

// --- 타입 ---
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// --- FAQ 제안 목록 ---
const FAQ_SUGGESTIONS = [
  '민감성 피부에도 사용 가능한가요?',
  '여름에도 끈적임 없이 사용할 수 있나요?',
  '유통기한은 개봉 후 얼마나 되나요?',
  '다른 제품과 함께 사용해도 괜찮나요?',
  '어떤 피부 타입에 가장 잘 맞나요?',
  '사용 순서가 어떻게 되나요?',
];

// 초기 환영 메시지
const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    '안녕하세요! 제품에 대해 궁금한 점이 있으시면 편하게 물어보세요. 성분, 사용법, 피부 적합성 등 다양한 질문에 답변해 드려요.',
  timestamp: Date.now(),
};

export default function ProductQAScreen(): React.ReactElement {
  const { colors, brand } = useTheme();

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // 메시지 전송 처리
  const handleSend = useCallback(
    async (text?: string): Promise<void> => {
      const messageText = (text ?? input).trim();
      if (!messageText || isLoading) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: messageText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      // AI 응답 시뮬레이션 (실제 구현 시 API 호출로 교체)
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: generateMockResponse(messageText),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1200);
    },
    [input, isLoading]
  );

  // FAQ 버튼 클릭
  const handleFaqPress = useCallback(
    (question: string): void => {
      Haptics.selectionAsync();
      handleSend(question);
    },
    [handleSend]
  );

  // 메시지 버블 렌더링
  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }): React.ReactElement => {
      const isUser = item.role === 'user';

      return (
        <View
          style={[
            styles.messageRow,
            isUser ? styles.messageRowUser : styles.messageRowAssistant,
          ]}
        >
          {/* 아시스턴트 아바타 */}
          {!isUser && (
            <View
              style={[
                styles.avatar,
                { backgroundColor: `${brand.primary}20` },
              ]}
            >
              <Bot size={16} color={brand.primary} strokeWidth={2} />
            </View>
          )}

          {/* 메시지 버블 */}
          <View
            style={[
              styles.bubble,
              isUser
                ? { backgroundColor: brand.primary, borderBottomRightRadius: 4 }
                : {
                    backgroundColor: colors.muted,
                    borderBottomLeftRadius: 4,
                  },
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                {
                  color: isUser ? brand.primaryForeground : colors.foreground,
                },
              ]}
            >
              {item.content}
            </Text>
          </View>

          {/* 사용자 아바타 */}
          {isUser && (
            <View
              style={[
                styles.avatar,
                { backgroundColor: `${brand.primary}20` },
              ]}
            >
              <User size={16} color={brand.primary} strokeWidth={2} />
            </View>
          )}
        </View>
      );
    },
    [colors, brand]
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  // 채팅이 비어있을 때 (환영 메시지만) FAQ 표시
  const showFaq = messages.length <= 1;

  return (
    <ScreenContainer
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
      testID="products-qa-screen"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* 헤더 */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
          >
            <ArrowLeft size={20} color={colors.foreground} strokeWidth={2} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Bot size={20} color={brand.primary} strokeWidth={2} />
            <Text
              style={[
                styles.headerTitle,
                { color: colors.foreground },
              ]}
            >
              제품 AI 상담
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* 채팅 메시지 목록 */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          inverted={false}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={
            isLoading ? (
              <View style={[styles.messageRow, styles.messageRowAssistant]}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: `${brand.primary}20` },
                  ]}
                >
                  <Bot size={16} color={brand.primary} strokeWidth={2} />
                </View>
                <View
                  style={[
                    styles.bubble,
                    { backgroundColor: colors.muted },
                  ]}
                >
                  <ActivityIndicator size="small" color={brand.primary} />
                </View>
              </View>
            ) : null
          }
        />

        {/* FAQ 제안 버튼 (수평 스크롤) */}
        {showFaq && (
          <View style={styles.faqContainer}>
            <Text
              style={[
                styles.faqLabel,
                { color: colors.mutedForeground },
              ]}
            >
              자주 묻는 질문
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.faqScroll}
            >
              {FAQ_SUGGESTIONS.map((faq) => (
                <Pressable
                  key={faq}
                  onPress={() => handleFaqPress(faq)}
                  style={({ pressed }) => [
                    styles.faqButton,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={faq}
                >
                  <Text
                    style={[
                      styles.faqText,
                      { color: colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {faq}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 입력 영역 */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.secondary,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            value={input}
            onChangeText={setInput}
            placeholder="제품에 대해 궁금한 점을 입력하세요"
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            blurOnSubmit={false}
            testID="qa-input"
            accessibilityLabel="질문 입력"
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={!input.trim() || isLoading}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor:
                  input.trim() && !isLoading
                    ? brand.primary
                    : colors.muted,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            testID="qa-send-button"
            accessibilityRole="button"
            accessibilityLabel="전송"
          >
            <Send
              size={18}
              color={
                input.trim() && !isLoading
                  ? brand.primaryForeground
                  : colors.mutedForeground
              }
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

// Mock 응답 생성 (실제 API 연동 전 임시)
function generateMockResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes('민감') || q.includes('피부')) {
    return '이 제품은 저자극 테스트를 완료했으며 민감성 피부에도 적합해요. 다만 처음 사용 시 팔 안쪽에 패치 테스트를 권장해요.';
  }
  if (q.includes('여름') || q.includes('끈적')) {
    return '가벼운 젤 타입이라 여름에도 끈적임 없이 사용 가능해요. 자외선 차단제와 함께 사용하면 더 좋아요.';
  }
  if (q.includes('유통기한') || q.includes('개봉')) {
    return '개봉 후 12개월 이내에 사용을 권장해요. 직사광선을 피해 서늘한 곳에 보관하세요.';
  }
  if (q.includes('순서') || q.includes('사용법')) {
    return '세안 후 토너 → 에센스 → 이 제품 → 크림 순서로 사용하면 좋아요. 소량을 얼굴에 고르게 펴 발라주세요.';
  }
  if (q.includes('함께') || q.includes('같이') || q.includes('병행')) {
    return '대부분의 스킨케어 제품과 함께 사용할 수 있어요. 다만 레티놀이나 AHA/BHA 제품과는 사용 간격을 두는 것을 권장해요.';
  }

  return '좋은 질문이에요! 해당 제품에 대해 더 자세한 정보가 필요하시면 성분, 사용법, 피부 타입별 적합성 등 구체적으로 질문해주시면 더 정확한 답변을 드릴 수 있어요.';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smx,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  messageList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.smx,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    maxWidth: '85%',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
  },
  messageRowAssistant: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smx,
    borderRadius: radii.xl,
    maxWidth: '100%',
    flexShrink: 1,
  },
  bubbleText: {
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  faqContainer: {
    paddingVertical: spacing.smx,
    borderTopWidth: 0,
  },
  faqLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    marginLeft: spacing.md,
    marginBottom: spacing.xs,
  },
  faqScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  faqButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  faqText: {
    fontSize: typography.size.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smx,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.smx,
    borderTopWidth: 1,
    gap: spacing.xs,
  },
  textInput: {
    flex: 1,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smx,
    fontSize: typography.size.sm,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
