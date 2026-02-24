/**
 * 뷰티 탭 컴포넌트 테스트
 *
 * SkinProfileCard, SkinConcernFilter, CategoryFilter,
 * ProductMiniCard, BeautyProductFeed
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';
import { SkinProfileCard } from '../../../components/beauty/SkinProfileCard';
import { SkinConcernFilter } from '../../../components/beauty/SkinConcernFilter';
import { CategoryFilter } from '../../../components/beauty/CategoryFilter';
import { ProductMiniCard, type BeautyProduct } from '../../../components/beauty/ProductMiniCard';
import { BeautyProductFeed } from '../../../components/beauty/BeautyProductFeed';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

// --- SkinProfileCard ---
describe('SkinProfileCard', () => {
  const defaultProps = {
    skinType: 'combination',
    overallScore: 78,
    concerns: ['건조', '모공', '주름'],
    createdAt: new Date('2026-02-20'),
  };

  it('피부 타입과 점수를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <SkinProfileCard {...defaultProps} />
    );
    expect(getByText('복합성')).toBeTruthy();
    expect(getByText(/전체 점수 78점/)).toBeTruthy();
  });

  it('고민 배지를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <SkinProfileCard {...defaultProps} />
    );
    expect(getByText('건조')).toBeTruthy();
    expect(getByText('모공')).toBeTruthy();
    expect(getByText('주름')).toBeTruthy();
  });

  it('4개 초과 고민은 +N 배지를 표시해야 한다', () => {
    const manyProps = {
      ...defaultProps,
      concerns: ['건조', '모공', '주름', '여드름', '피지'],
    };
    const { getByText } = renderWithTheme(
      <SkinProfileCard {...manyProps} />
    );
    expect(getByText('+1')).toBeTruthy();
  });

  it('testID를 전달해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <SkinProfileCard {...defaultProps} testID="skin-card" />
    );
    expect(getByTestId('skin-card')).toBeTruthy();
  });

  it('accessibilityLabel이 설정되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <SkinProfileCard {...defaultProps} />
    );
    expect(getByLabelText(/피부 프로필.*복합성.*78점/)).toBeTruthy();
  });

  it('다크모드에서 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <SkinProfileCard {...defaultProps} />,
      true
    );
    expect(getByText('복합성')).toBeTruthy();
  });

  it('분석 날짜를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <SkinProfileCard {...defaultProps} />
    );
    expect(getByText('2/20 분석')).toBeTruthy();
  });

  it('빈 고민 배열이어도 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <SkinProfileCard {...defaultProps} concerns={[]} />
    );
    expect(getByText('복합성')).toBeTruthy();
  });
});

// --- SkinConcernFilter ---
describe('SkinConcernFilter', () => {
  it('제목을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <SkinConcernFilter selected={[]} onSelectionChange={() => {}} />
    );
    expect(getByText('피부 고민')).toBeTruthy();
  });

  it('고민 칩들을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <SkinConcernFilter selected={[]} onSelectionChange={() => {}} />
    );
    expect(getByText('건조')).toBeTruthy();
    expect(getByText('여드름')).toBeTruthy();
    expect(getByText('주름')).toBeTruthy();
  });

  it('testID를 전달해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <SkinConcernFilter selected={[]} onSelectionChange={() => {}} testID="concern" />
    );
    expect(getByTestId('concern')).toBeTruthy();
  });

  it('accessibilityLabel이 설정되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <SkinConcernFilter selected={[]} onSelectionChange={() => {}} />
    );
    expect(getByLabelText('피부 고민 필터')).toBeTruthy();
  });
});

// --- CategoryFilter ---
describe('CategoryFilter', () => {
  it('제목을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <CategoryFilter selected="all" onSelectionChange={() => {}} />
    );
    expect(getByText('카테고리')).toBeTruthy();
  });

  it('카테고리 칩들을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <CategoryFilter selected="all" onSelectionChange={() => {}} />
    );
    expect(getByText('전체')).toBeTruthy();
    expect(getByText('스킨케어')).toBeTruthy();
    expect(getByText('메이크업')).toBeTruthy();
  });

  it('testID를 전달해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <CategoryFilter selected="all" onSelectionChange={() => {}} testID="cat" />
    );
    expect(getByTestId('cat')).toBeTruthy();
  });

  it('accessibilityLabel이 설정되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <CategoryFilter selected="all" onSelectionChange={() => {}} />
    );
    expect(getByLabelText('카테고리 필터')).toBeTruthy();
  });
});

// --- ProductMiniCard ---
describe('ProductMiniCard', () => {
  const mockProduct: BeautyProduct = {
    id: 'p1',
    name: '히알루론산 수분 세럼',
    brand: '이니스프리',
    matchRate: 92,
    rating: 4.5,
    category: 'skincare',
    concerns: ['dryness'],
  };

  it('브랜드와 이름을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ProductMiniCard product={mockProduct} />
    );
    expect(getByText('이니스프리')).toBeTruthy();
    expect(getByText('히알루론산 수분 세럼')).toBeTruthy();
  });

  it('매치율을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ProductMiniCard product={mockProduct} />
    );
    expect(getByText('92%')).toBeTruthy();
  });

  it('평점을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ProductMiniCard product={mockProduct} />
    );
    expect(getByText('4.5')).toBeTruthy();
  });

  it('onPress 콜백을 호출해야 한다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <ProductMiniCard product={mockProduct} onPress={onPress} testID="card" />
    );
    fireEvent.press(getByTestId('card'));
    expect(onPress).toHaveBeenCalledWith(mockProduct);
  });

  it('testID를 전달해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <ProductMiniCard product={mockProduct} testID="mini" />
    );
    expect(getByTestId('mini')).toBeTruthy();
  });

  it('accessibilityLabel에 브랜드와 매치율이 포함되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <ProductMiniCard product={mockProduct} />
    );
    expect(getByLabelText(/이니스프리.*히알루론산.*92%/)).toBeTruthy();
  });

  it('다크모드에서 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ProductMiniCard product={mockProduct} />,
      true
    );
    expect(getByText('이니스프리')).toBeTruthy();
  });

  it('이미지 없을 때 이모지 폴백을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ProductMiniCard product={{ ...mockProduct, imageUrl: undefined }} />
    );
    expect(getByText('🧴')).toBeTruthy();
  });
});

// --- BeautyProductFeed ---
describe('BeautyProductFeed', () => {
  const mockProducts: BeautyProduct[] = [
    {
      id: 'p1',
      name: '수분 세럼',
      brand: '브랜드A',
      matchRate: 90,
      rating: 4.5,
      category: 'skincare',
      concerns: ['dryness'],
    },
    {
      id: 'p2',
      name: '선크림',
      brand: '브랜드B',
      matchRate: 80,
      rating: 4.0,
      category: 'suncare',
      concerns: ['sensitivity'],
    },
    {
      id: 'p3',
      name: '파운데이션',
      brand: '브랜드C',
      matchRate: 75,
      rating: 4.2,
      category: 'makeup',
      concerns: ['dryness', 'pores'],
    },
  ];

  it('전체 제품 수를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <BeautyProductFeed
        products={mockProducts}
        categoryFilter="all"
        concernFilter={[]}
      />
    );
    expect(getByText('추천 제품 3개')).toBeTruthy();
  });

  it('카테고리 필터를 적용해야 한다', () => {
    const { getByText, queryByText } = renderWithTheme(
      <BeautyProductFeed
        products={mockProducts}
        categoryFilter="skincare"
        concernFilter={[]}
      />
    );
    expect(getByText('추천 제품 1개')).toBeTruthy();
    expect(getByText('수분 세럼')).toBeTruthy();
    expect(queryByText('선크림')).toBeNull();
  });

  it('고민 필터를 적용해야 한다', () => {
    const { getByText, queryByText } = renderWithTheme(
      <BeautyProductFeed
        products={mockProducts}
        categoryFilter="all"
        concernFilter={['sensitivity']}
      />
    );
    expect(getByText('추천 제품 1개')).toBeTruthy();
    expect(getByText('선크림')).toBeTruthy();
    expect(queryByText('수분 세럼')).toBeNull();
  });

  it('필터 결과 0건 시 빈 상태를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <BeautyProductFeed
        products={mockProducts}
        categoryFilter="haircare"
        concernFilter={[]}
      />
    );
    expect(getByText('일치하는 제품이 없어요')).toBeTruthy();
  });

  it('testID를 전달해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <BeautyProductFeed
        products={mockProducts}
        categoryFilter="all"
        concernFilter={[]}
        testID="feed"
      />
    );
    expect(getByTestId('feed')).toBeTruthy();
  });

  it('다크모드에서 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <BeautyProductFeed
        products={mockProducts}
        categoryFilter="all"
        concernFilter={[]}
      />,
      true
    );
    expect(getByText('추천 제품 3개')).toBeTruthy();
  });
});
