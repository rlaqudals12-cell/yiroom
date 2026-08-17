/**
 * 코디 만들기·수정 화면 회귀 가드 (2026-08 외부 리뷰 수리)
 *
 * 실측된 결함 2종:
 * 1) `<SelectItem value="">`(선택 안함)이 Radix 불변식을 깨서 상세 단계 렌더가 통째로 throw했다.
 *    ("A <Select.Item /> must have a value prop that is not an empty string." — 로컬 실행 확인)
 * 2) 저장이 클라이언트 직접 INSERT라 clerk_user_id가 비었고(NOT NULL·RLS INSERT 정책),
 *    코디는 한 건도 저장될 수 없었다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn() }),
  useParams: () => ({ id: 'outfit-1' }),
}));

const ITEM_ROWS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    clerk_user_id: 'user-1',
    category: 'closet',
    sub_category: 'top',
    name: '화이트 셔츠',
    image_url: '/top.png',
    original_image_url: null,
    brand: null,
    tags: [],
    is_favorite: false,
    use_count: 0,
    last_used_at: null,
    expiry_date: null,
    metadata: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const OUTFIT_ROW = {
  id: 'outfit-1',
  clerk_user_id: 'user-1',
  name: '봄 데이트룩',
  description: null,
  item_ids: [ITEM_ROWS[0].id],
  season: ['spring'],
  occasion: 'date',
  wear_count: 0,
  last_worn_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

/** supabase 체이너블 스텁 — user_inventory 목록 / saved_outfits 단건만 돌려준다 */
function makeQuery(table: string) {
  const result =
    table === 'saved_outfits'
      ? { data: OUTFIT_ROW, error: null }
      : { data: ITEM_ROWS, error: null };

  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  for (const method of ['select', 'eq', 'order', 'in', 'limit', 'contains']) {
    builder[method] = vi.fn(chain);
  }
  builder.single = vi.fn(async () => result);
  builder.then = (onFulfilled: (v: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled);
  return builder;
}

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({ from: vi.fn((table: string) => makeQuery(table)) }),
}));

vi.mock('@/lib/inventory/image-url', () => ({
  resolveInventoryImageUrl: (value: string | null) => value,
  signInventoryImagePaths: async () => new Map(),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

// 아이템 선택 UI(슬롯 + 시트)는 이 테스트의 대상이 아니다 — 선택 결과만 페이지로 넘긴다
vi.mock('@/components/inventory', () => ({
  OutfitBuilder: ({
    items,
    onComplete,
  }: {
    items: Array<{ id: string }>;
    onComplete: (items: Array<{ id: string }>) => void;
  }) => (
    <button type="button" data-testid="stub-select-items" onClick={() => onComplete(items)}>
      아이템 선택 완료
    </button>
  ),
  CollageView: () => <div data-testid="stub-collage" />,
}));

import NewOutfitPage from '@/app/(main)/closet/outfits/new/page';
import EditOutfitPage from '@/app/(main)/closet/outfits/[id]/edit/page';

function mockFetch(ok = true) {
  const fetchMock = vi.fn(async () => ({
    ok,
    status: ok ? 200 : 500,
    json: async () => ({ success: ok }),
  }));
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

/** 아이템을 고르고 상세 단계까지 진행 */
async function goToDetails() {
  fireEvent.click(await screen.findByTestId('stub-select-items'));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('새 코디 만들기', () => {
  it('상세 단계가 Radix 불변식 위반 없이 렌더된다 (빈 문자열 SelectItem 폐지)', async () => {
    mockFetch();
    render(<NewOutfitPage />);

    await goToDetails();

    // 상세 단계가 살아 있으면 상황 선택이 보인다 (예전엔 렌더 중 throw)
    expect(await screen.findByTestId('occasion-select')).toBeInTheDocument();
    expect(screen.getByText('코디 저장하기')).toBeInTheDocument();
  });

  it('저장을 API로 보낸다 (clerk_user_id를 채울 수 없는 직접 INSERT 폐지)', async () => {
    const fetchMock = mockFetch();
    render(<NewOutfitPage />);

    await goToDetails();
    fireEvent.click(await screen.findByText('코디 저장하기'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/inventory/outfits');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body)).itemIds).toEqual([ITEM_ROWS[0].id]);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/closet/outfits'));
  });

  it('저장 실패를 화면에서 알린다', async () => {
    mockFetch(false);
    render(<NewOutfitPage />);

    await goToDetails();
    fireEvent.click(await screen.findByText('코디 저장하기'));

    expect(await screen.findByTestId('outfit-save-error')).toHaveTextContent(
      '코디를 저장하지 못했어요'
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});

describe('코디 수정', () => {
  it('상세 단계가 렌더되고 저장이 API(PUT)로 나간다', async () => {
    const fetchMock = mockFetch();
    render(<EditOutfitPage />);

    expect(await screen.findByTestId('occasion-select')).toBeInTheDocument();

    fireEvent.click(screen.getByText('저장하기'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/inventory/outfits/outfit-1');
    expect(init.method).toBe('PUT');
  });

  it('삭제도 API로 나가고, 실패를 조용히 삼키지 않는다', async () => {
    const fetchMock = mockFetch(false);
    render(<EditOutfitPage />);

    await screen.findByTestId('occasion-select');
    fireEvent.click(screen.getByLabelText('코디 삭제'));
    fireEvent.click(await screen.findByText('삭제'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/inventory/outfits/outfit-1');
    expect(init.method).toBe('DELETE');

    // 예전 구현은 error를 확인만 하고 아무 안내 없이 화면에 머물렀다
    expect(await screen.findByTestId('outfit-action-error')).toHaveTextContent(
      '코디를 삭제하지 못했어요'
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});
