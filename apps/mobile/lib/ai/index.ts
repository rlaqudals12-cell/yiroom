/**
 * Multi-AI Backup System
 *
 * Gemini (Primary) → Claude (Secondary) → Mock 폴백 체인
 *
 * @module lib/ai
 * @see docs/adr/ADR-055-multi-ai-backup-strategy.md
 */

// 타입
export type {
  AIProviderName,
  AIProvider,
  AIAnalysisResult,
  ImageAnalysisInput,
  ImageQualityInfo,
  CircuitState,
  CircuitBreakerConfig,
  CircuitBreakerMetrics,
  AIFeatureFlags,
  AIMetrics,
  RetryOptions,
  TimeoutOptions,
} from './types';

export { DEFAULT_AI_FLAGS } from './types';

// 서킷 브레이커
export {
  AICircuitBreaker,
  CircuitOpenError,
  getCircuitBreaker,
  getAllCircuitStates,
  resetAllCircuitBreakers,
  resetCircuitBreaker,
} from './circuit-breaker';

// Multi-Provider 오케스트레이션
export {
  analyzeWithMultiAI,
  analyzeImageWithMultiAI,
  createSkinV2MultiAIAnalyzer,
  createPersonalColorV2MultiAIAnalyzer,
  createBodyV2MultiAIAnalyzer,
  createHairV2MultiAIAnalyzer,
} from './multi-provider';

// Gemini Provider
export {
  createGeminiProvider,
  analyzeWithGemini,
  formatImageForGemini,
  parseGeminiJsonResponse,
  isGeminiAvailable,
  getGeminiModelInfo,
} from './providers/gemini';

// Claude Provider
export {
  createClaudeProvider,
  analyzeWithClaude,
  formatImageForClaude,
  parseClaudeJsonResponse,
  isClaudeAvailable,
  getClaudeModelInfo,
} from './providers/claude';
