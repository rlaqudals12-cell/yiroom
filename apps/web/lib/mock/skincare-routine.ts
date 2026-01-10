/**
 * 스킨케어 루틴 Mock 데이터
 * @description 피부 Phase B: 아침/저녁 기본 루틴 템플릿 및 피부 타입별 수정자
 * @version 1.0
 * @date 2026-01-10
 */

import type {
  ProductCategory,
  ProductCategoryInfo,
  RoutineStep,
  RoutineModifier,
} from '@/types/skincare-routine';
import type { SkinTypeId } from './skin-analysis';

// ================================================
// 제품 카테고리 정보
// ================================================

/** 제품 카테고리 상세 정보 */
export const PRODUCT_CATEGORIES: Record<ProductCategory, ProductCategoryInfo> = {
  cleanser: {
    id: 'cleanser',
    name: '클렌저',
    emoji: '🧴',
    description: '피부의 노폐물과 메이크업을 제거해요',
  },
  toner: {
    id: 'toner',
    name: '토너',
    emoji: '💧',
    description: '피부 pH 밸런스를 맞추고 수분을 공급해요',
  },
  essence: {
    id: 'essence',
    name: '에센스',
    emoji: '✨',
    description: '피부에 깊은 수분과 영양을 전달해요',
  },
  serum: {
    id: 'serum',
    name: '세럼',
    emoji: '💎',
    description: '고농축 성분으로 특정 피부 고민을 집중 케어해요',
  },
  ampoule: {
    id: 'ampoule',
    name: '앰플',
    emoji: '🔬',
    description: '초고농축 성분으로 강력한 효과를 제공해요',
  },
  cream: {
    id: 'cream',
    name: '크림',
    emoji: '🧊',
    description: '수분을 가두고 피부 장벽을 보호해요',
  },
  sunscreen: {
    id: 'sunscreen',
    name: '선크림',
    emoji: '☀️',
    description: '자외선으로부터 피부를 보호해요',
  },
  mask: {
    id: 'mask',
    name: '마스크팩',
    emoji: '🎭',
    description: '집중 케어로 피부에 영양을 채워요',
  },
  eye_cream: {
    id: 'eye_cream',
    name: '아이크림',
    emoji: '👁️',
    description: '민감한 눈가 피부를 전문적으로 케어해요',
  },
  oil: {
    id: 'oil',
    name: '페이스 오일',
    emoji: '🍯',
    description: '영양과 윤기를 더해줘요',
  },
  spot_treatment: {
    id: 'spot_treatment',
    name: '스팟 케어',
    emoji: '🎯',
    description: '트러블 부위를 집중 케어해요',
  },
};

// ================================================
// 아침 루틴 기본 템플릿
// ================================================

/** 아침 루틴 기본 단계 */
export const MORNING_ROUTINE_STEPS: RoutineStep[] = [
  {
    order: 1,
    category: 'cleanser',
    name: '클렌저',
    purpose: '밤사이 분비된 피지와 노폐물 제거',
    duration: '1분',
    tips: ['미온수 사용', '거품을 충분히 낸 후 부드럽게 마사지', '30초 이상 꼼꼼히 세안'],
    isOptional: false,
  },
  {
    order: 2,
    category: 'toner',
    name: '토너',
    purpose: '피부 pH 밸런스 조절 및 수분 공급',
    duration: '30초',
    tips: ['화장솜보다 손으로 패팅', '세안 후 바로 사용', '피부가 촉촉할 때 다음 단계로'],
    isOptional: false,
  },
  {
    order: 3,
    category: 'essence',
    name: '에센스',
    purpose: '깊은 수분 공급 및 피부 탄력 강화',
    duration: '30초',
    tips: ['손바닥에 덜어 체온으로 데우기', '안쪽에서 바깥으로 펴바르기'],
    isOptional: true,
  },
  {
    order: 4,
    category: 'eye_cream',
    name: '아이크림',
    purpose: '눈가 주름 예방 및 보습',
    duration: '30초',
    tips: ['약지로 가볍게 두드리듯 바르기', '눈 뼈를 따라 바깥에서 안쪽으로'],
    isOptional: true,
  },
  {
    order: 5,
    category: 'cream',
    name: '크림',
    purpose: '수분 증발 방지 및 피부 장벽 보호',
    duration: '30초',
    tips: ['양 볼, 이마, 턱에 점을 찍어 펴바르기', '건조한 부위는 덧바르기', '목까지 함께 케어'],
    isOptional: false,
  },
  {
    order: 6,
    category: 'sunscreen',
    name: '선크림',
    purpose: '자외선(UV) 차단 및 광노화 예방',
    duration: '30초',
    tips: ['외출 30분 전에 바르기', '충분한 양(500원 동전 크기) 사용', '2-3시간마다 덧바르기'],
    isOptional: false,
  },
];

// ================================================
// 저녁 루틴 기본 템플릿
// ================================================

/** 저녁 루틴 기본 단계 */
export const EVENING_ROUTINE_STEPS: RoutineStep[] = [
  {
    order: 1,
    category: 'cleanser',
    name: '오일 클렌저',
    purpose: '메이크업 및 선크림 용해',
    duration: '1분',
    tips: ['마른 손에 덜어 마사지', '물을 묻혀 유화시키기', '메이크업이 녹을 때까지 충분히 마사지'],
    isOptional: false,
  },
  {
    order: 2,
    category: 'cleanser',
    name: '폼 클렌저',
    purpose: '잔여물 및 모공 속 노폐물 제거',
    duration: '1분',
    tips: ['충분한 거품 만들기', '코, 이마 등 T존 집중', 'pH 5.5 약산성 권장'],
    isOptional: false,
  },
  {
    order: 3,
    category: 'toner',
    name: '토너',
    purpose: '피부 진정 및 수분 베이스 형성',
    duration: '30초',
    tips: ['손으로 가볍게 패팅', '여러 번 레이어링 가능'],
    isOptional: false,
  },
  {
    order: 4,
    category: 'essence',
    name: '에센스',
    purpose: '영양 흡수력 높이기',
    duration: '30초',
    tips: ['토너가 살짝 촉촉할 때 바르기', '가볍게 두드리며 흡수'],
    isOptional: true,
  },
  {
    order: 5,
    category: 'serum',
    name: '세럼/앰플',
    purpose: '피부 고민에 맞는 집중 케어',
    duration: '1분',
    tips: ['비타민C, 레티놀 등 목적에 맞게 선택', '점점 늘려가며 적응 기간 갖기'],
    isOptional: true,
  },
  {
    order: 6,
    category: 'eye_cream',
    name: '아이크림',
    purpose: '눈가 집중 영양 공급',
    duration: '30초',
    tips: ['소량씩 약지로 두드리기', '레티놀 아이크림은 서서히 사용량 늘리기'],
    isOptional: true,
  },
  {
    order: 7,
    category: 'cream',
    name: '나이트 크림',
    purpose: '밤사이 피부 회복 및 재생 촉진',
    duration: '30초',
    tips: ['아침보다 리치한 제형 사용', '마사지하듯 바르면 흡수 촉진'],
    isOptional: false,
  },
  {
    order: 8,
    category: 'spot_treatment',
    name: '스팟 케어',
    purpose: '트러블 또는 색소침착 부위 집중 관리',
    duration: '30초',
    tips: ['해당 부위에만 소량 사용', '다른 제품 위에 마지막으로 바르기'],
    isOptional: true,
  },
];

// ================================================
// 피부 타입별 수정자 (Modifier)
// ================================================

/** 피부 타입별 루틴 수정 정보 */
export const SKIN_TYPE_MODIFIERS: Record<SkinTypeId, RoutineModifier> = {
  dry: {
    addCategories: ['oil'],
    removeCategories: [],
    adjustTips: {
      cleanser: ['순한 크림 타입 클렌저 사용', '이중세안 시 오일 클렌저 위주로'],
      toner: ['알코올 프리 토너 선택', '수분 토너 여러 겹 레이어링'],
      cream: ['리치한 크림 선택', '수면팩으로 마무리하면 더 좋아요'],
      serum: ['히알루론산 세럼 추천'],
      essence: ['수분 에센스 필수'],
      ampoule: ['세라마이드 함유 제품 추천'],
      sunscreen: ['촉촉한 선크림 선택'],
      mask: ['수분 마스크팩 주 2-3회'],
      eye_cream: ['영양감 있는 아이크림 추천'],
      oil: ['마지막 단계에 오일 추가하면 수분 잠금 효과'],
      spot_treatment: ['건조함으로 인한 각질 케어'],
    },
    warnings: ['알코올 토너 피하기', '뜨거운 물로 세안 금지'],
  },
  oily: {
    addCategories: [],
    removeCategories: ['oil'],
    adjustTips: {
      cleanser: ['젤 또는 폼 타입 추천', 'BHA 함유 클렌저 주 2-3회'],
      toner: ['산뜻한 워터 타입 토너', 'BHA 토너 주 2-3회 사용'],
      cream: ['가벼운 젤 크림 또는 로션', '유분기 없는 제품 선택'],
      serum: ['나이아신아마이드 세럼 추천', '가벼운 수분 세럼'],
      essence: ['워터 타입 에센스'],
      ampoule: ['모공 케어 앰플'],
      sunscreen: ['무기자차 또는 산뜻한 선세럼'],
      mask: ['클레이 마스크 주 1회'],
      eye_cream: ['가벼운 아이세럼도 OK'],
      oil: [],
      spot_treatment: ['여드름 패치 활용'],
    },
    warnings: ['과도한 세안 피하기 (피지 과분비 유발)', '무거운 오일 제품 피하기'],
  },
  combination: {
    addCategories: [],
    removeCategories: [],
    adjustTips: {
      cleanser: ['젤 타입 클렌저로 밸런스 맞추기'],
      toner: ['T존에는 산뜻하게, U존에는 촉촉하게'],
      cream: ['T존은 가볍게, U존은 영양감 있게', '부위별 다른 제품 사용 권장'],
      serum: ['T존: 모공 세럼 / U존: 수분 세럼'],
      essence: ['균형 잡힌 에센스 선택'],
      ampoule: ['부위별 다르게 사용'],
      sunscreen: ['가벼우면서 촉촉한 제품'],
      mask: ['T존에 클레이, U존에 수분 마스크'],
      eye_cream: ['보습력 있는 아이크림'],
      oil: ['U존에만 소량 사용'],
      spot_treatment: ['T존 트러블에 집중'],
    },
    warnings: ['한 가지 제품으로 전체 얼굴 관리하지 않기'],
  },
  normal: {
    addCategories: [],
    removeCategories: [],
    adjustTips: {
      cleanser: ['현재 상태 유지가 중요해요'],
      toner: ['기본 수분 토너면 충분해요'],
      cream: ['계절에 맞는 보습제 선택'],
      serum: ['항산화 세럼으로 노화 예방'],
      essence: ['기본 에센스로 충분'],
      ampoule: ['특별한 날에 앰플 사용'],
      sunscreen: ['자외선 차단만 잘 해주세요'],
      mask: ['주 1-2회 마스크팩'],
      eye_cream: ['예방 차원의 아이크림'],
      oil: ['겨울철에만 추가'],
      spot_treatment: ['필요시에만 사용'],
    },
    warnings: ['제품을 너무 자주 바꾸지 않기', '과도한 각질 제거 피하기'],
  },
  sensitive: {
    addCategories: [],
    removeCategories: ['ampoule', 'spot_treatment'],
    adjustTips: {
      cleanser: ['무향, 저자극 클렌저', 'pH 5.5 약산성 필수'],
      toner: ['무알코올, 무향료 토너', '센텔라/판테놀 함유 제품'],
      cream: ['저자극 진정 크림', '세라마이드 함유 추천'],
      serum: ['진정 세럼 (센텔라, 마데카)', '새 제품은 반드시 패치 테스트'],
      essence: ['진정 에센스'],
      ampoule: ['사용 주의 - 패치 테스트 필수'],
      sunscreen: ['물리적 선차단 (무기자차) 권장'],
      mask: ['진정 마스크팩 주 1회'],
      eye_cream: ['순한 아이크림'],
      oil: ['호호바 오일, 아르간 오일 등 순한 오일만'],
      spot_treatment: ['자극 없는 진정 패치'],
    },
    warnings: [
      '새 제품 사용 전 반드시 패치 테스트',
      '자극 성분(향료, 알코올, 레티놀 초기) 피하기',
      '너무 많은 제품 사용하지 않기',
    ],
  },
};

// ================================================
// 피부 고민별 추가 팁
// ================================================

/** 피부 고민별 추천 성분 및 팁 */
export const SKIN_CONCERN_TIPS: Record<
  string,
  { ingredients: string[]; tips: string[]; avoidIngredients: string[] }
> = {
  acne: {
    ingredients: ['BHA(살리실산)', '나이아신아마이드', '티트리', '레티놀'],
    tips: ['주 2-3회 각질 케어', '비코메도제닉 제품 선택', '손으로 트러블 만지지 않기'],
    avoidIngredients: ['코코넛 오일', '이소프로필 미리스테이트'],
  },
  wrinkles: {
    ingredients: ['레티놀', '펩타이드', '비타민C', '히알루론산'],
    tips: ['선크림 필수', '레티놀은 저녁에만 사용', '목까지 케어 확장'],
    avoidIngredients: [],
  },
  pigmentation: {
    ingredients: ['비타민C', '나이아신아마이드', '알부틴', '트라넥삼산'],
    tips: ['자외선 차단 철저히', '미백 세럼 꾸준히 사용', '필링 주 1회'],
    avoidIngredients: [],
  },
  pores: {
    ingredients: ['BHA', 'AHA', '나이아신아마이드', '레티놀'],
    tips: ['클렌징 꼼꼼히', '주 1-2회 클레이 마스크', '피지 조절 토너 사용'],
    avoidIngredients: ['무거운 오일', '코메도제닉 성분'],
  },
  dryness: {
    ingredients: ['히알루론산', '세라마이드', '스쿠알란', '시어버터'],
    tips: ['토너 레이어링', '수분 크림 듬뿍', '주 2-3회 수분 마스크팩'],
    avoidIngredients: ['알코올', 'SD 알코올'],
  },
  redness: {
    ingredients: ['센텔라', '마데카소사이드', '판테놀', '아줄렌'],
    tips: ['진정 케어 우선', '자극 최소화', '온도 변화 주의'],
    avoidIngredients: ['알코올', '향료', '멘톨', '캠퍼'],
  },
  dullness: {
    ingredients: ['비타민C', 'AHA', '나이아신아마이드', '글루타티온'],
    tips: ['주 1-2회 각질 케어', '비타민C 세럼 매일 사용', '충분한 수면'],
    avoidIngredients: [],
  },
};

// ================================================
// 유틸리티 함수
// ================================================

/**
 * 카테고리 정보 가져오기
 */
export function getCategoryInfo(category: ProductCategory): ProductCategoryInfo {
  return PRODUCT_CATEGORIES[category];
}

/**
 * 소요 시간 계산 (분 단위)
 */
export function calculateEstimatedTime(steps: RoutineStep[]): number {
  return steps.reduce((total, step) => {
    if (!step.duration) return total;
    const match = step.duration.match(/(\d+)/);
    if (!match) return total;
    const value = parseInt(match[1], 10);
    // "분" 또는 "초" 판별
    if (step.duration.includes('초')) {
      return total + value / 60;
    }
    return total + value;
  }, 0);
}

/**
 * 시간 포맷팅 (분 → "X분 X초")
 */
export function formatDuration(minutes: number): string {
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);

  if (secs === 0) {
    return `${mins}분`;
  }
  return `${mins}분 ${secs}초`;
}
