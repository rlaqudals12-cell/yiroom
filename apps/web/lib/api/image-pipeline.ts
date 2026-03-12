/**
 * API용 CIE 풀 파이프라인 래퍼
 *
 * 기존 CIE-1 품질 검증에 CIE-3(AWB) + CIE-4(조명) 분석을 추가.
 * CIE-2는 서버사이드 MediaPipe 미지원으로 mock 사용.
 *
 * @module lib/api/image-pipeline
 * @see docs/adr/ADR-001-core-image-engine.md
 */

import type { RGBImageData, CIE4Output, PipelineResult } from '@/lib/image-engine';
import { runCIEPipelineWithTimeout } from '@/lib/image-engine';
import { validateImageForAnalysis, type ImageQualitySuccess } from './image-quality';

// ============================================
// 타입
// ============================================

/** 파이프라인 메타데이터 (API 응답에 포함) */
export interface PipelineMetadata {
  /** CIE-1 품질 점수 (0-100) */
  qualityScore: number;
  /** CIE-4 조명 점수 (0-100, 실행 안 됐으면 null) */
  lightingScore: number | null;
  /** AWB 보정 적용 여부 */
  awbApplied: boolean;
  /** 전체 파이프라인 신뢰도 (0-1) */
  confidence: number;
  /** 실행된 CIE 단계 목록 */
  executedStages: string[];
  /** 전체 처리 시간 (ms) */
  processingTimeMs: number;
}

/** 풀 파이프라인 성공 결과 */
export interface FullPipelineSuccess {
  success: true;
  imageData: RGBImageData;
  pipeline: PipelineMetadata;
  /** CIE-3 보정된 이미지 (있으면) */
  correctedImage?: RGBImageData;
  /** CIE-4 조명 분석 원본 */
  cie4?: CIE4Output;
}

/** 풀 파이프라인 실패 결과 (CIE-1 품질 거부) */
export interface FullPipelineFailure {
  success: false;
  error: {
    code: 'IMAGE_QUALITY_ERROR';
    message: string;
    userMessage: string;
    details: {
      overallScore: number;
      primaryIssue: string | null;
      allIssues: string[];
      sharpnessScore: number;
      exposureVerdict: string;
      cctKelvin: number;
    };
  };
}

export type FullPipelineResult = FullPipelineSuccess | FullPipelineFailure;

// ============================================
// 옵션
// ============================================

export interface FullPipelineOptions {
  /** CIE-1 최소 허용 점수 (기본 40) */
  minScore?: number;
  /** 해상도 검증 생략 여부 */
  skipResolution?: boolean;
  /** 경고 수준 허용 여부 (기본 true) */
  allowWarnings?: boolean;
  /** CIE-3/4 추가 분석 스킵 (기존 CIE-1만 사용) */
  skipExtendedPipeline?: boolean;
  /** 풀 파이프라인 타임아웃 ms (기본 10000) */
  pipelineTimeout?: number;
}

// ============================================
// 메인 함수
// ============================================

/**
 * CIE 풀 파이프라인 실행
 *
 * 1단계: CIE-1 품질 검증 (기존 동작과 동일)
 * 2단계: CIE-1 통과 시 → CIE-2(mock) + CIE-3(AWB) + CIE-4(조명) 추가 실행
 *
 * CIE-3/4 실패해도 분석은 계속 진행 (비차단, 메타데이터만 제공)
 */
export async function runFullPipeline(
  imageBase64: string,
  options: FullPipelineOptions = {}
): Promise<FullPipelineResult> {
  const {
    minScore = 40,
    skipResolution = false,
    allowWarnings = true,
    skipExtendedPipeline = false,
    pipelineTimeout = 10000,
  } = options;

  // 1단계: CIE-1 품질 검증 (기존 동작 유지)
  const qualityResult = await validateImageForAnalysis(imageBase64, {
    minScore,
    skipResolution,
    allowWarnings,
  });

  if (!qualityResult.success) {
    return qualityResult as FullPipelineFailure;
  }

  const { imageData, qualityResult: cie1Output } = qualityResult as ImageQualitySuccess;

  // 기본 메타데이터 (CIE-1만)
  const basePipeline: PipelineMetadata = {
    qualityScore: cie1Output.overallScore,
    lightingScore: null,
    awbApplied: false,
    confidence: cie1Output.confidence ?? 0.5,
    executedStages: ['cie1'],
    processingTimeMs: 0,
  };

  // 확장 파이프라인 스킵 시 CIE-1 결과만 반환
  if (skipExtendedPipeline) {
    return {
      success: true,
      imageData,
      pipeline: basePipeline,
    };
  }

  // 2단계: CIE-2(mock) + CIE-3(AWB) + CIE-4(조명) 추가 실행
  try {
    const pipelineResult = await runCIEPipelineWithTimeout(
      imageData,
      {
        // CIE-1은 이미 통과했으므로 스킵
        skipQualityCheck: true,
        // CIE-2 mock 실패해도 계속 진행
        continueOnFaceDetectionFail: true,
      },
      pipelineTimeout
    );

    return buildSuccessResult(imageData, cie1Output, pipelineResult);
  } catch (error) {
    // 확장 파이프라인 실패 시에도 CIE-1 통과 결과 반환 (비차단)
    console.warn('[CIE Pipeline] Extended pipeline failed, using CIE-1 only:', error);
    return {
      success: true,
      imageData,
      pipeline: basePipeline,
    };
  }
}

// ============================================
// 헬퍼
// ============================================

/** PipelineResult에서 API 응답용 메타데이터 추출 */
function buildSuccessResult(
  imageData: RGBImageData,
  cie1Output: ImageQualitySuccess['qualityResult'],
  pipelineResult: PipelineResult
): FullPipelineSuccess {
  const metadata = pipelineResult.metadata;

  // CIE-1 품질 점수 (이미 검증 통과한 값 사용)
  const qualityScore = cie1Output.overallScore;

  // CIE-4 조명 점수
  const lightingScore = pipelineResult.cie4?.overallScore ?? null;

  // AWB 보정 여부
  const awbApplied = pipelineResult.cie3?.correctionApplied ?? false;

  // 신뢰도: CIE-1 + 파이프라인 메타 가중 평균
  const pipelineConfidence = metadata?.overallConfidence ?? 0.5;
  const cie1Confidence = cie1Output.confidence ?? 0.5;
  const confidence = Math.round((cie1Confidence * 0.6 + pipelineConfidence * 0.4) * 100) / 100;

  // 실행 단계: cie1(사전 통과) + 파이프라인 실행 단계
  const executedStages = ['cie1', ...(metadata?.executedStages ?? [])];

  const result: FullPipelineSuccess = {
    success: true,
    imageData,
    pipeline: {
      qualityScore,
      lightingScore,
      awbApplied,
      confidence,
      executedStages,
      processingTimeMs: Math.round(pipelineResult.totalProcessingTime),
    },
  };

  // 보정 이미지 (있으면 첨부)
  if (pipelineResult.correctedImage) {
    result.correctedImage = pipelineResult.correctedImage;
  }

  // CIE-4 원본 데이터 (조명 기반 분석 보정용)
  if (pipelineResult.cie4) {
    result.cie4 = pipelineResult.cie4;
  }

  return result;
}
