/**
 * 어필리에이트 클릭 트래킹 테스트
 */

import { createAffiliateClick, getUserClickHistory } from '@/lib/affiliate/clicks';
import type { AffiliateClickInput } from '@/lib/affiliate/types';

// Supabase 모킹
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
      })),
    })),
  },
}));

describe('createAffiliateClick', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('클릭 기록을 성공적으로 생성해야 함', async () => {
    const { supabase } = require('@/lib/supabase');
    const mockId = 'click_123';

    supabase.from.mockReturnValue({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: mockId }, error: null })),
        })),
      })),
    });

    const input: AffiliateClickInput = {
      productId: 'product_1',
      clerkUserId: 'user_1',
      sourcePage: 'home',
      sourceComponent: 'product-card',
      recommendationType: 'skin',
    };

    const result = await createAffiliateClick(input);

    expect(result).toBe(mockId);
    expect(supabase.from).toHaveBeenCalledWith('affiliate_clicks');
  });

  it('사용자 ID가 없어도 클릭을 기록해야 함', async () => {
    const { supabase } = require('@/lib/supabase');
    const mockId = 'click_456';

    supabase.from.mockReturnValue({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: mockId }, error: null })),
        })),
      })),
    });

    const input: AffiliateClickInput = {
      productId: 'product_2',
      sourcePage: 'products',
    };

    const result = await createAffiliateClick(input);
    expect(result).toBe(mockId);
  });

  it('데이터베이스 오류 시 null을 반환해야 함', async () => {
    const { supabase } = require('@/lib/supabase');

    supabase.from.mockReturnValue({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({ data: null, error: { message: 'DB error' } })
          ),
        })),
      })),
    });

    const input: AffiliateClickInput = {
      productId: 'product_4',
      sourcePage: 'search',
    };

    const result = await createAffiliateClick(input);
    expect(result).toBe(null);
  });

  it('예외 발생 시 null을 반환하고 에러를 로그해야 함', async () => {
    const { supabase } = require('@/lib/supabase');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    supabase.from.mockReturnValue({
      insert: jest.fn(() => {
        throw new Error('Network error');
      }),
    });

    const input: AffiliateClickInput = {
      productId: 'product_5',
      sourcePage: 'profile',
    };

    const result = await createAffiliateClick(input);

    expect(result).toBe(null);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});

describe('getUserClickHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('사용자의 클릭 히스토리를 조회해야 함', async () => {
    const { supabase } = require('@/lib/supabase');

    const mockData = [
      { product_id: 'product_1', clicked_at: '2026-01-01T10:00:00Z' },
      { product_id: 'product_2', clicked_at: '2026-01-02T11:00:00Z' },
    ];

    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
          })),
        })),
      })),
    });

    const result = await getUserClickHistory('user_1', 20);

    expect(result).toHaveLength(2);
    expect(result[0].productId).toBe('product_1');
  });

  it('데이터베이스 오류 시 빈 배열을 반환해야 함', async () => {
    const { supabase } = require('@/lib/supabase');

    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() =>
              Promise.resolve({ data: null, error: { message: 'DB error' } })
            ),
          })),
        })),
      })),
    });

    const result = await getUserClickHistory('user_1');
    expect(result).toEqual([]);
  });

  it('예외 발생 시 빈 배열을 반환해야 함', async () => {
    const { supabase } = require('@/lib/supabase');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    supabase.from.mockReturnValue({
      select: jest.fn(() => {
        throw new Error('Connection error');
      }),
    });

    const result = await getUserClickHistory('user_1');

    expect(result).toEqual([]);
    consoleErrorSpy.mockRestore();
  });
});
