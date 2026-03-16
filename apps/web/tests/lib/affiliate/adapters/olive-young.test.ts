/**
 * 올리브영 파트너 어댑터 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OliveYoungPartnerAdapter, oliveYoungAdapter } from '@/lib/affiliate/adapters/olive-young';
import { getAdapter } from '@/lib/affiliate/adapters';

// fetch mock
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// 올리브영 HTML 검색 결과 시뮬레이션
const MOCK_OLIVEYOUNG_HTML = `
<div class="prd_info">
  <span class="tx_brand">이니스프리</span>
  <p class="prd_name">그린티 씨드 세럼 80ml</p>
  <span data-ref-price="28000"></span>
  <a href="/store/goods/getGoodsDetail.do?goodsNo=A000000123456">상세</a>
</div>
<div class="prd_info">
  <span class="tx_brand">라운드랩</span>
  <p class="prd_name">자작나무 수분 크림 80ml</p>
  <span data-ref-price="19800"></span>
  <a href="/store/goods/getGoodsDetail.do?goodsNo=A000000789012">상세</a>
</div>
`;

describe('OliveYoungPartnerAdapter', () => {
  let adapter: OliveYoungPartnerAdapter;
  const originalEnv = process.env.OLIVEYOUNG_ENABLED;

  beforeEach(() => {
    adapter = new OliveYoungPartnerAdapter();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 환경변수 원복
    if (originalEnv !== undefined) {
      process.env.OLIVEYOUNG_ENABLED = originalEnv;
    } else {
      delete process.env.OLIVEYOUNG_ENABLED;
    }
  });

  describe('기본 속성', () => {
    it('partnerId가 oliveyoung이다', () => {
      expect(adapter.partnerId).toBe('oliveyoung');
    });

    it('displayName이 올리브영이다', () => {
      expect(adapter.displayName).toBe('올리브영');
    });
  });

  describe('isConfigured', () => {
    it('OLIVEYOUNG_ENABLED=true이면 true 반환', () => {
      process.env.OLIVEYOUNG_ENABLED = 'true';
      // 새 인스턴스로 테스트 (환경변수 반영)
      const freshAdapter = new OliveYoungPartnerAdapter();
      expect(freshAdapter.isConfigured()).toBe(true);
    });

    it('OLIVEYOUNG_ENABLED가 없으면 false 반환', () => {
      delete process.env.OLIVEYOUNG_ENABLED;
      const freshAdapter = new OliveYoungPartnerAdapter();
      expect(freshAdapter.isConfigured()).toBe(false);
    });

    it('OLIVEYOUNG_ENABLED=false이면 false 반환', () => {
      process.env.OLIVEYOUNG_ENABLED = 'false';
      const freshAdapter = new OliveYoungPartnerAdapter();
      expect(freshAdapter.isConfigured()).toBe(false);
    });
  });

  describe('searchProducts', () => {
    it('비활성화 상태에서 빈 배열 반환', async () => {
      delete process.env.OLIVEYOUNG_ENABLED;
      const freshAdapter = new OliveYoungPartnerAdapter();

      const result = await freshAdapter.searchProducts({ keyword: '세럼' });

      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('활성화 상태에서 PartnerProduct 형태로 반환', async () => {
      process.env.OLIVEYOUNG_ENABLED = 'true';
      const freshAdapter = new OliveYoungPartnerAdapter();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => MOCK_OLIVEYOUNG_HTML,
      });

      const result = await freshAdapter.searchProducts({ keyword: '세럼' });

      expect(result.length).toBeGreaterThan(0);

      // PartnerProduct 필수 필드 확인
      const product = result[0];
      expect(product).toHaveProperty('externalProductId');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('isInStock');
      expect(product).toHaveProperty('directUrl');
      expect(product.category).toBe('cosmetic');
    });

    it('검색 실패 시 빈 배열 반환 (에러 무시)', async () => {
      process.env.OLIVEYOUNG_ENABLED = 'true';
      const freshAdapter = new OliveYoungPartnerAdapter();

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await freshAdapter.searchProducts({ keyword: '세럼' });

      expect(result).toEqual([]);
    });

    it('HTTP 에러 시 빈 배열 반환', async () => {
      process.env.OLIVEYOUNG_ENABLED = 'true';
      const freshAdapter = new OliveYoungPartnerAdapter();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const result = await freshAdapter.searchProducts({ keyword: '세럼' });

      expect(result).toEqual([]);
    });

    it('빈 HTML 결과 시 빈 배열 반환', async () => {
      process.env.OLIVEYOUNG_ENABLED = 'true';
      const freshAdapter = new OliveYoungPartnerAdapter();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '<html><body>검색 결과가 없습니다</body></html>',
      });

      const result = await freshAdapter.searchProducts({ keyword: '존재하지않는상품xyz' });

      expect(result).toEqual([]);
    });
  });

  describe('generateDeeplink', () => {
    it('올리브영 URL에 UTM 파라미터를 포함한다', () => {
      const url = adapter.generateDeeplink('A000000123456', {
        userId: 'user_123',
        sourcePage: 'product-detail',
        recommendationType: 'skin_match',
      });

      expect(url).toContain('oliveyoung.co.kr');
      expect(url).toContain('goodsNo=A000000123456');
      expect(url).toContain('utm_source=yiroom');
      expect(url).toContain('utm_medium=affiliate');
      expect(url).toContain('utm_campaign=skin_match');
      expect(url).toContain('ref=yiroom');
      expect(url).toContain('utm_content=user_123');
      expect(url).toContain('utm_term=product-detail');
    });

    it('트래킹 파라미터 없이도 기본 UTM이 포함된다', () => {
      const url = adapter.generateDeeplink('A000000789012', {});

      expect(url).toContain('goodsNo=A000000789012');
      expect(url).toContain('utm_source=yiroom');
      expect(url).toContain('ref=yiroom');
      expect(url).toContain('utm_campaign=general');
    });
  });

  describe('parseConversionWebhook', () => {
    it('null을 반환한다 (스켈레톤)', () => {
      const result = adapter.parseConversionWebhook({ orderId: 'test' });
      expect(result).toBeNull();
    });

    it('빈 payload에도 null을 반환한다', () => {
      const result = adapter.parseConversionWebhook(null);
      expect(result).toBeNull();
    });
  });

  describe('getProductDetail', () => {
    it('비활성화 상태에서 null 반환', async () => {
      delete process.env.OLIVEYOUNG_ENABLED;
      const freshAdapter = new OliveYoungPartnerAdapter();

      const result = await freshAdapter.getProductDetail('A000000123456');
      expect(result).toBeNull();
    });
  });
});

describe('올리브영 레지스트리 등록', () => {
  it('getAdapter로 oliveyoung 어댑터를 조회할 수 있다', () => {
    const adapter = getAdapter('oliveyoung');

    expect(adapter).toBeDefined();
    expect(adapter?.partnerId).toBe('oliveyoung');
    expect(adapter?.displayName).toBe('올리브영');
  });

  it('싱글톤 인스턴스가 올바른 타입이다', () => {
    expect(oliveYoungAdapter).toBeInstanceOf(OliveYoungPartnerAdapter);
  });
});
