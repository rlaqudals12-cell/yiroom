/**
 * 글로벌 어필리에이트 링크 생성기
 * @description 지역별 파트너에 맞는 어필리에이트 링크 생성
 */

import type { SupportedRegion } from '@/lib/region/config';
import { REGION_CONFIG } from '@/lib/region/config';

// ============================================
// 타입 정의
// ============================================

export type GlobalPartnerName =
  | 'coupang'
  | 'iherb'
  | 'amazon_us'
  | 'amazon_jp'
  | 'amazon_eu'
  | 'rakuten';

export interface GlobalDeeplinkOptions {
  /** 원본 제품 URL 또는 검색어 */
  query: string;
  /** 파트너 이름 */
  partner: GlobalPartnerName;
  /** 제품 ID (파트너사 기준) */
  productId?: string;
  /** 트래킹 서브 ID */
  subId?: string;
}

export interface GlobalDeeplinkResult {
  /** 생성된 딥링크 */
  url: string;
  /** 파트너 이름 */
  partner: GlobalPartnerName;
  /** 파트너 표시명 */
  displayName: string;
  /** 생성 성공 여부 */
  success: boolean;
  /** 에러 메시지 */
  error?: string;
}

// ============================================
// 파트너 설정
// ============================================

export const GLOBAL_PARTNER_CONFIG: Record<
  GlobalPartnerName,
  {
    displayName: string;
    displayNameKo: string;
    baseUrl: string;
    searchPath: string;
    affiliateParam?: string;
    affiliateValue?: string;
  }
> = {
  coupang: {
    displayName: 'Coupang',
    displayNameKo: '쿠팡',
    baseUrl: 'https://www.coupang.com',
    searchPath: '/np/search',
    // 쿠팡은 별도 딥링크 API 사용
  },
  iherb: {
    displayName: 'iHerb',
    displayNameKo: '아이허브',
    baseUrl: 'https://kr.iherb.com',
    searchPath: '/search',
    affiliateParam: 'pcode',
    affiliateValue: process.env.IHERB_AFFILIATE_CODE || 'YIROOM',
  },
  amazon_us: {
    displayName: 'Amazon US',
    displayNameKo: '아마존 (미국)',
    baseUrl: 'https://www.amazon.com',
    searchPath: '/s',
    affiliateParam: 'tag',
    affiliateValue: process.env.AMAZON_US_AFFILIATE_TAG || 'yiroom-20',
  },
  amazon_jp: {
    displayName: 'Amazon Japan',
    displayNameKo: '아마존 (일본)',
    baseUrl: 'https://www.amazon.co.jp',
    searchPath: '/s',
    affiliateParam: 'tag',
    affiliateValue: process.env.AMAZON_JP_AFFILIATE_TAG || 'yiroom-22',
  },
  amazon_eu: {
    displayName: 'Amazon EU',
    displayNameKo: '아마존 (유럽)',
    baseUrl: 'https://www.amazon.de',
    searchPath: '/s',
    affiliateParam: 'tag',
    affiliateValue: process.env.AMAZON_EU_AFFILIATE_TAG || 'yiroom-21',
  },
  rakuten: {
    displayName: 'Rakuten',
    displayNameKo: '라쿠텐',
    baseUrl: 'https://www.rakuten.co.jp',
    searchPath: '/search/mall',
    affiliateParam: 'scid',
    affiliateValue: process.env.RAKUTEN_AFFILIATE_ID || 'af_pc_etc',
  },
};

// ============================================
// 글로벌 딥링크 생성
// ============================================

/**
 * 글로벌 파트너 딥링크 생성
 */
export function createGlobalDeeplink(options: GlobalDeeplinkOptions): GlobalDeeplinkResult {
  const { partner, query, productId, subId } = options;
  const config = GLOBAL_PARTNER_CONFIG[partner];

  if (!config) {
    return {
      url: '',
      partner,
      displayName: partner,
      success: false,
      error: `지원하지 않는 파트너: ${partner}`,
    };
  }

  try {
    let url: string;

    switch (partner) {
      case 'coupang':
        url = createCoupangSearchLink(query, subId);
        break;
      case 'iherb':
        url = createIHerbSearchLink(query, subId);
        break;
      case 'amazon_us':
      case 'amazon_jp':
      case 'amazon_eu':
        url = createAmazonSearchLink(partner, query, productId);
        break;
      case 'rakuten':
        url = createRakutenSearchLink(query, subId);
        break;
      default:
        url = createGenericSearchLink(config, query);
    }

    return {
      url,
      partner,
      displayName: config.displayNameKo,
      success: true,
    };
  } catch (error) {
    return {
      url: '',
      partner,
      displayName: config.displayNameKo,
      success: false,
      error: error instanceof Error ? error.message : '링크 생성 실패',
    };
  }
}

/**
 * 지역에 맞는 파트너 딥링크 목록 생성
 */
export function createRegionalDeeplinks(
  region: SupportedRegion,
  query: string,
  subId?: string
): GlobalDeeplinkResult[] {
  const regionInfo = REGION_CONFIG[region];
  const partners = regionInfo.affiliatePartners as GlobalPartnerName[];

  return partners.map((partner) =>
    createGlobalDeeplink({
      partner,
      query,
      subId,
    })
  );
}

/**
 * 모든 지역의 파트너 딥링크 생성
 */
export function createAllRegionalDeeplinks(
  query: string,
  subId?: string
): Map<SupportedRegion, GlobalDeeplinkResult[]> {
  const results = new Map<SupportedRegion, GlobalDeeplinkResult[]>();

  for (const region of Object.keys(REGION_CONFIG) as SupportedRegion[]) {
    results.set(region, createRegionalDeeplinks(region, query, subId));
  }

  return results;
}

// ============================================
// 파트너별 링크 생성
// ============================================

function createCoupangSearchLink(query: string, subId?: string): string {
  const baseUrl = 'https://www.coupang.com/np/search';
  const url = new URL(baseUrl);
  url.searchParams.set('q', query);
  if (subId) {
    url.searchParams.set('subId', subId);
  }
  return url.toString();
}

function createIHerbSearchLink(query: string, subId?: string): string {
  const config = GLOBAL_PARTNER_CONFIG.iherb;
  const url = new URL(`${config.baseUrl}${config.searchPath}`);
  url.searchParams.set('kw', query);
  if (config.affiliateParam && config.affiliateValue) {
    url.searchParams.set(config.affiliateParam, config.affiliateValue);
  }
  if (subId) {
    url.searchParams.set('rcode', subId);
  }
  return url.toString();
}

function createAmazonSearchLink(
  partner: 'amazon_us' | 'amazon_jp' | 'amazon_eu',
  query: string,
  productId?: string
): string {
  const config = GLOBAL_PARTNER_CONFIG[partner];
  const url = new URL(`${config.baseUrl}${config.searchPath}`);
  url.searchParams.set('k', query);
  if (config.affiliateParam && config.affiliateValue) {
    url.searchParams.set(config.affiliateParam, config.affiliateValue);
  }
  if (productId) {
    url.searchParams.set('i', productId);
  }
  return url.toString();
}

function createRakutenSearchLink(query: string, subId?: string): string {
  const config = GLOBAL_PARTNER_CONFIG.rakuten;
  const url = new URL(`${config.baseUrl}${config.searchPath}/${encodeURIComponent(query)}/`);
  if (config.affiliateParam && config.affiliateValue) {
    url.searchParams.set(config.affiliateParam, config.affiliateValue);
  }
  if (subId) {
    url.searchParams.set('sid', subId);
  }
  return url.toString();
}

function createGenericSearchLink(
  config: (typeof GLOBAL_PARTNER_CONFIG)[GlobalPartnerName],
  query: string
): string {
  const url = new URL(`${config.baseUrl}${config.searchPath}`);
  url.searchParams.set('q', query);
  if (config.affiliateParam && config.affiliateValue) {
    url.searchParams.set(config.affiliateParam, config.affiliateValue);
  }
  return url.toString();
}

// ============================================
// 유틸리티
// ============================================

/**
 * 지역별 추천 파트너 조회
 */
export function getRegionalPartners(region: SupportedRegion): GlobalPartnerName[] {
  const regionInfo = REGION_CONFIG[region];
  return regionInfo.affiliatePartners as GlobalPartnerName[];
}

/**
 * 파트너 표시 정보 조회
 */
export function getPartnerInfo(partner: GlobalPartnerName): {
  displayName: string;
  displayNameKo: string;
} | null {
  const config = GLOBAL_PARTNER_CONFIG[partner];
  if (!config) return null;
  return {
    displayName: config.displayName,
    displayNameKo: config.displayNameKo,
  };
}

/**
 * 어필리에이트 지원 여부 확인
 */
export function isAffiliateSupported(region: SupportedRegion): boolean {
  return REGION_CONFIG[region].affiliateSupport;
}
