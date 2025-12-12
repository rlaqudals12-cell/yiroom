import { WorkoutType, WorkoutInputData } from '@/types/workout';

/**
 * 운동 타입 분류 결과
 */
export interface WorkoutTypeResult {
  type: WorkoutType;
  reason: string;
}

/**
 * 운동 타입 정보 매핑
 */
export const WORKOUT_TYPE_INFO: Record<
  WorkoutType,
  {
    label: string;
    icon: string;
    description: string;
    color: string;
    bgColor: string;
  }
> = {
  toner: {
    label: '토너',
    icon: '✨',
    description: '근육 탄력과 라인 만들기에 집중',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
  },
  builder: {
    label: '빌더',
    icon: '💪',
    description: '근육량 증가와 근력 강화에 집중',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  burner: {
    label: '버너',
    icon: '🔥',
    description: '체지방 연소와 체중 감량에 집중',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
  },
  mover: {
    label: '무버',
    icon: '🏃',
    description: '체력 향상과 심폐 기능 강화에 집중',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
  },
  flexer: {
    label: '플렉서',
    icon: '🧘',
    description: '유연성과 균형감각 향상에 집중',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
  },
};

/**
 * 목표 → 운동 타입 가중치 매핑
 * 목표 ID는 step2 페이지의 GOALS 데이터와 일치
 */
const GOAL_TYPE_WEIGHTS: Record<string, Partial<Record<WorkoutType, number>>> = {
  weight_loss: { burner: 3, mover: 2, toner: 1 },
  strength: { builder: 3, toner: 2 },
  endurance: { mover: 3, burner: 2 },
  stress: { flexer: 3, mover: 1 },
  posture: { flexer: 3, toner: 2 },
};

/**
 * 신체 고민 → 운동 타입 가중치 매핑
 * 고민 ID는 step3 페이지의 CONCERNS 데이터와 일치
 */
const CONCERN_TYPE_WEIGHTS: Record<string, Partial<Record<WorkoutType, number>>> = {
  belly: { burner: 2, toner: 1 },
  thigh: { toner: 2, burner: 1 },
  arm: { toner: 2, builder: 1 },
  back: { toner: 2, builder: 1 },
  hip: { toner: 2, builder: 1 },
  calf: { toner: 2, mover: 1 },
  shoulder: { builder: 2, toner: 1 },
  overall: { burner: 2, mover: 1, toner: 1 },
};

/**
 * 운동 빈도 → 운동 타입 가중치 매핑
 */
const FREQUENCY_TYPE_WEIGHTS: Record<string, Partial<Record<WorkoutType, number>>> = {
  '1-2': { flexer: 2, toner: 1 },
  '3-4': { toner: 2, builder: 1 },
  '5-6': { burner: 2, mover: 2, builder: 1 },
  daily: { mover: 2, burner: 2 },
};

/**
 * 장비 → 운동 타입 가중치 매핑
 */
const EQUIPMENT_TYPE_WEIGHTS: Record<string, Partial<Record<WorkoutType, number>>> = {
  bodyweight: { toner: 2, mover: 1 },
  dumbbell: { builder: 2, toner: 1 },
  barbell: { builder: 3 },
  machine: { builder: 2, toner: 1 },
  band: { toner: 2, flexer: 1 },
  kettlebell: { builder: 2, burner: 1 },
  mat: { flexer: 2, toner: 1 },
  cardio_machine: { burner: 2, mover: 2 },
  pull_up_bar: { builder: 2, toner: 1 },
};

/**
 * 사용자 입력 데이터를 기반으로 운동 타입을 분류
 * @param inputData 사용자 온보딩 입력 데이터
 * @returns 분류된 운동 타입과 분류 이유
 */
export function classifyWorkoutType(
  inputData: Partial<WorkoutInputData>
): WorkoutTypeResult {
  const scores: Record<WorkoutType, number> = {
    toner: 0,
    builder: 0,
    burner: 0,
    mover: 0,
    flexer: 0,
  };

  const reasons: string[] = [];

  // 1. 목표 기반 점수 (가중치 높음)
  if (inputData.goals && inputData.goals.length > 0) {
    inputData.goals.forEach((goal) => {
      const weights = GOAL_TYPE_WEIGHTS[goal];
      if (weights) {
        Object.entries(weights).forEach(([type, weight]) => {
          scores[type as WorkoutType] += weight || 0;
        });
      }
    });

    // 이유 생성
    const goalLabels: Record<string, string> = {
      weight_loss: '체중 감량',
      strength: '근력 강화',
      endurance: '체력 향상',
      stress: '스트레스 해소',
      posture: '체형 교정',
    };
    const goalNames = inputData.goals.map((g) => goalLabels[g] || g).join(', ');
    reasons.push(`${goalNames} 목표`);
  }

  // 2. 신체 고민 기반 점수
  if (inputData.concerns && inputData.concerns.length > 0) {
    inputData.concerns.forEach((concern) => {
      const weights = CONCERN_TYPE_WEIGHTS[concern];
      if (weights) {
        Object.entries(weights).forEach(([type, weight]) => {
          scores[type as WorkoutType] += weight || 0;
        });
      }
    });
  }

  // 3. 운동 빈도 기반 점수
  if (inputData.frequency) {
    const weights = FREQUENCY_TYPE_WEIGHTS[inputData.frequency];
    if (weights) {
      Object.entries(weights).forEach(([type, weight]) => {
        scores[type as WorkoutType] += weight || 0;
      });
    }

    const freqLabels: Record<string, string> = {
      '1-2': '주 1-2회',
      '3-4': '주 3-4회',
      '5-6': '주 5-6회',
      daily: '매일',
    };
    reasons.push(`${freqLabels[inputData.frequency] || inputData.frequency} 운동 빈도`);
  }

  // 4. 장비 기반 점수
  if (inputData.equipment && inputData.equipment.length > 0) {
    inputData.equipment.forEach((equip) => {
      const weights = EQUIPMENT_TYPE_WEIGHTS[equip];
      if (weights) {
        Object.entries(weights).forEach(([type, weight]) => {
          scores[type as WorkoutType] += weight || 0;
        });
      }
    });
  }

  // 최고 점수 타입 찾기
  let maxScore = 0;
  let resultType: WorkoutType = 'toner'; // 기본값

  Object.entries(scores).forEach(([type, score]) => {
    if (score > maxScore) {
      maxScore = score;
      resultType = type as WorkoutType;
    }
  });

  // 점수가 모두 0인 경우 기본 타입
  if (maxScore === 0) {
    resultType = 'toner';
    reasons.push('기본 추천');
  }

  // 분류 이유 생성
  const typeInfo = WORKOUT_TYPE_INFO[resultType];
  const reason =
    reasons.length > 0
      ? `${reasons.join('와 ')}에 맞춰 ${typeInfo.label} 타입을 추천합니다.`
      : `${typeInfo.label} 타입을 추천합니다.`;

  return {
    type: resultType,
    reason,
  };
}
