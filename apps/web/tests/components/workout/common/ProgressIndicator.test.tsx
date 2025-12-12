/**
 * ProgressIndicator 컴포넌트 테스트
 * @description 온보딩 진행률 표시 컴포넌트 테스트
 * @version 1.0
 * @date 2025-12-09
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressIndicator from '@/components/workout/common/ProgressIndicator';

describe('ProgressIndicator', () => {
  describe('단계 표시', () => {
    it('현재 단계와 전체 단계를 표시한다', () => {
      render(<ProgressIndicator currentStep={3} totalSteps={7} />);

      expect(screen.getByText('3/7 단계')).toBeInTheDocument();
    });

    it('첫 번째 단계를 표시한다', () => {
      render(<ProgressIndicator currentStep={1} totalSteps={5} />);

      expect(screen.getByText('1/5 단계')).toBeInTheDocument();
    });

    it('마지막 단계를 표시한다', () => {
      render(<ProgressIndicator currentStep={7} totalSteps={7} />);

      expect(screen.getByText('7/7 단계')).toBeInTheDocument();
    });
  });

  describe('퍼센트 계산', () => {
    it('50% 진행률을 표시한다', () => {
      render(<ProgressIndicator currentStep={5} totalSteps={10} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('0% 진행률을 표시한다 (0단계)', () => {
      render(<ProgressIndicator currentStep={0} totalSteps={7} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('100% 진행률을 표시한다', () => {
      render(<ProgressIndicator currentStep={7} totalSteps={7} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('소수점을 반올림한다', () => {
      render(<ProgressIndicator currentStep={1} totalSteps={3} />);

      // 1/3 = 33.33...% -> 33%
      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('14%를 표시한다 (1/7)', () => {
      render(<ProgressIndicator currentStep={1} totalSteps={7} />);

      // 1/7 = 14.28...% -> 14%
      expect(screen.getByText('14%')).toBeInTheDocument();
    });
  });

  describe('프로그레스 바', () => {
    it('progressbar role을 가진다', () => {
      render(<ProgressIndicator currentStep={3} totalSteps={7} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('올바른 aria 속성을 가진다', () => {
      render(<ProgressIndicator currentStep={3} totalSteps={7} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '3');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '7');
    });

    it('올바른 width 스타일을 가진다', () => {
      render(<ProgressIndicator currentStep={5} totalSteps={10} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveStyle({ width: '50%' });
    });

    it('100% 진행 시 전체 width를 가진다', () => {
      render(<ProgressIndicator currentStep={7} totalSteps={7} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveStyle({ width: '100%' });
    });
  });

  describe('다양한 단계 수', () => {
    it('5단계 온보딩을 처리한다', () => {
      render(<ProgressIndicator currentStep={2} totalSteps={5} />);

      expect(screen.getByText('2/5 단계')).toBeInTheDocument();
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('10단계 온보딩을 처리한다', () => {
      render(<ProgressIndicator currentStep={7} totalSteps={10} />);

      expect(screen.getByText('7/10 단계')).toBeInTheDocument();
      expect(screen.getByText('70%')).toBeInTheDocument();
    });
  });
});
