/**
 * AngleSelector 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AngleSelector } from '@/components/analysis/camera/AngleSelector';

describe('AngleSelector', () => {
  const defaultProps = {
    capturedAngles: ['front'] as ('front' | 'left' | 'right')[],
    onSelectAngle: vi.fn(),
    onSkip: vi.fn(),
  };

  describe('렌더링', () => {
    it('기본 상태로 렌더링된다', () => {
      render(<AngleSelector {...defaultProps} />);

      expect(screen.getByTestId('angle-selector')).toBeInTheDocument();
      expect(screen.getByText('정확도를 높이려면 좌/우 사진도 추가해주세요')).toBeInTheDocument();
    });

    it('좌측 추가 버튼이 표시된다', () => {
      render(<AngleSelector {...defaultProps} />);

      expect(screen.getByText('좌측 추가')).toBeInTheDocument();
    });

    it('우측 추가 버튼이 표시된다', () => {
      render(<AngleSelector {...defaultProps} />);

      expect(screen.getByText('우측 추가')).toBeInTheDocument();
    });

    it('건너뛰기 버튼이 표시된다', () => {
      render(<AngleSelector {...defaultProps} />);

      expect(screen.getByText('건너뛰고 분석하기')).toBeInTheDocument();
    });
  });

  describe('촬영 상태 표시', () => {
    it('정면이 촬영되면 상태 표시된다', () => {
      const { container } = render(<AngleSelector {...defaultProps} />);

      // 하단 상태 표시 영역의 점들 확인
      const statusDots = container.querySelectorAll('.rounded-full.w-2.h-2');
      expect(statusDots).toHaveLength(3);

      // 첫 번째 점(정면)은 녹색
      expect(statusDots[0]).toHaveClass('bg-green-500');
    });

    it('좌측이 촬영되면 버튼이 완료로 변경된다', () => {
      render(<AngleSelector {...defaultProps} capturedAngles={['front', 'left']} />);

      expect(screen.getByText('좌측 완료')).toBeInTheDocument();
    });

    it('우측이 촬영되면 버튼이 완료로 변경된다', () => {
      render(<AngleSelector {...defaultProps} capturedAngles={['front', 'right']} />);

      expect(screen.getByText('우측 완료')).toBeInTheDocument();
    });
  });

  describe('모든 사진 촬영 완료', () => {
    it('모든 사진이 촬영되면 완료 메시지가 표시된다', () => {
      render(<AngleSelector {...defaultProps} capturedAngles={['front', 'left', 'right']} />);

      expect(screen.getByText('모든 사진이 준비되었어요')).toBeInTheDocument();
      expect(screen.getByText('분석 시작하기')).toBeInTheDocument();
    });
  });

  describe('이벤트 핸들링', () => {
    it('좌측 버튼 클릭 시 onSelectAngle이 호출된다', () => {
      const onSelectAngle = vi.fn();
      render(<AngleSelector {...defaultProps} onSelectAngle={onSelectAngle} />);

      fireEvent.click(screen.getByText('좌측 추가'));

      expect(onSelectAngle).toHaveBeenCalledWith('left');
    });

    it('우측 버튼 클릭 시 onSelectAngle이 호출된다', () => {
      const onSelectAngle = vi.fn();
      render(<AngleSelector {...defaultProps} onSelectAngle={onSelectAngle} />);

      fireEvent.click(screen.getByText('우측 추가'));

      expect(onSelectAngle).toHaveBeenCalledWith('right');
    });

    it('건너뛰기 클릭 시 onSkip이 호출된다', () => {
      const onSkip = vi.fn();
      render(<AngleSelector {...defaultProps} onSkip={onSkip} />);

      fireEvent.click(screen.getByText('건너뛰고 분석하기'));

      expect(onSkip).toHaveBeenCalled();
    });

    it('완료 상태에서 분석 시작 클릭 시 onSkip이 호출된다', () => {
      const onSkip = vi.fn();
      render(
        <AngleSelector
          {...defaultProps}
          capturedAngles={['front', 'left', 'right']}
          onSkip={onSkip}
        />
      );

      fireEvent.click(screen.getByText('분석 시작하기'));

      expect(onSkip).toHaveBeenCalled();
    });
  });

  describe('비활성화 상태', () => {
    it('disabled 시 버튼들이 비활성화된다', () => {
      render(<AngleSelector {...defaultProps} disabled />);

      expect(screen.getByText('좌측 추가').closest('button')).toBeDisabled();
      expect(screen.getByText('우측 추가').closest('button')).toBeDisabled();
      expect(screen.getByText('건너뛰고 분석하기').closest('button')).toBeDisabled();
    });

    it('이미 촬영된 각도 버튼은 비활성화된다', () => {
      render(<AngleSelector {...defaultProps} capturedAngles={['front', 'left']} />);

      expect(screen.getByText('좌측 완료').closest('button')).toBeDisabled();
      expect(screen.getByText('우측 추가').closest('button')).not.toBeDisabled();
    });
  });
});
