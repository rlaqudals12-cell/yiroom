/**
 * HomeHeader 컴포넌트 테스트
 *
 * 서버 브리핑 인사말 + 사용자명 렌더링 검증.
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
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';
import { HomeHeader } from '../../../components/home/HomeHeader';

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
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>
  );
}

describe('HomeHeader', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('사용자명을 렌더링해야 한다 (isLoaded=true)', () => {
    const { getByText } = renderWithTheme(
      <HomeHeader userName="홍길동" isLoaded={true} isSignedIn={true} />
    );

    expect(getByText('홍길동님')).toBeTruthy();
  });

  it('로딩 중일 때 "...님"을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <HomeHeader userName="홍길동" isLoaded={false} isSignedIn={true} />
    );

    expect(getByText('...님')).toBeTruthy();
  });

  it('testID="home-header"가 존재해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <HomeHeader userName="테스트" isLoaded={true} isSignedIn={true} />
    );

    expect(getByTestId('home-header')).toBeTruthy();
  });

  it('다크 모드에서도 렌더링되어야 한다', () => {
    const { getByText, getByTestId } = renderWithTheme(
      <HomeHeader userName="다크유저" isLoaded={true} isSignedIn={true} />,
      true
    );

    expect(getByTestId('home-header')).toBeTruthy();
    expect(getByText('다크유저님')).toBeTruthy();
  });

  it('로그아웃 상태에서는 가짜 사용자명 없이 브랜드 한 줄만 표시한다', () => {
    const { getByText, queryByText } = renderWithTheme(
      <HomeHeader userName="" isLoaded={true} isSignedIn={false} />
    );

    expect(getByText('온전한 나를 찾는 여정, 이룸')).toBeTruthy();
    expect(queryByText('사용자님')).toBeNull();
    expect(queryByText('님')).toBeNull();
  });

  describe('브리핑과 단일 인사 소스', () => {
    it('브리핑이 아직 없으면 로컬 시간대의 자연스러운 인사를 표시한다', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 7, 27, 7, 0, 0));
      const { getByText } = renderWithTheme(
        <HomeHeader userName="새벽유저" isLoaded={true} isSignedIn={true} />
      );

      expect(getByText('좋은 아침이에요')).toBeTruthy();
    });

    it('오프라인 밤 시간에는 좋은 밤 인사를 표시한다', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 7, 27, 23, 0, 0));
      const { getByText } = renderWithTheme(
        <HomeHeader userName="밤유저" isLoaded={true} isSignedIn={true} />
      );

      expect(getByText('좋은 밤이에요')).toBeTruthy();
    });

    it('오프라인 오후 시간에는 자연스러운 좋은 오후예요를 표시한다', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 7, 27, 15, 0, 0));
      const { getByText, queryByText } = renderWithTheme(
        <HomeHeader userName="오후유저" isLoaded={true} isSignedIn={true} />
      );

      expect(getByText('좋은 오후예요')).toBeTruthy();
      expect(queryByText('좋은 오후이에요')).toBeNull();
    });

    it('서버 브리핑의 아침 인사를 그대로 사용한다', () => {
      const { getByText } = renderWithTheme(
        <HomeHeader
          userName="아침유저"
          isLoaded={true}
          isSignedIn={true}
          briefingGreeting="좋은 아침이에요"
        />
      );

      expect(getByText('좋은 아침이에요')).toBeTruthy();
    });

    it('서버 브리핑의 오후 인사를 그대로 사용한다', () => {
      const { getByText } = renderWithTheme(
        <HomeHeader
          userName="오후유저"
          isLoaded={true}
          isSignedIn={true}
          briefingGreeting="좋은 오후예요"
        />
      );

      expect(getByText('좋은 오후예요')).toBeTruthy();
    });

    it('서버가 이름을 포함하면 히어로 제목과 중복되지 않게 시간 인사만 분리한다', () => {
      const { getByText } = renderWithTheme(
        <HomeHeader
          userName="저녁유저"
          isLoaded={true}
          isSignedIn={true}
          briefingGreeting="저녁유저님, 좋은 저녁이에요"
        />
      );

      expect(getByText('좋은 저녁이에요')).toBeTruthy();
      expect(getByText('저녁유저님')).toBeTruthy();
    });
  });
});
