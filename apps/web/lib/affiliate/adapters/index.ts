/**
 * Partner Adapters (v2)
 * @description PartnerAdapter 인터페이스 및 구현체
 * @see docs/adr/ADR-067-affiliate-partner-api-strategy.md
 */

// 인터페이스/타입
export type {
  PartnerAdapter,
  ProductSearchQuery,
  PartnerProduct,
  TrackingParams,
  ConversionEvent,
} from './types';

// 어댑터 구현체
export { CoupangPartnerAdapter, coupangAdapter } from './coupang';

// ================================================
// 어댑터 레지스트리
// ================================================

import type { PartnerAdapter } from './types';
import type { AffiliatePartnerName } from '@/types/affiliate';
import { coupangAdapter } from './coupang';

/** 등록된 어댑터 목록 */
const ADAPTER_REGISTRY: Partial<Record<AffiliatePartnerName, PartnerAdapter>> = {
  coupang: coupangAdapter,
  // TODO: CJ Affiliate 어댑터 추가 (Phase 2)
  // TODO: Amazon Creators 어댑터 추가 (Phase 3)
};

/**
 * 파트너명으로 어댑터 조회
 * @param partnerName - 파트너 식별자
 * @returns 어댑터 인스턴스 또는 undefined
 */
export function getAdapter(partnerName: AffiliatePartnerName): PartnerAdapter | undefined {
  return ADAPTER_REGISTRY[partnerName];
}

/**
 * 설정된 어댑터만 반환
 * @returns API 키가 설정된 어댑터 목록
 */
export function getConfiguredAdapters(): PartnerAdapter[] {
  return Object.values(ADAPTER_REGISTRY).filter(
    (adapter): adapter is PartnerAdapter => adapter !== undefined && adapter.isConfigured()
  );
}
