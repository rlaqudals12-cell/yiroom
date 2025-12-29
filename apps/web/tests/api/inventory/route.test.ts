/**
 * 인벤토리 API 테스트
 * Phase I-2 - 내 인벤토리 시스템
 *
 * - GET /api/inventory - 아이템 목록 조회
 * - POST /api/inventory - 아이템 생성
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/inventory/route';
import { NextRequest } from 'next/server';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock 인벤토리 데이터
const mockItems = [
  {
    id: 'item-1',
    clerk_user_id: 'user-123',
    category: 'closet',
    sub_category: 'top',
    name: '흰색 티셔츠',
    image_url: '/images/items/tshirt.png',
    original_image_url: null,
    brand: 'ZARA',
    tags: ['캐주얼', '봄'],
    is_favorite: true,
    use_count: 5,
    last_used_at: '2025-12-20T10:00:00Z',
    expiry_date: null,
    metadata: { color: ['white'], season: ['spring', 'summer'] },
    created_at: '2025-12-01T10:00:00Z',
    updated_at: '2025-12-20T10:00:00Z',
  },
  {
    id: 'item-2',
    clerk_user_id: 'user-123',
    category: 'closet',
    sub_category: 'bottom',
    name: '네이비 슬랙스',
    image_url: '/images/items/slacks.png',
    original_image_url: null,
    brand: 'UNIQLO',
    tags: ['포멀', '사계절'],
    is_favorite: false,
    use_count: 10,
    last_used_at: '2025-12-25T10:00:00Z',
    expiry_date: null,
    metadata: { color: ['navy'], season: ['spring', 'summer', 'autumn', 'winter'] },
    created_at: '2025-12-01T09:00:00Z',
    updated_at: '2025-12-25T10:00:00Z',
  },
];

// Supabase mock builder 생성 (Promise-like 체이닝 지원)
const createMockSupabaseClient = (overrides: {
  selectData?: unknown[];
  selectError?: { message: string } | null;
  insertData?: unknown;
  insertError?: { message: string } | null;
} = {}) => {
  const {
    selectData = mockItems,
    selectError = null,
    insertData = mockItems[0],
    insertError = null,
  } = overrides;

  // Supabase 쿼리는 await 가능한 thenable 객체
  const createQueryBuilder = (data: unknown, error: unknown) => {
    const builder: Record<string, unknown> = {
      select: vi.fn(() => builder),
      insert: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      ilike: vi.fn(() => builder),
      contains: vi.fn(() => builder),
      overlaps: vi.fn(() => builder),
      order: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      range: vi.fn(() => builder),
      single: vi.fn().mockResolvedValue({ data: insertData, error: insertError }),
      // Promise-like: await query 지원
      then: (resolve: (val: { data: unknown; error: unknown }) => void) => {
        return Promise.resolve({ data, error }).then(resolve);
      },
    };
    return builder;
  };

  return {
    from: vi.fn(() => createQueryBuilder(selectData, selectError)),
  };
};

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

describe('Inventory API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/inventory', () => {
    it('returns 401 if not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as unknown as Awaited<ReturnType<typeof auth>>);

      const request = new NextRequest('http://localhost/api/inventory');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('returns inventory items list', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as unknown as Awaited<ReturnType<typeof auth>>);
      vi.mocked(createClerkSupabaseClient).mockReturnValue(
        createMockSupabaseClient() as unknown as ReturnType<typeof createClerkSupabaseClient>
      );

      const request = new NextRequest('http://localhost/api/inventory?category=closet');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.items).toBeDefined();
      expect(data.items.length).toBe(2);
    });

    it('filters by category', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as unknown as Awaited<ReturnType<typeof auth>>);

      const mockClient = createMockSupabaseClient();
      vi.mocked(createClerkSupabaseClient).mockReturnValue(
        mockClient as unknown as ReturnType<typeof createClerkSupabaseClient>
      );

      const request = new NextRequest('http://localhost/api/inventory?category=closet');
      await GET(request);

      expect(mockClient.from).toHaveBeenCalledWith('user_inventory');
    });

    it('filters by favorite', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as unknown as Awaited<ReturnType<typeof auth>>);

      const mockClient = createMockSupabaseClient({
        selectData: [mockItems[0]]
      });
      vi.mocked(createClerkSupabaseClient).mockReturnValue(
        mockClient as unknown as ReturnType<typeof createClerkSupabaseClient>
      );

      const request = new NextRequest('http://localhost/api/inventory?favorite=true');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.items.length).toBe(1);
    });

    it('returns 500 on database error', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as unknown as Awaited<ReturnType<typeof auth>>);
      vi.mocked(createClerkSupabaseClient).mockReturnValue(
        createMockSupabaseClient({ selectError: { message: 'DB error' } }) as unknown as ReturnType<typeof createClerkSupabaseClient>
      );

      const request = new NextRequest('http://localhost/api/inventory');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/inventory', () => {
    it('returns 401 if not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as unknown as Awaited<ReturnType<typeof auth>>);

      const request = new NextRequest('http://localhost/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          category: 'closet',
          name: '테스트 아이템',
          imageUrl: '/test.png',
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('returns 400 if required fields are missing', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as unknown as Awaited<ReturnType<typeof auth>>);

      const request = new NextRequest('http://localhost/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          name: '테스트 아이템',
          // category와 imageUrl 누락
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('required');
    });

    it('returns 400 if category is invalid', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as unknown as Awaited<ReturnType<typeof auth>>);

      const request = new NextRequest('http://localhost/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          category: 'invalid_category',
          name: '테스트 아이템',
          imageUrl: '/test.png',
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid category');
    });

    it('creates a new inventory item', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as unknown as Awaited<ReturnType<typeof auth>>);

      const newItem = {
        id: 'item-new',
        clerk_user_id: 'user-123',
        category: 'closet',
        sub_category: 'outer',
        name: '새 자켓',
        image_url: '/jacket.png',
        created_at: '2025-12-29T10:00:00Z',
      };

      vi.mocked(createClerkSupabaseClient).mockReturnValue(
        createMockSupabaseClient({ insertData: newItem }) as unknown as ReturnType<typeof createClerkSupabaseClient>
      );

      const request = new NextRequest('http://localhost/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          category: 'closet',
          subCategory: 'outer',
          name: '새 자켓',
          imageUrl: '/jacket.png',
          brand: 'TEST',
          tags: ['가을', '캐주얼'],
          metadata: { color: ['black'], season: ['autumn'] },
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.name).toBe('새 자켓');
    });

    it('returns 500 on database error', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as unknown as Awaited<ReturnType<typeof auth>>);
      vi.mocked(createClerkSupabaseClient).mockReturnValue(
        createMockSupabaseClient({ insertError: { message: 'Insert failed' } }) as unknown as ReturnType<typeof createClerkSupabaseClient>
      );

      const request = new NextRequest('http://localhost/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          category: 'closet',
          name: '테스트',
          imageUrl: '/test.png',
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
