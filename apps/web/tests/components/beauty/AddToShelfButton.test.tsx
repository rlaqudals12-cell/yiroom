import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddToShelfButton } from '@/components/beauty/AddToShelfButton';

// toast 모킹
const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

// Clerk useUser 모킹 (테스트별로 override)
let mockUser: { id: string } | null = { id: 'test-user-id' };
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: mockUser, isLoaded: true }),
}));

const baseProps = {
  productId: 'prod-uuid-1',
  productName: '비타민C 세럼',
  productBrand: '이룸랩',
  productImageUrl: 'https://img.example/serum.jpg',
  keyIngredients: ['아스코르빈산', '나이아신아마이드'],
};

describe('AddToShelfButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'test-user-id' };
    // 기본: 빈 제품함 (중복 없음)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    }) as unknown as typeof fetch;
  });

  it('버튼을 렌더링하고 담기 가능 상태로 표시한다', async () => {
    render(<AddToShelfButton {...baseProps} />);
    const btn = screen.getByTestId('add-to-shelf-button');
    expect(btn).toBeInTheDocument();
    // 마운트 시 중복 확인이 끝나면 활성화됨
    await waitFor(() => expect(btn).not.toBeDisabled());
    expect(btn).toHaveAttribute('aria-label', '내 제품함에 담기');
  });

  it('담기 성공 시 성분을 매핑한 페이로드로 POST하고 성공 토스트를 띄운다', async () => {
    const fetchMock = vi
      .fn()
      // 1) 마운트 중복 확인
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
      // 2) 담기 POST
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'shelf-1' }) });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AddToShelfButton {...baseProps} />);
    const btn = screen.getByTestId('add-to-shelf-button');
    await waitFor(() => expect(btn).not.toBeDisabled());

    fireEvent.click(btn);

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledTimes(1));
    expect(toastSuccess).toHaveBeenCalledWith('내 제품함에 담았어요 — 맞춤 루틴에 반영돼요');

    // POST 호출 검증
    const postCall = fetchMock.mock.calls.find(
      ([url, opts]) => url === '/api/scan/shelf' && opts?.method === 'POST'
    );
    expect(postCall).toBeDefined();
    const body = JSON.parse((postCall![1] as RequestInit).body as string);

    expect(body.productId).toBe('prod-uuid-1');
    expect(body.productName).toBe('비타민C 세럼');
    expect(body.productBrand).toBe('이룸랩');
    expect(body.scanMethod).toBe('manual');
    expect(body.status).toBe('owned');
    // 성분 매핑: key_ingredients → ProductIngredient[]
    expect(body.productIngredients).toEqual([
      { order: 1, inciName: '아스코르빈산', nameKo: '아스코르빈산' },
      { order: 2, inciName: '나이아신아마이드', nameKo: '나이아신아마이드' },
    ]);

    // 담기 후 비활성 + "있음" 라벨
    await waitFor(() => expect(btn).toBeDisabled());
    expect(btn).toHaveAttribute('aria-label', '이미 제품함에 있는 제품');
  });

  it('이미 제품함에 있으면(product_id 일치) 비활성 상태로 표시한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ productId: 'prod-uuid-1', productName: '다른이름' }] }),
    }) as unknown as typeof fetch;

    render(<AddToShelfButton {...baseProps} />);
    const btn = screen.getByTestId('add-to-shelf-button');

    await waitFor(() => expect(btn).toBeDisabled());
    expect(btn).toHaveAttribute('aria-label', '이미 제품함에 있는 제품');
  });

  it('이미 제품함에 있으면(이름+브랜드 일치) 비활성 상태로 표시한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{ productName: '비타민C 세럼', productBrand: '이룸랩' }],
      }),
    }) as unknown as typeof fetch;

    render(<AddToShelfButton {...baseProps} />);
    const btn = screen.getByTestId('add-to-shelf-button');

    await waitFor(() => expect(btn).toBeDisabled());
  });

  it('비로그인 상태에서 클릭 시 로그인 안내 토스트를 띄우고 POST하지 않는다', async () => {
    mockUser = null;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AddToShelfButton {...baseProps} />);
    const btn = screen.getByTestId('add-to-shelf-button');
    await waitFor(() => expect(btn).not.toBeDisabled());

    fireEvent.click(btn);

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('로그인이 필요합니다'));
    // 담기 POST가 발생하지 않아야 함
    const postCall = fetchMock.mock.calls.find(
      ([url, opts]) => url === '/api/scan/shelf' && opts?.method === 'POST'
    );
    expect(postCall).toBeUndefined();
  });

  it('성분이 없는 제품은 빈 productIngredients 배열로 담는다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'shelf-2' }) });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AddToShelfButton {...baseProps} keyIngredients={undefined} />);
    const btn = screen.getByTestId('add-to-shelf-button');
    await waitFor(() => expect(btn).not.toBeDisabled());

    fireEvent.click(btn);

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    const postCall = fetchMock.mock.calls.find(
      ([url, opts]) => url === '/api/scan/shelf' && opts?.method === 'POST'
    );
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.productIngredients).toEqual([]);
  });

  it('담기 실패(응답 not ok) 시 오류 토스트를 띄우고 활성 상태를 유지한다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'fail' }) });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AddToShelfButton {...baseProps} />);
    const btn = screen.getByTestId('add-to-shelf-button');
    await waitFor(() => expect(btn).not.toBeDisabled());

    fireEvent.click(btn);

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    // 실패 시 다시 담을 수 있도록 활성 유지
    await waitFor(() => expect(btn).not.toBeDisabled());
  });
});
