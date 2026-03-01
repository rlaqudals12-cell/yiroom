/**
 * 이룸 모바일 애니메이션 모듈 — 공개 API
 *
 * @module lib/animations
 * @description Reanimated 프리셋, 커스텀 훅, 스크린 전환 애니메이션
 *
 * @example
 * import { ENTERING, staggeredEntry, useShimmer, usePressScale } from '@/lib/animations';
 */

// 진입/퇴장 프리셋
export { ENTERING, EXITING, staggeredEntry, TIMING } from './presets';

// 커스텀 훅
export {
  useShimmer,
  usePulse,
  usePressScale,
  useCountUp,
  usePulseGlow,
  useWeave,
  useWeaveStagger,
  useSparkle,
  useConfetti,
  useSuccessBounce,
  useBounceSlow,
  useMedalDrop,
  useScanLine,
} from './hooks';

// 스크린 전환
export * as transitions from './transitions';
