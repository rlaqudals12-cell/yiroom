/**
 * N-1 WaterInputSheet 컴포넌트 테스트
 * Task 2.9: 수분 섭취 입력 UI
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WaterInputSheet from '@/components/nutrition/WaterInputSheet';

describe('WaterInputSheet', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onAdd: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('isOpen이 false일 때 렌더링하지 않는다', () => {
      render(<WaterInputSheet {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('water-input-sheet')).not.toBeInTheDocument();
    });

    it('isOpen이 true일 때 시트를 렌더링한다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      expect(screen.getByTestId('water-input-sheet')).toBeInTheDocument();
      expect(screen.getByText('수분 섭취 기록')).toBeInTheDocument();
    });

    it('오버레이를 렌더링한다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      expect(screen.getByTestId('water-input-overlay')).toBeInTheDocument();
    });

    it('닫기 버튼을 렌더링한다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      expect(screen.getByTestId('close-button')).toBeInTheDocument();
    });
  });

  describe('음료 종류 선택', () => {
    it('6가지 음료 종류 버튼을 렌더링한다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      expect(screen.getByTestId('drink-type-water')).toBeInTheDocument();
      expect(screen.getByTestId('drink-type-tea')).toBeInTheDocument();
      expect(screen.getByTestId('drink-type-coffee')).toBeInTheDocument();
      expect(screen.getByTestId('drink-type-juice')).toBeInTheDocument();
      expect(screen.getByTestId('drink-type-soda')).toBeInTheDocument();
      expect(screen.getByTestId('drink-type-other')).toBeInTheDocument();
    });

    it('기본적으로 물이 선택되어 있다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      const waterButton = screen.getByTestId('drink-type-water');
      expect(waterButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('다른 음료를 선택할 수 있다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      fireEvent.click(screen.getByTestId('drink-type-coffee'));

      const coffeeButton = screen.getByTestId('drink-type-coffee');
      expect(coffeeButton).toHaveAttribute('aria-pressed', 'true');

      const waterButton = screen.getByTestId('drink-type-water');
      expect(waterButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('커피 선택 시 수분 흡수율 안내를 표시한다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      fireEvent.click(screen.getByTestId('drink-type-coffee'));

      expect(screen.getByText(/수분 흡수율: 80%/)).toBeInTheDocument();
    });
  });

  describe('양 선택', () => {
    it('4개의 프리셋 버튼을 렌더링한다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      expect(screen.getByTestId('amount-preset-250')).toBeInTheDocument();
      expect(screen.getByTestId('amount-preset-500')).toBeInTheDocument();
      expect(screen.getByTestId('amount-preset-350')).toBeInTheDocument();
      expect(screen.getByTestId('amount-preset-1000')).toBeInTheDocument();
    });

    it('기본적으로 250ml가 선택되어 있다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      // 요약 영역에서 250ml 표시 확인
      expect(screen.getByText('250 ml')).toBeInTheDocument();
    });

    it('다른 프리셋을 선택할 수 있다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      fireEvent.click(screen.getByTestId('amount-preset-500'));

      expect(screen.getByText('500 ml')).toBeInTheDocument();
    });

    it('직접 입력 필드가 있다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      expect(screen.getByTestId('custom-amount-input')).toBeInTheDocument();
    });

    it('직접 입력하면 커스텀 양이 적용된다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      const input = screen.getByTestId('custom-amount-input');
      fireEvent.change(input, { target: { value: '750' } });

      expect(screen.getByText('750 ml')).toBeInTheDocument();
    });

    it('숫자만 입력할 수 있다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      const input = screen.getByTestId('custom-amount-input');
      fireEvent.change(input, { target: { value: 'abc123def' } });

      expect(input).toHaveValue('123');
    });
  });

  describe('실제 수분량 계산', () => {
    it('물 선택 시 실제 수분량을 표시하지 않는다 (100%)', () => {
      render(<WaterInputSheet {...defaultProps} />);

      // 물은 100%이므로 "실제 수분" 표시 안 함
      expect(screen.queryByText('실제 수분')).not.toBeInTheDocument();
    });

    it('커피 선택 시 실제 수분량을 표시한다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      fireEvent.click(screen.getByTestId('drink-type-coffee'));
      fireEvent.click(screen.getByTestId('amount-preset-500'));

      // 커피 500ml * 0.8 = 400ml
      expect(screen.getByText('실제 수분')).toBeInTheDocument();
      expect(screen.getByText('400 ml')).toBeInTheDocument();
    });
  });

  describe('추가 버튼', () => {
    it('추가 버튼을 렌더링한다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      expect(screen.getByTestId('add-water-button')).toBeInTheDocument();
    });

    it('양이 선택되면 버튼 텍스트가 변경된다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      expect(screen.getByText('250ml 추가')).toBeInTheDocument();
    });

    it('클릭 시 onAdd를 올바른 파라미터로 호출한다', () => {
      const onAdd = vi.fn();
      render(<WaterInputSheet {...defaultProps} onAdd={onAdd} />);

      // 기본값: 물 250ml
      fireEvent.click(screen.getByTestId('add-water-button'));

      expect(onAdd).toHaveBeenCalledWith(250, 'water', 250);
    });

    it('커피 500ml 선택 후 클릭 시 올바른 파라미터로 호출한다', () => {
      const onAdd = vi.fn();
      render(<WaterInputSheet {...defaultProps} onAdd={onAdd} />);

      fireEvent.click(screen.getByTestId('drink-type-coffee'));
      fireEvent.click(screen.getByTestId('amount-preset-500'));
      fireEvent.click(screen.getByTestId('add-water-button'));

      // 커피 500ml, 실제 수분 400ml (0.8 factor)
      expect(onAdd).toHaveBeenCalledWith(500, 'coffee', 400);
    });

    it('양이 0일 때 버튼이 비활성화된다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      // 직접 입력에서 0으로 설정
      const input = screen.getByTestId('custom-amount-input');
      fireEvent.change(input, { target: { value: '0' } });

      const button = screen.getByTestId('add-water-button');
      expect(button).toBeDisabled();
    });

    it('저장 중일 때 버튼이 비활성화되고 로딩 표시된다', () => {
      render(<WaterInputSheet {...defaultProps} isSaving={true} />);

      const button = screen.getByTestId('add-water-button');
      expect(button).toBeDisabled();
      expect(screen.getByText('저장 중...')).toBeInTheDocument();
    });
  });

  describe('닫기 동작', () => {
    it('닫기 버튼 클릭 시 onClose를 호출한다', () => {
      const onClose = vi.fn();
      render(<WaterInputSheet {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('close-button'));

      expect(onClose).toHaveBeenCalled();
    });

    it('오버레이 클릭 시 onClose를 호출한다', () => {
      const onClose = vi.fn();
      render(<WaterInputSheet {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('water-input-overlay'));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('접근성', () => {
    it('dialog role이 있다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('aria-modal이 true다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('aria-labelledby가 제목을 참조한다', () => {
      render(<WaterInputSheet {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'water-input-title');
      expect(screen.getByText('수분 섭취 기록')).toHaveAttribute(
        'id',
        'water-input-title'
      );
    });
  });
});
