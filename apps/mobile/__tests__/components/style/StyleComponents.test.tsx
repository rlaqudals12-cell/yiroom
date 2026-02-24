/**
 * 스타일 탭 컴포넌트 테스트
 *
 * BodyProfileCard, ClosetPreviewStrip, TodayOutfitSuggestion
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
import { BodyProfileCard } from '../../../components/style/BodyProfileCard';
import { ClosetPreviewStrip } from '../../../components/style/ClosetPreviewStrip';
import { TodayOutfitSuggestion } from '../../../components/style/TodayOutfitSuggestion';
import type { InventoryItem, OutfitSuggestion, ClosetRecommendation } from '../../../lib/inventory';

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

// ========================================
// Mock 데이터
// ========================================

function createMockInventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'item-1',
    clerkUserId: 'user-1',
    category: 'closet',
    subCategory: 'top',
    name: '흰색 셔츠',
    imageUrl: 'https://example.com/shirt.jpg',
    originalImageUrl: null,
    metadata: {
      color: '화이트',
      pattern: 'solid',
      material: 'cotton',
      season: ['spring', 'summer', 'autumn'],
      occasion: ['daily', 'office'],
      size: 'M',
      brand: null,
      notes: null,
      isFavorite: false,
    },
    createdAt: new Date('2026-02-20'),
    updatedAt: new Date('2026-02-20'),
    ...overrides,
  };
}

function createMockRecommendation(
  item: InventoryItem
): ClosetRecommendation {
  return {
    item,
    score: { total: 85, colorScore: 90, bodyTypeScore: 80, seasonScore: 85 },
    reasons: ['색상이 잘 어울려요'],
  };
}

function createMockOutfitSuggestion(): OutfitSuggestion {
  const top = createMockInventoryItem({ id: 'top-1', name: '흰색 셔츠', subCategory: 'top' });
  const bottom = createMockInventoryItem({ id: 'bottom-1', name: '네이비 바지', subCategory: 'bottom' });
  const outer = createMockInventoryItem({ id: 'outer-1', name: '베이지 자켓', subCategory: 'outer' });
  return {
    top: createMockRecommendation(top),
    bottom: createMockRecommendation(bottom),
    outer: createMockRecommendation(outer),
    totalScore: 87,
    tips: ['오늘 날씨에 딱 맞는 코디예요'],
  };
}

// ========================================
// BodyProfileCard
// ========================================

describe('BodyProfileCard', () => {
  const defaultProps = {
    bodyType: 'hourglass',
    height: 170,
    weight: 60,
    bmi: 20.8,
    createdAt: new Date('2026-02-20'),
  };

  it('체형 타입 한국어 라벨을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <BodyProfileCard {...defaultProps} />
    );
    expect(getByText('모래시계형')).toBeTruthy();
  });

  it('BMI 값을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <BodyProfileCard {...defaultProps} />
    );
    expect(getByText(/BMI 20.8/)).toBeTruthy();
  });

  it('키/몸무게 뱃지를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <BodyProfileCard {...defaultProps} />
    );
    expect(getByText('170cm')).toBeTruthy();
    expect(getByText('60kg')).toBeTruthy();
  });

  it('BMI 라벨이 정상 범위를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <BodyProfileCard {...defaultProps} />
    );
    expect(getByText('정상')).toBeTruthy();
  });

  it('BMI 라벨이 저체중을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <BodyProfileCard {...{ ...defaultProps, bmi: 17.5 }} />
    );
    expect(getByText('저체중')).toBeTruthy();
  });

  it('BMI 라벨이 과체중을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <BodyProfileCard {...{ ...defaultProps, bmi: 24.0 }} />
    );
    expect(getByText('과체중')).toBeTruthy();
  });

  it('BMI 라벨이 비만을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <BodyProfileCard {...{ ...defaultProps, bmi: 27.0 }} />
    );
    expect(getByText('비만')).toBeTruthy();
  });

  it('알 수 없는 체형 타입은 그대로 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <BodyProfileCard {...{ ...defaultProps, bodyType: 'custom-type' }} />
    );
    expect(getByText('custom-type')).toBeTruthy();
  });

  it('날짜를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <BodyProfileCard {...defaultProps} />
    );
    expect(getByText('2/20 분석')).toBeTruthy();
  });

  it('testID를 설정해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <BodyProfileCard {...defaultProps} testID="body-card" />
    );
    expect(getByTestId('body-card')).toBeTruthy();
  });

  it('다크모드에서 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <BodyProfileCard {...defaultProps} />,
      true,
    );
    expect(getByText('모래시계형')).toBeTruthy();
  });

  it('접근성 라벨이 설정되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <BodyProfileCard {...defaultProps} />
    );
    expect(getByLabelText(/체형 프로필/)).toBeTruthy();
  });
});

// ========================================
// ClosetPreviewStrip
// ========================================

describe('ClosetPreviewStrip', () => {
  const mockItems: InventoryItem[] = [
    createMockInventoryItem({ id: 'i1', name: '셔츠 A' }),
    createMockInventoryItem({ id: 'i2', name: '바지 B' }),
    createMockInventoryItem({ id: 'i3', name: '자켓 C' }),
  ];

  it('아이템 수를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ClosetPreviewStrip items={mockItems} />
    );
    expect(getByText('3개 아이템')).toBeTruthy();
  });

  it('내 옷장 타이틀을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ClosetPreviewStrip items={mockItems} />
    );
    expect(getByText('내 옷장')).toBeTruthy();
  });

  it('아이템이 있을 때 전체 보기 버튼을 표시해야 한다', () => {
    const onViewAll = jest.fn();
    const { getByText } = renderWithTheme(
      <ClosetPreviewStrip items={mockItems} onViewAll={onViewAll} />
    );
    const btn = getByText('전체 보기');
    expect(btn).toBeTruthy();
    fireEvent.press(btn);
    expect(onViewAll).toHaveBeenCalled();
  });

  it('빈 배열일 때 안내 메시지를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ClosetPreviewStrip items={[]} />
    );
    expect(getByText('옷장에 아이템을 추가해보세요')).toBeTruthy();
  });

  it('빈 배열일 때 전체 보기 버튼을 숨겨야 한다', () => {
    const { queryByText } = renderWithTheme(
      <ClosetPreviewStrip items={[]} onViewAll={jest.fn()} />
    );
    expect(queryByText('전체 보기')).toBeNull();
  });

  it('testID를 설정해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <ClosetPreviewStrip items={mockItems} testID="closet" />
    );
    expect(getByTestId('closet')).toBeTruthy();
  });

  it('접근성 라벨이 아이템 수를 포함해야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <ClosetPreviewStrip items={mockItems} />
    );
    expect(getByLabelText(/3개 아이템/)).toBeTruthy();
  });

  it('다크모드에서 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <ClosetPreviewStrip items={mockItems} />,
      true,
    );
    expect(getByText('내 옷장')).toBeTruthy();
  });
});

// ========================================
// TodayOutfitSuggestion
// ========================================

describe('TodayOutfitSuggestion', () => {
  const suggestion = createMockOutfitSuggestion();

  it('오늘의 코디 타이틀을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <TodayOutfitSuggestion suggestion={suggestion} />
    );
    expect(getByText('오늘의 코디')).toBeTruthy();
  });

  it('매칭률을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <TodayOutfitSuggestion suggestion={suggestion} />
    );
    expect(getByText('매칭률 87%')).toBeTruthy();
  });

  it('슬롯 라벨을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <TodayOutfitSuggestion suggestion={suggestion} />
    );
    expect(getByText('아우터')).toBeTruthy();
    expect(getByText('상의')).toBeTruthy();
    expect(getByText('하의')).toBeTruthy();
  });

  it('선택 슬롯만 표시해야 한다 (outer 없으면 2개)', () => {
    const noOuter: OutfitSuggestion = {
      ...suggestion,
      outer: undefined,
    };
    const { queryByText } = renderWithTheme(
      <TodayOutfitSuggestion suggestion={noOuter} />
    );
    expect(queryByText('아우터')).toBeNull();
    expect(queryByText('상의')).toBeTruthy();
    expect(queryByText('하의')).toBeTruthy();
  });

  it('첫 번째 팁을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <TodayOutfitSuggestion suggestion={suggestion} />
    );
    expect(getByText('오늘 날씨에 딱 맞는 코디예요')).toBeTruthy();
  });

  it('팁이 없으면 팁 영역을 숨겨야 한다', () => {
    const noTips: OutfitSuggestion = { ...suggestion, tips: [] };
    const { queryByText } = renderWithTheme(
      <TodayOutfitSuggestion suggestion={noTips} />
    );
    expect(queryByText('오늘 날씨에 딱 맞는 코디예요')).toBeNull();
  });

  it('더보기 버튼을 누르면 onPress가 호출되어야 한다', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithTheme(
      <TodayOutfitSuggestion suggestion={suggestion} onPress={onPress} />
    );
    fireEvent.press(getByText('더보기'));
    expect(onPress).toHaveBeenCalled();
  });

  it('onPress가 없으면 더보기 버튼을 숨겨야 한다', () => {
    const { queryByText } = renderWithTheme(
      <TodayOutfitSuggestion suggestion={suggestion} />
    );
    expect(queryByText('더보기')).toBeNull();
  });

  it('testID를 설정해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <TodayOutfitSuggestion suggestion={suggestion} testID="outfit" />
    );
    expect(getByTestId('outfit')).toBeTruthy();
  });

  it('접근성 라벨이 매칭률을 포함해야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <TodayOutfitSuggestion suggestion={suggestion} />
    );
    expect(getByLabelText(/매칭률 87%/)).toBeTruthy();
  });

  it('다크모드에서 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <TodayOutfitSuggestion suggestion={suggestion} />,
      true,
    );
    expect(getByText('오늘의 코디')).toBeTruthy();
  });
});
