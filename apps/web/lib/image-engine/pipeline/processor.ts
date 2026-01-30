/**
 * CIE 파이프라인 프로세서
 *
 * @module lib/image-engine/pipeline/processor
 * @description CIE-1~4 통합 실행 파이프라인
 * @see docs/adr/ADR-001-core-image-engine.md
 *
 * @example
 * import { runCIEPipeline } from '@/lib/image-engine';
 *
 * const result = await runCIEPipeline(imageData, {
 *   onProgress: (p) => console.log(p.message),
 * });
 *
 * if (result.isSuitableForAnalysis) {
 *   // 분석 진행
 * }
 */

import type { RGBImageData, NormalizedRect } from '../types';
import { DEFAULT_CIE_CONFIG, PROCESSING_TIMEOUT } from '../constants';
import { validateImageQualityWithTimeout } from '../cie-1';
import { processMock as processCIE2Mock } from '../cie-2';
import { processAWBCorrectionWithTimeout } from '../cie-3';
import { processLightingAnalysisWithTimeout } from '../cie-4';

import type {
  PipelineOptions,
  PipelineResult,
  PipelineStage,
  PipelineContext,
} from './types';

/**
 * 기본 파이프라인 옵션
 */
const DEFAULT_OPTIONS: Required<Omit<PipelineOptions, 'onProgress' | 'config'>> = {
  skipQualityCheck: false,
  skipAWBCorrection: false,
  skipLightingAnalysis: false,
  continueOnQualityFail: false,
  continueOnFaceDetectionFail: true,
};

/**
 * 진행 상태 보고
 */
function reportProgress(
  context: PipelineContext,
  stage: PipelineStage,
  progress: number,
  message: string
): void {
  if (context.options.onProgress) {
    context.options.onProgress({ stage, progress, message });
  }
}

/**
 * CIE-1: 이미지 품질 검증 단계
 */
async function runCIE1Stage(context: PipelineContext): Promise<boolean> {
  if (context.options.skipQualityCheck) {
    context.result.metadata!.skippedStages.push('cie1');
    return true;
  }

  reportProgress(context, 'cie1', 10, '이미지 품질 검증 중...');

  const startTime = performance.now();
  const cie1Result = await validateImageQualityWithTimeout(
    context.imageData,
    context.options.config.cie1,
    PROCESSING_TIMEOUT.cie1
  );
  const processingTime = performance.now() - startTime;

  context.result.cie1 = cie1Result;
  context.result.metadata!.stageTimes.cie1 = processingTime;
  context.result.metadata!.executedStages.push('cie1');

  reportProgress(context, 'cie1', 25, '품질 검증 완료');

  // 품질 검증 실패 처리
  if (!cie1Result.isAcceptable) {
    if (!context.options.continueOnQualityFail) {
      context.result.isSuitableForAnalysis = false;
      context.result.rejectionReason = cie1Result.primaryIssue || '이미지 품질 부적합';
      return false;
    }
  }

  return true;
}

/**
 * CIE-2: 얼굴 감지 단계
 */
async function runCIE2Stage(context: PipelineContext): Promise<boolean> {
  reportProgress(context, 'cie2', 30, '얼굴 감지 중...');

  const startTime = performance.now();

  // Mock 처리 사용 (실제 MediaPipe 연동은 클라이언트에서)
  const cie2Result = processCIE2Mock(context.imageData);
  const processingTime = performance.now() - startTime;

  context.result.cie2 = cie2Result;
  context.result.metadata!.stageTimes.cie2 = processingTime;
  context.result.metadata!.executedStages.push('cie2');

  reportProgress(context, 'cie2', 50, '얼굴 감지 완료');

  // 얼굴 감지 실패 처리
  if (!cie2Result.success || !cie2Result.faceDetected) {
    if (!context.options.continueOnFaceDetectionFail) {
      context.result.isSuitableForAnalysis = false;
      context.result.rejectionReason = '얼굴을 찾을 수 없습니다';
      return false;
    }
  }

  return true;
}

/**
 * CIE-3: AWB 보정 단계
 */
async function runCIE3Stage(context: PipelineContext): Promise<void> {
  if (context.options.skipAWBCorrection) {
    context.result.metadata!.skippedStages.push('cie3');
    return;
  }

  reportProgress(context, 'cie3', 55, 'AWB 보정 중...');

  const startTime = performance.now();
  const cie3Result = await processAWBCorrectionWithTimeout(
    context.imageData,
    context.options.config.cie3,
    PROCESSING_TIMEOUT.cie3
  );
  const processingTime = performance.now() - startTime;

  context.result.cie3 = cie3Result;
  context.result.metadata!.stageTimes.cie3 = processingTime;
  context.result.metadata!.executedStages.push('cie3');

  // 보정된 이미지가 있으면 저장
  if (cie3Result.correctionApplied && cie3Result.result?.correctedImage) {
    context.result.correctedImage = cie3Result.result.correctedImage;
    // 이후 단계에서 보정된 이미지 사용
    context.imageData = cie3Result.result.correctedImage;
  }

  reportProgress(context, 'cie3', 75, 'AWB 보정 완료');
}

/**
 * CIE-4: 조명 분석 단계
 */
async function runCIE4Stage(context: PipelineContext): Promise<void> {
  if (context.options.skipLightingAnalysis) {
    context.result.metadata!.skippedStages.push('cie4');
    return;
  }

  reportProgress(context, 'cie4', 80, '조명 분석 중...');

  // CIE-2에서 얼굴 영역 추출
  let faceRegion: NormalizedRect | undefined;
  if (context.result.cie2?.faceDetected && context.result.cie2.selectedFace?.boundingBox) {
    const bb = context.result.cie2.selectedFace.boundingBox;
    faceRegion = {
      x: bb.x / context.imageData.width,
      y: bb.y / context.imageData.height,
      width: bb.width / context.imageData.width,
      height: bb.height / context.imageData.height,
    };
  }

  const startTime = performance.now();
  const cie4Result = await processLightingAnalysisWithTimeout(
    context.imageData,
    faceRegion,
    context.options.config.cie4,
    PROCESSING_TIMEOUT.cie4
  );
  const processingTime = performance.now() - startTime;

  context.result.cie4 = cie4Result;
  context.result.metadata!.stageTimes.cie4 = processingTime;
  context.result.metadata!.executedStages.push('cie4');

  reportProgress(context, 'cie4', 95, '조명 분석 완료');
}

/**
 * 최종 품질 점수 계산
 */
function calculateOverallQuality(result: Partial<PipelineResult>): number {
  let totalScore = 0;
  let weights = 0;

  // CIE-1: 이미지 품질 (40%)
  if (result.cie1) {
    totalScore += (result.cie1.overallScore ?? 50) * 0.4;
    weights += 0.4;
  }

  // CIE-2: 얼굴 감지 (20%)
  if (result.cie2) {
    const faceScore = result.cie2.faceDetected
      ? (result.cie2.validation?.frontalityResult?.score ?? 70)
      : 0;
    totalScore += faceScore * 0.2;
    weights += 0.2;
  }

  // CIE-3: AWB (15%)
  if (result.cie3) {
    const awbScore = result.cie3.success
      ? (result.cie3.metadata?.confidence ?? 0.7) * 100
      : 50;
    totalScore += awbScore * 0.15;
    weights += 0.15;
  }

  // CIE-4: 조명 (25%)
  if (result.cie4) {
    totalScore += (result.cie4.overallScore ?? 50) * 0.25;
    weights += 0.25;
  }

  return weights > 0 ? Math.round(totalScore / weights) : 50;
}

/**
 * 최종 신뢰도 계산
 */
function calculateOverallConfidence(result: Partial<PipelineResult>): number {
  const confidences: number[] = [];

  if (result.cie1?.confidence !== undefined) {
    confidences.push(result.cie1.confidence);
  }
  if (result.cie2?.metadata?.confidence !== undefined) {
    confidences.push(result.cie2.metadata.confidence);
  }
  if (result.cie3?.metadata?.confidence !== undefined) {
    confidences.push(result.cie3.metadata.confidence);
  }
  if (result.cie4?.metadata?.confidence !== undefined) {
    confidences.push(result.cie4.metadata.confidence);
  }

  if (confidences.length === 0) {
    return 0.5;
  }

  return confidences.reduce((a, b) => a + b, 0) / confidences.length;
}

/**
 * CIE 파이프라인 실행
 *
 * CIE-1 → CIE-2 → CIE-3 → CIE-4 순서로 실행
 *
 * @param imageData - RGB 이미지 데이터
 * @param options - 파이프라인 옵션
 * @returns 파이프라인 결과
 */
export async function runCIEPipeline(
  imageData: RGBImageData,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  const startTime = performance.now();

  // 컨텍스트 초기화
  const context: PipelineContext = {
    imageData,
    options: {
      ...DEFAULT_OPTIONS,
      ...options,
      config: { ...DEFAULT_CIE_CONFIG, ...options.config },
    },
    result: {
      success: false,
      stage: 'idle',
      totalProcessingTime: 0,
      isSuitableForAnalysis: true,
      metadata: {
        executedStages: [],
        skippedStages: [],
        stageTimes: {},
        overallQualityScore: 0,
        overallConfidence: 0,
      },
    },
    startTime,
  };

  try {
    // CIE-1: 이미지 품질 검증
    context.result.stage = 'cie1';
    const cie1Success = await runCIE1Stage(context);
    if (!cie1Success) {
      context.result.stage = 'failed';
      context.result.success = false;
      return finalizeResult(context);
    }

    // CIE-2: 얼굴 감지
    context.result.stage = 'cie2';
    const cie2Success = await runCIE2Stage(context);
    if (!cie2Success) {
      context.result.stage = 'failed';
      context.result.success = false;
      return finalizeResult(context);
    }

    // CIE-3: AWB 보정
    context.result.stage = 'cie3';
    await runCIE3Stage(context);

    // CIE-4: 조명 분석
    context.result.stage = 'cie4';
    await runCIE4Stage(context);

    // 완료
    context.result.stage = 'complete';
    context.result.success = true;

    reportProgress(context, 'complete', 100, '이미지 처리 완료');

    return finalizeResult(context);
  } catch (error) {
    console.error('[CIE Pipeline] Error:', error);

    context.result.stage = 'failed';
    context.result.success = false;
    context.result.isSuitableForAnalysis = false;
    context.result.rejectionReason = '이미지 처리 중 오류가 발생했습니다';

    return finalizeResult(context);
  }
}

/**
 * 결과 최종화
 */
function finalizeResult(context: PipelineContext): PipelineResult {
  const totalProcessingTime = performance.now() - context.startTime;

  return {
    ...context.result,
    totalProcessingTime,
    metadata: {
      ...context.result.metadata!,
      overallQualityScore: calculateOverallQuality(context.result),
      overallConfidence: calculateOverallConfidence(context.result),
    },
  } as PipelineResult;
}

/**
 * 타임아웃 적용 파이프라인 실행
 *
 * @param imageData - RGB 이미지 데이터
 * @param options - 파이프라인 옵션
 * @param timeout - 전체 타임아웃 (ms)
 * @returns 파이프라인 결과
 */
export async function runCIEPipelineWithTimeout(
  imageData: RGBImageData,
  options: PipelineOptions = {},
  timeout = 15000
): Promise<PipelineResult> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      console.warn('[CIE Pipeline] Timeout');
      resolve({
        success: false,
        stage: 'failed',
        totalProcessingTime: timeout,
        isSuitableForAnalysis: false,
        rejectionReason: '처리 시간 초과',
        metadata: {
          executedStages: [],
          skippedStages: [],
          stageTimes: {},
          overallQualityScore: 0,
          overallConfidence: 0,
        },
      });
    }, timeout);

    runCIEPipeline(imageData, options)
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.error('[CIE Pipeline] Error:', error);
        resolve({
          success: false,
          stage: 'failed',
          totalProcessingTime: 0,
          isSuitableForAnalysis: false,
          rejectionReason: '처리 중 오류 발생',
          metadata: {
            executedStages: [],
            skippedStages: [],
            stageTimes: {},
            overallQualityScore: 0,
            overallConfidence: 0,
          },
        });
      });
  });
}
