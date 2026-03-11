/**
 * ScoreGauge 테스트
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
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';
import { ScoreGauge } from '../../../components/ui/ScoreGauge';

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
    themeMode: 'system' as const,
    setThemeMode: jest.fn(),
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

describe('ScoreGauge', () => {
  it('점수를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ScoreGauge score={75} />
    );
    expect(getByText('75')).toBeTruthy();
  });

  it('라벨을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ScoreGauge score={80} label="수분" />
    );
    expect(getByText('수분')).toBeTruthy();
    expect(getByText('80')).toBeTruthy();
  });

  it('testID가 전달되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <ScoreGauge score={50} testID="hydration-gauge" />
    );
    expect(getByTestId('hydration-gauge')).toBeTruthy();
  });

  it('단위 텍스트를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ScoreGauge score={65} unit="%" />
    );
    expect(getByText('%')).toBeTruthy();
  });

  it('최대값을 지정할 수 있어야 한다', () => {
    const { getByText } = renderWithTheme(
      <ScoreGauge score={7} max={10} />
    );
    expect(getByText('7')).toBeTruthy();
  });

  it('0점을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ScoreGauge score={0} />
    );
    expect(getByText('0')).toBeTruthy();
  });

  it('100점을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ScoreGauge score={100} />
    );
    expect(getByText('100')).toBeTruthy();
  });

  it('max 초과 시 max로 클램핑해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ScoreGauge score={150} max={100} />
    );
    expect(getByText('100')).toBeTruthy();
  });

  it('커스텀 formatValue를 사용해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ScoreGauge score={85} formatValue={(v) => `${v}점`} />
    );
    expect(getByText('85점')).toBeTruthy();
  });

  it('다크 모드에서 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <ScoreGauge score={60} label="탄력" />,
      true
    );
    expect(getByText('60')).toBeTruthy();
    expect(getByText('탄력')).toBeTruthy();
  });

  it('접근성 라벨이 설정되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <ScoreGauge score={72} label="수분" />
    );
    expect(getByLabelText('수분 72')).toBeTruthy();
  });
});
