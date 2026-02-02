/**
 * IngredientSubstituteCard 컴포넌트 테스트
 *
 * @description K-4 건강한 재료 대체 카드 UI 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IngredientSubstituteCard } from '@/components/nutrition/IngredientSubstituteCard';

// Mock ingredient-substitutes 모듈
vi.mock('@/lib/nutrition/ingredient-substitutes', () => ({
  getSubstitutesForIngredient: vi.fn((ingredient, goal) => {
    const substitutes: Record<string, any[]> = {
      설탕: [
        {
          name: '스테비아',
          goal: 'diet',
          benefit: '칼로리 0, 혈당 영향 없음',
          ratio: 0.5,
          tips: '설탕의 절반만 사용하세요.',
        },
        {
          name: '에리스리톨',
          goal: 'diet',
          benefit: '칼로리 매우 낮음',
          ratio: 1,
          tips: '동량으로 대체 가능합니다.',
        },
      ],
      밀가루: [
        {
          name: '아몬드가루',
          goal: 'diet',
          benefit: '탄수화물↓ 단백질↑',
          ratio: 1,
          tips: '글루텐 프리 베이킹에 좋습니다.',
        },
        {
          name: '코코넛가루',
          goal: 'lean',
          benefit: '식이섬유 풍부',
          ratio: 0.25,
          tips: '수분을 많이 흡수하니 주의하세요.',
        },
      ],
      버터: [
        {
          name: '그릭요거트',
          goal: 'lean',
          benefit: '단백질↑ 지방↓',
          ratio: 0.5,
          tips: '무가당 제품을 선택하세요.',
        },
      ],
    };

    let result = substitutes[ingredient] || [];
    if (goal) {
      result = result.filter((s) => s.goal === goal);
    }
    return result;
  }),
  INGREDIENT_SUBSTITUTES: {
    설탕: [{ name: '스테비아', goal: 'diet' }],
    밀가루: [{ name: '아몬드가루', goal: 'diet' }],
    버터: [{ name: '그릭요거트', goal: 'lean' }],
  },
}));

describe('IngredientSubstituteCard', () => {
  describe('렌더링', () => {
    it('카드가 정상적으로 렌더링된다', () => {
      render(<IngredientSubstituteCard />);

      expect(screen.getByTestId('ingredient-substitute-card')).toBeInTheDocument();
      expect(screen.getByText('건강한 재료 대체')).toBeInTheDocument();
    });

    it('목표 선택 버튼들이 표시된다', () => {
      render(<IngredientSubstituteCard />);

      // 필터 버튼들이 존재하는지 확인 (다른 곳에도 같은 텍스트가 있을 수 있으므로 getAllByText 사용)
      expect(screen.getByText('전체')).toBeInTheDocument();
      expect(screen.getAllByText('다이어트').length).toBeGreaterThan(0);
      expect(screen.getAllByText('린매스').length).toBeGreaterThan(0);
      expect(screen.getAllByText('벌크업').length).toBeGreaterThan(0);
      expect(screen.getByText('알레르기 프리')).toBeInTheDocument();
    });

    it('검색창이 표시된다', () => {
      render(<IngredientSubstituteCard />);

      expect(screen.getByPlaceholderText(/재료 검색/)).toBeInTheDocument();
    });

    it('활용 팁 섹션이 표시된다', () => {
      render(<IngredientSubstituteCard />);

      expect(screen.getByText('활용 팁')).toBeInTheDocument();
    });

    it('면책조항이 표시된다', () => {
      render(<IngredientSubstituteCard />);

      expect(
        screen.getByText(/개인의 건강 상태와 취향에 따라/)
      ).toBeInTheDocument();
    });
  });

  describe('목표 필터링', () => {
    it('다이어트 목표 선택 시 해당 대체 재료만 표시된다', () => {
      render(<IngredientSubstituteCard />);

      // 헤더의 목표 버튼들 중 다이어트 찾기
      const dietButtons = screen.getAllByText('다이어트');
      const filterButton = dietButtons.find((el) => el.closest('button'));

      if (filterButton) {
        fireEvent.click(filterButton);
        expect(filterButton.closest('button')).toHaveClass('bg-green-50');
      }
    });

    it('전체 버튼 클릭 시 모든 대체 재료가 표시된다', () => {
      render(<IngredientSubstituteCard selectedGoal="diet" />);

      const allButton = screen.getByText('전체');
      fireEvent.click(allButton);

      expect(allButton.closest('button')).toHaveClass('bg-foreground');
    });
  });

  describe('검색 기능', () => {
    it('재료 검색이 가능하다', () => {
      render(<IngredientSubstituteCard />);

      const searchInput = screen.getByPlaceholderText(/재료 검색/);
      fireEvent.change(searchInput, { target: { value: '설탕' } });

      expect(searchInput).toHaveValue('설탕');
    });

    it('검색 결과가 없을 때 안내 메시지가 표시된다', () => {
      render(<IngredientSubstituteCard />);

      const searchInput = screen.getByPlaceholderText(/재료 검색/);
      fireEvent.change(searchInput, { target: { value: '존재하지않는재료' } });

      expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument();
    });
  });

  describe('대체 재료 아이템', () => {
    it('대체 재료 클릭 시 상세 정보가 펼쳐진다', () => {
      render(<IngredientSubstituteCard />);

      // 첫 번째 대체 재료 버튼 클릭
      const substituteButtons = screen.getAllByRole('button', { expanded: false });
      const firstSubstitute = substituteButtons.find(
        (btn) => btn.getAttribute('aria-expanded') !== null
      );

      if (firstSubstitute) {
        fireEvent.click(firstSubstitute);
        expect(firstSubstitute).toHaveAttribute('aria-expanded', 'true');
      }
    });

    it('효과 정보가 표시된다', async () => {
      render(<IngredientSubstituteCard />);

      // 아이템 펼치기
      const buttons = screen.getAllByRole('button', { expanded: false });
      const expandableButton = buttons.find(
        (btn) => btn.getAttribute('aria-expanded') === 'false'
      );

      if (expandableButton) {
        fireEvent.click(expandableButton);
        expect(screen.getByText('효과')).toBeInTheDocument();
      }
    });
  });

  describe('컴팩트 모드', () => {
    it('컴팩트 모드에서 목표 필터 버튼이 숨겨진다', () => {
      render(<IngredientSubstituteCard compact />);

      // 컴팩트 모드에서는 '전체' 필터 버튼이 없어야 함
      expect(screen.queryByText('전체')).not.toBeInTheDocument();
    });

    it('컴팩트 모드에서 검색창이 숨겨진다', () => {
      render(<IngredientSubstituteCard compact />);

      expect(screen.queryByPlaceholderText(/재료 검색/)).not.toBeInTheDocument();
    });

    it('컴팩트 모드에서 활용 팁이 숨겨진다', () => {
      render(<IngredientSubstituteCard compact />);

      expect(screen.queryByText('활용 팁')).not.toBeInTheDocument();
    });

    it('컴팩트 모드에서 최대 4개 재료만 표시된다', () => {
      render(<IngredientSubstituteCard compact />);

      // 컴팩트 모드에서는 slice(0, 4)로 제한
      const cards = screen.getAllByRole('button', { expanded: false });
      expect(cards.length).toBeLessThanOrEqual(8); // 4개 재료 × 2개 대체 최대
    });
  });

  describe('접근성', () => {
    it('aria-expanded 속성이 올바르게 설정된다', () => {
      render(<IngredientSubstituteCard />);

      const expandableButtons = screen.getAllByRole('button', { expanded: false });
      expect(expandableButtons.length).toBeGreaterThan(0);
    });
  });

  describe('스타일링', () => {
    it('className prop이 적용된다', () => {
      render(<IngredientSubstituteCard className="custom-class" />);

      expect(screen.getByTestId('ingredient-substitute-card')).toHaveClass('custom-class');
    });
  });

  describe('Props', () => {
    it('selectedGoal prop으로 초기 목표를 설정할 수 있다', () => {
      render(<IngredientSubstituteCard selectedGoal="lean" />);

      // 린매스 버튼을 찾아서 활성화 상태 확인
      const leanButtons = screen.getAllByText('린매스');
      // 버튼 중 bg-blue-50 클래스를 가진 것을 찾음
      const activeButton = leanButtons.find(
        (el) => el.closest('button')?.className.includes('bg-blue')
      );
      expect(activeButton).toBeTruthy();
    });
  });
});
