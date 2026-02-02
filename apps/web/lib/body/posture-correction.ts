/**
 * 자세 교정 운동 추천 모듈
 *
 * @module lib/body/posture-correction
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md 섹션 4.1 B-05
 * @see docs/principles/body-mechanics.md
 *
 * 체형별 자세 문제와 교정 운동을 제공합니다.
 */

import type { BodyShape7 } from './types';

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * 자세 문제 유형
 */
export type PostureIssue =
  | 'forward_head' // 거북목
  | 'rounded_shoulders' // 굽은 어깨
  | 'kyphosis' // 등굽음 (과도한 후만)
  | 'lordosis' // 요추 과전만
  | 'anterior_pelvic_tilt' // 골반 전방경사
  | 'posterior_pelvic_tilt' // 골반 후방경사
  | 'scoliosis' // 척추측만
  | 'flat_back' // 일자허리
  | 'uneven_shoulders' // 어깨 비대칭
  | 'leg_length_discrepancy'; // 다리 길이 차이

/**
 * 교정 운동 정보
 */
export interface CorrectionExercise {
  /** 운동 ID */
  id: string;
  /** 운동 이름 */
  name: string;
  /** 운동 설명 */
  description: string;
  /** 타겟 부위 */
  targetArea: string;
  /** 권장 시간/횟수 */
  duration: string;
  /** 권장 빈도 */
  frequency: string;
  /** 동작 단계 */
  steps: string[];
  /** 주의사항 */
  cautions: string[];
  /** 난이도 (1-3) */
  difficulty: 1 | 2 | 3;
  /** 영상 URL (선택) */
  videoUrl?: string;
  /** 이미지 URL (선택) */
  imageUrl?: string;
}

/**
 * 자세 문제 상세 정보
 */
export interface PostureIssueDetail {
  /** 문제 유형 */
  type: PostureIssue;
  /** 한국어 이름 */
  name: string;
  /** 설명 */
  description: string;
  /** 원인 */
  causes: string[];
  /** 증상 */
  symptoms: string[];
  /** 권장 운동 ID 목록 */
  recommendedExerciseIds: string[];
}

/**
 * 체형별 자세 교정 가이드
 */
export interface PostureCorrectionGuide {
  /** 체형 */
  bodyType: BodyShape7;
  /** 일반적인 자세 문제 */
  commonIssues: PostureIssue[];
  /** 권장 운동 */
  exercises: CorrectionExercise[];
  /** 일상 생활 팁 */
  dailyTips: string[];
  /** 주의사항 */
  warnings: string[];
}

// ============================================================================
// 상수 정의
// ============================================================================

/**
 * 자세 문제 상세 정보
 */
export const POSTURE_ISSUES: Record<PostureIssue, PostureIssueDetail> = {
  forward_head: {
    type: 'forward_head',
    name: '거북목 (전방두부자세)',
    description: '머리가 어깨보다 앞으로 나와 있는 자세로, 목과 어깨에 부담을 줍니다.',
    causes: ['장시간 스마트폰 사용', '컴퓨터 모니터 높이 부적절', '구부정한 자세'],
    symptoms: ['목 통증', '두통', '어깨 결림', '목 뒤 근육 뭉침'],
    recommendedExerciseIds: ['chin_tuck', 'neck_stretch', 'chest_stretch'],
  },
  rounded_shoulders: {
    type: 'rounded_shoulders',
    name: '굽은 어깨 (라운드 숄더)',
    description: '어깨가 앞으로 말린 자세로, 가슴 근육은 짧아지고 등 근육은 늘어납니다.',
    causes: ['오래 앉아 있는 생활', '가슴 운동 편중', '약한 등 근육'],
    symptoms: ['어깨 통증', '가슴 답답함', '호흡 제한', '상부 등 통증'],
    recommendedExerciseIds: ['chest_stretch', 'wall_angel', 'band_pull_apart'],
  },
  kyphosis: {
    type: 'kyphosis',
    name: '등굽음 (과도한 후만증)',
    description: '등이 과도하게 굽은 상태로, 흔히 "곱추"라고 불립니다.',
    causes: ['골다공증', '오래 앉아 있는 생활', '나쁜 자세 습관'],
    symptoms: ['등 통증', '피로감', '호흡 곤란', '외관상 문제'],
    recommendedExerciseIds: ['cat_cow', 'thoracic_extension', 'back_extension'],
  },
  lordosis: {
    type: 'lordosis',
    name: '요추 과전만',
    description: '허리가 과도하게 앞으로 휜 상태입니다.',
    causes: ['약한 복근', '엉덩이 굴곡근 단축', '임신', '비만'],
    symptoms: ['허리 통증', '엉덩이 통증', '다리 저림'],
    recommendedExerciseIds: ['pelvic_tilt', 'dead_bug', 'hip_flexor_stretch'],
  },
  anterior_pelvic_tilt: {
    type: 'anterior_pelvic_tilt',
    name: '골반 전방경사',
    description: '골반이 앞으로 기울어진 상태로, 배가 나와 보입니다.',
    causes: ['오래 앉아 있는 생활', '약한 복근/둔근', '단축된 장요근'],
    symptoms: ['허리 통증', '배 돌출', '엉덩이 돌출', '허벅지 앞쪽 긴장'],
    recommendedExerciseIds: ['pelvic_tilt', 'glute_bridge', 'hip_flexor_stretch'],
  },
  posterior_pelvic_tilt: {
    type: 'posterior_pelvic_tilt',
    name: '골반 후방경사',
    description: '골반이 뒤로 기울어진 상태로, 허리가 평평해 보입니다.',
    causes: ['오래 앉아 있는 생활', '단축된 햄스트링', '약한 장요근'],
    symptoms: ['허리 통증', '일자허리', '둔근 약화'],
    recommendedExerciseIds: ['hip_flexor_activation', 'hamstring_stretch', 'lumbar_extension'],
  },
  scoliosis: {
    type: 'scoliosis',
    name: '척추측만증',
    description: '척추가 옆으로 휜 상태입니다. 전문 의료 상담을 권장합니다.',
    causes: ['선천적 요인', '근육 불균형', '나쁜 자세 습관', '외상'],
    symptoms: ['어깨 높이 차이', '골반 비대칭', '등 통증', '피로감'],
    recommendedExerciseIds: ['side_plank', 'cat_cow', 'bird_dog'],
  },
  flat_back: {
    type: 'flat_back',
    name: '일자허리 (평배)',
    description: '허리의 자연스러운 곡선이 감소한 상태입니다.',
    causes: ['잘못된 자세 교정', '과도한 복근 운동', '골반 후방경사'],
    symptoms: ['허리 통증', '장시간 서있기 어려움', '유연성 감소'],
    recommendedExerciseIds: ['lumbar_extension', 'cat_cow', 'cobra_stretch'],
  },
  uneven_shoulders: {
    type: 'uneven_shoulders',
    name: '어깨 비대칭',
    description: '한쪽 어깨가 다른 쪽보다 높거나 낮은 상태입니다.',
    causes: ['한쪽 어깨만 사용하는 습관', '척추측만', '근육 불균형'],
    symptoms: ['어깨 통증', '목 통증', '두통', '피로'],
    recommendedExerciseIds: ['shoulder_shrug', 'side_stretch', 'wall_angel'],
  },
  leg_length_discrepancy: {
    type: 'leg_length_discrepancy',
    name: '다리 길이 차이',
    description:
      '양쪽 다리 길이가 다른 상태로, 실제 또는 기능적 차이일 수 있습니다.',
    causes: ['선천적 요인', '골반 비틀림', '근육 불균형', '외상'],
    symptoms: ['허리 통증', '보행 이상', '골반 통증', '한쪽 피로'],
    recommendedExerciseIds: ['pelvic_tilt', 'piriformis_stretch', 'hip_flexor_stretch'],
  },
};

/**
 * 교정 운동 데이터베이스
 */
export const CORRECTION_EXERCISES: Record<string, CorrectionExercise> = {
  chin_tuck: {
    id: 'chin_tuck',
    name: '턱 당기기 (Chin Tuck)',
    description:
      '거북목 교정의 기본 운동으로, 목 뒤 근육을 강화하고 전방 목 자세를 개선합니다.',
    targetArea: '목 뒤 근육',
    duration: '10-15회',
    frequency: '하루 3-4회',
    steps: [
      '바른 자세로 앉거나 서세요.',
      '시선은 정면을 바라봅니다.',
      '턱을 뒤로 당기듯이 목을 뒤로 밀어주세요.',
      '이중턱을 만든다는 느낌으로 5초간 유지합니다.',
      '천천히 원래 자세로 돌아옵니다.',
    ],
    cautions: ['목을 과도하게 젖히지 마세요.', '통증이 느껴지면 즉시 중단하세요.'],
    difficulty: 1,
  },
  neck_stretch: {
    id: 'neck_stretch',
    name: '목 스트레칭',
    description: '긴장된 목 근육을 이완시키는 스트레칭입니다.',
    targetArea: '목 옆면, 승모근',
    duration: '30초씩 양쪽',
    frequency: '하루 2-3회',
    steps: [
      '바른 자세로 앉으세요.',
      '오른손으로 머리 왼쪽을 가볍게 잡습니다.',
      '머리를 오른쪽으로 천천히 기울입니다.',
      '왼쪽 목에 스트레칭이 느껴지면 30초간 유지합니다.',
      '반대쪽도 동일하게 반복합니다.',
    ],
    cautions: ['무리하게 당기지 마세요.', '통증이 아닌 당김이 느껴져야 합니다.'],
    difficulty: 1,
  },
  chest_stretch: {
    id: 'chest_stretch',
    name: '가슴 스트레칭',
    description: '단축된 가슴 근육을 늘려 어깨 자세를 개선합니다.',
    targetArea: '대흉근, 소흉근',
    duration: '30초씩',
    frequency: '하루 3-4회',
    steps: [
      '문틀이나 벽 모서리에 서세요.',
      '팔꿈치를 90도로 구부리고 팔뚝을 벽에 대세요.',
      '한 발 앞으로 내딛으며 가슴을 앞으로 밀어주세요.',
      '가슴 앞쪽에 스트레칭이 느껴지면 30초간 유지합니다.',
    ],
    cautions: ['어깨에 통증이 있으면 중단하세요.', '과도하게 밀지 마세요.'],
    difficulty: 1,
  },
  wall_angel: {
    id: 'wall_angel',
    name: '월 엔젤 (Wall Angel)',
    description: '등 근육을 활성화하고 어깨 가동성을 개선합니다.',
    targetArea: '등 상부, 어깨',
    duration: '10-15회',
    frequency: '하루 2-3회',
    steps: [
      '벽에 등, 머리, 엉덩이를 붙이고 서세요.',
      '팔꿈치와 손등도 벽에 붙입니다.',
      '팔을 천천히 위로 올리면서 벽에서 떨어지지 않게 유지하세요.',
      '최대한 올린 후 천천히 내립니다.',
    ],
    cautions: ['허리가 벽에서 떨어지지 않도록 주의하세요.', '천천히 움직이세요.'],
    difficulty: 2,
  },
  band_pull_apart: {
    id: 'band_pull_apart',
    name: '밴드 풀 어파트',
    description: '등 상부와 후면 어깨 근육을 강화합니다.',
    targetArea: '능형근, 후면 삼각근',
    duration: '15-20회, 3세트',
    frequency: '주 3-4회',
    steps: [
      '탄성 밴드를 양손으로 잡고 팔을 앞으로 뻗으세요.',
      '팔꿈치를 살짝 구부린 상태를 유지합니다.',
      '어깨뼈를 모으듯이 밴드를 옆으로 벌립니다.',
      '천천히 원래 자세로 돌아옵니다.',
    ],
    cautions: ['어깨를 으쓱하지 마세요.', '등 근육 수축에 집중하세요.'],
    difficulty: 2,
  },
  cat_cow: {
    id: 'cat_cow',
    name: '고양이-낙타 자세',
    description: '척추 유연성을 높이고 등 근육을 이완시킵니다.',
    targetArea: '전체 척추',
    duration: '10-15회',
    frequency: '하루 2-3회',
    steps: [
      '네발기기 자세를 취하세요.',
      '숨을 내쉬며 등을 천장으로 둥글게 말아 올립니다 (고양이).',
      '숨을 마시며 배를 바닥으로 내리고 고개를 듭니다 (낙타).',
      '호흡에 맞춰 천천히 반복합니다.',
    ],
    cautions: ['목을 과도하게 젖히지 마세요.', '부드럽게 움직이세요.'],
    difficulty: 1,
  },
  thoracic_extension: {
    id: 'thoracic_extension',
    name: '흉추 신전 스트레칭',
    description: '등 상부의 가동성을 높이고 굽은 등을 개선합니다.',
    targetArea: '흉추',
    duration: '30초, 5-10회',
    frequency: '하루 2-3회',
    steps: [
      '폼롤러 위에 등 상부를 대고 눕습니다.',
      '손을 머리 뒤로 깍지 끼고 팔꿈치를 모읍니다.',
      '엉덩이를 들지 않은 상태로 등을 뒤로 젖힙니다.',
      '5초간 유지 후 원래 자세로 돌아옵니다.',
    ],
    cautions: ['허리가 아닌 등 상부에서 움직임이 일어나야 합니다.', '목을 보호하세요.'],
    difficulty: 2,
  },
  back_extension: {
    id: 'back_extension',
    name: '백 익스텐션',
    description: '등 근육을 강화하고 자세를 개선합니다.',
    targetArea: '척추기립근',
    duration: '10-15회, 3세트',
    frequency: '주 2-3회',
    steps: [
      '바닥에 엎드려 눕습니다.',
      '손을 귀 옆에 가볍게 대세요.',
      '상체를 천천히 들어 올립니다.',
      '2초간 유지 후 천천히 내립니다.',
    ],
    cautions: ['과도하게 들어 올리지 마세요.', '허리에 통증이 있으면 중단하세요.'],
    difficulty: 2,
  },
  pelvic_tilt: {
    id: 'pelvic_tilt',
    name: '골반 기울이기',
    description: '골반 정렬을 교정하고 허리 안정성을 높입니다.',
    targetArea: '복근, 허리',
    duration: '10-15회',
    frequency: '하루 2-3회',
    steps: [
      '바닥에 누워 무릎을 구부립니다.',
      '배꼽을 척추 쪽으로 당기듯이 허리를 바닥에 붙입니다.',
      '5-10초간 유지합니다.',
      '천천히 이완합니다.',
    ],
    cautions: ['숨을 참지 마세요.', '엉덩이를 들지 마세요.'],
    difficulty: 1,
  },
  dead_bug: {
    id: 'dead_bug',
    name: '데드 버그',
    description: '코어 안정성을 높이고 골반 조절 능력을 개선합니다.',
    targetArea: '복근, 코어',
    duration: '10회씩 양쪽, 3세트',
    frequency: '주 3-4회',
    steps: [
      '바닥에 누워 팔과 다리를 천장으로 들어 올립니다.',
      '허리가 바닥에서 떨어지지 않게 유지하세요.',
      '한쪽 팔과 반대쪽 다리를 천천히 내립니다.',
      '원래 자세로 돌아온 후 반대쪽 반복합니다.',
    ],
    cautions: ['허리가 들리면 범위를 줄이세요.', '천천히 조절하며 움직이세요.'],
    difficulty: 2,
  },
  hip_flexor_stretch: {
    id: 'hip_flexor_stretch',
    name: '장요근 스트레칭',
    description: '단축된 고관절 굴곡근을 이완시킵니다.',
    targetArea: '장요근, 대퇴직근',
    duration: '30초씩 양쪽',
    frequency: '하루 2-3회',
    steps: [
      '한쪽 무릎을 바닥에 대고 런지 자세를 취합니다.',
      '앞쪽 무릎은 90도를 유지하세요.',
      '엉덩이를 앞으로 밀며 뒤쪽 다리 앞면에 스트레칭을 느낍니다.',
      '30초간 유지 후 반대쪽 반복합니다.',
    ],
    cautions: ['허리가 과도하게 젖혀지지 않게 주의하세요.'],
    difficulty: 1,
  },
  glute_bridge: {
    id: 'glute_bridge',
    name: '글루트 브릿지',
    description: '둔근을 강화하고 골반 안정성을 높입니다.',
    targetArea: '대둔근, 햄스트링',
    duration: '15-20회, 3세트',
    frequency: '주 3-4회',
    steps: [
      '바닥에 누워 무릎을 구부립니다.',
      '발은 엉덩이 너비로 벌리고 바닥에 평평하게 둡니다.',
      '엉덩이를 천장으로 들어 올려 무릎-엉덩이-어깨가 일직선이 되게 합니다.',
      '엉덩이를 조이며 2초간 유지 후 천천히 내립니다.',
    ],
    cautions: ['허리가 과하게 젖혀지지 않게 주의하세요.', '둔근 수축에 집중하세요.'],
    difficulty: 1,
  },
  side_plank: {
    id: 'side_plank',
    name: '사이드 플랭크',
    description: '측면 코어를 강화하고 척추 안정성을 높입니다.',
    targetArea: '복사근, 코어',
    duration: '20-30초씩 양쪽',
    frequency: '주 3-4회',
    steps: [
      '옆으로 누워 팔꿈치를 어깨 아래에 둡니다.',
      '엉덩이를 들어 올려 발목-무릎-어깨가 일직선이 되게 합니다.',
      '20-30초간 유지합니다.',
      '반대쪽도 동일하게 반복합니다.',
    ],
    cautions: ['엉덩이가 앞뒤로 빠지지 않게 유지하세요.', '어깨가 귀에 닿지 않게 하세요.'],
    difficulty: 2,
  },
  bird_dog: {
    id: 'bird_dog',
    name: '버드독',
    description: '코어 안정성과 균형을 동시에 훈련합니다.',
    targetArea: '코어, 등, 둔근',
    duration: '10회씩 양쪽, 3세트',
    frequency: '주 3-4회',
    steps: [
      '네발기기 자세를 취합니다.',
      '한쪽 팔과 반대쪽 다리를 동시에 수평으로 뻗습니다.',
      '3초간 유지 후 천천히 내립니다.',
      '반대쪽 반복합니다.',
    ],
    cautions: ['허리가 처지거나 들리지 않게 유지하세요.', '천천히 조절하며 움직이세요.'],
    difficulty: 2,
  },
  cobra_stretch: {
    id: 'cobra_stretch',
    name: '코브라 스트레칭',
    description: '복근을 스트레칭하고 척추 신전을 개선합니다.',
    targetArea: '복근, 척추',
    duration: '15-30초, 3-5회',
    frequency: '하루 2-3회',
    steps: [
      '바닥에 엎드려 눕습니다.',
      '손바닥을 어깨 옆에 둡니다.',
      '팔을 펴며 상체를 들어 올립니다.',
      '골반은 바닥에 붙인 채 15-30초 유지합니다.',
    ],
    cautions: ['허리에 통증이 있으면 중단하세요.', '팔 힘보다 등 근육으로 들어 올리세요.'],
    difficulty: 1,
  },
  hip_flexor_activation: {
    id: 'hip_flexor_activation',
    name: '장요근 활성화',
    description: '약해진 고관절 굴곡근을 강화합니다.',
    targetArea: '장요근',
    duration: '10-15회씩 양쪽, 3세트',
    frequency: '주 3-4회',
    steps: [
      '의자에 앉거나 바닥에 누워 무릎을 90도로 구부립니다.',
      '한쪽 무릎을 가슴 쪽으로 들어 올립니다.',
      '손으로 저항을 주며 5초간 버팁니다.',
      '천천히 내린 후 반대쪽 반복합니다.',
    ],
    cautions: ['허리가 들리지 않게 주의하세요.'],
    difficulty: 1,
  },
  hamstring_stretch: {
    id: 'hamstring_stretch',
    name: '햄스트링 스트레칭',
    description: '뒤쪽 허벅지 근육을 이완시킵니다.',
    targetArea: '햄스트링',
    duration: '30초씩 양쪽',
    frequency: '하루 2-3회',
    steps: [
      '바닥에 누워 한쪽 다리를 들어 올립니다.',
      '수건이나 밴드로 발을 잡습니다.',
      '무릎을 가능한 펴며 당깁니다.',
      '뒤쪽 허벅지에 스트레칭이 느껴지면 30초 유지합니다.',
    ],
    cautions: ['무릎을 완전히 펴지 못해도 괜찮습니다.', '무리하게 당기지 마세요.'],
    difficulty: 1,
  },
  lumbar_extension: {
    id: 'lumbar_extension',
    name: '요추 신전 운동',
    description: '허리의 자연스러운 곡선을 회복합니다.',
    targetArea: '요추',
    duration: '10-15회',
    frequency: '하루 2-3회',
    steps: [
      '바닥에 엎드려 눕습니다.',
      '팔꿈치를 바닥에 대고 상체를 살짝 들어 올립니다.',
      '편안한 범위에서 10-15초 유지합니다.',
      '천천히 내려옵니다.',
    ],
    cautions: ['통증이 있으면 범위를 줄이세요.', '급격히 움직이지 마세요.'],
    difficulty: 1,
  },
  shoulder_shrug: {
    id: 'shoulder_shrug',
    name: '어깨 으쓱하기',
    description: '어깨 근육의 긴장을 풀고 균형을 잡습니다.',
    targetArea: '승모근',
    duration: '10-15회',
    frequency: '하루 3-4회',
    steps: [
      '바른 자세로 서거나 앉습니다.',
      '양 어깨를 귀 쪽으로 들어 올립니다.',
      '5초간 유지합니다.',
      '천천히 내리며 이완합니다.',
    ],
    cautions: ['목에 힘을 주지 마세요.'],
    difficulty: 1,
  },
  side_stretch: {
    id: 'side_stretch',
    name: '옆구리 스트레칭',
    description: '측면 근육을 이완시키고 비대칭을 개선합니다.',
    targetArea: '측면 몸통',
    duration: '30초씩 양쪽',
    frequency: '하루 2-3회',
    steps: [
      '바른 자세로 서서 팔을 머리 위로 올립니다.',
      '한쪽 손목을 다른 손으로 잡습니다.',
      '잡은 손 방향으로 상체를 기울입니다.',
      '반대쪽 옆구리에 스트레칭이 느껴지면 30초 유지합니다.',
    ],
    cautions: ['앞이나 뒤로 숙이지 말고 옆으로만 기울이세요.'],
    difficulty: 1,
  },
  piriformis_stretch: {
    id: 'piriformis_stretch',
    name: '이상근 스트레칭',
    description: '엉덩이 깊은 곳의 이상근을 이완시킵니다.',
    targetArea: '이상근',
    duration: '30초씩 양쪽',
    frequency: '하루 2-3회',
    steps: [
      '바닥에 누워 무릎을 구부립니다.',
      '한쪽 발목을 반대쪽 무릎 위에 올립니다.',
      '아래쪽 다리를 양손으로 당겨 가슴 쪽으로 끌어당깁니다.',
      '엉덩이 깊은 곳에 스트레칭이 느껴지면 30초 유지합니다.',
    ],
    cautions: ['무릎에 통증이 있으면 중단하세요.'],
    difficulty: 1,
  },
};

// ============================================================================
// 체형별 자세 가이드
// ============================================================================

/**
 * 체형별 일반적인 자세 문제 매핑
 */
const BODY_TYPE_ISSUES: Record<BodyShape7, PostureIssue[]> = {
  pear: ['rounded_shoulders', 'kyphosis', 'posterior_pelvic_tilt'],
  invertedTriangle: ['lordosis', 'anterior_pelvic_tilt'],
  rectangle: ['flat_back', 'forward_head'],
  hourglass: ['lordosis', 'anterior_pelvic_tilt'],
  oval: ['kyphosis', 'lordosis', 'forward_head'],
  apple: ['uneven_shoulders', 'scoliosis'],
  trapezoid: ['rounded_shoulders', 'forward_head'],
};

/**
 * 체형별 일상 생활 팁
 */
const DAILY_TIPS: Record<BodyShape7, string[]> = {
  pear: [
    '상체 근력 운동으로 균형을 맞춰보세요.',
    '가슴을 펴고 어깨를 뒤로 당기는 습관을 들이세요.',
  ],
  invertedTriangle: [
    '복근과 하체 운동을 병행하세요.',
    '장시간 앉아 있을 때 허리 쿠션을 사용하세요.',
  ],
  rectangle: ['전신 운동으로 근육량을 늘려보세요.', '바른 자세를 의식적으로 유지하세요.'],
  hourglass: ['코어 운동으로 허리를 보호하세요.', '높은 굽보다 편한 신발을 권장합니다.'],
  oval: [
    '규칙적인 유산소 운동을 권장합니다.',
    '장시간 앉아 있을 때 자주 일어나 스트레칭하세요.',
  ],
  apple: ['양쪽 균형을 맞추는 운동을 하세요.', '한쪽으로 가방을 메지 마세요.'],
  trapezoid: ['상체 스트레칭을 자주 하세요.', '컴퓨터 모니터 높이를 눈높이에 맞추세요.'],
};

// ============================================================================
// 메인 함수
// ============================================================================

/**
 * 자세 문제에 대한 교정 운동 조회
 */
export function getExercisesForIssue(issue: PostureIssue): CorrectionExercise[] {
  const issueDetail = POSTURE_ISSUES[issue];
  return issueDetail.recommendedExerciseIds
    .map((id) => CORRECTION_EXERCISES[id])
    .filter(Boolean);
}

/**
 * 체형별 자세 교정 가이드 생성
 *
 * @param bodyType 체형 (7-type)
 * @returns 자세 교정 가이드
 */
export function getPostureCorrectionGuide(bodyType: BodyShape7): PostureCorrectionGuide {
  const commonIssues = BODY_TYPE_ISSUES[bodyType];

  // 체형별 일반적인 문제에 대한 운동 수집
  const exerciseIds = new Set<string>();
  commonIssues.forEach((issue) => {
    POSTURE_ISSUES[issue].recommendedExerciseIds.forEach((id) => exerciseIds.add(id));
  });

  const exercises = Array.from(exerciseIds)
    .map((id) => CORRECTION_EXERCISES[id])
    .filter(Boolean);

  return {
    bodyType,
    commonIssues,
    exercises,
    dailyTips: DAILY_TIPS[bodyType],
    warnings: [
      '심한 통증이 있을 경우 운동을 중단하고 전문의와 상담하세요.',
      '운동 전 충분한 워밍업을 해주세요.',
      '처음에는 가벼운 강도로 시작하여 점진적으로 늘려가세요.',
    ],
  };
}

/**
 * 특정 자세 문제에 대한 상세 정보 조회
 */
export function getPostureIssueDetail(issue: PostureIssue): PostureIssueDetail {
  return POSTURE_ISSUES[issue];
}

/**
 * 운동 ID로 운동 정보 조회
 */
export function getExerciseById(exerciseId: string): CorrectionExercise | undefined {
  return CORRECTION_EXERCISES[exerciseId];
}

/**
 * 난이도별 운동 필터링
 */
export function filterExercisesByDifficulty(
  exercises: CorrectionExercise[],
  maxDifficulty: 1 | 2 | 3
): CorrectionExercise[] {
  return exercises.filter((e) => e.difficulty <= maxDifficulty);
}

/**
 * 모든 자세 문제 목록 조회
 */
export function getAllPostureIssues(): PostureIssueDetail[] {
  return Object.values(POSTURE_ISSUES);
}

/**
 * 모든 교정 운동 목록 조회
 */
export function getAllExercises(): CorrectionExercise[] {
  return Object.values(CORRECTION_EXERCISES);
}
