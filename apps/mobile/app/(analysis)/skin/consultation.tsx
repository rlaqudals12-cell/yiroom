/**
 * 피부 상담 화면
 * 빠른 질문 기반 AI 피부 상담 (로컬 mock → 향후 API 연동)
 */
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
} from 'react-native';
import { Send } from 'lucide-react-native';

import { useTheme, brand } from '../../../lib/theme';
import { spacing, radii, typography } from '../../../lib/theme';

// 빠른 질문
const QUICK_QUESTIONS = [
  { id: 'dry', label: '💧 건조함', question: '피부가 건조한데 어떻게 관리해야 하나요?' },
  { id: 'oil', label: '✨ 유분', question: '피지가 많은데 어떤 관리를 하면 좋을까요?' },
  { id: 'acne', label: '🔴 트러블', question: '트러블이 자주 나는데 어떻게 해야 하나요?' },
  { id: 'wrinkle', label: '〰️ 잔주름', question: '잔주름이 신경 쓰이는데 관리법이 있나요?' },
  { id: 'pore', label: '⚫ 모공', question: '모공이 넓은데 관리법을 알고 싶어요.' },
  { id: 'sensitive', label: '🩹 민감', question: '민감한 피부를 관리하는 방법이 궁금해요.' },
];

// 상담 Mock 응답
const CONSULTATION_RESPONSES: Record<string, { message: string; tips: string[] }> = {
  dry: {
    message: '건조한 피부는 수분과 유분의 균형이 중요해요. 클렌징 후 3분 이내에 보습제를 바르는 것이 효과적이에요.',
    tips: ['세라마이드 성분 크림 사용', '1일 2L 수분 섭취', '실내 습도 50-60% 유지', '뜨거운 물로 세안 자제'],
  },
  oil: {
    message: '유분이 많은 피부는 오히려 보습이 더 중요해요. 과도한 세안은 피지 분비를 촉진할 수 있어요.',
    tips: ['약산성 클렌저 사용', '오일프리 보습제 선택', '주 1-2회 클레이 마스크', '가벼운 수분 에센스 사용'],
  },
  acne: {
    message: '트러블 관리는 클렌징과 진정이 핵심이에요. 손으로 짜지 않고 적절한 성분으로 관리하는 것이 좋아요.',
    tips: ['살리실산(BHA) 제품 사용', '논코메도제닉 제품 선택', '자극적인 스크럽 피하기', '베개 커버 자주 교체'],
  },
  wrinkle: {
    message: '잔주름 관리는 자외선 차단과 보습이 기본이에요. 꾸준한 관리가 가장 중요해요.',
    tips: ['SPF 50 자외선 차단제 매일 사용', '레티놀 성분 제품 (저녁)', '비타민 C 세럼 (아침)', '충분한 수면'],
  },
  pore: {
    message: '모공 관리는 피지 조절과 각질 관리가 핵심이에요. 즉각적인 효과보다 꾸준함이 중요해요.',
    tips: ['BHA 토너 사용', '나이아신아마이드 세럼', '주 1회 효소 클렌저', '냉수 마무리 세안'],
  },
  sensitive: {
    message: '민감 피부는 최소한의 제품으로 단순하게 관리하는 것이 좋아요. 새 제품은 반드시 패치테스트 후 사용하세요.',
    tips: ['무향 제품 선택', '성분 수 적은 제품 사용', '물리적 자외선 차단제', '알코올 프리 토너'],
  },
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tips?: string[];
}

export default function SkinConsultationScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '안녕하세요! 피부 고민을 편하게 말씀해주세요. 아래 버튼으로 빠르게 질문할 수도 있어요.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // 응답 생성 (mock)
  const generateResponse = useCallback((question: string): ChatMessage => {
    const lowerQ = question.toLowerCase();
    let concern = 'dry'; // 기본값
    if (lowerQ.includes('유분') || lowerQ.includes('피지') || lowerQ.includes('번들')) concern = 'oil';
    else if (lowerQ.includes('트러블') || lowerQ.includes('여드름')) concern = 'acne';
    else if (lowerQ.includes('주름') || lowerQ.includes('탄력')) concern = 'wrinkle';
    else if (lowerQ.includes('모공')) concern = 'pore';
    else if (lowerQ.includes('민감') || lowerQ.includes('자극')) concern = 'sensitive';
    else if (lowerQ.includes('건조')) concern = 'dry';

    const resp = CONSULTATION_RESPONSES[concern] ?? CONSULTATION_RESPONSES.dry;
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: resp.message,
      tips: resp.tips,
    };
  }, []);

  const handleSend = useCallback((text?: string): void => {
    const msg = text ?? inputText.trim();
    if (!msg) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: msg,
    };

    const assistantMsg = generateResponse(msg);

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [inputText, generateResponse]);

  const handleQuickQuestion = useCallback((question: string): void => {
    handleSend(question);
  }, [handleSend]);

  const renderMessage = ({ item }: { item: ChatMessage }): React.JSX.Element => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage,
        ]}
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
              <Text style={[styles.tipsTitle, { color: colors.foreground }]}>
                추천 관리법
              </Text>
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
        testID="skin-consultation-screen"
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          ListFooterComponent={
            <View style={styles.quickQuestionsContainer}>
              <Text style={[styles.quickTitle, { color: colors.muted }]}>
                빠른 질문
              </Text>
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
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.card, borderTopColor: colors.border },
          ]}
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
              { backgroundColor: inputText.trim() ? brand.primary : colors.muted },
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
          >
            <Send size={18} color={brand.primaryForeground} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  tipsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  tipsTitle: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginBottom: 2,
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
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.size.base,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
