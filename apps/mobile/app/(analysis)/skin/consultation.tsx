/**
 * 피부 상담 화면
 * 빠른 질문 기반 AI 피부 상담
 */
import { useAuth } from '@clerk/clerk-expo';
import { Send } from 'lucide-react-native';
import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import { ScreenContainer, GlassCard } from '@/components/ui';
import { sendCoachMessage, type CoachMessage } from '@/lib/coach';

import { useTheme, brand, typography, spacing, radii } from '../../../lib/theme';

// 빠른 질문
const QUICK_QUESTIONS = [
  { id: 'dry', label: '💧 건조함', question: '피부가 건조한데 어떻게 관리해야 하나요?' },
  { id: 'oil', label: '✨ 유분', question: '피지가 많은데 어떤 관리를 하면 좋을까요?' },
  { id: 'acne', label: '🔴 트러블', question: '트러블이 자주 나는데 어떻게 해야 하나요?' },
  { id: 'wrinkle', label: '〰️ 잔주름', question: '잔주름이 신경 쓰이는데 관리법이 있나요?' },
  { id: 'pore', label: '⚫ 모공', question: '모공이 넓은데 관리법을 알고 싶어요.' },
  { id: 'sensitive', label: '🩹 민감', question: '민감한 피부를 관리하는 방법이 궁금해요.' },
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tips?: string[];
  connectionNotice?: boolean;
}

export default function SkinConsultationScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '안녕하세요! 피부 고민을 편하게 말씀해주세요. 아래 버튼으로 빠르게 질문할 수도 있어요.',
      timestamp: new Date(0),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const [isTyping, setIsTyping] = useState(false);
  const messageSequence = useRef(0);

  const nextMessageIdentity = useCallback((role: ChatMessage['role']) => {
    messageSequence.current += 1;
    return {
      id: `${role}-${messageSequence.current}`,
      timestamp: new Date(messageSequence.current),
    };
  }, []);

  // 인증된 공용 API만 사용해 별도 404 경로와 무표식 로컬 답변을 차단한다.
  const generateResponse = useCallback(
    async (question: string): Promise<ChatMessage> => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Authentication required');

        const history: CoachMessage[] = messages.map(({ id, role, content, timestamp }) => ({
          id,
          role,
          content,
          timestamp,
        }));
        const response = await sendCoachMessage(question, history, token);
        return {
          ...nextMessageIdentity('assistant'),
          role: 'assistant',
          content: response.message,
        };
      } catch {
        return {
          ...nextMessageIdentity('assistant'),
          role: 'assistant',
          content: '상담 서비스에 연결하지 못했어요. 잠시 후 다시 시도해주세요.',
          connectionNotice: true,
        };
      }
    },
    [getToken, messages, nextMessageIdentity]
  );

  const handleSend = useCallback(
    async (text?: string): Promise<void> => {
      const msg = text ?? inputText.trim();
      if (!msg || isTyping) return;

      const userMsg: ChatMessage = {
        ...nextMessageIdentity('user'),
        role: 'user',
        content: msg,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      setIsTyping(true);

      const assistantMsg = await generateResponse(msg);

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    },
    [inputText, isTyping, generateResponse, nextMessageIdentity]
  );

  const handleQuickQuestion = useCallback(
    (question: string): void => {
      handleSend(question);
    },
    [handleSend]
  );

  const renderMessage = ({ item }: { item: ChatMessage }): React.JSX.Element => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isUser ? brand.primary : colors.card,
              borderColor: isUser ? brand.primary : colors.border,
            },
          ]}
        >
          {item.connectionNotice && (
            <Text style={[styles.noticeLabel, { color: colors.muted }]}>
              AI 응답이 아닌 연결 안내예요.
            </Text>
          )}
          <Text
            style={[
              styles.messageText,
              { color: isUser ? brand.primaryForeground : colors.foreground },
            ]}
          >
            {item.content}
          </Text>
          {item.tips && item.tips.length > 0 && (
            <View style={[styles.tipsContainer, { borderTopColor: colors.border }]}>
              <Text style={[styles.tipsTitle, { color: colors.foreground }]}>추천 관리법</Text>
              {item.tips.map((tip, i) => (
                <Text key={i} style={[styles.tipText, { color: colors.foreground }]}>
                  • {tip}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer
      scrollable={false}
      contentPadding={0}
      testID="skin-consultation-screen"
      backgroundGradient="analysis"
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.container}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatContent}
            ListHeaderComponent={
              isTyping ? (
                <View style={[styles.messageContainer, styles.assistantMessage]}>
                  <View
                    style={[
                      styles.messageBubble,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <ActivityIndicator size="small" color={brand.primary} />
                  </View>
                </View>
              ) : null
            }
            inverted={false}
            ListFooterComponent={
              <View style={styles.quickQuestionsContainer}>
                <Text style={[styles.quickTitle, { color: colors.muted }]}>빠른 질문</Text>
                <View style={styles.quickGrid}>
                  {QUICK_QUESTIONS.map((q) => (
                    <Pressable
                      key={q.id}
                      style={[
                        styles.quickButton,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                      onPress={() => handleQuickQuestion(q.question)}
                    >
                      <Text style={[styles.quickLabel, { color: colors.foreground }]}>
                        {q.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            }
          />

          {/* 입력 영역 */}
          <GlassCard
            shadowSize="md"
            style={{ ...styles.inputContainer, borderTopColor: colors.border }}
          >
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="피부 고민을 입력해주세요..."
              placeholderTextColor={colors.muted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <Pressable
              style={[
                styles.sendButton,
                { backgroundColor: inputText.trim() && !isTyping ? brand.primary : colors.muted },
              ]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isTyping}
            >
              <Send size={18} color={brand.primaryForeground} />
            </Pressable>
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  // 메시지
  messageContainer: {
    marginBottom: spacing.sm,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
  },
  messageText: {
    fontSize: typography.size.base,
    lineHeight: 22,
  },
  noticeLabel: {
    fontSize: typography.size.xs,
    marginBottom: spacing.xs,
  },
  tipsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  tipsTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginBottom: spacing.xxs,
  },
  // 빠른 질문
  quickQuestionsContainer: {
    marginTop: spacing.md,
  },
  quickTitle: {
    fontSize: typography.size.xs,
    marginBottom: spacing.sm,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  quickButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  quickLabel: {
    fontSize: typography.size.sm,
  },
  // 입력
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.xs,
  },
  textInput: {
    flex: 1,
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.size.base,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radii.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
