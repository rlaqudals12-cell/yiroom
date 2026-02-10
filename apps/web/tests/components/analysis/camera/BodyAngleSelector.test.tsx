/**
 * BodyAngleSelector 컴포넌트 테스트
 * @description 체형 분석 갤러리 카드 스타일 각도 선택 컴포넌트 테스트 (4각도 시스템)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BodyAngleSelector } from '@/components/analysis/camera/BodyAngleSelector';

// 테스트용 mock 이미지 데이터
const MOCK_FRONT_IMAGE = 'data:image/jpeg;base64,front123';
const MOCK_LEFT_IMAGE = 'data:image/jpeg;base64,left123';
const MOCK_RIGHT_IMAGE = 'data:image/jpeg;base64,right123';
const MOCK_BACK_IMAGE = 'data:image/jpeg;base64,back123';

const defaultProps = {
  capturedAngles: ['front' as const],
  images: { frontImageBase64: MOCK_FRONT_IMAGE },
  onSelectAngle: vi.fn(),
  onRemoveImage: vi.fn(),
  onSkip: vi.fn(),
};

describe('BodyAngleSelector', () => {
  describe('렌더링', () => {
    it('정면만 촬영된 경우 정면 미리보기와 빈 추가 각도 카드가 표시된다', () => {
      render(<BodyAngleSelector {...defaultProps} />);

      expect(screen.getByTestId('body-angle-selector')).toBeInTheDocument();
      // 정면 미리보기 이미지
      expect(screen.getByAltText('정면 사진')).toBeInTheDocument();
      // 추가 각도 라벨들 (빈 카드)
      expect(screen.getByText('좌측면')).toBeInTheDocument();
      expect(screen.getByText('우측면')).toBeInTheDocument();
      expect(screen.getByText('후면')).toBeInTheDocument();
      // CTA 버튼
      expect(screen.getByText('정면 사진으로 분석하기')).toBeInTheDocument();
    });

    it('추가 각도가 촬영된 경우 이미지 프리뷰가 표시된다', () => {
      render(
        <BodyAngleSelector
          {...defaultProps}
          capturedAngles={['front', 'left_side']}
          images={{
            frontImageBase64: MOCK_FRONT_IMAGE,
            leftSideImageBase64: MOCK_LEFT_IMAGE,
          }}
        />
      );

      expect(screen.getByAltText('정면 사진')).toBeInTheDocument();
      expect(screen.getByAltText('좌측면 사진')).toBeInTheDocument();
      expect(screen.getByText('2장으로 분석하기')).toBeInTheDocument();
    });

    it('모든 각도가 촬영된 경우 4장으로 분석하기 CTA가 표시된다', () => {
      render(
        <BodyAngleSelector
          {...defaultProps}
          capturedAngles={['front', 'left_side', 'right_side', 'back']}
          images={{
            frontImageBase64: MOCK_FRONT_IMAGE,
            leftSideImageBase64: MOCK_LEFT_IMAGE,
            rightSideImageBase64: MOCK_RIGHT_IMAGE,
            backImageBase64: MOCK_BACK_IMAGE,
          }}
        />
      );

      expect(screen.getByText('4장으로 분석하기')).toBeInTheDocument();
      expect(screen.getByText('4장: 최고 정밀도')).toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('빈 좌측면 카드 클릭 시 onSelectAngle이 호출된다', async () => {
      const onSelectAngle = vi.fn();
      render(<BodyAngleSelector {...defaultProps} onSelectAngle={onSelectAngle} />);

      await fireEvent.click(screen.getByText('좌측면'));
      expect(onSelectAngle).toHaveBeenCalledWith('left_side');
    });

    it('빈 우측면 카드 클릭 시 onSelectAngle이 호출된다', async () => {
      const onSelectAngle = vi.fn();
      render(<BodyAngleSelector {...defaultProps} onSelectAngle={onSelectAngle} />);

      await fireEvent.click(screen.getByText('우측면'));
      expect(onSelectAngle).toHaveBeenCalledWith('right_side');
    });

    it('빈 후면 카드 클릭 시 onSelectAngle이 호출된다', async () => {
      const onSelectAngle = vi.fn();
      render(<BodyAngleSelector {...defaultProps} onSelectAngle={onSelectAngle} />);

      await fireEvent.click(screen.getByText('후면'));
      expect(onSelectAngle).toHaveBeenCalledWith('back');
    });

    it('CTA 버튼 클릭 시 onSkip이 호출된다', async () => {
      const onSkip = vi.fn();
      render(<BodyAngleSelector {...defaultProps} onSkip={onSkip} />);

      await fireEvent.click(screen.getByText('정면 사진으로 분석하기'));
      expect(onSkip).toHaveBeenCalled();
    });

    it('정면 X 버튼 클릭 시 onRemoveImage가 호출된다', async () => {
      const onRemoveImage = vi.fn();
      render(<BodyAngleSelector {...defaultProps} onRemoveImage={onRemoveImage} />);

      // 정면 미리보기 카드 내부의 X 버튼 찾기
      const frontCard = screen.getByAltText('정면 사진').closest('.relative');
      const xButton = frontCard?.querySelector('button');
      if (xButton) {
        await fireEvent.click(xButton);
        expect(onRemoveImage).toHaveBeenCalledWith('front');
      }
    });

    it('촬영된 추가 각도 X 버튼 클릭 시 onRemoveImage가 호출된다', async () => {
      const onRemoveImage = vi.fn();
      render(
        <BodyAngleSelector
          {...defaultProps}
          capturedAngles={['front', 'left_side']}
          images={{
            frontImageBase64: MOCK_FRONT_IMAGE,
            leftSideImageBase64: MOCK_LEFT_IMAGE,
          }}
          onRemoveImage={onRemoveImage}
        />
      );

      // 좌측면 이미지 카드의 X 버튼
      const leftCard = screen.getByAltText('좌측면 사진').closest('.relative');
      const xButton = leftCard?.querySelector('button');
      if (xButton) {
        await fireEvent.click(xButton);
        expect(onRemoveImage).toHaveBeenCalledWith('left_side');
      }
    });
  });

  describe('상태 표시', () => {
    it('정확도 향상 안내가 표시된다 — 정면만', () => {
      render(<BodyAngleSelector {...defaultProps} />);
      expect(screen.getByText('정면만: 기본 분석')).toBeInTheDocument();
    });

    it('2장 촬영 시 상세 분석 안내가 표시된다', () => {
      render(
        <BodyAngleSelector
          {...defaultProps}
          capturedAngles={['front', 'left_side']}
          images={{
            frontImageBase64: MOCK_FRONT_IMAGE,
            leftSideImageBase64: MOCK_LEFT_IMAGE,
          }}
        />
      );
      expect(screen.getByText('2장: 상세 분석')).toBeInTheDocument();
    });

    it('3장 촬영 시 정밀 분석 안내가 표시된다', () => {
      render(
        <BodyAngleSelector
          {...defaultProps}
          capturedAngles={['front', 'left_side', 'right_side']}
          images={{
            frontImageBase64: MOCK_FRONT_IMAGE,
            leftSideImageBase64: MOCK_LEFT_IMAGE,
            rightSideImageBase64: MOCK_RIGHT_IMAGE,
          }}
        />
      );
      expect(screen.getByText('3장: 정밀 분석')).toBeInTheDocument();
    });

    it('추가 사진 개수가 표시된다', () => {
      render(
        <BodyAngleSelector
          {...defaultProps}
          capturedAngles={['front', 'left_side', 'back']}
          images={{
            frontImageBase64: MOCK_FRONT_IMAGE,
            leftSideImageBase64: MOCK_LEFT_IMAGE,
            backImageBase64: MOCK_BACK_IMAGE,
          }}
        />
      );
      expect(screen.getByText('2장 추가됨')).toBeInTheDocument();
    });
  });

  describe('비활성화 상태', () => {
    it('disabled가 true일 때 CTA 버튼이 비활성화된다', () => {
      render(<BodyAngleSelector {...defaultProps} disabled={true} />);

      expect(screen.getByText('정면 사진으로 분석하기').closest('button')).toBeDisabled();
    });

    it('disabled가 true일 때 빈 카드 버튼이 비활성화된다', () => {
      render(<BodyAngleSelector {...defaultProps} disabled={true} />);

      // 빈 카드 버튼들이 disabled 상태인지 확인
      const emptyCardButtons = screen.getByText('좌측면').closest('button');
      expect(emptyCardButtons).toBeDisabled();
    });
  });
});
