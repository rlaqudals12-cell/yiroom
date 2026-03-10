/**
 * Kakao SDK 모듈 공개 API
 *
 * @module lib/kakao
 * @description 카카오톡 공유 기능 지원 (지연 로딩)
 */

export {
  initKakaoSDK,
  shareToKakao,
  shareAnalysisResult,
  shareApp,
  isKakaoSDKReady,
  type KakaoShareOptions,
  type KakaoButtonOptions,
} from './lazy-sdk';
