/**
 * 이미지 품질 검증 모듈
 *
 * CIE-1~4 파이프라인 간소화 — React Native 환경 적응
 *
 * @module lib/image-engine
 * @see docs/principles/image-processing.md
 *
 * @description
 * 웹 CIE 파이프라인(Canvas + MediaPipe 기반)을 RN 환경에 맞게 적응.
 * - CIE-1: 해상도/크기 검증 (네이티브 이미지 메타데이터)
 * - CIE-2: 얼굴 감지 (서버 위임 또는 ML Kit 통합 예정)
 * - CIE-3: 색온도 보정 (서버 위임)
 * - CIE-4: 조명 분석 (서버 위임)
 */

// ─── 타입 ────────────────────────────────────────────

export interface ImageValidationResult {
  isAcceptable: boolean;
  overallScore: number;
  resolution: ResolutionCheck;
  fileSize: FileSizeCheck;
  format: FormatCheck;
  tips: string[];
}

export interface ResolutionCheck {
  width: number;
  height: number;
  isAcceptable: boolean;
  message: string;
}

export interface FileSizeCheck {
  bytes: number;
  isAcceptable: boolean;
  message: string;
}

export interface FormatCheck {
  mimeType: string;
  isAcceptable: boolean;
  message: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  uri: string;
}

export interface CIEPipelineResult {
  success: boolean;
  stages: CIEStageResult[];
  overallScore: number;
  recommendation: string;
}

export interface CIEStageResult {
  stage: 'cie1' | 'cie2' | 'cie3' | 'cie4';
  label: string;
  passed: boolean;
  score: number;
  message: string;
}

// ─── 상수 ─────────────────────────────────────────────

export const IMAGE_CONSTRAINTS = {
  minWidth: 640,
  minHeight: 640,
  maxWidth: 4096,
  maxHeight: 4096,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  minFileSize: 50 * 1024, // 50KB (너무 작으면 품질 낮음)
  acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  idealAspectRatio: 3 / 4,
  aspectRatioTolerance: 0.3,
} as const;

export const ANALYSIS_TIPS = {
  resolution: '더 높은 해상도의 사진을 사용해주세요',
  fileSize: '파일 크기가 너무 큽니다. 압축 후 다시 시도해주세요',
  fileTooSmall: '이미지 품질이 너무 낮아요. 원본 사진을 사용해주세요',
  format: 'JPG 또는 PNG 형식의 이미지를 사용해주세요',
  lighting: '자연광에서 촬영하면 더 정확한 분석이 가능해요',
  face: '얼굴이 화면 중앙에 오도록 촬영해주세요',
  angle: '정면 사진을 사용하면 더 정확해요',
  background: '단색 배경에서 촬영하면 분석 정확도가 올라가요',
} as const;

// ─── CIE-1: 이미지 품질 검증 ──────────────────────────

/**
 * 이미지 메타데이터 기반 품질 검증
 *
 * RN에서는 Canvas API를 사용할 수 없으므로
 * 메타데이터 기반 검증 + 서버 위임 전략
 */
export function validateImageQuality(
  metadata: ImageMetadata
): ImageValidationResult {
  const tips: string[] = [];
  let score = 100;

  // 해상도 검증
  const resolution = checkResolution(metadata.width, metadata.height);
  if (!resolution.isAcceptable) {
    score -= 30;
    tips.push(ANALYSIS_TIPS.resolution);
  }

  // 파일 크기 검증
  const fileSize = checkFileSize(metadata.fileSize);
  if (!fileSize.isAcceptable) {
    score -= 20;
    tips.push(
      metadata.fileSize > IMAGE_CONSTRAINTS.maxFileSize
        ? ANALYSIS_TIPS.fileSize
        : ANALYSIS_TIPS.fileTooSmall
    );
  }

  // 포맷 검증
  const format = checkFormat(metadata.mimeType);
  if (!format.isAcceptable) {
    score -= 50;
    tips.push(ANALYSIS_TIPS.format);
  }

  // 기본 팁 추가
  if (tips.length === 0) {
    tips.push(ANALYSIS_TIPS.lighting);
  }

  return {
    isAcceptable: score >= 50 && format.isAcceptable,
    overallScore: Math.max(0, score),
    resolution,
    fileSize,
    format,
    tips,
  };
}

// ─── CIE 파이프라인 (간소화) ──────────────────────────

/**
 * CIE 파이프라인 실행
 *
 * CIE-1: 클라이언트 (메타데이터 검증)
 * CIE-2~4: 서버 위임 결과 통합
 */
export function runCIEPipeline(
  metadata: ImageMetadata,
  serverResults?: {
    faceDetected?: boolean;
    faceScore?: number;
    lightingScore?: number;
    colorTempScore?: number;
  }
): CIEPipelineResult {
  const stages: CIEStageResult[] = [];

  // CIE-1: 이미지 품질 (클라이언트)
  const validation = validateImageQuality(metadata);
  stages.push({
    stage: 'cie1',
    label: '이미지 품질',
    passed: validation.isAcceptable,
    score: validation.overallScore,
    message: validation.isAcceptable ? '이미지 품질 양호' : '이미지 품질 개선 필요',
  });

  // CIE-2: 얼굴 감지 (서버 결과)
  if (serverResults?.faceDetected !== undefined) {
    stages.push({
      stage: 'cie2',
      label: '얼굴 감지',
      passed: serverResults.faceDetected,
      score: serverResults.faceScore ?? (serverResults.faceDetected ? 80 : 0),
      message: serverResults.faceDetected ? '얼굴 감지 성공' : '얼굴을 감지할 수 없어요',
    });
  }

  // CIE-3: 색온도 (서버 결과)
  if (serverResults?.colorTempScore !== undefined) {
    const passed = serverResults.colorTempScore >= 60;
    stages.push({
      stage: 'cie3',
      label: '색온도',
      passed,
      score: serverResults.colorTempScore,
      message: passed ? '색온도 양호' : '조명 환경 개선 권장',
    });
  }

  // CIE-4: 조명 분석 (서버 결과)
  if (serverResults?.lightingScore !== undefined) {
    const passed = serverResults.lightingScore >= 60;
    stages.push({
      stage: 'cie4',
      label: '조명',
      passed,
      score: serverResults.lightingScore,
      message: passed ? '조명 양호' : '더 밝은 환경에서 촬영해주세요',
    });
  }

  const overallScore = stages.length > 0
    ? Math.round(stages.reduce((sum, s) => sum + s.score, 0) / stages.length)
    : 0;

  const allPassed = stages.every((s) => s.passed);

  return {
    success: allPassed,
    stages,
    overallScore,
    recommendation: allPassed
      ? '분석에 적합한 이미지예요'
      : '이미지를 다시 촬영하면 더 정확한 분석이 가능해요',
  };
}

// ─── 촬영 가이드 ──────────────────────────────────────

export interface CaptureGuide {
  analysisType: string;
  instructions: string[];
  idealConditions: string[];
}

export const CAPTURE_GUIDES: Record<string, CaptureGuide> = {
  'personal-color': {
    analysisType: '퍼스널컬러',
    instructions: [
      '자연광에서 촬영해주세요',
      '얼굴 전체가 보이도록 해주세요',
      '화장을 하지 않은 상태가 좋아요',
      '정면을 바라봐주세요',
    ],
    idealConditions: ['자연광 (창가)', '노메이크업', '정면 촬영'],
  },
  skin: {
    analysisType: '피부 분석',
    instructions: [
      '세안 후 촬영하면 더 정확해요',
      '얼굴 전체가 선명하게 보여야 해요',
      '플래시 없이 촬영해주세요',
      '그림자가 없는 환경이 좋아요',
    ],
    idealConditions: ['세안 직후', '자연광', '플래시 OFF'],
  },
  body: {
    analysisType: '체형 분석',
    instructions: [
      '전신이 보이도록 촬영해주세요',
      '몸에 맞는 옷을 입어주세요',
      '정면과 측면 사진 모두 필요해요',
      '배경이 단순할수록 좋아요',
    ],
    idealConditions: ['전신 촬영', '피팅된 의류', '단색 배경'],
  },
};

/**
 * 분석 타입별 촬영 가이드
 */
export function getCaptureGuide(analysisType: string): CaptureGuide {
  return CAPTURE_GUIDES[analysisType] ?? {
    analysisType,
    instructions: [
      '밝은 곳에서 촬영해주세요',
      '선명한 사진을 사용해주세요',
    ],
    idealConditions: ['밝은 환경', '선명한 이미지'],
  };
}

// ─── 내부 함수 ────────────────────────────────────────

function checkResolution(width: number, height: number): ResolutionCheck {
  const isAcceptable =
    width >= IMAGE_CONSTRAINTS.minWidth &&
    height >= IMAGE_CONSTRAINTS.minHeight &&
    width <= IMAGE_CONSTRAINTS.maxWidth &&
    height <= IMAGE_CONSTRAINTS.maxHeight;

  let message: string;
  if (width < IMAGE_CONSTRAINTS.minWidth || height < IMAGE_CONSTRAINTS.minHeight) {
    message = `해상도가 낮아요 (${width}×${height}). 최소 ${IMAGE_CONSTRAINTS.minWidth}×${IMAGE_CONSTRAINTS.minHeight} 필요`;
  } else if (width > IMAGE_CONSTRAINTS.maxWidth || height > IMAGE_CONSTRAINTS.maxHeight) {
    message = '해상도가 너무 높아요. 자동으로 리사이즈됩니다';
  } else {
    message = `해상도 양호 (${width}×${height})`;
  }

  return { width, height, isAcceptable, message };
}

function checkFileSize(bytes: number): FileSizeCheck {
  const isAcceptable =
    bytes >= IMAGE_CONSTRAINTS.minFileSize &&
    bytes <= IMAGE_CONSTRAINTS.maxFileSize;

  const sizeMB = (bytes / (1024 * 1024)).toFixed(1);

  let message: string;
  if (bytes < IMAGE_CONSTRAINTS.minFileSize) {
    message = `파일이 너무 작아요 (${sizeMB}MB). 원본 사진을 사용해주세요`;
  } else if (bytes > IMAGE_CONSTRAINTS.maxFileSize) {
    message = `파일이 너무 커요 (${sizeMB}MB). 최대 10MB`;
  } else {
    message = `파일 크기 양호 (${sizeMB}MB)`;
  }

  return { bytes, isAcceptable, message };
}

function checkFormat(mimeType: string): FormatCheck {
  const isAcceptable = (IMAGE_CONSTRAINTS.acceptedFormats as readonly string[]).includes(mimeType);

  return {
    mimeType,
    isAcceptable,
    message: isAcceptable
      ? `형식 양호 (${mimeType})`
      : `지원하지 않는 형식 (${mimeType}). JPG 또는 PNG를 사용해주세요`,
  };
}
