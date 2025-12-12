/**
 * 가격 크롤러 타입 정의
 * @description 제품 가격 크롤링/업데이트를 위한 타입
 * @version 1.0
 * @date 2025-12-09
 */

import type { ProductType } from '@/types/product';

/**
 * 가격 조회 결과
 */
export interface PriceResult {
  productId: string;
  productType: ProductType;
  price: number;
  source: PriceSource;
  url?: string;
  fetchedAt: Date;
  success: boolean;
  error?: string;
}

/**
 * 가격 출처
 */
export type PriceSource =
  | 'naver_shopping'
  | 'coupang'
  | 'oliveyoung'
  | 'gmarket'
  | 'manual'
  | 'mock';

/**
 * 제품 타입별 권장 가격 소스
 */
export const PREFERRED_SOURCES_BY_TYPE: Record<string, PriceSource[]> = {
  cosmetic: ['oliveyoung', 'naver_shopping', 'coupang'], // 화장품은 올리브영 우선
  supplement: ['naver_shopping', 'coupang'],
  workout_equipment: ['naver_shopping', 'coupang'],
  health_food: ['naver_shopping', 'coupang'],
};

/**
 * 가격 조회 요청
 */
export interface PriceFetchRequest {
  productId: string;
  productType: ProductType;
  productName: string;
  brand: string;
  currentPrice?: number;
}

/**
 * 배치 업데이트 결과
 */
export interface BatchUpdateResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  results: PriceResult[];
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
}

/**
 * 가격 변동 정보
 */
export interface PriceChange {
  productId: string;
  productType: ProductType;
  previousPrice: number;
  newPrice: number;
  changePercent: number;
  changeType: 'increase' | 'decrease' | 'unchanged';
}

/**
 * 크롤러 설정
 */
export interface CrawlerConfig {
  /** 요청 간 딜레이 (ms) */
  requestDelay: number;
  /** 최대 재시도 횟수 */
  maxRetries: number;
  /** 타임아웃 (ms) */
  timeout: number;
  /** 배치 크기 */
  batchSize: number;
  /** 가격 변동 임계값 (%) - 이 이상 변동 시 경고 */
  priceChangeThreshold: number;
}

/**
 * 기본 크롤러 설정
 */
export const DEFAULT_CRAWLER_CONFIG: CrawlerConfig = {
  requestDelay: 1000, // 1초
  maxRetries: 3,
  timeout: 10000, // 10초
  batchSize: 50,
  priceChangeThreshold: 20, // 20% 이상 변동 시 경고
};
