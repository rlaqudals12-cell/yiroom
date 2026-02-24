/**
 * FilterChip + FilterChipGroup 테스트
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
import { FilterChip } from '../../../components/ui/FilterChip';
import { FilterChipGroup } from '../../../components/ui/FilterChipGroup';

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

describe('FilterChip', () => {
  it('라벨을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <FilterChip label="건성" />
    );
    expect(getByText('건성')).toBeTruthy();
  });

  it('testID가 전달되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <FilterChip label="지성" testID="chip-oily" />
    );
    expect(getByTestId('chip-oily')).toBeTruthy();
  });

  it('선택 상태를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <FilterChip label="민감성" selected />
    );
    expect(getByText('민감성')).toBeTruthy();
  });

  it('onPress가 호출되어야 한다', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithTheme(
      <FilterChip label="복합성" onPress={onPress} />
    );
    fireEvent.press(getByText('복합성'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('다크 모드에서 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <FilterChip label="다크칩" selected />,
      true
    );
    expect(getByText('다크칩')).toBeTruthy();
  });

  it('접근성 라벨이 설정되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <FilterChip label="수분" selected />
    );
    expect(getByLabelText('수분 필터 선택됨')).toBeTruthy();
  });
});

describe('FilterChipGroup', () => {
  const items = [
    { key: 'dry', label: '건성' },
    { key: 'oily', label: '지성' },
    { key: 'combo', label: '복합성' },
  ];

  it('모든 칩을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <FilterChipGroup
        items={items}
        selected=""
        onSelectionChange={() => {}}
      />
    );
    expect(getByText('건성')).toBeTruthy();
    expect(getByText('지성')).toBeTruthy();
    expect(getByText('복합성')).toBeTruthy();
  });

  it('단일 선택 모드에서 선택 콜백이 호출되어야 한다', () => {
    const onSelectionChange = jest.fn();
    const { getByText } = renderWithTheme(
      <FilterChipGroup
        items={items}
        selected=""
        onSelectionChange={onSelectionChange}
      />
    );
    fireEvent.press(getByText('지성'));
    expect(onSelectionChange).toHaveBeenCalledWith('oily');
  });

  it('단일 선택 모드에서 같은 칩을 누르면 해제되어야 한다', () => {
    const onSelectionChange = jest.fn();
    const { getByText } = renderWithTheme(
      <FilterChipGroup
        items={items}
        selected="oily"
        onSelectionChange={onSelectionChange}
      />
    );
    fireEvent.press(getByText('지성'));
    expect(onSelectionChange).toHaveBeenCalledWith('');
  });

  it('다중 선택 모드에서 추가 선택이 되어야 한다', () => {
    const onSelectionChange = jest.fn();
    const { getByText } = renderWithTheme(
      <FilterChipGroup
        items={items}
        selected={['dry']}
        onSelectionChange={onSelectionChange}
        multiSelect
      />
    );
    fireEvent.press(getByText('지성'));
    expect(onSelectionChange).toHaveBeenCalledWith(['dry', 'oily']);
  });

  it('다중 선택 모드에서 선택 해제가 되어야 한다', () => {
    const onSelectionChange = jest.fn();
    const { getByText } = renderWithTheme(
      <FilterChipGroup
        items={items}
        selected={['dry', 'oily']}
        onSelectionChange={onSelectionChange}
        multiSelect
      />
    );
    fireEvent.press(getByText('건성'));
    expect(onSelectionChange).toHaveBeenCalledWith(['oily']);
  });

  it('testID가 각 칩에 전파되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <FilterChipGroup
        items={items}
        selected=""
        onSelectionChange={() => {}}
        testID="skin-filter"
      />
    );
    expect(getByTestId('skin-filter-dry')).toBeTruthy();
    expect(getByTestId('skin-filter-oily')).toBeTruthy();
  });
});
