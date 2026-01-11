import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IngredientConflictAlert from '@/components/scan/IngredientConflictAlert';
import type { IngredientConflict } from '@/lib/scan/ingredient-conflict';

// 테스트용 충돌 데이터
const mockConflicts: IngredientConflict[] = [
  {
    ingredientA: 'RETINOL',
    ingredientB: 'VITAMIN C',
    severity: 'high',
    reason: 'pH 불일치로 상호 무력화',
    solution: '아침 비타민C, 저녁 레티놀 분리 사용',
  },
  {
    ingredientA: 'NIACINAMIDE',
    ingredientB: 'AHA',
    severity: 'medium',
    reason: '화학 반응으로 홍조/발적 유발 가능',
    solution: '30분 간격 또는 아침/저녁 분리',
  },
  {
    ingredientA: 'RETINOL',
    ingredientB: 'VITAMIN E',
    severity: 'low',
    reason: '일부 조합에서 레티놀 효과 감소',
    solution: '문제없으면 계속 사용 가능',
  },
];

describe('IngredientConflictAlert', () => {
  it('충돌이 없으면 렌더링하지 않는다', () => {
    const { container } = render(<IngredientConflictAlert conflicts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('충돌 알림이 렌더링된다', () => {
    render(<IngredientConflictAlert conflicts={mockConflicts} />);

    expect(screen.getByTestId('ingredient-conflict-alert')).toBeInTheDocument();
    expect(screen.getByText(/성분 조합 주의/)).toBeInTheDocument();
    expect(screen.getByText(/3건/)).toBeInTheDocument();
  });

  it('충돌 항목이 표시된다', () => {
    render(<IngredientConflictAlert conflicts={mockConflicts} />);

    // RETINOL이 2개의 충돌에 포함되어 있으므로 getAllByText 사용
    expect(screen.getAllByText('RETINOL').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('VITAMIN C')).toBeInTheDocument();
    expect(screen.getByText(/pH 불일치/)).toBeInTheDocument();
  });

  it('해결책이 표시된다', () => {
    render(<IngredientConflictAlert conflicts={mockConflicts} />);

    expect(screen.getByText(/아침 비타민C, 저녁 레티놀/)).toBeInTheDocument();
  });

  it('심각도별 뱃지가 표시된다', () => {
    render(<IngredientConflictAlert conflicts={mockConflicts} />);

    expect(screen.getByText('주의')).toBeInTheDocument();
    expect(screen.getByText('참고')).toBeInTheDocument();
    expect(screen.getByText('정보')).toBeInTheDocument();
  });

  it('high 충돌 개수가 헤더에 표시된다', () => {
    render(<IngredientConflictAlert conflicts={mockConflicts} />);

    expect(screen.getByText(/심각 1/)).toBeInTheDocument();
  });

  it('닫기 버튼이 onDismiss를 호출한다', () => {
    const onDismiss = vi.fn();
    render(<IngredientConflictAlert conflicts={mockConflicts} onDismiss={onDismiss} />);

    const closeButton = screen.getByLabelText('닫기');
    fireEvent.click(closeButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  describe('compact 모드', () => {
    it('컴팩트 모드에서 최대 2개만 표시된다', () => {
      render(<IngredientConflictAlert conflicts={mockConflicts} compact />);

      const items = screen.getAllByTestId('conflict-item');
      expect(items).toHaveLength(2);
    });

    it('더 보기 버튼이 표시된다', () => {
      render(<IngredientConflictAlert conflicts={mockConflicts} compact />);

      expect(screen.getByText(/\+1건 더 보기/)).toBeInTheDocument();
    });

    it('더 보기 클릭 시 모든 항목이 표시된다', () => {
      render(<IngredientConflictAlert conflicts={mockConflicts} compact />);

      const moreButton = screen.getByText(/\+1건 더 보기/);
      fireEvent.click(moreButton);

      const items = screen.getAllByTestId('conflict-item');
      expect(items).toHaveLength(3);
    });

    it('컴팩트 모드에서 해결책이 숨겨진다', () => {
      render(<IngredientConflictAlert conflicts={mockConflicts} compact />);

      expect(screen.queryByText(/해결:/)).not.toBeInTheDocument();
    });

    it('펼치면 해결책이 표시된다', () => {
      render(<IngredientConflictAlert conflicts={mockConflicts} compact />);

      const expandButton = screen.getByLabelText('펼치기');
      fireEvent.click(expandButton);

      expect(screen.getAllByText(/해결:/).length).toBeGreaterThan(0);
    });
  });

  it('심각도 순으로 정렬된다 (high > medium > low)', () => {
    const unorderedConflicts: IngredientConflict[] = [
      { ...mockConflicts[2] }, // low
      { ...mockConflicts[1] }, // medium
      { ...mockConflicts[0] }, // high
    ];

    render(<IngredientConflictAlert conflicts={unorderedConflicts} />);

    const items = screen.getAllByTestId('conflict-item');
    // 첫 번째 항목은 high여야 함
    expect(items[0]).toHaveTextContent('RETINOL');
    expect(items[0]).toHaveTextContent('VITAMIN C');
  });

  it('role="alert"가 설정되어 있다', () => {
    render(<IngredientConflictAlert conflicts={mockConflicts} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
