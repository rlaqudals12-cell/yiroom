/**
 * 오늘의 코디 — 퍼스널컬러 시즌 라벨 한국어화 회귀 테스트
 *
 * 배경: 진단 코드값('Autumn')이 화면 배지에 그대로 노출되고, 저장되는 코디
 * 설명에도 원시 영문값이 그대로 영속됐다(한 번 저장되면 나중에 고치기 어렵다).
 * 스코어링은 코드값을 유지하고, 표시·저장 문구만 라벨('가을 웜톤')로 바꾼다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

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
    sub_category: '티셔츠',
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
    sub_category: '슬랙스',
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

// 퍼스널컬러는 DB 표기 그대로(대문자 코드값)를 돌려준다 — 화면·저장에서만 라벨이어야 한다
const PC_ROW = { season: 'Autumn', best_colors: [], image_analysis: null };

/** 테이블별 터미널 결과 — 조회하지 않는 테이블은 결과 없음(null) */
const TABLE_RESULTS: Record<string, { data: unknown; error: null }> = {
  user_inventory: { data: ITEM_ROWS, error: null },
  personal_color_assessments: { data: PC_ROW, error: null },
};

function makeQuery(table: string) {
  const result = TABLE_RESULTS[table] ?? { data: null, error: null };
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

function mockFetch() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith('/api/inventory/outfits') && (!init || init.method !== 'POST')) {
      return { ok: true, json: async () => ({ outfits: [] }) } as Response;
    }
    return { ok: true, json: async () => ({ success: true }) } as Response;
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe('오늘의 코디 — 시즌 라벨 한국어화', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('퍼스널컬러 배지를 한국어 라벨로 표시한다', async () => {
    mockFetch();
    render(<ClosetRecommendPage />);

    expect(await screen.findByText('가을 웜톤')).toBeInTheDocument();
    // 원시 코드값이 화면 어디에도 새어나가지 않는다
    expect(document.body.textContent).not.toContain('Autumn');
  });

  it('저장되는 코디 설명에 원시 코드값 대신 라벨을 영속한다', async () => {
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
    const body = JSON.parse(String(postCall?.[1]?.body)) as { description: string };

    expect(body.description).toContain('가을 웜톤');
    expect(body.description).not.toContain('Autumn');
  });
});
