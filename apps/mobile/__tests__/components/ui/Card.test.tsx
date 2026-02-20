/**
 * Card UI 컴포넌트 테스트
 *
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
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../../components/ui/Card';

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

describe('Card', () => {
  it('children을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <Card>
        <CardContent>
          <CardTitle>테스트 카드</CardTitle>
        </CardContent>
      </Card>
    );

    expect(getByText('테스트 카드')).toBeTruthy();
  });

  it('testID가 전달되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <Card testID="my-card">
        <CardContent>
          <CardTitle>카드</CardTitle>
        </CardContent>
      </Card>
    );

    expect(getByTestId('my-card')).toBeTruthy();
  });

  it('다크 모드에서도 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <Card>
        <CardContent>
          <CardTitle>다크 카드</CardTitle>
        </CardContent>
      </Card>,
      true
    );

    expect(getByText('다크 카드')).toBeTruthy();
  });
});

describe('CardHeader', () => {
  it('children을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <Card>
        <CardHeader>
          <CardTitle>헤더 제목</CardTitle>
        </CardHeader>
      </Card>
    );

    expect(getByText('헤더 제목')).toBeTruthy();
  });
});

describe('CardTitle', () => {
  it('텍스트를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <Card>
        <CardTitle>제목 텍스트</CardTitle>
      </Card>
    );

    expect(getByText('제목 텍스트')).toBeTruthy();
  });
});

describe('CardDescription', () => {
  it('설명 텍스트를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <Card>
        <CardDescription>설명 텍스트</CardDescription>
      </Card>
    );

    expect(getByText('설명 텍스트')).toBeTruthy();
  });
});

describe('CardContent', () => {
  it('children을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <Card>
        <CardContent>
          <CardTitle>콘텐츠 내부</CardTitle>
        </CardContent>
      </Card>
    );

    expect(getByText('콘텐츠 내부')).toBeTruthy();
  });
});

describe('CardFooter', () => {
  it('children을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <Card>
        <CardFooter>
          <CardTitle>푸터 내부</CardTitle>
        </CardFooter>
      </Card>
    );

    expect(getByText('푸터 내부')).toBeTruthy();
  });
});

describe('Card 전체 조합', () => {
  it('Header + Title + Description + Content + Footer 조합이 정상 렌더링되어야 한다', () => {
    const { getByText, getByTestId } = renderWithTheme(
      <Card testID="full-card">
        <CardHeader>
          <CardTitle>피부 분석</CardTitle>
          <CardDescription>AI 기반 피부 상태 분석</CardDescription>
        </CardHeader>
        <CardContent>
          <CardTitle>분석 결과</CardTitle>
        </CardContent>
        <CardFooter>
          <CardTitle>자세히 보기</CardTitle>
        </CardFooter>
      </Card>
    );

    expect(getByTestId('full-card')).toBeTruthy();
    expect(getByText('피부 분석')).toBeTruthy();
    expect(getByText('AI 기반 피부 상태 분석')).toBeTruthy();
    expect(getByText('분석 결과')).toBeTruthy();
    expect(getByText('자세히 보기')).toBeTruthy();
  });
});
