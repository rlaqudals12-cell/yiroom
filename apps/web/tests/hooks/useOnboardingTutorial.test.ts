import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useOnboardingTutorial,
  DEFAULT_TUTORIAL_STEPS,
  type TutorialStep,
} from '@/hooks/useOnboardingTutorial';

// localStorage 모킹
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useOnboardingTutorial', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('초기 상태', () => {
    it('기본 스텝을 사용한다', () => {
      const { result } = renderHook(() => useOnboardingTutorial({ autoStart: false }));

      expect(result.current.totalSteps).toBe(DEFAULT_TUTORIAL_STEPS.length);
    });

    it('커스텀 스텝을 사용할 수 있다', () => {
      const customSteps: TutorialStep[] = [
        { id: 'step1', title: 'Step 1', description: 'Description 1' },
        { id: 'step2', title: 'Step 2', description: 'Description 2' },
      ];

      const { result } = renderHook(() =>
        useOnboardingTutorial({ steps: customSteps, autoStart: false })
      );

      expect(result.current.totalSteps).toBe(2);
    });

    it('완료되지 않은 상태에서 autoStart=true면 자동 시작', () => {
      const { result } = renderHook(() => useOnboardingTutorial({ autoStart: true }));

      expect(result.current.isActive).toBe(true);
      expect(result.current.isCompleted).toBe(false);
    });

    it('autoStart=false면 자동 시작하지 않음', () => {
      const { result } = renderHook(() => useOnboardingTutorial({ autoStart: false }));

      expect(result.current.isActive).toBe(false);
    });

    it('이미 완료된 상태면 시작하지 않음', () => {
      mockLocalStorage.setItem('yiroom_onboarding_completed', 'true');

      const { result } = renderHook(() => useOnboardingTutorial({ autoStart: true }));

      expect(result.current.isCompleted).toBe(true);
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('네비게이션', () => {
    it('nextStep으로 다음 스텝으로 이동', () => {
      const { result } = renderHook(() => useOnboardingTutorial({ autoStart: true }));

      expect(result.current.currentStepIndex).toBe(0);

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStepIndex).toBe(1);
    });

    it('prevStep으로 이전 스텝으로 이동', () => {
      const { result } = renderHook(() => useOnboardingTutorial({ autoStart: true }));

      act(() => {
        result.current.nextStep();
        result.current.nextStep();
      });

      expect(result.current.currentStepIndex).toBe(2);

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStepIndex).toBe(1);
    });

    it('첫 스텝에서 prevStep은 무시됨', () => {
      const { result } = renderHook(() => useOnboardingTutorial({ autoStart: true }));

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStepIndex).toBe(0);
    });

    it('goToStep으로 특정 스텝으로 이동', () => {
      const { result } = renderHook(() => useOnboardingTutorial({ autoStart: true }));

      act(() => {
        result.current.goToStep(3);
      });

      expect(result.current.currentStepIndex).toBe(3);
    });

    it('goToStep 범위 외 값은 무시', () => {
      const { result } = renderHook(() => useOnboardingTutorial({ autoStart: true }));

      act(() => {
        result.current.goToStep(100);
      });

      expect(result.current.currentStepIndex).toBe(0);

      act(() => {
        result.current.goToStep(-1);
      });

      expect(result.current.currentStepIndex).toBe(0);
    });
  });

  describe('완료 및 스킵', () => {
    it('마지막 스텝에서 nextStep하면 완료', () => {
      const customSteps: TutorialStep[] = [
        { id: 'step1', title: 'Step 1', description: 'Description 1' },
        { id: 'step2', title: 'Step 2', description: 'Description 2' },
      ];

      const { result } = renderHook(() =>
        useOnboardingTutorial({ steps: customSteps, autoStart: true })
      );

      // 별도의 act 블록으로 분리하여 상태 업데이트 반영
      act(() => {
        result.current.nextStep(); // step1 -> step2
      });

      act(() => {
        result.current.nextStep(); // step2 -> complete
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.isCompleted).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'yiroom_onboarding_completed',
        'true'
      );
    });

    it('skipTutorial로 스킵 가능', () => {
      const { result } = renderHook(() => useOnboardingTutorial({ autoStart: true }));

      act(() => {
        result.current.skipTutorial();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.isCompleted).toBe(true);
    });

    it('completeTutorial로 완료 처리', () => {
      const { result } = renderHook(() => useOnboardingTutorial({ autoStart: true }));

      act(() => {
        result.current.completeTutorial();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.isCompleted).toBe(true);
    });
  });

  describe('튜토리얼 재시작', () => {
    it('startTutorial로 수동 시작', () => {
      mockLocalStorage.setItem('yiroom_onboarding_completed', 'true');

      const { result } = renderHook(() => useOnboardingTutorial({ autoStart: false }));

      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.startTutorial();
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.currentStepIndex).toBe(0);
    });

    it('resetTutorial로 완료 상태 초기화', () => {
      mockLocalStorage.setItem('yiroom_onboarding_completed', 'true');

      const { result } = renderHook(() => useOnboardingTutorial({ autoStart: false }));

      act(() => {
        result.current.resetTutorial();
      });

      expect(result.current.isCompleted).toBe(false);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'yiroom_onboarding_completed'
      );
    });
  });

  describe('현재 스텝', () => {
    it('활성화되면 currentStep 반환', () => {
      const { result } = renderHook(() => useOnboardingTutorial({ autoStart: true }));

      expect(result.current.currentStep).not.toBeNull();
      expect(result.current.currentStep?.id).toBe(DEFAULT_TUTORIAL_STEPS[0].id);
    });

    it('비활성화되면 currentStep은 null', () => {
      const { result } = renderHook(() => useOnboardingTutorial({ autoStart: false }));

      expect(result.current.currentStep).toBeNull();
    });
  });

  describe('스텝 저장', () => {
    it('현재 스텝을 localStorage에 저장', () => {
      const { result } = renderHook(() => useOnboardingTutorial({ autoStart: true }));

      act(() => {
        result.current.nextStep();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'yiroom_onboarding_current_step',
        '1'
      );
    });

    it('저장된 스텝에서 복원', () => {
      mockLocalStorage.setItem('yiroom_onboarding_current_step', '2');

      const { result } = renderHook(() => useOnboardingTutorial({ autoStart: true }));

      expect(result.current.currentStepIndex).toBe(2);
    });
  });
});
