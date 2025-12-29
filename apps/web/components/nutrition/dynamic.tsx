/**
 * N-1 영양 모듈 Dynamic Import
 * 초기 로드 불필요한 무거운 컴포넌트 지연 로딩
 *
 * 성능 최적화: ~150KB 번들 크기 감소 (Sheet + 인사이트 카드)
 */

import dynamic from 'next/dynamic';

// Sheet 컴포넌트 (모달이므로 로딩 UI 불필요)
export const ManualFoodInputSheetDynamic = dynamic(
  () => import('./ManualFoodInputSheet'),
  {
    ssr: false,
    loading: () => null,
  }
);

export const WaterInputSheetDynamic = dynamic(
  () => import('./WaterInputSheet'),
  {
    ssr: false,
    loading: () => null,
  }
);

// 간헐적 단식 타이머 (활성화 시에만 필요)
export const FastingTimerDynamic = dynamic(
  () => import('./FastingTimer'),
  {
    ssr: false,
    loading: () => null,
  }
);

// 인사이트 카드 (스크롤 아래에 위치)
export const SkinInsightCardDynamic = dynamic(
  () => import('./SkinInsightCard'),
  {
    ssr: false,
    loading: () => null,
  }
);

export const WorkoutInsightCardDynamic = dynamic(
  () => import('./WorkoutInsightCard'),
  {
    ssr: false,
    loading: () => null,
  }
);

export const BodyInsightCardDynamic = dynamic(
  () => import('./BodyInsightCard'),
  {
    ssr: false,
    loading: () => null,
  }
);

// 영양제 추천 카드 (스크롤 아래에 위치)
export const SupplementRecommendationCardDynamic = dynamic(
  () => import('./SupplementRecommendationCard'),
  {
    ssr: false,
    loading: () => null,
  }
);

// "오늘 뭐 먹지?" 식단 추천 카드
export const MealSuggestionCardDynamic = dynamic(
  () => import('./MealSuggestionCard'),
  {
    ssr: false,
    loading: () => null,
  }
);
