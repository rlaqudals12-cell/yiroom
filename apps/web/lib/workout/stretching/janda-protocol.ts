/**
 * W-2 Janda 교차증후군 프로토콜
 *
 * @module lib/workout/stretching/janda-protocol
 * @description Janda 교차증후군 기반 4-8주 점진적 교정 프로토콜
 * @see docs/specs/SDD-W-2-ADVANCED-STRETCHING.md
 *
 * 원리:
 * - Janda 상부/하부 교차증후군: 단축근 스트레칭 + 약화근 활성화
 * - NASM CES 순서: 억제(Inhibit) → 스트레칭(Lengthen) → 활성화(Activate) → 통합(Integrate)
 * - ACSM 점진: 주 5-6회 스트레칭, 주 3회 강화
 */

import type {
  PostureImbalanceType,
  MuscleGroup,
  StretchExercise,
  PostureAnalysisResult,
  StretchingUserProfile,
  PrescribedStretch,
  Difficulty,
} from '@/types/stretching';

import { STRETCH_DATABASE } from './database';

// ============================================
// 타입 정의
// ============================================

/**
 * 주차별 진행 단계
 */
export interface ProgressionPhase {
  weekRange: string; // '1-2주차', '3-4주차', '5-8주차'
  focus: string; // 해당 주차의 핵심 목표
  stretchDuration: number; // 초
  stretchSets: number;
  activationReps: number;
  activationSets: number;
  strengthReps?: number;
  strengthSets?: number;
}

/**
 * NASM CES 단계
 */
export type NASMPhase = 'inhibit' | 'lengthen' | 'activate' | 'integrate';

/**
 * Janda 프로토콜 상세
 */
export interface JandaProtocol {
  imbalanceType: PostureImbalanceType;
  nameKo: string;
  description: string;

  // 타겟 근육
  tightMuscles: MuscleGroup[]; // 단축근 (스트레칭 대상)
  weakMuscles: MuscleGroup[]; // 약화근 (활성화 대상)

  // NASM CES 순서별 운동 ID
  inhibitionExercises: string[]; // SMR/폼롤링 (억제)
  stretchExercises: string[]; // 정적 스트레칭 (스트레칭)
  activationExercises: string[]; // 활성화 운동
  integrationExercises: string[]; // 기능적 통합 운동

  // 주차별 진행
  progression: {
    phase1: ProgressionPhase; // 1-2주차
    phase2: ProgressionPhase; // 3-4주차
    phase3: ProgressionPhase; // 5-8주차
  };

  // 권장 빈도
  frequency: {
    stretching: string; // '주 5-6회'
    strengthening: string; // '주 3회'
  };

  // 안전 주의사항
  precautions: string[];
}

// ============================================
// Janda 프로토콜 정의
// ============================================

/**
 * 상부교차증후군 (Upper Cross Syndrome)
 *
 * 특징: 거북목 + 라운드숄더 복합
 * 단축: 대흉근, 상승모근, 견갑거근, 후두하근
 * 약화: 심부경추굴곡근, 중/하승모근, 능형근, 전거근
 */
const UPPER_CROSS_PROTOCOL: JandaProtocol = {
  imbalanceType: 'upper_cross',
  nameKo: '상부교차증후군',
  description: '거북목과 라운드숄더가 복합된 상태. 현대인의 가장 흔한 자세 불균형.',

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

  inhibitionExercises: [
    'smr_upper_trap',
    'smr_pec_major',
    'smr_levator_scapulae',
  ],
  stretchExercises: [
    'str_chest_doorway',
    'str_upper_trap',
    'str_levator_scapulae',
    'str_suboccipital',
    'str_scm',
    'str_pec_minor_corner',
  ],
  activationExercises: [
    'act_chin_tucks',
    'act_wall_angels',
    'act_prone_y_t_w',
    'act_band_pull_apart',
  ],
  integrationExercises: [
    'int_face_pulls',
    'int_rows',
    'int_serratus_push_up',
    'int_external_rotation',
  ],

  progression: {
    phase1: {
      weekRange: '1-2주차',
      focus: '단축근 이완 집중',
      stretchDuration: 30,
      stretchSets: 2,
      activationReps: 0,
      activationSets: 0,
    },
    phase2: {
      weekRange: '3-4주차',
      focus: '활성화 운동 도입',
      stretchDuration: 30,
      stretchSets: 2,
      activationReps: 10,
      activationSets: 2,
    },
    phase3: {
      weekRange: '5-8주차',
      focus: '점진적 강화 및 통합',
      stretchDuration: 30,
      stretchSets: 3,
      activationReps: 12,
      activationSets: 3,
      strengthReps: 12,
      strengthSets: 3,
    },
  },

  frequency: {
    stretching: '주 5-6회 (매일 권장)',
    strengthening: '주 3회',
  },

  precautions: [
    '목 통증 시 부드럽게 시작하세요.',
    '어깨 불안정성 있으면 외회전 운동 주의.',
    '두통 동반 시 후두하근 스트레칭 강도 낮추기.',
  ],
};

/**
 * 하부교차증후군 (Lower Cross Syndrome)
 *
 * 특징: 골반 전방경사 + 요추 과전만
 * 단축: 장요근, 대퇴직근, 척추기립근, 요방형근
 * 약화: 복직근, 대둔근, 중둔근, 복횡근
 */
const LOWER_CROSS_PROTOCOL: JandaProtocol = {
  imbalanceType: 'lower_cross',
  nameKo: '하부교차증후군',
  description: '골반 전방경사와 요추 과전만이 복합된 상태. 허리 통증의 주요 원인.',

  tightMuscles: [
    'iliopsoas',
    'rectus_femoris',
    'erector_spinae',
    'quadratus_lumborum',
    'tensor_fasciae_latae',
  ],
  weakMuscles: [
    'rectus_abdominis',
    'transverse_abdominis',
    'gluteus_maximus',
    'gluteus_medius',
  ],

  inhibitionExercises: [
    'smr_hip_flexor',
    'smr_quad',
    'smr_tfl_it_band',
    'smr_lower_back',
  ],
  stretchExercises: [
    'str_hip_flexor_kneeling',
    'str_hip_flexor_standing',
    'str_quad_standing',
    'str_piriformis_seated',
    'str_cat_cow',
  ],
  activationExercises: [
    'act_glute_bridge',
    'act_dead_bug',
    'act_clamshell',
    'act_bird_dog',
    'act_posterior_pelvic_tilt',
  ],
  integrationExercises: [
    'int_hip_thrust',
    'int_plank',
    'int_side_plank',
    'int_pallof_press',
  ],

  progression: {
    phase1: {
      weekRange: '1-2주차',
      focus: '고관절 굴곡근 이완 집중',
      stretchDuration: 30,
      stretchSets: 2,
      activationReps: 0,
      activationSets: 0,
    },
    phase2: {
      weekRange: '3-4주차',
      focus: '둔근 활성화 도입',
      stretchDuration: 30,
      stretchSets: 2,
      activationReps: 10,
      activationSets: 2,
    },
    phase3: {
      weekRange: '5-8주차',
      focus: '코어 강화 및 통합',
      stretchDuration: 30,
      stretchSets: 3,
      activationReps: 12,
      activationSets: 3,
      strengthReps: 15,
      strengthSets: 3,
    },
  },

  frequency: {
    stretching: '주 5-6회 (매일 권장)',
    strengthening: '주 3회',
  },

  precautions: [
    '허리 통증 시 골반 기울기 운동 먼저 숙달.',
    '급격한 스트레칭 금지 - 점진적으로.',
    '디스크 문제 있으면 요추 굴곡 운동 주의.',
  ],
};

/**
 * 거북목 (Forward Head Posture)
 */
const FORWARD_HEAD_PROTOCOL: JandaProtocol = {
  imbalanceType: 'forward_head',
  nameKo: '거북목',
  description: '두개척추각(CVA) 50° 미만. 두통, 어깨 통증 원인.',

  tightMuscles: [
    'suboccipitals',
    'sternocleidomastoid',
    'upper_trapezius',
    'levator_scapulae',
  ],
  weakMuscles: ['deep_neck_flexors'],

  inhibitionExercises: ['smr_upper_trap', 'smr_suboccipital'],
  stretchExercises: [
    'str_upper_trap',
    'str_levator_scapulae',
    'str_suboccipital',
    'str_scm',
  ],
  activationExercises: ['act_chin_tucks', 'act_cervical_retraction'],
  integrationExercises: ['int_neck_flexor_strengthening'],

  progression: {
    phase1: {
      weekRange: '1-2주차',
      focus: '후두하근 이완',
      stretchDuration: 20,
      stretchSets: 3,
      activationReps: 0,
      activationSets: 0,
    },
    phase2: {
      weekRange: '3-4주차',
      focus: '턱 당기기 습관화',
      stretchDuration: 20,
      stretchSets: 3,
      activationReps: 10,
      activationSets: 5, // 하루 여러 세트
    },
    phase3: {
      weekRange: '5-8주차',
      focus: '자세 유지 강화',
      stretchDuration: 30,
      stretchSets: 3,
      activationReps: 10,
      activationSets: 5,
      strengthReps: 10,
      strengthSets: 3,
    },
  },

  frequency: {
    stretching: '매일 (2-3회/일)',
    strengthening: '주 5회',
  },

  precautions: [
    '두통 악화 시 강도 낮추기.',
    '목 디스크 환자는 의사 상담 필수.',
    '컴퓨터 작업 시 매 30분마다 턱 당기기.',
  ],
};

/**
 * 라운드숄더 (Rounded Shoulder)
 */
const ROUNDED_SHOULDER_PROTOCOL: JandaProtocol = {
  imbalanceType: 'rounded_shoulder',
  nameKo: '라운드숄더',
  description: '어깨가 앞으로 말린 상태. 어깨충돌증후군 위험.',

  tightMuscles: ['pectoralis_major', 'pectoralis_minor', 'latissimus_dorsi'],
  weakMuscles: ['mid_lower_trapezius', 'rhomboids', 'serratus_anterior'],

  inhibitionExercises: ['smr_pec_major', 'smr_lats'],
  stretchExercises: ['str_chest_doorway', 'str_pec_minor_corner', 'str_lats'],
  activationExercises: ['act_wall_angels', 'act_band_pull_apart', 'act_prone_y_t_w'],
  integrationExercises: ['int_face_pulls', 'int_rows'],

  progression: {
    phase1: {
      weekRange: '1-2주차',
      focus: '흉근 이완',
      stretchDuration: 30,
      stretchSets: 2,
      activationReps: 0,
      activationSets: 0,
    },
    phase2: {
      weekRange: '3-4주차',
      focus: '견갑골 안정화',
      stretchDuration: 30,
      stretchSets: 2,
      activationReps: 10,
      activationSets: 2,
    },
    phase3: {
      weekRange: '5-8주차',
      focus: '등 근육 강화',
      stretchDuration: 30,
      stretchSets: 3,
      activationReps: 12,
      activationSets: 3,
      strengthReps: 12,
      strengthSets: 3,
    },
  },

  frequency: {
    stretching: '주 5회',
    strengthening: '주 3회',
  },

  precautions: [
    '어깨 불안정성 있으면 과도한 스트레칭 주의.',
    '회전근개 문제 시 외회전 운동 천천히.',
  ],
};

/**
 * 골반전방경사 (Anterior Pelvic Tilt)
 */
const PELVIC_TILT_ANT_PROTOCOL: JandaProtocol = {
  imbalanceType: 'pelvic_tilt_ant',
  nameKo: '골반전방경사',
  description: '골반이 앞으로 기울어진 상태. 허리 과전만 동반.',

  tightMuscles: ['iliopsoas', 'rectus_femoris', 'tensor_fasciae_latae'],
  weakMuscles: ['gluteus_maximus', 'rectus_abdominis'],

  inhibitionExercises: ['smr_hip_flexor', 'smr_quad', 'smr_tfl_it_band'],
  stretchExercises: [
    'str_hip_flexor_kneeling',
    'str_hip_flexor_standing',
    'str_quad_standing',
    'str_tfl',
  ],
  activationExercises: [
    'act_glute_bridge',
    'act_dead_bug',
    'act_posterior_pelvic_tilt',
  ],
  integrationExercises: ['int_hip_thrust', 'int_plank', 'int_reverse_crunch'],

  progression: {
    phase1: {
      weekRange: '1-2주차',
      focus: '장요근 이완 + 골반 인지',
      stretchDuration: 30,
      stretchSets: 2,
      activationReps: 0,
      activationSets: 0,
    },
    phase2: {
      weekRange: '3-4주차',
      focus: '둔근/복근 활성화',
      stretchDuration: 30,
      stretchSets: 2,
      activationReps: 10,
      activationSets: 2,
    },
    phase3: {
      weekRange: '5-8주차',
      focus: '코어 강화',
      stretchDuration: 30,
      stretchSets: 3,
      activationReps: 12,
      activationSets: 3,
      strengthReps: 15,
      strengthSets: 3,
    },
  },

  frequency: {
    stretching: '주 5-6회',
    strengthening: '주 3회',
  },

  precautions: [
    '허리 통증 시 골반 후방 기울기 먼저.',
    '앉아있는 시간 줄이기 권장.',
  ],
};

/**
 * 골반후방경사 (Posterior Pelvic Tilt)
 */
const PELVIC_TILT_POST_PROTOCOL: JandaProtocol = {
  imbalanceType: 'pelvic_tilt_post',
  nameKo: '골반후방경사',
  description: '골반이 뒤로 기울어진 상태. 편평등과 연관.',

  tightMuscles: ['hamstrings', 'gluteus_maximus', 'rectus_abdominis'],
  weakMuscles: ['iliopsoas', 'erector_spinae'],

  inhibitionExercises: ['smr_hamstring', 'smr_glute'],
  stretchExercises: [
    'str_hamstring_standing',
    'str_hamstring_supine',
    'str_glute_figure_four',
  ],
  activationExercises: ['act_cat_cow', 'act_pelvic_tilt_supine', 'act_hip_flexor_activation'],
  integrationExercises: [
    'int_hip_flexor_strengthening',
    'int_back_extension',
    'int_superman',
  ],

  progression: {
    phase1: {
      weekRange: '1-2주차',
      focus: '가동성 회복',
      stretchDuration: 30,
      stretchSets: 2,
      activationReps: 0,
      activationSets: 0,
    },
    phase2: {
      weekRange: '3-4주차',
      focus: '정상 곡선 재학습',
      stretchDuration: 30,
      stretchSets: 2,
      activationReps: 10,
      activationSets: 2,
    },
    phase3: {
      weekRange: '5-8주차',
      focus: '척추기립근 강화',
      stretchDuration: 30,
      stretchSets: 3,
      activationReps: 12,
      activationSets: 3,
      strengthReps: 12,
      strengthSets: 3,
    },
  },

  frequency: {
    stretching: '주 4-5회',
    strengthening: '주 3회',
  },

  precautions: [
    '요추 전만 회복 시 급격한 신전 금지.',
    '디스크 환자는 의사 상담 필수.',
  ],
};

/**
 * 스웨이백 (Sway Back)
 */
const SWAY_BACK_PROTOCOL: JandaProtocol = {
  imbalanceType: 'sway_back',
  nameKo: '스웨이백',
  description: '골반이 앞으로 밀린 상태. S자 커브 감소.',

  tightMuscles: ['hamstrings', 'upper_trapezius', 'rectus_abdominis'],
  weakMuscles: ['iliopsoas', 'obliques', 'mid_lower_trapezius'],

  inhibitionExercises: ['smr_hamstring', 'smr_upper_trap'],
  stretchExercises: [
    'str_hamstring_standing',
    'str_upper_trap',
    'str_thoracic_extension',
  ],
  activationExercises: [
    'act_hip_flexor_activation',
    'act_lower_ab_engagement',
    'act_prone_y_t_w',
  ],
  integrationExercises: [
    'int_hip_flexor_strengthening',
    'int_lower_ab_exercises',
    'int_back_extension',
  ],

  progression: {
    phase1: {
      weekRange: '1-2주차',
      focus: '신경근 재교육',
      stretchDuration: 30,
      stretchSets: 2,
      activationReps: 0,
      activationSets: 0,
    },
    phase2: {
      weekRange: '3-4주차',
      focus: '자세 인지 훈련',
      stretchDuration: 30,
      stretchSets: 2,
      activationReps: 10,
      activationSets: 2,
    },
    phase3: {
      weekRange: '5-8주차',
      focus: '통합 운동',
      stretchDuration: 30,
      stretchSets: 3,
      activationReps: 12,
      activationSets: 3,
      strengthReps: 12,
      strengthSets: 3,
    },
  },

  frequency: {
    stretching: '주 4-5회',
    strengthening: '주 3회',
  },

  precautions: [
    '서있는 자세 인지 훈련 병행.',
    '장시간 서있기 피하기.',
  ],
};

/**
 * 편평등 (Flat Back)
 */
const FLAT_BACK_PROTOCOL: JandaProtocol = {
  imbalanceType: 'flat_back',
  nameKo: '편평등',
  description: '요추 전만이 감소된 상태.',

  tightMuscles: ['hamstrings', 'rectus_abdominis'],
  weakMuscles: ['iliopsoas', 'erector_spinae'],

  inhibitionExercises: ['smr_hamstring'],
  stretchExercises: ['str_hamstring_standing', 'str_hamstring_supine'],
  activationExercises: ['act_cat_cow', 'act_pelvic_tilt_supine'],
  integrationExercises: [
    'int_hip_flexor_strengthening',
    'int_back_extension',
    'int_superman',
  ],

  progression: {
    phase1: {
      weekRange: '1-2주차',
      focus: '가동성 회복',
      stretchDuration: 30,
      stretchSets: 2,
      activationReps: 0,
      activationSets: 0,
    },
    phase2: {
      weekRange: '3-4주차',
      focus: '정상 곡선 재학습',
      stretchDuration: 30,
      stretchSets: 2,
      activationReps: 10,
      activationSets: 2,
    },
    phase3: {
      weekRange: '5-8주차',
      focus: '척추기립근 강화',
      stretchDuration: 30,
      stretchSets: 3,
      activationReps: 12,
      activationSets: 3,
      strengthReps: 12,
      strengthSets: 3,
    },
  },

  frequency: {
    stretching: '주 4-5회',
    strengthening: '주 3회',
  },

  precautions: ['요추 전만 회복 시 점진적으로.'],
};

// ============================================
// 프로토콜 레지스트리
// ============================================

/**
 * 모든 Janda 프로토콜
 */
export const JANDA_PROTOCOLS: Record<PostureImbalanceType, JandaProtocol> = {
  upper_cross: UPPER_CROSS_PROTOCOL,
  lower_cross: LOWER_CROSS_PROTOCOL,
  forward_head: FORWARD_HEAD_PROTOCOL,
  rounded_shoulder: ROUNDED_SHOULDER_PROTOCOL,
  pelvic_tilt_ant: PELVIC_TILT_ANT_PROTOCOL,
  pelvic_tilt_post: PELVIC_TILT_POST_PROTOCOL,
  sway_back: SWAY_BACK_PROTOCOL,
  flat_back: FLAT_BACK_PROTOCOL,
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 프로토콜 조회
 */
export function getJandaProtocol(imbalanceType: PostureImbalanceType): JandaProtocol {
  return JANDA_PROTOCOLS[imbalanceType];
}

/**
 * 현재 주차에 해당하는 진행 단계 조회
 */
export function getProgressionPhase(
  protocol: JandaProtocol,
  currentWeek: number
): ProgressionPhase {
  if (currentWeek <= 2) {
    return protocol.progression.phase1;
  }
  if (currentWeek <= 4) {
    return protocol.progression.phase2;
  }
  return protocol.progression.phase3;
}

/**
 * NASM CES 순서로 운동 정렬
 */
export function getExercisesInNASMOrder(
  protocol: JandaProtocol,
  phase: ProgressionPhase
): {
  inhibit: string[];
  lengthen: string[];
  activate: string[];
  integrate: string[];
} {
  // Phase1에서는 억제 + 스트레칭만
  // Phase2에서는 + 활성화
  // Phase3에서는 + 통합
  const weekNum = parseInt(phase.weekRange.charAt(0));

  return {
    inhibit: protocol.inhibitionExercises,
    lengthen: protocol.stretchExercises,
    activate: weekNum >= 3 ? protocol.activationExercises : [],
    integrate: weekNum >= 5 ? protocol.integrationExercises : [],
  };
}

/**
 * 운동 ID로 데이터베이스에서 운동 조회 (fallback 지원)
 */
export function findExerciseById(exerciseId: string): StretchExercise | undefined {
  return STRETCH_DATABASE.find((ex) => ex.id === exerciseId);
}

/**
 * 복합 증후군 감지
 * 상부+하부 교차증후군이 동시에 있으면 우선순위 조정
 */
export function detectCompoundSyndrome(
  imbalances: PostureImbalanceType[]
): {
  isCompound: boolean;
  primaryFocus: PostureImbalanceType | null;
  secondaryFocus: PostureImbalanceType | null;
} {
  const hasUpperCross = imbalances.includes('upper_cross');
  const hasLowerCross = imbalances.includes('lower_cross');

  if (hasUpperCross && hasLowerCross) {
    return {
      isCompound: true,
      primaryFocus: 'lower_cross', // 하부가 상체 지지 기반
      secondaryFocus: 'upper_cross',
    };
  }

  // 단일 증후군 우선순위
  const priorityOrder: PostureImbalanceType[] = [
    'upper_cross',
    'lower_cross',
    'forward_head',
    'rounded_shoulder',
    'pelvic_tilt_ant',
    'pelvic_tilt_post',
    'sway_back',
    'flat_back',
  ];

  const sorted = imbalances.sort(
    (a, b) => priorityOrder.indexOf(a) - priorityOrder.indexOf(b)
  );

  return {
    isCompound: false,
    primaryFocus: sorted[0] || null,
    secondaryFocus: sorted[1] || null,
  };
}

// ============================================
// 처방 생성 함수
// ============================================

/**
 * Janda 프로토콜 기반 상세 처방 생성
 */
export interface JandaPrescription {
  prescriptionId: string;
  imbalanceType: PostureImbalanceType;
  currentWeek: number;
  phase: ProgressionPhase;

  // NASM CES 순서 운동
  exercises: {
    inhibit: PrescribedStretch[];
    lengthen: PrescribedStretch[];
    activate: PrescribedStretch[];
    integrate: PrescribedStretch[];
  };

  // 메타 정보
  totalDuration: number; // 분
  frequency: string;
  precautions: string[];
  nextPhaseInfo: string;
}

/**
 * 난이도별 조정 계수
 */
const DIFFICULTY_ADJUSTMENTS: Record<
  Difficulty,
  { durationMult: number; setsMult: number; repsMult: number }
> = {
  beginner: { durationMult: 0.8, setsMult: 0.75, repsMult: 0.75 },
  intermediate: { durationMult: 1.0, setsMult: 1.0, repsMult: 1.0 },
  advanced: { durationMult: 1.2, setsMult: 1.25, repsMult: 1.25 },
};

/**
 * 개인화 Janda 처방 생성
 */
export function generateJandaPrescription(
  imbalanceType: PostureImbalanceType,
  currentWeek: number,
  userProfile: StretchingUserProfile
): JandaPrescription {
  const protocol = getJandaProtocol(imbalanceType);
  const phase = getProgressionPhase(protocol, currentWeek);
  const exercisesByPhase = getExercisesInNASMOrder(protocol, phase);
  const diffAdj = DIFFICULTY_ADJUSTMENTS[userProfile.fitnessLevel];

  // 조정된 파라미터
  const adjDuration = Math.round(phase.stretchDuration * diffAdj.durationMult);
  const adjSets = Math.max(1, Math.round(phase.stretchSets * diffAdj.setsMult));
  const adjReps = Math.round(phase.activationReps * diffAdj.repsMult);
  const adjActSets = Math.max(1, Math.round(phase.activationSets * diffAdj.setsMult));

  // 운동 매핑
  const mapToPrescibed = (
    ids: string[],
    duration: number,
    sets: number
  ): PrescribedStretch[] => {
    return ids
      .map((id, idx) => {
        const exercise = findExerciseById(id);
        if (!exercise) return null;
        return {
          exercise,
          order: idx + 1,
          adjustedDuration: duration,
          adjustedSets: sets,
        };
      })
      .filter((p): p is PrescribedStretch => p !== null);
  };

  const inhibitExercises = mapToPrescibed(
    exercisesByPhase.inhibit,
    60, // SMR은 60초
    1
  );
  const lengthenExercises = mapToPrescibed(
    exercisesByPhase.lengthen,
    adjDuration,
    adjSets
  );
  const activateExercises = mapToPrescibed(
    exercisesByPhase.activate,
    adjReps, // reps 기반
    adjActSets
  );
  const integrateExercises = mapToPrescibed(
    exercisesByPhase.integrate,
    phase.strengthReps || 12,
    phase.strengthSets || 3
  );

  // 총 시간 계산 (대략적)
  const totalSeconds =
    inhibitExercises.length * 60 +
    lengthenExercises.reduce((sum, e) => sum + e.adjustedDuration * e.adjustedSets, 0) +
    activateExercises.reduce((sum, e) => sum + e.adjustedDuration * 3 * e.adjustedSets, 0) +
    integrateExercises.reduce((sum, e) => sum + e.adjustedDuration * 3 * e.adjustedSets, 0);

  // 다음 단계 안내
  let nextPhaseInfo = '';
  if (currentWeek <= 2) {
    nextPhaseInfo = '3주차부터 활성화 운동이 추가됩니다.';
  } else if (currentWeek <= 4) {
    nextPhaseInfo = '5주차부터 강화 운동이 추가됩니다.';
  } else {
    nextPhaseInfo = '현재 단계를 4주간 유지 후 재평가하세요.';
  }

  return {
    prescriptionId: `janda_${imbalanceType}_${Date.now()}`,
    imbalanceType,
    currentWeek,
    phase,
    exercises: {
      inhibit: inhibitExercises,
      lengthen: lengthenExercises,
      activate: activateExercises,
      integrate: integrateExercises,
    },
    totalDuration: Math.ceil(totalSeconds / 60),
    frequency: protocol.frequency.stretching,
    precautions: protocol.precautions,
    nextPhaseInfo,
  };
}

/**
 * 복합 증후군 처방 생성
 */
export function generateCompoundPrescription(
  postureAnalysis: PostureAnalysisResult,
  currentWeek: number,
  userProfile: StretchingUserProfile
): JandaPrescription[] {
  const imbalanceTypes = postureAnalysis.imbalances.map((im) => im.type);
  const compound = detectCompoundSyndrome(imbalanceTypes);

  const prescriptions: JandaPrescription[] = [];

  if (compound.primaryFocus) {
    prescriptions.push(
      generateJandaPrescription(compound.primaryFocus, currentWeek, userProfile)
    );
  }

  // 복합일 경우 보조 프로토콜도 추가 (간소화 버전)
  if (compound.isCompound && compound.secondaryFocus) {
    const secondaryPrescription = generateJandaPrescription(
      compound.secondaryFocus,
      currentWeek,
      userProfile
    );
    // 보조는 스트레칭만 포함
    secondaryPrescription.exercises.activate = [];
    secondaryPrescription.exercises.integrate = [];
    prescriptions.push(secondaryPrescription);
  }

  return prescriptions;
}

/**
 * 처방 요약 텍스트 생성
 */
export function generateJandaPrescriptionSummary(prescription: JandaPrescription): string {
  const protocol = getJandaProtocol(prescription.imbalanceType);
  const lines: string[] = [];

  lines.push(`# ${protocol.nameKo} 교정 프로토콜`);
  lines.push(`---`);
  lines.push(`**현재 단계**: ${prescription.phase.weekRange}`);
  lines.push(`**목표**: ${prescription.phase.focus}`);
  lines.push(`**총 소요 시간**: 약 ${prescription.totalDuration}분`);
  lines.push(`**권장 빈도**: ${prescription.frequency}`);
  lines.push(``);

  lines.push(`## NASM CES 순서`);

  if (prescription.exercises.inhibit.length > 0) {
    lines.push(`### 1. 억제 (Inhibit) - SMR/폼롤링`);
    prescription.exercises.inhibit.forEach((e) => {
      lines.push(`- ${e.exercise.nameKo}: 60초`);
    });
  }

  if (prescription.exercises.lengthen.length > 0) {
    lines.push(`### 2. 스트레칭 (Lengthen)`);
    prescription.exercises.lengthen.forEach((e) => {
      lines.push(
        `- ${e.exercise.nameKo}: ${e.adjustedDuration}초 x ${e.adjustedSets}세트`
      );
    });
  }

  if (prescription.exercises.activate.length > 0) {
    lines.push(`### 3. 활성화 (Activate)`);
    prescription.exercises.activate.forEach((e) => {
      lines.push(
        `- ${e.exercise.nameKo}: ${e.adjustedDuration}회 x ${e.adjustedSets}세트`
      );
    });
  }

  if (prescription.exercises.integrate.length > 0) {
    lines.push(`### 4. 통합 (Integrate)`);
    prescription.exercises.integrate.forEach((e) => {
      lines.push(
        `- ${e.exercise.nameKo}: ${e.adjustedDuration}회 x ${e.adjustedSets}세트`
      );
    });
  }

  lines.push(``);
  lines.push(`## 주의사항`);
  prescription.precautions.forEach((p) => {
    lines.push(`- ${p}`);
  });

  lines.push(``);
  lines.push(`---`);
  lines.push(`**다음 단계**: ${prescription.nextPhaseInfo}`);

  return lines.join('\n');
}
