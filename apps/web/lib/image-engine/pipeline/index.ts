/**
 * CIE 파이프라인 모듈 배럴 익스포트
 *
 * @module lib/image-engine/pipeline
 * @description CIE-1~4 통합 파이프라인
 * @see docs/adr/ADR-001-core-image-engine.md
 *
 * @example
 * import { runCIEPipeline } from '@/lib/image-engine/pipeline';
 *
 * const result = await runCIEPipeline(imageData, {
 *   onProgress: (p) => setProgress(p.progress),
 * });
 */

// 타입 익스포트
export type {
  PipelineStage,
  PipelineProgress,
  PipelineOptions,
  PipelineResult,
  PipelineContext,
} from './types';

// 프로세서 익스포트
export {
  runCIEPipeline,
  runCIEPipelineWithTimeout,
} from './processor';
