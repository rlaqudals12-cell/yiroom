/**
 * CIE 파이프라인 타입 정의
 *
 * @module lib/image-engine/pipeline/types
 * @description CIE-1~4 통합 파이프라인 타입
 */

import type {
  CIE1Output,
  CIE2Output,
  CIE3Output,
  CIE4Output,
  RGBImageData,
  CIEConfig,
} from '../types';

/**
 * 파이프라인 단계
 */
export type PipelineStage = 'idle' | 'cie1' | 'cie2' | 'cie3' | 'cie4' | 'complete' | 'failed';

/**
 * 파이프라인 진행 상태
 */
export interface PipelineProgress {
  stage: PipelineStage;
  progress: number; // 0-100
  message: string;
}

/**
 * 파이프라인 옵션
 */
export interface PipelineOptions {
  /** CIE-1 건너뛰기 (이미 검증된 이미지) */
  skipQualityCheck?: boolean;
  /** CIE-3 건너뛰기 (AWB 보정 불필요) */
  skipAWBCorrection?: boolean;
  /** CIE-4 건너뛰기 (조명 분석 불필요) */
  skipLightingAnalysis?: boolean;
  /** CIE-1 실패 시에도 계속 진행 */
  continueOnQualityFail?: boolean;
  /** CIE-2 실패 시에도 계속 진행 (얼굴 없음) */
  continueOnFaceDetectionFail?: boolean;
  /** 진행 콜백 */
  onProgress?: (progress: PipelineProgress) => void;
  /** 설정 오버라이드 */
  config?: Partial<CIEConfig>;
}

/**
 * 파이프라인 결과
 */
export interface PipelineResult {
  /** 성공 여부 */
  success: boolean;
  /** 현재 단계 */
  stage: PipelineStage;
  /** 총 처리 시간 (ms) */
  totalProcessingTime: number;

  /** CIE-1 결과 (이미지 품질) */
  cie1?: CIE1Output;
  /** CIE-2 결과 (얼굴 감지) */
  cie2?: CIE2Output;
  /** CIE-3 결과 (AWB 보정) */
  cie3?: CIE3Output;
  /** CIE-4 결과 (조명 분석) */
  cie4?: CIE4Output;

  /** 최종 보정된 이미지 (CIE-3 적용 시) */
  correctedImage?: RGBImageData;

  /** 이미지가 분석에 적합한지 */
  isSuitableForAnalysis: boolean;
  /** 부적합 사유 (있을 경우) */
  rejectionReason?: string;

  /** 메타데이터 */
  metadata: {
    /** 실행된 단계 */
    executedStages: PipelineStage[];
    /** 건너뛴 단계 */
    skippedStages: PipelineStage[];
    /** 단계별 처리 시간 */
    stageTimes: Partial<Record<PipelineStage, number>>;
    /** 품질 점수 (0-100) */
    overallQualityScore: number;
    /** 신뢰도 (0-1) */
    overallConfidence: number;
  };
}

/**
 * 파이프라인 실행 컨텍스트 (내부용)
 */
export interface PipelineContext {
  imageData: RGBImageData;
  options: Required<Omit<PipelineOptions, 'onProgress' | 'config'>> & {
    onProgress?: (progress: PipelineProgress) => void;
    config: CIEConfig;
  };
  result: Partial<PipelineResult>;
  startTime: number;
}
