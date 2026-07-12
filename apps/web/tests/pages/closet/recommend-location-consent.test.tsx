/**
 * 옷장 추천 위치 동의 테스트 (위치정보보호법 컴플라이언스)
 * @description 법적 지적: 코디 추천 페이지가 페이지 로드만으로 navigator.geolocation로
 *   정밀 GPS를 요청해 제3자(open-meteo)에 전송하고, 브라우저 권한 프롬프트에만 의존했다.
 *   → 앱 내 명시적 동의 + 목적 고지 후에만 위치를 사용해야 한다.
 *   검증: (1) 마운트 시 자동 요청 금지 (2) 버튼 클릭 시에만 요청 + 동의 플래그 저장
 *   (3) 좌표는 저장하지 않음(동의 플래그만) (4) 이전 동의자는 자동 반영.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const { mockSupabaseFrom, stableClient } = vi.hoisted(() => {
  const from = vi.fn();
  return { mockSupabaseFrom: from, stableClient: { from } };
});

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => stableClient,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

const { getWeatherWithGeolocation } = vi.hoisted(() => ({
  getWeatherWithGeolocation: vi.fn(),
}));
vi.mock('@/lib/weather', () => ({ getWeatherWithGeolocation }));

import ClosetRecommendPage from '@/app/(main)/closet/recommend/page';

type QueryResult = { data: unknown; error: unknown };

// 날씨 카드는 옷이 있는 기존 추천 뷰에서만 렌더되므로 옷 1벌을 넣는다.
const closetItem = {
  id: 'item-1',
  clerk_user_id: 'u1',
  category: 'closet',
  sub_category: 'top',
  name: '흰 셔츠',
  image_url: null,
  original_image_url: null,
  brand: null,
  tags: [],
  is_favorite: false,
  use_count: 0,
  last_used_at: null,
  expiry_date: null,
  metadata: { color: ['#FFFFFF'], season: [], occasion: [] },
  created_at: '2026-07-01T00:00:00Z',
  updated_at: '2026-07-01T00:00:00Z',
};

const state: { inventory: QueryResult } = { inventory: { data: [closetItem], error: null } };

function makeChain(getResult: () => QueryResult) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(async () => getResult()),
    then: (onF: (v: QueryResult) => unknown, onR?: (e: unknown) => unknown) =>
      Promise.resolve(getResult()).then(onF, onR),
  };
  return chain;
}

describe('ClosetRecommendPage 위치 동의(위치정보보호법)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getWeatherWithGeolocation.mockResolvedValue({
      temp: 20,
      precipitation: 0,
      condition: '맑음',
      uvIndex: 3,
      humidity: 50,
    });
    state.inventory = { data: [closetItem], error: null };
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'user_inventory') return makeChain(() => state.inventory);
      return makeChain(() => ({ data: null, error: null }));
    });
  });

  it('마운트만으로는 위치를 자동 요청하지 않고, 목적 고지가 있는 동의 컨트롤을 노출한다', async () => {
    render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(screen.getByTestId('occasion-chips')).toBeInTheDocument();
    });

    // 핵심(재발 방지): 페이지 로드만으로 geolocation 자동 요청 금지
    expect(getWeatherWithGeolocation).not.toHaveBeenCalled();

    // 앱 내 명시적 동의 컨트롤 + 목적 고지
    expect(screen.getByTestId('location-consent')).toBeInTheDocument();
    expect(
      screen.getByText(/현재 위치를 일시적으로 사용해요\. 저장하지 않아요\./)
    ).toBeInTheDocument();
    expect(screen.getByTestId('location-consent-button')).toBeInTheDocument();
  });

  it('동의 버튼을 눌러야만 위치를 요청하고, 좌표가 아닌 동의 플래그만 저장한다', async () => {
    render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(screen.getByTestId('location-consent-button')).toBeInTheDocument();
    });
    expect(getWeatherWithGeolocation).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('location-consent-button'));

    await waitFor(() => {
      expect(getWeatherWithGeolocation).toHaveBeenCalledTimes(1);
    });

    // 저장되는 것은 동의 여부 플래그뿐 — 좌표(위/경도)는 저장하지 않는다
    expect(localStorage.getItem('location_consent')).toBe('granted');
    expect(localStorage.length).toBe(1);

    // 위치 반영 후 동의 컨트롤은 사라진다
    await waitFor(() => {
      expect(screen.queryByTestId('location-consent')).not.toBeInTheDocument();
    });
  });

  it('이전에 앱 내 동의한 사용자는 다시 묻지 않고 자동 반영한다', async () => {
    localStorage.setItem('location_consent', 'granted');

    render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(getWeatherWithGeolocation).toHaveBeenCalledTimes(1);
    });
    // 저장된 것은 동의 플래그뿐(좌표 없음)
    expect(localStorage.getItem('location_consent')).toBe('granted');
    expect(localStorage.length).toBe(1);
  });
});
