/**
 * HomeHeader 컴포넌트 테스트
 *
 * 시간대별 인사말 + 사용자명 렌더링 검증.
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
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

describe('HomeHeader', () => {
  it('사용자명을 렌더링해야 한다 (isLoaded=true)', () => {
    const { getByText } = renderWithTheme(
      <HomeHeader userName="홍길동" isLoaded={true} />
    );

    expect(getByText('홍길동님')).toBeTruthy();
  });

  it('로딩 중일 때 "...님"을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <HomeHeader userName="홍길동" isLoaded={false} />
    );

    expect(getByText('...님')).toBeTruthy();
  });

  it('testID="home-header"가 존재해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <HomeHeader userName="테스트" isLoaded={true} />
    );

    expect(getByTestId('home-header')).toBeTruthy();
  });

  it('다크 모드에서도 렌더링되어야 한다', () => {
    const { getByText, getByTestId } = renderWithTheme(
      <HomeHeader userName="다크유저" isLoaded={true} />,
      true
    );

    expect(getByTestId('home-header')).toBeTruthy();
    expect(getByText('다크유저님')).toBeTruthy();
  });

  describe('시간대별 인사말', () => {
    // getGreeting()은 내부 함수이므로 Date를 mock하여 검증
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('새벽(6시 전)에는 "늦은 밤이에요"를 표시해야 한다', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(3);

      const { getByText } = renderWithTheme(
        <HomeHeader userName="새벽유저" isLoaded={true} />
      );

      expect(getByText('늦은 밤이에요')).toBeTruthy();
    });

    it('오전(6~12시)에는 "좋은 아침이에요"를 표시해야 한다', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(9);

      const { getByText } = renderWithTheme(
        <HomeHeader userName="아침유저" isLoaded={true} />
      );

      expect(getByText('좋은 아침이에요')).toBeTruthy();
    });

    it('오후(12~18시)에는 "좋은 오후예요"를 표시해야 한다', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(14);

      const { getByText } = renderWithTheme(
        <HomeHeader userName="오후유저" isLoaded={true} />
      );

      expect(getByText('좋은 오후예요')).toBeTruthy();
    });

    it('저녁(18시 이후)에는 "좋은 저녁이에요"를 표시해야 한다', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(20);

      const { getByText } = renderWithTheme(
        <HomeHeader userName="저녁유저" isLoaded={true} />
      );

      expect(getByText('좋은 저녁이에요')).toBeTruthy();
    });
  });
});
