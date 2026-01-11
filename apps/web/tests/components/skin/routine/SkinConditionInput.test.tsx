import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SkinConditionInput from '@/components/skin/routine/SkinConditionInput';

describe('SkinConditionInput', () => {
  it('기본 상태로 렌더링된다', () => {
    const onChange = vi.fn();
    render(<SkinConditionInput onConditionChange={onChange} />);

    expect(screen.getByTestId('skin-condition-input')).toBeInTheDocument();
    expect(screen.getByText('오늘 피부 상태')).toBeInTheDocument();
  });

  it('수분 상태 옵션이 표시된다', () => {
    const onChange = vi.fn();
    render(<SkinConditionInput onConditionChange={onChange} />);

    expect(screen.getByText('매우 건조')).toBeInTheDocument();
    expect(screen.getByText('건조')).toBeInTheDocument();
    expect(screen.getByText('적당함')).toBeInTheDocument();
    expect(screen.getByText('촉촉')).toBeInTheDocument();
    expect(screen.getByText('번들번들')).toBeInTheDocument();
  });

  it('고민 옵션이 표시된다', () => {
    const onChange = vi.fn();
    render(<SkinConditionInput onConditionChange={onChange} />);

    expect(screen.getByText('여드름')).toBeInTheDocument();
    expect(screen.getByText('홍조')).toBeInTheDocument();
    expect(screen.getByText('칙칙함')).toBeInTheDocument();
    expect(screen.getByText('당김')).toBeInTheDocument();
    expect(screen.getByText('번들거림')).toBeInTheDocument();
  });

  it('수분 상태 변경 시 콜백이 호출된다', () => {
    const onChange = vi.fn();
    render(<SkinConditionInput onConditionChange={onChange} />);

    fireEvent.click(screen.getByText('건조'));

    expect(onChange).toHaveBeenCalledWith({
      hydration: 'dry',
      concerns: [],
    });
  });

  it('고민 선택 시 콜백이 호출된다', () => {
    const onChange = vi.fn();
    render(<SkinConditionInput onConditionChange={onChange} />);

    fireEvent.click(screen.getByText('여드름'));

    expect(onChange).toHaveBeenCalledWith({
      hydration: 'normal',
      concerns: ['acne'],
    });
  });

  it('고민 다중 선택이 가능하다', () => {
    const onChange = vi.fn();
    render(<SkinConditionInput onConditionChange={onChange} />);

    fireEvent.click(screen.getByText('여드름'));
    fireEvent.click(screen.getByText('홍조'));

    expect(onChange).toHaveBeenLastCalledWith({
      hydration: 'normal',
      concerns: ['acne', 'redness'],
    });
  });

  it('고민 선택 해제가 가능하다', () => {
    const onChange = vi.fn();
    render(<SkinConditionInput onConditionChange={onChange} />);

    // 선택
    fireEvent.click(screen.getByText('여드름'));
    // 해제
    fireEvent.click(screen.getByText('여드름'));

    expect(onChange).toHaveBeenLastCalledWith({
      hydration: 'normal',
      concerns: [],
    });
  });

  it('초기화 버튼이 동작한다', () => {
    const onChange = vi.fn();
    render(<SkinConditionInput onConditionChange={onChange} />);

    // 상태 변경
    fireEvent.click(screen.getByText('건조'));
    fireEvent.click(screen.getByText('여드름'));

    // 초기화
    fireEvent.click(screen.getByText('초기화'));

    expect(onChange).toHaveBeenLastCalledWith({
      hydration: 'normal',
      concerns: [],
    });
  });

  it('초기값이 적용된다', () => {
    const onChange = vi.fn();
    render(
      <SkinConditionInput
        onConditionChange={onChange}
        initialCondition={{ hydration: 'dry', concerns: ['acne'] }}
      />
    );

    // 건조 버튼이 선택된 상태여야 함
    const dryButton = screen.getByText('건조').closest('button');
    expect(dryButton).toHaveAttribute('aria-pressed', 'true');

    // 여드름 버튼이 선택된 상태여야 함
    const acneButton = screen.getByText('여드름').closest('button');
    expect(acneButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('상태 요약이 표시된다', () => {
    const onChange = vi.fn();
    render(<SkinConditionInput onConditionChange={onChange} />);

    fireEvent.click(screen.getByText('건조'));

    expect(screen.getByText(/건조한 피부/)).toBeInTheDocument();
    expect(screen.getByText(/루틴을 조정해드릴게요/)).toBeInTheDocument();
  });

  describe('compact 모드', () => {
    it('컴팩트 모드로 렌더링된다', () => {
      const onChange = vi.fn();
      render(<SkinConditionInput onConditionChange={onChange} compact />);

      expect(screen.getByTestId('skin-condition-input')).toBeInTheDocument();
      // 전체 모드의 헤더가 없어야 함
      expect(screen.queryByText('오늘 피부 상태')).not.toBeInTheDocument();
    });

    it('컴팩트 모드에서 수분 옵션이 표시된다', () => {
      const onChange = vi.fn();
      render(<SkinConditionInput onConditionChange={onChange} compact />);

      // 컴팩트 모드에서는 처음 3개만 표시
      expect(screen.getByText('매우 건조')).toBeInTheDocument();
      expect(screen.getByText('건조')).toBeInTheDocument();
      expect(screen.getByText('적당함')).toBeInTheDocument();
    });

    it('컴팩트 모드에서 선택된 고민이 표시된다', () => {
      const onChange = vi.fn();
      render(
        <SkinConditionInput
          onConditionChange={onChange}
          initialCondition={{ hydration: 'normal', concerns: ['acne'] }}
          compact
        />
      );

      expect(screen.getByText(/여드름/)).toBeInTheDocument();
    });
  });

  it('aria-pressed 속성이 올바르게 설정된다', () => {
    const onChange = vi.fn();
    render(<SkinConditionInput onConditionChange={onChange} />);

    const normalButton = screen.getByText('적당함').closest('button');
    expect(normalButton).toHaveAttribute('aria-pressed', 'true');

    const dryButton = screen.getByText('건조').closest('button');
    expect(dryButton).toHaveAttribute('aria-pressed', 'false');
  });
});
