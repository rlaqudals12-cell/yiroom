import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BmiCalculator } from '@/components/body/BmiCalculator';
import type { BMIResult } from '@/lib/body/bmi-calculator';

describe('BmiCalculator', () => {
  it('renders without crashing', () => {
    render(<BmiCalculator />);
    expect(screen.getByTestId('bmi-calculator')).toBeInTheDocument();
  });

  it('displays title and description', () => {
    render(<BmiCalculator />);
    expect(screen.getByText('BMI 계산기')).toBeInTheDocument();
    expect(screen.getByText(/아시아 기준/)).toBeInTheDocument();
  });

  it('displays height and weight input fields', () => {
    render(<BmiCalculator />);
    expect(screen.getByTestId('height-input')).toBeInTheDocument();
    expect(screen.getByTestId('weight-input')).toBeInTheDocument();
  });

  it('displays calculate button', () => {
    render(<BmiCalculator />);
    expect(screen.getByTestId('calculate-button')).toBeInTheDocument();
    expect(screen.getByText('계산하기')).toBeInTheDocument();
  });

  it('calculates BMI correctly for normal weight', async () => {
    render(<BmiCalculator />);

    const heightInput = screen.getByTestId('height-input');
    const weightInput = screen.getByTestId('weight-input');
    const calculateButton = screen.getByTestId('calculate-button');

    fireEvent.change(heightInput, { target: { value: '170' } });
    fireEvent.change(weightInput, { target: { value: '65' } });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByTestId('bmi-result')).toBeInTheDocument();
    });

    // BMI = 65 / (1.7 * 1.7) = 22.5 (정상)
    expect(screen.getByText('22.5')).toBeInTheDocument();
    expect(screen.getByText('정상')).toBeInTheDocument();
  });

  it('calculates BMI correctly for underweight', async () => {
    render(<BmiCalculator />);

    const heightInput = screen.getByTestId('height-input');
    const weightInput = screen.getByTestId('weight-input');
    const calculateButton = screen.getByTestId('calculate-button');

    fireEvent.change(heightInput, { target: { value: '175' } });
    fireEvent.change(weightInput, { target: { value: '50' } });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByTestId('bmi-result')).toBeInTheDocument();
    });

    // BMI = 50 / (1.75 * 1.75) = 16.3 (저체중)
    expect(screen.getByText('저체중')).toBeInTheDocument();
  });

  it('calculates BMI correctly for overweight', async () => {
    render(<BmiCalculator />);

    const heightInput = screen.getByTestId('height-input');
    const weightInput = screen.getByTestId('weight-input');
    const calculateButton = screen.getByTestId('calculate-button');

    fireEvent.change(heightInput, { target: { value: '170' } });
    fireEvent.change(weightInput, { target: { value: '70' } });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByTestId('bmi-result')).toBeInTheDocument();
    });

    // BMI = 70 / (1.7 * 1.7) = 24.2 (과체중)
    expect(screen.getByText('과체중')).toBeInTheDocument();
  });

  it('shows error for invalid height (below range)', async () => {
    render(<BmiCalculator />);

    const heightInput = screen.getByTestId('height-input');
    const weightInput = screen.getByTestId('weight-input');
    const calculateButton = screen.getByTestId('calculate-button');

    fireEvent.change(heightInput, { target: { value: '50' } });
    fireEvent.change(weightInput, { target: { value: '65' } });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    expect(screen.getByText(/100~250cm/)).toBeInTheDocument();
  });

  it('shows error for invalid weight (below range)', async () => {
    render(<BmiCalculator />);

    const heightInput = screen.getByTestId('height-input');
    const weightInput = screen.getByTestId('weight-input');
    const calculateButton = screen.getByTestId('calculate-button');

    fireEvent.change(heightInput, { target: { value: '170' } });
    fireEvent.change(weightInput, { target: { value: '10' } });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    expect(screen.getByText(/20~300kg/)).toBeInTheDocument();
  });

  it('shows error for empty height', async () => {
    render(<BmiCalculator />);

    const weightInput = screen.getByTestId('weight-input');
    const calculateButton = screen.getByTestId('calculate-button');

    fireEvent.change(weightInput, { target: { value: '65' } });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    expect(screen.getByText(/올바른 키를 입력/)).toBeInTheDocument();
  });

  it('shows error for empty weight', async () => {
    render(<BmiCalculator />);

    const heightInput = screen.getByTestId('height-input');
    const calculateButton = screen.getByTestId('calculate-button');

    fireEvent.change(heightInput, { target: { value: '170' } });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    expect(screen.getByText(/올바른 체중을 입력/)).toBeInTheDocument();
  });

  it('calls onResult callback when calculation succeeds', async () => {
    const onResult = vi.fn();
    render(<BmiCalculator onResult={onResult} />);

    const heightInput = screen.getByTestId('height-input');
    const weightInput = screen.getByTestId('weight-input');
    const calculateButton = screen.getByTestId('calculate-button');

    fireEvent.change(heightInput, { target: { value: '170' } });
    fireEvent.change(weightInput, { target: { value: '65' } });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(onResult).toHaveBeenCalled();
    });

    const result: BMIResult = onResult.mock.calls[0][0];
    expect(result.value).toBeCloseTo(22.5, 1);
    expect(result.category).toBe('normal');
    expect(result.categoryLabel).toBe('정상');
  });

  it('accepts initial height and weight values', () => {
    render(<BmiCalculator initialHeight={175} initialWeight={70} />);

    const heightInput = screen.getByTestId('height-input') as HTMLInputElement;
    const weightInput = screen.getByTestId('weight-input') as HTMLInputElement;

    expect(heightInput.value).toBe('175');
    expect(weightInput.value).toBe('70');
  });

  it('displays healthy weight range', async () => {
    render(<BmiCalculator />);

    const heightInput = screen.getByTestId('height-input');
    const weightInput = screen.getByTestId('weight-input');
    const calculateButton = screen.getByTestId('calculate-button');

    fireEvent.change(heightInput, { target: { value: '170' } });
    fireEvent.change(weightInput, { target: { value: '65' } });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByTestId('bmi-result')).toBeInTheDocument();
    });

    // 건강 체중 범위가 표시되어야 함
    expect(screen.getByText(/건강 체중 범위/)).toBeInTheDocument();
  });

  it('displays weight difference message for overweight', async () => {
    render(<BmiCalculator />);

    const heightInput = screen.getByTestId('height-input');
    const weightInput = screen.getByTestId('weight-input');
    const calculateButton = screen.getByTestId('calculate-button');

    fireEvent.change(heightInput, { target: { value: '170' } });
    fireEvent.change(weightInput, { target: { value: '80' } });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByTestId('bmi-result')).toBeInTheDocument();
    });

    // 감량 권장 메시지
    expect(screen.getByText(/감량 권장/)).toBeInTheDocument();
  });

  it('displays weight difference message for underweight', async () => {
    render(<BmiCalculator />);

    const heightInput = screen.getByTestId('height-input');
    const weightInput = screen.getByTestId('weight-input');
    const calculateButton = screen.getByTestId('calculate-button');

    fireEvent.change(heightInput, { target: { value: '175' } });
    fireEvent.change(weightInput, { target: { value: '50' } });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByTestId('bmi-result')).toBeInTheDocument();
    });

    // 증량 권장 메시지
    expect(screen.getByText(/증량 권장/)).toBeInTheDocument();
  });

  it('displays disclaimer text before calculation', () => {
    render(<BmiCalculator />);
    expect(screen.getByText(/BMI는 참고 지표/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<BmiCalculator className="custom-class" />);
    const calculator = screen.getByTestId('bmi-calculator');
    expect(calculator).toHaveClass('custom-class');
  });

  it('shows reset button after calculation', async () => {
    render(<BmiCalculator />);

    const heightInput = screen.getByTestId('height-input');
    const weightInput = screen.getByTestId('weight-input');
    const calculateButton = screen.getByTestId('calculate-button');

    // 계산 전에는 초기화 버튼이 없음
    expect(screen.queryByText('초기화')).not.toBeInTheDocument();

    fireEvent.change(heightInput, { target: { value: '170' } });
    fireEvent.change(weightInput, { target: { value: '65' } });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByTestId('bmi-result')).toBeInTheDocument();
    });

    // 계산 후에는 초기화 버튼이 있음
    expect(screen.getByText('초기화')).toBeInTheDocument();
  });

  it('resets form when reset button is clicked', async () => {
    render(<BmiCalculator />);

    const heightInput = screen.getByTestId('height-input') as HTMLInputElement;
    const weightInput = screen.getByTestId('weight-input') as HTMLInputElement;
    const calculateButton = screen.getByTestId('calculate-button');

    fireEvent.change(heightInput, { target: { value: '170' } });
    fireEvent.change(weightInput, { target: { value: '65' } });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByTestId('bmi-result')).toBeInTheDocument();
    });

    const resetButton = screen.getByText('초기화');
    fireEvent.click(resetButton);

    // 입력값과 결과가 초기화됨
    expect(heightInput.value).toBe('');
    expect(weightInput.value).toBe('');
    expect(screen.queryByTestId('bmi-result')).not.toBeInTheDocument();
  });
});
