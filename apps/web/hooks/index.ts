/**
 * Custom Hooks Export
 * 새 UX 페이지들에서 사용하는 훅들
 */

// 사용자 매칭 관련
export { useUserMatching, useStyleMatching } from './useUserMatching';

// 페이지 데이터 관련
export { useHomeData } from './useHomeData';
export { useBeautyProducts } from './useBeautyProducts';

// 시간 기반 인사
export { useTimeGreeting, getTimeGreeting } from './useTimeGreeting';
export type { GreetingType } from './useTimeGreeting';

// 온라인 상태
export { useOnlineStatus } from './useOnlineStatus';

// 앱 투어: dead code 정리 (OnboardingTutorial이 layout.tsx에서 사용됨)
// useAppTour 및 AppTour는 미사용 중복 시스템 (P4 단순화)

// A/B 테스트 실험
export { useExperiment } from './useExperiment';

// URL 탭 동기화 (뒤로가기 시 탭 리셋 방지)
export { useUrlTab } from './useUrlTab';

// 음성 인식
export { useVoiceRecognition } from './useVoiceRecognition';
export type { UseVoiceRecognitionOptions, UseVoiceRecognitionReturn } from './useVoiceRecognition';
