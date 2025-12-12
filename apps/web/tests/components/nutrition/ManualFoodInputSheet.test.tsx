/**
 * N-1 ManualFoodInputSheet 컴포넌트 테스트
 * Task 2.11: 음식 직접 입력 UI
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ManualFoodInputSheet from '@/components/nutrition/ManualFoodInputSheet';

describe('ManualFoodInputSheet', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('isOpen이 false일 때 렌더링하지 않는다', () => {
      render(<ManualFoodInputSheet {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('manual-food-input-sheet')).not.toBeInTheDocument();
    });

    it('isOpen이 true일 때 시트를 렌더링한다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      expect(screen.getByTestId('manual-food-input-sheet')).toBeInTheDocument();
      expect(screen.getByText('음식 직접 입력')).toBeInTheDocument();
    });

    it('오버레이를 렌더링한다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      expect(screen.getByTestId('manual-food-input-overlay')).toBeInTheDocument();
    });

    it('닫기 버튼을 렌더링한다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      expect(screen.getByTestId('close-button')).toBeInTheDocument();
    });
  });

  describe('음식명 입력', () => {
    it('음식명 입력 필드가 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      expect(screen.getByTestId('food-name-input')).toBeInTheDocument();
      expect(screen.getByLabelText('음식명')).toBeInTheDocument();
    });

    it('음식명을 입력할 수 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      const input = screen.getByTestId('food-name-input');
      fireEvent.change(input, { target: { value: '김치찌개' } });

      expect(input).toHaveValue('김치찌개');
    });

    it('음식명이 비어있으면 저장 버튼이 비활성화된다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      const saveButton = screen.getByTestId('save-food-button');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('칼로리 입력', () => {
    it('칼로리 입력 필드가 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      expect(screen.getByTestId('calories-input')).toBeInTheDocument();
    });

    it('칼로리를 입력할 수 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      const input = screen.getByTestId('calories-input');
      fireEvent.change(input, { target: { value: '350' } });

      expect(input).toHaveValue('350');
    });

    it('숫자만 입력할 수 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      const input = screen.getByTestId('calories-input');
      fireEvent.change(input, { target: { value: 'abc123def' } });

      expect(input).toHaveValue('123');
    });
  });

  describe('영양소 입력', () => {
    it('단백질 입력 필드가 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      expect(screen.getByTestId('protein-input')).toBeInTheDocument();
    });

    it('탄수화물 입력 필드가 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      expect(screen.getByTestId('carbs-input')).toBeInTheDocument();
    });

    it('지방 입력 필드가 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      expect(screen.getByTestId('fat-input')).toBeInTheDocument();
    });

    it('영양소를 입력할 수 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      const proteinInput = screen.getByTestId('protein-input');
      const carbsInput = screen.getByTestId('carbs-input');
      const fatInput = screen.getByTestId('fat-input');

      fireEvent.change(proteinInput, { target: { value: '15' } });
      fireEvent.change(carbsInput, { target: { value: '30' } });
      fireEvent.change(fatInput, { target: { value: '10' } });

      expect(proteinInput).toHaveValue('15');
      expect(carbsInput).toHaveValue('30');
      expect(fatInput).toHaveValue('10');
    });
  });

  describe('식사 타입 선택', () => {
    it('4가지 식사 타입 버튼을 렌더링한다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      expect(screen.getByTestId('meal-type-breakfast')).toBeInTheDocument();
      expect(screen.getByTestId('meal-type-lunch')).toBeInTheDocument();
      expect(screen.getByTestId('meal-type-dinner')).toBeInTheDocument();
      expect(screen.getByTestId('meal-type-snack')).toBeInTheDocument();
    });

    it('기본적으로 점심이 선택되어 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      const lunchButton = screen.getByTestId('meal-type-lunch');
      expect(lunchButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('다른 식사 타입을 선택할 수 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      fireEvent.click(screen.getByTestId('meal-type-breakfast'));

      const breakfastButton = screen.getByTestId('meal-type-breakfast');
      expect(breakfastButton).toHaveAttribute('aria-pressed', 'true');

      const lunchButton = screen.getByTestId('meal-type-lunch');
      expect(lunchButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('defaultMealType prop으로 기본 식사 타입을 설정할 수 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} defaultMealType="dinner" />);

      const dinnerButton = screen.getByTestId('meal-type-dinner');
      expect(dinnerButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('섭취량 입력', () => {
    it('섭취량 입력 필드가 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      expect(screen.getByTestId('portion-input')).toBeInTheDocument();
    });

    it('기본 섭취량은 1인분이다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      const input = screen.getByTestId('portion-input');
      expect(input).toHaveValue('1인분');
    });

    it('섭취량을 변경할 수 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      const input = screen.getByTestId('portion-input');
      fireEvent.change(input, { target: { value: '반 공기' } });

      expect(input).toHaveValue('반 공기');
    });
  });

  describe('신호등 색상 선택', () => {
    it('3가지 신호등 색상 버튼을 렌더링한다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      expect(screen.getByTestId('traffic-light-green')).toBeInTheDocument();
      expect(screen.getByTestId('traffic-light-yellow')).toBeInTheDocument();
      expect(screen.getByTestId('traffic-light-red')).toBeInTheDocument();
    });

    it('기본적으로 노란색이 선택되어 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      const yellowButton = screen.getByTestId('traffic-light-yellow');
      expect(yellowButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('다른 신호등 색상을 선택할 수 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      fireEvent.click(screen.getByTestId('traffic-light-green'));

      const greenButton = screen.getByTestId('traffic-light-green');
      expect(greenButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('자주 먹는 음식 저장', () => {
    it('자주 먹는 음식으로 저장 체크박스가 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      expect(screen.getByTestId('save-as-favorite-checkbox')).toBeInTheDocument();
      expect(screen.getByText('자주 먹는 음식으로 저장')).toBeInTheDocument();
    });

    it('체크박스를 클릭할 수 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      const checkbox = screen.getByTestId('save-as-favorite-checkbox');
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);

      expect(checkbox).toBeChecked();
    });
  });

  describe('저장 버튼', () => {
    it('저장 버튼을 렌더링한다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      expect(screen.getByTestId('save-food-button')).toBeInTheDocument();
    });

    it('음식명이 입력되면 저장 버튼이 활성화된다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      const nameInput = screen.getByTestId('food-name-input');
      fireEvent.change(nameInput, { target: { value: '김치찌개' } });

      const saveButton = screen.getByTestId('save-food-button');
      expect(saveButton).not.toBeDisabled();
    });

    it('클릭 시 onSave를 올바른 파라미터로 호출한다', async () => {
      const onSave = vi.fn();
      render(<ManualFoodInputSheet {...defaultProps} onSave={onSave} />);

      // 음식명 입력
      fireEvent.change(screen.getByTestId('food-name-input'), {
        target: { value: '김치찌개' },
      });

      // 칼로리 입력
      fireEvent.change(screen.getByTestId('calories-input'), {
        target: { value: '350' },
      });

      // 저장 버튼 클릭
      fireEvent.click(screen.getByTestId('save-food-button'));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith({
          name: '김치찌개',
          calories: 350,
          protein: 0,
          carbs: 0,
          fat: 0,
          mealType: 'lunch',
          portion: '1인분',
          trafficLight: 'yellow',
          saveAsFavorite: false,
        });
      });
    });

    it('모든 영양소를 포함하여 onSave를 호출한다', async () => {
      const onSave = vi.fn();
      render(<ManualFoodInputSheet {...defaultProps} onSave={onSave} />);

      // 모든 필드 입력
      fireEvent.change(screen.getByTestId('food-name-input'), {
        target: { value: '닭가슴살 샐러드' },
      });
      fireEvent.change(screen.getByTestId('calories-input'), {
        target: { value: '250' },
      });
      fireEvent.change(screen.getByTestId('protein-input'), {
        target: { value: '30' },
      });
      fireEvent.change(screen.getByTestId('carbs-input'), {
        target: { value: '15' },
      });
      fireEvent.change(screen.getByTestId('fat-input'), {
        target: { value: '8' },
      });
      fireEvent.click(screen.getByTestId('meal-type-dinner'));
      fireEvent.change(screen.getByTestId('portion-input'), {
        target: { value: '1.5인분' },
      });
      fireEvent.click(screen.getByTestId('traffic-light-green'));
      fireEvent.click(screen.getByTestId('save-as-favorite-checkbox'));

      // 저장
      fireEvent.click(screen.getByTestId('save-food-button'));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith({
          name: '닭가슴살 샐러드',
          calories: 250,
          protein: 30,
          carbs: 15,
          fat: 8,
          mealType: 'dinner',
          portion: '1.5인분',
          trafficLight: 'green',
          saveAsFavorite: true,
        });
      });
    });

    it('저장 중일 때 버튼이 비활성화되고 로딩 표시된다', () => {
      render(<ManualFoodInputSheet {...defaultProps} isSaving={true} />);

      const button = screen.getByTestId('save-food-button');
      expect(button).toBeDisabled();
      expect(screen.getByText('저장 중...')).toBeInTheDocument();
    });
  });

  describe('닫기 동작', () => {
    it('닫기 버튼 클릭 시 onClose를 호출한다', () => {
      const onClose = vi.fn();
      render(<ManualFoodInputSheet {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('close-button'));

      expect(onClose).toHaveBeenCalled();
    });

    it('오버레이 클릭 시 onClose를 호출한다', () => {
      const onClose = vi.fn();
      render(<ManualFoodInputSheet {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('manual-food-input-overlay'));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('접근성', () => {
    it('dialog role이 있다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('aria-modal이 true다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('aria-labelledby가 제목을 참조한다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'manual-food-input-title');
      expect(screen.getByText('음식 직접 입력')).toHaveAttribute(
        'id',
        'manual-food-input-title'
      );
    });
  });

  describe('칼로리 자동 계산 힌트', () => {
    it('영양소 입력 시 예상 칼로리를 표시한다', () => {
      render(<ManualFoodInputSheet {...defaultProps} />);

      // 영양소 입력 (단백질 10g, 탄수화물 20g, 지방 5g)
      // 예상 칼로리: (10*4) + (20*4) + (5*9) = 40 + 80 + 45 = 165kcal
      fireEvent.change(screen.getByTestId('protein-input'), {
        target: { value: '10' },
      });
      fireEvent.change(screen.getByTestId('carbs-input'), {
        target: { value: '20' },
      });
      fireEvent.change(screen.getByTestId('fat-input'), {
        target: { value: '5' },
      });

      expect(screen.getByText(/예상.*165.*kcal/i)).toBeInTheDocument();
    });
  });
});
