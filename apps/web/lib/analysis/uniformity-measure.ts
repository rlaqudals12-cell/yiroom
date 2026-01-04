/**
 * 피부 균일도 측정 모듈
 * @description S-1+ 피부 분석 - 잡티/기미 감지 및 균일도 정량화
 *
 * 피부 균일도를 다각도로 측정하여 리포트 신뢰도를 높입니다:
 * - 색상 균일도: 피부색 분포의 표준편차
 * - 멜라닌 분포: 기미/주근깨 감지
 * - 헤모글로빈 분포: 홍조/모세혈관 감지
 * - 텍스처 균일도: 모공/요철 분석 (간이)
 */

import type { PigmentMaps, FaceLandmark } from '@/types/visual-analysis';

// ============================================
// 균일도 결과 타입 정의
// ============================================

/** 피부 균일도 결과 */
export interface SkinUniformityResult {
  /** 전체 균일도 점수 (0-100, 높을수록 균일) */
  overallScore: number;
  /** 색상 균일도 (0-100) */
  colorUniformity: number;
  /** 멜라닌 균일도 (0-100) - 기미/주근깨 */
  melaninUniformity: number;
  /** 헤모글로빈 균일도 (0-100) - 홍조/모세혈관 */
  hemoglobinUniformity: number;
  /** 텍스처 균일도 (0-100) - 모공/요철 */
  textureUniformity: number;
  /** 잡티 수 (추정) */
  spotCount: number;
  /** 문제 영역 목록 */
  problemAreas: ProblemArea[];
  /** 등급 */
  grade: UniformityGrade;
  /** 설명 */
  description: string;
}

/** 문제 영역 */
export interface ProblemArea {
  /** 영역 타입 */
  type: 'spot' | 'redness' | 'pore' | 'unevenness';
  /** 영역 이름 */
  region: 'forehead' | 'left_cheek' | 'right_cheek' | 'nose' | 'chin' | 'overall';
  /** 심각도 (0-100) */
  severity: number;
  /** 설명 */
  description: string;
}

/** 균일도 등급 */
export type UniformityGrade = 'excellent' | 'good' | 'fair' | 'poor';

/** 영역별 분석 결과 */
export interface RegionalUniformity {
  forehead: number;
  leftCheek: number;
  rightCheek: number;
  nose: number;
  chin: number;
}

// ============================================
// 상수 정의
// ============================================

/** 잡티 감지 임계값 (멜라닌 이상치) */
const SPOT_THRESHOLD = 0.25;

/** 홍조 감지 임계값 (헤모글로빈 이상치) */
const REDNESS_THRESHOLD = 0.3;

/** 이상치 비율 임계값 (이 비율 이상이면 문제 영역) */
const OUTLIER_RATIO_THRESHOLD = 0.05;

/** 균일도 등급 기준 */
const GRADE_THRESHOLDS = {
  excellent: 85,
  good: 70,
  fair: 50,
  poor: 0,
};

/** 영역별 랜드마크 인덱스 (MediaPipe 468점 기준) */
const REGION_LANDMARKS: Record<string, number[]> = {
  forehead: [10, 151, 9, 107, 66, 105, 63, 70, 46, 225, 224, 223, 222, 221], // 이마
  left_cheek: [117, 118, 119, 120, 121, 128, 245, 193, 55], // 왼쪽 볼
  right_cheek: [346, 347, 348, 349, 350, 357, 465, 417, 285], // 오른쪽 볼
  nose: [1, 2, 98, 327, 168, 6, 197, 195, 5], // 코
  chin: [152, 377, 400, 378, 379, 365, 397, 288, 361], // 턱
};

// ============================================
// 메인 균일도 분석 함수
// ============================================

/**
 * 피부 균일도 전체 분석
 * @param imageData - 원본 이미지 데이터
 * @param faceMask - 얼굴 마스크
 * @param pigmentMaps - 색소 맵 (멜라닌/헤모글로빈)
 * @param landmarks - 얼굴 랜드마크 (영역별 분석용)
 */
export function analyzeSkinUniformity(
  imageData: ImageData,
  faceMask: Uint8Array,
  pigmentMaps: PigmentMaps,
  landmarks?: FaceLandmark[]
): SkinUniformityResult {
  // 1. 색상 균일도 계산 (휘도 기반)
  const colorUniformity = calculateColorUniformity(imageData, faceMask);

  // 2. 멜라닌 균일도 계산 (기미/주근깨)
  const { uniformity: melaninUniformity, spotCount: melaninSpots } = calculatePigmentUniformity(
    pigmentMaps.melanin,
    faceMask,
    SPOT_THRESHOLD
  );

  // 3. 헤모글로빈 균일도 계산 (홍조)
  const { uniformity: hemoglobinUniformity, spotCount: redSpots } = calculatePigmentUniformity(
    pigmentMaps.hemoglobin,
    faceMask,
    REDNESS_THRESHOLD
  );

  // 4. 텍스처 균일도 계산 (간이 - 밝기 변화율 기반)
  const textureUniformity = calculateTextureUniformity(imageData, faceMask);

  // 5. 총 잡티 수
  const spotCount = melaninSpots + redSpots;

  // 6. 문제 영역 감지
  const problemAreas = detectProblemAreas(
    imageData,
    faceMask,
    pigmentMaps,
    landmarks,
    melaninUniformity,
    hemoglobinUniformity
  );

  // 7. 전체 균일도 점수 계산 (가중 평균)
  const overallScore = Math.round(
    colorUniformity * 0.3 +
      melaninUniformity * 0.3 +
      hemoglobinUniformity * 0.25 +
      textureUniformity * 0.15
  );

  // 8. 등급 결정
  const grade = determineGrade(overallScore);

  // 9. 설명 생성
  const description = generateUniformityDescription(overallScore, grade, spotCount, problemAreas);

  return {
    overallScore,
    colorUniformity,
    melaninUniformity,
    hemoglobinUniformity,
    textureUniformity,
    spotCount,
    problemAreas,
    grade,
    description,
  };
}

// ============================================
// 색상 균일도 계산
// ============================================

/**
 * 휘도 기반 색상 균일도 계산
 * - 표준편차가 낮을수록 균일 (점수 높음)
 */
function calculateColorUniformity(imageData: ImageData, faceMask: Uint8Array): number {
  const { data } = imageData;
  const luminances: number[] = [];

  for (let i = 0; i < faceMask.length; i++) {
    if (faceMask[i] === 0) continue;

    const idx = i * 4;
    // ITU-R BT.601 휘도 공식
    const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    luminances.push(luminance);
  }

  if (luminances.length === 0) return 50;

  // 표준편차 계산
  const mean = luminances.reduce((a, b) => a + b, 0) / luminances.length;
  const variance = luminances.reduce((sum, val) => sum + (val - mean) ** 2, 0) / luminances.length;
  const stdDev = Math.sqrt(variance);

  // 표준편차 0~50 → 점수 100~0으로 변환
  // stdDev가 낮을수록 점수 높음
  return Math.max(0, Math.round(100 - stdDev * 2));
}

// ============================================
// 색소 균일도 계산 (멜라닌/헤모글로빈)
// ============================================

/**
 * 색소 맵의 균일도 계산 및 이상치(잡티) 감지
 */
function calculatePigmentUniformity(
  pigmentMap: Float32Array,
  faceMask: Uint8Array,
  outlierThreshold: number
): { uniformity: number; spotCount: number } {
  const values: number[] = [];

  for (let i = 0; i < faceMask.length; i++) {
    if (faceMask[i] === 0) continue;
    values.push(pigmentMap[i]);
  }

  if (values.length === 0) return { uniformity: 50, spotCount: 0 };

  // 평균 및 표준편차
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // 이상치(잡티) 감지: 평균 + threshold*stdDev 이상인 픽셀
  const outlierCount = values.filter((v) => Math.abs(v - mean) > outlierThreshold + stdDev).length;
  const outlierRatio = outlierCount / values.length;

  // 잡티 수 추정 (이상치 픽셀을 그룹화하면 더 정확하지만, 간이로 비율 기반)
  const estimatedSpots = Math.round(outlierCount / 100); // 100픽셀 = 1 잡티로 추정

  // 균일도 점수: 표준편차 낮고, 이상치 적으면 높은 점수
  const stdDevPenalty = Math.min(30, stdDev * 100);
  const outlierPenalty = Math.min(30, outlierRatio * 500);
  const uniformity = Math.max(0, Math.round(100 - stdDevPenalty - outlierPenalty));

  return { uniformity, spotCount: estimatedSpots };
}

// ============================================
// 텍스처 균일도 계산 (간이)
// ============================================

/**
 * 텍스처 균일도 계산 (밝기 변화율 기반)
 * - 실제 모공 분석은 고해상도 이미지 + 엣지 검출 필요
 * - 여기서는 간이로 로컬 변화율 측정
 */
function calculateTextureUniformity(imageData: ImageData, faceMask: Uint8Array): number {
  const { data, width, height } = imageData;
  const gradients: number[] = [];

  // 3x3 Sobel 필터 적용 (간이)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (faceMask[i] === 0) continue;

      // 주변 픽셀 휘도 (상하좌우) - 그래디언트 계산용
      const topIdx = ((y - 1) * width + x) * 4;
      const bottomIdx = ((y + 1) * width + x) * 4;
      const leftIdx = (y * width + (x - 1)) * 4;
      const rightIdx = (y * width + (x + 1)) * 4;

      const top = 0.299 * data[topIdx] + 0.587 * data[topIdx + 1] + 0.114 * data[topIdx + 2];
      const bottom =
        0.299 * data[bottomIdx] + 0.587 * data[bottomIdx + 1] + 0.114 * data[bottomIdx + 2];
      const left = 0.299 * data[leftIdx] + 0.587 * data[leftIdx + 1] + 0.114 * data[leftIdx + 2];
      const right =
        0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];

      // 그래디언트 크기
      const gx = Math.abs(right - left);
      const gy = Math.abs(bottom - top);
      const gradient = Math.sqrt(gx * gx + gy * gy);

      gradients.push(gradient);
    }
  }

  if (gradients.length === 0) return 70;

  // 평균 그래디언트
  const avgGradient = gradients.reduce((a, b) => a + b, 0) / gradients.length;

  // 그래디언트가 낮을수록 텍스처 균일 (부드러운 피부)
  // 0~30 범위를 100~0 점수로 변환
  return Math.max(0, Math.round(100 - avgGradient * 3.3));
}

// ============================================
// 문제 영역 감지
// ============================================

/**
 * 영역별 문제 감지
 */
function detectProblemAreas(
  imageData: ImageData,
  faceMask: Uint8Array,
  pigmentMaps: PigmentMaps,
  landmarks: FaceLandmark[] | undefined,
  melaninUniformity: number,
  hemoglobinUniformity: number
): ProblemArea[] {
  const problems: ProblemArea[] = [];

  // 전체 균일도가 낮으면 전반적 문제
  if (melaninUniformity < 50) {
    problems.push({
      type: 'spot',
      region: 'overall',
      severity: 100 - melaninUniformity,
      description: '전반적으로 색소 침착(기미/주근깨)이 관찰됩니다.',
    });
  }

  if (hemoglobinUniformity < 50) {
    problems.push({
      type: 'redness',
      region: 'overall',
      severity: 100 - hemoglobinUniformity,
      description: '전반적으로 홍조가 관찰됩니다.',
    });
  }

  // 랜드마크가 없으면 영역별 분석 생략
  if (!landmarks || landmarks.length < 468) {
    return problems;
  }

  // 영역별 분석
  const { width, height } = imageData;
  const regions: Array<{ name: ProblemArea['region']; indices: number[] }> = [
    { name: 'forehead', indices: REGION_LANDMARKS.forehead },
    { name: 'left_cheek', indices: REGION_LANDMARKS.left_cheek },
    { name: 'right_cheek', indices: REGION_LANDMARKS.right_cheek },
    { name: 'nose', indices: REGION_LANDMARKS.nose },
    { name: 'chin', indices: REGION_LANDMARKS.chin },
  ];

  for (const region of regions) {
    const regionAnalysis = analyzeRegionUniformity(
      pigmentMaps,
      faceMask,
      landmarks,
      region.indices,
      width,
      height
    );

    if (regionAnalysis.melaninOutlierRatio > OUTLIER_RATIO_THRESHOLD) {
      problems.push({
        type: 'spot',
        region: region.name,
        severity: Math.round(regionAnalysis.melaninOutlierRatio * 500),
        description: `${getRegionKoreanName(region.name)}에 색소 침착이 있습니다.`,
      });
    }

    if (regionAnalysis.hemoglobinOutlierRatio > OUTLIER_RATIO_THRESHOLD) {
      problems.push({
        type: 'redness',
        region: region.name,
        severity: Math.round(regionAnalysis.hemoglobinOutlierRatio * 500),
        description: `${getRegionKoreanName(region.name)}에 홍조가 있습니다.`,
      });
    }
  }

  // 심각도 순 정렬
  return problems.sort((a, b) => b.severity - a.severity);
}

/**
 * 특정 영역의 균일도 분석
 */
function analyzeRegionUniformity(
  pigmentMaps: PigmentMaps,
  faceMask: Uint8Array,
  landmarks: FaceLandmark[],
  regionIndices: number[],
  width: number,
  height: number
): { melaninOutlierRatio: number; hemoglobinOutlierRatio: number } {
  // 영역 중심 계산
  let centerX = 0,
    centerY = 0;
  for (const idx of regionIndices) {
    if (idx >= landmarks.length) continue;
    centerX += landmarks[idx].x * width;
    centerY += landmarks[idx].y * height;
  }
  centerX /= regionIndices.length;
  centerY /= regionIndices.length;

  // 영역 내 픽셀 수집 (반경 30px)
  const radius = 30;
  const melaninValues: number[] = [];
  const hemoglobinValues: number[] = [];

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;

      const x = Math.round(centerX + dx);
      const y = Math.round(centerY + dy);

      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const idx = y * width + x;
      if (faceMask[idx] === 0) continue;

      melaninValues.push(pigmentMaps.melanin[idx]);
      hemoglobinValues.push(pigmentMaps.hemoglobin[idx]);
    }
  }

  if (melaninValues.length === 0) {
    return { melaninOutlierRatio: 0, hemoglobinOutlierRatio: 0 };
  }

  // 이상치 비율 계산
  const melaninMean = melaninValues.reduce((a, b) => a + b, 0) / melaninValues.length;
  const hemoglobinMean = hemoglobinValues.reduce((a, b) => a + b, 0) / hemoglobinValues.length;

  const melaninStd = Math.sqrt(
    melaninValues.reduce((sum, v) => sum + (v - melaninMean) ** 2, 0) / melaninValues.length
  );
  const hemoglobinStd = Math.sqrt(
    hemoglobinValues.reduce((sum, v) => sum + (v - hemoglobinMean) ** 2, 0) /
      hemoglobinValues.length
  );

  const melaninOutliers = melaninValues.filter(
    (v) => Math.abs(v - melaninMean) > SPOT_THRESHOLD + melaninStd
  ).length;
  const hemoglobinOutliers = hemoglobinValues.filter(
    (v) => Math.abs(v - hemoglobinMean) > REDNESS_THRESHOLD + hemoglobinStd
  ).length;

  return {
    melaninOutlierRatio: melaninOutliers / melaninValues.length,
    hemoglobinOutlierRatio: hemoglobinOutliers / hemoglobinValues.length,
  };
}

// ============================================
// 등급 및 설명 생성
// ============================================

/**
 * 균일도 점수로 등급 결정
 */
function determineGrade(score: number): UniformityGrade {
  if (score >= GRADE_THRESHOLDS.excellent) return 'excellent';
  if (score >= GRADE_THRESHOLDS.good) return 'good';
  if (score >= GRADE_THRESHOLDS.fair) return 'fair';
  return 'poor';
}

/**
 * 균일도 설명 생성
 */
function generateUniformityDescription(
  score: number,
  grade: UniformityGrade,
  spotCount: number,
  problemAreas: ProblemArea[]
): string {
  const gradeDescriptions: Record<UniformityGrade, string> = {
    excellent: '피부 톤이 매우 균일해요! 깨끗하고 건강한 피부입니다.',
    good: '피부 톤이 대체로 균일해요. 약간의 케어로 더 좋아질 수 있어요.',
    fair: '피부 톤에 다소 불균일함이 있어요. 꾸준한 관리가 필요해요.',
    poor: '피부 톤 불균일이 두드러져요. 집중 케어를 권장합니다.',
  };

  let description = gradeDescriptions[grade];

  if (spotCount > 5) {
    description += ` 약 ${spotCount}개의 색소 침착이 감지되었어요.`;
  }

  if (problemAreas.length > 0) {
    const topProblem = problemAreas[0];
    description += ` ${topProblem.description}`;
  }

  return description;
}

/**
 * 영역 이름 한국어 변환
 */
function getRegionKoreanName(region: ProblemArea['region']): string {
  const names: Record<ProblemArea['region'], string> = {
    forehead: '이마',
    left_cheek: '왼쪽 볼',
    right_cheek: '오른쪽 볼',
    nose: '코',
    chin: '턱',
    overall: '전체',
  };
  return names[region] || region;
}

// ============================================
// 영역별 균일도 요약
// ============================================

/**
 * 영역별 균일도 점수 계산
 */
export function calculateRegionalUniformity(
  pigmentMaps: PigmentMaps,
  faceMask: Uint8Array,
  landmarks: FaceLandmark[],
  width: number,
  height: number
): RegionalUniformity {
  const regions: Array<{ key: keyof RegionalUniformity; indices: number[] }> = [
    { key: 'forehead', indices: REGION_LANDMARKS.forehead },
    { key: 'leftCheek', indices: REGION_LANDMARKS.left_cheek },
    { key: 'rightCheek', indices: REGION_LANDMARKS.right_cheek },
    { key: 'nose', indices: REGION_LANDMARKS.nose },
    { key: 'chin', indices: REGION_LANDMARKS.chin },
  ];

  const result: RegionalUniformity = {
    forehead: 70,
    leftCheek: 70,
    rightCheek: 70,
    nose: 70,
    chin: 70,
  };

  for (const region of regions) {
    const analysis = analyzeRegionUniformity(
      pigmentMaps,
      faceMask,
      landmarks,
      region.indices,
      width,
      height
    );

    // 이상치 비율을 균일도 점수로 변환
    const avgOutlierRatio = (analysis.melaninOutlierRatio + analysis.hemoglobinOutlierRatio) / 2;
    result[region.key] = Math.max(0, Math.round(100 - avgOutlierRatio * 500));
  }

  return result;
}

// ============================================
// DB 저장용 변환
// ============================================

/**
 * 균일도 결과를 DB 저장용 형식으로 변환
 */
export function uniformityToDbFormat(result: SkinUniformityResult): {
  uniformity_score: number;
  grade: string;
  spot_count: number;
  details: {
    color: number;
    melanin: number;
    hemoglobin: number;
    texture: number;
  };
  problem_areas: Array<{
    type: string;
    region: string;
    severity: number;
  }>;
} {
  return {
    uniformity_score: result.overallScore,
    grade: result.grade,
    spot_count: result.spotCount,
    details: {
      color: result.colorUniformity,
      melanin: result.melaninUniformity,
      hemoglobin: result.hemoglobinUniformity,
      texture: result.textureUniformity,
    },
    problem_areas: result.problemAreas.map((p) => ({
      type: p.type,
      region: p.region,
      severity: p.severity,
    })),
  };
}

// ============================================
// Mock 데이터 생성 (Fallback용)
// ============================================

/**
 * Mock 균일도 결과 생성
 */
export function generateMockUniformityResult(): SkinUniformityResult {
  const score = 65 + Math.floor(Math.random() * 25); // 65~90
  return {
    overallScore: score,
    colorUniformity: score + Math.floor(Math.random() * 10) - 5,
    melaninUniformity: score + Math.floor(Math.random() * 10) - 5,
    hemoglobinUniformity: score + Math.floor(Math.random() * 10) - 5,
    textureUniformity: score + Math.floor(Math.random() * 10) - 5,
    spotCount: Math.floor(Math.random() * 5),
    problemAreas: [],
    grade: determineGrade(score),
    description: '피부 상태 분석이 완료되었습니다.',
  };
}
