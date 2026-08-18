import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockFrom, state, stableSupabase } = vi.hoisted(() => {
  const from = vi.fn();
  return {
    mockFrom: from,
    state: {
      personalColor: null as {
        season: string;
        undertone: string | null;
        best_colors: unknown;
      } | null,
    },
    stableSupabase: { from },
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ isLoaded: true, user: { id: 'user-1' } }),
}));
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => stableSupabase,
}));
vi.mock('@/components/animations', () => ({
  FadeInUp: ({ children }: React.PropsWithChildren) => children,
}));
vi.mock('@/components/style/StylePreferenceChips', () => ({
  StylePreferenceChips: () => null,
}));
vi.mock('@/components/style/MaterialFavoriteFilter', () => ({
  MaterialFavoriteFilter: () => null,
}));

function makeQuery(result: { data: unknown; error: null }) {
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'order', 'limit']) {
    query[method] = vi.fn(() => query);
  }
  query.maybeSingle = vi.fn().mockResolvedValue(result);
  query.then = (resolve: (value: unknown) => void) => Promise.resolve(result).then(resolve);
  return query;
}

import StylePage from '@/app/(main)/style/page';

describe('StylePage 통합 퍼스널컬러 팔레트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.personalColor = null;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'personal_color_assessments') {
        return makeQuery({ data: state.personalColor, error: null });
      }
      if (table === 'user_inventory') return makeQuery({ data: [], error: null });
      return makeQuery({ data: null, error: null });
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ hasMeasurements: true }),
      })
    );
  });

  it('string[] best_colors를 회색 폴백 대신 저장된 hex 팔레트로 표시한다', async () => {
    state.personalColor = {
      season: 'Autumn',
      undertone: 'warm',
      best_colors: ['#112233', '#AABBCC'],
    };

    render(<StylePage />);

    expect(await screen.findByLabelText('#112233')).toHaveStyle({ backgroundColor: '#112233' });
    expect(screen.getByLabelText('#AABBCC')).toHaveStyle({ backgroundColor: '#AABBCC' });
    expect(screen.queryByLabelText('#CCCCCC')).not.toBeInTheDocument();
  });
});
