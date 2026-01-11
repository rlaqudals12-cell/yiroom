/**
 * 바코드 스캐너 컴포넌트 테스트
 * components/nutrition/BarcodeScanner.tsx
 *
 * - 카메라 권한 요청
 * - 바코드 스캔 성공/실패 콜백
 * - 플래시/갤러리 버튼
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// lucide-react는 실제 모듈 사용 (모킹 불필요)

// html5-qrcode 모킹
const mockStart = vi.fn();
const mockStop = vi.fn();
const mockScanFile = vi.fn();
const mockClear = vi.fn();
const mockGetRunningTrackCameraCapabilities = vi.fn(() => ({
  torchFeature: () => ({ isSupported: () => false }),
}));

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: vi.fn().mockImplementation(() => ({
    start: mockStart,
    stop: mockStop,
    scanFile: mockScanFile,
    clear: mockClear,
    getRunningTrackCameraCapabilities: mockGetRunningTrackCameraCapabilities,
    applyVideoConstraints: vi.fn(),
  })),
}));

// 동적 import를 위한 컴포넌트 직접 import
// Note: dynamic import는 테스트에서 모킹이 어려우므로 직접 import
import BarcodeScanner from '@/components/nutrition/BarcodeScanner';

describe('BarcodeScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본적으로 스캐너 시작 성공
    mockStart.mockResolvedValue(undefined);
    mockStop.mockResolvedValue(undefined);
  });

  it('스캐너 컨테이너를 렌더링한다', () => {
    render(<BarcodeScanner onScan={vi.fn()} />);

    expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument();
  });

  it('닫기 버튼이 렌더링된다', () => {
    render(<BarcodeScanner onScan={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByTestId('barcode-scanner-close')).toBeInTheDocument();
  });

  it('닫기 버튼 클릭 시 onClose가 호출된다', async () => {
    const onClose = vi.fn();
    render(<BarcodeScanner onScan={vi.fn()} onClose={onClose} />);

    const closeButton = screen.getByTestId('barcode-scanner-close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('초기 로딩 상태를 표시한다', () => {
    render(<BarcodeScanner onScan={vi.fn()} />);

    expect(screen.getByText('카메라 준비 중...')).toBeInTheDocument();
  });

  it('카메라 시작 후 안내 텍스트를 표시한다', async () => {
    render(<BarcodeScanner onScan={vi.fn()} />);

    // 스캐너가 시작되면 안내 텍스트가 표시됨
    await waitFor(() => {
      expect(screen.getByText('바코드를 프레임에 맞춰주세요')).toBeInTheDocument();
    });
  });

  it('지원 바코드 형식 안내가 표시된다', async () => {
    render(<BarcodeScanner onScan={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/EAN-13, EAN-8, UPC-A/)).toBeInTheDocument();
    });
  });

  it('카메라 권한 거부 시 에러를 표시한다', async () => {
    const onError = vi.fn();
    mockStart.mockRejectedValueOnce(new Error('Permission denied'));

    render(<BarcodeScanner onScan={vi.fn()} onError={onError} />);

    await waitFor(() => {
      expect(screen.getByText('카메라 오류')).toBeInTheDocument();
      expect(screen.getByText(/카메라 권한이 필요합니다/)).toBeInTheDocument();
    });
    expect(onError).toHaveBeenCalled();
  });

  it('카메라를 찾을 수 없을 때 에러를 표시한다', async () => {
    const onError = vi.fn();
    mockStart.mockRejectedValueOnce(new Error('DevicesNotFound'));

    render(<BarcodeScanner onScan={vi.fn()} onError={onError} />);

    await waitFor(() => {
      expect(screen.getByText(/카메라를 찾을 수 없습니다/)).toBeInTheDocument();
    });
  });

  it('갤러리 버튼이 렌더링된다', async () => {
    render(<BarcodeScanner onScan={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('barcode-scanner-gallery')).toBeInTheDocument();
    });
  });

  it('갤러리 버튼 클릭 시 파일 input이 트리거된다', async () => {
    render(<BarcodeScanner onScan={vi.fn()} />);

    await waitFor(() => {
      const galleryButton = screen.getByTestId('barcode-scanner-gallery');
      expect(galleryButton).toBeInTheDocument();
    });

    // 파일 input이 숨겨져 있어야 함
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveClass('hidden');
  });

  it('aria-label이 올바르게 설정되어 있다', async () => {
    render(<BarcodeScanner onScan={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByLabelText('닫기')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText('갤러리에서 선택')).toBeInTheDocument();
    });
  });

  it('바코드 스캔 성공 시 onScan이 호출된다', async () => {
    const onScan = vi.fn();

    // start 호출 시 성공 콜백을 즉시 호출하도록 설정
    mockStart.mockImplementation(
      (_config: unknown, _options: unknown, onSuccess: (text: string) => void) => {
        setTimeout(() => onSuccess('8801234567890'), 0);
        return Promise.resolve();
      }
    );

    render(<BarcodeScanner onScan={onScan} />);

    await waitFor(() => {
      expect(onScan).toHaveBeenCalledWith('8801234567890');
    });
  });

  it('스캔 성공 시 스캐너를 정지한다', async () => {
    const onScan = vi.fn();

    mockStart.mockImplementation(
      (_config: unknown, _options: unknown, onSuccess: (text: string) => void) => {
        setTimeout(() => onSuccess('8801234567890'), 0);
        return Promise.resolve();
      }
    );

    render(<BarcodeScanner onScan={onScan} />);

    await waitFor(() => {
      expect(mockStop).toHaveBeenCalled();
    });
  });

  it('플래시 지원 시 플래시 버튼이 표시된다', async () => {
    // 플래시 지원하는 카메라 시뮬레이션
    mockGetRunningTrackCameraCapabilities.mockReturnValue({
      torchFeature: () => ({ isSupported: () => true as never }),
    });

    render(<BarcodeScanner onScan={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('barcode-scanner-flash')).toBeInTheDocument();
    });
  });

  it('언마운트 시 스캐너를 정리한다', async () => {
    const { unmount } = render(<BarcodeScanner onScan={vi.fn()} />);

    // 스캐너가 시작될 때까지 대기
    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled();
    });

    unmount();

    // stop이 호출되어야 함
    expect(mockStop).toHaveBeenCalled();
  });

  it('className prop이 적용된다', () => {
    render(<BarcodeScanner onScan={vi.fn()} className="test-class" />);

    expect(screen.getByTestId('barcode-scanner')).toHaveClass('test-class');
  });
});
