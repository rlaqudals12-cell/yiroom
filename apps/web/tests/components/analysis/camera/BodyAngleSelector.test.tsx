/**
 * BodyAngleSelector 컴포넌트 테스트
 * @description 체형 분석 각도 선택 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BodyAngleSelector } from '@/components/analysis/camera/BodyAngleSelector';

describe('BodyAngleSelector', () => {
  describe('렌더링', () => {
    it('정면만 촬영된 경우 측면/후면 버튼이 활성화된다', () => {
      render(
        <BodyAngleSelector
          capturedAngles={['front']}
          onSelectAngle={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      expect(screen.getByTestId('body-angle-selector')).toBeInTheDocument();
      expect(screen.getByText('측면 추가 촬영')).toBeInTheDocument();
      expect(screen.getByText('후면 추가 촬영')).toBeInTheDocument();
      expect(screen.getByText('건너뛰고 분석하기')).toBeInTheDocument();
    });

    it('측면까지 촬영된 경우 측면 버튼이 비활성화된다', () => {
      render(
        <BodyAngleSelector
          capturedAngles={['front', 'side']}
          onSelectAngle={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      expect(screen.getByText('측면 촬영 완료')).toBeInTheDocument();
      expect(screen.getByText('후면 추가 촬영')).toBeInTheDocument();
    });

    it('모든 각도가 촬영된 경우 완료 메시지가 표시된다', () => {
      render(
        <BodyAngleSelector
          capturedAngles={['front', 'side', 'back']}
          onSelectAngle={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      expect(screen.getByText('모든 사진이 준비되었어요')).toBeInTheDocument();
      expect(screen.getByText('분석 시작하기')).toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('측면 버튼 클릭 시 onSelectAngle이 호출된다', async () => {
      const onSelectAngle = vi.fn();
      render(
        <BodyAngleSelector
          capturedAngles={['front']}
          onSelectAngle={onSelectAngle}
          onSkip={vi.fn()}
        />
      );

      await fireEvent.click(screen.getByText('측면 추가 촬영'));
      expect(onSelectAngle).toHaveBeenCalledWith('side');
    });

    it('후면 버튼 클릭 시 onSelectAngle이 호출된다', async () => {
      const onSelectAngle = vi.fn();
      render(
        <BodyAngleSelector
          capturedAngles={['front']}
          onSelectAngle={onSelectAngle}
          onSkip={vi.fn()}
        />
      );

      await fireEvent.click(screen.getByText('후면 추가 촬영'));
      expect(onSelectAngle).toHaveBeenCalledWith('back');
    });

    it('건너뛰기 버튼 클릭 시 onSkip이 호출된다', async () => {
      const onSkip = vi.fn();
      render(
        <BodyAngleSelector
          capturedAngles={['front']}
          onSelectAngle={vi.fn()}
          onSkip={onSkip}
        />
      );

      await fireEvent.click(screen.getByText('건너뛰고 분석하기'));
      expect(onSkip).toHaveBeenCalled();
    });

    it('분석 시작하기 버튼 클릭 시 onSkip이 호출된다', async () => {
      const onSkip = vi.fn();
      render(
        <BodyAngleSelector
          capturedAngles={['front', 'side', 'back']}
          onSelectAngle={vi.fn()}
          onSkip={onSkip}
        />
      );

      await fireEvent.click(screen.getByText('분석 시작하기'));
      expect(onSkip).toHaveBeenCalled();
    });
  });

  describe('상태 표시', () => {
    it('촬영 현황 점이 표시된다', () => {
      const { container } = render(
        <BodyAngleSelector
          capturedAngles={['front', 'side']}
          onSelectAngle={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      // 촬영 현황에서 정면, 측면, 후면 표시 확인
      expect(screen.getByText('정면')).toBeInTheDocument();
      expect(screen.getByText('측면')).toBeInTheDocument();
      expect(screen.getByText('후면')).toBeInTheDocument();

      // 녹색 점 (촬영 완료)이 2개 있어야 함
      const greenDots = container.querySelectorAll('.bg-green-500');
      expect(greenDots.length).toBe(2);
    });

    it('정확도 향상 안내가 표시된다', () => {
      render(
        <BodyAngleSelector
          capturedAngles={['front']}
          onSelectAngle={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      expect(screen.getByText('정면만: 기본 분석')).toBeInTheDocument();
    });

    it('2장 촬영 시 정확도 향상 안내가 표시된다', () => {
      render(
        <BodyAngleSelector
          capturedAngles={['front', 'side']}
          onSelectAngle={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      expect(screen.getByText('2장: 정확도 약 15% 향상')).toBeInTheDocument();
    });
  });

  describe('비활성화 상태', () => {
    it('disabled가 true일 때 버튼이 비활성화된다', () => {
      render(
        <BodyAngleSelector
          capturedAngles={['front']}
          onSelectAngle={vi.fn()}
          onSkip={vi.fn()}
          disabled={true}
        />
      );

      expect(screen.getByText('측면 추가 촬영').closest('button')).toBeDisabled();
      expect(screen.getByText('후면 추가 촬영').closest('button')).toBeDisabled();
      expect(screen.getByText('건너뛰고 분석하기').closest('button')).toBeDisabled();
    });
  });
});
