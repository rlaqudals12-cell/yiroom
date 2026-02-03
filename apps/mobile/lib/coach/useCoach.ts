/**
 * AI 웰니스 코치 훅
 * 채팅 상태 관리 및 메시지 전송 + DB 저장
 */

import { useAuth, useUser } from '@clerk/clerk-expo';
import { useCallback, useState, useEffect, useRef } from 'react';

import { useNetworkStatus } from '../offline';
import { useClerkSupabaseClient } from '../supabase';
import { coachLogger } from '../utils/logger';

import {
  createCoachSession,
  saveCoachMessage,
  getCoachSessions,
  getSessionMessages,
  type CoachSession,
} from './history';
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
  sessions: CoachSession[];
  currentSessionId: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  loadSession: (sessionId: string) => Promise<void>;
  startNewSession: () => void;
}

/**
 * AI 코치 채팅 훅 (DB 저장 지원)
 */
export function useCoach(): UseCoachResult {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { isConnected } = useNetworkStatus();
  const supabase = useClerkSupabaseClient();

  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    '오늘 운동 뭐하면 좋을까?',
    '건강한 간식 추천해줘',
    '스킨케어 루틴 알려줘',
  ]);
  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // 초기 세션 목록 로드
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (!user?.id || initialLoadDone.current) return;

    const loadSessions = async () => {
      const loadedSessions = await getCoachSessions(supabase, user.id);
      setSessions(loadedSessions);
      initialLoadDone.current = true;
    };

    loadSessions();
  }, [user?.id, supabase]);

  // 특정 세션 로드
  const loadSession = useCallback(
    async (sessionId: string) => {
      setIsLoading(true);
      try {
        const loadedMessages = await getSessionMessages(supabase, sessionId);
        setMessages(loadedMessages);
        setCurrentSessionId(sessionId);
      } catch (err) {
        coachLogger.error('[Coach] Session load error:', err);
        setError('채팅 기록을 불러오는데 실패했어요.');
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  // 새 세션 시작
  const startNewSession = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    setError(null);
    setSuggestedQuestions([
      '오늘 운동 뭐하면 좋을까?',
      '건강한 간식 추천해줘',
      '스킨케어 루틴 알려줘',
    ]);
  }, []);

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

      // 세션이 없으면 새로 생성
      let sessionId = currentSessionId;
      if (!sessionId && user?.id && isConnected) {
        const newSession = await createCoachSession(
          supabase,
          user.id,
          message.trim()
        );
        if (newSession) {
          sessionId = newSession.id;
          setCurrentSessionId(sessionId);
          setSessions((prev) => [newSession, ...prev]);
        }
      }

      // 사용자 메시지 DB 저장
      if (sessionId && isConnected) {
        await saveCoachMessage(supabase, sessionId, 'user', message.trim());
      }

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

        // AI 응답 DB 저장
        if (sessionId && isConnected) {
          await saveCoachMessage(
            supabase,
            sessionId,
            'assistant',
            response.message,
            response.suggestedQuestions
          );
        }

        if (response.suggestedQuestions) {
          setSuggestedQuestions(response.suggestedQuestions);
        }
      } catch (err) {
        coachLogger.error('[Coach] error:', err);
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
    [
      isLoading,
      isConnected,
      getToken,
      messages,
      currentSessionId,
      user?.id,
      supabase,
    ]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
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
    sessions,
    currentSessionId,
    sendMessage,
    clearMessages,
    loadSession,
    startNewSession,
  };
}
