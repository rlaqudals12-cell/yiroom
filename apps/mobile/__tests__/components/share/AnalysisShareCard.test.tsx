/**
 * AnalysisShareCard 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { AnalysisShareCard } from '../../../components/share/AnalysisShareCard';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors, brand, module: moduleColors,
    status: statusColors, grade: gradeColors, nutrient: nutrientColors,
    score: scoreColors, trust: trustColors, spacing, radii, shadows, typography,
    isDark, colorScheme: isDark ? 'dark' : 'light', themeMode: 'system', setThemeMode: jest.fn(),
  };
}
function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(<ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>);
}

describe('AnalysisShareCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <AnalysisShareCard analysisType="피부 분석" summary="복합성 피부, 보습 필요" />,
    );
    expect(getByTestId('analysis-share-card')).toBeTruthy();
  });

  it('분석 타입과 요약을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <AnalysisShareCard analysisType="피부 분석" summary="복합성 피부, 보습 필요" />,
    );
    expect(getByText('피부 분석')).toBeTruthy();
    expect(getByText('복합성 피부, 보습 필요')).toBeTruthy();
  });

  it('점수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <AnalysisShareCard analysisType="피부 분석" summary="요약" score={85} />,
    );
    expect(getByText('85점')).toBeTruthy();
  });

  it('공유 버튼을 누르면 onShare가 호출된다', () => {
    const onShare = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <AnalysisShareCard analysisType="피부 분석" summary="요약" onShare={onShare} />,
    );
    fireEvent.press(getByLabelText('공유하기'));
    expect(onShare).toHaveBeenCalled();
  });

  it('링크 복사 버튼을 누르면 onCopyLink가 호출된다', () => {
    const onCopyLink = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <AnalysisShareCard analysisType="피부 분석" summary="요약" onCopyLink={onCopyLink} />,
    );
    fireEvent.press(getByLabelText('링크 복사'));
    expect(onCopyLink).toHaveBeenCalled();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <AnalysisShareCard analysisType="피부 분석" summary="요약" />,
    );
    expect(getByLabelText('피부 분석 결과 공유')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <AnalysisShareCard analysisType="피부 분석" summary="요약" />,
      true,
    );
    expect(getByTestId('analysis-share-card')).toBeTruthy();
  });
});
