/**
 * 지역별 설정
 * - 지원 지역, 통화, 언어, 어필리에이트 파트너
 */

export type SupportedRegion = 'KR' | 'US' | 'JP' | 'CN' | 'SEA' | 'EU' | 'OTHER';

export interface RegionInfo {
  code: SupportedRegion;
  name: string;
  nameEn: string;
  currency: string;
  currencySymbol: string;
  language: string;
  flag: string;
  affiliateSupport: boolean;
  affiliatePartners: string[];
}

export const REGION_CONFIG: Record<SupportedRegion, RegionInfo> = {
  KR: {
    code: 'KR',
    name: '한국',
    nameEn: 'South Korea',
    currency: 'KRW',
    currencySymbol: '₩',
    language: 'ko',
    flag: '🇰🇷',
    affiliateSupport: true,
    affiliatePartners: ['coupang', 'iherb'],
  },
  US: {
    code: 'US',
    name: '미국',
    nameEn: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    language: 'en',
    flag: '🇺🇸',
    affiliateSupport: true,
    affiliatePartners: ['amazon_us', 'iherb'],
  },
  JP: {
    code: 'JP',
    name: '일본',
    nameEn: 'Japan',
    currency: 'JPY',
    currencySymbol: '¥',
    language: 'ja',
    flag: '🇯🇵',
    affiliateSupport: true,
    affiliatePartners: ['amazon_jp', 'rakuten'],
  },
  CN: {
    code: 'CN',
    name: '중국',
    nameEn: 'China',
    currency: 'CNY',
    currencySymbol: '¥',
    language: 'zh',
    flag: '🇨🇳',
    affiliateSupport: false,
    affiliatePartners: [],
  },
  SEA: {
    code: 'SEA',
    name: '동남아시아',
    nameEn: 'Southeast Asia',
    currency: 'USD',
    currencySymbol: '$',
    language: 'en',
    flag: '🌏',
    affiliateSupport: false,
    affiliatePartners: [],
  },
  EU: {
    code: 'EU',
    name: '유럽',
    nameEn: 'Europe',
    currency: 'EUR',
    currencySymbol: '€',
    language: 'en',
    flag: '🇪🇺',
    affiliateSupport: true,
    affiliatePartners: ['amazon_eu', 'iherb'],
  },
  OTHER: {
    code: 'OTHER',
    name: '기타',
    nameEn: 'Other',
    currency: 'USD',
    currencySymbol: '$',
    language: 'en',
    flag: '🌍',
    affiliateSupport: false,
    affiliatePartners: [],
  },
};

export const SUPPORTED_REGIONS = Object.keys(REGION_CONFIG) as SupportedRegion[];

/**
 * 지역 코드로 지역 정보 조회
 */
export function getRegionInfo(regionCode: SupportedRegion): RegionInfo {
  return REGION_CONFIG[regionCode] || REGION_CONFIG.OTHER;
}

/**
 * 어필리에이트 지원 지역 목록
 */
export function getAffiliateRegions(): SupportedRegion[] {
  return SUPPORTED_REGIONS.filter((code) => REGION_CONFIG[code].affiliateSupport);
}
