/**
 * 분석 결과 페이지용 ConnectionAwareness 노출 훅
 *
 * @module hooks/useConnectionExposure
 * @description 분석 결과 조회 시 자동으로 관련 연결을 노출 기록하고,
 *              사용자 확인("이해했어요") 인터렉션을 제공
 *
 * @example
 * ```tsx
 * const { depth, isConfirmed, confirm } = useConnectionExposure({
 *   connectionId: 'skin_care::personal_color_skin',
 *   sourceModule: 'skin',
 *   targetDomain: 'personal-color',
 *   connectionRule: '피부 분석 + 퍼스널컬러 기반 — 스킨케어 추천',
 * });
 * ```
 */

import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState, useCallback } from 'react';

import type { ConnectionStatus, ExplanationDepth, ExposeRequest } from '@/lib/connection-awareness';
import {
  exposeConnection,
  confirmConnection,
  getExplanationDepth,
} from '@/lib/connection-awareness';
import { useClerkSupabaseClient } from '@/lib/supabase';

interface UseConnectionExposureResult {
  /** 현재 내재화 상태 */
  status: ConnectionStatus;
  /** 설명 깊이 (UI 분기용) */
  depth: ExplanationDepth;
  /** 사용자가 이번 세션에서 확인했는지 */
  isConfirmed: boolean;
  /** 노출 횟수 */
  exposureCount: number;
  /** 확인 핸들러 */
  confirm: () => Promise<void>;
}

export function useConnectionExposure(request: ExposeRequest): UseConnectionExposureResult {
  const supabase = useClerkSupabaseClient();
  const { user } = useUser();
  const userId = user?.id;

  const [status, setStatus] = useState<ConnectionStatus>('exposed');
  const [exposureCount, setExposureCount] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // 마운트 시 노출 기록
  useEffect(() => {
    if (!userId) return;

    async function expose(): Promise<void> {
      try {
        const response = await exposeConnection(supabase, userId!, request);
        setStatus(response.status);
        setExposureCount(response.exposureCount);
      } catch {
        // 노출 실패해도 UI 정상 동작
      }
    }

    expose();
    // connectionId가 바뀔 때만 재실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, request.connectionId]);

  const confirm = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await confirmConnection(supabase, userId, request.connectionId);
      setStatus(response.status);
      setIsConfirmed(true);
    } catch {
      // 확인 실패 시 무시
    }
  }, [userId, supabase, request.connectionId]);

  return {
    status,
    depth: getExplanationDepth(status),
    isConfirmed,
    exposureCount,
    confirm,
  };
}
