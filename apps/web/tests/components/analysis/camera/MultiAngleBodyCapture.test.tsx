/**
 * MultiAngleBodyCapture 컴포넌트 테스트
 * @description 다각도 체형 촬영 통합 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MultiAngleBodyCapture } from '@/components/analysis/camera/MultiAngleBodyCapture';

// navigator.mediaDevices 모킹
const mockGetUserMedia = vi.fn();

beforeAll(() => {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: mockGetUserMedia,
    },
    writable: true,
  });
});

beforeEach(() => {
  mockGetUserMedia.mockReset();
});

describe('MultiAngleBodyCapture', () => {
  describe('초기 렌더링', () => {
    it('초기 화면이 렌더링된다', () => {
      render(
        <MultiAngleBodyCapture
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByTestId('multi-angle-body-capture')).toBeInTheDocument();
      expect(screen.getByText('정면 사진 촬영')).toBeInTheDocument();
      expect(screen.getByText('전신이 잘 보이도록 정면을 촬영해주세요')).toBeInTheDocument();
    });

    it('카메라로 촬영 버튼이 표시된다', () => {
      render(
        <MultiAngleBodyCapture
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('카메라로 촬영')).toBeInTheDocument();
    });

    it('갤러리에서 선택 버튼이 표시된다', () => {
      render(
        <MultiAngleBodyCapture
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('갤러리에서 선택')).toBeInTheDocument();
    });
  });

  describe('취소 기능', () => {
    it('취소 버튼 클릭 시 onCancel이 호출된다', async () => {
      const onCancel = vi.fn();
      render(
        <MultiAngleBodyCapture
          onComplete={vi.fn()}
          onCancel={onCancel}
        />
      );

      await fireEvent.click(screen.getByText('취소'));
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('카메라 시작', () => {
    it('카메라 시작 버튼 클릭 시 getUserMedia가 호출된다', async () => {
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      render(
        <MultiAngleBodyCapture
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await fireEvent.click(screen.getByText('카메라로 촬영'));

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({
          video: {
            facingMode: 'environment',
            width: { ideal: 1080 },
            height: { ideal: 1920 },
          },
        });
      });
    });

    it('카메라 접근 실패 시 에러 메시지가 표시된다', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Camera access denied'));

      render(
        <MultiAngleBodyCapture
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await fireEvent.click(screen.getByText('카메라로 촬영'));

      await waitFor(() => {
        expect(screen.getByText('카메라에 접근할 수 없어요. 권한을 확인해주세요.')).toBeInTheDocument();
      });
    });
  });

  describe('className 적용', () => {
    it('추가 className이 적용된다', () => {
      render(
        <MultiAngleBodyCapture
          onComplete={vi.fn()}
          onCancel={vi.fn()}
          className="test-class"
        />
      );

      expect(screen.getByTestId('multi-angle-body-capture')).toHaveClass('test-class');
    });
  });
});
