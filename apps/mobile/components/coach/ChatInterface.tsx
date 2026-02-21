/**
 * AI 코치 채팅 인터페이스
 */

import * as Haptics from 'expo-haptics';
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import { QUICK_QUESTIONS, type QuestionCategory, type CoachMessage } from '../../lib/coach';
import { useCoach } from '../../lib/coach/useCoach';
import { useNetworkStatus } from '../../lib/offline';
import { useTheme } from '../../lib/theme';

export function ChatInterface() {
  const { colors, brand, status } = useTheme();
  const { isConnected } = useNetworkStatus();

  const {
    messages,
    isLoading,
    error,
    suggestedQuestions,
    sendMessage,
    clearMessages: _clearMessages,
  } = useCoach();

  const [input, setInput] = useState('');
  const [activeCategory, setActiveCategory] = useState<QuestionCategory>('general');
  const flatListRef = useRef<FlatList>(null);

  // 메시지 추가 시 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleQuickQuestion = async (question: string) => {
    if (isLoading) return;
    Haptics.selectionAsync();
    await sendMessage(question);
  };

  const handleCategoryChange = (category: QuestionCategory) => {
    Haptics.selectionAsync();
    setActiveCategory(category);
  };

  const categories: { key: QuestionCategory; label: string }[] = [
    { key: 'general', label: '일반' },
    { key: 'workout', label: '운동' },
    { key: 'nutrition', label: '영양' },
    { key: 'skin', label: '피부' },
  ];

  const renderMessage = ({ item }: { item: CoachMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageBubble,
          isUser
            ? [styles.userBubble, { backgroundColor: brand.primary }]
            : [styles.assistantBubble, { backgroundColor: colors.card }],
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
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* 오프라인 배너 */}
      {!isConnected && (
        <View style={[styles.offlineBanner, { backgroundColor: status.warning + '20' }]}>
          <Text style={[styles.offlineBannerText, { color: status.warning }]}>
            오프라인 모드 - 기본 응답만 제공됩니다
          </Text>
        </View>
      )}

      {/* 에러 메시지 */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: status.error + '15' }]}>
          <Text style={[styles.errorBannerText, { color: status.error }]}>{error}</Text>
        </View>
      )}

      {/* 메시지 목록 또는 빠른 질문 */}
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>🤖</Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI 웰니스 코치</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              운동, 영양, 피부 관리에 대해 물어보세요!
            </Text>
          </View>

          {/* 카테고리 탭 */}
          <View style={[styles.categoryTabs, { backgroundColor: colors.muted }]}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryTab, isActive && { backgroundColor: colors.card }]}
                  onPress={() => handleCategoryChange(cat.key)}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      { color: isActive ? brand.primary : colors.mutedForeground },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 빠른 질문 */}
          <View style={styles.quickQuestions}>
            {QUICK_QUESTIONS[activeCategory].map((question, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.quickQuestion,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => handleQuickQuestion(question)}
              >
                <Text style={[styles.quickQuestionText, { color: colors.foreground }]}>
                  {question}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <>
          {/* 메시지 목록 */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
          />

          {/* 추천 질문 */}
          {suggestedQuestions.length > 0 && !isLoading && (
            <View style={styles.suggestedContainer}>
              {suggestedQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestedButton, { backgroundColor: colors.muted }]}
                  onPress={() => handleQuickQuestion(question)}
                >
                  <Text style={[styles.suggestedText, { color: colors.foreground }]}>
                    {question}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {/* 로딩 인디케이터 */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={brand.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>생각 중...</Text>
        </View>
      )}

      {/* 입력 영역 */}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: colors.card, borderTopColor: colors.border },
        ]}
      >
        <TextInput
          style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
          placeholder="무엇이든 물어보세요..."
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: !input.trim() || isLoading ? colors.border : brand.primary,
            },
          ]}
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Text style={[styles.sendButtonText, { color: brand.primaryForeground }]}>전송</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineBanner: {
    padding: 8,
    alignItems: 'center',
  },
  offlineBannerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorBanner: {
    padding: 8,
    alignItems: 'center',
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  categoryTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickQuestions: {
    gap: 10,
  },
  quickQuestion: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  quickQuestionText: {
    fontSize: 15,
  },
  messageList: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  suggestedContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  suggestedText: {
    fontSize: 13,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
