import { describe, it, expect, vi } from 'vitest';
import { createDeeplink } from '@/lib/affiliate/deeplink';

// OPEN API 미해금(키 없음) 상황: coupang 모듈이 Mock URL을 돌려준다
vi.mock('@/lib/affiliate/coupang', () => ({
  createCoupangDeeplink: vi
    .fn()
    .mockResolvedValue('https://link.coupang.com/a/mock?itemId=0&subId=x'),
}));

describe('deeplink — 쿠팡 Mock URL 가드', () => {
  it('Mock URL이 오면 수익 링크가 아니라 정보 링크(원본 URL)로 강등한다', async () => {
    const result = await createDeeplink({
      partner: 'coupang',
      productUrl: 'https://www.coupang.com/vp/products/123456',
      subId: 'x',
    });
    expect(result.success).toBe(true);
    expect(result.linkType).toBe('information');
    expect(result.url).toBe('https://www.coupang.com/vp/products/123456');
    expect(result.url).not.toContain('link.coupang.com');
  });
});
