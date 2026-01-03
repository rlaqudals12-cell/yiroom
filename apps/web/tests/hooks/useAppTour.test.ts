import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppTour, DEFAULT_APP_TOUR_STEPS, type AppTourStep } from '@/hooks/useAppTour';

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

describe('useAppTour', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('초기 상태', () => {
    it('기본 스텝을 사용한다', () => {
      const { result } = renderHook(() => useAppTour({ autoStart: false }));

      expect(result.current.totalSteps).toBe(DEFAULT_APP_TOUR_STEPS.length);
    });

    it('커스텀 스텝을 사용할 수 있다', () => {
      const customSteps: AppTourStep[] = [
        { id: 'step1', title: 'Step 1', description: 'Description 1', targetSelector: '#target1' },
        { id: 'step2', title: 'Step 2', description: 'Description 2', targetSelector: '#target2' },
      ];

      const { result } = renderHook(() => useAppTour({ steps: customSteps, autoStart: false }));

      expect(result.current.totalSteps).toBe(2);
    });

    it('완료되지 않은 상태에서 autoStart=true면 자동 시작', () => {
      const { result } = renderHook(() => useAppTour({ autoStart: true }));

      expect(result.current.isActive).toBe(true);
      expect(result.current.isCompleted).toBe(false);
    });

    it('autoStart=false면 자동 시작하지 않음', () => {
      const { result } = renderHook(() => useAppTour({ autoStart: false }));

      expect(result.current.isActive).toBe(false);
    });

    it('이미 완료된 상태면 시작하지 않음', () => {
      mockLocalStorage.setItem('yiroom_app_tour_completed', 'true');

      const { result } = renderHook(() => useAppTour({ autoStart: true }));

      expect(result.current.isCompleted).toBe(true);
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('네비게이션', () => {
    it('nextStep으로 다음 스텝으로 이동', () => {
      const { result } = renderHook(() => useAppTour({ autoStart: true }));

      expect(result.current.currentStepIndex).toBe(0);

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStepIndex).toBe(1);
    });

    it('prevStep으로 이전 스텝으로 이동', () => {
      const { result } = renderHook(() => useAppTour({ autoStart: true }));

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
      const { result } = renderHook(() => useAppTour({ autoStart: true }));

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStepIndex).toBe(0);
    });

    it('goToStep으로 특정 스텝으로 이동', () => {
      const { result } = renderHook(() => useAppTour({ autoStart: true }));

      act(() => {
        result.current.goToStep(3);
      });

      expect(result.current.currentStepIndex).toBe(3);
    });

    it('goToStep 범위 외 값은 무시', () => {
      const { result } = renderHook(() => useAppTour({ autoStart: true }));

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
      const customSteps: AppTourStep[] = [
        { id: 'step1', title: 'Step 1', description: 'Description 1', targetSelector: '#target1' },
        { id: 'step2', title: 'Step 2', description: 'Description 2', targetSelector: '#target2' },
      ];

      const { result } = renderHook(() => useAppTour({ steps: customSteps, autoStart: true }));

      act(() => {
        result.current.nextStep(); // step1 -> step2
      });

      act(() => {
        result.current.nextStep(); // step2 -> complete
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.isCompleted).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('yiroom_app_tour_completed', 'true');
    });

    it('skipTour로 스킵 가능', () => {
      const { result } = renderHook(() => useAppTour({ autoStart: true }));

      act(() => {
        result.current.skipTour();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.isCompleted).toBe(true);
    });

    it('completeTour로 완료 처리', () => {
      const { result } = renderHook(() => useAppTour({ autoStart: true }));

      act(() => {
        result.current.completeTour();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.isCompleted).toBe(true);
    });
  });

  describe('투어 재시작', () => {
    it('startTour로 수동 시작', () => {
      mockLocalStorage.setItem('yiroom_app_tour_completed', 'true');

      const { result } = renderHook(() => useAppTour({ autoStart: false }));

      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.startTour();
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.currentStepIndex).toBe(0);
    });

    it('resetTour로 완료 상태 초기화', () => {
      mockLocalStorage.setItem('yiroom_app_tour_completed', 'true');

      const { result } = renderHook(() => useAppTour({ autoStart: false }));

      act(() => {
        result.current.resetTour();
      });

      expect(result.current.isCompleted).toBe(false);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('yiroom_app_tour_completed');
    });
  });

  describe('현재 스텝', () => {
    it('활성화되면 currentStep 반환', () => {
      const { result } = renderHook(() => useAppTour({ autoStart: true }));

      expect(result.current.currentStep).not.toBeNull();
      expect(result.current.currentStep?.id).toBe(DEFAULT_APP_TOUR_STEPS[0].id);
    });

    it('비활성화되면 currentStep은 null', () => {
      const { result } = renderHook(() => useAppTour({ autoStart: false }));

      expect(result.current.currentStep).toBeNull();
    });
  });

  describe('스텝 저장', () => {
    it('현재 스텝을 localStorage에 저장', () => {
      const { result } = renderHook(() => useAppTour({ autoStart: true }));

      act(() => {
        result.current.nextStep();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('yiroom_app_tour_current_step', '1');
    });

    it('저장된 스텝에서 복원', () => {
      mockLocalStorage.setItem('yiroom_app_tour_current_step', '2');

      const { result } = renderHook(() => useAppTour({ autoStart: true }));

      expect(result.current.currentStepIndex).toBe(2);
    });
  });

  describe('분석 섹션 스텝', () => {
    it('분석 섹션 스텝이 포함되어 있다', () => {
      const analysisStep = DEFAULT_APP_TOUR_STEPS.find((step) => step.id === 'analysis-section');

      expect(analysisStep).toBeDefined();
      expect(analysisStep?.targetSelector).toBe('[data-tutorial="analysis"]');
    });
  });
});
