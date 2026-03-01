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

// 변화 추적
export { ChangeTracker } from './ChangeTracker';
export type { ChangeTrackerItem, ChangeTrackerProps } from './ChangeTracker';

// 점진적 공개
export { ProgressiveDisclosure } from './ProgressiveDisclosure';
export type { ProgressiveDisclosureProps } from './ProgressiveDisclosure';

// 타임라인 차트
export { TimelineChart } from './TimelineChart';
export type { TimelineDataPoint, TimelineChartProps } from './TimelineChart';

// 랭킹 카드
export { RankingCard } from './RankingCard';
export type { RankingItem, RankingCardProps } from './RankingCard';

// QR 코드 표시
export { QRCodeDisplay } from './QRCodeDisplay';
export type { QRCodeDisplayProps } from './QRCodeDisplay';

// 지역 선택기
export { RegionSelector } from './RegionSelector';
export type { RegionOption, RegionSelectorProps } from './RegionSelector';

// 도메인별 스켈레톤
export { NamedSkeleton } from './NamedSkeleton';
export type { SkeletonVariant, NamedSkeletonProps } from './NamedSkeleton';
