/**
 * useHapticFeedback 훅 테스트
 *
 * expo-haptics의 각 피드백 타입(impact, notification, selection)이
 * 올바른 인자로 호출되는지 검증.
 * expo-haptics는 jest.setup.js에서 자동 모킹됨.
 */

import { renderHook, act } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { useHapticFeedback } from '../../hooks/useHapticFeedback';

describe('useHapticFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('impact 피드백', () => {
    it('light()이 Haptics.impactAsync를 Light 스타일로 호출해야 한다', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.light();
      });

      expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });

    it('medium()이 Haptics.impactAsync를 Medium 스타일로 호출해야 한다', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.medium();
      });

      expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Medium
      );
    });

    it('heavy()가 Haptics.impactAsync를 Heavy 스타일로 호출해야 한다', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.heavy();
      });

      expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Heavy
      );
    });
  });

  describe('notification 피드백', () => {
    it('success()가 Haptics.notificationAsync를 Success 타입으로 호출해야 한다', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.success();
      });

      expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });

    it('warning()이 Haptics.notificationAsync를 Warning 타입으로 호출해야 한다', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.warning();
      });

      expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Warning
      );
    });

    it('error()가 Haptics.notificationAsync를 Error 타입으로 호출해야 한다', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.error();
      });

      expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Error
      );
    });
  });

  describe('selection 피드백', () => {
    it('selection()이 Haptics.selectionAsync를 호출해야 한다', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.selection();
      });

      expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('함수 안정성', () => {
    it('반환된 함수 참조가 리렌더링 간에 안정적이어야 한다 (useCallback)', () => {
      const { result, rerender } = renderHook(() => useHapticFeedback());

      const firstLight = result.current.light;
      const firstMedium = result.current.medium;
      const firstSuccess = result.current.success;
      const firstSelection = result.current.selection;

      rerender({});

      expect(result.current.light).toBe(firstLight);
      expect(result.current.medium).toBe(firstMedium);
      expect(result.current.success).toBe(firstSuccess);
      expect(result.current.selection).toBe(firstSelection);
    });
  });

  describe('다중 호출', () => {
    it('여러 피드백 타입을 연속 호출할 수 있어야 한다', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.light();
        result.current.success();
        result.current.selection();
      });

      expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
      expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
      expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    });
  });
});
