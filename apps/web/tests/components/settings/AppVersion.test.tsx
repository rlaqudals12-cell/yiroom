import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppVersion } from '@/components/settings/AppVersion';

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Info: () => <span data-testid="info-icon">Info</span>,
    RefreshCw: () => <span data-testid="refresh-icon">RefreshCw</span>,
    CheckCircle: () => <span data-testid="check-icon">CheckCircle</span>,
  };
});

describe('AppVersion', () => {
  describe('기본 렌더링', () => {
    it('컴포넌트 렌더링', () => {
      render(<AppVersion />);
      expect(screen.getByTestId('app-version')).toBeInTheDocument();
    });

    it('앱 버전 라벨 표시', () => {
      render(<AppVersion />);
      expect(screen.getByText('앱 버전')).toBeInTheDocument();
    });

    it('기본 버전 표시', () => {
      render(<AppVersion />);
      expect(screen.getByTestId('current-version')).toHaveTextContent('v2.0.0');
    });

    it('커스텀 버전 표시', () => {
      render(<AppVersion version="1.5.0" />);
      expect(screen.getByTestId('current-version')).toHaveTextContent('v1.5.0');
    });

    it('커스텀 testId', () => {
      render(<AppVersion data-testid="custom-version" />);
      expect(screen.getByTestId('custom-version')).toBeInTheDocument();
    });
  });

  describe('빌드 날짜', () => {
    it('빌드 날짜 표시', () => {
      render(<AppVersion buildDate="2025-12-24T00:00:00Z" />);
      expect(screen.getByTestId('build-date')).toBeInTheDocument();
    });

    it('빌드 날짜 없으면 숨김', () => {
      render(<AppVersion />);
      expect(screen.queryByTestId('build-date')).not.toBeInTheDocument();
    });
  });

  describe('최신 상태', () => {
    it('업데이트 없으면 최신 배지 표시', () => {
      render(<AppVersion hasUpdate={false} />);
      expect(screen.getByText('최신')).toBeInTheDocument();
    });

    it('업데이트 있으면 최신 배지 숨김', () => {
      render(<AppVersion hasUpdate={true} latestVersion="2.1.0" />);
      expect(screen.queryByText('최신')).not.toBeInTheDocument();
    });
  });

  describe('업데이트 알림', () => {
    it('업데이트 가능 배지 표시', () => {
      render(<AppVersion hasUpdate={true} latestVersion="2.1.0" />);
      expect(screen.getByTestId('update-badge')).toBeInTheDocument();
      expect(screen.getByText('v2.1.0 사용 가능')).toBeInTheDocument();
    });

    it('업데이트 버튼 표시', () => {
      const onUpdate = vi.fn();
      render(<AppVersion hasUpdate={true} latestVersion="2.1.0" onUpdate={onUpdate} />);
      expect(screen.getByTestId('update-button')).toBeInTheDocument();
    });

    it('업데이트 버튼 클릭', () => {
      const onUpdate = vi.fn();
      render(<AppVersion hasUpdate={true} latestVersion="2.1.0" onUpdate={onUpdate} />);

      fireEvent.click(screen.getByTestId('update-button'));

      expect(onUpdate).toHaveBeenCalled();
    });

    it('핸들러 없으면 업데이트 버튼 숨김', () => {
      render(<AppVersion hasUpdate={true} latestVersion="2.1.0" />);
      expect(screen.queryByTestId('update-button')).not.toBeInTheDocument();
    });

    it('latestVersion 없으면 업데이트 영역 숨김', () => {
      render(<AppVersion hasUpdate={true} />);
      expect(screen.queryByTestId('update-badge')).not.toBeInTheDocument();
    });
  });
});
