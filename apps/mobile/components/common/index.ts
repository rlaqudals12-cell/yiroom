/**
 * 공통 컴포넌트 모듈
 */

// AI 투명성 (AI 기본법 제31조)
export { AIBadge } from './AIBadge';
export type { AIBadgeVariant } from './AIBadge';
export { AITransparencyNotice } from './AITransparencyNotice';
export { MockDataNotice } from './MockDataNotice';

// 오프라인 상태
export { OfflineBanner } from './OfflineBanner';

// 에러 처리
export { ErrorBoundary } from './ErrorBoundary';

// 빈 상태
export { EmptyState } from './EmptyState';

// 스켈레톤 로딩
export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonListItem,
  SkeletonWorkoutCard,
  SkeletonNutritionSummary,
  SkeletonProductCard,
} from './Skeleton';

// 공유
export { ShareButton } from './ShareButton';

// 토스트
export { ActionToast } from './ActionToast';
