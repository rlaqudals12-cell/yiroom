/**
 * PC-1 색 보정 카드 가이드
 *
 * 사용자가 A4 용지(백색 기준점)를 셀카 옆에 대면
 * 조명 보정 정확도가 크게 향상됨
 *
 * @module lib/analysis/personal-color-v2/calibration-guide
 * @see docs/adr/ADR-040-cie3-lighting-correction.md
 *
 * Phase 1B: 가이드 UI + 프롬프트 개선
 * Phase 2: CIE-3 실제 캘리브레이션 알고리즘 구현
 */

// ============================================
// 캘리브레이션 카드 가이드
// ============================================

/** 캘리브레이션 카드 타입 */
export type CalibrationCardType = 'a4_paper' | 'color_checker' | 'none';

/** 캘리브레이션 가이드 메시지 */
export interface CalibrationGuide {
  /** 카드 타입 */
  type: CalibrationCardType;
  /** 사용자에게 보여줄 안내 메시지 */
  instruction: string;
  /** 기대되는 정확도 향상 */
  accuracyBoost: string;
  /** 상세 단계 */
  steps: string[];
}

/** A4 용지 기반 캘리브레이션 가이드 */
export const A4_PAPER_GUIDE: CalibrationGuide = {
  type: 'a4_paper',
  instruction: 'A4 용지를 얼굴 옆에 대고 촬영하면 조명 보정이 가능해요',
  accuracyBoost: '+10-15% 정확도 향상',
  steps: [
    '1. 흰색 A4 용지를 준비해주세요 (인쇄 안 된 깨끗한 면)',
    '2. 용지를 얼굴 옆 5-10cm에 세로로 세워주세요',
    '3. 용지가 사진에 20% 이상 보이게 촬영해주세요',
    '4. 용지에 그림자가 지지 않도록 조명 확인해주세요',
  ],
};

/**
 * 이미지에서 백색 기준점이 감지되었는지 확인하는 프롬프트 지시
 *
 * Gemini에게 "이미지에 흰 종이가 있으면 색온도 보정에 활용하라"고 지시
 * CIE-3 알고리즘 없이도 AI가 자체적으로 조명 보정 시도
 */
export const CALIBRATION_PROMPT_ADDITION = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 색 보정 카드 감지 (선택적)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
이미지에 흰색 종이/카드가 보이면:
1. 종이의 색이 순백이 아니면 → 조명이 왜곡된 것 (노란빛=백열등, 파란빛=형광등)
2. 종이의 색온도를 기준으로 피부색을 보정하여 판단
3. 보정 적용 시 imageQuality.calibrationUsed = true 표시
4. 보정 적용 시 confidence +5 보너스

종이가 없어도 분석은 정상 진행 (기존 방식)
`;

/**
 * 다회 분석 학습 가이드
 *
 * 같은 사용자가 여러 번 분석할 때 교차 검증으로 확신도 상승
 */
export interface MultiAnalysisGuide {
  analysisCount: number;
  message: string;
  nextAction: string;
}

/**
 * 분석 횟수에 따른 가이드 생성
 */
export function getMultiAnalysisGuide(analysisCount: number): MultiAnalysisGuide {
  if (analysisCount === 0) {
    return {
      analysisCount: 0,
      message: '첫 퍼스널컬러 진단이에요!',
      nextAction: '셀카를 촬영해주세요',
    };
  }

  if (analysisCount === 1) {
    return {
      analysisCount: 1,
      message: '다른 조명에서 한 번 더 촬영하면 정확도가 올라가요',
      nextAction: '자연광에서 재촬영 추천 (+10% 정확도)',
    };
  }

  if (analysisCount === 2) {
    return {
      analysisCount: 2,
      message: '2회 분석 완료! 한 번 더 하면 교차 검증으로 95%+ 가능',
      nextAction: 'A4 용지와 함께 촬영 추천 (+15% 정확도)',
    };
  }

  return {
    analysisCount,
    message: `${analysisCount}회 분석 완료 — 높은 신뢰도 달성`,
    nextAction: '결과가 일관되면 확정 판정',
  };
}
