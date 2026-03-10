'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { MilestoneToast } from '@/components/gamification/MilestoneToast';
import { checkNewMilestone, type Milestone } from '@/lib/milestones';

/**
 * 마일스톤 축하 Hook
 * 부담 없는 긍정적 피드백만 제공
 */
export function useMilestone() {
  /**
   * 마일스톤 달성 Toast 표시
   */
  const showMilestoneToast = useCallback((milestone: Milestone) => {
    toast.custom(() => <MilestoneToast milestone={milestone} />, {
      duration: 4000,
      position: 'top-center',
    });
  }, []);

  /**
   * 카운트 변화 시 새 마일스톤 체크 및 축하
   * @param type 마일스톤 유형
   * @param previousCount 이전 카운트
   * @param currentCount 현재 카운트
   * @returns 달성한 마일스톤 (없으면 null)
   */
  const checkAndCelebrate = useCallback(
    (type: Milestone['type'], previousCount: number, currentCount: number): Milestone | null => {
      const newMilestone = checkNewMilestone(type, previousCount, currentCount);

      if (newMilestone) {
        showMilestoneToast(newMilestone);
      }

      return newMilestone;
    },
    [showMilestoneToast]
  );

  return {
    showMilestoneToast,
    checkAndCelebrate,
  };
}

export default useMilestone;
