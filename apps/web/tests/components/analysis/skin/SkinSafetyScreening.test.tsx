import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SkinSafetyScreening } from '@/components/analysis/skin/SkinSafetyScreening';

describe('SkinSafetyScreening', () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(async (_input, init) => {
      if (init?.method === 'PUT') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { conditions: [], medications: [], consentGiven: true },
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            conditions: ['atopy'],
            medications: ['antihistamine'],
            consentGiven: false,
          },
        }),
      } as Response;
    }) as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('두 안전 문항과 선택 동의·나중에 입력을 촬영 전에 표시한다', async () => {
    render(<SkinSafetyScreening onComplete={onComplete} />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/safety/profile'));

    expect(screen.getByText('현재 임신 중이거나 수유 중인가요?')).toBeInTheDocument();
    expect(screen.getByText('현재 이소트레티노인을 복용 중인가요?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '나중에 입력' })).toBeInTheDocument();
  });

  it('결합 답변을 두 사실로 부풀리지 않고 단일 marker로 저장한다', async () => {
    render(<SkinSafetyScreening onComplete={onComplete} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/safety/profile'));

    fireEvent.click(
      within(screen.getByTestId('pregnancy-breastfeeding-question')).getByRole('button', {
        name: '네',
      })
    );
    fireEvent.click(
      within(screen.getByTestId('isotretinoin-question')).getByRole('button', { name: '네' })
    );
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: '동의하고 계속' }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    const putCall = vi.mocked(global.fetch).mock.calls.find(([, init]) => init?.method === 'PUT');
    expect(putCall).toBeDefined();
    const payload = JSON.parse(String(putCall?.[1]?.body)) as {
      conditions: string[];
      medications: string[];
    };
    expect(payload.conditions).toEqual(['atopy', 'pregnancy_or_breastfeeding']);
    expect(payload.conditions).not.toContain('pregnancy');
    expect(payload.conditions).not.toContain('breastfeeding');
    expect(payload.medications).toEqual(['antihistamine', 'isotretinoin']);
  });

  it('나중에 입력하면 민감정보를 저장하지 않고 다음 단계로 간다', async () => {
    render(<SkinSafetyScreening onComplete={onComplete} />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/safety/profile'));

    fireEvent.click(screen.getByRole('button', { name: '나중에 입력' }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(vi.mocked(global.fetch).mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(
      false
    );
  });
});
