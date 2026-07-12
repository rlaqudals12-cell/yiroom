/**
 * 어필리에이트 컴포넌트 통합 Export
 */

// 다중 채널 제품 카드
export { MultiChannelProductCard } from './MultiChannelProductCard';
export type { MultiChannelProductCardProps, ChannelOption } from './MultiChannelProductCard';

// 채널 비교 테이블
export { ChannelComparisonTable } from './ChannelComparisonTable';
export type { ChannelComparisonTableProps } from './ChannelComparisonTable';

// 법적 고지
export {
  AffiliateDisclosure,
  AffiliatePageBanner,
  AffiliateCardDisclosure,
  AffiliateTooltip,
} from './AffiliateDisclosure';
export type { AffiliateDisclosureProps, DisclosureVariant } from './AffiliateDisclosure';

// 고지 문구 상수 (서버/클라 공유 순수 모듈에서 직접 재수출)
export { SHORT_DISCLOSURE, INTERMEDIARY_DISCLOSURE, DETAILED_DISCLOSURE } from './disclosure-text';
