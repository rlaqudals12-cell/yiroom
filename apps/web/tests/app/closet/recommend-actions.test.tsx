/**
 * 오늘의 코디 — 저장·착용 기록 배선 테스트
 *
 * 배경: 추천 화면에 저장/"입었어요"가 없어 추천이 기록으로 남지 않았다(피드백 루프 0).
 * 여기서는 저장 API 호출·중복 저장 차단·착용 기록(PATCH recordUsage)을 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('lucide-react', () => {
  const Icon = ({ className }: { className?: string }) => <span className={className} />;
  return {
    ArrowLeft: Icon,
    RefreshCw: Icon,
    Thermometer: Icon,
    ChevronRight: Icon,
    Images: Icon,
    MapPin: Icon,
    Bookmark: Icon,
    Check: Icon,
  };
});

// 날씨는 외부 호출 — 계절 추정 폴백 경로로 고정
vi.mock('@/lib/weather', () => ({
  getWeatherWithGeolocation: vi.fn(async () => null),
  RAIN_THRESHOLD_MM: 0.1,
}));

const ITEM_ROWS = [
  {
    id: 'top-1',
    clerk_user_id: 'user-1',
    category: 'closet',
    sub_category: 'top',
    name: '화이트 블라우스',
    image_url: '',
    original_image_url: null,
    brand: null,
    tags: [],
    is_favorite: false,
    use_count: 0,
    last_used_at: null,
    expiry_date: null,
    metadata: { color: ['화이트'], season: [], occasion: [] },
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'bottom-1',
    clerk_user_id: 'user-1',
    category: 'closet',
    sub_category: 'bottom',
    name: '네이비 슬랙스',
    image_url: '',
    original_image_url: null,
    brand: null,
    tags: [],
    is_favorite: false,
    use_count: 0,
    last_used_at: null,
    expiry_date: null,
    metadata: { color: ['네이비'], season: [], occasion: [] },
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
  },
];

// Supabase 체인 mock — 테이블별 터미널 결과만 다르게 준다
function makeQuery(table: string) {
  const result =
    table === 'user_inventory' ? { data: ITEM_ROWS, error: null } : { data: null, error: null };
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'order', 'limit']) {
    query[method] = vi.fn(() => query);
  }
  query.single = vi.fn(() => Promise.resolve(result));
  query.then = (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve);
  return query;
}

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({ from: vi.fn((table: string) => makeQuery(table)) }),
}));

import ClosetRecommendPage from '@/app/(main)/closet/recommend/page';

/** fetch mock — 저장된 코디 목록만 시나리오별로 바꾼다 */
function mockFetch(savedOutfits: Array<{ itemIds: string[] }> = []) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith('/api/inventory/outfits') && (!init || init.method !== 'POST')) {
      return { ok: true, json: async () => ({ outfits: savedOutfits }) } as Response;
    }
    return { ok: true, json: async () => ({ success: true }) } as Response;
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe('오늘의 코디 — 저장·착용 기록', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('"이 코디 저장"이 코디 저장 API를 호출한다', async () => {
    const fetchMock = mockFetch();
    render(<ClosetRecommendPage />);

    const saveButton = await screen.findByTestId('outfit-save-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('outfit-action-message')).toHaveTextContent('내 코디에 저장했어요');
    });

    const postCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url) === '/api/inventory/outfits' && init?.method === 'POST'
    );
    expect(postCall).toBeDefined();
    const body = JSON.parse(String(postCall?.[1]?.body)) as { itemIds: string[] };
    expect(body.itemIds).toEqual(['top-1', 'bottom-1']);
  });

  it('같은 조합이 이미 저장돼 있으면 안내하고 저장하지 않는다', async () => {
    const fetchMock = mockFetch([{ itemIds: ['bottom-1', 'top-1'] }]);
    render(<ClosetRecommendPage />);

    const saveButton = await screen.findByTestId('outfit-save-button');
    await waitFor(() => expect(saveButton).toHaveTextContent('저장됨'));

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('outfit-action-message')).toHaveTextContent('이미 저장된 코디예요');
    });
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('"오늘 입었어요"가 구성 아이템마다 착용 기록을 남긴다', async () => {
    const fetchMock = mockFetch();
    render(<ClosetRecommendPage />);

    const wearButton = await screen.findByTestId('outfit-wear-button');
    fireEvent.click(wearButton);

    await waitFor(() => {
      expect(screen.getByTestId('outfit-action-message')).toHaveTextContent(
        '오늘 입은 옷으로 기록했어요'
      );
    });

    const patchCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'PATCH');
    expect(patchCalls.map(([url]) => String(url))).toEqual([
      '/api/inventory/top-1',
      '/api/inventory/bottom-1',
    ]);
    for (const [, init] of patchCalls) {
      expect(JSON.parse(String(init?.body))).toEqual({ action: 'recordUsage' });
    }
  });
});
