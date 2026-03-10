/**
 * W-2 자세별 스트레칭 매핑
 *
 * @module lib/workout/stretching/posture-mapping
 * @description Janda 교차증후군 기반 자세 불균형 → 스트레칭 매핑
 * @see docs/specs/SDD-W-2-ADVANCED-STRETCHING.md
 *
 * 원리:
 * - 상부교차증후군: 단축근(흉근, 상승모근) → 스트레칭
 * - 하부교차증후군: 단축근(장요근, 척추기립근) → 스트레칭
 * - 약화근 → 활성화 운동 (별도 처리)
 */

import type {
  PostureImbalanceType,
  MuscleGroup,
  StretchExercise,
  PostureAnalysisResult,
  PostureImbalance,
  SportType,
  StretchType,
} from '@/types/stretching';

// 60개 스트레칭 운동 데이터베이스에서 import
import { STRETCH_DATABASE } from './database';

// ============================================
// 자세 불균형별 단축/약화 근육 매핑
// ============================================

/**
 * Janda 자세 불균형 프로토콜
 * 단축근 → 스트레칭/억제
 * 약화근 → 활성화/강화
 */
export interface PostureProtocol {
  imbalanceType: PostureImbalanceType;
  nameKo: string;
  description: string;
  tightMuscles: MuscleGroup[];      // 스트레칭 대상
  weakMuscles: MuscleGroup[];       // 활성화 대상
  priorityOrder: number;            // 1이 가장 높음
}

export const POSTURE_PROTOCOLS: Record<PostureImbalanceType, PostureProtocol> = {
  upper_cross: {
    imbalanceType: 'upper_cross',
    nameKo: '상부교차증후군',
    description: '거북목과 라운드숄더가 복합된 상태',
    tightMuscles: [
      'pectoralis_major',
      'pectoralis_minor',
      'upper_trapezius',
      'levator_scapulae',
      'suboccipitals',
      'sternocleidomastoid',
    ],
    weakMuscles: [
      'deep_neck_flexors',
      'mid_lower_trapezius',
      'rhomboids',
      'serratus_anterior',
    ],
    priorityOrder: 1,
  },

  lower_cross: {
    imbalanceType: 'lower_cross',
    nameKo: '하부교차증후군',
    description: '골반 전방경사와 요추 과전만이 복합된 상태',
    tightMuscles: [
      'iliopsoas',
      'rectus_femoris',
      'erector_spinae',
      'quadratus_lumborum',
    ],
    weakMuscles: [
      'rectus_abdominis',
      'gluteus_maximus',
      'gluteus_medius',
      'transverse_abdominis',
    ],
    priorityOrder: 2,
  },

  forward_head: {
    imbalanceType: 'forward_head',
    nameKo: '거북목',
    description: '두개척추각(CVA) 50° 미만',
    tightMuscles: [
      'suboccipitals',
      'sternocleidomastoid',
      'upper_trapezius',
      'levator_scapulae',
    ],
    weakMuscles: [
      'deep_neck_flexors',
    ],
    priorityOrder: 3,
  },

  rounded_shoulder: {
    imbalanceType: 'rounded_shoulder',
    nameKo: '라운드숄더',
    description: '어깨가 앞으로 말린 상태',
    tightMuscles: [
      'pectoralis_major',
      'pectoralis_minor',
      'latissimus_dorsi',
    ],
    weakMuscles: [
      'mid_lower_trapezius',
      'rhomboids',
      'serratus_anterior',
    ],
    priorityOrder: 4,
  },

  pelvic_tilt_ant: {
    imbalanceType: 'pelvic_tilt_ant',
    nameKo: '골반전방경사',
    description: '골반이 앞으로 기울어진 상태',
    tightMuscles: [
      'iliopsoas',
      'rectus_femoris',
      'tensor_fasciae_latae',
    ],
    weakMuscles: [
      'gluteus_maximus',
      'rectus_abdominis',
    ],
    priorityOrder: 5,
  },

  pelvic_tilt_post: {
    imbalanceType: 'pelvic_tilt_post',
    nameKo: '골반후방경사',
    description: '골반이 뒤로 기울어진 상태 (편평등과 연관)',
    tightMuscles: [
      'hamstrings',
      'gluteus_maximus',
      'rectus_abdominis',
    ],
    weakMuscles: [
      'iliopsoas',
      'erector_spinae',
    ],
    priorityOrder: 6,
  },

  sway_back: {
    imbalanceType: 'sway_back',
    nameKo: '스웨이백',
    description: '골반이 앞으로 밀린 상태 (S자 커브 감소)',
    tightMuscles: [
      'hamstrings',
      'upper_trapezius',
      'rectus_abdominis',
    ],
    weakMuscles: [
      'iliopsoas',
      'obliques',
      'mid_lower_trapezius',
    ],
    priorityOrder: 7,
  },

  flat_back: {
    imbalanceType: 'flat_back',
    nameKo: '편평등',
    description: '요추 전만이 감소된 상태',
    tightMuscles: [
      'hamstrings',
      'rectus_abdominis',
    ],
    weakMuscles: [
      'iliopsoas',
      'erector_spinae',
    ],
    priorityOrder: 8,
  },
};

// STRETCH_DATABASE는 database.ts에서 import됨 (60개 운동)
// Re-export for backwards compatibility
export { STRETCH_DATABASE } from './database';

// ============================================
// 매핑 함수
// ============================================

/**
 * 근육군에 맞는 스트레칭 운동 찾기
 */
export function getStretchesForMuscle(
  muscle: MuscleGroup,
  stretchType?: StretchType
): StretchExercise[] {
  return STRETCH_DATABASE.filter((stretch) => {
    const muscleMatch = stretch.targetMuscles.includes(muscle);
    const typeMatch = stretchType ? stretch.type === stretchType : true;
    return muscleMatch && typeMatch;
  });
}

/**
 * 자세 불균형에 맞는 스트레칭 프로토콜 생성
 */
export function getStretchProtocolForImbalance(
  imbalanceType: PostureImbalanceType
): {
  protocol: PostureProtocol;
  stretches: StretchExercise[];
  activations: StretchExercise[];
} {
  const protocol = POSTURE_PROTOCOLS[imbalanceType];

  // 단축근 스트레칭
  const stretches: StretchExercise[] = [];
  for (const muscle of protocol.tightMuscles) {
    const muscleStretches = getStretchesForMuscle(muscle, 'static');
    for (const stretch of muscleStretches) {
      if (!stretches.find((s) => s.id === stretch.id)) {
        stretches.push(stretch);
      }
    }
  }

  // 약화근 활성화 운동 (동적 스트레칭으로 대체)
  const activations: StretchExercise[] = [];
  for (const muscle of protocol.weakMuscles) {
    const muscleActivations = getStretchesForMuscle(muscle, 'dynamic');
    for (const activation of muscleActivations) {
      if (!activations.find((a) => a.id === activation.id)) {
        activations.push(activation);
      }
    }
  }

  return { protocol, stretches, activations };
}

/**
 * 자세 분석 결과에서 스트레칭 처방 생성
 */
export function mapPostureToStretches(
  postureResult: PostureAnalysisResult
): {
  imbalances: PostureImbalance[];
  stretches: StretchExercise[];
  activations: StretchExercise[];
  priorityOrder: PostureImbalanceType[];
} {
  const allStretches: StretchExercise[] = [];
  const allActivations: StretchExercise[] = [];
  const priorityOrder: PostureImbalanceType[] = [];

  // 불균형을 우선순위로 정렬
  const sortedImbalances = [...postureResult.imbalances].sort((a, b) => {
    const protoA = POSTURE_PROTOCOLS[a.type];
    const protoB = POSTURE_PROTOCOLS[b.type];
    return protoA.priorityOrder - protoB.priorityOrder;
  });

  for (const imbalance of sortedImbalances) {
    priorityOrder.push(imbalance.type);
    const { stretches, activations } = getStretchProtocolForImbalance(imbalance.type);

    for (const stretch of stretches) {
      if (!allStretches.find((s) => s.id === stretch.id)) {
        allStretches.push(stretch);
      }
    }

    for (const activation of activations) {
      if (!allActivations.find((a) => a.id === activation.id)) {
        allActivations.push(activation);
      }
    }
  }

  return {
    imbalances: sortedImbalances,
    stretches: allStretches,
    activations: allActivations,
    priorityOrder,
  };
}

// ============================================
// 스포츠별 스트레칭 매핑
// ============================================

/**
 * 스포츠별 워밍업/쿨다운 프로토콜
 */
export const SPORT_STRETCH_PROTOCOLS: Record<
  SportType,
  {
    warmup: string[];   // 스트레칭 ID 배열
    cooldown: string[];
    focusMuscles: MuscleGroup[];
  }
> = {
  running: {
    warmup: ['dyn_leg_swings', 'dyn_hip_circles', 'dyn_walking_lunge'],
    cooldown: ['str_hamstring_standing', 'str_hip_flexor_standing', 'str_piriformis_seated'],
    focusMuscles: ['hamstrings', 'iliopsoas', 'gastrocnemius', 'quadriceps'],
  },
  hiking: {
    warmup: ['dyn_leg_swings', 'dyn_hip_circles', 'dyn_torso_twist'],
    cooldown: ['str_hamstring_standing', 'str_hip_flexor_kneeling', 'str_piriformis_seated'],
    focusMuscles: ['hamstrings', 'quadriceps', 'gluteus_maximus', 'gastrocnemius'],
  },
  golf: {
    warmup: ['dyn_torso_twist', 'dyn_arm_circles', 'dyn_hip_circles'],
    cooldown: ['str_upper_trap', 'str_chest_doorway', 'str_hamstring_standing'],
    focusMuscles: ['obliques', 'latissimus_dorsi', 'erector_spinae', 'gluteus_maximus'],
  },
  cycling: {
    warmup: ['dyn_leg_swings', 'dyn_hip_circles', 'dyn_arm_circles'],
    cooldown: ['str_hip_flexor_kneeling', 'str_hamstring_supine', 'str_upper_trap'],
    focusMuscles: ['iliopsoas', 'hamstrings', 'quadriceps', 'upper_trapezius'],
  },
  swimming: {
    warmup: ['dyn_arm_circles', 'dyn_torso_twist', 'dyn_leg_swings'],
    cooldown: ['str_chest_doorway', 'str_upper_trap', 'str_levator_scapulae'],
    focusMuscles: ['latissimus_dorsi', 'pectoralis_major', 'deltoid', 'rotator_cuff'],
  },
  tennis: {
    warmup: ['dyn_arm_circles', 'dyn_torso_twist', 'dyn_walking_lunge'],
    cooldown: ['str_chest_doorway', 'str_upper_trap', 'str_hip_flexor_standing'],
    focusMuscles: ['rotator_cuff', 'obliques', 'gluteus_maximus', 'iliopsoas'],
  },
};

/**
 * 스포츠별 스트레칭 목록 조회
 */
export function getStretchesForSport(
  sport: SportType,
  phase: 'warmup' | 'cooldown'
): StretchExercise[] {
  const protocol = SPORT_STRETCH_PROTOCOLS[sport];
  const stretchIds = phase === 'warmup' ? protocol.warmup : protocol.cooldown;

  return stretchIds
    .map((id) => STRETCH_DATABASE.find((s) => s.id === id))
    .filter((s): s is StretchExercise => s !== undefined);
}

/**
 * 근육 이름 한글화
 */
export const MUSCLE_NAME_KO: Record<MuscleGroup, string> = {
  pectoralis_major: '대흉근',
  pectoralis_minor: '소흉근',
  upper_trapezius: '상부 승모근',
  mid_lower_trapezius: '중/하부 승모근',
  levator_scapulae: '견갑거근',
  rhomboids: '능형근',
  serratus_anterior: '전거근',
  latissimus_dorsi: '광배근',
  deep_neck_flexors: '심부 경추 굴곡근',
  suboccipitals: '후두하근',
  sternocleidomastoid: '흉쇄유돌근',
  rotator_cuff: '회전근개',
  deltoid: '삼각근',
  rectus_abdominis: '복직근',
  transverse_abdominis: '복횡근',
  obliques: '복사근',
  erector_spinae: '척추기립근',
  multifidus: '다열근',
  quadratus_lumborum: '요방형근',
  iliopsoas: '장요근',
  rectus_femoris: '대퇴직근',
  gluteus_maximus: '대둔근',
  gluteus_medius: '중둔근',
  piriformis: '이상근',
  hamstrings: '햄스트링',
  quadriceps: '대퇴사두근',
  adductors: '내전근',
  tensor_fasciae_latae: '대퇴근막장근',
  iliotibial_band: '장경인대',
  gastrocnemius: '비복근',
  soleus: '가자미근',
  tibialis_anterior: '전경골근',
};
