/**
 * MarketingConsentToggle 컴포넌트 테스트
 * SDD-MARKETING-TOGGLE-UI.md §4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MarketingConsentToggle } from '@/components/settings/MarketingConsentToggle';

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Megaphone: () => <span data-testid="megaphone-icon">Megaphone</span>,
    Info: () => <span data-testid="info-icon">Info</span>,
  };
});

// toast 모킹
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// fetch 모킹 설정
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('MarketingConsentToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('렌더링', () => {
    it('마케팅 동의 카드를 렌더링한다', () => {
      render(<MarketingConsentToggle initialValue={false} agreedAt={null} withdrawnAt={null} />);

      expect(screen.getByTestId('marketing-consent-card')).toBeInTheDocument();
      expect(screen.getByText('마케팅 정보 수신 동의')).toBeInTheDocument();
      expect(screen.getByText('프로모션, 이벤트, 맞춤 추천 알림을 받습니다')).toBeInTheDocument();
    });

    it('토글 스위치를 렌더링한다', () => {
      render(<MarketingConsentToggle initialValue={false} agreedAt={null} withdrawnAt={null} />);

      const toggle = screen.getByRole('switch', { name: '마케팅 정보 수신 동의' });
      expect(toggle).toBeInTheDocument();
    });
  });

  describe('초기 상태', () => {
    it('initialValue가 true이면 토글이 켜져있다', () => {
      render(
        <MarketingConsentToggle
          initialValue={true}
          agreedAt="2024-01-01T00:00:00Z"
          withdrawnAt={null}
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('data-state', 'checked');
    });

    it('initialValue가 false이면 토글이 꺼져있다', () => {
      render(
        <MarketingConsentToggle
          initialValue={false}
          agreedAt={null}
          withdrawnAt="2024-01-01T00:00:00Z"
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('토글 상호작용', () => {
    it('토글 변경 시 API를 호출한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<MarketingConsentToggle initialValue={false} agreedAt={null} withdrawnAt={null} />);

      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/agreement', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ marketingAgreed: true }),
        });
      });
    });

    it('API 성공 시 토글 상태가 변경된다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<MarketingConsentToggle initialValue={false} agreedAt={null} withdrawnAt={null} />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('data-state', 'unchecked');

      fireEvent.click(toggle);

      await waitFor(() => {
        expect(toggle).toHaveAttribute('data-state', 'checked');
      });
    });

    it('API 실패 시 이전 상태로 롤백한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<MarketingConsentToggle initialValue={false} agreedAt={null} withdrawnAt={null} />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('data-state', 'unchecked');

      fireEvent.click(toggle);

      // 낙관적 업데이트로 일시적으로 checked
      expect(toggle).toHaveAttribute('data-state', 'checked');

      // API 실패 후 롤백
      await waitFor(() => {
        expect(toggle).toHaveAttribute('data-state', 'unchecked');
      });
    });

    it('네트워크 오류 시 이전 상태로 롤백한다', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <MarketingConsentToggle
          initialValue={true}
          agreedAt="2024-01-01T00:00:00Z"
          withdrawnAt={null}
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('data-state', 'checked');

      fireEvent.click(toggle);

      // 낙관적 업데이트로 일시적으로 unchecked
      expect(toggle).toHaveAttribute('data-state', 'unchecked');

      // 네트워크 오류 후 롤백
      await waitFor(() => {
        expect(toggle).toHaveAttribute('data-state', 'checked');
      });
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중에는 토글이 비활성화된다', async () => {
      // 응답을 지연시켜 로딩 상태 테스트
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true }),
                }),
              100
            )
          )
      );

      render(<MarketingConsentToggle initialValue={false} agreedAt={null} withdrawnAt={null} />);

      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);

      // 로딩 중 비활성화 확인
      expect(toggle).toBeDisabled();

      // 로딩 완료 후 활성화
      await waitFor(
        () => {
          expect(toggle).not.toBeDisabled();
        },
        { timeout: 200 }
      );
    });
  });

  describe('날짜 표시', () => {
    it('동의일을 올바르게 표시한다', () => {
      const agreedAt = '2024-01-15T09:30:00Z';

      render(<MarketingConsentToggle initialValue={true} agreedAt={agreedAt} withdrawnAt={null} />);

      const dateText = screen.getByText(/동의일:/);
      expect(dateText).toBeInTheDocument();

      // 한국어 날짜 형식 확인 (예: 2024. 1. 15.)
      const expectedDate = new Date(agreedAt).toLocaleDateString('ko-KR');
      expect(screen.getByText(new RegExp(expectedDate))).toBeInTheDocument();
    });

    it('철회일을 올바르게 표시한다', () => {
      const withdrawnAt = '2024-02-20T14:45:00Z';

      render(
        <MarketingConsentToggle
          initialValue={false}
          agreedAt="2024-01-15T09:30:00Z"
          withdrawnAt={withdrawnAt}
        />
      );

      const dateText = screen.getByText(/철회일:/);
      expect(dateText).toBeInTheDocument();

      const expectedDate = new Date(withdrawnAt).toLocaleDateString('ko-KR');
      expect(screen.getByText(new RegExp(expectedDate))).toBeInTheDocument();
    });

    it('날짜가 없으면 표시하지 않는다', () => {
      render(<MarketingConsentToggle initialValue={false} agreedAt={null} withdrawnAt={null} />);

      expect(screen.queryByText(/동의일:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/철회일:/)).not.toBeInTheDocument();
    });
  });

  describe('안내 문구', () => {
    it('동의 상태일 때 적절한 안내 문구를 표시한다', () => {
      render(
        <MarketingConsentToggle
          initialValue={true}
          agreedAt="2024-01-01T00:00:00Z"
          withdrawnAt={null}
        />
      );

      expect(
        screen.getByText('언제든 설정에서 수신 동의를 철회할 수 있습니다.')
      ).toBeInTheDocument();
    });

    it('비동의 상태일 때 적절한 안내 문구를 표시한다', () => {
      render(
        <MarketingConsentToggle
          initialValue={false}
          agreedAt={null}
          withdrawnAt="2024-01-01T00:00:00Z"
        />
      );

      expect(screen.getByText('마케팅 정보를 받지 않습니다.')).toBeInTheDocument();
    });
  });

  describe('토스트 메시지', () => {
    it('동의 시 성공 메시지를 표시한다', async () => {
      const { toast } = await import('sonner');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<MarketingConsentToggle initialValue={false} agreedAt={null} withdrawnAt={null} />);

      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('마케팅 정보 수신에 동의했습니다');
      });
    });

    it('철회 시 성공 메시지를 표시한다', async () => {
      const { toast } = await import('sonner');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <MarketingConsentToggle
          initialValue={true}
          agreedAt="2024-01-01T00:00:00Z"
          withdrawnAt={null}
        />
      );

      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('마케팅 정보 수신 동의를 철회했습니다');
      });
    });

    it('실패 시 에러 메시지를 표시한다', async () => {
      const { toast } = await import('sonner');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<MarketingConsentToggle initialValue={false} agreedAt={null} withdrawnAt={null} />);

      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('설정 변경에 실패했습니다. 다시 시도해주세요.');
      });
    });
  });

  describe('접근성', () => {
    it('토글에 aria-label이 설정된다', () => {
      render(<MarketingConsentToggle initialValue={false} agreedAt={null} withdrawnAt={null} />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-label', '마케팅 정보 수신 동의');
    });
  });

  describe('엣지 케이스', () => {
    it('빠른 연속 클릭 시 하나의 요청만 처리한다', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<MarketingConsentToggle initialValue={false} agreedAt={null} withdrawnAt={null} />);

      const toggle = screen.getByRole('switch');

      // 빠른 연속 클릭
      fireEvent.click(toggle);
      fireEvent.click(toggle);
      fireEvent.click(toggle);

      // 로딩 중이므로 비활성화되어 추가 클릭 무시
      await waitFor(() => {
        // 첫 클릭만 처리되어야 함
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('동의와 철회를 번갈아 할 수 있다', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<MarketingConsentToggle initialValue={false} agreedAt={null} withdrawnAt={null} />);

      const toggle = screen.getByRole('switch');

      // 동의
      fireEvent.click(toggle);
      await waitFor(() => {
        expect(toggle).toHaveAttribute('data-state', 'checked');
      });

      // 철회
      fireEvent.click(toggle);
      await waitFor(() => {
        expect(toggle).toHaveAttribute('data-state', 'unchecked');
      });

      // 다시 동의
      fireEvent.click(toggle);
      await waitFor(() => {
        expect(toggle).toHaveAttribute('data-state', 'checked');
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
