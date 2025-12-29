/**
 * 인벤토리 모듈 클라이언트용 export
 * 'use client' 컴포넌트에서 사용 가능한 함수/타입만 포함
 */

// Image Processing (브라우저 전용)
export {
  extractDominantColors,
  removeBackgroundClient,
  classifyClothing,
  resizeImage,
  validateImageFile,
  dataUrlToBlob,
  blobToDataUrl,
  type ClothingClassificationResult,
} from './imageProcessing';

// Closet Matcher (순수 함수, 서버 의존 없음)
export {
  calculateMatchScore,
  recommendFromCloset,
  suggestOutfitFromCloset,
  getRecommendationSummary,
  type BodyType3,
  type MatchScore,
  type ClosetRecommendation,
  type OutfitSuggestion,
} from './closetMatcher';
