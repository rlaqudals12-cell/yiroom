/**
 * ZoneDetailCard 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ZoneDetailCard } from '../../../components/analysis/ZoneDetailCard';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors, brand, module: moduleColors,
    status: statusColors, grade: gradeColors, nutrient: nutrientColors,
    score: scoreColors, trust: trustColors, spacing, radii, shadows, typography,
    isDark, colorScheme: isDark ? 'dark' : 'light', themeMode: 'system', setThemeMode: jest.fn(),
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>,
  );
}

describe('ZoneDetailCard', () => {
  const defaultProps = {
    zoneId: 'tZone',
    zoneName: 'T존',
    score: 65,
    status: 'normal' as const,
    concerns: ['유분 과다', '모공 확대'],
    recommendations: ['클레이 마스크', 'BHA 토너'],
  };

  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<ZoneDetailCard {...defaultProps} />);
    expect(getByTestId('zone-detail-card')).toBeTruthy();
  });

  it('존 이름을 표시한다', () => {
    const { getByText } = renderWithTheme(<ZoneDetailCard {...defaultProps} />);
    expect(getByText('T존')).toBeTruthy();
  });

  it('점수를 표시한다', () => {
    const { getByText } = renderWithTheme(<ZoneDetailCard {...defaultProps} />);
    expect(getByText('65')).toBeTruthy();
  });

  it('상태 배지를 표시한다', () => {
    const { getByText } = renderWithTheme(<ZoneDetailCard {...defaultProps} />);
    expect(getByText('보통')).toBeTruthy();
  });

  it('우려사항을 표시한다', () => {
    const { getByText } = renderWithTheme(<ZoneDetailCard {...defaultProps} />);
    expect(getByText('유분 과다')).toBeTruthy();
    expect(getByText('모공 확대')).toBeTruthy();
  });

  it('추천 관리를 표시한다', () => {
    const { getByText } = renderWithTheme(<ZoneDetailCard {...defaultProps} />);
    expect(getByText('클레이 마스크')).toBeTruthy();
    expect(getByText('BHA 토너')).toBeTruthy();
  });

  it('닫기 버튼을 누르면 onClose가 호출된다', () => {
    const onClose = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <ZoneDetailCard {...defaultProps} onClose={onClose} />,
    );
    fireEvent.press(getByLabelText('닫기'));
    expect(onClose).toHaveBeenCalled();
  });

  it('good 상태를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ZoneDetailCard {...defaultProps} status="good" concerns={[]} />,
    );
    expect(getByText('좋음')).toBeTruthy();
  });

  it('warning 상태를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ZoneDetailCard {...defaultProps} status="warning" />,
    );
    expect(getByText('주의 필요')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<ZoneDetailCard {...defaultProps} />, true);
    expect(getByTestId('zone-detail-card')).toBeTruthy();
  });
});
