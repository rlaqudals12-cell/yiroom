/**
 * AI 웰니스 코치 훅
 * 채팅 상태 관리 및 메시지 전송
 */

import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useState } from 'react';

import { useNetworkStatus } from '../offline';
import { coachLogger } from '../utils/logger';

import {
  sendCoachMessage,
  getMockResponse,
  type CoachMessage,
  type CoachChatResponse,
} from './index';

interface UseCoachResult {
  messages: CoachMessage[];
  isLoading: boolean;
  error: string | null;
  suggestedQuestions: string[];
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

/**
 * AI 코치 채팅 훅
 */
export function useCoach(): UseCoachResult {
  const { getToken } = useAuth();
  const { isConnected } = useNetworkStatus();

  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    '오늘 운동 뭐하면 좋을까?',
    '건강한 간식 추천해줘',
    '스킨케어 루틴 알려줘',
  ]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) return;

      // 사용자 메시지 추가
      const userMessage: CoachMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        let response: CoachChatResponse;

        if (isConnected) {
          // 온라인: API 호출
          const token = await getToken();
          response = await sendCoachMessage(
            message,
            [...messages, userMessage],
            token ?? undefined
          );
        } else {
          // 오프라인: Mock 응답
          response = getMockResponse(message);
        }

        // AI 응답 추가
        const assistantMessage: CoachMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (response.suggestedQuestions) {
          setSuggestedQuestions(response.suggestedQuestions);
        }
      } catch (err) {
        coachLogger.error(' Coach error:', err);
        setError('메시지 전송에 실패했어요. 다시 시도해주세요.');

        // 에러 시 Mock 응답 사용
        const fallbackResponse = getMockResponse(message);
        const fallbackMessage: CoachMessage = {
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
    setSuggestedQuestions([
      '오늘 운동 뭐하면 좋을까?',
      '건강한 간식 추천해줘',
      '스킨케어 루틴 알려줘',
    ]);
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
