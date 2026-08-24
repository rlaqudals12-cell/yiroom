import { renderHook, waitFor } from '@testing-library/react-native';

let selectedColumns = '';
const builder: Record<string, unknown> = {
  select: (columns: string) => {
    selectedColumns = columns;
    return builder;
  },
  not: () => builder,
  order: () => builder,
  limit: () => builder,
  maybeSingle: () =>
    Promise.resolve({
      data: {
        persona: { oneLine: '당신은 차분한 사람' },
        used_fallback: ['skin'],
      },
      error: null,
    }),
};

jest.mock('@clerk/clerk-expo', () => ({
  useUser: () => ({ user: { id: 'user-1' }, isLoaded: true }),
}));

jest.mock('../../lib/supabase', () => ({
  useClerkSupabaseClient: () => ({ from: () => builder }),
}));

import { useProfilePersona } from '../../hooks/useProfilePersona';

describe('useProfilePersona', () => {
  it('페르소나 문장과 통합 세션의 폴백 출처를 함께 보존한다', async () => {
    const { result } = renderHook(() => useProfilePersona());

    await waitFor(() => expect(result.current?.oneLine).toBe('당신은 차분한 사람'));

    expect(selectedColumns).toContain('used_fallback');
    expect(result.current?.usedFallback).toBe(true);
  });
});
