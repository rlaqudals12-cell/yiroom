/**
 * 앱 투어 훅 테스트
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTour } from '@/lib/app-tour/useAppTour';

// AsyncStorage 모킹
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('useAppTour', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('초기화', () => {
    it('초기 상태가 올바라야 함', async () => {
      const { result } = renderHook(() => useAppTour());

      await waitFor(() => {
        expect(result.current.isActive).toBe(false);
        expect(result.current.currentStepIndex).toBe(0);
        expect(result.current.isCompleted).toBe(false);
      });
    });

    it('이전에 완료한 경우 isCompleted가 true여야 함', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

      const { result } = renderHook(() => useAppTour());

      await waitFor(() => {
        expect(result.current.isCompleted).toBe(true);
      });
    });
  });

  describe('startTour', () => {
    it('투어를 시작해야 함', async () => {
      const { result } = renderHook(() => useAppTour());

      await waitFor(() => {
        expect(result.current.isActive).toBe(false);
      });

      act(() => {
        result.current.startTour();
      });

      await waitFor(() => {
        expect(result.current.isActive).toBe(true);
        expect(result.current.currentStepIndex).toBe(0);
      });
    });
  });

  describe('nextStep', () => {
    it('다음 스텝으로 이동해야 함', async () => {
      const { result } = renderHook(() => useAppTour());

      act(() => {
        result.current.startTour();
      });

      await waitFor(() => {
        expect(result.current.currentStepIndex).toBe(0);
      });

      act(() => {
        result.current.nextStep();
      });

      await waitFor(() => {
        expect(result.current.currentStepIndex).toBe(1);
      });
    });

    it('마지막 스텝에서 완료 처리해야 함', async () => {
      const { result } = renderHook(() => useAppTour());

      act(() => {
        result.current.startTour();
      });

      // 마지막 스텝으로 이동
      const totalSteps = result.current.totalSteps;
      for (let i = 0; i < totalSteps - 1; i++) {
        act(() => {
          result.current.nextStep();
        });
      }

      await waitFor(() => {
        expect(result.current.currentStepIndex).toBe(totalSteps - 1);
      });

      act(() => {
        result.current.nextStep();
      });

      await waitFor(() => {
        expect(result.current.isActive).toBe(false);
        expect(result.current.isCompleted).toBe(true);
      });
    });
  });

  describe('prevStep', () => {
    it('이전 스텝으로 이동해야 함', async () => {
      const { result } = renderHook(() => useAppTour());

      act(() => {
        result.current.startTour();
        result.current.nextStep();
      });

      await waitFor(() => {
        expect(result.current.currentStepIndex).toBe(1);
      });

      act(() => {
        result.current.prevStep();
      });

      await waitFor(() => {
        expect(result.current.currentStepIndex).toBe(0);
      });
    });

    it('첫 스텝에서는 이동하지 않아야 함', async () => {
      const { result } = renderHook(() => useAppTour());

      act(() => {
        result.current.startTour();
      });

      await waitFor(() => {
        expect(result.current.currentStepIndex).toBe(0);
      });

      act(() => {
        result.current.prevStep();
      });

      await waitFor(() => {
        expect(result.current.currentStepIndex).toBe(0);
      });
    });
  });

  describe('skipTour', () => {
    it('투어를 건너뛰어야 함', async () => {
      const { result } = renderHook(() => useAppTour());

      act(() => {
        result.current.startTour();
      });

      await waitFor(() => {
        expect(result.current.isActive).toBe(true);
      });

      act(() => {
        result.current.skipTour();
      });

      await waitFor(() => {
        expect(result.current.isActive).toBe(false);
        expect(result.current.isCompleted).toBe(true);
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('completeTour', () => {
    it('투어를 완료하고 저장해야 함', async () => {
      const { result } = renderHook(() => useAppTour());

      act(() => {
        result.current.startTour();
      });

      await waitFor(() => {
        expect(result.current.isActive).toBe(true);
      });

      act(() => {
        result.current.completeTour();
      });

      await waitFor(() => {
        expect(result.current.isActive).toBe(false);
        expect(result.current.isCompleted).toBe(true);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          expect.any(String),
          'true'
        );
      });
    });
  });

  describe('resetTour', () => {
    it('투어를 초기화해야 함', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
      const { result } = renderHook(() => useAppTour());

      await waitFor(() => {
        expect(result.current.isCompleted).toBe(true);
      });

      act(() => {
        result.current.resetTour();
      });

      await waitFor(() => {
        expect(result.current.isCompleted).toBe(false);
        expect(result.current.currentStepIndex).toBe(0);
        expect(AsyncStorage.removeItem).toHaveBeenCalled();
      });
    });
  });

  describe('goToStep', () => {
    it('특정 스텝으로 이동해야 함', async () => {
      const { result } = renderHook(() => useAppTour());

      act(() => {
        result.current.startTour();
      });

      await waitFor(() => {
        expect(result.current.currentStepIndex).toBe(0);
      });

      act(() => {
        result.current.goToStep(2);
      });

      await waitFor(() => {
        expect(result.current.currentStepIndex).toBe(2);
      });
    });

    it('범위를 벗어난 스텝은 무시해야 함', async () => {
      const { result } = renderHook(() => useAppTour());

      act(() => {
        result.current.startTour();
      });

      await waitFor(() => {
        expect(result.current.currentStepIndex).toBe(0);
      });

      act(() => {
        result.current.goToStep(100);
      });

      await waitFor(() => {
        expect(result.current.currentStepIndex).toBe(0);
      });

      act(() => {
        result.current.goToStep(-1);
      });

      await waitFor(() => {
        expect(result.current.currentStepIndex).toBe(0);
      });
    });
  });

  describe('currentStep', () => {
    it('현재 스텝 정보를 반환해야 함', async () => {
      const { result } = renderHook(() => useAppTour());

      act(() => {
        result.current.startTour();
      });

      await waitFor(() => {
        expect(result.current.currentStep).toBeDefined();
        expect(result.current.currentStep?.id).toBeDefined();
        expect(result.current.currentStep?.title).toBeDefined();
        expect(result.current.currentStep?.description).toBeDefined();
      });
    });
  });
});
