/**
 * WaterWidget 컴포넌트 테스트
 *
 * 물 섭취량, 목표 진행률, 잔 수 계산, +1잔 버튼 동작 검증.
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
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
import { WaterWidget } from '../../../components/widgets/WaterWidget';

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
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>
  );
}

describe('WaterWidget', () => {
  describe('medium size (기본)', () => {
    it('기본 렌더링이 정상 동작해야 한다', () => {
      const { getByText } = renderWithTheme(
        <WaterWidget current={1500} goal={2000} />
      );

      expect(getByText(/물 섭취/)).toBeTruthy();
    });

    it('testID="water-widget"이 존재해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <WaterWidget current={1000} goal={2000} />
      );

      expect(getByTestId('water-widget')).toBeTruthy();
    });

    it('현재 섭취량을 ml 단위로 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <WaterWidget current={1500} goal={2000} />
      );

      // currentLarge 텍스트는 "1500" + 중첩 <Text>"ml"</Text> = "1500ml"
      expect(getByText('1500ml')).toBeTruthy();
    });

    it('목표량을 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <WaterWidget current={1500} goal={2000} />
      );

      expect(getByText('목표: 2000ml')).toBeTruthy();
    });

    it('잔 수를 계산하여 표시해야 한다 (1500ml -> 6잔)', () => {
      const { getByText } = renderWithTheme(
        <WaterWidget current={1500} goal={2000} />
      );

      // floor(1500 / 250) = 6
      expect(getByText('6잔 마심')).toBeTruthy();
    });

    it('잔 수 계산이 정확해야 한다 (750ml -> 3잔)', () => {
      const { getByText } = renderWithTheme(
        <WaterWidget current={750} goal={2000} />
      );

      // floor(750 / 250) = 3
      expect(getByText('3잔 마심')).toBeTruthy();
    });

    it('남은 양을 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <WaterWidget current={1500} goal={2000} />
      );

      expect(getByText('500ml 남음')).toBeTruthy();
    });

    it('목표 달성 시 남은 양을 표시하지 않아야 한다', () => {
      const { queryByText } = renderWithTheme(
        <WaterWidget current={2000} goal={2000} />
      );

      expect(queryByText(/남음/)).toBeNull();
    });

    it('목표 초과 시에도 남은 양을 표시하지 않아야 한다', () => {
      const { queryByText } = renderWithTheme(
        <WaterWidget current={2500} goal={2000} />
      );

      expect(queryByText(/남음/)).toBeNull();
    });

    it('다크 모드에서도 정상 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <WaterWidget current={1000} goal={2000} />,
        true
      );

      // currentLarge 텍스트: "1000" + <Text>"ml"</Text> = "1000ml"
      expect(getByText('1000ml')).toBeTruthy();
    });
  });

  describe('+1잔 버튼', () => {
    it('onAddWater가 있으면 "+1잔" 버튼을 표시해야 한다', () => {
      const handleAddWater = jest.fn();
      const { getByText } = renderWithTheme(
        <WaterWidget current={1000} goal={2000} onAddWater={handleAddWater} />
      );

      expect(getByText('+1잔')).toBeTruthy();
    });

    it('"+1잔" 버튼 클릭 시 onAddWater(250)을 호출해야 한다', () => {
      const handleAddWater = jest.fn();
      const { getByText } = renderWithTheme(
        <WaterWidget current={1000} goal={2000} onAddWater={handleAddWater} />
      );

      fireEvent.press(getByText('+1잔'));
      expect(handleAddWater).toHaveBeenCalledTimes(1);
      expect(handleAddWater).toHaveBeenCalledWith(250);
    });

    it('onAddWater가 없으면 "+1잔" 버튼을 표시하지 않아야 한다', () => {
      const { queryByText } = renderWithTheme(
        <WaterWidget current={1000} goal={2000} />
      );

      expect(queryByText('+1잔')).toBeNull();
    });
  });

  describe('size="small"', () => {
    it('리터 단위로 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <WaterWidget current={1500} goal={2000} size="small" />
      );

      // (1500 / 1000).toFixed(1) = "1.5"
      expect(getByText('1.5L')).toBeTruthy();
    });

    it('0ml일 때 0.0L로 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <WaterWidget current={0} goal={2000} size="small" />
      );

      expect(getByText('0.0L')).toBeTruthy();
    });

    it('물방울 아이콘을 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <WaterWidget current={1000} goal={2000} size="small" />
      );

      expect(getByText('💧')).toBeTruthy();
    });

    it('testID가 없어야 한다 (medium에만 존재)', () => {
      const { queryByTestId } = renderWithTheme(
        <WaterWidget current={1000} goal={2000} size="small" />
      );

      expect(queryByTestId('water-widget')).toBeNull();
    });

    it('"small" 사이즈에서는 "+1잔" 버튼이 없어야 한다', () => {
      const handleAddWater = jest.fn();
      const { queryByText } = renderWithTheme(
        <WaterWidget current={1000} goal={2000} onAddWater={handleAddWater} size="small" />
      );

      expect(queryByText('+1잔')).toBeNull();
    });
  });

  describe('엣지 케이스', () => {
    it('current가 0일 때 정상 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <WaterWidget current={0} goal={2000} />
      );

      // currentLarge: "0" + <Text>"ml"</Text> = "0ml"
      expect(getByText('0ml')).toBeTruthy();
      expect(getByText('0잔 마심')).toBeTruthy();
      expect(getByText('2000ml 남음')).toBeTruthy();
    });

    it('current가 goal을 크게 초과해도 에러 없이 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <WaterWidget current={5000} goal={2000} />
      );

      // currentLarge: "5000" + <Text>"ml"</Text> = "5000ml"
      expect(getByText('5000ml')).toBeTruthy();
      // floor(5000 / 250) = 20
      expect(getByText('20잔 마심')).toBeTruthy();
    });

    it('잔 수가 소수점일 때 내림 처리해야 한다 (600ml -> 2잔)', () => {
      const { getByText } = renderWithTheme(
        <WaterWidget current={600} goal={2000} />
      );

      // floor(600 / 250) = 2
      expect(getByText('2잔 마심')).toBeTruthy();
    });
  });
});
