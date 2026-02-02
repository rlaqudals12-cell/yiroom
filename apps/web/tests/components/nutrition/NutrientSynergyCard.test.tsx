/**
 * NutrientSynergyCard 컴포넌트 테스트
 *
 * @description K-4 영양소 시너지/길항 카드 UI 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NutrientSynergyCard } from '@/components/nutrition/NutrientSynergyCard';

// Mock nutrient-synergy 모듈
vi.mock('@/lib/nutrition/nutrient-synergy', () => ({
  getInteractionFactor: vi.fn((n1, n2) => (n1 === 'vitaminC' && n2 === 'iron' ? 1.5 : 1)),
  getInteractionType: vi.fn((n1, n2) => {
    if (n1 === 'vitaminC' && n2 === 'iron') return 'synergy';
    if (n1 === 'calcium' && n2 === 'iron') return 'antagonist';
    return 'independent';
  }),
  getSynergyNutrients: vi.fn((nutrient) => {
    if (nutrient === 'vitaminC') return ['iron', 'collagen'];
    return [];
  }),
  getAntagonistNutrients: vi.fn((nutrient) => {
    if (nutrient === 'calcium') return ['iron', 'zinc'];
    return [];
  }),
  getInteractionInfo: vi.fn((n1, n2) => ({
    type: n1 === 'vitaminC' && n2 === 'iron' ? 'synergy' : 'independent',
    factor: n1 === 'vitaminC' && n2 === 'iron' ? 1.5 : 1,
    description: n1 === 'vitaminC' && n2 === 'iron' ? '비타민C가 철분 흡수를 50% 증가시킵니다.' : null,
  })),
  NUTRIENT_INTERACTION_MATRIX: {
    vitaminC: { iron: 1.5, collagen: 1.3 },
    calcium: { iron: 0.6, zinc: 0.7 },
    iron: {},
    collagen: {},
    zinc: {},
  },
}));

describe('NutrientSynergyCard', () => {
  describe('렌더링', () => {
    it('카드가 정상적으로 렌더링된다', () => {
      render(<NutrientSynergyCard />);

      expect(screen.getByTestId('nutrient-synergy-card')).toBeInTheDocument();
      expect(screen.getByText('영양소 상호작용')).toBeInTheDocument();
    });

    it('영양소 선택 드롭다운이 표시된다', () => {
      render(<NutrientSynergyCard />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('시너지 섹션 헤더가 표시된다', () => {
      render(<NutrientSynergyCard selectedNutrient="vitaminC" />);

      expect(screen.getByText('함께 섭취하면 좋아요')).toBeInTheDocument();
    });

    it('팁 섹션이 표시된다', () => {
      render(<NutrientSynergyCard />);

      expect(screen.getByText('섭취 팁')).toBeInTheDocument();
    });

    it('면책조항이 표시된다', () => {
      render(<NutrientSynergyCard />);

      expect(
        screen.getByText(/참고용 정보입니다/)
      ).toBeInTheDocument();
    });
  });

  describe('영양소 선택', () => {
    it('영양소를 변경할 수 있다', () => {
      render(<NutrientSynergyCard />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'calcium' } });

      expect(select).toHaveValue('calcium');
    });
  });

  describe('상호작용 아이템', () => {
    it('시너지 아이템 클릭 시 상세 정보가 펼쳐진다', async () => {
      render(<NutrientSynergyCard selectedNutrient="vitaminC" />);

      // 시너지 아이템 찾기
      const synergyItems = screen.getAllByRole('button', { expanded: false });
      const firstItem = synergyItems[0];

      fireEvent.click(firstItem);

      expect(firstItem).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('컴팩트 모드', () => {
    it('컴팩트 모드에서 영양소 선택이 숨겨진다', () => {
      render(<NutrientSynergyCard compact />);

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('컴팩트 모드에서 팁 섹션이 숨겨진다', () => {
      render(<NutrientSynergyCard compact />);

      expect(screen.queryByText('섭취 팁')).not.toBeInTheDocument();
    });

    it('컴팩트 모드에서 최대 2개 아이템만 표시된다', () => {
      render(<NutrientSynergyCard compact selectedNutrient="vitaminC" />);

      // 컴팩트 모드에서는 slice(0, 2)로 제한
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeLessThanOrEqual(4); // 시너지 2개 + 길항 2개 최대
    });
  });

  describe('접근성', () => {
    it('aria-expanded 속성이 올바르게 설정된다', () => {
      render(<NutrientSynergyCard selectedNutrient="vitaminC" />);

      const buttons = screen.getAllByRole('button', { expanded: false });
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('스타일링', () => {
    it('className prop이 적용된다', () => {
      render(<NutrientSynergyCard className="custom-class" />);

      expect(screen.getByTestId('nutrient-synergy-card')).toHaveClass('custom-class');
    });
  });
});
