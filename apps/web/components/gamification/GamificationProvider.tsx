'use client';

import { createContext, useContext, ReactNode } from 'react';
import {
  useGamificationNotification,
  type GamificationResult,
} from '@/hooks/useGamificationNotification';
import { LevelUpModal } from './LevelUpModal';
import type { BadgeAwardResult, LevelUpResult } from '@/types/gamification';

/**
 * 게이미피케이션 Context 타입
 */
interface GamificationContextType {
  showBadgeToast: (result: BadgeAwardResult) => void;
  showLevelUpModal: (result: LevelUpResult) => void;
  processGamificationResult: (result: GamificationResult) => void;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

/**
 * 게이미피케이션 알림 Provider
 * 앱 전역에서 배지 획득 Toast와 레벨업 모달 사용 가능
 */
export function GamificationProvider({ children }: { children: ReactNode }) {
  const {
    levelUpResult,
    isLevelUpModalOpen,
    showBadgeToast,
    showLevelUpModal,
    closeLevelUpModal,
    processGamificationResult,
  } = useGamificationNotification();

  return (
    <GamificationContext.Provider
      value={{
        showBadgeToast,
        showLevelUpModal,
        processGamificationResult,
      }}
    >
      {children}

      {/* 레벨업 모달 (전역) */}
      {levelUpResult && (
        <LevelUpModal
          result={levelUpResult}
          isOpen={isLevelUpModalOpen}
          onClose={closeLevelUpModal}
        />
      )}
    </GamificationContext.Provider>
  );
}

/**
 * 게이미피케이션 알림 Context 사용 Hook
 */
export function useGamification() {
  const context = useContext(GamificationContext);

  if (!context) {
    throw new Error('useGamification must be used within GamificationProvider');
  }

  return context;
}

export default GamificationProvider;
