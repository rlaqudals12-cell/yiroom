/**
 * 햅틱 피드백 훅
 *
 * 터치 이벤트에 일관된 촉각 피드백을 제공한다.
 * 버튼 탭, 성공/에러 알림, 선택 변경 등 상황별 피드백.
 *
 * @example
 * const haptic = useHapticFeedback();
 * <Pressable onPress={() => { haptic.light(); doSomething(); }}>
 */
import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

interface HapticFeedback {
  /** 가벼운 탭 (버튼, 카드 프레스) */
  light: () => void;
  /** 중간 탭 (중요한 액션, 토글) */
  medium: () => void;
  /** 강한 탭 (경고, 삭제 확인) */
  heavy: () => void;
  /** 성공 알림 (분석 완료, 저장 성공) */
  success: () => void;
  /** 경고 알림 */
  warning: () => void;
  /** 에러 알림 (분석 실패) */
  error: () => void;
  /** 선택 변경 (탭 전환, 피커 스크롤) */
  selection: () => void;
}

export function useHapticFeedback(): HapticFeedback {
  const light = useCallback((): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const medium = useCallback((): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const heavy = useCallback((): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const success = useCallback((): void => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const warning = useCallback((): void => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const error = useCallback((): void => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const selection = useCallback((): void => {
    Haptics.selectionAsync();
  }, []);

  return { light, medium, heavy, success, warning, error, selection };
}
