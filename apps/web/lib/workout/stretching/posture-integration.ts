/**
 * C-2 체형분석 ↔ W-2 스트레칭 통합 모듈
 *
 * @module lib/workout/stretching/posture-integration
 * @description Body Analysis V2 결과를 스트레칭 처방으로 변환
 * @see docs/specs/SDD-W-2-ADVANCED-STRETCHING.md
 * @see docs/specs/SDD-BODY-ANALYSIS-v2.md
 *
 * 통합 흐름:
 * 1. C-2 체형 분석 완료 → PostureAnalysis 획득
 * 2. PostureIssue → PostureImbalanceType 매핑
 * 3. StretchingUserProfile 구성
 * 4. 맞춤 스트레칭 처방 생성
 */

import type {
  PostureAnalysis,
  PostureIssue,
  BodyAnalysisV2Result,
} from '@/lib/analysis/body-v2/types';

import type {
  PostureImbalanceType,
  PostureImbalance,
  PostureAnalysisResult,
  StretchingUserProfile,
  StretchingPrescription,
  MuscleGroup,
  SpecialCondition,
  Equipment,
  SportType,
  Difficulty,
} from '@/types/stretching';

import {
  generatePostureCorrectionPrescription,
  ACSM_GUIDELINES,
} from './routine-generator';

// ============================================
// 타입 매핑 상수
// ============================================

/**
 * C-2 PostureIssue.type → W-2 PostureImbalanceType 매핑
 *
 * C-2는 개별 자세 문제를 감지하고,
 * W-2는 Janda 교차증후군 기반으로 분류함.
 * 복합 증상은 교차증후군으로 매핑됨.
 */
export const POSTURE_ISSUE_TO_IMBALANCE_MAP: Record<PostureIssue['type'], PostureImbalanceType> = {
  'forward-head': 'forward_head',
  'rounded-shoulders': 'rounded_shoulder',
  lordosis: 'pelvic_tilt_ant',  // 요추전만 = 골반 전방경사
  kyphosis: 'upper_cross',       // 흉추후만 = 상부교차증후군 구성요소
  'shoulder-imbalance': 'rounded_shoulder',  // 일반 어깨 불균형 → 라운드숄더로 처리
  'hip-imbalance': 'pelvic_tilt_ant',        // 일반 골반 불균형 → 전방경사로 처리
};

/**
 * 복합 증상 감지 규칙
 *
 * 여러 자세 문제가 동시에 발견되면 교차증후군으로 진단
 */
const COMPOUND_SYNDROME_RULES = {
  // 거북목 + 라운드숄더 = 상부교차증후군
  upper_cross: ['forward-head', 'rounded-shoulders', 'kyphosis'],
  // 요추전만 + 골반불균형 = 하부교차증후군
  lower_cross: ['lordosis', 'hip-imbalance'],
};

/**
 * 심각도 변환 매핑
 * C-2: 1-5 (number) → W-2: mild/moderate/severe
 */
function mapSeverity(severity: number): 'mild' | 'moderate' | 'severe' {
  if (severity <= 2) return 'mild';
  if (severity <= 3) return 'moderate';
  return 'severe';
}

// ============================================
// 핵심 변환 함수
// ============================================

/**
 * C-2 PostureIssue를 W-2 PostureImbalance로 변환
 */
export function mapPostureIssueToImbalance(issue: PostureIssue): PostureImbalance {
  return {
    type: POSTURE_ISSUE_TO_IMBALANCE_MAP[issue.type],
    severity: mapSeverity(issue.severity),
    affectedAngles: [issue.type],  // 원본 타입 보존
    description: issue.description,
  };
}

/**
 * 복합 증후군 감지
 *
 * 여러 자세 문제가 동시 발견되면 교차증후군으로 업그레이드
 */
export function detectCompoundSyndromes(
  issues: PostureIssue[]
): PostureImbalanceType | null {
  const issueTypes = issues.map(i => i.type);

  // 상부교차증후군 체크 (2개 이상 일치)
  const upperCrossMatches = COMPOUND_SYNDROME_RULES.upper_cross.filter(
    t => issueTypes.includes(t as PostureIssue['type'])
  );
  if (upperCrossMatches.length >= 2) {
    return 'upper_cross';
  }

  // 하부교차증후군 체크 (2개 이상 일치)
  const lowerCrossMatches = COMPOUND_SYNDROME_RULES.lower_cross.filter(
    t => issueTypes.includes(t as PostureIssue['type'])
  );
  if (lowerCrossMatches.length >= 2) {
    return 'lower_cross';
  }

  return null;
}

/**
 * C-2 PostureAnalysis를 W-2 PostureAnalysisResult로 변환
 */
export function convertToStretchingPostureAnalysis(
  postureAnalysis: PostureAnalysis,
  assessmentId: string = 'auto_' + Date.now()
): PostureAnalysisResult {
  const { issues, shoulderTilt, hipTilt, spineAlignment, headPosition } = postureAnalysis;

  // 복합 증후군 감지
  const compoundSyndrome = detectCompoundSyndromes(issues);

  // 개별 불균형 매핑
  const imbalances: PostureImbalance[] = issues.map(mapPostureIssueToImbalance);

  // 복합 증후군이 있으면 추가
  if (compoundSyndrome) {
    const maxSeverity = Math.max(...issues.map(i => i.severity));
    imbalances.unshift({
      type: compoundSyndrome,
      severity: mapSeverity(maxSeverity),
      affectedAngles: issues.map(i => i.type),
      description: compoundSyndrome === 'upper_cross'
        ? '상부교차증후군: 거북목과 라운드숄더가 복합적으로 나타남'
        : '하부교차증후군: 골반 전방경사와 요추전만이 복합적으로 나타남',
    });
  }

  // 자세 각도 매핑 (W-2 스펙에 맞춤)
  // CVA: 두개척추각 - headPosition에서 추정 (정상: >50°)
  const cva = headPosition === 'forward' ? 40 : headPosition === 'backward' ? 60 : 52;

  const angles: PostureAnalysisResult['angles'] = {
    cva,
    shoulderTilt,
    thoracicKyphosis: issues.some(i => i.type === 'kyphosis') ? 50 : 30,
    lumbarLordosis: issues.some(i => i.type === 'lordosis') ? 70 : 50,
    pelvicTilt: hipTilt,
  };

  // 단축/약화 근육 추출
  const tightMuscles = extractTightMuscles(issues);
  const weakMuscles = extractWeakMuscles(issues);

  // 카테고리 결정
  const category = spineAlignment >= 80 ? 'excellent'
    : spineAlignment >= 60 ? 'good'
    : spineAlignment >= 40 ? 'moderate'
    : 'poor';

  return {
    assessmentId,
    createdAt: new Date().toISOString(),
    angles,
    overallScore: spineAlignment,
    category,
    imbalances,
    tightMuscles,
    weakMuscles,
  };
}

/**
 * 자세 문제에서 단축 근육 추출
 */
function extractTightMuscles(issues: PostureIssue[]): MuscleGroup[] {
  const muscles = new Set<MuscleGroup>();

  for (const issue of issues) {
    switch (issue.type) {
      case 'forward-head':
        muscles.add('suboccipitals');
        muscles.add('sternocleidomastoid');
        muscles.add('upper_trapezius');
        break;
      case 'rounded-shoulders':
        muscles.add('pectoralis_major');
        muscles.add('pectoralis_minor');
        break;
      case 'lordosis':
        muscles.add('iliopsoas');
        muscles.add('rectus_femoris');
        muscles.add('erector_spinae');
        break;
      case 'kyphosis':
        muscles.add('pectoralis_major');
        muscles.add('upper_trapezius');
        break;
      case 'hip-imbalance':
        muscles.add('quadratus_lumborum');
        break;
    }
  }

  return Array.from(muscles);
}

/**
 * 자세 문제에서 약화 근육 추출
 */
function extractWeakMuscles(issues: PostureIssue[]): MuscleGroup[] {
  const muscles = new Set<MuscleGroup>();

  for (const issue of issues) {
    switch (issue.type) {
      case 'forward-head':
        muscles.add('deep_neck_flexors');
        break;
      case 'rounded-shoulders':
        muscles.add('mid_lower_trapezius');
        muscles.add('rhomboids');
        break;
      case 'lordosis':
        muscles.add('rectus_abdominis');
        muscles.add('gluteus_maximus');
        break;
      case 'kyphosis':
        muscles.add('mid_lower_trapezius');
        break;
      case 'hip-imbalance':
        muscles.add('gluteus_medius');
        break;
    }
  }

  return Array.from(muscles);
}

/**
 * 자세 문제에서 추천 사항 생성 (내부 사용)
 */
function generateRecommendationsFromIssues(issues: PostureIssue[]): string[] {
  const recommendations: string[] = [];

  // 일반 권장사항
  recommendations.push('매일 10-15분 스트레칭 습관화');

  // 문제별 권장사항
  if (issues.some(i => i.type === 'forward-head' || i.type === 'rounded-shoulders')) {
    recommendations.push('장시간 컴퓨터 사용 시 30분마다 목/어깨 스트레칭');
    recommendations.push('모니터 높이를 눈높이에 맞추기');
  }

  if (issues.some(i => i.type === 'lordosis' || i.type === 'hip-imbalance')) {
    recommendations.push('코어 근력 강화 운동 병행');
    recommendations.push('장시간 앉아있지 않기, 1시간마다 기립');
  }

  if (issues.some(i => i.type === 'kyphosis')) {
    recommendations.push('흉추 가동성 운동 추가');
    recommendations.push('폼롤러 흉추 신전 운동');
  }

  return recommendations;
}

// ============================================
// 사용자 프로필 생성
// ============================================

/**
 * C-2 분석 결과에서 스트레칭 사용자 프로필 생성
 *
 * @param bodyResult - C-2 체형분석 결과
 * @param userInfo - 사용자 기본 정보 (필수)
 */
export function createStretchingProfileFromBodyAnalysis(
  bodyResult: BodyAnalysisV2Result,
  userInfo: {
    userId: string;
    age: number;
    gender: 'male' | 'female';
    fitnessLevel?: Difficulty;
    primarySports?: SportType[];
    medicalConditions?: string[];
    specialConditions?: SpecialCondition[];
    preferredSessionDuration?: number;
  }
): StretchingUserProfile {
  const { postureAnalysis } = bodyResult;

  // 의료 조건에서 contraindications 추출
  const contraindications: string[] = userInfo.medicalConditions || [];

  // 자세 문제가 있으면 contraindications에 추가 권장사항 포함
  if (postureAnalysis) {
    // 심각한 문제가 있으면 주의사항 추가
    const severeIssues = postureAnalysis.issues.filter(i => i.severity >= 4);
    for (const issue of severeIssues) {
      contraindications.push(`${issue.description} - 주의 필요`);
    }
  }

  // 기본 장비 설정
  const availableEquipment: Equipment[] = ['bodyweight', 'mat'];

  // 프로필 생성
  const profile: StretchingUserProfile = {
    userId: userInfo.userId,
    age: userInfo.age,
    gender: userInfo.gender,
    fitnessLevel: userInfo.fitnessLevel || 'beginner',
    stretchingExperience: 'none',  // 기본값
    primarySports: userInfo.primarySports || [],
    sportsFrequency: 'weekly',     // 기본값
    contraindications,
    specialConditions: userInfo.specialConditions || [],
    availableEquipment,
    preferredSessionDuration: userInfo.preferredSessionDuration || 15,
    preferredLanguage: 'ko',
  };

  return profile;
}

// ============================================
// 통합 처방 생성
// ============================================

/**
 * C-2 분석 결과에서 직접 스트레칭 처방 생성
 *
 * 원스텝 통합 함수: C-2 결과 → W-2 처방
 *
 * @param bodyResult - C-2 체형분석 결과
 * @param userInfo - 사용자 기본 정보 (필수)
 */
export function generateStretchingFromBodyAnalysis(
  bodyResult: BodyAnalysisV2Result,
  userInfo: {
    userId: string;
    age: number;
    gender: 'male' | 'female';
    fitnessLevel?: Difficulty;
    targetDurationMinutes?: number;
    primarySports?: SportType[];
    medicalConditions?: string[];
  }
): StretchingPrescription | null {
  const { postureAnalysis } = bodyResult;

  // 자세 분석 결과가 없으면 null 반환
  if (!postureAnalysis || postureAnalysis.issues.length === 0) {
    return null;
  }

  // 1. 자세 분석 변환
  const stretchingPosture = convertToStretchingPostureAnalysis(postureAnalysis);

  // 2. 사용자 프로필 생성
  const userProfile = createStretchingProfileFromBodyAnalysis(bodyResult, {
    userId: userInfo.userId,
    age: userInfo.age,
    gender: userInfo.gender,
    fitnessLevel: userInfo.fitnessLevel,
    primarySports: userInfo.primarySports,
    medicalConditions: userInfo.medicalConditions,
    preferredSessionDuration: userInfo.targetDurationMinutes,
  });

  // 3. 처방 생성
  return generatePostureCorrectionPrescription(stretchingPosture, userProfile);
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 자세 점수에서 스트레칭 필요도 계산
 *
 * @returns 0-100 (높을수록 스트레칭 필요)
 */
export function calculateStretchingNeed(postureAnalysis: PostureAnalysis): number {
  const { spineAlignment, issues } = postureAnalysis;

  // 기본: 척추 정렬 점수 역산 (100 - 점수)
  let need = 100 - spineAlignment;

  // 문제 개수와 심각도에 따라 가중
  const severitySum = issues.reduce((sum, i) => sum + i.severity, 0);
  const issueWeight = Math.min(severitySum * 5, 30);  // 최대 30점 추가

  need = Math.min(need + issueWeight, 100);

  return Math.round(need);
}

/**
 * 주요 타겟 근육군 추출
 */
export function getTargetMusclesFromPosture(
  postureAnalysis: PostureAnalysis
): string[] {
  const muscles = new Set<string>();

  for (const issue of postureAnalysis.issues) {
    switch (issue.type) {
      case 'forward-head':
        muscles.add('upper_trapezius');
        muscles.add('levator_scapulae');
        muscles.add('suboccipitals');
        break;
      case 'rounded-shoulders':
        muscles.add('pectoralis_major');
        muscles.add('pectoralis_minor');
        muscles.add('latissimus_dorsi');
        break;
      case 'lordosis':
        muscles.add('iliopsoas');
        muscles.add('rectus_femoris');
        muscles.add('erector_spinae');
        break;
      case 'kyphosis':
        muscles.add('pectoralis_major');
        muscles.add('upper_trapezius');
        break;
      case 'hip-imbalance':
        muscles.add('quadratus_lumborum');
        muscles.add('gluteus_medius');
        muscles.add('tensor_fasciae_latae');
        break;
      case 'shoulder-imbalance':
        muscles.add('upper_trapezius');
        muscles.add('rhomboids');
        break;
    }
  }

  return Array.from(muscles);
}

/**
 * 스트레칭 우선순위 결정
 *
 * @returns 우선 처리해야 할 자세 문제 목록 (심각도 순)
 */
export function prioritizePostureIssues(
  issues: PostureIssue[]
): PostureIssue[] {
  return [...issues].sort((a, b) => {
    // 1. 심각도 높은 순
    if (b.severity !== a.severity) {
      return b.severity - a.severity;
    }
    // 2. 통증 유발 가능성 높은 문제 우선
    const painPriority: Record<PostureIssue['type'], number> = {
      'forward-head': 5,      // 두통, 목 통증
      lordosis: 4,            // 허리 통증
      'rounded-shoulders': 3, // 어깨 통증
      kyphosis: 3,            // 등 통증
      'hip-imbalance': 2,
      'shoulder-imbalance': 1,
    };
    return (painPriority[b.type] || 0) - (painPriority[a.type] || 0);
  });
}

// ============================================
// 타입 익스포트
// ============================================

export type {
  PostureAnalysis,
  PostureIssue,
  BodyAnalysisV2Result,
} from '@/lib/analysis/body-v2/types';
