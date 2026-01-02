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
  useColorScheme,
} from 'react-native';

import { useNetworkStatus } from '../../lib/offline';
import {
  QUICK_QUESTIONS,
  type QuestionCategory,
  type CoachMessage,
} from '../../lib/coach';
import { useCoach } from '../../lib/coach/useCoach';

export function ChatInterface() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isConnected } = useNetworkStatus();

  const {
    messages,
    isLoading,
    error,
    suggestedQuestions,
    sendMessage,
    clearMessages,
  } = useCoach();

  const [input, setInput] = useState('');
  const [activeCategory, setActiveCategory] =
    useState<QuestionCategory>('general');
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
          isUser ? styles.userBubble : styles.assistantBubble,
          isDark &&
            (isUser ? styles.userBubbleDark : styles.assistantBubbleDark),
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isUser && styles.userMessageText,
            isDark && (isUser ? styles.userMessageTextDark : styles.textLight),
          ]}
        >
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, isDark && styles.containerDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* 오프라인 배너 */}
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            오프라인 모드 - 기본 응답만 제공됩니다
          </Text>
        </View>
      )}

      {/* 에러 메시지 */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* 메시지 목록 또는 빠른 질문 */}
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>🤖</Text>
            <Text style={[styles.headerTitle, isDark && styles.textLight]}>
              AI 웰니스 코치
            </Text>
            <Text style={[styles.headerSubtitle, isDark && styles.textMuted]}>
              운동, 영양, 피부 관리에 대해 물어보세요!
            </Text>
          </View>

          {/* 카테고리 탭 */}
          <View style={styles.categoryTabs}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryTab,
                  activeCategory === cat.key && styles.categoryTabActive,
                ]}
                onPress={() => handleCategoryChange(cat.key)}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    isDark && styles.textMuted,
                    activeCategory === cat.key && styles.categoryTabTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 빠른 질문 */}
          <View style={styles.quickQuestions}>
            {QUICK_QUESTIONS[activeCategory].map((question, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.quickQuestion,
                  isDark && styles.quickQuestionDark,
                ]}
                onPress={() => handleQuickQuestion(question)}
              >
                <Text
                  style={[styles.quickQuestionText, isDark && styles.textLight]}
                >
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
                  style={[
                    styles.suggestedButton,
                    isDark && styles.suggestedButtonDark,
                  ]}
                  onPress={() => handleQuickQuestion(question)}
                >
                  <Text
                    style={[styles.suggestedText, isDark && styles.textLight]}
                  >
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
          <ActivityIndicator size="small" color="#8b5cf6" />
          <Text style={[styles.loadingText, isDark && styles.textMuted]}>
            생각 중...
          </Text>
        </View>
      )}

      {/* 입력 영역 */}
      <View
        style={[styles.inputContainer, isDark && styles.inputContainerDark]}
      >
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="무엇이든 물어보세요..."
          placeholderTextColor={isDark ? '#666' : '#999'}
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
            (!input.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>전송</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  offlineBanner: {
    backgroundColor: '#fef3c7',
    padding: 8,
    alignItems: 'center',
  },
  offlineBannerText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    padding: 8,
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#dc2626',
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
    color: '#111',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  categoryTabs: {
    flexDirection: 'row',
    backgroundColor: '#e5e5e5',
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
  categoryTabActive: {
    backgroundColor: '#fff',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryTabTextActive: {
    color: '#8b5cf6',
  },
  quickQuestions: {
    gap: 10,
  },
  quickQuestion: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  quickQuestionDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  quickQuestionText: {
    fontSize: 15,
    color: '#333',
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
    backgroundColor: '#8b5cf6',
    borderBottomRightRadius: 4,
  },
  userBubbleDark: {
    backgroundColor: '#7c3aed',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  assistantBubbleDark: {
    backgroundColor: '#1a1a1a',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  userMessageText: {
    color: '#fff',
  },
  userMessageTextDark: {
    color: '#fff',
  },
  suggestedContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  suggestedButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  suggestedText: {
    fontSize: 13,
    color: '#333',
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
    color: '#666',
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
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
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
