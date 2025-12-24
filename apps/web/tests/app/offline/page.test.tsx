import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OfflinePage from '@/app/offline/page';

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    WifiOff: () => <span data-testid="wifi-off-icon">WifiOff</span>,
    RefreshCw: () => <span data-testid="refresh-icon">RefreshCw</span>,
    Home: () => <span data-testid="home-icon">Home</span>,
  };
});

describe('OfflinePage', () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    vi.clearAllMocks();
    // 기본적으로 오프라인 상태로 설정
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // 원래 상태로 복원
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
      configurable: true,
    });
  });

  describe('기본 렌더링', () => {
    it('페이지 렌더링', () => {
      render(<OfflinePage />);
      expect(screen.getByTestId('offline-page')).toBeInTheDocument();
    });

    it('제목 표시', () => {
      render(<OfflinePage />);
      expect(screen.getByText('오프라인 상태')).toBeInTheDocument();
    });

    it('설명 표시', () => {
      render(<OfflinePage />);
      expect(screen.getByText('인터넷 연결이 끊어졌습니다.')).toBeInTheDocument();
    });

    it('WifiOff 아이콘 표시', () => {
      render(<OfflinePage />);
      expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
    });
  });

  describe('상태 표시', () => {
    it('오프라인 상태 표시', () => {
      render(<OfflinePage />);
      expect(screen.getByText('오프라인 - 연결 안됨')).toBeInTheDocument();
    });

    it('온라인 상태 표시', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      render(<OfflinePage />);
      expect(screen.getByText('온라인 - 연결됨')).toBeInTheDocument();
    });
  });

  describe('안내 메시지', () => {
    it('Wi-Fi 확인 안내', () => {
      render(<OfflinePage />);
      expect(
        screen.getByText('Wi-Fi 또는 모바일 데이터 연결을 확인해 주세요.')
      ).toBeInTheDocument();
    });

    it('자동 동기화 안내', () => {
      render(<OfflinePage />);
      expect(
        screen.getByText('연결이 복구되면 자동으로 동기화됩니다.')
      ).toBeInTheDocument();
    });

    it('오프라인 기능 안내', () => {
      render(<OfflinePage />);
      expect(screen.getByText('오프라인에서도 사용 가능:')).toBeInTheDocument();
    });
  });

  describe('버튼', () => {
    it('홈으로 버튼 표시', () => {
      render(<OfflinePage />);
      expect(screen.getByTestId('go-home-button')).toBeInTheDocument();
      expect(screen.getByText('홈으로')).toBeInTheDocument();
    });

    it('다시 시도 버튼 표시', () => {
      render(<OfflinePage />);
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      expect(screen.getByText('다시 시도')).toBeInTheDocument();
    });

    it('홈으로 버튼 클릭', () => {
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      render(<OfflinePage />);
      fireEvent.click(screen.getByTestId('go-home-button'));

      expect(mockLocation.href).toBe('/');
    });
  });
});
