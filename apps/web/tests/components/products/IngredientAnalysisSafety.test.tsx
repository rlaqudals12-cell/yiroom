import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CosmeticIngredient } from '@/types/ingredient';
import { IngredientAnalysisSection } from '@/components/products/ingredients/IngredientAnalysisSection';

const mockGetProductIngredients = vi.fn();

vi.mock('@/lib/supabase/clerk-client', () => ({
  ...(() => {
    const stableClient = { from: vi.fn() };
    return { useClerkSupabaseClient: () => stableClient };
  })(),
}));

vi.mock('@/lib/products/repositories/ingredients', () => ({
  getProductIngredients: (...args: unknown[]) => mockGetProductIngredients(...args),
  analyzeProductIngredients: vi.fn().mockResolvedValue(null),
  getFunctionCounts: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/products/services/ingredient-analysis', () => ({
  analyzeIngredientsWithAI: vi.fn().mockResolvedValue(null),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const RETINOL = {
  id: 'retinol-id',
  nameKo: '레티놀',
  nameEn: 'Retinol',
  nameInci: 'retinol',
  category: 'other',
  functions: [],
  isCaution20: false,
  isAllergen: false,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
} satisfies CosmeticIngredient;

describe('IngredientAnalysisSection personal safety wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProductIngredients.mockResolvedValue([RETINOL]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          productId: 'product-1',
          alerts: [
            {
              ingredient: 'retinol',
              reason: '이소트레티노인 복용 중 병용 전 처방 의료인과 상의해주세요.',
              action: 'WARN',
            },
          ],
          disclaimer: '일반 참고 정보예요.',
        },
      }),
    }) as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('전체 성분의 INCI명을 /api/safety/check로 보내고 경고를 렌더한다', async () => {
    render(<IngredientAnalysisSection productId="product-1" />);

    await waitFor(() => expect(screen.getByTestId('personal-safety-warning')).toBeInTheDocument());
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/safety/check',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1', ingredients: ['retinol'] }),
      })
    );
    expect(screen.getByText(/처방 의료인과 상의해주세요/)).toBeInTheDocument();
  });
});
