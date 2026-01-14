/**
 * 어필리에이트 클릭 트래킹 테스트
 * @description Clerk 통합 Supabase 클라이언트 패턴 테스트
 */

import {
  createAffiliateClick,
  getUserClickHistory,
} from '@/lib/affiliate/clicks';
import type { AffiliateClickInput } from '@/lib/affiliate/types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase 클라이언트 생성 헬퍼
const createMockSupabase = (overrides: Record<string, unknown> = {}) => {
  return {
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
      ...overrides,
    })),
  } as unknown as SupabaseClient;
};

describe('createAffiliateClick', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('클릭 기록을 성공적으로 생성해야 함', async () => {
    const mockId = 'click_123';
    const mockSupabase = {
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({ data: { id: mockId }, error: null })
            ),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const input: AffiliateClickInput = {
      productId: 'product_1',
      clerkUserId: 'user_1',
      sourcePage: 'home',
      sourceComponent: 'product-card',
      recommendationType: 'skin',
    };

    const result = await createAffiliateClick(mockSupabase, input);

    expect(result).toBe(mockId);
    expect(mockSupabase.from).toHaveBeenCalledWith('affiliate_clicks');
  });

  it('사용자 ID가 없어도 클릭을 기록해야 함', async () => {
    const mockId = 'click_456';
    const mockSupabase = {
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({ data: { id: mockId }, error: null })
            ),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const input: AffiliateClickInput = {
      productId: 'product_2',
      sourcePage: 'products',
    };

    const result = await createAffiliateClick(mockSupabase, input);
    expect(result).toBe(mockId);
  });

  it('데이터베이스 오류 시 null을 반환해야 함', async () => {
    const mockSupabase = {
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({ data: null, error: { message: 'DB error' } })
            ),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const input: AffiliateClickInput = {
      productId: 'product_4',
      sourcePage: 'search',
    };

    const result = await createAffiliateClick(mockSupabase, input);
    expect(result).toBe(null);
  });

  it('예외 발생 시 null을 반환하고 에러를 로그해야 함', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const mockSupabase = {
      from: jest.fn(() => ({
        insert: jest.fn(() => {
          throw new Error('Network error');
        }),
      })),
    } as unknown as SupabaseClient;

    const input: AffiliateClickInput = {
      productId: 'product_5',
      sourcePage: 'profile',
    };

    const result = await createAffiliateClick(mockSupabase, input);

    expect(result).toBe(null);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('recommendationType이 제대로 전달되어야 함', async () => {
    const mockId = 'click_789';
    const mockInsert = jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() =>
          Promise.resolve({ data: { id: mockId }, error: null })
        ),
      })),
    }));
    const mockSupabase = {
      from: jest.fn(() => ({
        insert: mockInsert,
      })),
    } as unknown as SupabaseClient;

    const input: AffiliateClickInput = {
      productId: 'product_3',
      clerkUserId: 'user_2',
      sourcePage: 'analysis',
      sourceComponent: 'recommendation-card',
      recommendationType: 'color',
    };

    await createAffiliateClick(mockSupabase, input);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        product_id: 'product_3',
        clerk_user_id: 'user_2',
        source_page: 'analysis',
        source_component: 'recommendation-card',
        recommendation_type: 'color',
      })
    );
  });
});

describe('getUserClickHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('사용자의 클릭 히스토리를 조회해야 함', async () => {
    const mockData = [
      { product_id: 'product_1', clicked_at: '2026-01-01T10:00:00Z' },
      { product_id: 'product_2', clicked_at: '2026-01-02T11:00:00Z' },
    ];

    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() =>
                Promise.resolve({ data: mockData, error: null })
              ),
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await getUserClickHistory(mockSupabase, 'user_1', 20);

    expect(result).toHaveLength(2);
    expect(result[0].productId).toBe('product_1');
    expect(result[0].clickedAt).toBeInstanceOf(Date);
  });

  it('데이터베이스 오류 시 빈 배열을 반환해야 함', async () => {
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() =>
                Promise.resolve({ data: null, error: { message: 'DB error' } })
              ),
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const result = await getUserClickHistory(mockSupabase, 'user_1');
    expect(result).toEqual([]);
  });

  it('예외 발생 시 빈 배열을 반환해야 함', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => {
          throw new Error('Connection error');
        }),
      })),
    } as unknown as SupabaseClient;

    const result = await getUserClickHistory(mockSupabase, 'user_1');

    expect(result).toEqual([]);
    consoleErrorSpy.mockRestore();
  });

  it('기본 limit 값 20을 사용해야 함', async () => {
    const mockLimit = jest.fn(() => Promise.resolve({ data: [], error: null }));
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: mockLimit,
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    await getUserClickHistory(mockSupabase, 'user_1');

    expect(mockLimit).toHaveBeenCalledWith(20);
  });

  it('커스텀 limit 값을 사용해야 함', async () => {
    const mockLimit = jest.fn(() => Promise.resolve({ data: [], error: null }));
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: mockLimit,
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    await getUserClickHistory(mockSupabase, 'user_1', 50);

    expect(mockLimit).toHaveBeenCalledWith(50);
  });
});
