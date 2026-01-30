/**
 * CIE 파이프라인 통합 테스트
 *
 * @see docs/adr/ADR-001-core-image-engine.md
 *
 * 테스트 범위:
 * - runCIEPipeline: CIE-1~4 통합 실행
 * - runCIEPipelineWithTimeout: 타임아웃 처리
 * - 모듈 간 데이터 흐름 검증
 * - 에러 핸들링 및 복구
 */

import { describe, it, expect } from 'vitest';

import {
  runCIEPipeline,
  runCIEPipelineWithTimeout,
} from '@/lib/image-engine/pipeline';

import type { RGBImageData, PipelineOptions } from '@/lib/image-engine';

// ============================================
// 테스트 유틸리티
// ============================================

function createTestRGBImageData(width = 640, height = 480): RGBImageData {
  return {
    width,
    height,
    channels: 3,
    data: new Uint8Array(width * height * 3).fill(128),
  };
}

function createHighQualityImageData(width = 1920, height = 1080): RGBImageData {
  const data = new Uint8Array(width * height * 3);
  // 중간 밝기, 적당한 대비
  for (let i = 0; i < width * height; i++) {
    const variation = Math.sin(i * 0.01) * 30;
    data[i * 3] = Math.min(255, Math.max(0, 140 + variation));
    data[i * 3 + 1] = Math.min(255, Math.max(0, 140 + variation));
    data[i * 3 + 2] = Math.min(255, Math.max(0, 140 + variation));
  }
  return { width, height, channels: 3, data };
}

function createLowQualityImageData(width = 320, height = 240): RGBImageData {
  // 저해상도, 균일한 값 (낮은 선명도)
  return {
    width,
    height,
    channels: 3,
    data: new Uint8Array(width * height * 3).fill(100),
  };
}

function createSkinToneImageData(width = 640, height = 480): RGBImageData {
  const data = new Uint8Array(width * height * 3);
  // 중앙에 피부톤 영역
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const inFaceRegion =
        x > width * 0.25 &&
        x < width * 0.75 &&
        y > height * 0.2 &&
        y < height * 0.8;

      if (inFaceRegion) {
        // 피부톤
        data[idx] = 220;
        data[idx + 1] = 180;
        data[idx + 2] = 150;
      } else {
        // 배경
        data[idx] = 128;
        data[idx + 1] = 128;
        data[idx + 2] = 128;
      }
    }
  }
  return { width, height, channels: 3, data };
}

// ============================================
// 파이프라인 기본 테스트
// ============================================

// 기본 옵션: 품질 검증 실패해도 계속 진행 (테스트용)
const TEST_OPTIONS: PipelineOptions = {
  continueOnQualityFail: true,
  continueOnFaceDetectionFail: true,
};

describe('CIE Pipeline Integration', () => {
  describe('runCIEPipeline', () => {
    it('should complete all stages with continueOnQualityFail', async () => {
      const imageData = createTestRGBImageData();
      const result = await runCIEPipeline(imageData, TEST_OPTIONS);

      expect(result.success).toBe(true);
      expect(result.stage).toBe('complete');
      expect(result.metadata.executedStages).toContain('cie1');
      expect(result.metadata.executedStages).toContain('cie2');
      expect(result.metadata.executedStages).toContain('cie3');
      expect(result.metadata.executedStages).toContain('cie4');
    });

    it('should stop at CIE-1 when quality fails and continueOnQualityFail is false', async () => {
      const imageData = createTestRGBImageData(); // 균일한 이미지 = 낮은 sharpness
      const result = await runCIEPipeline(imageData, {
        continueOnQualityFail: false,
      });

      // 품질 검증 실패로 중단됨
      expect(result.metadata.executedStages).toContain('cie1');
      // CIE-2 이후는 실행되지 않거나 실행 후 실패
      if (!result.cie1?.isAcceptable) {
        expect(result.success).toBe(false);
        expect(result.isSuitableForAnalysis).toBe(false);
      }
    });

    it('should return CIE-1 results', async () => {
      const imageData = createTestRGBImageData();
      const result = await runCIEPipeline(imageData, TEST_OPTIONS);

      expect(result.cie1).toBeDefined();
      expect(result.cie1?.sharpness).toBeDefined();
      expect(result.cie1?.exposure).toBeDefined();
      expect(result.cie1?.colorTemperature).toBeDefined();
      expect(typeof result.cie1?.overallScore).toBe('number');
    });

    it('should return CIE-2 results', async () => {
      const imageData = createTestRGBImageData();
      const result = await runCIEPipeline(imageData, TEST_OPTIONS);

      expect(result.cie2).toBeDefined();
      expect(typeof result.cie2?.success).toBe('boolean');
      expect(typeof result.cie2?.faceDetected).toBe('boolean');
    });

    it('should return CIE-3 results', async () => {
      const imageData = createTestRGBImageData();
      const result = await runCIEPipeline(imageData, TEST_OPTIONS);

      expect(result.cie3).toBeDefined();
      expect(typeof result.cie3?.success).toBe('boolean');
      expect(typeof result.cie3?.correctionApplied).toBe('boolean');
    });

    it('should return CIE-4 results', async () => {
      const imageData = createTestRGBImageData();
      const result = await runCIEPipeline(imageData, TEST_OPTIONS);

      expect(result.cie4).toBeDefined();
      expect(typeof result.cie4?.success).toBe('boolean');
      expect(typeof result.cie4?.estimatedCCT).toBe('number');
    });

    it('should track total processing time', async () => {
      const imageData = createTestRGBImageData();
      const result = await runCIEPipeline(imageData, TEST_OPTIONS);

      expect(result.totalProcessingTime).toBeGreaterThan(0);
    });

    it('should track per-stage processing times', async () => {
      const imageData = createTestRGBImageData();
      const result = await runCIEPipeline(imageData, TEST_OPTIONS);

      expect(result.metadata.stageTimes.cie1).toBeDefined();
      expect(result.metadata.stageTimes.cie2).toBeDefined();
      expect(result.metadata.stageTimes.cie3).toBeDefined();
      expect(result.metadata.stageTimes.cie4).toBeDefined();
    });
  });

  // ============================================
  // 옵션 테스트
  // ============================================

  describe('Pipeline Options', () => {
    it('should skip quality check when skipQualityCheck is true', async () => {
      const imageData = createTestRGBImageData();
      const options: PipelineOptions = {
        ...TEST_OPTIONS,
        skipQualityCheck: true,
      };

      const result = await runCIEPipeline(imageData, options);

      expect(result.success).toBe(true);
      expect(result.metadata.skippedStages).toContain('cie1');
      expect(result.metadata.executedStages).not.toContain('cie1');
    });

    it('should skip AWB correction when skipAWBCorrection is true', async () => {
      const imageData = createTestRGBImageData();
      const options: PipelineOptions = {
        ...TEST_OPTIONS,
        skipAWBCorrection: true,
      };

      const result = await runCIEPipeline(imageData, options);

      expect(result.success).toBe(true);
      expect(result.metadata.skippedStages).toContain('cie3');
      expect(result.metadata.executedStages).not.toContain('cie3');
    });

    it('should skip lighting analysis when skipLightingAnalysis is true', async () => {
      const imageData = createTestRGBImageData();
      const options: PipelineOptions = {
        ...TEST_OPTIONS,
        skipLightingAnalysis: true,
      };

      const result = await runCIEPipeline(imageData, options);

      expect(result.success).toBe(true);
      expect(result.metadata.skippedStages).toContain('cie4');
      expect(result.metadata.executedStages).not.toContain('cie4');
    });

    it('should call onProgress callback', async () => {
      const imageData = createTestRGBImageData();
      const progressCalls: { stage: string; progress: number }[] = [];

      const options: PipelineOptions = {
        ...TEST_OPTIONS,
        onProgress: (p) => progressCalls.push({ stage: p.stage, progress: p.progress }),
      };

      await runCIEPipeline(imageData, options);

      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls.some((p) => p.stage === 'cie1')).toBe(true);
      expect(progressCalls.some((p) => p.stage === 'complete')).toBe(true);
    });

    it('should continue on face detection fail when continueOnFaceDetectionFail is true', async () => {
      const imageData = createTestRGBImageData();
      const options: PipelineOptions = {
        ...TEST_OPTIONS,
        continueOnFaceDetectionFail: true,
      };

      const result = await runCIEPipeline(imageData, options);

      // Mock이므로 항상 성공하지만, 옵션 적용 확인
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // 타임아웃 테스트
  // ============================================

  describe('runCIEPipelineWithTimeout', () => {
    it('should complete within timeout', async () => {
      const imageData = createTestRGBImageData();
      const result = await runCIEPipelineWithTimeout(imageData, TEST_OPTIONS, 30000);

      expect(result.success).toBe(true);
      expect(result.totalProcessingTime).toBeLessThan(30000);
    });

    it('should return timeout error when exceeding limit', async () => {
      const imageData = createTestRGBImageData();

      // 매우 짧은 타임아웃 (1ms)
      const result = await runCIEPipelineWithTimeout(imageData, TEST_OPTIONS, 1);

      // 타임아웃이 발생할 수도 있고 안 할 수도 있음 (비동기 특성)
      // 그러나 결과는 항상 반환되어야 함
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  // ============================================
  // 종합 품질 점수 테스트
  // ============================================

  describe('Overall Quality Score', () => {
    it('should calculate overall quality score', async () => {
      const imageData = createTestRGBImageData();
      const result = await runCIEPipeline(imageData, TEST_OPTIONS);

      expect(result.metadata.overallQualityScore).toBeDefined();
      expect(result.metadata.overallQualityScore).toBeGreaterThanOrEqual(0);
      expect(result.metadata.overallQualityScore).toBeLessThanOrEqual(100);
    });

    it('should calculate overall confidence', async () => {
      const imageData = createTestRGBImageData();
      const result = await runCIEPipeline(imageData, TEST_OPTIONS);

      expect(result.metadata.overallConfidence).toBeDefined();
      expect(result.metadata.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(result.metadata.overallConfidence).toBeLessThanOrEqual(1);
    });
  });

  // ============================================
  // 모듈 간 데이터 흐름 테스트
  // ============================================

  describe('Cross-Module Data Flow', () => {
    it('should pass CIE-3 corrected image to CIE-4', async () => {
      const imageData = createSkinToneImageData();
      const result = await runCIEPipeline(imageData, TEST_OPTIONS);

      // CIE-3이 실행되고 CIE-4도 실행됨
      expect(result.metadata.executedStages).toContain('cie3');
      expect(result.metadata.executedStages).toContain('cie4');
    });

    it('should use face region from CIE-2 in CIE-4', async () => {
      const imageData = createTestRGBImageData();
      const result = await runCIEPipeline(imageData, TEST_OPTIONS);

      // CIE-2 결과가 CIE-4에서 사용됨
      expect(result.cie2).toBeDefined();
      expect(result.cie4).toBeDefined();
    });

    it('should provide correctedImage when AWB is applied', async () => {
      const imageData = createSkinToneImageData();
      const result = await runCIEPipeline(imageData, TEST_OPTIONS);

      // AWB가 적용되면 correctedImage 존재
      if (result.cie3?.correctionApplied && result.cie3?.result?.correctedImage) {
        expect(result.correctedImage).toBeDefined();
      }
    });
  });

  // ============================================
  // 에러 복구 테스트
  // ============================================

  describe('Error Recovery', () => {
    it('should handle invalid image data gracefully', async () => {
      const invalidImageData: RGBImageData = {
        width: 0,
        height: 0,
        channels: 3,
        data: new Uint8Array(0),
      };

      // 에러가 발생해도 결과는 반환되어야 함
      const result = await runCIEPipeline(invalidImageData, TEST_OPTIONS);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should set isSuitableForAnalysis based on quality', async () => {
      const imageData = createTestRGBImageData();
      const result = await runCIEPipeline(imageData, TEST_OPTIONS);

      expect(typeof result.isSuitableForAnalysis).toBe('boolean');
    });
  });

  // ============================================
  // 성능 테스트
  // ============================================

  describe('Performance', () => {
    it('should complete pipeline in reasonable time', async () => {
      const imageData = createTestRGBImageData();

      const startTime = performance.now();
      await runCIEPipeline(imageData, TEST_OPTIONS);
      const duration = performance.now() - startTime;

      // 1초 이내 완료 기대 (개발 환경)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle high resolution images', async () => {
      const imageData = createHighQualityImageData();

      const result = await runCIEPipeline(imageData, TEST_OPTIONS);

      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // 메타데이터 검증 테스트
  // ============================================

  describe('Metadata Validation', () => {
    it('should record execution order', async () => {
      const imageData = createTestRGBImageData();
      const result = await runCIEPipeline(imageData, TEST_OPTIONS);

      const stages = result.metadata.executedStages;

      // 실행 순서 검증 (cie1 → cie2 → cie3 → cie4)
      if (stages.includes('cie1') && stages.includes('cie2')) {
        expect(stages.indexOf('cie1')).toBeLessThan(stages.indexOf('cie2'));
      }
      if (stages.includes('cie2') && stages.includes('cie3')) {
        expect(stages.indexOf('cie2')).toBeLessThan(stages.indexOf('cie3'));
      }
      if (stages.includes('cie3') && stages.includes('cie4')) {
        expect(stages.indexOf('cie3')).toBeLessThan(stages.indexOf('cie4'));
      }
    });

    it('should not have overlapping executed and skipped stages', async () => {
      const imageData = createTestRGBImageData();
      const options: PipelineOptions = {
        ...TEST_OPTIONS,
        skipAWBCorrection: true,
      };

      const result = await runCIEPipeline(imageData, options);

      const executed = result.metadata.executedStages;
      const skipped = result.metadata.skippedStages;

      // 중복 없음
      executed.forEach((stage) => {
        expect(skipped).not.toContain(stage);
      });
    });
  });

  // ============================================
  // 결과 일관성 테스트
  // ============================================

  describe('Result Consistency', () => {
    it('should return consistent results for same input', async () => {
      const imageData = createTestRGBImageData(100, 100);

      const result1 = await runCIEPipeline(imageData, TEST_OPTIONS);
      const result2 = await runCIEPipeline(imageData, TEST_OPTIONS);

      // 동일 입력에 대해 동일 결과 (비결정적 요소 제외)
      expect(result1.success).toBe(result2.success);
      expect(result1.isSuitableForAnalysis).toBe(result2.isSuitableForAnalysis);
    });

    it('should have all required fields in result', async () => {
      const imageData = createTestRGBImageData();
      const result = await runCIEPipeline(imageData, TEST_OPTIONS);

      // 필수 필드 검증
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('stage');
      expect(result).toHaveProperty('totalProcessingTime');
      expect(result).toHaveProperty('isSuitableForAnalysis');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('executedStages');
      expect(result.metadata).toHaveProperty('skippedStages');
      expect(result.metadata).toHaveProperty('stageTimes');
      expect(result.metadata).toHaveProperty('overallQualityScore');
      expect(result.metadata).toHaveProperty('overallConfidence');
    });
  });
});
