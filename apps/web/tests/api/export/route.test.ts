/**
 * 데이터 내보내기 API 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/export/route';

// Clerk auth 모킹
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Supabase 모킹
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  })),
}));

describe('GET /api/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 체인 모킹 설정
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({
      limit: mockLimit,
      then: vi.fn().mockResolvedValue({ data: [] }),
    });
    mockLimit.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockMaybeSingle.mockResolvedValue({ data: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return export data with correct headers', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValue({ userId: 'test-user-id' } as never);

    // Promise.all을 위한 모킹 - 실제 구현과 맞게 수정
    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    vi.mocked(createClerkSupabaseClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              })),
              then: vi.fn((resolve) => resolve({ data: [] })),
            })),
          })),
        })),
      })),
    } as never);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');

    const contentDisposition = response.headers.get('Content-Disposition');
    expect(contentDisposition).toContain('attachment');
    expect(contentDisposition).toContain('yiroom-data-');
    expect(contentDisposition).toContain('.json');
  });

  it('should include exportedAt timestamp', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValue({ userId: 'test-user-id' } as never);

    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    vi.mocked(createClerkSupabaseClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              })),
              then: vi.fn((resolve) => resolve({ data: [] })),
            })),
          })),
        })),
      })),
    } as never);

    const response = await GET();
    const data = await response.json();

    expect(data.exportedAt).toBeDefined();
    expect(new Date(data.exportedAt).getTime()).not.toBeNaN();
  });

  it('should include user clerkUserId', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockResolvedValue({ userId: 'test-user-123' } as never);

    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    vi.mocked(createClerkSupabaseClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              })),
              then: vi.fn((resolve) => resolve({ data: [] })),
            })),
          })),
        })),
      })),
    } as never);

    const response = await GET();
    const data = await response.json();

    expect(data.user.clerkUserId).toBe('test-user-123');
  });
});
