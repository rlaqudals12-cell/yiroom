// lib/style 공개 API

// 날씨 서비스
export {
  getWeatherByRegion,
  findNearestRegion,
  getWeatherByCoords,
  generateMockWeather,
  clearWeatherCache,
  getWeatherCacheStatus,
} from './weatherService';

// 색상 조합
export { evaluateColorCombination, colorNameToHex } from './color-combination';

// 코디 추천
export { recommendOutfit, adjustForOccasion } from './outfitRecommender';
