/**
 * W-2 스포츠별 워밍업/쿨다운 프로토콜
 *
 * @module lib/workout/stretching/sport-warmup
 * @description 6개 스포츠 특화 워밍업/쿨다운 프로토콜
 * @see docs/specs/SDD-W-2-ADVANCED-STRETCHING.md
 * @see docs/research/claude-ai-research/W-2-SPORT-v2-KR.md
 *
 * 지원 스포츠: 등산, 러닝, 골프, 자전거, 수영, 테니스
 */

import type {
  SportType,
  MuscleGroup,
  StretchExercise,
  StretchingUserProfile,
  PrescribedStretch,
  StretchingPrescription,
} from '@/types/stretching';

import { STRETCH_DATABASE } from './database';

// ============================================
// 타입 정의
// ============================================

/**
 * 스포츠 프로토콜 단계
 */
export interface SportProtocolPhase {
  exercises: string[]; // 운동 ID 배열
  duration: number; // 권장 시간 (분)
  type: 'dynamic' | 'static';
  notes: string; // 단계별 안내
}

/**
 * 스포츠 프로토콜 상세
 */
export interface SportProtocol {
  sportType: SportType;
  nameKo: string;
  description: string;

  // 워밍업/쿨다운 프로토콜
  warmup: SportProtocolPhase;
  cooldown: SportProtocolPhase;

  // 타겟 근육
  keyMuscles: MuscleGroup[];

  // 부상 정보
  commonInjuries: string[];
  injuryPrevention: string[];

  // 한국 특화 정보
  koreanNotes: string[];

  // 퍼포먼스 향상 팁
  performanceTips: string[];
}

// ============================================
// 스포츠별 프로토콜 정의
// ============================================

/**
 * 등산 프로토콜
 *
 * 특징: 오르막 동심성 + 내리막 편심성 수축
 * 주요 부상: PFPS, ITBS, DOMS, 발목 염좌
 */
const HIKING_PROTOCOL: SportProtocol = {
  sportType: 'hiking',
  nameKo: '등산',
  description: '한국인이 가장 많이 즐기는 아웃도어 스포츠. 무릎과 발목 보호가 핵심.',

  warmup: {
    exercises: [
      'dyn_knee_hugs',
      'dyn_leg_swings',
      'dyn_walking_lunge',
      'dyn_high_knees',
      'dyn_butt_kicks',
      'dyn_ankle_circles',
      'dyn_torso_twist',
    ],
    duration: 10,
    type: 'dynamic',
    notes: '등산 시작 전 평지에서 실시. 관절 가동범위 확보 중점.',
  },

  cooldown: {
    exercises: [
      'str_quad_standing',
      'str_hamstring_standing',
      'str_calf_wall',
      'str_piriformis_seated',
      'str_it_band_standing',
      'str_hip_flexor_standing',
      'str_butterfly',
    ],
    duration: 15,
    type: 'static',
    notes: '하산 후 근육 긴장 완화. 특히 대퇴사두근과 종아리 집중.',
  },

  keyMuscles: [
    'quadriceps',
    'gluteus_maximus',
    'gastrocnemius',
    'hamstrings',
    'tibialis_anterior',
  ],

  commonInjuries: [
    'PFPS (슬개대퇴통증증후군)',
    'ITBS (장경인대증후군)',
    'DOMS (지연성 근육통)',
    '발목 염좌',
  ],

  injuryPrevention: [
    '트레킹 폴 사용: 무릎 하중 20-25% 감소',
    '내리막 시 보폭 줄이기',
    '적절한 등산화 착용',
    '주간 등산 빈도 점진적 증가',
  ],

  koreanNotes: [
    '짧고 가파른 코스 (북한산, 설악산): 내리막 편심성 수축으로 DOMS 주의',
    '트레킹 폴 사용 시 무릎 하중 20-25% 감소',
    '고령자(60+): 워밍업 강도 낮추고 지지대 활용',
    '하산 전 5분 내리막 보행이 DOMS를 47-64% 감소 (반복 효과)',
  ],

  performanceTips: [
    '등산 1-2시간 전 가벼운 탄수화물 섭취',
    '매 30-45분마다 수분 보충',
    '하산 시 보폭을 오르막의 70%로 줄이기',
  ],
};

/**
 * 러닝 프로토콜
 *
 * 특징: 반복적 충격 흡수
 * 주요 부상: ITBS, 족저근막염, 아킬레스건염, MTSS
 */
const RUNNING_PROTOCOL: SportProtocol = {
  sportType: 'running',
  nameKo: '러닝',
  description: 'MZ세대 인기 스포츠. 동적 워밍업이 퍼포먼스와 부상 예방에 필수.',

  warmup: {
    exercises: [
      'dyn_leg_swings',
      'dyn_leg_swings_lateral',
      'dyn_hip_circles',
      'dyn_walking_lunge',
      'dyn_high_knees',
      'dyn_butt_kicks',
      'dyn_carioca',
      'dyn_inchworm',
    ],
    duration: 10,
    type: 'dynamic',
    notes: '러닝 전 5-10분 걷기 후 동적 스트레칭. 정적 스트레칭은 퍼포먼스 저하 가능.',
  },

  cooldown: {
    exercises: [
      'str_quad_standing',
      'str_hamstring_standing',
      'str_calf_wall',
      'str_hip_flexor_standing',
      'str_piriformis_seated',
      'str_it_band_standing',
      'str_butterfly',
    ],
    duration: 10,
    type: 'static',
    notes: '러닝 직후 걷기로 심박수 낮춘 후 정적 스트레칭 10분.',
  },

  keyMuscles: [
    'quadriceps',
    'hamstrings',
    'gastrocnemius',
    'soleus',
    'gluteus_maximus',
    'iliopsoas',
  ],

  commonInjuries: [
    'ITBS (장경인대증후군)',
    '족저근막염',
    '아킬레스건염',
    'MTSS (정강이 통증)',
    '스트레스 골절',
  ],

  injuryPrevention: [
    '주간 거리 10% 이내 증가',
    'ITBS: 둔근 강화가 스트레칭보다 효과적',
    '적절한 러닝화 선택 (프로네이션 체크)',
    '노면 변화 주의 (아스팔트 vs 트레일)',
  ],

  koreanNotes: [
    'MZ세대 인기 스포츠: 초보자 주간 거리 10% 이내 증가',
    '운동 전 정적 스트레칭은 퍼포먼스 저하 가능 (60초 이상)',
    'ITBS: 둔근 강화가 스트레칭보다 효과적',
  ],

  performanceTips: [
    '러닝 2시간 전 식사 완료',
    '워밍업 후 가벼운 스트라이드 3-4회',
    '쿨다운 후 단백질+탄수화물 보충',
  ],
};

/**
 * 골프 프로토콜
 *
 * 특징: 회전 운동, 비대칭적 반복
 * 주요 부상: 요통 (18-54%), 골프 엘보, 손목 부상
 */
const GOLF_PROTOCOL: SportProtocol = {
  sportType: 'golf',
  nameKo: '골프',
  description: '회전력과 유연성이 핵심. 동적 워밍업으로 클럽헤드 스피드 향상.',

  warmup: {
    exercises: [
      'dyn_overhead_squat_club',
      'dyn_lunge_rotation',
      'dyn_split_stance_rotation',
      'dyn_hip_circles',
      'dyn_worlds_greatest',
      'dyn_arm_circles',
      'dyn_club_swing_progression',
    ],
    duration: 15,
    type: 'dynamic',
    notes: '티오프 15-20분 전 시작. 골프채를 활용한 동적 스트레칭 권장.',
  },

  cooldown: {
    exercises: [
      'str_hip_flexor_kneeling',
      'str_piriformis_seated',
      'str_spine_twist_supine',
      'str_cross_body_shoulder',
      'str_thoracic_foam_roller',
      'str_hamstring_seated',
      'str_lateral_trunk',
    ],
    duration: 10,
    type: 'static',
    notes: '라운드 후 요추와 회전근 집중 스트레칭.',
  },

  keyMuscles: [
    'obliques',
    'gluteus_maximus',
    'latissimus_dorsi',
    'pectoralis_major',
    'erector_spinae',
    'rotator_cuff',
  ],

  commonInjuries: [
    '요통 (18-54%)',
    '골프 엘보 (내측상과염)',
    '손목 부상',
    '어깨 충돌증후군',
  ],

  injuryPrevention: [
    'X-Factor 극대화 시 요추 손상 위험: 개인 가동범위 내 스윙',
    '인조 매트 연습 시 손목 충격 주의',
    '시니어: 3/4 스윙 권장',
    '코어 강화가 요통 예방에 필수',
  ],

  koreanNotes: [
    '스크린골프장 8,650개소: 인조 매트로 손목/팔꿈치 충격 증가',
    '동적 워밍업으로 클럽헤드 스피드 12.8% 향상 (연구 결과)',
    'X-Factor 극대화 시 요추 손상 위험: 개인 가동범위 내 스윙',
    '시니어(65+): 워밍업 15-20분, 3/4 스윙 권장',
  ],

  performanceTips: [
    '라운드 전 10-15분 동적 워밍업 필수',
    '연습 스윙 50-75% 강도로 시작',
    '18홀 중 9홀에서 간단한 스트레칭',
  ],
};

/**
 * 자전거 프로토콜
 *
 * 특징: 굴곡 자세 유지, 반복적 페달링
 * 주요 부상: PFPS (35.7%), 요통 (60%)
 */
const CYCLING_PROTOCOL: SportProtocol = {
  sportType: 'cycling',
  nameKo: '자전거',
  description: '고관절 굴곡 상태 장시간 유지. 바이크 피팅이 부상 예방 핵심.',

  warmup: {
    exercises: [
      'dyn_leg_swings',
      'dyn_walking_lunge',
      'dyn_hip_circles',
      'dyn_downward_dog_pedaling',
      'dyn_spiderman_rotation',
    ],
    duration: 7,
    type: 'dynamic',
    notes: '라이딩 전 가벼운 페달링 5분 + 동적 스트레칭.',
  },

  cooldown: {
    exercises: [
      'str_hamstring_seated',
      'str_hip_flexor_kneeling',
      'str_piriformis_seated',
      'str_quad_standing',
      'str_thoracic_foam_roller',
      'str_upper_trap',
    ],
    duration: 10,
    type: 'static',
    notes: '라이딩 후 고관절 굴곡근과 흉추 집중. 장거리 후 더 길게.',
  },

  keyMuscles: [
    'quadriceps',
    'hamstrings',
    'gluteus_maximus',
    'gastrocnemius',
    'iliopsoas',
    'erector_spinae',
  ],

  commonInjuries: [
    'PFPS (35.7%)',
    '요통 (60%)',
    '손목 저림',
    '회음부 불편',
  ],

  injuryPrevention: [
    '바이크 피팅이 부상 예방 핵심',
    '안장 높이/위치 최적화',
    '장거리 시 매 30분 자세 변경',
    '고관절 굴곡근 스트레칭 필수',
  ],

  koreanNotes: [
    '바이크 피팅이 부상 예방 핵심',
    '라이딩 전 정적 스트레칭은 근력 저하 가능',
    '장거리(100km+) 후 회복 스트레칭 15-20분',
  ],

  performanceTips: [
    '가벼운 기어로 5-10분 워밍업 페달링',
    '인터벌 전 10분 이상 워밍업',
    '쿨다운 페달링 후 스트레칭',
  ],
};

/**
 * 수영 프로토콜
 *
 * 특징: 어깨 과사용, 전방 근육 단축
 * 주요 부상: 수영 어깨 (27-87%), 평영 무릎 (73-86%)
 */
const SWIMMING_PROTOCOL: SportProtocol = {
  sportType: 'swimming',
  nameKo: '수영',
  description: '어깨 관절의 과사용 스포츠. 후방 관절낭 스트레칭이 충돌 예방 핵심.',

  warmup: {
    exercises: [
      'dyn_arm_circles',
      'dyn_cross_body_arm_swings',
      'dyn_shoulder_rotation',
      'dyn_lunge_rotation',
      'dyn_inchworm',
      'dyn_torso_twist',
    ],
    duration: 10,
    type: 'dynamic',
    notes: '입수 전 어깨 회전근개 활성화 집중. 물속 워밍업 200-400m 추가.',
  },

  cooldown: {
    exercises: [
      'str_chest_doorway',
      'str_cross_body_shoulder',
      'str_sleeper_stretch',
      'str_lats',
      'str_cat_cow',
      'str_thoracic_foam_roller',
    ],
    duration: 10,
    type: 'static',
    notes: '수영 후 전방 근육(흉근, 광배근) 스트레칭 필수.',
  },

  keyMuscles: [
    'latissimus_dorsi',
    'pectoralis_major',
    'deltoid',
    'rotator_cuff',
    'serratus_anterior',
  ],

  commonInjuries: [
    '수영 어깨 (27-87%)',
    '평영 무릎 (73-86%)',
    '요통',
    '목 통증',
  ],

  injuryPrevention: [
    '어깨 과사용 주의 (하루 4,000스트로크 이상 위험)',
    '전방 관절낭 이완 주의: 과신전 금지',
    '후방 관절낭 스트레칭이 충돌 예방에 필수',
    '평영 시 무릎 회전 각도 줄이기',
  ],

  koreanNotes: [
    '어깨 과사용 주의 (하루 4,000스트로크)',
    '전방 관절낭 이완 주의: 과신전 금지',
    '후방 관절낭 스트레칭(슬리퍼 스트레칭)이 충돌 예방에 필수',
  ],

  performanceTips: [
    '물속 워밍업 200-400m 필수',
    '메인 훈련 전 드릴로 폼 점검',
    '훈련 후 물속 쿨다운 100-200m',
  ],
};

/**
 * 테니스 프로토콜
 *
 * 특징: 빠른 방향 전환, 반복적 서브/스트로크
 * 주요 부상: 테니스 엘보 (5%), 어깨 부상 (11.9%)
 */
const TENNIS_PROTOCOL: SportProtocol = {
  sportType: 'tennis',
  nameKo: '테니스',
  description: '빠른 방향 전환과 회전이 핵심. 전완근과 회전근개 관리 필수.',

  warmup: {
    exercises: [
      'dyn_light_jog',
      'dyn_carioca',
      'dyn_lateral_lunge',
      'dyn_frankenstein',
      'dyn_trunk_rotation',
      'dyn_arm_circles',
      'dyn_shadow_swing',
    ],
    duration: 10,
    type: 'dynamic',
    notes: '경기 10-15분 전 시작. 미니 랠리로 마무리.',
  },

  cooldown: {
    exercises: [
      'str_wrist_extensor',
      'str_wrist_flexor',
      'str_hamstring_standing',
      'str_hip_flexor_standing',
      'str_cross_body_shoulder',
      'str_upper_trap',
      'str_forearm_stretch',
    ],
    duration: 10,
    type: 'static',
    notes: '경기 후 전완근과 어깨 집중 스트레칭.',
  },

  keyMuscles: [
    'rotator_cuff',
    'deltoid',
    'gluteus_medius',
    'quadriceps',
    'gastrocnemius',
    'obliques',
  ],

  commonInjuries: [
    '테니스 엘보 (외측상과염, 5%)',
    '어깨 부상 (11.9%)',
    '발목 염좌',
    '무릎 부상',
  ],

  injuryPrevention: [
    '그립 크기 최적화 (전완 부담 감소)',
    '편심 운동이 테니스 엘보 치료에 효과적',
    '코어 강화로 어깨 부담 감소',
    '적절한 코트 슈즈 착용',
  ],

  koreanNotes: [
    '동적 스트레칭 후 서브 속도 1.23% 향상 (연구 결과)',
    '정적 스트레칭은 경기 1시간 전까지 완료 또는 경기 후',
    '그립 크기 최적화로 테니스 엘보 예방',
  ],

  performanceTips: [
    '미니 랠리 5분으로 워밍업 마무리',
    '서브 연습은 50% 강도로 시작',
    '긴 경기 시 체인지오버마다 수분/스트레칭',
  ],
};

// ============================================
// 프로토콜 레지스트리
// ============================================

/**
 * 모든 스포츠 프로토콜
 */
export const SPORT_PROTOCOLS: Record<SportType, SportProtocol> = {
  hiking: HIKING_PROTOCOL,
  running: RUNNING_PROTOCOL,
  golf: GOLF_PROTOCOL,
  cycling: CYCLING_PROTOCOL,
  swimming: SWIMMING_PROTOCOL,
  tennis: TENNIS_PROTOCOL,
};

/**
 * 스포츠 이름 한글화
 */
export const SPORT_NAME_KO: Record<SportType, string> = {
  hiking: '등산',
  running: '러닝',
  golf: '골프',
  cycling: '자전거',
  swimming: '수영',
  tennis: '테니스',
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 스포츠 프로토콜 조회
 */
export function getSportProtocol(sport: SportType): SportProtocol {
  return SPORT_PROTOCOLS[sport];
}

/**
 * 운동 ID로 데이터베이스에서 운동 조회
 */
function findExerciseById(exerciseId: string): StretchExercise | undefined {
  return STRETCH_DATABASE.find((ex) => ex.id === exerciseId);
}

/**
 * 워밍업 운동 목록 조회
 */
export function getWarmupExercises(sport: SportType): StretchExercise[] {
  const protocol = SPORT_PROTOCOLS[sport];
  return protocol.warmup.exercises
    .map((id) => findExerciseById(id))
    .filter((ex): ex is StretchExercise => ex !== undefined);
}

/**
 * 쿨다운 운동 목록 조회
 */
export function getCooldownExercises(sport: SportType): StretchExercise[] {
  const protocol = SPORT_PROTOCOLS[sport];
  return protocol.cooldown.exercises
    .map((id) => findExerciseById(id))
    .filter((ex): ex is StretchExercise => ex !== undefined);
}

/**
 * 스포츠별 핵심 근육 조회
 */
export function getKeyMuscles(sport: SportType): MuscleGroup[] {
  return SPORT_PROTOCOLS[sport].keyMuscles;
}

/**
 * 스포츠별 부상 정보 조회
 */
export function getInjuryInfo(sport: SportType): {
  commonInjuries: string[];
  prevention: string[];
} {
  const protocol = SPORT_PROTOCOLS[sport];
  return {
    commonInjuries: protocol.commonInjuries,
    prevention: protocol.injuryPrevention,
  };
}

// ============================================
// 처방 생성 함수
// ============================================

/**
 * 스포츠 워밍업/쿨다운 처방 생성
 */
export interface SportStretchingPrescription extends StretchingPrescription {
  sport: SportType;
  phase: 'warmup' | 'cooldown';
  koreanNotes: string[];
  performanceTips: string[];
  injuryPrevention: string[];
}

/**
 * 개인화 스포츠 스트레칭 처방 생성
 */
export function generateSportPrescription(
  sport: SportType,
  phase: 'warmup' | 'cooldown',
  userProfile: StretchingUserProfile
): SportStretchingPrescription {
  const protocol = SPORT_PROTOCOLS[sport];
  const phaseProtocol = protocol[phase];

  // 운동 조회
  const exercises = phaseProtocol.exercises
    .map((id) => findExerciseById(id))
    .filter((ex): ex is StretchExercise => ex !== undefined);

  // 장비 필터링
  const availableEquipment = new Set(userProfile.availableEquipment);
  availableEquipment.add('bodyweight');

  const filteredExercises = exercises.filter((ex) =>
    ex.equipment.every((eq) => availableEquipment.has(eq))
  );

  // 특수 조건 필터링
  const conditionFiltered = filteredExercises.filter((ex) => {
    if (userProfile.specialConditions.includes('pregnancy')) {
      return !ex.contraindications.includes('pregnancy');
    }
    if (userProfile.specialConditions.includes('senior')) {
      return ex.difficulty !== 'advanced';
    }
    return true;
  });

  // 난이도 조정
  const durationMultiplier =
    userProfile.fitnessLevel === 'beginner'
      ? 0.8
      : userProfile.fitnessLevel === 'advanced'
        ? 1.2
        : 1.0;

  // PrescribedStretch 생성
  const prescribedStretches: PrescribedStretch[] = conditionFiltered.map(
    (exercise, index) => ({
      exercise,
      order: index + 1,
      adjustedDuration:
        phaseProtocol.type === 'dynamic'
          ? exercise.defaultDuration
          : Math.round(exercise.defaultDuration * durationMultiplier),
      adjustedSets: exercise.sets,
    })
  );

  // 경고 생성
  const warnings: string[] = [];

  // 연령별 경고
  if (userProfile.age >= 60 && sport === 'hiking') {
    warnings.push('고령 등산객: 동작 강도를 낮추고 지지대를 활용하세요.');
  }
  if (userProfile.age >= 65 && sport === 'golf') {
    warnings.push('시니어 골퍼: 워밍업 15-20분, 3/4 스윙을 권장합니다.');
  }

  // 특수 조건 경고
  if (userProfile.specialConditions.includes('disc_herniation')) {
    warnings.push('디스크 환자: 회전 운동 시 주의가 필요합니다.');
  }

  // 총 시간 계산
  const totalSeconds = prescribedStretches.reduce((sum, ps) => {
    const exerciseTime =
      ps.exercise.durationUnit === 'seconds'
        ? ps.adjustedDuration * ps.adjustedSets
        : ps.adjustedDuration * 3 * ps.adjustedSets;
    return sum + exerciseTime;
  }, 0);

  const phaseKo = phase === 'warmup' ? '워밍업' : '쿨다운';

  return {
    prescriptionId: `sport_${sport}_${phase}_${Date.now()}`,
    createdAt: new Date().toISOString(),
    basedOn: {
      sport,
      purpose: phase === 'warmup' ? 'warmup' : 'cooldown',
    },
    stretches: prescribedStretches,
    totalDuration: Math.ceil(totalSeconds / 60),
    frequency: `${SPORT_NAME_KO[sport]} ${phaseKo} 시 매회`,
    warnings,
    medicalDisclaimer: SPORT_MEDICAL_DISCLAIMER,

    // 스포츠 특화 정보
    sport,
    phase,
    koreanNotes: protocol.koreanNotes,
    performanceTips: protocol.performanceTips,
    injuryPrevention: protocol.injuryPrevention,
  };
}

/**
 * 스포츠별 완전한 세션 (워밍업 + 쿨다운) 생성
 */
export function generateFullSportSession(
  sport: SportType,
  userProfile: StretchingUserProfile
): {
  warmup: SportStretchingPrescription;
  cooldown: SportStretchingPrescription;
  sportInfo: {
    keyMuscles: MuscleGroup[];
    commonInjuries: string[];
    koreanNotes: string[];
  };
} {
  const protocol = SPORT_PROTOCOLS[sport];

  return {
    warmup: generateSportPrescription(sport, 'warmup', userProfile),
    cooldown: generateSportPrescription(sport, 'cooldown', userProfile),
    sportInfo: {
      keyMuscles: protocol.keyMuscles,
      commonInjuries: protocol.commonInjuries,
      koreanNotes: protocol.koreanNotes,
    },
  };
}

/**
 * 스포츠 처방 요약 텍스트 생성
 */
export function generateSportPrescriptionSummary(
  prescription: SportStretchingPrescription
): string {
  const protocol = SPORT_PROTOCOLS[prescription.sport];
  const phaseKo = prescription.phase === 'warmup' ? '워밍업' : '쿨다운';
  const lines: string[] = [];

  lines.push(`# ${protocol.nameKo} ${phaseKo} 루틴`);
  lines.push(`---`);
  lines.push(`**총 소요 시간**: 약 ${prescription.totalDuration}분`);
  lines.push(`**운동 유형**: ${prescription.phase === 'warmup' ? '동적 스트레칭' : '정적 스트레칭'}`);
  lines.push(``);

  lines.push(`## 운동 순서`);
  prescription.stretches.forEach((s) => {
    const unit = s.exercise.durationUnit === 'seconds' ? '초' : '회';
    lines.push(
      `${s.order}. **${s.exercise.nameKo}**: ${s.adjustedDuration}${unit} x ${s.adjustedSets}세트`
    );
  });
  lines.push(``);

  lines.push(`## 핵심 근육`);
  protocol.keyMuscles.forEach((m) => {
    lines.push(`- ${m}`);
  });
  lines.push(``);

  lines.push(`## 부상 예방 팁`);
  prescription.injuryPrevention.forEach((tip) => {
    lines.push(`- ${tip}`);
  });
  lines.push(``);

  if (prescription.performanceTips.length > 0) {
    lines.push(`## 퍼포먼스 향상 팁`);
    prescription.performanceTips.forEach((tip) => {
      lines.push(`- ${tip}`);
    });
    lines.push(``);
  }

  if (prescription.koreanNotes.length > 0) {
    lines.push(`## 한국인을 위한 참고사항`);
    prescription.koreanNotes.forEach((note) => {
      lines.push(`- ${note}`);
    });
  }

  return lines.join('\n');
}

/**
 * 의료 면책조항
 */
const SPORT_MEDICAL_DISCLAIMER = `
이 스포츠 스트레칭 프로그램은 일반적인 건강 정보 제공 목적으로 작성되었습니다.
개인의 건강 상태, 기존 부상, 체력 수준에 따라 적합하지 않을 수 있습니다.

다음 경우 전문가와 상담 후 운동하세요:
• 기존 관절/근육 부상이 있는 경우
• 만성 통증이 있는 경우
• 수술 후 재활 중인 경우
• 65세 이상 고령자

운동 중 통증이 발생하면 즉시 중단하고 전문가와 상담하세요.
`.trim();
