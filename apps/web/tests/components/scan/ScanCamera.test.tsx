/**
 * ScanCamera 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ScanCamera } from '@/components/scan/ScanCamera';

// 모듈 모킹
vi.mock('@/lib/scan', () => ({
  checkCameraPermission: vi.fn(),
  requestCameraAccess: vi.fn(),
  stopCameraStream: vi.fn(),
  scanBarcodeFromVideo: vi.fn(),
}));

import {
  checkCameraPermission,
  requestCameraAccess,
  stopCameraStream,
  scanBarcodeFromVideo,
} from '@/lib/scan';

const mockCheckCameraPermission = checkCameraPermission as ReturnType<typeof vi.fn>;
const mockRequestCameraAccess = requestCameraAccess as ReturnType<typeof vi.fn>;
const mockStopCameraStream = stopCameraStream as ReturnType<typeof vi.fn>;
const mockScanBarcodeFromVideo = scanBarcodeFromVideo as ReturnType<typeof vi.fn>;

describe('ScanCamera', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // 기본 모킹 - 카메라 권한 있고 스트림 획득 성공
    mockCheckCameraPermission.mockResolvedValue('granted');
    mockRequestCameraAccess.mockResolvedValue({
      getVideoTracks: () => [
        {
          getCapabilities: () => ({}),
          applyConstraints: vi.fn(),
        },
      ],
    });
    mockScanBarcodeFromVideo.mockResolvedValue(null);

    // HTMLVideoElement play 모킹
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('로딩 상태 표시', () => {
    mockCheckCameraPermission.mockImplementation(() => new Promise(() => {})); // never resolves

    render(<ScanCamera onScan={vi.fn()} />);

    expect(screen.getByTestId('scan-camera-loading')).toBeInTheDocument();
    expect(screen.getByText('카메라 연결 중...')).toBeInTheDocument();
  });

  it('카메라 권한 거부 시 에러 표시', async () => {
    mockCheckCameraPermission.mockResolvedValue('denied');

    render(<ScanCamera onScan={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('scan-camera-error')).toBeInTheDocument();
    });

    expect(
      screen.getByText('카메라 접근이 거부되었습니다. 설정에서 권한을 허용해주세요.')
    ).toBeInTheDocument();
  });

  it('카메라 스트림 획득 실패 시 에러 표시', async () => {
    mockCheckCameraPermission.mockResolvedValue('granted');
    mockRequestCameraAccess.mockResolvedValue(null);

    render(<ScanCamera onScan={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('scan-camera-error')).toBeInTheDocument();
    });

    expect(screen.getByText('카메라에 접근할 수 없습니다.')).toBeInTheDocument();
  });

  it('카메라 성공적으로 연결', async () => {
    const { container } = render(<ScanCamera onScan={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('scan-camera')).toBeInTheDocument();
    });

    // 비디오 요소 확인
    expect(container.querySelector('video')).toBeInTheDocument();
  });

  it('바코드 스캔 시 onScan 콜백 호출', async () => {
    const handleScan = vi.fn();
    const mockBarcodeResult = { text: '8809669912127', format: 'EAN-13', confidence: 95 };

    // 첫 번째 호출에서 바코드 감지
    mockScanBarcodeFromVideo.mockResolvedValueOnce(mockBarcodeResult);

    render(<ScanCamera onScan={handleScan} />);

    await waitFor(
      () => {
        expect(handleScan).toHaveBeenCalledWith(mockBarcodeResult);
      },
      { timeout: 3000 }
    );
  });

  it('다시 시도 버튼 클릭', async () => {
    mockCheckCameraPermission.mockResolvedValue('denied');

    render(<ScanCamera onScan={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('scan-camera-error')).toBeInTheDocument();
    });

    // 권한을 granted로 변경
    mockCheckCameraPermission.mockResolvedValue('granted');

    const retryButton = screen.getByText('다시 시도');
    fireEvent.click(retryButton);

    // 카메라 초기화가 다시 시도됨
    await waitFor(() => {
      expect(mockCheckCameraPermission).toHaveBeenCalledTimes(2);
    });
  });

  it('언마운트 시 스트림 정리', async () => {
    const mockStream = {
      getVideoTracks: () => [
        {
          getCapabilities: () => ({}),
          applyConstraints: vi.fn(),
        },
      ],
    };
    mockRequestCameraAccess.mockResolvedValue(mockStream);

    const { unmount } = render(<ScanCamera onScan={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('scan-camera')).toBeInTheDocument();
    });

    unmount();

    expect(mockStopCameraStream).toHaveBeenCalledWith(mockStream);
  });

  it('active=false 시 카메라 초기화 안 함', async () => {
    render(<ScanCamera onScan={vi.fn()} active={false} />);

    // 약간의 시간 대기
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockCheckCameraPermission).not.toHaveBeenCalled();
  });

  it('에러 발생 시 onError 콜백 호출', async () => {
    const handleError = vi.fn();
    mockCheckCameraPermission.mockRejectedValue(new Error('Camera error'));

    render(<ScanCamera onScan={vi.fn()} onError={handleError} />);

    await waitFor(() => {
      expect(handleError).toHaveBeenCalledWith('카메라 초기화에 실패했습니다.');
    });
  });

  it('스캔 가이드 오버레이 표시', async () => {
    render(<ScanCamera onScan={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('scan-camera')).toBeInTheDocument();
    });

    expect(screen.getByText('바코드를 사각형 안에 맞춰주세요')).toBeInTheDocument();
  });

  it('className prop 적용', async () => {
    render(<ScanCamera onScan={vi.fn()} className="custom-class" />);

    await waitFor(() => {
      expect(screen.getByTestId('scan-camera')).toBeInTheDocument();
    });

    expect(screen.getByTestId('scan-camera')).toHaveClass('custom-class');
  });

  it('플래시 지원 시 버튼 표시', async () => {
    mockRequestCameraAccess.mockResolvedValue({
      getVideoTracks: () => [
        {
          getCapabilities: () => ({ torch: true }),
          applyConstraints: vi.fn(),
        },
      ],
    });

    render(<ScanCamera onScan={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('scan-camera')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('플래시 켜기')).toBeInTheDocument();
  });

  it('플래시 미지원 시 버튼 없음', async () => {
    mockRequestCameraAccess.mockResolvedValue({
      getVideoTracks: () => [
        {
          getCapabilities: () => ({}),
          applyConstraints: vi.fn(),
        },
      ],
    });

    render(<ScanCamera onScan={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('scan-camera')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText('플래시 켜기')).not.toBeInTheDocument();
  });
});
