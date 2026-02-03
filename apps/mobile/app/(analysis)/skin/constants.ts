/**
 * 피부 분석 상수 데이터
 */
import type { SkinType } from '@yiroom/shared';

/** 피부 타입별 데이터 */
export interface SkinTypeInfo {
  name: string;
  description: string;
  tips: string[];
}

export const SKIN_TYPE_DATA: Record<SkinType, SkinTypeInfo> = {
  dry: {
    name: '건성 피부',
    description:
      '수분이 부족한 피부 타입입니다. 보습에 집중하는 스킨케어를 추천드려요.',
    tips: [
      '고보습 크림 사용을 권장해요',
      '클렌징 후 바로 토너를 발라주세요',
      '수분 마스크팩을 주 2-3회 사용해보세요',
    ],
  },
  oily: {
    name: '지성 피부',
    description:
      '피지 분비가 활발한 피부 타입입니다. 유수분 밸런스 관리가 중요해요.',
    tips: [
      '가벼운 젤 타입 보습제를 사용하세요',
      '주 1-2회 모공 관리를 해주세요',
      '자극적인 클렌징은 피해주세요',
    ],
  },
  combination: {
    name: '복합성 피부',
    description:
      'T존은 지성, 볼은 건성인 피부 타입입니다. 부위별 맞춤 케어가 필요해요.',
    tips: [
      'T존과 볼을 다른 제품으로 케어하세요',
      '수분 공급과 유분 조절을 동시에 해주세요',
      '자극적인 각질 제거는 피해주세요',
    ],
  },
  sensitive: {
    name: '민감성 피부',
    description:
      '자극에 예민한 피부 타입입니다. 순한 성분의 제품을 사용하세요.',
    tips: [
      '무향료, 저자극 제품을 선택하세요',
      '새 제품은 패치 테스트 후 사용하세요',
      '피부 장벽 강화 제품을 사용해보세요',
    ],
  },
  normal: {
    name: '정상 피부',
    description:
      '유수분 밸런스가 좋은 피부 타입입니다. 현재 상태를 유지해주세요.',
    tips: [
      '기본적인 보습 케어를 유지하세요',
      '자외선 차단은 꼭 해주세요',
      '계절에 따라 제품을 조절해보세요',
    ],
  },
};

/** 종합 점수 계산 가중치 */
export const SCORE_WEIGHTS = {
  moisture: 0.2,
  elasticity: 0.2,
  pores: 0.15,
  wrinkles: 0.15,
  pigmentation: 0.1,
  oil: 0.1,
  sensitivity: 0.1, // 100에서 뺀 값 사용
} as const;
