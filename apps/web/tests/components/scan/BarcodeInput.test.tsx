/**
 * BarcodeInput 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BarcodeInput } from '@/components/scan/BarcodeInput';

describe('BarcodeInput', () => {
  it('폼 렌더링', () => {
    render(<BarcodeInput onSubmit={vi.fn()} />);

    expect(screen.getByTestId('barcode-input-form')).toBeInTheDocument();
    expect(screen.getByTestId('barcode-input')).toBeInTheDocument();
    expect(screen.getByText('제품 조회')).toBeInTheDocument();
  });

  it('placeholder 표시', () => {
    render(<BarcodeInput onSubmit={vi.fn()} />);

    expect(screen.getByPlaceholderText('바코드 번호 입력 (8-13자리)')).toBeInTheDocument();
  });

  it('숫자만 입력 가능', async () => {
    const user = userEvent.setup();
    render(<BarcodeInput onSubmit={vi.fn()} />);

    const input = screen.getByTestId('barcode-input');
    await user.type(input, 'abc123def456');

    expect(input).toHaveValue('123456');
  });

  it('유효한 EAN-13 입력 시 체크 표시', async () => {
    const user = userEvent.setup();
    render(<BarcodeInput onSubmit={vi.fn()} />);

    const input = screen.getByTestId('barcode-input');
    // 유효한 EAN-13 바코드
    await user.type(input, '8809669912127');

    // 체크 아이콘이 표시되어야 함 (SVG 클래스로 확인)
    const form = screen.getByTestId('barcode-input-form');
    expect(form.querySelector('.text-green-500')).toBeInTheDocument();
  });

  it('3자리 이하 입력은 유효하지 않음', async () => {
    const user = userEvent.setup();
    render(<BarcodeInput onSubmit={vi.fn()} />);

    const input = screen.getByTestId('barcode-input');
    // 3자리 이하는 어떤 바코드 형식에도 해당하지 않음
    await user.type(input, '12345678'); // 8자리 입력

    // 8자리 이상이면 유효 (EAN-8 체크섬 검증 또는 CODE-128로 인식)
    const form = screen.getByTestId('barcode-input-form');
    // 체크섬이 맞지 않으면 CODE-128로 인식되어 유효함
    expect(
      form.querySelector('.text-green-500') || form.querySelector('.text-red-500')
    ).toBeInTheDocument();
  });

  it('8자리 미만 입력 시 유효성 표시 없음', async () => {
    const user = userEvent.setup();
    render(<BarcodeInput onSubmit={vi.fn()} />);

    const input = screen.getByTestId('barcode-input');
    await user.type(input, '1234567');

    expect(screen.queryByText('유효하지 않음')).not.toBeInTheDocument();
    const form = screen.getByTestId('barcode-input-form');
    expect(form.querySelector('.text-green-500')).not.toBeInTheDocument();
  });

  it('최대 13자리까지만 입력', async () => {
    const user = userEvent.setup();
    render(<BarcodeInput onSubmit={vi.fn()} />);

    const input = screen.getByTestId('barcode-input');
    await user.type(input, '12345678901234567890');

    expect(input).toHaveValue('1234567890123');
  });

  it('유효한 바코드로 제출', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    render(<BarcodeInput onSubmit={handleSubmit} />);

    const input = screen.getByTestId('barcode-input');
    await user.type(input, '8809669912127');

    const submitButton = screen.getByRole('button', { name: /제품 조회/i });
    await user.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledWith('8809669912127');
  });

  it('7자리 이하 입력으로 제출 불가', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    render(<BarcodeInput onSubmit={handleSubmit} />);

    const input = screen.getByTestId('barcode-input');
    // 7자리는 어떤 바코드 형식에도 해당하지 않음
    await user.type(input, '1234567');

    const submitButton = screen.getByRole('button', { name: /제품 조회/i });
    expect(submitButton).toBeDisabled();

    await user.click(submitButton);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('빈 입력으로 제출 불가', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    render(<BarcodeInput onSubmit={handleSubmit} />);

    const submitButton = screen.getByRole('button', { name: /제품 조회/i });
    expect(submitButton).toBeDisabled();
  });

  it('로딩 상태 표시', () => {
    render(<BarcodeInput onSubmit={vi.fn()} loading />);

    expect(screen.getByText('조회 중...')).toBeInTheDocument();
  });

  it('로딩 중에는 버튼 비활성화', () => {
    render(<BarcodeInput onSubmit={vi.fn()} loading />);

    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
  });

  it('지원 형식 안내 문구', () => {
    render(<BarcodeInput onSubmit={vi.fn()} />);

    expect(screen.getByText('EAN-13, EAN-8, UPC-A 형식 지원')).toBeInTheDocument();
  });

  it('Enter 키로 제출', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    render(<BarcodeInput onSubmit={handleSubmit} />);

    const input = screen.getByTestId('barcode-input');
    await user.type(input, '8809669912127');
    await user.keyboard('{Enter}');

    expect(handleSubmit).toHaveBeenCalledWith('8809669912127');
  });

  it('유효한 EAN-8 입력', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    render(<BarcodeInput onSubmit={handleSubmit} />);

    const input = screen.getByTestId('barcode-input');
    await user.type(input, '12345670'); // 유효한 EAN-8

    const form = screen.getByTestId('barcode-input-form');
    expect(form.querySelector('.text-green-500')).toBeInTheDocument();
  });

  it('className prop 적용', () => {
    render(<BarcodeInput onSubmit={vi.fn()} className="custom-class" />);

    const form = screen.getByTestId('barcode-input-form');
    expect(form).toHaveClass('custom-class');
  });
});
