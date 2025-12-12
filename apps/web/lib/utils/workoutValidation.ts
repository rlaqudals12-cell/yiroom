import { WorkoutInputData } from '@/lib/stores/workoutInputStore';

/**
 * Step별 Validation 검사
 * @param step 단계 번호 (1-7)
 * @param data 운동 입력 데이터
 * @returns boolean - 해당 단계가 유효한지 여부
 */
export function validateStep(step: number, data: Partial<WorkoutInputData>): boolean {
  switch (step) {
    case 1:
      // C-1 체형 데이터 필수
      return data.bodyTypeData !== null && data.bodyTypeData !== undefined;

    case 2:
      // 최소 1개 목표 선택 필수
      return Array.isArray(data.goals) && data.goals.length >= 1;

    case 3:
      // 최소 1개 신체 고민 선택 필수
      return Array.isArray(data.concerns) && data.concerns.length >= 1;

    case 4:
      // 운동 빈도 선택 필수
      return typeof data.frequency === 'string' && data.frequency !== '';

    case 5:
      // 장소 선택 필수 + 최소 1개 장비 선택 필수
      return (
        typeof data.location === 'string' &&
        data.location !== '' &&
        Array.isArray(data.equipment) &&
        data.equipment.length >= 1
      );

    case 6:
    case 7:
      // 선택 사항 (항상 통과)
      return true;

    default:
      return false;
  }
}

/**
 * 전체 입력 데이터 Validation
 * @param data 운동 입력 데이터
 * @returns { isValid: boolean, errors: string[] }
 */
export function validateAllSteps(data: Partial<WorkoutInputData>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Step 1: 체형 데이터
  if (!validateStep(1, data)) {
    errors.push('체형 분석이 필요합니다');
  }

  // Step 2: 목표
  if (!validateStep(2, data)) {
    errors.push('목표를 선택해주세요');
  }

  // Step 3: 신체 고민
  if (!validateStep(3, data)) {
    errors.push('신체 고민을 선택해주세요');
  }

  // Step 4: 운동 빈도
  if (!validateStep(4, data)) {
    errors.push('운동 빈도를 선택해주세요');
  }

  // Step 5: 장소 및 장비
  if (!data.location || data.location === '') {
    errors.push('운동 장소를 선택해주세요');
  }
  if (!Array.isArray(data.equipment) || data.equipment.length < 1) {
    errors.push('사용 가능한 장비를 선택해주세요');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Step별 필수 조건 설명 반환
 * @param step 단계 번호 (1-7)
 * @returns string[] - 해당 단계의 필수 조건 목록
 */
export function getStepRequirements(step: number): string[] {
  switch (step) {
    case 1:
      return ['C-1 체형 분석 완료'];
    case 2:
      return ['최소 1개 운동 목표 선택'];
    case 3:
      return ['최소 1개 신체 고민 선택'];
    case 4:
      return ['운동 빈도 선택'];
    case 5:
      return ['운동 장소 선택', '최소 1개 장비 선택'];
    case 6:
      return ['(선택) 목표 체중 설정', '(선택) 목표 날짜 설정'];
    case 7:
      return ['(선택) 부상/통증 부위 선택'];
    default:
      return [];
  }
}
