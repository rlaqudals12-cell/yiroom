/**
 * 스텝별 사용법(how-to) 상수 — 루틴 초보자용 (T1)
 *
 * @module lib/skincare/step-howto
 * @description
 *   "완전 무지한 초보자"는 적당량·바르는 법·흡수 대기 시간을 모른다는 창업자 피드백에서 출발.
 *   각 카테고리(그리고 시작 전 손 씻기 프리스텝)에 대해 정직한 피부과 상식 수준의 안내를 담는다.
 *
 *   용어 안전(리서치 §7.3, ADR-117): "치료·처방·완치" 등 의학적 단정 금지.
 *   수치는 단정 대신 범위("30초~1분")로, 효능은 근거 없는 과장 없이 "~에 도움이 될 수 있어요" 톤.
 *   개인차 존재를 전제로 한다.
 */

import type { ProductCategory } from '@/types/skincare-routine';

/** 스텝 사용법 — 적당량 / 방법 / (선택)흡수 대기 / (선택)추가 팁 */
export interface StepHowTo {
  /** 적당량 (예: "500원 동전 크기 거품") */
  amount: string;
  /** 바르는 방법 */
  method: string;
  /** 다음 단계 전 흡수 대기 시간 (선택) */
  waitTime?: string;
  /** 추가 팁 (선택) — 개인차·주의 등 */
  tips?: string[];
}

/** how-to 키 — 제품 카테고리 + 시작 전 손 씻기 프리스텝 */
export type StepHowToKey = ProductCategory | 'handWash';

/**
 * 카테고리별 사용법 정본.
 * 모든 ProductCategory + handWash를 포함해, 어떤 스텝이든 조회하면 안내가 나온다.
 */
export const STEP_HOWTO: Record<StepHowToKey, StepHowTo> = {
  // 시작 전 공통 프리스텝 — 손의 세균이 얼굴에 옮을 수 있어요
  handWash: {
    amount: '비누 적당량',
    method: '시작 전 손을 씻어주세요. 씻지 않은 손의 세균이 얼굴에 옮을 수 있어요.',
    tips: ['20초 이상 비누로 꼼꼼히 씻어주세요'],
  },
  cleanser: {
    amount: '500원 동전 크기 거품',
    method:
      '거품을 충분히 낸 뒤 30초~1분간 얼굴 위에서 부드럽게 원을 그리며 세안하고, 미온수로 헹궈주세요.',
    waitTime: '물기는 수건으로 톡톡 눌러 닦아주세요',
    tips: ['너무 뜨겁거나 찬물은 자극이 될 수 있어요', '세게 문지르지 말고 부드럽게'],
  },
  toner: {
    amount: '화장솜에 적시거나 손바닥에 2~3방울',
    method: '피부 결을 따라 안에서 바깥으로 가볍게 발라주세요.',
    waitTime: '10~20초 흡수 후 다음 단계',
    tips: ['화장솜으로 닦아내듯 쓰면 각질 정돈에, 손바닥으로 누르면 수분감에 도움이 될 수 있어요'],
  },
  essence: {
    amount: '손바닥에 2~3방울',
    method: '얼굴 전체에 얇게 펴 바르고 손바닥으로 가볍게 눌러 흡수시켜주세요.',
    waitTime: '20~30초 흡수 후 다음 단계',
  },
  serum: {
    amount: '2~3방울',
    method:
      '손바닥으로 얼굴을 감싸듯 눌러(패팅) 흡수시켜주세요. 문지르기보다 눌러 담는 느낌으로요.',
    waitTime: '30초~1분 흡수 후 다음 단계',
    tips: ['고민 부위에 조금 더 신경 써서 발라도 좋아요'],
  },
  ampoule: {
    amount: '2~3방울 (세럼보다 소량)',
    method: '고농축 제형이라 소량으로 충분해요. 손바닥으로 눌러(패팅) 흡수시켜주세요.',
    waitTime: '30초~1분 흡수 후 다음 단계',
    tips: ['새 제품은 팔 안쪽에 먼저 발라 자극이 없는지 확인해도 좋아요'],
  },
  cream: {
    amount: '완두콩~체리 크기',
    method: '얼굴 안쪽에서 바깥쪽으로 부드럽게 굴리듯(롤링) 펴 발라주세요.',
    waitTime: '1~2분 흡수 후 다음 단계',
    tips: ['건조하면 조금 더, 유분이 많으면 얇게 — 개인차가 있어요'],
  },
  sunscreen: {
    amount: '검지 한 마디 반 (얼굴 기준)',
    method: '외출 15~20분 전, 얼굴 전체에 고르게 펴 발라주세요.',
    waitTime: '자외선이 강한 날은 2~3시간마다 덧발라주세요',
    tips: ['양이 적으면 표기된 차단 효과를 기대하기 어려워요', '아침 마지막 단계예요'],
  },
  mask: {
    amount: '시트 1장 (또는 팩 적당량)',
    method: '토너 뒤에 시트를 얼굴에 밀착시키고 15~20분 후 떼어내주세요.',
    waitTime: '남은 에센스는 목·팔에 펴 바르거나 얼굴에 가볍게 눌러주세요',
    tips: ['매일보다 주 2~3회가 적당해요', '너무 오래 붙이면 오히려 수분이 날아갈 수 있어요'],
  },
  eye_cream: {
    amount: '쌀알~팥알 크기',
    method: '약지로 눈가에 톡톡 두드리듯 발라주세요. 피부가 얇은 부위라 문지르지 않아요.',
    waitTime: '30초~1분 흡수 후 다음 단계',
  },
  oil: {
    amount: '1~2방울',
    method: '손바닥에 덜어 체온으로 데운 뒤 얼굴을 감싸듯 눌러 발라주세요. 보통 마지막 단계예요.',
    waitTime: '1~2분 흡수',
    tips: ['유분이 많은 피부는 생략하거나 아주 소량만 써도 괜찮아요'],
  },
  spot_treatment: {
    amount: '트러블 부위에만 소량',
    method: '고민 부위에만 점을 찍듯 얇게 발라주세요. 얼굴 전체에 바르지 않아요.',
    tips: ['자극이 느껴지면 사용을 잠시 멈추고 상태를 지켜봐주세요'],
  },
};

/** 스텝 사용법 조회 (없는 키는 undefined) */
export function getStepHowTo(category: StepHowToKey): StepHowTo | undefined {
  return STEP_HOWTO[category];
}

/**
 * 루틴 목록 최상단 0단계 "손 씻기" 고정 행 표시용 (체크 불요).
 * label = 행 제목, note = 한 줄 안내.
 */
export const HAND_WASH_PRESTEP = {
  label: '손 씻기',
  note: '시작 전 손을 씻어주세요 — 손의 세균이 얼굴에 옮을 수 있어요',
} as const;
