// 공유 유틸리티 통합 export
export { captureElementAsImage, captureElementAsDataUrl } from './imageGenerator';

export { shareImage, downloadImage, canShareFiles, shareText, copyToClipboard } from './shareUtils';

// 소셜 공유 (X, 카카오톡)
export {
  shareToX,
  shareToKakao,
  isKakaoReady,
  downloadShareImage,
  getHashtagsForResult,
  DEFAULT_HASHTAGS,
  type ShareContent,
} from './social';
