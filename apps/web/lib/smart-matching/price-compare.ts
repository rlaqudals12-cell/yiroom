/**
 * 가격 비교 서비스
 * @description 여러 플랫폼의 가격을 비교하고 최적 구매처 추천
 */

import type {
  PriceComparison,
  PurchaseOption,
  DeliveryType,
} from '@/types/smart-matching';
import { getPriceHistory, getLowestPrice, getPriceChangePercent } from './price-watches';

// ============================================
// 플랫폼 정보
// ============================================

export interface PlatformInfo {
  id: string;
  name: string;
  logo?: string;
  baseCommissionRate: number;
  deliveryTypes: DeliveryType[];
  defaultDeliveryDays: number;
  freeDeliveryThreshold?: number;
}

export const PLATFORMS: Record<string, PlatformInfo> = {
  coupang: {
    id: 'coupang',
    name: '쿠팡',
    baseCommissionRate: 3.0,
    deliveryTypes: ['rocket', 'next_day', 'standard'],
    defaultDeliveryDays: 1,
    freeDeliveryThreshold: 19900,
  },
  naver: {
    id: 'naver',
    name: '네이버쇼핑',
    baseCommissionRate: 2.5,
    deliveryTypes: ['next_day', 'standard'],
    defaultDeliveryDays: 2,
  },
  gmarket: {
    id: 'gmarket',
    name: 'G마켓',
    baseCommissionRate: 2.0,
    deliveryTypes: ['standard'],
    defaultDeliveryDays: 3,
  },
  auction: {
    id: 'auction',
    name: '옥션',
    baseCommissionRate: 2.0,
    deliveryTypes: ['standard'],
    defaultDeliveryDays: 3,
  },
  '11st': {
    id: '11st',
    name: '11번가',
    baseCommissionRate: 2.5,
    deliveryTypes: ['next_day', 'standard'],
    defaultDeliveryDays: 2,
  },
  iherb: {
    id: 'iherb',
    name: 'iHerb',
    baseCommissionRate: 5.0,
    deliveryTypes: ['international'],
    defaultDeliveryDays: 7,
    freeDeliveryThreshold: 40000,
  },
  musinsa: {
    id: 'musinsa',
    name: '무신사',
    baseCommissionRate: 3.0,
    deliveryTypes: ['next_day', 'standard'],
    defaultDeliveryDays: 2,
    freeDeliveryThreshold: 30000,
  },
  oliveyoung: {
    id: 'oliveyoung',
    name: '올리브영',
    baseCommissionRate: 3.0,
    deliveryTypes: ['next_day', 'standard'],
    defaultDeliveryDays: 2,
    freeDeliveryThreshold: 20000,
  },
};

// ============================================
// 가격 비교 메인 함수
// ============================================

/**
 * 제품 가격 비교
 * @description 여러 플랫폼의 가격을 비교하고 최적 옵션 추천
 */
export async function comparePrices(
  productId: string,
  options?: {
    platforms?: string[];
    includeHistory?: boolean;
  }
): Promise<PriceComparison> {
  const targetPlatforms = options?.platforms || Object.keys(PLATFORMS);

  // 각 플랫폼별 가격 정보 조회 (실제로는 API 호출 또는 크롤링)
  const purchaseOptions = await fetchPriceFromPlatforms(productId, targetPlatforms);

  // 최적 옵션 계산
  const bestPrice = findBestPrice(purchaseOptions);
  const fastestDelivery = findFastestDelivery(purchaseOptions);
  const bestValue = findBestValue(purchaseOptions);

  return {
    productId,
    options: purchaseOptions,
    bestPrice,
    fastestDelivery,
    bestValue,
    lastUpdated: new Date(),
  };
}

/**
 * 플랫폼별 가격 조회
 * @description 실제 환경에서는 각 플랫폼 API 또는 크롤링으로 대체
 */
async function fetchPriceFromPlatforms(
  productId: string,
  platforms: string[]
): Promise<PurchaseOption[]> {
  const options: PurchaseOption[] = [];

  for (const platformId of platforms) {
    const platform = PLATFORMS[platformId];
    if (!platform) continue;

    // 가격 히스토리에서 최신 가격 조회
    const history = await getPriceHistory(productId, {
      platform: platformId,
      limit: 1,
    });

    if (history.length > 0) {
      const latest = history[0];
      const option = createPurchaseOption(
        platform,
        latest.price,
        latest.originalPrice,
        productId
      );
      options.push(option);
    }
  }

  return options;
}

/**
 * 구매 옵션 생성
 */
function createPurchaseOption(
  platform: PlatformInfo,
  price: number,
  originalPrice?: number,
  productId?: string
): PurchaseOption {
  const salePrice = price;
  const original = originalPrice || price;
  const discountPercent = original > salePrice
    ? Math.round(((original - salePrice) / original) * 100)
    : 0;

  // 배송비 계산
  const deliveryFee = platform.freeDeliveryThreshold && salePrice >= platform.freeDeliveryThreshold
    ? 0
    : 3000; // 기본 배송비

  // 적립 포인트 계산 (일반적으로 1%)
  const points = Math.floor(salePrice * 0.01);

  return {
    platform: platform.id,
    originalPrice: original,
    salePrice,
    discountPercent,
    deliveryType: platform.deliveryTypes[0],
    deliveryDays: platform.defaultDeliveryDays,
    deliveryFee,
    freeDeliveryThreshold: platform.freeDeliveryThreshold,
    points,
    inStock: true,
    affiliateUrl: generateAffiliateUrl(platform.id, productId || ''),
    commissionRate: platform.baseCommissionRate,
    lastUpdated: new Date(),
    reliability: 'cached',
  };
}

/**
 * 제휴 링크 생성
 */
function generateAffiliateUrl(platformId: string, productId: string): string {
  // 실제 환경에서는 제휴 링크 API 사용
  const baseUrls: Record<string, string> = {
    coupang: 'https://link.coupang.com/a/',
    naver: 'https://cr.shopping.naver.com/',
    musinsa: 'https://www.musinsa.com/app/goods/',
    oliveyoung: 'https://www.oliveyoung.co.kr/store/goods/',
    iherb: 'https://kr.iherb.com/',
  };

  const base = baseUrls[platformId] || `https://${platformId}.com/`;
  return `${base}${productId}?ref=yiroom`;
}

// ============================================
// 최적 옵션 찾기
// ============================================

/**
 * 최저가 옵션
 */
function findBestPrice(options: PurchaseOption[]): PurchaseOption | undefined {
  const inStock = options.filter((o) => o.inStock);
  if (inStock.length === 0) return undefined;

  return inStock.reduce((best, current) => {
    const bestTotal = best.salePrice + best.deliveryFee;
    const currentTotal = current.salePrice + current.deliveryFee;
    return currentTotal < bestTotal ? current : best;
  });
}

/**
 * 최단 배송 옵션
 */
function findFastestDelivery(options: PurchaseOption[]): PurchaseOption | undefined {
  const inStock = options.filter((o) => o.inStock);
  if (inStock.length === 0) return undefined;

  return inStock.reduce((fastest, current) => {
    if (current.deliveryDays < fastest.deliveryDays) return current;
    if (current.deliveryDays === fastest.deliveryDays) {
      // 배송일 같으면 가격 비교
      return current.salePrice < fastest.salePrice ? current : fastest;
    }
    return fastest;
  });
}

/**
 * 최적 가성비 옵션
 * @description 가격, 배송, 적립금 종합 고려
 */
function findBestValue(options: PurchaseOption[]): PurchaseOption | undefined {
  const inStock = options.filter((o) => o.inStock);
  if (inStock.length === 0) return undefined;

  return inStock.reduce((best, current) => {
    const bestScore = calculateValueScore(best);
    const currentScore = calculateValueScore(current);
    return currentScore > bestScore ? current : best;
  });
}

/**
 * 가성비 점수 계산
 */
function calculateValueScore(option: PurchaseOption): number {
  const totalPrice = option.salePrice + option.deliveryFee;

  // 기본 점수 (가격 역수 * 100000)
  let score = (100000 / totalPrice) * 100;

  // 할인율 보너스
  score += option.discountPercent * 0.5;

  // 빠른 배송 보너스
  if (option.deliveryType === 'rocket') score += 10;
  else if (option.deliveryType === 'next_day') score += 5;

  // 무료 배송 보너스
  if (option.deliveryFee === 0) score += 5;

  // 적립금 보너스
  score += (option.points || 0) / 100;

  return score;
}

// ============================================
// 가격 분석
// ============================================

/**
 * 가격 트렌드 분석
 */
export async function analyzePriceTrend(
  productId: string,
  days: number = 30
): Promise<{
  trend: 'rising' | 'falling' | 'stable';
  changePercent: number;
  lowestEver: { price: number; date: Date; platform: string } | null;
  suggestion: string;
}> {
  const changePercent = await getPriceChangePercent(productId, days);
  const lowest = await getLowestPrice(productId);

  let trend: 'rising' | 'falling' | 'stable' = 'stable';
  let suggestion = '';

  if (changePercent !== null) {
    if (changePercent > 5) {
      trend = 'rising';
      suggestion = '가격이 상승 중이에요. 지금 구매하시는 게 좋을 수 있어요.';
    } else if (changePercent < -5) {
      trend = 'falling';
      suggestion = '가격이 하락 중이에요. 조금 더 기다려보셔도 좋아요.';
    } else {
      suggestion = '가격이 안정적이에요.';
    }
  }

  // 역대 최저가 근처인지 확인
  if (lowest) {
    const history = await getPriceHistory(productId, { limit: 1 });
    if (history.length > 0) {
      const currentPrice = history[0].price;
      const lowestPrice = lowest.price;
      const diffPercent = ((currentPrice - lowestPrice) / lowestPrice) * 100;

      if (diffPercent <= 5) {
        suggestion = '지금이 역대 최저가에 가까워요! 구매하기 좋은 시점이에요.';
      }
    }
  }

  return {
    trend,
    changePercent: changePercent || 0,
    lowestEver: lowest ? {
      price: lowest.price,
      date: lowest.recordedAt,
      platform: lowest.platform,
    } : null,
    suggestion,
  };
}

/**
 * 가격 알림 조건 확인
 */
export function checkPriceAlertCondition(
  currentPrice: number,
  targetPrice?: number,
  percentDrop?: number,
  originalPrice?: number
): { triggered: boolean; reason: string } {
  // 목표가 이하로 떨어졌는지
  if (targetPrice && currentPrice <= targetPrice) {
    return {
      triggered: true,
      reason: `목표가 ${targetPrice.toLocaleString()}원 이하로 하락`,
    };
  }

  // N% 이상 할인되었는지
  if (percentDrop && originalPrice) {
    const actualDrop = ((originalPrice - currentPrice) / originalPrice) * 100;
    if (actualDrop >= percentDrop) {
      return {
        triggered: true,
        reason: `${Math.round(actualDrop)}% 할인 중 (목표: ${percentDrop}%)`,
      };
    }
  }

  return { triggered: false, reason: '' };
}

// ============================================
// 가격 표시 헬퍼
// ============================================

/**
 * 가격 포맷팅
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원';
}

/**
 * 할인율 표시
 */
export function formatDiscount(percent: number): string {
  return `${percent}% 할인`;
}

/**
 * 배송 타입 표시
 */
export function getDeliveryLabel(type: DeliveryType): string {
  switch (type) {
    case 'rocket':
      return '로켓배송';
    case 'next_day':
      return '내일 도착';
    case 'standard':
      return '일반배송';
    case 'international':
      return '해외직배송';
    default:
      return '';
  }
}

/**
 * 플랫폼 이름 가져오기
 */
export function getPlatformName(platformId: string): string {
  return PLATFORMS[platformId]?.name || platformId;
}
