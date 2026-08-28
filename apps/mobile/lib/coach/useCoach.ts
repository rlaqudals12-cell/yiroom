/**
 * AI 코치 훅
 * 채팅 상태 관리 및 메시지 전송 + DB 저장
 */

import { useAuth, useUser } from '@clerk/clerk-expo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNutritionData } from '../../hooks/useNutritionData';
import { useUserAnalyses } from '../../hooks/useUserAnalyses';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { useNetworkStatus } from '../offline';
import { useClerkSupabaseClient } from '../supabase';
import {
  BEAUTY_COACH_SESSION_CATEGORY,
  LEGACY_COACH_SESSION_CATEGORY,
  createCoachSession,
  getCoachSessions,
  getSessionMessages,
  saveCoachMessage,
  type CoachSessionCategory,
  type CoachSession,
} from './history';
import { coachLogger } from '../utils/logger';

import {
  BEAUTY_TEAM_QUICK_QUESTIONS,
  getMockResponse,
  sendCoachMessage,
  type CoachChatResponse,
  type CoachMessage,
  type UserContext,
} from './index';

export interface UseCoachResult {
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

const LEGACY_INITIAL_QUESTIONS = [
  '오늘 운동 뭐하면 좋을까?',
  '건강한 간식 추천해줘',
  '스킨케어 루틴 알려줘',
];

const BEAUTY_TEAM_INITIAL_QUESTIONS = [...BEAUTY_TEAM_QUICK_QUESTIONS.general];

/** 5축 분석만으로 뷰티팀 컨텍스트를 구성한다. */
function useBeautyAnalysisContext(): UserContext {
  const { personalColor, skinAnalysis, bodyAnalysis, hairAnalysis, makeupAnalysis } =
    useUserAnalyses();

  return useMemo<UserContext>(() => {
    const context: UserContext = {};

    if (personalColor) {
      context.personalColor = { season: personalColor.season, tone: personalColor.tone };
    }
    if (skinAnalysis) {
      context.skinAnalysis = {
        skinType: skinAnalysis.skinType,
        concerns: skinAnalysis.concerns,
      };
    }
    if (bodyAnalysis) {
      context.bodyAnalysis = {
        bodyType: bodyAnalysis.bodyType,
        bmi: bodyAnalysis.bmi,
        height: bodyAnalysis.height,
        weight: bodyAnalysis.weight,
      };
    }
    if (hairAnalysis) {
      context.hairAnalysis = {
        hairType: hairAnalysis.hairType,
        concerns: hairAnalysis.concerns,
      };
    }
    if (makeupAnalysis) {
      // 실재 컬럼만 전송한다. 과거 makeupStyle·colorRecommendations는 존재하지 않았다.
      context.makeupAnalysis = {
        undertone: makeupAnalysis.undertone,
        faceShape: makeupAnalysis.faceShape,
      };
    }

    return context;
  }, [personalColor, skinAnalysis, bodyAnalysis, hairAnalysis, makeupAnalysis]);
}

/**
 * 컨텍스트 종류와 무관한 채팅 상태 정본.
 * 호출자가 만든 컨텍스트만 API·오프라인 응답에 전달한다.
 */
function useCoachState(
  userContext: UserContext,
  initialSuggestedQuestions: readonly string[],
  sessionCategory: CoachSessionCategory
): UseCoachResult {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { isConnected } = useNetworkStatus();
  const supabase = useClerkSupabaseClient();

  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(() => [
    ...initialSuggestedQuestions,
  ]);
  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // 초기 세션 목록 로드
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (!user?.id || initialLoadDone.current) return;

    const loadSessions = async () => {
      const loadedSessions = await getCoachSessions(supabase, user.id, {
        category: sessionCategory,
      });
      setSessions(loadedSessions);
      initialLoadDone.current = true;
    };

    loadSessions();
  }, [user?.id, supabase, sessionCategory]);

  // 특정 세션 로드
  const loadSession = useCallback(
    async (sessionId: string) => {
      setIsLoading(true);
      try {
        const loadedMessages = await getSessionMessages(supabase, sessionId, sessionCategory);
        if (!loadedMessages) {
          setCurrentSessionId(null);
          setError('이 대화 기록을 불러올 수 없어요.');
          return;
        }
        setMessages(loadedMessages);
        setCurrentSessionId(sessionId);
      } catch (err) {
        coachLogger.error('[Coach] Session load error:', err);
        setError('채팅 기록을 불러오는데 실패했어요.');
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, sessionCategory]
  );

  // 새 세션 시작
  const startNewSession = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    setError(null);
    setSuggestedQuestions([...initialSuggestedQuestions]);
  }, [initialSuggestedQuestions]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) return;

      const userMessage: CoachMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message.trim(),
        timestamp: new Date(),
      };

      setMessages((previous) => [...previous, userMessage]);
      setIsLoading(true);
      setError(null);

      let sessionId = currentSessionId;
      if (!sessionId && user?.id && isConnected) {
        const newSession = await createCoachSession(
          supabase,
          user.id,
          message.trim(),
          sessionCategory
        );
        if (newSession) {
          sessionId = newSession.id;
          setCurrentSessionId(sessionId);
          setSessions((previous) => [newSession, ...previous]);
        }
      }

      if (sessionId && isConnected) {
        await saveCoachMessage(supabase, sessionId, 'user', message.trim());
      }

      try {
        let response: CoachChatResponse;

        if (isConnected) {
          const token = await getToken();
          response = await sendCoachMessage(
            message,
            [...messages, userMessage],
            token ?? undefined,
            userContext
          );
        } else {
          response = getMockResponse(message, userContext);
        }

        const assistantMessage: CoachMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
        };

        setMessages((previous) => [...previous, assistantMessage]);

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

        const fallbackResponse = getMockResponse(message, userContext);
        const fallbackMessage: CoachMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fallbackResponse.message,
          timestamp: new Date(),
        };

        setMessages((previous) => [...previous, fallbackMessage]);
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
      userContext,
      sessionCategory,
    ]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    setError(null);
    setSuggestedQuestions([...initialSuggestedQuestions]);
  }, [initialSuggestedQuestions]);

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

/** ADR-114 전속 뷰티팀: 운동·영양 훅을 호출하지 않고 5축 컨텍스트만 전송한다. */
export function useBeautyTeamCoach(): UseCoachResult {
  const beautyContext = useBeautyAnalysisContext();
  return useCoachState(beautyContext, BEAUTY_TEAM_INITIAL_QUESTIONS, BEAUTY_COACH_SESSION_CATEGORY);
}

/** 구형 웰니스 코치 표면. 운동·영양 경로는 보존하되 뷰티팀에서는 호출하지 않는다. */
export function useCoach(): UseCoachResult {
  const beautyContext = useBeautyAnalysisContext();
  const { streak: workoutStreak, analysis: workoutAnalysis, todayWorkout } = useWorkoutData();
  const { settings: nutritionSettings, streak: nutritionStreak } = useNutritionData();

  const userContext = useMemo<UserContext>(() => {
    const context: UserContext = { ...beautyContext };

    if (workoutStreak || workoutAnalysis) {
      context.workout = {
        streak: workoutStreak?.currentStreak,
        workoutType: workoutAnalysis?.workoutType,
        goal: workoutAnalysis?.goals?.[0],
        fitnessLevel: workoutAnalysis?.fitnessLevel,
      };
    }
    if (nutritionSettings || nutritionStreak) {
      context.nutrition = {
        targetCalories: nutritionSettings?.dailyCalorieGoal,
        streak: nutritionStreak?.currentStreak,
      };
    }
    if (todayWorkout) {
      context.recentActivity = {
        todayWorkout: todayWorkout.exercises
          ?.map((exercise: { name: string }) => exercise.name)
          .join(', '),
      };
    }

    return context;
  }, [
    beautyContext,
    workoutStreak,
    workoutAnalysis,
    todayWorkout,
    nutritionSettings,
    nutritionStreak,
  ]);

  return useCoachState(userContext, LEGACY_INITIAL_QUESTIONS, LEGACY_COACH_SESSION_CATEGORY);
}
