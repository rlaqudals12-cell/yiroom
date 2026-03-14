/**
 * 성분 분석 시스템 테스트
 *
 * @module tests/lib/ingredients
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted를 사용하여 mock을 먼저 정의
const { mockSupabaseClient, mockSingle, mockOrder } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockOrder = vi.fn();

  const client = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
    not: vi.fn(),
    gte: vi.fn(),
    limit: vi.fn(),
    single: mockSingle,
    order: mockOrder,
  };

  // 체인 설정
  client.from.mockReturnValue(client);
  client.select.mockReturnValue(client);
  client.eq.mockReturnValue(client);
  client.or.mockReturnValue(client);
  client.not.mockReturnValue(client);
  client.gte.mockReturnValue(client);
  client.limit.mockReturnValue(client);

  return { mockSupabaseClient: client, mockSingle, mockOrder };
});

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => mockSupabaseClient,
}));

vi.mock('@/lib/gemini/client', () => ({
  generateContent: vi.fn(),
  isGeminiAvailable: vi.fn().mockReturnValue(false),
  parseJsonResponse: vi.fn(),
}));

vi.mock('@/lib/utils/logger', () => ({
  productLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  analyzeIngredients,
  getWarningIngredientsForSkinType,
  getIngredientsByEWGGrade,
  getAllIngredients,
} from '@/lib/ingredients';

// ============================================================================
// 테스트 데이터
// ============================================================================

const mockDBIngredient = {
  id: 'ing_001',
  name_ko: '소듐라우릴설페이트',
  name_en: 'Sodium Lauryl Sulfate',
  aliases: ['SLS'],
  ewg_grade: 7,
  warning_dry: 4,
  warning_oily: 2,
  warning_sensitive: 5,
  warning_combination: 3,
  category: '계면활성제',
  description: '강력한 세정 성분',
  side_effects: '피부 자극 및 건조함 유발 가능',
  alternatives: ['소듐라우레스설페이트', '코코베타인'],
};

const mockSafeIngredient = {
  id: 'ing_002',
  name_ko: '히알루론산',
  name_en: 'Hyaluronic Acid',
  aliases: ['HA'],
  ewg_grade: 1,
  warning_dry: 0,
  warning_oily: 1,
  warning_sensitive: 0,
  warning_combination: 0,
  category: '보습제',
  description: '수분 보유 성분',
  side_effects: null,
  alternatives: null,
};

// ============================================================================
// 테스트
// ============================================================================

describe('ingredients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본: DB 검색 결과 없음
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockSupabaseClient.not.mockResolvedValue({ data: [], error: null });
  });

  // ========================================================================
  // analyzeIngredients
  // ========================================================================

  describe('analyzeIngredients', () => {
    it('빈 성분 목록에 빈 배열을 반환한다', async () => {
      const result = await analyzeIngredients([], 'normal');

      expect(result).toEqual([]);
    });

    it('빈 문자열 성분을 스킵한다', async () => {
      const result = await analyzeIngredients(['', '  '], 'normal');

      expect(result).toEqual([]);
    });

    it('DB에서 경고 성분을 찾아 반환한다', async () => {
      // 정확매칭에서 찾음
      mockSingle.mockResolvedValueOnce({ data: mockDBIngredient, error: null });

      const result = await analyzeIngredients(['소듐라우릴설페이트'], 'dry');

      expect(result).toHaveLength(1);
      expect(result[0].ingredient).toBe('소듐라우릴설페이트');
      expect(result[0].level).toBe('high'); // warning_dry=4 -> high
      expect(result[0].source).toBe('db');
    });

    it('경고 레벨 2 미만인 성분은 반환하지 않는다', async () => {
      // 히알루론산: warning_dry=0
      mockSingle.mockResolvedValueOnce({ data: mockSafeIngredient, error: null });

      const result = await analyzeIngredients(['히알루론산'], 'dry');

      expect(result).toHaveLength(0);
    });

    it('결과를 위험도 높은 순으로 정렬한다', async () => {
      // 두 성분 모두 정확매칭
      const highWarning = { ...mockDBIngredient, warning_dry: 5 };
      const medWarning = {
        ...mockDBIngredient,
        id: 'ing_003',
        name_ko: '파라벤',
        warning_dry: 3,
        ewg_grade: 5,
      };

      mockSingle
        .mockResolvedValueOnce({ data: medWarning, error: null })
        .mockResolvedValueOnce({ data: highWarning, error: null });

      const result = await analyzeIngredients(['파라벤', '소듐라우릴설페이트'], 'dry');

      expect(result.length).toBeGreaterThanOrEqual(1);
      if (result.length >= 2) {
        // high가 먼저
        const levels = result.map((r) => r.level);
        expect(levels[0]).toBe('high');
      }
    });

    it('피부 타입 normal은 평균 경고 레벨을 사용한다', async () => {
      // warning_dry=4, oily=2, sensitive=5, combination=3 -> avg=3.5 -> round=4 -> high
      mockSingle.mockResolvedValueOnce({ data: mockDBIngredient, error: null });

      const result = await analyzeIngredients(['소듐라우릴설페이트'], 'normal');

      expect(result).toHaveLength(1);
      // 평균 (4+2+5+3)/4 = 3.5 -> 반올림 4 -> high
      expect(result[0].level).toBe('high');
    });
  });

  // ========================================================================
  // getWarningIngredientsForSkinType
  // ========================================================================

  describe('getWarningIngredientsForSkinType', () => {
    it('특정 피부 타입의 경고 성분을 반환한다', async () => {
      mockOrder.mockResolvedValue({ data: [mockDBIngredient], error: null });

      const result = await getWarningIngredientsForSkinType('sensitive');

      expect(result).toHaveLength(1);
      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('warning_sensitive', 3);
    });

    it('normal 피부 타입은 warning_sensitive 기준을 사용한다', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await getWarningIngredientsForSkinType('normal');

      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('warning_sensitive', 3);
    });

    it('에러 시 빈 배열을 반환한다', async () => {
      mockOrder.mockResolvedValue({ data: null, error: { message: 'error' } });

      const result = await getWarningIngredientsForSkinType('dry');

      expect(result).toEqual([]);
    });
  });

  // ========================================================================
  // getIngredientsByEWGGrade
  // ========================================================================

  describe('getIngredientsByEWGGrade', () => {
    it('기본 등급 7 이상 성분을 반환한다', async () => {
      mockOrder.mockResolvedValue({ data: [mockDBIngredient], error: null });

      const result = await getIngredientsByEWGGrade();

      expect(result).toHaveLength(1);
      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('ewg_grade', 7);
    });

    it('커스텀 최소 등급으로 조회한다', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await getIngredientsByEWGGrade(5);

      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('ewg_grade', 5);
    });

    it('에러 시 빈 배열을 반환한다', async () => {
      mockOrder.mockResolvedValue({ data: null, error: { message: 'error' } });

      const result = await getIngredientsByEWGGrade();

      expect(result).toEqual([]);
    });
  });

  // ========================================================================
  // getAllIngredients
  // ========================================================================

  describe('getAllIngredients', () => {
    it('모든 활성 성분을 반환한다', async () => {
      mockOrder.mockResolvedValue({
        data: [mockDBIngredient, mockSafeIngredient],
        error: null,
      });

      const result = await getAllIngredients();

      expect(result).toHaveLength(2);
    });

    it('에러 시 빈 배열을 반환한다', async () => {
      mockOrder.mockResolvedValue({ data: null, error: { message: 'error' } });

      const result = await getAllIngredients();

      expect(result).toEqual([]);
    });

    it('data가 null이면 빈 배열을 반환한다', async () => {
      mockOrder.mockResolvedValue({ data: null, error: null });

      const result = await getAllIngredients();

      expect(result).toEqual([]);
    });
  });
});
