/**
 * AI 채팅 훅
 * useCoach 패턴 복제 — API endpoint만 /api/chat으로 변경
 */

import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useState } from 'react';

import { useNetworkStatus } from '../offline';
import { sendChatMessage, getChatMockResponse } from './api';
import type { ChatMessage, ChatResponse } from './types';

interface UseChatResult {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  suggestedQuestions: string[];
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

const DEFAULT_SUGGESTIONS = [
  '오늘 뭐 하면 좋을까?',
  '건강한 간식 추천해줘',
  '스킨케어 루틴 알려줘',
];

/**
 * AI 채팅 훅 (코치와 독립된 범용 채팅)
 */
export function useChat(): UseChatResult {
  const { getToken } = useAuth();
  const { isConnected } = useNetworkStatus();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(DEFAULT_SUGGESTIONS);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) return;

      // 사용자 메시지 추가
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        let response: ChatResponse;

        if (isConnected) {
          // 온라인: API 호출
          const token = await getToken();
          response = await sendChatMessage(message, [...messages, userMessage], token ?? undefined);
        } else {
          // 오프라인: Mock 응답
          response = getChatMockResponse(message);
        }

        // AI 응답 추가
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (response.suggestedQuestions) {
          setSuggestedQuestions(response.suggestedQuestions);
        }
      } catch {
        // 에러 발생 — fallback mock 응답으로 전환
        setError('메시지 전송에 실패했어요. 다시 시도해주세요.');

        // 에러 시 Mock 응답
        const fallbackResponse = getChatMockResponse(message);
        const fallbackMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fallbackResponse.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, fallbackMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, isConnected, getToken, messages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setSuggestedQuestions(DEFAULT_SUGGESTIONS);
  }, []);

  return {
    messages,
    isLoading,
    error,
    suggestedQuestions,
    sendMessage,
    clearMessages,
  };
}
