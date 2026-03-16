// lib/gemini 공개 API
export {
  isGeminiAvailable,
  generateContent,
  generateContentStream,
  formatImageForGemini,
  parseJsonResponse,
  DEFAULT_SAFETY_SETTINGS,
  HarmCategory,
  HarmBlockThreshold,
} from './client';
export type {
  GeminiContentPart,
  GeminiSafetySetting,
  GeminiConfig,
  GeminiCallParams,
  GeminiResponse,
} from './client';

export {
  analyzeSkinV2WithGemini,
  extractSkinColorWithGemini,
  analyzeBodyWithGemini,
  analyzeHairWithGemini,
  analyzeOralWithGemini,
  mapBrightnessToValueLevel,
  mapSaturationLevel,
} from './v2-analysis';
export type {
  GeminiPersonalColorV2Response,
  GeminiBodyV2Response,
  GeminiHairV2Response,
  GeminiOralHealthResponse,
} from './v2-analysis';
