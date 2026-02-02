/**
 * GenderSelector 컴포넌트 테스트
 *
 * K-1 성별 중립화: 성별 및 스타일 선호도 선택 컴포넌트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  GenderSelector,
  GENDER_OPTIONS,
  STYLE_OPTIONS,
} from '@/components/onboarding/GenderSelector';
import type { UserGenderProfile } from '@/lib/content/gender-adaptive';

describe('GenderSelector', () => {
  describe('렌더링', () => {
    it('컴포넌트가 렌더링됨', () => {
      render(<GenderSelector />);

      expect(screen.getByTestId('gender-selector')).toBeInTheDocument();
    });

    it('성별 선택 제목이 표시됨', () => {
      render(<GenderSelector />);

      expect(screen.getByText('성별 선택')).toBeInTheDocument();
    });

    it('성별 선택 설명이 표시됨', () => {
      render(<GenderSelector />);

      expect(
        screen.getByText('맞춤 스타일링을 위해 성별을 선택해주세요')
      ).toBeInTheDocument();
    });

    it('3개의 성별 옵션이 표시됨', () => {
      render(<GenderSelector />);

      expect(screen.getByTestId('gender-option-female')).toBeInTheDocument();
      expect(screen.getByTestId('gender-option-male')).toBeInTheDocument();
      expect(screen.getByTestId('gender-option-neutral')).toBeInTheDocument();
    });

    it('각 성별 옵션의 라벨이 표시됨', () => {
      render(<GenderSelector />);

      expect(screen.getByText('여성')).toBeInTheDocument();
      expect(screen.getByText('남성')).toBeInTheDocument();
      expect(screen.getByText('선택 안함')).toBeInTheDocument();
    });

    it('각 성별 옵션의 설명이 표시됨', () => {
      render(<GenderSelector />);

      expect(screen.getByText('여성 맞춤 스타일링')).toBeInTheDocument();
      expect(screen.getByText('남성 맞춤 스타일링')).toBeInTheDocument();
      expect(screen.getByText('모든 스타일 보기')).toBeInTheDocument();
    });

    it('아이콘 이모지가 표시됨', () => {
      render(<GenderSelector />);

      expect(screen.getByText('👩')).toBeInTheDocument();
      expect(screen.getByText('👨')).toBeInTheDocument();
      expect(screen.getByText('🌟')).toBeInTheDocument();
    });

    it('스타일 선호도가 기본적으로 숨겨져 있음', () => {
      render(<GenderSelector />);

      expect(screen.queryByText('스타일 선호도')).not.toBeInTheDocument();
    });
  });

  describe('성별 선택 (스타일 선호도 없이)', () => {
    it('성별 클릭 시 onSelect가 즉시 호출됨', () => {
      const onSelect = vi.fn();
      render(<GenderSelector onSelect={onSelect} />);

      fireEvent.click(screen.getByTestId('gender-option-female'));

      expect(onSelect).toHaveBeenCalledWith({
        gender: 'female',
        stylePreference: 'feminine',
      });
    });

    it('남성 선택 시 기본 스타일이 masculine으로 설정됨', () => {
      const onSelect = vi.fn();
      render(<GenderSelector onSelect={onSelect} />);

      fireEvent.click(screen.getByTestId('gender-option-male'));

      expect(onSelect).toHaveBeenCalledWith({
        gender: 'male',
        stylePreference: 'masculine',
      });
    });

    it('선택 안함 시 기본 스타일이 unisex로 설정됨', () => {
      const onSelect = vi.fn();
      render(<GenderSelector onSelect={onSelect} />);

      fireEvent.click(screen.getByTestId('gender-option-neutral'));

      expect(onSelect).toHaveBeenCalledWith({
        gender: 'neutral',
        stylePreference: 'unisex',
      });
    });

    it('선택된 성별 버튼에 aria-pressed="true" 설정됨', () => {
      render(<GenderSelector />);

      const femaleButton = screen.getByTestId('gender-option-female');
      expect(femaleButton).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(femaleButton);

      expect(femaleButton).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('gender-option-male')).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    });
  });

  describe('스타일 선호도 포함', () => {
    it('성별 선택 후 스타일 선호도 섹션이 표시됨', () => {
      render(<GenderSelector includeStylePreference />);

      // 성별 선택 전에는 스타일 선호도가 없음
      expect(screen.queryByText('스타일 선호도')).not.toBeInTheDocument();

      // 성별 선택
      fireEvent.click(screen.getByTestId('gender-option-female'));

      // 스타일 선호도 섹션이 표시됨
      expect(screen.getByText('스타일 선호도')).toBeInTheDocument();
      expect(
        screen.getByText('선호하는 스타일을 선택해주세요')
      ).toBeInTheDocument();
    });

    it('3개의 스타일 옵션이 표시됨', () => {
      render(<GenderSelector includeStylePreference />);
      fireEvent.click(screen.getByTestId('gender-option-female'));

      expect(screen.getByTestId('style-option-feminine')).toBeInTheDocument();
      expect(screen.getByTestId('style-option-masculine')).toBeInTheDocument();
      expect(screen.getByTestId('style-option-unisex')).toBeInTheDocument();
    });

    it('스타일 옵션 라벨이 표시됨', () => {
      render(<GenderSelector includeStylePreference />);
      fireEvent.click(screen.getByTestId('gender-option-female'));

      expect(screen.getByText('페미닌')).toBeInTheDocument();
      expect(screen.getByText('매스큘린')).toBeInTheDocument();
      expect(screen.getByText('유니섹스')).toBeInTheDocument();
    });

    it('성별 선택 시 기본 스타일이 자동 선택됨', () => {
      render(<GenderSelector includeStylePreference />);
      fireEvent.click(screen.getByTestId('gender-option-female'));

      // 여성 선택 시 기본적으로 feminine이 선택됨
      const feminineButton = screen.getByTestId('style-option-feminine');
      expect(feminineButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('스타일 선택 시 onSelect가 호출됨', () => {
      const onSelect = vi.fn();
      render(<GenderSelector includeStylePreference onSelect={onSelect} />);

      // 성별 선택
      fireEvent.click(screen.getByTestId('gender-option-female'));
      onSelect.mockClear(); // 성별 선택 시 호출된 것 무시

      // 스타일 선택
      fireEvent.click(screen.getByTestId('style-option-unisex'));

      expect(onSelect).toHaveBeenCalledWith({
        gender: 'female',
        stylePreference: 'unisex',
      });
    });

    it('스타일 선택 후 확인 버튼이 표시됨', () => {
      render(<GenderSelector includeStylePreference />);
      fireEvent.click(screen.getByTestId('gender-option-female'));
      fireEvent.click(screen.getByTestId('style-option-feminine'));

      expect(
        screen.getByTestId('gender-selector-confirm')
      ).toBeInTheDocument();
      expect(screen.getByText('선택 완료')).toBeInTheDocument();
    });

    it('확인 버튼 클릭 시 onSelect가 호출됨', () => {
      const onSelect = vi.fn();
      render(<GenderSelector includeStylePreference onSelect={onSelect} />);

      fireEvent.click(screen.getByTestId('gender-option-male'));
      fireEvent.click(screen.getByTestId('style-option-masculine'));
      onSelect.mockClear();

      fireEvent.click(screen.getByTestId('gender-selector-confirm'));

      expect(onSelect).toHaveBeenCalledWith({
        gender: 'male',
        stylePreference: 'masculine',
      });
    });
  });

  describe('초기값', () => {
    it('initialProfile로 초기 성별이 설정됨', () => {
      render(
        <GenderSelector
          initialProfile={{ gender: 'male' }}
          includeStylePreference
        />
      );

      expect(screen.getByTestId('gender-option-male')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      // 스타일 선호도 섹션도 표시됨
      expect(screen.getByText('스타일 선호도')).toBeInTheDocument();
    });

    it('initialProfile로 초기 스타일이 설정됨', () => {
      render(
        <GenderSelector
          initialProfile={{ gender: 'female', stylePreference: 'unisex' }}
          includeStylePreference
        />
      );

      expect(screen.getByTestId('style-option-unisex')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });
  });

  describe('비활성화', () => {
    it('disabled=true일 때 성별 버튼이 비활성화됨', () => {
      render(<GenderSelector disabled />);

      expect(screen.getByTestId('gender-option-female')).toBeDisabled();
      expect(screen.getByTestId('gender-option-male')).toBeDisabled();
      expect(screen.getByTestId('gender-option-neutral')).toBeDisabled();
    });

    it('disabled=true일 때 스타일 버튼이 비활성화됨', () => {
      render(
        <GenderSelector
          disabled
          initialProfile={{ gender: 'female' }}
          includeStylePreference
        />
      );

      expect(screen.getByTestId('style-option-feminine')).toBeDisabled();
      expect(screen.getByTestId('style-option-masculine')).toBeDisabled();
      expect(screen.getByTestId('style-option-unisex')).toBeDisabled();
    });

    it('disabled=true일 때 확인 버튼이 비활성화됨', () => {
      render(
        <GenderSelector
          disabled
          initialProfile={{ gender: 'female', stylePreference: 'feminine' }}
          includeStylePreference
        />
      );

      expect(screen.getByTestId('gender-selector-confirm')).toBeDisabled();
    });

    it('disabled=true일 때 클릭해도 onSelect가 호출되지 않음', () => {
      const onSelect = vi.fn();
      render(<GenderSelector disabled onSelect={onSelect} />);

      fireEvent.click(screen.getByTestId('gender-option-female'));

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('접근성', () => {
    it('성별 버튼에 aria-label이 있음', () => {
      render(<GenderSelector />);

      expect(screen.getByTestId('gender-option-female')).toHaveAttribute(
        'aria-label',
        '여성 선택'
      );
      expect(screen.getByTestId('gender-option-male')).toHaveAttribute(
        'aria-label',
        '남성 선택'
      );
      expect(screen.getByTestId('gender-option-neutral')).toHaveAttribute(
        'aria-label',
        '선택 안함 선택'
      );
    });

    it('스타일 버튼에 aria-label이 있음', () => {
      render(<GenderSelector includeStylePreference />);
      fireEvent.click(screen.getByTestId('gender-option-female'));

      expect(screen.getByTestId('style-option-feminine')).toHaveAttribute(
        'aria-label',
        '페미닌 스타일 선택'
      );
      expect(screen.getByTestId('style-option-masculine')).toHaveAttribute(
        'aria-label',
        '매스큘린 스타일 선택'
      );
      expect(screen.getByTestId('style-option-unisex')).toHaveAttribute(
        'aria-label',
        '유니섹스 스타일 선택'
      );
    });

    it('아이콘 이미지에 aria-hidden이 있음', () => {
      render(<GenderSelector />);

      const icons = screen.getAllByRole('img', { hidden: true });
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('커스텀 className', () => {
    it('className이 적용됨', () => {
      render(<GenderSelector className="custom-class" />);

      expect(screen.getByTestId('gender-selector')).toHaveClass('custom-class');
    });
  });

  describe('데이터 옵션 상수', () => {
    it('GENDER_OPTIONS에 3개의 옵션이 있음', () => {
      expect(GENDER_OPTIONS).toHaveLength(3);
    });

    it('GENDER_OPTIONS에 필수 필드가 있음', () => {
      GENDER_OPTIONS.forEach((option) => {
        expect(option.value).toBeDefined();
        expect(option.label).toBeDefined();
        expect(option.description).toBeDefined();
        expect(option.icon).toBeDefined();
      });
    });

    it('STYLE_OPTIONS에 3개의 옵션이 있음', () => {
      expect(STYLE_OPTIONS).toHaveLength(3);
    });

    it('STYLE_OPTIONS에 필수 필드가 있음', () => {
      STYLE_OPTIONS.forEach((option) => {
        expect(option.value).toBeDefined();
        expect(option.label).toBeDefined();
        expect(option.description).toBeDefined();
      });
    });
  });
});
