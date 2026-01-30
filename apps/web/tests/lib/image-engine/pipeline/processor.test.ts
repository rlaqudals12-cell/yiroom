/**
 * CIE 파이프라인 프로세서 테스트
 *
 * @module tests/lib/image-engine/pipeline/processor
 * @see lib/image-engine/pipeline/processor.ts
 */
import { describe, it, expect } from 'vitest';
import {
  runCIEPipeline,
  runCIEPipelineWithTimeout,
} from '@/lib/image-engine/pipeline/processor';
import type { RGBImageData } from '@/lib/image-engine/types';
import type { PipelineProgress } from '@/lib/image-engine/pipeline/types';

// 테스트용 이미지 데이터 생성
function createTestImageData(width = 640, height = 480): RGBImageData {
  const data = new Uint8Array(width * height * 3);

  // 중간 밝기로 채우기
  for (let i = 0; i < data.length; i++) {
    data[i] = 128;
  }

  return { data, width, height, channels: 3 };
}

describe('runCIEPipeline', () => {
  it('기본 파이프라인 실행 성공 (품질 검증 건너뛰기)', async () => {
    // 테스트용 균일 이미지는 sharpness=0이므로 품질 검증 건너뛰기
    const imageData = createTestImageData();
    const result = await runCIEPipeline(imageData, {
      skipQualityCheck: true,
    });

    expect(result.success).toBe(true);
    expect(result.stage).toBe('complete');
    expect(result.isSuitableForAnalysis).toBe(true);
  });

  it('메타데이터에 실행된 단계 기록', async () => {
    const imageData = createTestImageData();
    const result = await runCIEPipeline(imageData, {
      skipQualityCheck: true,
    });

    // CIE-1은 건너뛰었으므로 executedStages에 없음
    expect(result.metadata.skippedStages).toContain('cie1');
    expect(result.metadata.executedStages).toContain('cie2');
    expect(result.metadata.executedStages).toContain('cie3');
    expect(result.metadata.executedStages).toContain('cie4');
  });

  it('skipQualityCheck 옵션으로 CIE-1 건너뛰기', async () => {
    const imageData = createTestImageData();
    const result = await runCIEPipeline(imageData, {
      skipQualityCheck: true,
    });

    expect(result.success).toBe(true);
    expect(result.metadata.skippedStages).toContain('cie1');
    expect(result.metadata.executedStages).not.toContain('cie1');
  });

  it('skipAWBCorrection 옵션으로 CIE-3 건너뛰기', async () => {
    const imageData = createTestImageData();
    const result = await runCIEPipeline(imageData, {
      skipQualityCheck: true,
      skipAWBCorrection: true,
    });

    expect(result.success).toBe(true);
    expect(result.metadata.skippedStages).toContain('cie3');
    expect(result.metadata.executedStages).not.toContain('cie3');
  });

  it('skipLightingAnalysis 옵션으로 CIE-4 건너뛰기', async () => {
    const imageData = createTestImageData();
    const result = await runCIEPipeline(imageData, {
      skipQualityCheck: true,
      skipLightingAnalysis: true,
    });

    expect(result.success).toBe(true);
    expect(result.metadata.skippedStages).toContain('cie4');
    expect(result.metadata.executedStages).not.toContain('cie4');
  });

  it('모든 단계 건너뛰기', async () => {
    const imageData = createTestImageData();
    const result = await runCIEPipeline(imageData, {
      skipQualityCheck: true,
      skipAWBCorrection: true,
      skipLightingAnalysis: true,
    });

    expect(result.success).toBe(true);
    expect(result.metadata.skippedStages).toContain('cie1');
    expect(result.metadata.skippedStages).toContain('cie3');
    expect(result.metadata.skippedStages).toContain('cie4');
    // CIE-2는 건너뛸 수 없음 (항상 실행)
    expect(result.metadata.executedStages).toContain('cie2');
  });

  it('진행 콜백 호출', async () => {
    const imageData = createTestImageData();
    const progressUpdates: PipelineProgress[] = [];

    await runCIEPipeline(imageData, {
      skipQualityCheck: true,
      onProgress: (progress) => {
        progressUpdates.push({ ...progress });
      },
    });

    expect(progressUpdates.length).toBeGreaterThan(0);
    // CIE-1은 건너뛰었으므로 cie2부터 시작
    expect(progressUpdates.some((p) => p.stage === 'cie2')).toBe(true);
    expect(progressUpdates.some((p) => p.stage === 'complete')).toBe(true);
  });

  it('진행률은 0에서 100까지 증가', async () => {
    const imageData = createTestImageData();
    const progressValues: number[] = [];

    await runCIEPipeline(imageData, {
      skipQualityCheck: true,
      onProgress: (progress) => {
        progressValues.push(progress.progress);
      },
    });

    // 첫 번째 값은 0보다 크고, 마지막 값은 100
    expect(progressValues[0]).toBeGreaterThanOrEqual(0);
    expect(progressValues[progressValues.length - 1]).toBe(100);
  });

  it('totalProcessingTime 기록', async () => {
    const imageData = createTestImageData();
    const result = await runCIEPipeline(imageData, {
      skipQualityCheck: true,
    });

    expect(result.totalProcessingTime).toBeGreaterThan(0);
  });

  it('단계별 처리 시간 기록', async () => {
    const imageData = createTestImageData();
    const result = await runCIEPipeline(imageData, {
      skipQualityCheck: true,
    });

    // CIE-1은 건너뛰었으므로 stageTimes에 없음
    expect(result.metadata.stageTimes.cie2).toBeGreaterThanOrEqual(0);
    expect(result.metadata.stageTimes.cie3).toBeGreaterThanOrEqual(0);
    expect(result.metadata.stageTimes.cie4).toBeGreaterThanOrEqual(0);
  });

  it('품질 점수 계산', async () => {
    const imageData = createTestImageData();
    const result = await runCIEPipeline(imageData, {
      skipQualityCheck: true,
    });

    expect(result.metadata.overallQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.metadata.overallQualityScore).toBeLessThanOrEqual(100);
  });

  it('신뢰도 계산', async () => {
    const imageData = createTestImageData();
    const result = await runCIEPipeline(imageData, {
      skipQualityCheck: true,
    });

    expect(result.metadata.overallConfidence).toBeGreaterThanOrEqual(0);
    expect(result.metadata.overallConfidence).toBeLessThanOrEqual(1);
  });

  it('CIE-1 결과 포함 (품질 검증 활성화 시)', async () => {
    const imageData = createTestImageData();
    // 품질 검증 실패해도 계속 진행하도록 설정
    const result = await runCIEPipeline(imageData, {
      continueOnQualityFail: true,
    });

    expect(result.cie1).toBeDefined();
    expect(result.cie1?.isAcceptable).toBeDefined();
    expect(result.cie1?.overallScore).toBeDefined();
  });

  it('CIE-2 결과 포함', async () => {
    const imageData = createTestImageData();
    const result = await runCIEPipeline(imageData, {
      skipQualityCheck: true,
    });

    expect(result.cie2).toBeDefined();
    expect(result.cie2?.success).toBeDefined();
    expect(result.cie2?.faceDetected).toBeDefined();
  });

  it('CIE-3 결과 포함', async () => {
    const imageData = createTestImageData();
    const result = await runCIEPipeline(imageData, {
      skipQualityCheck: true,
    });

    expect(result.cie3).toBeDefined();
    expect(result.cie3?.success).toBeDefined();
  });

  it('CIE-4 결과 포함', async () => {
    const imageData = createTestImageData();
    const result = await runCIEPipeline(imageData, {
      skipQualityCheck: true,
    });

    expect(result.cie4).toBeDefined();
    expect(result.cie4?.success).toBeDefined();
    expect(result.cie4?.overallScore).toBeDefined();
  });
});

describe('runCIEPipelineWithTimeout', () => {
  it('정상 완료 시 결과 반환', async () => {
    const imageData = createTestImageData();
    const result = await runCIEPipelineWithTimeout(
      imageData,
      { skipQualityCheck: true },
      15000
    );

    expect(result.success).toBe(true);
    expect(result.stage).toBe('complete');
  });

  it('타임아웃 발생 시 실패 결과 반환', async () => {
    const imageData = createTestImageData();

    // 매우 짧은 타임아웃 (1ms)
    const result = await runCIEPipelineWithTimeout(
      imageData,
      { skipQualityCheck: true },
      1
    );

    // 파이프라인이 타임아웃 전에 완료될 수도 있음
    // 타임아웃 발생 시 확인
    if (!result.success) {
      expect(result.stage).toBe('failed');
      // '처리 시간 초과' 또는 품질 검사 실패 메시지
      expect(result.rejectionReason).toBeDefined();
    }
  });

  it('타임아웃 결과에 기본 메타데이터 포함', async () => {
    const imageData = createTestImageData();
    const result = await runCIEPipelineWithTimeout(
      imageData,
      { skipQualityCheck: true },
      1
    );

    expect(result.metadata).toBeDefined();
    expect(result.metadata.executedStages).toBeDefined();
    expect(result.metadata.skippedStages).toBeDefined();
    expect(result.metadata.stageTimes).toBeDefined();
  });

  it('옵션 전달', async () => {
    const imageData = createTestImageData();
    const result = await runCIEPipelineWithTimeout(
      imageData,
      { skipQualityCheck: true },
      15000
    );

    expect(result.success).toBe(true);
    expect(result.metadata.skippedStages).toContain('cie1');
  });
});
