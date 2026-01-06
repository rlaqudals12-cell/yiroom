/**
 * MultiAnglePersonalColorCapture 컴포넌트 테스트
 * @description PC-1 퍼스널 컬러 다각도 촬영 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MultiAnglePersonalColorCapture from '@/app/(main)/analysis/personal-color/_components/MultiAnglePersonalColorCapture';

// Mock MultiAngleCapture 컴포넌트
vi.mock('@/components/analysis/camera', () => ({
  MultiAngleCapture: vi.fn(({ onComplete, onValidate, onCancel }) => (
    <div data-testid="mock-multi-angle-capture">
      <button
        data-testid="complete-btn"
        onClick={() =>
          onComplete({
            frontImageBase64: 'data:image/jpeg;base64,front',
            leftImageBase64: 'data:image/jpeg;base64,left',
            rightImageBase64: 'data:image/jpeg;base64,right',
          })
        }
      >
        Complete
      </button>
      <button data-testid="validate-btn" onClick={() => onValidate?.('test-image', 'front')}>
        Validate
      </button>
      {onCancel && (
        <button data-testid="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  )),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('MultiAnglePersonalColorCapture', () => {
  const mockOnComplete = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          suitable: true,
          detectedAngle: 'front',
          quality: {
            lighting: 'good',
            makeupDetected: false,
            faceDetected: true,
            blur: false,
          },
        }),
    });
  });

  describe('렌더링', () => {
    it('컴포넌트가 올바르게 렌더링된다', () => {
      render(
        <MultiAnglePersonalColorCapture onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      expect(screen.getByTestId('multi-angle-personal-color-capture')).toBeInTheDocument();
      expect(screen.getByTestId('mock-multi-angle-capture')).toBeInTheDocument();
    });

    it('취소 버튼이 onCancel prop과 연결된다', () => {
      render(
        <MultiAnglePersonalColorCapture onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      fireEvent.click(screen.getByTestId('cancel-btn'));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('촬영 완료', () => {
    it('촬영 완료 시 onComplete 콜백이 호출된다', () => {
      render(
        <MultiAnglePersonalColorCapture onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      fireEvent.click(screen.getByTestId('complete-btn'));

      expect(mockOnComplete).toHaveBeenCalledWith({
        frontImageBase64: 'data:image/jpeg;base64,front',
        leftImageBase64: 'data:image/jpeg;base64,left',
        rightImageBase64: 'data:image/jpeg;base64,right',
      });
    });
  });

  describe('검증 API 연동', () => {
    it('검증 API를 호출한다', async () => {
      render(
        <MultiAnglePersonalColorCapture onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      fireEvent.click(screen.getByTestId('validate-btn'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/validate/face-image',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('검증 API 실패 시에도 촬영이 허용된다', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      render(
        <MultiAnglePersonalColorCapture onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      fireEvent.click(screen.getByTestId('validate-btn'));

      // 에러가 발생해도 컴포넌트가 정상 작동해야 함
      await waitFor(() => {
        expect(screen.getByTestId('multi-angle-personal-color-capture')).toBeInTheDocument();
      });
    });

    it('검증 API 응답이 실패해도 촬영이 허용된다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(
        <MultiAnglePersonalColorCapture onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      fireEvent.click(screen.getByTestId('validate-btn'));

      // 에러가 발생해도 컴포넌트가 정상 작동해야 함
      await waitFor(() => {
        expect(screen.getByTestId('multi-angle-personal-color-capture')).toBeInTheDocument();
      });
    });
  });

  describe('접근성', () => {
    it('data-testid가 올바르게 설정된다', () => {
      render(<MultiAnglePersonalColorCapture onComplete={mockOnComplete} />);

      expect(screen.getByTestId('multi-angle-personal-color-capture')).toBeInTheDocument();
    });
  });
});
