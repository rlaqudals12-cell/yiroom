/**
 * 딥링크 모듈
 * 위젯 및 외부 앱에서 딥링크 처리
 */

// 타입
export * from './types';

// 핸들러
export {
  parseDeepLink,
  navigateToDeepLink,
  handleDeepLinkUrl,
  getInitialDeepLink,
  createDeepLinkUrl,
} from './handler';

// 훅
export { useDeepLink } from './useDeepLink';
