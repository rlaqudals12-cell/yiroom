/**
 * 바코드 Repository 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase/client';
import {
  findByBarcode,
  findByProductId,
  createBarcode,
  linkBarcodeToProduct,
  verifyBarcode,
} from '@/lib/smart-matching/barcodes';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('바코드 Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findByBarcode', () => {
    it('바코드로 제품을 조회한다', async () => {
      const mockData = {
        id: 'barcode-1',
        barcode: '8801234567890',
        barcode_type: 'EAN13',
        product_id: 'product-1',
        product_name: '테스트 제품',
        brand: '테스트 브랜드',
        category: 'skincare',
        image_url: null,
        source: 'user_report',
        verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as unknown as unknown as ReturnType<typeof supabase.from>);

      const result = await findByBarcode('8801234567890');

      expect(result).not.toBeNull();
      expect(result?.barcode).toBe('8801234567890');
      expect(result?.productName).toBe('테스트 제품');
      expect(result?.verified).toBe(true);
    });

    it('존재하지 않는 바코드는 null을 반환한다', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as unknown as unknown as ReturnType<typeof supabase.from>);

      const result = await findByBarcode('0000000000000');

      expect(result).toBeNull();
    });
  });

  describe('findByProductId', () => {
    it('제품 ID로 바코드 목록을 조회한다', async () => {
      const mockData = [
        {
          id: 'barcode-1',
          barcode: '8801234567890',
          barcode_type: 'EAN13',
          product_id: 'product-1',
          product_name: '테스트 제품',
          brand: null,
          category: null,
          image_url: null,
          source: null,
          verified: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as unknown as ReturnType<typeof supabase.from>);

      const result = await findByProductId('product-1');

      expect(result).toHaveLength(1);
      expect(result[0].barcode).toBe('8801234567890');
    });
  });

  describe('createBarcode', () => {
    it('새 바코드를 등록한다', async () => {
      const mockData = {
        id: 'barcode-new',
        barcode: '8809999999999',
        barcode_type: 'EAN13',
        product_id: null,
        product_name: '새 제품',
        brand: '새 브랜드',
        category: 'clothing',
        image_url: null,
        source: 'user_report',
        verified: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as unknown as ReturnType<typeof supabase.from>);

      const result = await createBarcode({
        barcode: '8809999999999',
        productName: '새 제품',
        brand: '새 브랜드',
        category: 'clothing',
      });

      expect(result).not.toBeNull();
      expect(result?.barcode).toBe('8809999999999');
      expect(result?.verified).toBe(false);
    });
  });

  describe('linkBarcodeToProduct', () => {
    it('바코드를 제품에 연결한다', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as unknown as ReturnType<typeof supabase.from>);

      const result = await linkBarcodeToProduct('barcode-1', 'product-1');

      expect(result).toBe(true);
      expect(mockQuery.update).toHaveBeenCalledWith({
        product_id: 'product-1',
        verified: true,
      });
    });
  });

  describe('verifyBarcode', () => {
    it('바코드를 검증 완료 처리한다', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as unknown as ReturnType<typeof supabase.from>);

      const result = await verifyBarcode('barcode-1');

      expect(result).toBe(true);
      expect(mockQuery.update).toHaveBeenCalledWith({ verified: true });
    });
  });
});
