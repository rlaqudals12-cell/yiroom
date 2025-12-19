/**
 * N-1 C-1 체형 연동 인사이트 로직 (Task 3.9)
 *
 * 스펙 참조: docs/phase2/docs/N-1-feature-spec-template-v1.0.3.md
 * - N-1 → C-1: 체중 변화 감지 시 체형 재분석 유도
 * - 트리거: 체중 변화 감지 / 월간 리포트
 * - 표시: "4주간 식단 관리 성공! 체중 -2kg 달성!"
 * - [체형 재분석 받기] → C-1
 */

import { BODY_TYPES, type BodyType as BodyTypeId } from '@/lib/mock/body-analysis';

// 체형 분석 데이터 타입
export interface BodyAnalysisData {
  /** 체형 타입 */
  bodyType: BodyTypeId;
  /** 분석 시 입력한 키 (cm) */
  height: number;
  /** 분석 시 입력한 체중 (kg) */
  weight: number;
  /** 분석 날짜 */
  analyzedAt: Date;
  /** BMI */
  bmi?: number;
  /** 체지방률 */
  bodyFatPercentage?: number;
}

// 체중 변화 상태
export type WeightChangeStatus =
  | 'significant_loss' // 2kg 이상 감소
  | 'slight_loss' // 1-2kg 감소
  | 'stable' // 변화 없음 (-1kg ~ +1kg)
  | 'slight_gain' // 1-2kg 증가
  | 'significant_gain'; // 2kg 이상 증가

// 체중 변화 인사이트
export interface WeightChangeInsight {
  /** 체중 변화량 (kg) */
  weightChange: number;
  /** 변화 상태 */
  status: WeightChangeStatus;
  /** 변화 퍼센트 */
  changePercentage: number;
  /** 분석 이후 경과 일수 */
  daysSinceAnalysis: number;
  /** 메시지 */
  message: string;
}

// 체형 재분석 유도
export interface ReanalysisPrompt {
  /** 재분석 권장 여부 */
  shouldPrompt: boolean;
  /** 권장 이유 */
  reason: 'weight_change' | 'time_elapsed' | 'goal_progress' | null;
  /** 표시 메시지 */
  title: string;
  /** 상세 설명 */
  description: string;
  /** 긍정적/부정적 변화 */
  isPositive: boolean;
  /** 아이콘 */
  icon: string;
}

// 체형 기반 칼로리 조정
export interface BodyCalorieAdjustment {
  /** 기본 칼로리 목표 */
  baseCalories: number;
  /** 체형 기반 조정 칼로리 */
  adjustedCalories: number;
  /** 조정 이유 */
  adjustmentReason: string;
  /** 체형 특성 메시지 */
  bodyTypeMessage: string;
}

// 체형 연동 인사이트 결과
export interface BodyNutritionInsight {
  /** 체형 분석 완료 여부 */
  hasAnalysis: boolean;
  /** 체중 변화 인사이트 */
  weightChangeInsight: WeightChangeInsight | null;
  /** 체형 재분석 유도 */
  reanalysisPrompt: ReanalysisPrompt;
  /** 체형 기반 칼로리 조정 */
  calorieAdjustment: BodyCalorieAdjustment;
  /** 전체 요약 메시지 */
  summaryMessage: string;
}

// 체중 변화 임계값 (kg)
const WEIGHT_THRESHOLDS = {
  significant: 2.0, // 유의미한 변화
  slight: 1.0, // 소폭 변화
};

// 재분석 권장 기준
const REANALYSIS_CRITERIA = {
  /** 체중 변화 임계값 (kg) */
  weightChangeThreshold: 2.0,
  /** 경과 일수 임계값 */
  daysSinceAnalysisThreshold: 28, // 4주
};

// 체형별 기본 칼로리 조정 비율
// BodyType: X(균형), A(하체 볼륨), V(상체 볼륨), H(일자), O(라운드), I(마름), Y(어깨넓음), 8(모래시계)
const BODY_TYPE_CALORIE_ADJUSTMENTS: Record<BodyTypeId, { ratio: number; message: string }> = {
  X: {
    ratio: 1.0,
    message: 'X자형 체형은 균형 잡힌 식단이 중요해요.',
  },
  A: {
    ratio: 0.95,
    message: 'A자형 체형은 하체 관리를 위해 칼로리를 조금 줄여보세요.',
  },
  V: {
    ratio: 1.05,
    message: 'V자형 체형은 상체 근육 유지를 위해 칼로리를 충분히 섭취하세요.',
  },
  H: {
    ratio: 1.0,
    message: 'H자형 체형은 전체적인 균형을 위한 영양 섭취가 좋아요.',
  },
  O: {
    ratio: 0.9,
    message: 'O자형 체형은 체중 관리를 위해 칼로리 섭취를 조절해보세요.',
  },
  I: {
    ratio: 1.05,
    message: 'I자형 체형은 체중 유지를 위해 충분한 칼로리 섭취가 필요해요.',
  },
  Y: {
    ratio: 1.0,
    message: 'Y자형 체형은 균형 잡힌 영양 섭취를 유지하세요.',
  },
  '8': {
    ratio: 1.0,
    message: '8자형 체형은 현재의 균형을 유지하는 식단이 좋아요.',
  },
};

// 기본 칼로리 목표
const DEFAULT_BASE_CALORIES = 2000;

/**
 * 체중 변화 상태 계산
 */
function getWeightChangeStatus(weightChange: number): WeightChangeStatus {
  if (weightChange <= -WEIGHT_THRESHOLDS.significant) {
    return 'significant_loss';
  }
  if (weightChange <= -WEIGHT_THRESHOLDS.slight) {
    return 'slight_loss';
  }
  if (weightChange >= WEIGHT_THRESHOLDS.significant) {
    return 'significant_gain';
  }
  if (weightChange >= WEIGHT_THRESHOLDS.slight) {
    return 'slight_gain';
  }
  return 'stable';
}

/**
 * 체중 변화 메시지 생성
 */
function getWeightChangeMessage(
  status: WeightChangeStatus,
  weightChange: number,
  daysSinceAnalysis: number
): string {
  const absChange = Math.abs(weightChange).toFixed(1);
  const weeks = Math.floor(daysSinceAnalysis / 7);
  const weekText = weeks > 0 ? `${weeks}주간` : `${daysSinceAnalysis}일간`;

  switch (status) {
    case 'significant_loss':
      return `${weekText} 식단 관리 성공! 체중 -${absChange}kg 달성! 🎉`;
    case 'slight_loss':
      return `${weekText} 체중 -${absChange}kg 감소했어요. 잘하고 있어요!`;
    case 'significant_gain':
      return `체중이 +${absChange}kg 증가했어요. 식단 점검이 필요해요.`;
    case 'slight_gain':
      return `체중이 +${absChange}kg 증가했어요. 관리가 필요해요.`;
    case 'stable':
      return '체중이 안정적으로 유지되고 있어요. 👍';
  }
}

/**
 * 재분석 유도 메시지 생성
 */
function getReanalysisPrompt(
  bodyAnalysis: BodyAnalysisData | null,
  currentWeight: number | null,
  nutritionGoal?: string
): ReanalysisPrompt {
  // 체형 분석이 없는 경우
  if (!bodyAnalysis) {
    return {
      shouldPrompt: true,
      reason: null,
      title: '체형 분석을 시작해보세요',
      description: 'C-1 체형 분석을 완료하면 맞춤 칼로리 목표를 설정할 수 있어요!',
      isPositive: true,
      icon: '📏',
    };
  }

  const now = new Date();
  const daysSinceAnalysis = Math.floor(
    (now.getTime() - bodyAnalysis.analyzedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 체중 변화 확인
  if (currentWeight !== null) {
    const weightChange = currentWeight - bodyAnalysis.weight;

    // 유의미한 체중 감소 (긍정적)
    if (weightChange <= -REANALYSIS_CRITERIA.weightChangeThreshold) {
      return {
        shouldPrompt: true,
        reason: 'weight_change',
        title: '체형 변화 확인',
        description: '체형에도 변화가 있을 수 있어요. 재분석을 추천해요!',
        isPositive: true,
        icon: '🎉',
      };
    }

    // 유의미한 체중 증가 (관리 필요)
    if (weightChange >= REANALYSIS_CRITERIA.weightChangeThreshold) {
      return {
        shouldPrompt: true,
        reason: 'weight_change',
        title: '체형 재분석 권장',
        description: '체형 점검이 필요해요. 새로운 목표를 설정해보세요.',
        isPositive: false,
        icon: '📊',
      };
    }
  }

  // 분석 후 4주 이상 경과
  if (daysSinceAnalysis >= REANALYSIS_CRITERIA.daysSinceAnalysisThreshold) {
    const weeks = Math.floor(daysSinceAnalysis / 7);
    return {
      shouldPrompt: true,
      reason: 'time_elapsed',
      title: '정기 체형 점검',
      description: `마지막 분석 후 ${weeks}주가 지났어요. 체형 변화를 확인해보세요.`,
      isPositive: true,
      icon: '📅',
    };
  }

  // 목표 달성 중 (체중 감량 목표인 경우)
  if (nutritionGoal === 'weight_loss' && currentWeight !== null) {
    const weightChange = currentWeight - bodyAnalysis.weight;
    if (weightChange < 0) {
      return {
        shouldPrompt: false,
        reason: 'goal_progress',
        title: '목표 달성 중',
        description: '체중 감량이 진행 중이에요. 목표 달성 후 재분석을 추천해요.',
        isPositive: true,
        icon: '💪',
      };
    }
  }

  // 재분석 불필요
  return {
    shouldPrompt: false,
    reason: null,
    title: '',
    description: '',
    isPositive: true,
    icon: '',
  };
}

/**
 * 체형 기반 칼로리 조정 계산
 */
function getBodyCalorieAdjustment(
  bodyAnalysis: BodyAnalysisData | null,
  baseCalories: number = DEFAULT_BASE_CALORIES
): BodyCalorieAdjustment {
  if (!bodyAnalysis) {
    return {
      baseCalories,
      adjustedCalories: baseCalories,
      adjustmentReason: '체형 분석 후 맞춤 칼로리를 설정해드릴게요.',
      bodyTypeMessage: '',
    };
  }

  const adjustment = BODY_TYPE_CALORIE_ADJUSTMENTS[bodyAnalysis.bodyType];
  const adjustedCalories = Math.round(baseCalories * adjustment.ratio);

  let adjustmentReason = '';
  if (adjustment.ratio < 1) {
    adjustmentReason = `${bodyAnalysis.bodyType} 체형 기준 ${Math.round((1 - adjustment.ratio) * 100)}% 감소 권장`;
  } else if (adjustment.ratio > 1) {
    adjustmentReason = `${bodyAnalysis.bodyType} 체형 기준 ${Math.round((adjustment.ratio - 1) * 100)}% 증가 권장`;
  } else {
    adjustmentReason = '체형에 맞는 기본 칼로리 유지';
  }

  return {
    baseCalories,
    adjustedCalories,
    adjustmentReason,
    bodyTypeMessage: adjustment.message,
  };
}

/**
 * 체형 연동 영양 인사이트 생성
 */
export function getBodyNutritionInsight(
  bodyAnalysis: BodyAnalysisData | null,
  currentWeight: number | null = null,
  baseCalories: number = DEFAULT_BASE_CALORIES,
  nutritionGoal?: string
): BodyNutritionInsight {
  // 체형 분석이 없는 경우
  if (!bodyAnalysis) {
    return {
      hasAnalysis: false,
      weightChangeInsight: null,
      reanalysisPrompt: getReanalysisPrompt(null, null),
      calorieAdjustment: getBodyCalorieAdjustment(null, baseCalories),
      summaryMessage: 'C-1 체형 분석을 완료하면 맞춤 영양 추천을 받을 수 있어요!',
    };
  }

  // 체중 변화 인사이트 계산
  let weightChangeInsight: WeightChangeInsight | null = null;

  if (currentWeight !== null) {
    const weightChange = currentWeight - bodyAnalysis.weight;
    const now = new Date();
    const daysSinceAnalysis = Math.floor(
      (now.getTime() - bodyAnalysis.analyzedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const status = getWeightChangeStatus(weightChange);
    const changePercentage = Math.round((weightChange / bodyAnalysis.weight) * 100);

    weightChangeInsight = {
      weightChange,
      status,
      changePercentage,
      daysSinceAnalysis,
      message: getWeightChangeMessage(status, weightChange, daysSinceAnalysis),
    };
  }

  // 재분석 유도
  const reanalysisPrompt = getReanalysisPrompt(bodyAnalysis, currentWeight, nutritionGoal);

  // 칼로리 조정
  const calorieAdjustment = getBodyCalorieAdjustment(bodyAnalysis, baseCalories);

  // 요약 메시지 생성 (체형 기반 - 체중 변화는 WeightChangeSection에서 표시)
  const bodyTypeInfo = BODY_TYPES[bodyAnalysis.bodyType];
  const summaryMessage = `${bodyTypeInfo?.label || bodyAnalysis.bodyType} 체형에 맞는 식단 관리 중이에요.`;

  return {
    hasAnalysis: true,
    weightChangeInsight,
    reanalysisPrompt,
    calorieAdjustment,
    summaryMessage,
  };
}

/**
 * 체형 분석 DB 결과를 BodyAnalysisData로 변환
 * body_analyses 테이블 실제 컬럼: body_type, height, weight, created_at
 */
export function convertBodyAnalysisToData(
  dbResult: {
    body_type: string;
    height?: number | null;
    weight?: number | null;
    created_at: string;
  } | null
): BodyAnalysisData | null {
  if (!dbResult) {
    return null;
  }

  // BMI 계산 (height와 weight가 있는 경우)
  let bmi: number | undefined;
  if (dbResult.height && dbResult.weight) {
    bmi = dbResult.weight / Math.pow(dbResult.height / 100, 2);
  }

  return {
    bodyType: dbResult.body_type as BodyTypeId,
    height: dbResult.height || 0,
    weight: dbResult.weight || 0,
    analyzedAt: new Date(dbResult.created_at),
    bmi,
  };
}

/**
 * 체중 변화에 따른 목표 칼로리 추천
 */
export function getRecommendedCaloriesFromWeight(
  bodyAnalysis: BodyAnalysisData | null,
  currentWeight: number | null,
  nutritionGoal?: string
): number {
  const baseCalories = DEFAULT_BASE_CALORIES;

  if (!bodyAnalysis) {
    return baseCalories;
  }

  const adjustment = getBodyCalorieAdjustment(bodyAnalysis, baseCalories);
  let recommended = adjustment.adjustedCalories;

  // 목표에 따른 추가 조정
  if (nutritionGoal === 'weight_loss') {
    recommended = Math.round(recommended * 0.85); // 15% 감소
  } else if (nutritionGoal === 'muscle_gain') {
    recommended = Math.round(recommended * 1.15); // 15% 증가
  }

  return recommended;
}

// 상수 내보내기 (테스트용)
export {
  WEIGHT_THRESHOLDS,
  REANALYSIS_CRITERIA,
  BODY_TYPE_CALORIE_ADJUSTMENTS,
  DEFAULT_BASE_CALORIES,
};
