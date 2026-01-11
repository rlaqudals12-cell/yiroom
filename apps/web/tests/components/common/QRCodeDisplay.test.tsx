import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QRCodeDisplay } from '@/components/common/QRCodeDisplay';

// Mock QR generator
vi.mock('@/lib/qr/generator', () => ({
  generateQRCode: vi.fn().mockResolvedValue('data:image/png;base64,mockQRCode'),
}));

describe('QRCodeDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('QR 코드 컨테이너를 렌더링한다', () => {
    render(<QRCodeDisplay type="app_download" data={{ medium: 'test' }} />);

    expect(screen.getByTestId('qr-code-display')).toBeInTheDocument();
  });

  it('제목을 표시한다', () => {
    render(<QRCodeDisplay type="app_download" data={{ medium: 'test' }} title="테스트 QR" />);

    expect(screen.getByText('테스트 QR')).toBeInTheDocument();
  });

  it('설명을 표시한다', () => {
    render(
      <QRCodeDisplay
        type="app_download"
        data={{ medium: 'test' }}
        description="이 QR을 스캔하세요"
      />
    );

    expect(screen.getByText('이 QR을 스캔하세요')).toBeInTheDocument();
  });

  it('로딩 중에 스켈레톤을 표시한다', () => {
    render(<QRCodeDisplay type="app_download" data={{ medium: 'test' }} />);

    // 초기에는 로딩 스켈레톤이 표시됨
    const skeleton = screen.getByTestId('qr-code-display').querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('QR 코드 이미지를 로드한 후 표시한다', async () => {
    render(<QRCodeDisplay type="app_download" data={{ medium: 'test' }} />);

    await waitFor(() => {
      const img = screen.getByAltText('QR Code');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'data:image/png;base64,mockQRCode');
    });
  });

  it('QR 코드 저장 버튼이 있다', async () => {
    render(<QRCodeDisplay type="referral" data={{ referralCode: 'ABC123' }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /QR 코드 저장/i })).toBeInTheDocument();
    });
  });

  it('저장 버튼 클릭이 가능하다', async () => {
    render(<QRCodeDisplay type="app_download" data={{ medium: 'test' }} />);

    await waitFor(() => {
      expect(screen.getByAltText('QR Code')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /QR 코드 저장/i });
    // 버튼이 활성화되어 있는지 확인
    expect(saveButton).not.toBeDisabled();
    // 클릭이 에러 없이 실행되는지 확인
    expect(() => fireEvent.click(saveButton)).not.toThrow();
  });

  it('커스텀 사이즈를 적용한다', async () => {
    render(<QRCodeDisplay type="app_download" data={{ medium: 'test' }} size={300} />);

    await waitFor(() => {
      const img = screen.getByAltText('QR Code');
      expect(img).toHaveAttribute('width', '300');
      expect(img).toHaveAttribute('height', '300');
    });
  });

  it('커스텀 className을 적용한다', () => {
    render(
      <QRCodeDisplay type="app_download" data={{ medium: 'test' }} className="custom-class" />
    );

    expect(screen.getByTestId('qr-code-display')).toHaveClass('custom-class');
  });
});
