import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// lucide-react 아이콘 mock
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const createMockIcon = (name: string) => {
    const MockIcon = ({ className }: { className?: string }) => (
      <svg data-testid={`icon-${name}`} className={className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    ...actual,
    Camera: createMockIcon('Camera'),
    CameraOff: createMockIcon('CameraOff'),
    Settings: createMockIcon('Settings'),
  };
});

// date-fns mock
vi.mock('date-fns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('date-fns')>();
  return {
    ...actual,
    format: (date: Date, formatStr: string) => '2027년 1월 8일',
  };
});

import { ConsentStatus } from '@/components/analysis/consent/ConsentStatus';
import type { ImageConsent } from '@/components/analysis/consent/types';

describe('ConsentStatus', () => {
  const mockConsentGiven: ImageConsent = {
    id: '1',
    clerk_user_id: 'user_123',
    analysis_type: 'skin',
    consent_given: true,
    consent_version: 'v1.0',
    consent_at: '2026-01-08T00:00:00Z',
    withdrawal_at: null,
    retention_until: '2027-01-08T00:00:00Z',
    created_at: '2026-01-08T00:00:00Z',
    updated_at: '2026-01-08T00:00:00Z',
  };

  const mockConsentWithdrawn: ImageConsent = {
    ...mockConsentGiven,
    consent_given: false,
    consent_at: null,
    retention_until: null,
  };

  describe('정상 케이스', () => {
    it('컴포넌트가 올바르게 렌더링된다', () => {
      render(<ConsentStatus consent={mockConsentGiven} analysisType="skin" />);

      expect(screen.getByTestId('consent-status')).toBeInTheDocument();
    });

    it('동의 상태일 때 "사진 저장됨"을 표시한다', () => {
      render(<ConsentStatus consent={mockConsentGiven} analysisType="skin" />);

      expect(screen.getByText('사진 저장됨')).toBeInTheDocument();
      expect(screen.getByTestId('icon-Camera')).toBeInTheDocument();
    });

    it('미동의 상태일 때 "사진 미저장"을 표시한다', () => {
      render(<ConsentStatus consent={mockConsentWithdrawn} analysisType="skin" />);

      expect(screen.getByText('사진 미저장')).toBeInTheDocument();
      expect(screen.getByTestId('icon-CameraOff')).toBeInTheDocument();
    });

    it('동의가 null일 때 "사진 미저장"을 표시한다', () => {
      render(<ConsentStatus consent={null} analysisType="skin" />);

      expect(screen.getByText('사진 미저장')).toBeInTheDocument();
    });

    it('만료일을 표시한다 (showDetails=true)', () => {
      render(<ConsentStatus consent={mockConsentGiven} analysisType="skin" showDetails={true} />);

      expect(screen.getByText(/만료: 2027년 1월 8일/)).toBeInTheDocument();
    });

    it('미동의 상태일 때 안내 메시지를 표시한다', () => {
      render(
        <ConsentStatus consent={mockConsentWithdrawn} analysisType="skin" showDetails={true} />
      );

      expect(screen.getByText('변화 추적 기능이 꺼져 있어요')).toBeInTheDocument();
    });
  });

  describe('상세 정보 표시', () => {
    it('showDetails=false일 때 상세 정보를 숨긴다', () => {
      render(<ConsentStatus consent={mockConsentGiven} analysisType="skin" showDetails={false} />);

      expect(screen.queryByText(/만료:/)).not.toBeInTheDocument();
    });

    it('retention_until이 null일 때 만료일을 표시하지 않는다', () => {
      const consentWithoutRetention = {
        ...mockConsentGiven,
        retention_until: null,
      };

      render(
        <ConsentStatus consent={consentWithoutRetention} analysisType="skin" showDetails={true} />
      );

      expect(screen.queryByText(/만료:/)).not.toBeInTheDocument();
    });
  });

  describe('관리 버튼', () => {
    it('onManage 콜백이 있을 때 관리 버튼을 표시한다', () => {
      const onManage = vi.fn();

      render(<ConsentStatus consent={mockConsentGiven} analysisType="skin" onManage={onManage} />);

      expect(screen.getByRole('button', { name: /관리/ })).toBeInTheDocument();
    });

    it('동의 상태일 때 "관리" 버튼을 표시한다', () => {
      render(<ConsentStatus consent={mockConsentGiven} analysisType="skin" onManage={vi.fn()} />);

      expect(screen.getByText('관리')).toBeInTheDocument();
    });

    it('미동의 상태일 때 "활성화" 버튼을 표시한다', () => {
      render(
        <ConsentStatus consent={mockConsentWithdrawn} analysisType="skin" onManage={vi.fn()} />
      );

      expect(screen.getByText('활성화')).toBeInTheDocument();
    });

    it('관리 버튼 클릭 시 onManage 콜백을 호출한다', () => {
      const onManage = vi.fn();

      render(<ConsentStatus consent={mockConsentGiven} analysisType="skin" onManage={onManage} />);

      const manageButton = screen.getByRole('button', { name: /관리/ });
      fireEvent.click(manageButton);

      expect(onManage).toHaveBeenCalledTimes(1);
    });

    it('onManage가 없을 때 버튼을 표시하지 않는다', () => {
      render(<ConsentStatus consent={mockConsentGiven} analysisType="skin" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('스타일링', () => {
    it('동의 상태일 때 emerald 색상을 사용한다', () => {
      render(<ConsentStatus consent={mockConsentGiven} analysisType="skin" />);

      const container = screen.getByTestId('consent-status');
      expect(container).toHaveClass('bg-emerald-50');
    });

    it('미동의 상태일 때 gray 색상을 사용한다', () => {
      render(<ConsentStatus consent={mockConsentWithdrawn} analysisType="skin" />);

      const container = screen.getByTestId('consent-status');
      expect(container).toHaveClass('bg-gray-50');
    });

    it('커스텀 className을 적용한다', () => {
      render(
        <ConsentStatus consent={mockConsentGiven} analysisType="skin" className="custom-class" />
      );

      expect(screen.getByTestId('consent-status')).toHaveClass('custom-class');
    });
  });

  describe('분석 타입', () => {
    it('피부 분석 타입을 올바르게 처리한다', () => {
      render(<ConsentStatus consent={mockConsentGiven} analysisType="skin" />);

      expect(screen.getByTestId('consent-status')).toBeInTheDocument();
    });

    it('체형 분석 타입을 올바르게 처리한다', () => {
      render(
        <ConsentStatus
          consent={{ ...mockConsentGiven, analysis_type: 'body' }}
          analysisType="body"
        />
      );

      expect(screen.getByTestId('consent-status')).toBeInTheDocument();
    });

    it('퍼스널 컬러 타입을 올바르게 처리한다', () => {
      render(
        <ConsentStatus
          consent={{ ...mockConsentGiven, analysis_type: 'personal-color' }}
          analysisType="personal-color"
        />
      );

      expect(screen.getByTestId('consent-status')).toBeInTheDocument();
    });
  });
});
