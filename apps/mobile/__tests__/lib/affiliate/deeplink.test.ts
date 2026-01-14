/**
 * 어필리에이트 딥링크 생성 테스트
 */

import {
  createDeeplink,
  identifyPartner,
  openAffiliateLink,
  trackAndOpenLink,
} from '@/lib/affiliate/deeplink';
import type { AffiliatePartnerName } from '@/lib/affiliate/types';
import * as Linking from 'expo-linking';

// expo-linking 모킹
jest.mock('expo-linking', () => ({
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
}));

describe('createDeeplink', () => {
  it('쿠팡 딥링크를 생성해야 함', () => {
    const result = createDeeplink({
      partner: 'coupang',
      productUrl: 'https://www.coupang.com/vp/products/123',
      subId: 'home-banner',
    });

    expect(result.success).toBe(true);
    expect(result.url).toContain('subId=home-banner');
    expect(result.partner).toBe('coupang');
  });

  it('아이허브 딥링크를 생성해야 함', () => {
    const result = createDeeplink({
      partner: 'iherb',
      productUrl: 'https://kr.iherb.com/pr/123',
      subId: 'skin-analysis',
    });

    expect(result.success).toBe(true);
    expect(result.partner).toBe('iherb');
  });

  it('무신사 딥링크를 생성해야 함', () => {
    const result = createDeeplink({
      partner: 'musinsa',
      productUrl: 'https://www.musinsa.com/app/goods/123',
      subId: 'body-recommendation',
    });

    expect(result.success).toBe(true);
    expect(result.partner).toBe('musinsa');
  });

  it('지원하지 않는 파트너는 실패해야 함', () => {
    const result = createDeeplink({
      partner: 'unknown' as AffiliatePartnerName,
      productUrl: 'https://example.com/product',
    });

    expect(result.success).toBe(false);
    expect(result.url).toBe('https://example.com/product');
  });

  it('subId가 없으면 기본값을 사용해야 함', () => {
    const result = createDeeplink({
      partner: 'coupang',
      productUrl: 'https://www.coupang.com/vp/products/123',
    });

    expect(result.success).toBe(true);
    expect(result.url).toContain('subId=');
  });
});

describe('identifyPartner', () => {
  it('쿠팡 URL을 식별해야 함', () => {
    expect(identifyPartner('https://www.coupang.com/vp/products/123')).toBe(
      'coupang'
    );
  });

  it('아이허브 URL을 식별해야 함', () => {
    expect(identifyPartner('https://kr.iherb.com/pr/123')).toBe('iherb');
  });

  it('무신사 URL을 식별해야 함', () => {
    expect(identifyPartner('https://www.musinsa.com/app/goods/123')).toBe(
      'musinsa'
    );
  });

  it('대소문자 구분 없이 식별해야 함', () => {
    expect(identifyPartner('https://WWW.COUPANG.COM/vp/products/123')).toBe(
      'coupang'
    );
  });

  it('알 수 없는 URL은 null을 반환해야 함', () => {
    expect(identifyPartner('https://example.com/product')).toBe(null);
  });

  it('잘못된 URL은 null을 반환해야 함', () => {
    expect(identifyPartner('invalid-url')).toBe(null);
    expect(identifyPartner('')).toBe(null);
  });
});

describe('openAffiliateLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('URL을 성공적으로 열어야 함', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

    const url = 'https://www.coupang.com/vp/products/123';
    const result = await openAffiliateLink(url);

    expect(result).toBe(true);
    expect(Linking.canOpenURL).toHaveBeenCalledWith(url);
    expect(Linking.openURL).toHaveBeenCalledWith(url);
  });

  it('URL을 열 수 없으면 false를 반환해야 함', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = await openAffiliateLink('invalid://url');

    expect(result).toBe(false);
    expect(Linking.openURL).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('예외 발생 시 false를 반환해야 함', async () => {
    (Linking.canOpenURL as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await openAffiliateLink(
      'https://www.coupang.com/vp/products/123'
    );

    expect(result).toBe(false);
    consoleErrorSpy.mockRestore();
  });
});

describe('trackAndOpenLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('딥링크 생성 후 링크를 열어야 함', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

    const result = await trackAndOpenLink(
      'https://www.coupang.com/vp/products/123',
      'coupang',
      'home-banner'
    );

    expect(result).toBe(true);
    expect(Linking.openURL).toHaveBeenCalled();
  });

  it('딥링크 생성 실패 시 원본 URL을 열어야 함', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

    const productUrl = 'https://example.com/product';
    const result = await trackAndOpenLink(
      productUrl,
      'unknown' as AffiliatePartnerName
    );

    expect(result).toBe(true);
    expect(Linking.openURL).toHaveBeenCalledWith(productUrl);
  });
});
