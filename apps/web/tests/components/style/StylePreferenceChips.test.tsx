/**
 * StylePreferenceChips 컴포넌트 테스트
 * - 선호 스타일 저장(POST) / 복원(GET) / 해제(DELETE)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StylePreferenceChips from '@/components/style/StylePreferenceChips';

// Clerk useUser 모킹 (안정적인 참조 유지 — 매 렌더 새 객체 방지)
const mockUser = { id: 'user-1' };
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: mockUser, isLoaded: true }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('StylePreferenceChips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('data-testid와 모든 스타일 옵션을 렌더링한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

    render(<StylePreferenceChips />);

    expect(screen.getByTestId('style-preference-chips')).toBeInTheDocument();
    expect(screen.getByText('캐주얼')).toBeInTheDocument();
    expect(screen.getByText('미니멀')).toBeInTheDocument();

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith('/api/preferences?domain=style&itemType=fashion_style')
    );
  });

  it('저장된 선호 스타일을 복원해 selected 상태로 표시한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 'p1', itemName: '미니멀', itemNameEn: 'minimal', isFavorite: true }],
      }),
    });

    render(<StylePreferenceChips />);

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /미니멀/ });
      expect(btn).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('칩을 선택하면 POST로 저장한다', async () => {
    // 초기 로드(빈 목록)
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });
    // POST 저장 응답
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'new-id' } }),
    });

    const user = userEvent.setup();
    render(<StylePreferenceChips />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole('button', { name: /캐주얼/ }));

    await waitFor(() => {
      const postCall = mockFetch.mock.calls.find((c) => c[0] === '/api/preferences');
      expect(postCall).toBeTruthy();
      expect(postCall?.[1]?.method).toBe('POST');
      const body = JSON.parse(postCall?.[1]?.body as string);
      expect(body.domain).toBe('style');
      expect(body.itemType).toBe('fashion_style');
      expect(body.itemName).toBe('캐주얼');
      expect(body.itemNameEn).toBe('casual');
      expect(body.isFavorite).toBe(true);
    });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /캐주얼/ })).toHaveAttribute('aria-pressed', 'true')
    );
  });

  it('선택된 칩을 다시 누르면 DELETE로 해제한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 'p1', itemName: '스트릿', itemNameEn: 'street', isFavorite: true }],
      }),
    });
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: {} }) });

    const user = userEvent.setup();
    render(<StylePreferenceChips />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /스트릿/ })).toHaveAttribute('aria-pressed', 'true')
    );

    await user.click(screen.getByRole('button', { name: /스트릿/ }));

    await waitFor(() => {
      const delCall = mockFetch.mock.calls.find(
        (c) => c[0] === '/api/preferences/p1' && c[1]?.method === 'DELETE'
      );
      expect(delCall).toBeTruthy();
    });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /스트릿/ })).toHaveAttribute(
        'aria-pressed',
        'false'
      )
    );
  });

  it('추천에 반영된다는 문구를 표시하지 않는다 (유령 방지)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });
    render(<StylePreferenceChips />);
    expect(screen.queryByText(/추천에 반영/)).not.toBeInTheDocument();
    expect(screen.queryByText(/다음 추천부터/)).not.toBeInTheDocument();
  });
});
