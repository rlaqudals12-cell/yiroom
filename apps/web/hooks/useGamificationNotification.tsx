'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { BadgeToast } from '@/components/gamification/BadgeToast';
import type { BadgeAwardResult, LevelUpResult } from '@/types/gamification';

/**
 * 게이미피케이션 알림 결과 타입
 * API 응답에서 gamification 필드 구조
 */
export interface GamificationResult {
  badgeResults?: BadgeAwardResult[];
  xpAwarded?: number;
  xpResult?: LevelUpResult | null;
  levelUpResult?: LevelUpResult | null;
}

/**
 * 레벨업 여부 확인 (레벨이 증가했는지)
 */
function didLevelUp(result: LevelUpResult): boolean {
  return result.newLevel > result.previousLevel;
}

/**
 * 게이미피케이션 알림 Hook
 * 배지 획득 Toast + 레벨업 모달 상태 관리
 */
export function useGamificationNotification() {
  const [levelUpResult, setLevelUpResult] = useState<LevelUpResult | null>(null);
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);

  /**
   * 배지 획득 Toast 표시
   */
  const showBadgeToast = useCallback((result: BadgeAwardResult) => {
    if (!result.success || result.alreadyOwned || !result.badge) return;

    toast.custom(
      () => <BadgeToast badge={result.badge} />,
      {
        duration: 4000,
        position: 'top-center',
      }
    );
  }, []);

  /**
   * 레벨업 모달 표시
   */
  const showLevelUpModal = useCallback((result: LevelUpResult) => {
    // 레벨이 실제로 올랐는지 확인
    if (!didLevelUp(result)) return;

    setLevelUpResult(result);
    setIsLevelUpModalOpen(true);
  }, []);

  /**
   * 레벨업 모달 닫기
   */
  const closeLevelUpModal = useCallback(() => {
    setIsLevelUpModalOpen(false);
    setLevelUpResult(null);
  }, []);

  /**
   * API 응답의 gamification 결과 처리
   * - 배지 획득 시 Toast 표시
   * - 레벨업 시 모달 표시
   */
  const processGamificationResult = useCallback(
    (result: GamificationResult) => {
      // 배지 획득 Toast 표시
      if (result.badgeResults) {
        result.badgeResults.forEach((badgeResult) => {
          showBadgeToast(badgeResult);
        });
      }

      // 레벨업 모달 표시 (xpResult 또는 levelUpResult에서)
      const levelResult = result.xpResult || result.levelUpResult;
      if (levelResult && didLevelUp(levelResult)) {
        // 배지 Toast가 먼저 보이도록 약간 딜레이
        setTimeout(() => {
          showLevelUpModal(levelResult);
        }, 500);
      }

      // XP 획득 알림 (레벨업이 아닐 때)
      const isLevelUp = levelResult && didLevelUp(levelResult);
      if (result.xpAwarded && result.xpAwarded > 0 && !isLevelUp) {
        toast.success(`+${result.xpAwarded} XP 획득!`, {
          duration: 2000,
          position: 'top-center',
        });
      }
    },
    [showBadgeToast, showLevelUpModal]
  );

  return {
    // 상태
    levelUpResult,
    isLevelUpModalOpen,

    // 액션
    showBadgeToast,
    showLevelUpModal,
    closeLevelUpModal,
    processGamificationResult,
  };
}

export default useGamificationNotification;
