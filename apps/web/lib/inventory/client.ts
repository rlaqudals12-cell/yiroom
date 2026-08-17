/**
 * 인벤토리 모듈 클라이언트용 export
 * 'use client' 컴포넌트에서 사용 가능한 함수/타입만 포함
 */

// Image Processing (브라우저 전용)
export {
  extractDominantColors,
  classifyClothing,
  resizeImage,
  validateImageFile,
  dataUrlToBlob,
  blobToDataUrl,
  type ClothingClassificationResult,
} from './imageProcessing';

// Clothing Category (순수 함수 — 한글 세부종류 → 영문 대분류 정규화)
export { resolveClothingCategory } from './clothingCategory';

// Closet Filters (순수 함수 — 옷장 목록 카테고리·시즌 필터 + 검색 필터 조립)
export {
  filterClosetItems,
  buildClosetSearchFilter,
  type ClosetFilterCriteria,
} from './closetFilters';

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
