/**
 * 바코드 → 제품/구매 브릿지 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveBarcode } from '@/lib/scan/barcode-product-bridge';

// findByBarcode (product_barcodes DB) 모킹
vi.mock('@/lib/smart-matching/barcodes', () => ({
  findByBarcode: vi.fn(),
}));

// lookupProduct (내부 시드 + Open Beauty Facts) 모킹
vi.mock('@/lib/scan/product-lookup', () => ({
  lookupProduct: vi.fn(),
}));

// searchAffiliateProducts 모킹
vi.mock('@/lib/affiliate', () => ({
  searchAffiliateProducts: vi.fn(),
}));

// 모킹된 모듈 가져오기
import { findByBarcode } from '@/lib/smart-matching/barcodes';
import { lookupProduct } from '@/lib/scan/product-lookup';
import { searchAffiliateProducts } from '@/lib/affiliate';

const mockFindByBarcode = vi.mocked(findByBarcode);
const mockLookupProduct = vi.mocked(lookupProduct);
const mockSearchAffiliateProducts = vi.mocked(searchAffiliateProducts);

beforeEach(() => {
  vi.clearAllMocks();
  // 기본: 미발견
  mockFindByBarcode.mockResolvedValue(null);
  mockLookupProduct.mockResolvedValue({
    found: false,
    source: 'internal_db',
    confidence: 0,
  });
  mockSearchAffiliateProducts.mockResolvedValue([]);
});

describe('resolveBarcode', () => {
  it('내부 DB 매칭 성공 시 detailUrl이 /beauty/[id] 형태', async () => {
    mockFindByBarcode.mockResolvedValue({
      id: 'bc-1',
      barcode: '8809123456789',
      barcodeType: 'EAN13',
      productId: 'prod-abc',
      productName: '이니스프리 그린티 세럼',
      brand: '이니스프리',
      category: 'skincare',
      imageUrl: 'https://example.com/img.jpg',
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await resolveBarcode('8809123456789');

    expect(result.found).toBe(true);
    expect(result.detailUrl).toBe('/beauty/prod-abc');
    expect(result.internalProduct).toBeDefined();
    expect(result.internalProduct?.id).toBe('prod-abc');
    expect(result.internalProduct?.name).toBe('이니스프리 그린티 세럼');
    expect(result.internalProduct?.brand).toBe('이니스프리');
    expect(result.internalProduct?.type).toBe('cosmetic');
  });

  it('내부 DB 미매칭 시 Open Beauty Facts 외부 정보 반환', async () => {
    mockFindByBarcode.mockResolvedValue(null);
    mockLookupProduct.mockResolvedValue({
      found: true,
      source: 'open_beauty_facts',
      confidence: 0.85,
      product: {
        id: 'obf_1234567890123',
        barcode: '1234567890123',
        name: 'Moisturizing Cream',
        brand: 'TestBrand',
        category: 'skincare',
        ingredients: [],
        dataSource: 'open_beauty_facts',
        verified: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    });

    const result = await resolveBarcode('1234567890123');

    expect(result.found).toBe(true);
    // 외부 제품이므로 내부 상세 URL 없음
    expect(result.detailUrl).toBe('');
    expect(result.internalProduct).toBeUndefined();
    expect(result.externalInfo).toBeDefined();
    expect(result.externalInfo?.source).toBe('open_beauty_facts');
    expect(result.externalInfo?.name).toBe('Moisturizing Cream');
    expect(result.externalInfo?.brand).toBe('TestBrand');
  });

  it('바코드가 빈 문자열일 때 found: false', async () => {
    const result = await resolveBarcode('');

    expect(result.found).toBe(false);
    expect(result.affiliateLinks).toEqual([]);
    expect(result.detailUrl).toBe('');
    // DB 호출하지 않아야 함
    expect(mockFindByBarcode).not.toHaveBeenCalled();
  });

  it('공백만 있는 바코드도 found: false', async () => {
    const result = await resolveBarcode('   ');

    expect(result.found).toBe(false);
    expect(mockFindByBarcode).not.toHaveBeenCalled();
  });

  it('어필리에이트 링크 배열 생성 확인', async () => {
    mockFindByBarcode.mockResolvedValue({
      id: 'bc-2',
      barcode: '8809000000001',
      barcodeType: 'EAN13',
      productId: 'prod-xyz',
      productName: '라네즈 워터뱅크 크림',
      brand: '라네즈',
      category: 'skincare',
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 어필리에이트 검색 결과 모킹
    mockSearchAffiliateProducts.mockResolvedValue([
      {
        id: 'aff-1',
        partnerId: 'coupang',
        externalProductId: 'cp-123',
        name: '라네즈 워터뱅크 크림',
        affiliateUrl: 'https://link.coupang.com/re/PRODUCT123',
        priceKrw: 32000,
        currency: 'KRW',
        isInStock: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never,
      {
        id: 'aff-2',
        partnerId: 'musinsa',
        externalProductId: 'ms-456',
        name: '라네즈 워터뱅크 크림',
        affiliateUrl: 'https://www.musinsa.com/product/456?ref=yiroom',
        priceKrw: 29800,
        currency: 'KRW',
        isInStock: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never,
    ]);

    const result = await resolveBarcode('8809000000001');

    expect(result.found).toBe(true);
    expect(result.affiliateLinks).toHaveLength(2);
    expect(result.affiliateLinks[0].partner).toBe('coupang');
    expect(result.affiliateLinks[0].url).toBe('https://link.coupang.com/re/PRODUCT123');
    expect(result.affiliateLinks[0].price).toBe(32000);
    expect(result.affiliateLinks[1].partner).toBe('musinsa');
    expect(result.affiliateLinks[1].price).toBe(29800);
  });

  it('내부 시드 데이터 매칭 시 상세 URL 생성', async () => {
    // product_barcodes DB에는 없지만 시드 데이터에 있는 경우
    mockFindByBarcode.mockResolvedValue(null);
    mockLookupProduct.mockResolvedValue({
      found: true,
      source: 'internal_db',
      confidence: 1.0,
      product: {
        id: 'seed-product-1',
        barcode: '8801234567890',
        name: '설화수 윤조에센스',
        brand: '설화수',
        category: 'skincare',
        ingredients: [],
        dataSource: 'manual',
        verified: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    });

    const result = await resolveBarcode('8801234567890');

    expect(result.found).toBe(true);
    expect(result.detailUrl).toBe('/beauty/seed-product-1');
    expect(result.internalProduct?.id).toBe('seed-product-1');
    expect(result.internalProduct?.type).toBe('cosmetic');
  });

  it('supplement 카테고리는 supplement 타입 반환', async () => {
    mockFindByBarcode.mockResolvedValue({
      id: 'bc-3',
      barcode: '8809999000001',
      barcodeType: 'EAN13',
      productId: 'prod-supp',
      productName: '비타민C 1000',
      brand: '뉴트리원',
      category: 'supplement',
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await resolveBarcode('8809999000001');

    expect(result.found).toBe(true);
    expect(result.internalProduct?.type).toBe('supplement');
  });

  it('어필리에이트 검색 실패해도 정상 결과 반환', async () => {
    mockFindByBarcode.mockResolvedValue({
      id: 'bc-4',
      barcode: '8809111111111',
      barcodeType: 'EAN13',
      productId: 'prod-err',
      productName: '테스트 제품',
      brand: '테스트',
      category: 'skincare',
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 어필리에이트 검색이 에러 발생
    mockSearchAffiliateProducts.mockRejectedValue(new Error('Network error'));

    const result = await resolveBarcode('8809111111111');

    expect(result.found).toBe(true);
    expect(result.internalProduct?.id).toBe('prod-err');
    // 어필리에이트 실패해도 빈 배열
    expect(result.affiliateLinks).toEqual([]);
  });

  it('모든 소스에서 미발견 시 found: false', async () => {
    mockFindByBarcode.mockResolvedValue(null);
    mockLookupProduct.mockResolvedValue({
      found: false,
      source: 'internal_db',
      confidence: 0,
    });

    const result = await resolveBarcode('0000000000000');

    expect(result.found).toBe(false);
    expect(result.affiliateLinks).toEqual([]);
    expect(result.detailUrl).toBe('');
    expect(result.internalProduct).toBeUndefined();
    expect(result.externalInfo).toBeUndefined();
  });
});
