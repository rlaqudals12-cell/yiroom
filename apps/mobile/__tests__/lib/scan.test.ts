/**
 * lib/scan 테스트
 *
 * 바코드 검증, 형식 감지, 성분 파싱, 피부타입 적합도 확인.
 * DB 연동 함수(lookupProduct, recordScan 등)는 Supabase mock으로 테스트.
 */

import {
  validateEAN13,
  validateEAN8,
  validateUPCA,
  detectBarcodeFormat,
  parseIngredientsText,
  checkIngredientForSkinType,
  SKIN_TYPE_INGREDIENTS,
  lookupProduct,
  searchProducts,
  recordScan,
  getRecentScans,
} from '../../lib/scan';

// ─── 바코드 검증 ────────────────────────────────────────

describe('validateEAN13', () => {
  it('유효한 EAN-13 바코드 통과', () => {
    // 8801234567895 — 체크디짓 계산: sum = 1*8+3*8+1*0+3*1+1*2+3*3+1*4+3*5+1*6+3*7+1*8+3*9 = 8+24+0+3+2+9+4+15+6+21+8+27 = 127 → (10 - 127%10) %10 = (10-7)%10 = 3... let me use a known valid one
    // 4006381333931 is a valid EAN-13 (German barcode)
    expect(validateEAN13('4006381333931')).toBe(true);
  });

  it('잘못된 체크디짓 거부', () => {
    expect(validateEAN13('4006381333932')).toBe(false);
  });

  it('길이 부적합 거부', () => {
    expect(validateEAN13('12345')).toBe(false);
    expect(validateEAN13('12345678901234')).toBe(false);
  });

  it('비숫자 문자 거부', () => {
    expect(validateEAN13('400638133393a')).toBe(false);
    expect(validateEAN13('40063813339 1')).toBe(false);
  });

  it('빈 문자열 거부', () => {
    expect(validateEAN13('')).toBe(false);
  });
});

describe('validateEAN8', () => {
  it('유효한 EAN-8 바코드 통과', () => {
    // 96385074 — let me compute: 3*9+1*6+3*3+1*8+3*5+1*0+3*7 = 27+6+9+8+15+0+21 = 86 → (10-86%10)%10 = (10-6)%10 = 4
    expect(validateEAN8('96385074')).toBe(true);
  });

  it('잘못된 체크디짓 거부', () => {
    expect(validateEAN8('96385075')).toBe(false);
  });

  it('길이 부적합 거부', () => {
    expect(validateEAN8('1234567')).toBe(false);
    expect(validateEAN8('123456789')).toBe(false);
  });

  it('빈 문자열 거부', () => {
    expect(validateEAN8('')).toBe(false);
  });
});

describe('validateUPCA', () => {
  it('유효한 UPC-A 바코드 통과', () => {
    // 036000291452 — check digit calc: 3*0+1*3+3*6+1*0+3*0+1*0+3*2+1*9+3*1+1*4+3*5 = 0+3+18+0+0+0+6+9+3+4+15 = 58 → (10-58%10)%10 = (10-8)%10 = 2
    expect(validateUPCA('036000291452')).toBe(true);
  });

  it('잘못된 체크디짓 거부', () => {
    expect(validateUPCA('036000291453')).toBe(false);
  });

  it('길이 부적합 거부', () => {
    expect(validateUPCA('12345')).toBe(false);
    expect(validateUPCA('0123456789012')).toBe(false);
  });

  it('빈 문자열 거부', () => {
    expect(validateUPCA('')).toBe(false);
  });
});

// ─── 바코드 형식 감지 ───────────────────────────────────

describe('detectBarcodeFormat', () => {
  it('EAN-13 감지', () => {
    const result = detectBarcodeFormat('4006381333931');
    expect(result).toEqual({ value: '4006381333931', format: 'EAN13', isValid: true });
  });

  it('EAN-8 감지', () => {
    const result = detectBarcodeFormat('96385074');
    expect(result).toEqual({ value: '96385074', format: 'EAN8', isValid: true });
  });

  it('UPC-A 감지', () => {
    const result = detectBarcodeFormat('036000291452');
    expect(result).toEqual({ value: '036000291452', format: 'UPCA', isValid: true });
  });

  it('알 수 없는 형식', () => {
    const result = detectBarcodeFormat('12345');
    expect(result).toEqual({ value: '12345', format: 'UNKNOWN', isValid: false });
  });

  it('공백 제거', () => {
    const result = detectBarcodeFormat('4006 3813 33931');
    expect(result.value).toBe('4006381333931');
    expect(result.format).toBe('EAN13');
    expect(result.isValid).toBe(true);
  });

  it('빈 문자열', () => {
    const result = detectBarcodeFormat('');
    expect(result).toEqual({ value: '', format: 'UNKNOWN', isValid: false });
  });
});

// ─── 성분 파싱 ──────────────────────────────────────────

describe('parseIngredientsText', () => {
  it('쉼표 구분', () => {
    expect(parseIngredientsText('정제수, 글리세린, 나이아신아마이드')).toEqual([
      '정제수',
      '글리세린',
      '나이아신아마이드',
    ]);
  });

  it('세미콜론 구분', () => {
    expect(parseIngredientsText('정제수; 글리세린; 판테놀')).toEqual([
      '정제수',
      '글리세린',
      '판테놀',
    ]);
  });

  it('슬래시 구분', () => {
    expect(parseIngredientsText('정제수/글리세린/센텔라')).toEqual([
      '정제수',
      '글리세린',
      '센텔라',
    ]);
  });

  it('빈 항목 필터링', () => {
    expect(parseIngredientsText('정제수,,글리세린,')).toEqual(['정제수', '글리세린']);
  });

  it('공백 트리밍', () => {
    expect(parseIngredientsText('  정제수  ,  글리세린  ')).toEqual(['정제수', '글리세린']);
  });

  it('빈 문자열', () => {
    expect(parseIngredientsText('')).toEqual([]);
  });
});

// ─── 성분-피부타입 적합도 ────────────────────────────────

describe('checkIngredientForSkinType', () => {
  it('건성 피부에 좋은 성분', () => {
    expect(checkIngredientForSkinType('히알루론산', 'dry')).toBe('good');
    expect(checkIngredientForSkinType('세라마이드', 'dry')).toBe('good');
    expect(checkIngredientForSkinType('시어버터', 'dry')).toBe('good');
  });

  it('건성 피부에 주의 성분', () => {
    expect(checkIngredientForSkinType('알코올', 'dry')).toBe('caution');
    expect(checkIngredientForSkinType('살리실산', 'dry')).toBe('caution');
  });

  it('지성 피부에 좋은 성분', () => {
    expect(checkIngredientForSkinType('나이아신아마이드', 'oily')).toBe('good');
    expect(checkIngredientForSkinType('살리실산', 'oily')).toBe('good');
  });

  it('민감성 피부에 주의 성분', () => {
    expect(checkIngredientForSkinType('향료', 'sensitive')).toBe('caution');
    expect(checkIngredientForSkinType('파라벤', 'sensitive')).toBe('caution');
  });

  it('중립 성분 (목록에 없음)', () => {
    expect(checkIngredientForSkinType('토코페롤', 'dry')).toBe('neutral');
  });

  it('알 수 없는 피부 타입 → neutral', () => {
    expect(checkIngredientForSkinType('히알루론산', 'unknown_type')).toBe('neutral');
  });

  it('대소문자 무관', () => {
    expect(checkIngredientForSkinType('히알루론산 함유', 'dry')).toBe('good');
  });
});

describe('SKIN_TYPE_INGREDIENTS', () => {
  it('4가지 피부 타입 정의', () => {
    expect(Object.keys(SKIN_TYPE_INGREDIENTS)).toEqual(
      expect.arrayContaining(['dry', 'oily', 'sensitive', 'combination'])
    );
  });

  it('각 타입에 good/caution 배열 존재', () => {
    for (const skinType of Object.keys(SKIN_TYPE_INGREDIENTS)) {
      const guide = SKIN_TYPE_INGREDIENTS[skinType];
      expect(Array.isArray(guide.good)).toBe(true);
      expect(Array.isArray(guide.caution)).toBe(true);
      expect(guide.good.length).toBeGreaterThan(0);
      expect(guide.caution.length).toBeGreaterThan(0);
    }
  });
});

// ─── DB 연동 함수 (Supabase mock) ──────────────────────

describe('lookupProduct', () => {
  it('제품 발견 시 데이터 반환', async () => {
    const mockProduct = {
      id: 'p1',
      barcode: '4006381333931',
      name: '테스트 크림',
      brand: '테스트 브랜드',
      category: 'skincare',
      image_url: null,
      ingredients: ['정제수', '글리세린'],
    };

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockProduct, error: null }),
    } as any;

    const result = await lookupProduct(mockSupabase, '4006381333931');
    expect(result).toEqual(mockProduct);
    expect(mockSupabase.from).toHaveBeenCalledWith('products');
  });

  it('제품 미발견 시 null 반환', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    } as any;

    const result = await lookupProduct(mockSupabase, '0000000000000');
    expect(result).toBeNull();
  });
});

describe('searchProducts', () => {
  it('검색 결과 반환', async () => {
    const mockProducts = [
      { id: 'p1', barcode: '1', name: '크림 A', brand: null, category: null, image_url: null, ingredients: null },
    ];

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: mockProducts }),
    } as any;

    const result = await searchProducts(mockSupabase, '크림');
    expect(result).toEqual(mockProducts);
  });

  it('결과 없을 때 빈 배열 반환', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: null }),
    } as any;

    const result = await searchProducts(mockSupabase, '없는제품');
    expect(result).toEqual([]);
  });
});

describe('recordScan', () => {
  it('스캔 기록 저장', async () => {
    const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockSupabase = {
      from: jest.fn().mockReturnValue({ insert: insertMock }),
    } as any;

    await recordScan(mockSupabase, 'user_123', '4006381333931', '테스트 제품');
    expect(mockSupabase.from).toHaveBeenCalledWith('scan_history');
    expect(insertMock).toHaveBeenCalledWith({
      clerk_user_id: 'user_123',
      barcode: '4006381333931',
      product_name: '테스트 제품',
    });
  });
});

describe('getRecentScans', () => {
  it('최근 스캔 목록 반환', async () => {
    const mockScans = [
      { id: 's1', clerk_user_id: 'user_123', barcode: '123', product_name: '크림', scanned_at: '2026-03-04' },
    ];

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: mockScans }),
    } as any;

    const result = await getRecentScans(mockSupabase, 'user_123');
    expect(result).toEqual(mockScans);
  });

  it('스캔 기록 없을 때 빈 배열', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: null }),
    } as any;

    const result = await getRecentScans(mockSupabase, 'user_999');
    expect(result).toEqual([]);
  });
});
