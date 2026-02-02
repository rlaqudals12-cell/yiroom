/**
 * S-2 텍스처 분석기
 * GLCM/LBP 기반 피부 텍스처 분석
 *
 * @description 피부 텍스처 분석 알고리즘
 * @see docs/principles/skin-physiology.md
 */

import type { GLCMResult, LBPResult, TextureAnalysis } from './types';

/**
 * GLCM (Gray Level Co-occurrence Matrix) 계산
 * 인접 픽셀 간 명암 패턴 분석
 *
 * @param grayPixels - 그레이스케일 픽셀 배열 (0-255)
 * @param width - 이미지 너비
 * @param height - 이미지 높이
 * @param distance - 픽셀 간 거리 (기본 1)
 * @param angle - 각도 (0, 45, 90, 135도)
 */
export function calculateGLCM(
  grayPixels: Uint8Array,
  width: number,
  height: number,
  distance: number = 1,
  angle: number = 0
): GLCMResult {
  const levels = 256;
  const glcm: number[][] = Array(levels)
    .fill(null)
    .map(() => Array(levels).fill(0));

  // 방향 오프셋 계산
  let dx = 0;
  let dy = 0;
  switch (angle) {
    case 0:
      dx = distance;
      // dy remains 0
      break;
    case 45:
      dx = distance;
      dy = -distance;
      break;
    case 90:
      // dx remains 0
      dy = distance;
      break;
    case 135:
      dx = -distance;
      dy = distance;
      break;
  }

  // GLCM 행렬 구성
  let totalPairs = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const i = grayPixels[y * width + x];
        const j = grayPixels[ny * width + nx];
        glcm[i][j]++;
        totalPairs++;
      }
    }
  }

  // 정규화
  if (totalPairs > 0) {
    for (let i = 0; i < levels; i++) {
      for (let j = 0; j < levels; j++) {
        glcm[i][j] /= totalPairs;
      }
    }
  }

  // GLCM 특징 계산
  let contrast = 0;
  let homogeneity = 0;
  let energy = 0;
  let entropy = 0;

  // 평균 계산 (상관관계용)
  let muI = 0;
  let muJ = 0;
  for (let i = 0; i < levels; i++) {
    for (let j = 0; j < levels; j++) {
      muI += i * glcm[i][j];
      muJ += j * glcm[i][j];
    }
  }

  // 표준편차 계산
  let sigmaI = 0;
  let sigmaJ = 0;
  for (let i = 0; i < levels; i++) {
    for (let j = 0; j < levels; j++) {
      sigmaI += Math.pow(i - muI, 2) * glcm[i][j];
      sigmaJ += Math.pow(j - muJ, 2) * glcm[i][j];
    }
  }
  sigmaI = Math.sqrt(sigmaI);
  sigmaJ = Math.sqrt(sigmaJ);

  let correlation = 0;

  for (let i = 0; i < levels; i++) {
    for (let j = 0; j < levels; j++) {
      const p = glcm[i][j];
      if (p > 0) {
        // Contrast: 픽셀 간 강도 차이
        contrast += Math.pow(i - j, 2) * p;

        // Homogeneity: 균일성
        homogeneity += p / (1 + Math.abs(i - j));

        // Energy: 균일성 제곱합
        energy += p * p;

        // Entropy: 복잡도
        entropy -= p * Math.log2(p);

        // Correlation: 선형 의존성
        if (sigmaI > 0 && sigmaJ > 0) {
          correlation += ((i - muI) * (j - muJ) * p) / (sigmaI * sigmaJ);
        }
      }
    }
  }

  return {
    contrast,
    homogeneity,
    energy,
    correlation,
    entropy,
  };
}

/**
 * LBP (Local Binary Pattern) 계산
 * 로컬 텍스처 패턴 분석
 *
 * @param grayPixels - 그레이스케일 픽셀 배열
 * @param width - 이미지 너비
 * @param height - 이미지 높이
 * @param radius - 샘플링 반경 (기본 1)
 * @param neighbors - 이웃 픽셀 수 (기본 8)
 */
export function calculateLBP(
  grayPixels: Uint8Array,
  width: number,
  height: number,
  radius: number = 1,
  neighbors: number = 8
): LBPResult {
  const histogram = new Array(256).fill(0);
  let uniformCount = 0;
  let totalCount = 0;

  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const centerValue = grayPixels[y * width + x];
      let lbpValue = 0;

      // 8개 이웃 픽셀 순회
      for (let n = 0; n < neighbors; n++) {
        const angle = (2 * Math.PI * n) / neighbors;
        const nx = Math.round(x + radius * Math.cos(angle));
        const ny = Math.round(y - radius * Math.sin(angle));

        const neighborValue = grayPixels[ny * width + nx];

        // 이웃이 중심보다 크거나 같으면 1, 아니면 0
        if (neighborValue >= centerValue) {
          lbpValue |= 1 << n;
        }
      }

      histogram[lbpValue]++;
      totalCount++;

      // 균일 패턴 체크 (0→1 또는 1→0 전환이 2회 이하)
      if (isUniformPattern(lbpValue)) {
        uniformCount++;
      }
    }
  }

  // 히스토그램 정규화
  if (totalCount > 0) {
    for (let i = 0; i < 256; i++) {
      histogram[i] /= totalCount;
    }
  }

  const uniformPatternRatio = totalCount > 0 ? uniformCount / totalCount : 0;

  // 거칠기 점수 계산 (엔트로피 기반)
  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (histogram[i] > 0) {
      entropy -= histogram[i] * Math.log2(histogram[i]);
    }
  }
  // 엔트로피가 낮을수록 텍스처가 균일 → 점수 높음
  const maxEntropy = Math.log2(256);
  const roughnessScore = Math.round((1 - entropy / maxEntropy) * 100);

  return {
    histogram,
    uniformPatternRatio,
    roughnessScore,
  };
}

/**
 * 균일 패턴 여부 확인
 * 비트 전환이 2회 이하면 균일 패턴
 */
function isUniformPattern(value: number): boolean {
  let transitions = 0;
  let prevBit = value & 1;

  for (let i = 1; i < 8; i++) {
    const currentBit = (value >> i) & 1;
    if (currentBit !== prevBit) {
      transitions++;
    }
    prevBit = currentBit;
  }

  // 첫 비트와 마지막 비트 비교
  if (((value >> 7) & 1) !== (value & 1)) {
    transitions++;
  }

  return transitions <= 2;
}

/**
 * 모공 점수 계산
 * GLCM contrast와 LBP 기반
 */
export function calculatePoreScore(glcm: GLCMResult, lbp: LBPResult): number {
  // contrast가 낮을수록 모공이 작음 → 점수 높음
  // uniformPatternRatio가 높을수록 균일 → 점수 높음
  const contrastScore = Math.max(0, 100 - glcm.contrast * 0.5);
  const uniformScore = lbp.uniformPatternRatio * 100;

  return Math.round((contrastScore * 0.6 + uniformScore * 0.4));
}

/**
 * 주름 점수 계산
 * GLCM entropy와 homogeneity 기반
 */
export function calculateWrinkleScore(glcm: GLCMResult): number {
  // entropy가 낮을수록 주름 적음 → 점수 높음
  // homogeneity가 높을수록 균일 → 점수 높음
  const entropyScore = Math.max(0, 100 - glcm.entropy * 10);
  const homogeneityScore = glcm.homogeneity * 100;

  return Math.round((entropyScore * 0.5 + homogeneityScore * 0.5));
}

/**
 * 피부결 점수 계산
 */
export function calculateTextureScore(glcm: GLCMResult, lbp: LBPResult): number {
  // 종합 텍스처 점수
  const smoothnessScore = glcm.homogeneity * 100;
  const uniformityScore = lbp.uniformPatternRatio * 100;
  const lowContrastScore = Math.max(0, 100 - glcm.contrast * 0.3);

  return Math.round(
    smoothnessScore * 0.4 + uniformityScore * 0.3 + lowContrastScore * 0.3
  );
}

/**
 * 전체 텍스처 분석 실행
 */
export function analyzeTexture(
  grayPixels: Uint8Array,
  width: number,
  height: number
): TextureAnalysis {
  // 4방향 GLCM 평균
  const glcm0 = calculateGLCM(grayPixels, width, height, 1, 0);
  const glcm45 = calculateGLCM(grayPixels, width, height, 1, 45);
  const glcm90 = calculateGLCM(grayPixels, width, height, 1, 90);
  const glcm135 = calculateGLCM(grayPixels, width, height, 1, 135);

  const glcm: GLCMResult = {
    contrast: (glcm0.contrast + glcm45.contrast + glcm90.contrast + glcm135.contrast) / 4,
    homogeneity: (glcm0.homogeneity + glcm45.homogeneity + glcm90.homogeneity + glcm135.homogeneity) / 4,
    energy: (glcm0.energy + glcm45.energy + glcm90.energy + glcm135.energy) / 4,
    correlation: (glcm0.correlation + glcm45.correlation + glcm90.correlation + glcm135.correlation) / 4,
    entropy: (glcm0.entropy + glcm45.entropy + glcm90.entropy + glcm135.entropy) / 4,
  };

  const lbp = calculateLBP(grayPixels, width, height);

  return {
    glcm,
    lbp,
    poreScore: calculatePoreScore(glcm, lbp),
    wrinkleScore: calculateWrinkleScore(glcm),
    textureScore: calculateTextureScore(glcm, lbp),
  };
}

/**
 * 이미지 데이터를 그레이스케일로 변환
 */
export function toGrayscale(imageData: ImageData): Uint8Array {
  const { data, width, height } = imageData;
  const grayPixels = new Uint8Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    // ITU-R BT.601 가중치
    grayPixels[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  return grayPixels;
}
