/**
 * Affiliate System TypeScript 타입 정의
 * @description 어필리에이트 클릭 트래킹 시스템 타입
 * @version 1.0
 * @date 2025-12-19
 */

import type { ProductType } from './product';

// ================================================
// 어필리에이트 타입
// ================================================

/** 어필리에이트 제품 타입 (DB 저장용) */
export type AffiliateProductType = 'cosmetic' | 'supplement' | 'equipment' | 'healthfood';

/** ProductType → AffiliateProductType 변환 */
export function toAffiliateProductType(type: ProductType): AffiliateProductType {
  const mapping: Record<ProductType, AffiliateProductType> = {
    cosmetic: 'cosmetic',
    supplement: 'supplement',
    workout_equipment: 'equipment',
    health_food: 'healthfood',
  };
  return mapping[type];
}

/** 어필리에이트 클릭 기록 */
export interface AffiliateClick {
  id: string;
  clerkUserId?: string;
  productType: AffiliateProductType;
  productId: string;
  referrer?: string;
  userAgent?: string;
  ipHash?: string;
  clickedAt: string;
}

/** 클릭 트래킹 입력 */
export interface TrackClickInput {
  productType: AffiliateProductType;
  productId: string;
  clerkUserId?: string;
  referrer?: string;
  userAgent?: string;
}

/** 일별 통계 */
export interface DailyClickStats {
  date: string;
  productType: AffiliateProductType;
  productId: string;
  clickCount: number;
  uniqueUsers: number;
}

/** 제품별 클릭 통계 */
export interface ProductClickStats {
  productType: AffiliateProductType;
  productId: string;
  productName: string;
  totalClicks: number;
  uniqueUsers: number;
}

/** 어필리에이트 통계 요약 */
export interface AffiliateStats {
  /** 조회 기간 */
  period: {
    startDate: string;
    endDate: string;
  };
  /** 총 클릭 수 */
  totalClicks: number;
  /** 고유 사용자 수 */
  uniqueUsers: number;
  /** 제품별 통계 */
  byProduct: ProductClickStats[];
  /** 일별 통계 */
  byDate: {
    date: string;
    clicks: number;
  }[];
}

// ================================================
// Supabase 테이블 Row 타입
// ================================================

/** affiliate_clicks 테이블 row */
export interface AffiliateClickRow {
  id: string;
  clerk_user_id: string | null;
  product_type: string;
  product_id: string;
  referrer: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  clicked_at: string;
}

/** affiliate_daily_stats 뷰 row */
export interface AffiliateDailyStatsRow {
  date: string;
  product_type: string;
  product_id: string;
  click_count: number;
  unique_users: number;
}

// ================================================
// 변환 함수
// ================================================

/** DB row → 프론트엔드 타입 변환 */
export function toAffiliateClick(row: AffiliateClickRow): AffiliateClick {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id ?? undefined,
    productType: row.product_type as AffiliateProductType,
    productId: row.product_id,
    referrer: row.referrer ?? undefined,
    userAgent: row.user_agent ?? undefined,
    ipHash: row.ip_hash ?? undefined,
    clickedAt: row.clicked_at,
  };
}

/** 일별 통계 row 변환 */
export function toDailyClickStats(row: AffiliateDailyStatsRow): DailyClickStats {
  return {
    date: row.date,
    productType: row.product_type as AffiliateProductType,
    productId: row.product_id,
    clickCount: row.click_count,
    uniqueUsers: row.unique_users,
  };
}
