/**
 * useGamificationNotification Hook 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGamificationNotification } from '@/hooks/useGamificationNotification';
import type { Badge, BadgeAwardResult, LevelUpResult } from '@/types/gamification';

// sonner mock
vi.mock('sonner', () => ({
  toast: {
    custom: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock 배지 데이터
const mockBadge: Badge = {
  id: 'badge-1',
  code: 'workout_streak_7day',
  name: '7일 연속 운동',
  description: '7일 연속으로 운동을 완료했습니다.',
  icon: '🔥',
  category: 'streak',
  rarity: 'common',
  requirement: {
    type: 'streak',
    domain: 'workout',
    days: 7,
  },
  xpReward: 25,
  sortOrder: 1,
  createdAt: new Date(),
};

// Mock 배지 획득 결과
const mockBadgeResult: BadgeAwardResult = {
  success: true,
  badge: mockBadge,
  alreadyOwned: false,
  xpAwarded: 25,
};

// Mock 레벨업 결과
const mockLevelUpResult: LevelUpResult = {
  previousLevel: 1,
  newLevel: 2,
  previousTier: 'beginner',
  newTier: 'beginner',
  tierChanged: false,
  xpGained: 100,
  totalXp: 100,
};

describe('useGamificationNotification', () => {
  it('초기 상태가 올바르다', () => {
    const { result } = renderHook(() => useGamificationNotification());

    expect(result.current.levelUpResult).toBeNull();
    expect(result.current.isLevelUpModalOpen).toBe(false);
  });

  it('showLevelUpModal이 레벨업 모달을 열 수 있다', () => {
    const { result } = renderHook(() => useGamificationNotification());

    act(() => {
      result.current.showLevelUpModal(mockLevelUpResult);
    });

    expect(result.current.isLevelUpModalOpen).toBe(true);
    expect(result.current.levelUpResult).toEqual(mockLevelUpResult);
  });

  it('레벨이 증가하지 않으면 모달을 열지 않는다', () => {
    const { result } = renderHook(() => useGamificationNotification());

    const noLevelUp: LevelUpResult = {
      ...mockLevelUpResult,
      previousLevel: 2,
      newLevel: 2,
    };

    act(() => {
      result.current.showLevelUpModal(noLevelUp);
    });

    expect(result.current.isLevelUpModalOpen).toBe(false);
    expect(result.current.levelUpResult).toBeNull();
  });

  it('closeLevelUpModal이 모달을 닫는다', () => {
    const { result } = renderHook(() => useGamificationNotification());

    // 먼저 모달 열기
    act(() => {
      result.current.showLevelUpModal(mockLevelUpResult);
    });

    expect(result.current.isLevelUpModalOpen).toBe(true);

    // 모달 닫기
    act(() => {
      result.current.closeLevelUpModal();
    });

    expect(result.current.isLevelUpModalOpen).toBe(false);
    expect(result.current.levelUpResult).toBeNull();
  });

  it('processGamificationResult가 배지 결과를 처리한다', async () => {
    const { toast } = await import('sonner');
    const { result } = renderHook(() => useGamificationNotification());

    act(() => {
      result.current.processGamificationResult({
        badgeResults: [mockBadgeResult],
        xpAwarded: 25,
      });
    });

    // toast.custom이 호출되었는지 확인
    expect(toast.custom).toHaveBeenCalled();
  });

  it('이미 소유한 배지는 Toast를 표시하지 않는다', async () => {
    const { toast } = await import('sonner');
    vi.clearAllMocks();

    const { result } = renderHook(() => useGamificationNotification());

    const alreadyOwnedResult: BadgeAwardResult = {
      ...mockBadgeResult,
      alreadyOwned: true,
    };

    act(() => {
      result.current.showBadgeToast(alreadyOwnedResult);
    });

    expect(toast.custom).not.toHaveBeenCalled();
  });

  it('실패한 배지 결과는 Toast를 표시하지 않는다', async () => {
    const { toast } = await import('sonner');
    vi.clearAllMocks();

    const { result } = renderHook(() => useGamificationNotification());

    const failedResult: BadgeAwardResult = {
      ...mockBadgeResult,
      success: false,
    };

    act(() => {
      result.current.showBadgeToast(failedResult);
    });

    expect(toast.custom).not.toHaveBeenCalled();
  });

  it('레벨업 없이 XP 획득 시 success toast를 표시한다', async () => {
    const { toast } = await import('sonner');
    vi.clearAllMocks();

    const { result } = renderHook(() => useGamificationNotification());

    act(() => {
      result.current.processGamificationResult({
        xpAwarded: 10,
      });
    });

    expect(toast.success).toHaveBeenCalledWith('+10 XP 획득!', expect.any(Object));
  });

  it('레벨업 시 XP success toast를 표시하지 않는다', async () => {
    const { toast } = await import('sonner');
    vi.clearAllMocks();

    const { result } = renderHook(() => useGamificationNotification());

    act(() => {
      result.current.processGamificationResult({
        xpAwarded: 100,
        xpResult: mockLevelUpResult,
      });
    });

    // success toast는 호출되지 않음 (레벨업 시)
    expect(toast.success).not.toHaveBeenCalled();
  });
});
