/**
 * Beauty 도메인 Dynamic Import
 * 초기 로드 불필요한 컴포넌트 지연 로딩
 *
 * 성능 최적화: Sheet 컴포넌트 지연 로딩 (~50KB 번들 크기 감소)
 */

import dynamic from 'next/dynamic';

// 성분 필터 (Sheet 모달) - 기존 버전 (로컬 상태)
export const IngredientFavoriteFilterDynamic = dynamic(() => import('./IngredientFavoriteFilter'), {
  ssr: false,
  loading: () => null,
});

// 성분 필터 V2 (Sheet 모달) - user_preferences 연동
export const IngredientFavoriteFilterV2Dynamic = dynamic(
  () => import('./IngredientFavoriteFilterV2'),
  {
    ssr: false,
    loading: () => null,
  }
);

// 피부 나이 계산기 (사용자 인터랙션 필요)
export const SkinAgeCalculatorDynamic = dynamic(() => import('./SkinAgeCalculator'), {
  ssr: false,
  loading: () => null,
});

// 연령대 필터 (필터링 시에만 필요)
export const AgeGroupFilterDynamic = dynamic(() => import('./AgeGroupFilter'), {
  ssr: false,
  loading: () => null,
});

// 스킨케어 루틴 카드 (스크롤 아래)
export const SkincareRoutineCardDynamic = dynamic(() => import('./SkincareRoutineCard'), {
  ssr: false,
  loading: () => null,
});

// 타임딜 섹션 (화해/올리브영 스타일)
export const TimeDealSectionDynamic = dynamic(() => import('./TimeDealSection'), {
  ssr: false,
  loading: () => null,
});

// SNS형 뷰티 피드 (올리브영 셔터 스타일)
export const BeautyFeedDynamic = dynamic(() => import('./BeautyFeed'), {
  ssr: false,
  loading: () => null,
});
