/**
 * 스크린 전환 애니메이션
 *
 * Expo Router의 Stack.Screen options.animation과 함께 사용.
 * 모달, 분석 결과 등 화면 전환에 일관된 애니메이션 적용.
 */
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/** 기본 슬라이드 (오른쪽에서 진입) — 분석 모듈 진입 시 */
export const slideInRight: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
  animationDuration: 350,
};

/** 아래에서 슬라이드 업 — 모달, 바텀 시트 */
export const slideInUp: NativeStackNavigationOptions = {
  animation: 'slide_from_bottom',
  animationDuration: 400,
  presentation: 'modal',
};

/** 페이드 — 탭 전환, 결과 표시 */
export const fadeIn: NativeStackNavigationOptions = {
  animation: 'fade',
  animationDuration: 300,
};

/** 없음 — 즉시 전환 */
export const none: NativeStackNavigationOptions = {
  animation: 'none',
};
