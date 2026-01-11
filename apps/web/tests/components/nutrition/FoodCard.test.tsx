/**
 * 식품 정보 카드 컴포넌트 테스트
 * components/nutrition/FoodCard.tsx
 *
 * - 기본 정보 표시 (이름, 브랜드, 이미지)
 * - 영양 정보 표시 (칼로리, 탄단지)
 * - 소스 및 검증 배지
 * - 컴팩트 모드
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FoodCard from '@/components/nutrition/FoodCard';
import type { BarcodeFood } from '@/types/nutrition';

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
  };
});

describe('FoodCard', () => {
  const mockFood: BarcodeFood = {
    id: 'food-1',
    barcode: '8801234567890',
    name: '신라면',
    brand: '농심',
    servingSize: 120,
    servingUnit: 'g',
    calories: 500,
    protein: 10,
    carbs: 80,
    fat: 16,
    fiber: 3,
    sodium: 1790,
    sugar: 4,
    category: '라면',
    allergens: ['밀', '대두', '쇠고기'],
    imageUrl: 'https://example.com/image.jpg',
    source: 'api',
    verified: true,
  };

  describe('기본 렌더링', () => {
    it('data-testid가 올바르게 설정된다', () => {
      render(<FoodCard food={mockFood} />);

      expect(screen.getByTestId('food-card')).toBeInTheDocument();
    });

    it('식품 이름을 표시한다', () => {
      render(<FoodCard food={mockFood} />);

      expect(screen.getByText('신라면')).toBeInTheDocument();
    });

    it('브랜드를 표시한다', () => {
      render(<FoodCard food={mockFood} />);

      expect(screen.getByText('농심')).toBeInTheDocument();
    });

    it('제공량을 표시한다', () => {
      render(<FoodCard food={mockFood} />);

      expect(screen.getByText(/120g 기준/)).toBeInTheDocument();
    });

    it('이미지가 있으면 표시한다', () => {
      render(<FoodCard food={mockFood} />);

      const img = screen.getByAltText('신라면');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('이미지가 없으면 플레이스홀더를 표시한다', () => {
      const foodWithoutImage = { ...mockFood, imageUrl: undefined };
      render(<FoodCard food={foodWithoutImage} />);

      expect(screen.queryByAltText('신라면')).not.toBeInTheDocument();
    });
  });

  describe('영양 정보', () => {
    it('칼로리를 표시한다', () => {
      render(<FoodCard food={mockFood} />);

      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('kcal')).toBeInTheDocument();
    });

    it('단백질을 표시한다', () => {
      render(<FoodCard food={mockFood} />);

      expect(screen.getByText('10g')).toBeInTheDocument();
      expect(screen.getByText('단백질')).toBeInTheDocument();
    });

    it('탄수화물을 표시한다', () => {
      render(<FoodCard food={mockFood} />);

      expect(screen.getByText('80g')).toBeInTheDocument();
      expect(screen.getByText('탄수화물')).toBeInTheDocument();
    });

    it('지방을 표시한다', () => {
      render(<FoodCard food={mockFood} />);

      expect(screen.getByText('16g')).toBeInTheDocument();
      expect(screen.getByText('지방')).toBeInTheDocument();
    });

    it('섭취량에 따라 영양 정보를 조정한다', () => {
      render(<FoodCard food={mockFood} servings={2} />);

      expect(screen.getByText('1000')).toBeInTheDocument(); // 500 × 2
      expect(screen.getByText('20g')).toBeInTheDocument(); // 10 × 2
    });

    it('추가 영양 정보(섬유질, 나트륨, 당류)를 표시한다', () => {
      render(<FoodCard food={mockFood} />);

      expect(screen.getByText(/식이섬유 3g/)).toBeInTheDocument();
      expect(screen.getByText(/나트륨 1790mg/)).toBeInTheDocument();
      expect(screen.getByText(/당류 4g/)).toBeInTheDocument();
    });
  });

  describe('소스 및 검증 배지', () => {
    it('소스 배지를 표시한다', () => {
      render(<FoodCard food={mockFood} source="local" />);

      expect(screen.getByText('로컬 DB')).toBeInTheDocument();
    });

    it('Open Food Facts 소스를 표시한다', () => {
      render(<FoodCard food={mockFood} source="openfoodfacts" />);

      expect(screen.getByText('Open Food Facts')).toBeInTheDocument();
    });

    it('식품안전나라 소스를 표시한다', () => {
      render(<FoodCard food={mockFood} source="foodsafetykorea" />);

      expect(screen.getByText('식품안전나라')).toBeInTheDocument();
    });

    it('검증된 식품에 검증 배지를 표시한다', () => {
      render(<FoodCard food={mockFood} />);

      expect(screen.getByText('검증됨')).toBeInTheDocument();
    });

    it('미검증 식품에 미검증 배지를 표시한다', () => {
      const unverifiedFood = { ...mockFood, verified: false };
      render(<FoodCard food={unverifiedFood} />);

      expect(screen.getByText('미검증')).toBeInTheDocument();
    });

    it('카테고리를 배지로 표시한다', () => {
      render(<FoodCard food={mockFood} />);

      expect(screen.getByText('라면')).toBeInTheDocument();
    });
  });

  describe('알레르기 정보', () => {
    it('알레르기 정보를 표시한다', () => {
      render(<FoodCard food={mockFood} />);

      expect(screen.getByText('알레르기:')).toBeInTheDocument();
      expect(screen.getByText('밀')).toBeInTheDocument();
      expect(screen.getByText('대두')).toBeInTheDocument();
      expect(screen.getByText('쇠고기')).toBeInTheDocument();
    });

    it('알레르기 정보가 없으면 표시하지 않는다', () => {
      const foodWithoutAllergens = { ...mockFood, allergens: undefined };
      render(<FoodCard food={foodWithoutAllergens} />);

      expect(screen.queryByText('알레르기:')).not.toBeInTheDocument();
    });
  });

  describe('컴팩트 모드', () => {
    it('컴팩트 모드에서 data-testid가 다르게 설정된다', () => {
      render(<FoodCard food={mockFood} compact />);

      expect(screen.getByTestId('food-card-compact')).toBeInTheDocument();
      expect(screen.queryByTestId('food-card')).not.toBeInTheDocument();
    });

    it('컴팩트 모드에서 간단한 정보만 표시한다', () => {
      render(<FoodCard food={mockFood} compact />);

      expect(screen.getByText('신라면')).toBeInTheDocument();
      expect(screen.getByText(/500 kcal/)).toBeInTheDocument();
      expect(screen.getByText(/농심/)).toBeInTheDocument();
    });

    it('컴팩트 모드에서 상세 영양 정보는 표시하지 않는다', () => {
      render(<FoodCard food={mockFood} compact />);

      expect(screen.queryByText('단백질')).not.toBeInTheDocument();
      expect(screen.queryByText('탄수화물')).not.toBeInTheDocument();
      expect(screen.queryByText('지방')).not.toBeInTheDocument();
    });

    it('컴팩트 모드에서 검증 아이콘을 표시한다', () => {
      const { container } = render(<FoodCard food={mockFood} compact />);

      // ShieldCheck 아이콘이 렌더링되는지 확인
      const shieldIcon = container.querySelector('svg');
      expect(shieldIcon).toBeInTheDocument();
    });
  });

  describe('클릭 이벤트', () => {
    it('onClick이 있으면 클릭 시 호출된다', () => {
      const onClick = vi.fn();
      render(<FoodCard food={mockFood} onClick={onClick} />);

      fireEvent.click(screen.getByTestId('food-card'));

      expect(onClick).toHaveBeenCalled();
    });

    it('onClick이 있으면 커서 스타일이 pointer가 된다', () => {
      render(<FoodCard food={mockFood} onClick={vi.fn()} />);

      expect(screen.getByTestId('food-card')).toHaveClass('cursor-pointer');
    });

    it('onClick이 없으면 커서 스타일이 기본값이다', () => {
      render(<FoodCard food={mockFood} />);

      expect(screen.getByTestId('food-card')).not.toHaveClass('cursor-pointer');
    });

    it('컴팩트 모드에서도 클릭이 동작한다', () => {
      const onClick = vi.fn();
      render(<FoodCard food={mockFood} compact onClick={onClick} />);

      fireEvent.click(screen.getByTestId('food-card-compact'));

      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('스타일 커스터마이징', () => {
    it('className prop이 적용된다', () => {
      render(<FoodCard food={mockFood} className="custom-class" />);

      expect(screen.getByTestId('food-card')).toHaveClass('custom-class');
    });

    it('컴팩트 모드에서도 className이 적용된다', () => {
      render(<FoodCard food={mockFood} compact className="custom-class" />);

      expect(screen.getByTestId('food-card-compact')).toHaveClass('custom-class');
    });
  });

  describe('브랜드 없는 식품', () => {
    it('브랜드가 없으면 표시하지 않는다', () => {
      const foodWithoutBrand = { ...mockFood, brand: undefined };
      render(<FoodCard food={foodWithoutBrand} />);

      expect(screen.queryByText('농심')).not.toBeInTheDocument();
    });

    it('컴팩트 모드에서 브랜드가 없으면 점(•)도 표시하지 않는다', () => {
      const foodWithoutBrand = { ...mockFood, brand: undefined };
      render(<FoodCard food={foodWithoutBrand} compact />);

      const text = screen.getByText(/500 kcal/).textContent;
      expect(text).not.toContain('•');
    });
  });

  describe('선택적 영양소 없는 경우', () => {
    it('선택적 영양소가 모두 없으면 추가 정보 섹션을 표시하지 않는다', () => {
      const foodWithoutOptional = {
        ...mockFood,
        fiber: undefined,
        sodium: undefined,
        sugar: undefined,
      };
      render(<FoodCard food={foodWithoutOptional} />);

      expect(screen.queryByText(/식이섬유/)).not.toBeInTheDocument();
      expect(screen.queryByText(/나트륨/)).not.toBeInTheDocument();
      expect(screen.queryByText(/당류/)).not.toBeInTheDocument();
    });

    it('일부 선택적 영양소만 있어도 표시한다', () => {
      const foodWithSomeOptional = {
        ...mockFood,
        fiber: undefined,
        sodium: 1000,
        sugar: undefined,
      };
      render(<FoodCard food={foodWithSomeOptional} />);

      expect(screen.getByText(/나트륨 1000mg/)).toBeInTheDocument();
      expect(screen.queryByText(/식이섬유/)).not.toBeInTheDocument();
    });
  });
});
