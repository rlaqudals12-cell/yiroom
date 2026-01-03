/**
 * 시너지 인사이트 모듈
 * @description S-1 피부 분석 → PC-1 퍼스널컬러 연동 인사이트
 */

import type {
  SynergyInsight,
  ColorAdjustment,
  PigmentAnalysisSummary,
  DrapingResultsSummary,
} from '@/types/visual-analysis';

// ============================================
// 임계값 설정
// ============================================

/** 붉은기 높음 임계값 */
const HIGH_REDNESS_THRESHOLD = 0.4;

/** 멜라닌 낮음 임계값 (밝은 피부) */
const LOW_MELANIN_THRESHOLD = 0.3;

/** 멜라닌 높음 임계값 (어두운 피부) */
const HIGH_MELANIN_THRESHOLD = 0.55;

// ============================================
// 시너지 메시지 템플릿
// ============================================

interface SynergyMessageTemplate {
  message: string;
  colorAdjustment: ColorAdjustment;
  reason: SynergyInsight['reason'];
}

const SYNERGY_TEMPLATES: Record<string, SynergyMessageTemplate> = {
  high_redness: {
    message: '붉은기가 있어 차분한 뮤트 컬러가 더 잘 어울려요',
    colorAdjustment: 'muted',
    reason: 'high_redness',
  },
  low_hydration: {
    message: '밝은 피부톤이라 선명한 컬러가 생기를 더해줘요',
    colorAdjustment: 'bright',
    reason: 'low_hydration',
  },
  high_oiliness: {
    message: '피부톤이 깊어서 차분한 뮤트 컬러가 조화로워요',
    colorAdjustment: 'muted',
    reason: 'high_oiliness',
  },
  normal: {
    message: '피부 상태가 양호해요! 다양한 컬러를 시도해보세요',
    colorAdjustment: 'neutral',
    reason: 'normal',
  },
};

// ============================================
// 시너지 인사이트 생성
// ============================================

/**
 * 색소 분석 결과에서 시너지 인사이트 생성
 * @param pigmentAnalysis - 색소 분석 결과
 * @returns 시너지 인사이트
 */
export function generateSynergyInsight(pigmentAnalysis: PigmentAnalysisSummary): SynergyInsight {
  const { melanin_avg, hemoglobin_avg } = pigmentAnalysis;

  // 우선순위: 붉은기 > 멜라닌 높음 > 멜라닌 낮음 > 정상
  if (hemoglobin_avg >= HIGH_REDNESS_THRESHOLD) {
    return SYNERGY_TEMPLATES.high_redness;
  }

  if (melanin_avg >= HIGH_MELANIN_THRESHOLD) {
    return SYNERGY_TEMPLATES.high_oiliness;
  }

  if (melanin_avg <= LOW_MELANIN_THRESHOLD) {
    return SYNERGY_TEMPLATES.low_hydration;
  }

  return SYNERGY_TEMPLATES.normal;
}

/**
 * Gemini 피부 분석 결과에서 시너지 인사이트 생성
 * (기존 S-1 결과와의 호환성)
 */
export function generateSynergyFromGeminiResult(
  skinMetrics: Array<{ id: string; value: number }>
): SynergyInsight {
  // metrics 배열을 객체로 변환
  const metricsMap = Object.fromEntries(skinMetrics.map((m) => [m.id, m.value]));

  // 관련 지표 추출
  const hydration = metricsMap['hydration'] ?? 50;
  const oiliness = metricsMap['oiliness'] ?? 50;
  const redness = metricsMap['redness'] ?? 50;

  // 임계값 기반 판단 (0-100 스케일)
  if (redness >= 70) {
    return SYNERGY_TEMPLATES.high_redness;
  }

  if (hydration <= 30) {
    return SYNERGY_TEMPLATES.low_hydration;
  }

  if (oiliness >= 70) {
    return SYNERGY_TEMPLATES.high_oiliness;
  }

  return SYNERGY_TEMPLATES.normal;
}

// ============================================
// 컬러 조정 추천
// ============================================

/**
 * 컬러 조정 방향에 따른 색상 필터링
 * @param colors - 색상 배열
 * @param adjustment - 조정 방향
 * @returns 필터링된 색상 배열
 */
export function filterColorsByAdjustment(colors: string[], adjustment: ColorAdjustment): string[] {
  return colors.filter((hex) => {
    const saturation = getColorSaturation(hex);
    const brightness = getColorBrightness(hex);

    switch (adjustment) {
      case 'muted':
        // 뮤트: 채도 낮은 색상
        return saturation < 0.6;
      case 'bright':
        // 브라이트: 채도/밝기 높은 색상
        return saturation > 0.5 && brightness > 0.4;
      case 'neutral':
      default:
        return true;
    }
  });
}

/**
 * HEX 색상의 채도 계산
 */
function getColorSaturation(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return 0;

  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

/**
 * HEX 색상의 밝기 계산
 */
function getColorBrightness(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
}

// ============================================
// 통합 분석
// ============================================

/**
 * 드레이핑 결과에 시너지 인사이트 적용
 * @param drapingResults - 드레이핑 결과
 * @param synergyInsight - 시너지 인사이트
 * @returns 조정된 베스트 컬러
 */
export function applyInsightToDraping(
  drapingResults: DrapingResultsSummary,
  synergyInsight: SynergyInsight
): {
  adjustedBestColors: string[];
  avoidColors: string[];
} {
  const { best_colors } = drapingResults;
  const { colorAdjustment } = synergyInsight;

  // 조정된 베스트 컬러
  const adjustedBestColors = filterColorsByAdjustment(best_colors, colorAdjustment);

  // 피해야 할 컬러 (조정 방향의 반대)
  const oppositeAdjustment: ColorAdjustment =
    colorAdjustment === 'muted' ? 'bright' : colorAdjustment === 'bright' ? 'muted' : 'neutral';

  const avoidColors =
    colorAdjustment !== 'neutral' ? filterColorsByAdjustment(best_colors, oppositeAdjustment) : [];

  return {
    adjustedBestColors:
      adjustedBestColors.length > 0 ? adjustedBestColors : best_colors.slice(0, 3),
    avoidColors: avoidColors.slice(0, 3),
  };
}

/**
 * 시너지 인사이트 DB 저장용 형식 변환
 */
export function synergyInsightToDbFormat(insight: SynergyInsight): {
  message: string;
  color_adjustment: ColorAdjustment;
  reason: SynergyInsight['reason'];
} {
  return {
    message: insight.message,
    color_adjustment: insight.colorAdjustment,
    reason: insight.reason,
  };
}

// ============================================
// 시너지 점수 계산
// ============================================

/**
 * 피부-컬러 시너지 점수 계산
 * @param pigmentAnalysis - 색소 분석 결과
 * @param drapingResults - 드레이핑 결과
 * @returns 시너지 점수 (0-100)
 */
export function calculateSynergyScore(
  pigmentAnalysis: PigmentAnalysisSummary,
  drapingResults: DrapingResultsSummary
): number {
  // 피부 상태 점수 (멜라닌/헤모글로빈 균형)
  const skinBalanceScore =
    100 -
    Math.abs(pigmentAnalysis.melanin_avg - 0.4) * 100 -
    Math.abs(pigmentAnalysis.hemoglobin_avg - 0.3) * 100;

  // 드레이핑 균일도 점수 (베스트 컬러의 균일도)
  const uniformityScores = Object.values(drapingResults.uniformity_scores);
  const avgUniformity =
    uniformityScores.length > 0
      ? uniformityScores.reduce((a, b) => a + b, 0) / uniformityScores.length
      : 50;
  const uniformityScore = 100 - avgUniformity;

  // 가중 평균 (피부 40%, 드레이핑 60%)
  const finalScore = Math.round(skinBalanceScore * 0.4 + uniformityScore * 0.6);

  return Math.max(0, Math.min(100, finalScore));
}
