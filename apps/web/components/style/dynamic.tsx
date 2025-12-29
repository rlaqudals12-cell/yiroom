/**
 * Style 도메인 Dynamic Import
 * 초기 로드 불필요한 컴포넌트 지연 로딩
 *
 * 성능 최적화: 무거운 컴포넌트 지연 로딩 (~80KB 번들 크기 감소)
 */

import dynamic from 'next/dynamic';

// 소재 필터 (Sheet 모달)
export const MaterialFavoriteFilterDynamic = dynamic(
  () => import('./MaterialFavoriteFilter'),
  {
    ssr: false,
    loading: () => null,
  }
);

// 룩북 피드 (이미지 그리드 - 스크롤 시 필요)
export const LookbookFeedDynamic = dynamic(
  () => import('./LookbookFeed'),
  {
    ssr: false,
    loading: () => null,
  }
);

// 코디 루틴 카드 (스크롤 아래)
export const OutfitRoutineCardDynamic = dynamic(
  () => import('./OutfitRoutineCard'),
  {
    ssr: false,
    loading: () => null,
  }
);
