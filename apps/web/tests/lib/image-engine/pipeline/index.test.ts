/**
 * CIE 파이프라인 모듈 배럴 익스포트 테스트
 *
 * @module tests/lib/image-engine/pipeline/index
 * @see docs/adr/ADR-001-core-image-engine.md
 */

import { describe, it, expect } from 'vitest';
import * as PipelineModule from '@/lib/image-engine/pipeline';

describe('lib/image-engine/pipeline 배럴 익스포트', () => {
  // ==========================================================================
  // 타입 익스포트 확인
  // ==========================================================================
  describe('타입 익스포트', () => {
    it('PipelineStage 타입이 사용 가능하다', () => {
      // 타입 체크용 - 컴파일 타임에 검증됨
      const stage: PipelineModule.PipelineStage = 'cie1';
      expect(['idle', 'cie1', 'cie2', 'cie3', 'cie4', 'complete', 'failed']).toContain(stage);
    });

    it('PipelineProgress 타입이 사용 가능하다', () => {
      const progress: PipelineModule.PipelineProgress = {
        stage: 'cie1',
        progress: 25,
        message: '품질 검증 중...',
      };
      expect(progress).toBeDefined();
      expect(progress.stage).toBe('cie1');
      expect(progress.progress).toBe(25);
    });

    it('PipelineOptions 타입이 사용 가능하다', () => {
      const options: PipelineModule.PipelineOptions = {
        skipQualityCheck: false,
        skipAWBCorrection: false,
        skipLightingAnalysis: false,
        onProgress: () => {},
      };
      expect(options).toBeDefined();
    });

    it('PipelineResult 타입이 사용 가능하다', () => {
      const result: Partial<PipelineModule.PipelineResult> = {
        success: true,
        totalProcessingTime: 1000,
      };
      expect(result.success).toBe(true);
    });

    it('PipelineContext 타입이 사용 가능하다', () => {
      const context: Partial<PipelineModule.PipelineContext> = {
        startTime: Date.now(),
      };
      expect(context).toBeDefined();
    });
  });

  // ==========================================================================
  // 프로세서 함수 익스포트 확인
  // ==========================================================================
  describe('프로세서 함수 익스포트', () => {
    it('runCIEPipeline 함수가 export된다', () => {
      expect(PipelineModule.runCIEPipeline).toBeDefined();
      expect(typeof PipelineModule.runCIEPipeline).toBe('function');
    });

    it('runCIEPipelineWithTimeout 함수가 export된다', () => {
      expect(PipelineModule.runCIEPipelineWithTimeout).toBeDefined();
      expect(typeof PipelineModule.runCIEPipelineWithTimeout).toBe('function');
    });
  });

  // ==========================================================================
  // 모듈 구조 검증
  // ==========================================================================
  describe('모듈 구조', () => {
    it('필수 export가 모두 존재한다', () => {
      const exports = Object.keys(PipelineModule);

      // 함수 exports
      expect(exports).toContain('runCIEPipeline');
      expect(exports).toContain('runCIEPipelineWithTimeout');
    });

    it('불필요한 내부 함수가 노출되지 않는다', () => {
      const exports = Object.keys(PipelineModule);

      // 내부 헬퍼 함수는 노출되지 않아야 함
      expect(exports).not.toContain('_internalHelper');
      expect(exports).not.toContain('private');
    });
  });
});
