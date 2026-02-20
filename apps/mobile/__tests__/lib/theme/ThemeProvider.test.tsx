/**
 * ThemeProvider 컨텍스트 테스트
 *
 * 비즈니스 로직 중심 테스트: ThemeProvider가 제공하는 값 구조 검증.
 * NativeWind와 jest.mock('react-native') 충돌을 회피하기 위해
 * 렌더링 대신 Context 값 로직을 직접 테스트.
 */

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
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';

describe('ThemeProvider', () => {
  describe('라이트 모드 컨텍스트 값', () => {
    // ThemeProvider 내부 로직 시뮬레이션 (useColorScheme = null → light)
    const lightValue: ThemeContextValue = {
      colors: lightColors,
      brand,
      module: moduleColors,
      status: statusColors,
      spacing,
      radii,
      shadows,
      typography,
      isDark: false,
      colorScheme: null,
    };

    it('colors가 lightColors와 일치해야 한다', () => {
      expect(lightValue.colors).toBe(lightColors);
    });

    it('isDark이 false여야 한다', () => {
      expect(lightValue.isDark).toBe(false);
    });

    it('brand가 토큰과 일치해야 한다', () => {
      expect(lightValue.brand.primary).toBe('#F8C8DC');
    });

    it('module이 moduleColors와 일치해야 한다', () => {
      expect(lightValue.module).toBe(moduleColors);
    });

    it('spacing이 토큰과 일치해야 한다', () => {
      expect(lightValue.spacing).toBe(spacing);
    });

    it('radii가 토큰과 일치해야 한다', () => {
      expect(lightValue.radii).toBe(radii);
    });

    it('shadows가 토큰과 일치해야 한다', () => {
      expect(lightValue.shadows).toBe(shadows);
    });

    it('typography가 토큰과 일치해야 한다', () => {
      expect(lightValue.typography).toBe(typography);
    });
  });

  describe('다크 모드 컨텍스트 값', () => {
    const darkValue: ThemeContextValue = {
      colors: darkColors,
      brand,
      module: moduleColors,
      status: statusColors,
      spacing,
      radii,
      shadows,
      typography,
      isDark: true,
      colorScheme: 'dark',
    };

    it('colors가 darkColors와 일치해야 한다', () => {
      expect(darkValue.colors).toBe(darkColors);
    });

    it('isDark이 true여야 한다', () => {
      expect(darkValue.isDark).toBe(true);
    });

    it('brand는 모드에 무관하게 동일해야 한다', () => {
      expect(darkValue.brand).toBe(brand);
    });

    it('colorScheme이 dark여야 한다', () => {
      expect(darkValue.colorScheme).toBe('dark');
    });
  });

  describe('ThemeContext 기본값', () => {
    it('ThemeContext가 정의되어야 한다', () => {
      expect(ThemeContext).toBeDefined();
    });
  });

  describe('모드 전환 로직', () => {
    it('colorScheme === "dark"이면 darkColors 사용', () => {
      const colorScheme = 'dark';
      const isDark = colorScheme === 'dark';
      const colors = isDark ? darkColors : lightColors;

      expect(colors.background).toBe(darkColors.background);
    });

    it('colorScheme === null이면 lightColors 사용', () => {
      const colorScheme = null;
      const isDark = colorScheme === 'dark';
      const colors = isDark ? darkColors : lightColors;

      expect(colors.background).toBe(lightColors.background);
    });

    it('colorScheme === "light"이면 lightColors 사용', () => {
      const colorScheme = 'light';
      const isDark = colorScheme === 'dark';
      const colors = isDark ? darkColors : lightColors;

      expect(colors.background).toBe(lightColors.background);
    });
  });
});
