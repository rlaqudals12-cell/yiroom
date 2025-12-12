import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ProductCard } from '@/components/products/ProductCard';
import type { CosmeticProduct, SupplementProduct, WorkoutEquipment, HealthFood } from '@/types/product';

// next/image 모킹
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// next/link 모킹
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock 제품 데이터
const mockCosmeticProduct: CosmeticProduct = {
  id: 'cosmetic-1',
  name: '테스트 세럼',
  brand: '테스트 브랜드',
  category: 'serum',
  priceKrw: 35000,
  rating: 4.5,
  reviewCount: 123,
  imageUrl: 'https://example.com/image.jpg',
};

const mockSupplementProduct: SupplementProduct = {
  id: 'supplement-1',
  name: '비타민 C',
  brand: '영양제 브랜드',
  category: 'vitamin',
  benefits: ['skin', 'immunity'],
  mainIngredients: [{ name: 'Vitamin C', amount: 1000, unit: 'mg' }], // getProductType 판별용
  priceKrw: 25000,
  rating: 4.7,
  reviewCount: 456,
};

const mockWorkoutEquipment: WorkoutEquipment = {
  id: 'equipment-1',
  name: '덤벨 세트',
  brand: '운동기구 브랜드',
  category: 'dumbbell',
  targetMuscles: ['arms', 'shoulders'], // getProductType 판별용
  skillLevel: 'all',
  priceKrw: 50000,
  rating: 4.8,
  reviewCount: 78,
};

const mockHealthFood: HealthFood = {
  id: 'healthfood-1',
  name: '프로틴 파우더',
  brand: '건강식품 브랜드',
  category: 'protein_powder',
  caloriesPerServing: 120, // getProductType 판별용
  proteinG: 25,
  benefits: ['muscle_gain', 'recovery'],
  dietaryInfo: ['gluten_free'],
  priceKrw: 45000,
  rating: 4.6,
  reviewCount: 234,
};

describe('ProductCard', () => {
  describe('기본 렌더링', () => {
    it('화장품 제품 정보 표시', () => {
      render(<ProductCard product={mockCosmeticProduct} />);

      expect(screen.getByText('테스트 브랜드')).toBeInTheDocument();
      expect(screen.getByText('테스트 세럼')).toBeInTheDocument();
      expect(screen.getByText('₩35,000')).toBeInTheDocument();
    });

    it('영양제 제품 정보 표시', () => {
      render(<ProductCard product={mockSupplementProduct} />);

      expect(screen.getByText('영양제 브랜드')).toBeInTheDocument();
      expect(screen.getByText('비타민 C')).toBeInTheDocument();
      expect(screen.getByText('₩25,000')).toBeInTheDocument();
    });

    it('운동기구 제품 정보 표시', () => {
      render(<ProductCard product={mockWorkoutEquipment} />);

      expect(screen.getByText('운동기구 브랜드')).toBeInTheDocument();
      expect(screen.getByText('덤벨 세트')).toBeInTheDocument();
      expect(screen.getByText('₩50,000')).toBeInTheDocument();
    });

    it('건강식품 제품 정보 표시', () => {
      render(<ProductCard product={mockHealthFood} />);

      expect(screen.getByText('건강식품 브랜드')).toBeInTheDocument();
      expect(screen.getByText('프로틴 파우더')).toBeInTheDocument();
      expect(screen.getByText('₩45,000')).toBeInTheDocument();
    });
  });

  describe('평점 표시', () => {
    it('평점이 있으면 별점 표시', () => {
      render(<ProductCard product={mockCosmeticProduct} />);

      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('리뷰 수 표시', () => {
      render(<ProductCard product={mockCosmeticProduct} />);

      expect(screen.getByText('(123)')).toBeInTheDocument();
    });
  });

  describe('매칭도 배지', () => {
    it('매칭도가 있으면 배지 표시', () => {
      render(<ProductCard product={mockCosmeticProduct} matchScore={85} />);

      // "XX% 매칭" 형식으로 표시됨
      expect(screen.getByText('85% 매칭')).toBeInTheDocument();
    });

    it('매칭도가 없으면 배지 미표시', () => {
      render(<ProductCard product={mockCosmeticProduct} />);

      expect(screen.queryByText(/% 매칭/)).not.toBeInTheDocument();
    });

    it('매칭도가 0이면 배지 미표시', () => {
      render(<ProductCard product={mockCosmeticProduct} matchScore={0} />);

      expect(screen.queryByText(/% 매칭/)).not.toBeInTheDocument();
    });
  });

  describe('이미지', () => {
    it('이미지 URL이 있으면 이미지 표시', () => {
      render(<ProductCard product={mockCosmeticProduct} />);

      const img = screen.getByAltText('테스트 세럼');
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('이미지 URL이 없으면 placeholder 아이콘 표시', () => {
      const productWithoutImage = { ...mockCosmeticProduct, imageUrl: undefined };
      render(<ProductCard product={productWithoutImage} />);

      // Package 아이콘이 placeholder로 사용됨 - 이미지가 없으면 alt text도 없음
      expect(screen.queryByAltText('테스트 세럼')).not.toBeInTheDocument();
    });
  });

  describe('링크', () => {
    it('화장품 상세 페이지 링크', () => {
      render(<ProductCard product={mockCosmeticProduct} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/products/cosmetic/cosmetic-1');
    });

    it('영양제 상세 페이지 링크', () => {
      render(<ProductCard product={mockSupplementProduct} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/products/supplement/supplement-1');
    });

    it('운동기구 상세 페이지 링크', () => {
      render(<ProductCard product={mockWorkoutEquipment} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/products/equipment/equipment-1');
    });

    it('건강식품 상세 페이지 링크', () => {
      render(<ProductCard product={mockHealthFood} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/products/healthfood/healthfood-1');
    });
  });
});
