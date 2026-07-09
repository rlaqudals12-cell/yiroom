'use client';

/**
 * 내 피부 목표 상태 훅 (ADR-117 루틴 v2)
 *
 * - 마운트 시 GET /api/user/skin-goals 로 초기 선택 로드
 * - toggle 시 낙관적 업데이트 → PATCH 저장 → 실패 시 롤백 + 토스트
 *
 * 엔진(SKIN_GOALS) 미배포 시 goals=[] → 소비 컴포넌트가 스스로 미노출.
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { SKIN_GOALS, type SkinGoal, type SkinGoalId } from './routine-v2-contract';

export interface UseSkinGoalsResult {
  goals: SkinGoal[];
  selected: SkinGoalId[];
  loaded: boolean;
  toggle: (id: SkinGoalId) => void;
}

// 유효 목표 id 집합 — 서버가 폐기된 id를 돌려줘도 걸러낸다(SKIN_GOALS 비어있으면 통과).
const VALID_IDS = new Set<SkinGoalId>(SKIN_GOALS.map((g) => g.id));

export function useSkinGoals(): UseSkinGoalsResult {
  const [selected, setSelected] = useState<SkinGoalId[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const res = await fetch('/api/user/skin-goals');
        if (res.ok) {
          const data = await res.json();
          const raw = Array.isArray(data?.goals) ? (data.goals as SkinGoalId[]) : [];
          const next = raw.filter((g) => VALID_IDS.size === 0 || VALID_IDS.has(g));
          if (!cancelled) setSelected(next);
        }
      } catch {
        /* 조회 실패 — 선택 없음으로 시작 (엔진/네트워크 미준비) */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(
    (id: SkinGoalId) => {
      const prev = selected;
      const next = prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id];

      // 낙관적 업데이트
      setSelected(next);

      // 저장 — 실패 시 이전 상태로 롤백 + 토스트
      fetch('/api/user/skin-goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals: next }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('save failed');
        })
        .catch(() => {
          setSelected(prev);
          toast.error('피부 목표를 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
        });
    },
    [selected]
  );

  return { goals: SKIN_GOALS, selected, loaded, toggle };
}
