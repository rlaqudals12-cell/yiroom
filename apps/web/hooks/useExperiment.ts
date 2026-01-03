'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import type { ExperimentAssignment, Variant } from '@/lib/experiments/types';

interface UseExperimentOptions {
  /** 실험 키 */
  experimentKey: string;
  /** 로드 중 기본 변형 */
  defaultVariant?: string;
}

interface UseExperimentReturn {
  /** 할당된 변형 */
  variant: string | null;
  /** 변형 설정 */
  config: Record<string, unknown>;
  /** 로딩 중 */
  isLoading: boolean;
  /** 에러 */
  error: Error | null;
  /** 노출 이벤트 전송 */
  trackExposure: (eventType: 'impression' | 'interaction' | 'conversion') => void;
}

/**
 * A/B 테스트 실험 훅
 * 사용자를 실험 변형에 할당하고 노출 추적
 */
export function useExperiment({
  experimentKey,
  defaultVariant = 'control',
}: UseExperimentOptions): UseExperimentReturn {
  const { user, isLoaded } = useUser();
  const [assignment, setAssignment] = useState<ExperimentAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 세션 ID 생성 (비로그인 사용자용)
  const getSessionId = useCallback((): string => {
    if (typeof window === 'undefined') return '';

    let sessionId = sessionStorage.getItem('experiment_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem('experiment_session_id', sessionId);
    }
    return sessionId;
  }, []);

  // 실험 할당 가져오기
  useEffect(() => {
    if (!isLoaded) return;

    const fetchAssignment = async () => {
      try {
        setIsLoading(true);
        const userId = user?.id || getSessionId();

        const response = await fetch('/api/experiments/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            experimentKey,
            userId,
            sessionId: user?.id ? undefined : getSessionId(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch experiment assignment');
        }

        const data = await response.json();
        setAssignment(data.assignment);
      } catch (err) {
        console.error('[useExperiment] Error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignment();
  }, [experimentKey, user?.id, isLoaded, getSessionId]);

  // 노출 이벤트 전송
  const trackExposure = useCallback(
    async (eventType: 'impression' | 'interaction' | 'conversion') => {
      if (!assignment) return;

      try {
        await fetch('/api/experiments/exposure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            experimentKey,
            variantId: assignment.variantId,
            eventType,
          }),
        });
      } catch (err) {
        console.error('[useExperiment] Track exposure error:', err);
      }
    },
    [experimentKey, assignment]
  );

  return {
    variant: assignment?.variantName ?? (isLoading ? defaultVariant : null),
    config: assignment?.config ?? {},
    isLoading,
    error,
    trackExposure,
  };
}

export default useExperiment;
