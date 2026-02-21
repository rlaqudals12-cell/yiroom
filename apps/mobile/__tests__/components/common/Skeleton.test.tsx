/**
 * Skeleton 로딩 컴포넌트 테스트
 *
 * 기본 Skeleton 및 변형(SkeletonText, SkeletonCard 등) 렌더링 검증.
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

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
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonListItem,
  SkeletonWorkoutCard,
  SkeletonNutritionSummary,
  SkeletonProductCard,
} from '../../../components/common/Skeleton';

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

describe('Skeleton', () => {
  describe('기본 Skeleton', () => {
    it('렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(<Skeleton />);

      expect(getByTestId('skeleton')).toBeTruthy();
    });

    it('testID="skeleton"이 존재해야 한다', () => {
      const { getByTestId } = renderWithTheme(<Skeleton />);

      const skeleton = getByTestId('skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('커스텀 width와 height가 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <Skeleton width={200} height={24} />
      );

      const skeleton = getByTestId('skeleton');
      // Animated.View의 스타일 배열에서 width/height 확인
      const flatStyle = skeleton.props.style;
      // 스타일 배열에서 width/height를 포함하는 항목 확인
      const hasCorrectDimensions = JSON.stringify(flatStyle).includes('"width":200')
        && JSON.stringify(flatStyle).includes('"height":24');
      expect(hasCorrectDimensions).toBe(true);
    });

    it('circle=true이면 borderRadius가 height/2이어야 한다', () => {
      const height = 48;
      const { getByTestId } = renderWithTheme(
        <Skeleton circle height={height} />
      );

      const skeleton = getByTestId('skeleton');
      const styleStr = JSON.stringify(skeleton.props.style);
      // circle일 때 borderRadius = height / 2 = 24
      expect(styleStr).toContain(`"borderRadius":${height / 2}`);
    });

    it('circle=true이면 width가 height와 같아야 한다', () => {
      const height = 40;
      const { getByTestId } = renderWithTheme(
        <Skeleton circle height={height} />
      );

      const skeleton = getByTestId('skeleton');
      const styleStr = JSON.stringify(skeleton.props.style);
      // circle일 때 width = height
      expect(styleStr).toContain(`"width":${height}`);
    });

    it('다크 모드에서 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(<Skeleton />, true);

      expect(getByTestId('skeleton')).toBeTruthy();
    });
  });

  describe('SkeletonText', () => {
    it('기본 1줄 렌더링되어야 한다', () => {
      const { getAllByTestId } = renderWithTheme(<SkeletonText />);

      expect(getAllByTestId('skeleton')).toHaveLength(1);
    });

    it('lines=3이면 3개의 Skeleton이 렌더링되어야 한다', () => {
      const { getAllByTestId } = renderWithTheme(<SkeletonText lines={3} />);

      expect(getAllByTestId('skeleton')).toHaveLength(3);
    });

    it('lines=5이면 5개의 Skeleton이 렌더링되어야 한다', () => {
      const { getAllByTestId } = renderWithTheme(<SkeletonText lines={5} />);

      expect(getAllByTestId('skeleton')).toHaveLength(5);
    });
  });

  describe('SkeletonCard', () => {
    it('렌더링되어야 한다', () => {
      const { getAllByTestId } = renderWithTheme(<SkeletonCard />);

      // SkeletonCard: 원형 아바타(1) + 헤더 텍스트(2) + SkeletonText(3줄) = 6개 skeleton
      const skeletons = getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThanOrEqual(4);
    });

    it('다크 모드에서 렌더링되어야 한다', () => {
      const { getAllByTestId } = renderWithTheme(<SkeletonCard />, true);

      expect(getAllByTestId('skeleton').length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('SkeletonListItem', () => {
    it('렌더링되어야 한다', () => {
      const { getAllByTestId } = renderWithTheme(<SkeletonListItem />);

      // SkeletonListItem: 원형(1) + 텍스트(2) = 3개 skeleton
      const skeletons = getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });

    it('다크 모드에서 렌더링되어야 한다', () => {
      const { getAllByTestId } = renderWithTheme(<SkeletonListItem />, true);

      expect(getAllByTestId('skeleton').length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('SkeletonWorkoutCard', () => {
    it('렌더링되어야 한다', () => {
      const { getAllByTestId } = renderWithTheme(<SkeletonWorkoutCard />);

      // SkeletonWorkoutCard: 이미지(1) + 제목(1) + 설명(1) + 통계(3) = 6개 skeleton
      const skeletons = getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThanOrEqual(5);
    });

    it('다크 모드에서 렌더링되어야 한다', () => {
      const { getAllByTestId } = renderWithTheme(<SkeletonWorkoutCard />, true);

      expect(getAllByTestId('skeleton').length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('SkeletonNutritionSummary', () => {
    it('렌더링되어야 한다', () => {
      const { getAllByTestId } = renderWithTheme(<SkeletonNutritionSummary />);

      // SkeletonNutritionSummary: 헤더(2) + 프로그레스바(1) + 영양소 통계(3 원형 + 3 텍스트) = 9개
      const skeletons = getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThanOrEqual(8);
    });

    it('다크 모드에서 렌더링되어야 한다', () => {
      const { getAllByTestId } = renderWithTheme(<SkeletonNutritionSummary />, true);

      expect(getAllByTestId('skeleton').length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('SkeletonProductCard', () => {
    it('렌더링되어야 한다', () => {
      const { getAllByTestId } = renderWithTheme(<SkeletonProductCard />);

      // SkeletonProductCard: 이미지(1) + 카테고리(1) + 이름(1) + 가격(2) = 5개 skeleton
      const skeletons = getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThanOrEqual(4);
    });

    it('다크 모드에서 렌더링되어야 한다', () => {
      const { getAllByTestId } = renderWithTheme(<SkeletonProductCard />, true);

      expect(getAllByTestId('skeleton').length).toBeGreaterThanOrEqual(4);
    });
  });
});
