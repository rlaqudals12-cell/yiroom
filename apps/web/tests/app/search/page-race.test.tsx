import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { cosmeticRequests, mockSupabase } = vi.hoisted(() => {
  const requests: Array<{
    filter: string;
    signal?: AbortSignal;
    resolve: (value: { data: unknown[]; error: null }) => void;
  }> = [];

  const client = {
    from: vi.fn((table: string) => {
      if (table !== 'cosmetic_products') {
        return {
          select: () => ({
            order: () => ({
              // eslint-disable-next-line sonarjs/no-nested-functions -- Supabase fluent builder를 실제 호출 순서대로 재현하는 테스트 mock
              limit: () => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }),
          }),
        };
      }

      let filter = '';
      const chain = {
        select: () => chain,
        eq: () => chain,
        or: (value: string) => {
          filter = value;
          return chain;
        },
        order: () => chain,
        limit: () => {
          let resolve!: (value: { data: unknown[]; error: null }) => void;
          const promise = new Promise<{ data: unknown[]; error: null }>((done) => {
            resolve = done;
          });
          const request: (typeof requests)[number] = { filter, resolve };
          requests.push(request);
          return {
            then: promise.then.bind(promise),
            abortSignal: (signal: AbortSignal) => {
              request.signal = signal;
              return promise;
            },
          };
        },
      };
      return chain;
    }),
  };

  return { cosmeticRequests: requests, mockSupabase: client };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));
vi.mock('@/lib/supabase/clerk-client', () => ({ useClerkSupabaseClient: () => mockSupabase }));
vi.mock('@/hooks/useDebounce', () => ({ useDebounce: (value: string) => value }));
vi.mock('@/hooks/useUrlTab', () => ({ useUrlTab: () => ['all', vi.fn()] }));
vi.mock('@/components/BottomNav', () => ({ BottomNav: () => null }));
vi.mock('@/components/animations', () => ({
  FadeInUp: ({ children }: React.PropsWithChildren) => children,
}));
vi.mock('@/components/common/ImageWithFallback', () => ({
  ImageWithFallback: ({ alt }: { alt: string }) => <span>{alt}</span>,
}));

import SearchPage from '@/app/(main)/search/page';

describe('SearchPage 요청 경합', () => {
  it('이전 검색을 중단하고 가장 최신 query의 결과만 반영한다', async () => {
    cosmeticRequests.length = 0;
    render(<SearchPage />);
    const input = screen.getByRole('combobox', { name: '검색어 입력' });

    fireEvent.change(input, { target: { value: '첫검색' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(cosmeticRequests).toHaveLength(1));

    fireEvent.change(input, { target: { value: '둘검색' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(cosmeticRequests).toHaveLength(2));

    expect(cosmeticRequests[0].signal?.aborted).toBe(true);
    expect(cosmeticRequests[1].signal?.aborted).toBe(false);

    await act(async () => {
      cosmeticRequests[1].resolve({
        data: [{ id: 'new', name: '최신 제품', brand: '이룸', image_url: null }],
        error: null,
      });
    });
    expect((await screen.findAllByText('최신 제품')).length).toBeGreaterThan(0);

    await act(async () => {
      cosmeticRequests[0].resolve({
        data: [{ id: 'old', name: '오래된 제품', brand: '이룸', image_url: null }],
        error: null,
      });
    });
    expect(screen.queryByText('오래된 제품')).not.toBeInTheDocument();
    expect(screen.getAllByText('최신 제품').length).toBeGreaterThan(0);
  });

  it('자동완성을 option으로 연결하고 화살표·Escape 키 상태를 알린다', async () => {
    cosmeticRequests.length = 0;
    render(<SearchPage />);
    const input = screen.getByRole('combobox', { name: '검색어 입력' });

    fireEvent.change(input, { target: { value: '레티' } });
    const options = await screen.findAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    expect(input).toHaveAttribute('aria-controls', 'search-suggestions');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
