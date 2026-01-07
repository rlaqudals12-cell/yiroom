/**
 * Visual Analysis Mock 데이터
 * @description MediaPipe CDN 실패 시 Fallback용 Mock
 */

import type {
  FaceLandmark,
  FaceLandmarkResult,
  PigmentAnalysisSummary,
  DrapingResultsSummary,
  SynergyInsight,
  DrapeResult,
} from '@/types/visual-analysis';

// ============================================
// 랜드마크 Mock 인덱스 (MediaPipe Face Mesh 기준)
// ============================================

/** 얼굴 윤곽 랜드마크 인덱스 (36개) */
export const FACE_OVAL_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148,
  176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
];

/** 왼쪽 눈 랜드마크 인덱스 (16개) */
export const LEFT_EYE_INDICES = [
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
];

/** 오른쪽 눈 랜드마크 인덱스 (16개) */
export const RIGHT_EYE_INDICES = [
  362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398,
];

/** 입술 랜드마크 인덱스 (외곽 20개) */
export const LIPS_INDICES = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185,
];

// ============================================
// Mock 랜드마크 생성
// ============================================

/**
 * Mock 얼굴 랜드마크 생성
 * - 468개 3D 좌표 (정규화된 값)
 * - 실제 얼굴 형태를 대략적으로 모방
 */
export function generateMockLandmarks(): FaceLandmarkResult {
  const landmarks: FaceLandmark[] = [];

  // 468개 랜드마크 생성 (얼굴 중앙 기준 분포)
  for (let i = 0; i < 468; i++) {
    // 얼굴 영역 중심 (0.5, 0.4)에서 분포
    const angle = (i / 468) * Math.PI * 2;
    const radius = 0.15 + Math.random() * 0.1;

    landmarks.push({
      x: 0.5 + Math.cos(angle) * radius * (0.8 + Math.random() * 0.4),
      y: 0.4 + Math.sin(angle) * radius * 0.6 + (i % 10) * 0.01,
      z: -0.05 + Math.random() * 0.1,
    });
  }

  // 주요 영역 좌표 재조정 (더 현실적인 위치)
  // 얼굴 윤곽
  FACE_OVAL_INDICES.forEach((idx, i) => {
    const angle = (i / FACE_OVAL_INDICES.length) * Math.PI * 2 - Math.PI / 2;
    landmarks[idx] = {
      x: 0.5 + Math.cos(angle) * 0.25,
      y: 0.45 + Math.sin(angle) * 0.35,
      z: -0.02 + Math.abs(Math.cos(angle)) * 0.05,
    };
  });

  // 왼쪽 눈
  LEFT_EYE_INDICES.forEach((idx, i) => {
    const angle = (i / LEFT_EYE_INDICES.length) * Math.PI * 2;
    landmarks[idx] = {
      x: 0.35 + Math.cos(angle) * 0.05,
      y: 0.35 + Math.sin(angle) * 0.02,
      z: 0.01,
    };
  });

  // 오른쪽 눈
  RIGHT_EYE_INDICES.forEach((idx, i) => {
    const angle = (i / RIGHT_EYE_INDICES.length) * Math.PI * 2;
    landmarks[idx] = {
      x: 0.65 + Math.cos(angle) * 0.05,
      y: 0.35 + Math.sin(angle) * 0.02,
      z: 0.01,
    };
  });

  // 입술
  LIPS_INDICES.forEach((idx, i) => {
    const angle = (i / LIPS_INDICES.length) * Math.PI * 2;
    landmarks[idx] = {
      x: 0.5 + Math.cos(angle) * 0.08,
      y: 0.65 + Math.sin(angle) * 0.03,
      z: 0.02,
    };
  });

  return {
    landmarks,
    faceOval: FACE_OVAL_INDICES,
    leftEye: LEFT_EYE_INDICES,
    rightEye: RIGHT_EYE_INDICES,
    lips: LIPS_INDICES,
  };
}

// ============================================
// Mock 색소 분석 결과
// ============================================

/**
 * Mock 색소 분석 결과 생성
 * - 평균 멜라닌/헤모글로빈 값
 * - 분포 히스토그램
 */
export function generateMockPigmentAnalysis(): PigmentAnalysisSummary {
  // 일반적인 피부톤 범위 Mock (중간 명도)
  const melaninBase = 0.35 + Math.random() * 0.2; // 0.35 ~ 0.55
  const hemoglobinBase = 0.25 + Math.random() * 0.15; // 0.25 ~ 0.40

  // 10구간 분포 생성 (정규분포 유사)
  const distribution = Array.from({ length: 10 }, (_, i) => {
    const center = 5;
    const dist = Math.abs(i - center);
    return Math.max(0.05, 0.3 - dist * 0.05 + Math.random() * 0.1);
  });

  // 정규화
  const sum = distribution.reduce((a, b) => a + b, 0);
  const normalizedDist = distribution.map((v) => Math.round((v / sum) * 100) / 100);

  return {
    melanin_avg: Math.round(melaninBase * 100) / 100,
    hemoglobin_avg: Math.round(hemoglobinBase * 100) / 100,
    distribution: normalizedDist,
  };
}

// ============================================
// Mock 드레이핑 결과
// ============================================

/** 시즌별 대표 색상 */
const SEASON_COLORS = {
  spring: ['#FF7F50', '#FFB347', '#F0E68C', '#98FB98', '#87CEEB'],
  summer: ['#E6E6FA', '#DDA0DD', '#B0C4DE', '#87CEFA', '#F0FFF0'],
  autumn: ['#D2691E', '#CD853F', '#8B4513', '#A0522D', '#BC8F8F'],
  winter: ['#191970', '#800020', '#2F4F4F', '#4B0082', '#000080'],
};

/**
 * Mock 드레이핑 결과 생성
 * - 베스트 컬러 5개
 * - 균일도 점수
 * - 금속 테스트
 */
export function generateMockDrapingResults(): DrapingResultsSummary {
  // 랜덤 시즌 선택 (균등 분포)
  const seasons = ['spring', 'summer', 'autumn', 'winter'] as const;
  const weights = [0.25, 0.25, 0.25, 0.25];
  const random = Math.random();
  let cumulative = 0;
  let selectedSeason: (typeof seasons)[number] = 'spring';

  for (let i = 0; i < seasons.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) {
      selectedSeason = seasons[i];
      break;
    }
  }

  const bestColors = SEASON_COLORS[selectedSeason];
  const uniformityScores: Record<string, number> = {};

  bestColors.forEach((color, i) => {
    // 순위가 높을수록 균일도 점수가 낮음 (좋음)
    uniformityScores[color] = Math.round((10 + i * 5 + Math.random() * 10) * 10) / 10;
  });

  // 금속 테스트: 웜톤(봄/가을)은 골드, 쿨톤(여름/겨울)은 실버
  const metalTest = selectedSeason === 'spring' || selectedSeason === 'autumn' ? 'gold' : 'silver';

  return {
    best_colors: bestColors,
    uniformity_scores: uniformityScores,
    metal_test: metalTest,
  };
}

// ============================================
// Mock 드레이프 순위 결과
// ============================================

/**
 * Mock 드레이프 분석 순위 생성
 */
export function generateMockDrapeResults(): DrapeResult[] {
  const summary = generateMockDrapingResults();

  return summary.best_colors.map((color, index) => ({
    color,
    uniformity: summary.uniformity_scores[color],
    rank: index + 1,
  }));
}

// ============================================
// Mock 시너지 인사이트
// ============================================

/** 시너지 메시지 템플릿 */
const SYNERGY_MESSAGES = {
  high_redness: '붉은기가 있어 차분한 뮤트 컬러가 더 잘 어울려요',
  low_hydration: '수분감이 낮아 밝고 화사한 컬러로 생기를 더해보세요',
  high_oiliness: '피지가 많은 편이라 매트한 느낌의 컬러를 추천드려요',
  normal: '피부 상태가 양호해요! 다양한 컬러를 시도해보세요',
};

/**
 * Mock 시너지 인사이트 생성
 * - 피부 분석 + 퍼스널 컬러 연계 인사이트
 */
export function generateMockSynergyInsight(
  pigmentAnalysis?: PigmentAnalysisSummary
): SynergyInsight {
  // 색소 분석 기반 상태 판단
  let reason: SynergyInsight['reason'] = 'normal';
  let colorAdjustment: SynergyInsight['colorAdjustment'] = 'neutral';

  if (pigmentAnalysis) {
    if (pigmentAnalysis.hemoglobin_avg > 0.35) {
      reason = 'high_redness';
      colorAdjustment = 'muted';
    } else if (pigmentAnalysis.melanin_avg < 0.3) {
      reason = 'low_hydration';
      colorAdjustment = 'bright';
    } else if (pigmentAnalysis.melanin_avg > 0.5) {
      reason = 'high_oiliness';
      colorAdjustment = 'muted';
    }
  } else {
    // 랜덤 생성
    const reasons: SynergyInsight['reason'][] = [
      'high_redness',
      'low_hydration',
      'high_oiliness',
      'normal',
    ];
    reason = reasons[Math.floor(Math.random() * reasons.length)];
    colorAdjustment =
      reason === 'normal' ? 'neutral' : reason === 'low_hydration' ? 'bright' : 'muted';
  }

  return {
    message: SYNERGY_MESSAGES[reason],
    colorAdjustment,
    reason,
  };
}

// ============================================
// 통합 Mock 생성
// ============================================

/**
 * 전체 시각 분석 Mock 데이터 생성
 */
export function generateMockVisualAnalysis() {
  const landmarks = generateMockLandmarks();
  const pigmentAnalysis = generateMockPigmentAnalysis();
  const drapingResults = generateMockDrapingResults();
  const synergyInsight = generateMockSynergyInsight(pigmentAnalysis);

  return {
    landmarks,
    pigmentAnalysis,
    drapingResults,
    synergyInsight,
    isMock: true,
  };
}
