/**
 * PriceAlertModal 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PriceAlertModal } from '@/components/smart-matching/PriceAlertModal';

describe('PriceAlertModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  it('모달 제목을 표시한다', () => {
    render(<PriceAlertModal {...defaultProps} />);

    expect(screen.getByText('가격 알림 설정')).toBeInTheDocument();
  });

  it('제품명을 설명에 포함한다', () => {
    render(<PriceAlertModal {...defaultProps} productName="테스트 제품" />);

    expect(screen.getByText(/테스트 제품의 가격이/)).toBeInTheDocument();
  });

  it('현재 가격을 표시한다', () => {
    render(<PriceAlertModal {...defaultProps} currentPrice={50000} />);

    expect(screen.getByText(/50,000원/)).toBeInTheDocument();
  });

  it('목표 가격과 할인율 탭이 있다', () => {
    render(<PriceAlertModal {...defaultProps} />);

    expect(screen.getByText('목표 가격')).toBeInTheDocument();
    // 할인율은 탭 버튼과 라벨 두 곳에 있음
    expect(screen.getAllByText('할인율').length).toBeGreaterThanOrEqual(1);
  });

  it('플랫폼 선택 버튼이 있다', () => {
    render(<PriceAlertModal {...defaultProps} />);

    expect(screen.getByText('쿠팡')).toBeInTheDocument();
    expect(screen.getByText('네이버쇼핑')).toBeInTheDocument();
    expect(screen.getByText('무신사')).toBeInTheDocument();
    expect(screen.getByText('올리브영')).toBeInTheDocument();
    expect(screen.getByText('iHerb')).toBeInTheDocument();
  });

  it('저장 버튼 클릭 시 onSave 콜백을 호출한다', () => {
    const onSave = vi.fn();
    render(<PriceAlertModal {...defaultProps} onSave={onSave} />);

    // 기본값으로 할인율 10%가 설정되어 있음
    fireEvent.click(screen.getByText('저장'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        percentDrop: 10,
        platforms: expect.arrayContaining(['coupang', 'naver']),
      })
    );
  });

  it('취소 버튼 클릭 시 모달을 닫는다', () => {
    const onOpenChange = vi.fn();
    render(<PriceAlertModal {...defaultProps} onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByText('취소'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('기존 설정이 있으면 알림 해제 버튼을 표시한다', () => {
    const onDelete = vi.fn();
    render(
      <PriceAlertModal
        {...defaultProps}
        existingConfig={{ targetPrice: 45000, platforms: ['coupang'] }}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('알림 해제')).toBeInTheDocument();
  });

  it('알림 해제 클릭 시 onDelete 콜백을 호출한다', () => {
    const onDelete = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <PriceAlertModal
        {...defaultProps}
        onOpenChange={onOpenChange}
        existingConfig={{ targetPrice: 45000, platforms: ['coupang'] }}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByText('알림 해제'));

    expect(onDelete).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('data-testid가 설정되어 있다', () => {
    render(<PriceAlertModal {...defaultProps} />);

    expect(screen.getByTestId('price-alert-modal')).toBeInTheDocument();
  });

  it('목표 가격 모드에서 빈 값이면 저장 버튼이 비활성화된다', () => {
    render(<PriceAlertModal {...defaultProps} />);

    // 목표 가격 탭으로 전환
    fireEvent.click(screen.getByText('목표 가격'));

    // 저장 버튼 비활성화 확인
    expect(screen.getByText('저장')).toBeDisabled();
  });

  it('플랫폼을 토글할 수 있다', () => {
    render(<PriceAlertModal {...defaultProps} />);

    const coupangBtn = screen.getByText('쿠팡');

    // 초기에는 선택됨 (default variant)
    fireEvent.click(coupangBtn);
    // 토글 후 outline variant로 변경됨 (선택 해제)
    expect(coupangBtn.closest('button')).toHaveClass('border');
  });
});
