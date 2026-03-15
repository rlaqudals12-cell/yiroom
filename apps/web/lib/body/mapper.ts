/**
 * 체형 타입 시스템 통합 매퍼
 *
 * 3개 체형 시스템 간 변환:
 * - BodyShape7 (7-Type, 과일형): C-1 분석 결과 (lib/body/types.ts)
 * - BodyType (8-Type, 레터형): 영양/운동 모듈 (lib/mock/body-analysis.ts)
 * - BodyType3 (3-Type, 골격진단): 패션 모듈 (S/W/N)
 *
 * 매핑 근거: docs/principles/body-mechanics.md + docs/principles/fashion-matching.md
 *
 * @module lib/body
 */

import type { BodyShape7 } from './types';

/**
 * 8-Type 체형 (레터형)
 * 영양/운동 모듈에서 사용
 */
export type BodyType = 'X' | 'A' | 'V' | 'H' | 'O' | 'I' | 'Y' | '8';

/**
 * 3-Type 체형 (골격진단)
 * 패션/사이즈 모듈에서 사용
 */
export type BodyType3 = 'S' | 'W' | 'N';

/**
 * 7-Type → 8-Type 매핑 테이블
 *
 * 매핑 근거 (body-mechanics.md):
 * - hourglass(모래시계) → X: 상하체 균형, 허리 잘록
 * - pear(배형) → A: 하체 볼륨 우세
 * - invertedTriangle(역삼각) → V: 상체 볼륨 우세
 * - apple(사과) → O: 복부 중심 볼륨
 * - rectangle(직사각) → H: 상하체 비슷, 직선적
 * - trapezoid(사다리꼴) → Y: 넓은 어깨, 좁은 하체 (남성)
 * - oval(타원) → O: 복부 중심 볼륨 (남성)
 */
const SHAPE7_TO_TYPE8: Record<BodyShape7, BodyType> = {
  hourglass: 'X',
  pear: 'A',
  invertedTriangle: 'V',
  apple: 'O',
  rectangle: 'H',
  trapezoid: 'Y',
  oval: 'O',
};

/**
 * 8-Type → 3-Type 매핑 테이블
 *
 * 매핑 근거 (fashion-matching.md):
 * - S(스트레이트): 상체 볼륨, 직선적 → X, V, Y
 * - W(웨이브): 하체 볼륨, 곡선적 → A, 8, O
 * - N(내추럴): 골격감, 프레임 큼 → H, I
 */
const TYPE8_TO_TYPE3: Record<BodyType, BodyType3> = {
  X: 'S',
  V: 'S',
  Y: 'S',
  A: 'W',
  '8': 'W',
  O: 'W',
  H: 'N',
  I: 'N',
};

/**
 * 7-Type → 3-Type 직접 매핑 (편의용)
 *
 * 7-Type → 8-Type → 3-Type 체인의 최적화 버전
 */
const SHAPE7_TO_TYPE3: Record<BodyShape7, BodyType3> = {
  hourglass: 'S', // X → S (상체 볼륨, 직선적)
  pear: 'W', // A → W (하체 볼륨, 곡선적)
  invertedTriangle: 'S', // V → S (상체 볼륨)
  apple: 'W', // O → W (곡선적 볼륨)
  rectangle: 'N', // H → N (골격감, 직선형)
  trapezoid: 'S', // Y → S (상체 발달)
  oval: 'W', // O → W (곡선적 볼륨)
};

/**
 * BodyShape7(7-Type) → BodyType(8-Type) 변환
 *
 * C-1 분석 결과를 영양/운동 모듈에서 사용 가능한 형태로 변환
 *
 * @param shape 7-Type 체형 (C-1 분석 결과)
 * @returns 8-Type 체형 (영양/운동용)
 */
export function mapBodyShape7ToBodyType(shape: BodyShape7): BodyType {
  return SHAPE7_TO_TYPE8[shape];
}

/**
 * BodyShape7(7-Type) → BodyType3(3-Type) 변환
 *
 * C-1 분석 결과를 패션/사이즈 모듈에서 사용 가능한 형태로 변환
 *
 * @param shape 7-Type 체형 (C-1 분석 결과)
 * @returns 3-Type 체형 (패션/사이즈용)
 */
export function mapBodyShape7ToBodyType3(shape: BodyShape7): BodyType3 {
  return SHAPE7_TO_TYPE3[shape];
}

/**
 * BodyType(8-Type) → BodyType3(3-Type) 변환
 *
 * @param bodyType 8-Type 체형
 * @returns 3-Type 체형
 */
export function mapBodyTypeTo3Type(bodyType: BodyType): BodyType3 {
  return TYPE8_TO_TYPE3[bodyType];
}

/**
 * 체형별 한국어 라벨
 */
export const BODY_SHAPE7_LABELS: Record<BodyShape7, string> = {
  hourglass: '모래시계형',
  pear: '배형',
  invertedTriangle: '역삼각형',
  apple: '사과형',
  rectangle: '직사각형',
  trapezoid: '사다리꼴형',
  oval: '타원형',
};

export const BODY_TYPE_LABELS: Record<BodyType, string> = {
  X: 'X자형 (모래시계)',
  A: 'A자형 (삼각형)',
  V: 'V자형 (역삼각형)',
  H: 'H자형 (직사각형)',
  O: 'O자형 (원형)',
  I: 'I자형 (직선형)',
  Y: 'Y자형 (넓은어깨)',
  '8': '8자형 (곡선형)',
};

export const BODY_TYPE3_LABELS: Record<BodyType3, string> = {
  S: '스트레이트',
  W: '웨이브',
  N: '내추럴',
};

/**
 * 체형 문자열(소문자/케밥/스네이크) → BodyShape7 정규화
 *
 * 캡슐 엔진 등에서 BeautyProfile.body.shape(문자열)을 BodyShape7으로 변환할 때 사용
 * 유효하지 않은 문자열이면 null 반환
 */
const SHAPE_STRING_TO_7TYPE: Record<string, BodyShape7> = {
  hourglass: 'hourglass',
  pear: 'pear',
  invertedtriangle: 'invertedTriangle',
  apple: 'apple',
  rectangle: 'rectangle',
  trapezoid: 'trapezoid',
  oval: 'oval',
};

export function normalizeToBodyShape7(shape: string): BodyShape7 | null {
  const normalized = shape.toLowerCase().replace(/[_\-\s]/g, '');
  return SHAPE_STRING_TO_7TYPE[normalized] ?? null;
}

/**
 * 체형에 따른 운동 부위 우선순위
 *
 * 근거: docs/principles/exercise-physiology.md
 * - 하체 우세 체형 → 상체 강화 우선
 * - 상체 우세 체형 → 하체/코어 강화 우선
 * - 복부 우세 체형 → 유산소 + 코어 우선
 * - 균형 체형 → 전체 균형 유지
 */
export const BODY_TYPE_EXERCISE_PRIORITIES: Record<
  BodyType,
  {
    focusAreas: string[];
    avoidOverloading: string[];
    cardioEmphasis: 'low' | 'medium' | 'high';
  }
> = {
  X: {
    focusAreas: ['core', 'full_body'],
    avoidOverloading: [],
    cardioEmphasis: 'medium',
  },
  A: {
    focusAreas: ['upper', 'shoulder', 'back'],
    avoidOverloading: ['lower'],
    cardioEmphasis: 'medium',
  },
  V: {
    focusAreas: ['lower', 'core'],
    avoidOverloading: ['upper'],
    cardioEmphasis: 'medium',
  },
  H: {
    focusAreas: ['core', 'full_body'],
    avoidOverloading: [],
    cardioEmphasis: 'medium',
  },
  O: {
    focusAreas: ['cardio', 'core', 'lower'],
    avoidOverloading: [],
    cardioEmphasis: 'high',
  },
  I: {
    focusAreas: ['upper', 'lower', 'full_body'],
    avoidOverloading: [],
    cardioEmphasis: 'low',
  },
  Y: {
    focusAreas: ['lower', 'core'],
    avoidOverloading: ['upper'],
    cardioEmphasis: 'medium',
  },
  '8': {
    focusAreas: ['core', 'cardio'],
    avoidOverloading: [],
    cardioEmphasis: 'medium',
  },
};
