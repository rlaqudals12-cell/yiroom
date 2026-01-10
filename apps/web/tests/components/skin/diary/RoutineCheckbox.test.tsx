import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RoutineCheckbox from '@/components/skin/diary/RoutineCheckbox';

describe('RoutineCheckbox', () => {
  it('renders with test id', () => {
    render(
      <RoutineCheckbox
        morningCompleted={false}
        eveningCompleted={false}
        specialTreatments={[]}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('routine-checkbox')).toBeInTheDocument();
  });

  it('displays morning routine checkbox', () => {
    render(
      <RoutineCheckbox
        morningCompleted={false}
        eveningCompleted={false}
        specialTreatments={[]}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('morning-routine-checkbox')).toBeInTheDocument();
    expect(screen.getByText('아침 루틴 완료')).toBeInTheDocument();
  });

  it('displays evening routine checkbox', () => {
    render(
      <RoutineCheckbox
        morningCompleted={false}
        eveningCompleted={false}
        specialTreatments={[]}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByTestId('evening-routine-checkbox')).toBeInTheDocument();
    expect(screen.getByText('저녁 루틴 완료')).toBeInTheDocument();
  });

  it('shows morning completed state', () => {
    render(
      <RoutineCheckbox
        morningCompleted={true}
        eveningCompleted={false}
        specialTreatments={[]}
        onChange={vi.fn()}
      />
    );

    const morningCheckbox = screen.getByTestId('morning-routine-checkbox');
    expect(morningCheckbox).toHaveAttribute('aria-checked', 'true');
  });

  it('shows evening completed state', () => {
    render(
      <RoutineCheckbox
        morningCompleted={false}
        eveningCompleted={true}
        specialTreatments={[]}
        onChange={vi.fn()}
      />
    );

    const eveningCheckbox = screen.getByTestId('evening-routine-checkbox');
    expect(eveningCheckbox).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange when morning checkbox clicked', () => {
    const onChange = vi.fn();
    render(
      <RoutineCheckbox
        morningCompleted={false}
        eveningCompleted={false}
        specialTreatments={[]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByTestId('morning-routine-checkbox'));
    expect(onChange).toHaveBeenCalledWith({
      morningCompleted: true,
      eveningCompleted: false,
      specialTreatments: [],
    });
  });

  it('calls onChange when evening checkbox clicked', () => {
    const onChange = vi.fn();
    render(
      <RoutineCheckbox
        morningCompleted={false}
        eveningCompleted={false}
        specialTreatments={[]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByTestId('evening-routine-checkbox'));
    expect(onChange).toHaveBeenCalledWith({
      morningCompleted: false,
      eveningCompleted: true,
      specialTreatments: [],
    });
  });

  it('displays special treatment options', () => {
    render(
      <RoutineCheckbox
        morningCompleted={false}
        eveningCompleted={false}
        specialTreatments={[]}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('특별 케어')).toBeInTheDocument();
    expect(screen.getByText('시트마스크')).toBeInTheDocument();
    expect(screen.getByText('필링')).toBeInTheDocument();
  });

  it('toggles special treatment selection', () => {
    const onChange = vi.fn();
    render(
      <RoutineCheckbox
        morningCompleted={false}
        eveningCompleted={false}
        specialTreatments={[]}
        onChange={onChange}
      />
    );

    // 버튼의 aria-label을 사용하여 정확한 요소 선택
    fireEvent.click(screen.getByLabelText('시트마스크 선택 안됨'));
    expect(onChange).toHaveBeenCalledWith({
      morningCompleted: false,
      eveningCompleted: false,
      specialTreatments: ['시트마스크'],
    });
  });

  it('removes treatment when clicked again', () => {
    const onChange = vi.fn();
    render(
      <RoutineCheckbox
        morningCompleted={false}
        eveningCompleted={false}
        specialTreatments={['시트마스크']}
        onChange={onChange}
      />
    );

    // 선택된 버튼의 aria-label을 사용하여 정확한 요소 선택
    fireEvent.click(screen.getByLabelText('시트마스크 선택됨'));
    expect(onChange).toHaveBeenCalledWith({
      morningCompleted: false,
      eveningCompleted: false,
      specialTreatments: [],
    });
  });

  it('displays selected treatments as badges', () => {
    render(
      <RoutineCheckbox
        morningCompleted={false}
        eveningCompleted={false}
        specialTreatments={['시트마스크', '필링']}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('오늘 한 특별 케어:')).toBeInTheDocument();
  });

  it('has custom treatment input', () => {
    render(
      <RoutineCheckbox
        morningCompleted={false}
        eveningCompleted={false}
        specialTreatments={[]}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText('다른 케어 추가...')).toBeInTheDocument();
    expect(screen.getByText('추가')).toBeInTheDocument();
  });

  it('adds custom treatment when submitted', () => {
    const onChange = vi.fn();
    render(
      <RoutineCheckbox
        morningCompleted={false}
        eveningCompleted={false}
        specialTreatments={[]}
        onChange={onChange}
      />
    );

    const input = screen.getByPlaceholderText('다른 케어 추가...');
    fireEvent.change(input, { target: { value: '레이저' } });
    fireEvent.click(screen.getByText('추가'));

    expect(onChange).toHaveBeenCalledWith({
      morningCompleted: false,
      eveningCompleted: false,
      specialTreatments: ['레이저'],
    });
  });

  it('applies custom className', () => {
    render(
      <RoutineCheckbox
        morningCompleted={false}
        eveningCompleted={false}
        specialTreatments={[]}
        onChange={vi.fn()}
        className="custom-class"
      />
    );

    expect(screen.getByTestId('routine-checkbox')).toHaveClass('custom-class');
  });

  it('responds to keyboard on morning checkbox', () => {
    const onChange = vi.fn();
    render(
      <RoutineCheckbox
        morningCompleted={false}
        eveningCompleted={false}
        specialTreatments={[]}
        onChange={onChange}
      />
    );

    fireEvent.keyDown(screen.getByTestId('morning-routine-checkbox'), { key: 'Enter' });
    expect(onChange).toHaveBeenCalled();
  });
});
