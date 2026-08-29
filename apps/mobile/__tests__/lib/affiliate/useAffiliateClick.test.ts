import { act, renderHook } from '@testing-library/react-native';

const mockCreateAffiliateClick = jest.fn().mockResolvedValue('click-123');
const mockTrackAndOpenLink = jest.fn().mockResolvedValue(true);
const mockIdentifyPartner = jest.fn((url: string) => {
  if (url.includes('coupang')) return 'coupang';
  if (url.includes('iherb')) return 'iherb';
  if (url.includes('musinsa')) return 'musinsa';
  return null;
});
const mockSupabase = { from: jest.fn() };

jest.mock('@clerk/clerk-expo', () => ({
  useUser: () => ({ user: { id: 'user-123' } }),
}));
jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: () => mockSupabase,
}));
jest.mock('../../../lib/affiliate/clicks', () => ({
  createAffiliateClick: (...args: unknown[]) => mockCreateAffiliateClick(...args),
}));
jest.mock('../../../lib/affiliate/deeplink', () => ({
  trackAndOpenLink: (...args: unknown[]) => mockTrackAndOpenLink(...args),
  identifyPartner: (url: string) => mockIdentifyPartner(url),
}));
jest.mock('../../../lib/utils/logger', () => ({
  affiliateLogger: { warn: jest.fn(), error: jest.fn() },
}));

import { useAffiliateClick } from '../../../lib/affiliate/useAffiliateClick';

describe('useAffiliateClick', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateAffiliateClick.mockResolvedValue('click-123');
    mockTrackAndOpenLink.mockResolvedValue(true);
  });

  it('식별한 파트너 링크를 열고 사용자·클릭 출처 정보를 기록한다', async () => {
    const { result } = renderHook(() =>
      useAffiliateClick({
        productId: 'product-1',
        productUrl: 'https://www.coupang.com/vp/products/123',
        sourcePage: 'analysis',
        sourceComponent: 'recommendation-card',
        recommendationType: 'skin',
      })
    );

    await act(async () => result.current.handleClick());

    expect(mockCreateAffiliateClick).toHaveBeenCalledWith(mockSupabase, {
      productId: 'product-1',
      clerkUserId: 'user-123',
      sourcePage: 'analysis',
      sourceComponent: 'recommendation-card',
      recommendationType: 'skin',
    });
    expect(mockTrackAndOpenLink).toHaveBeenCalledWith(
      'https://www.coupang.com/vp/products/123',
      'coupang',
      'mobile-analysis'
    );
  });

  it('명시한 파트너를 URL 추론보다 우선한다', async () => {
    const { result } = renderHook(() =>
      useAffiliateClick({
        productId: 'product-2',
        productUrl: 'https://example.test/product',
        partner: 'iherb',
        sourcePage: 'search',
      })
    );

    await act(async () => result.current.handleClick());

    expect(mockTrackAndOpenLink).toHaveBeenCalledWith(
      'https://example.test/product',
      'iherb',
      'mobile-search'
    );
  });

  it('파트너를 식별하지 못해도 기존 원본 URL을 기본 채널로 연다', async () => {
    const { result } = renderHook(() =>
      useAffiliateClick({
        productId: 'product-3',
        productUrl: 'https://unknown.test/product',
        sourcePage: 'home',
      })
    );

    await act(async () => result.current.handleClick());

    expect(mockTrackAndOpenLink).toHaveBeenCalledWith(
      'https://unknown.test/product',
      'coupang',
      'mobile-home'
    );
  });

  it('외부 링크 열기 실패를 사용자 오류 상태로 보존한다', async () => {
    mockTrackAndOpenLink.mockResolvedValue(false);
    const { result } = renderHook(() =>
      useAffiliateClick({
        productId: 'product-4',
        productUrl: 'https://kr.iherb.com/pr/123',
        sourcePage: 'home',
      })
    );

    await act(async () => result.current.handleClick());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('링크를 열 수 없습니다');
  });
});
