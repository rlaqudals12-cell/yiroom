/**
 * 이룸 테마 프로바이더
 *
 * 앱 전체에 라이트/다크 모드 색상을 제공하는 React Context.
 * 각 화면에서 useColorScheme()을 직접 호출하는 대신 useTheme()을 사용.
 */
import { createContext, useMemo, type ReactNode } from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';

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
} from './tokens';
import type { SemanticColors } from './tokens';

export interface ThemeContextValue {
  /** 현재 모드에 맞는 시맨틱 색상 */
  colors: SemanticColors;
  /** 모드 무관 브랜드 색상 */
  brand: typeof brand;
  /** 모듈별 악센트 색상 */
  module: typeof moduleColors;
  /** 상태 색상 */
  status: typeof statusColors;
  /** 스페이싱 */
  spacing: typeof spacing;
  /** 보더 반지름 */
  radii: typeof radii;
  /** 그림자 */
  shadows: typeof shadows;
  /** 타이포그래피 */
  typography: typeof typography;
  /** 현재 다크 모드 여부 */
  isDark: boolean;
  /** 시스템 colorScheme 값 */
  colorScheme: ColorSchemeName;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      brand,
      module: moduleColors,
      status: statusColors,
      spacing,
      radii,
      shadows,
      typography,
      isDark,
      colorScheme,
    }),
    [isDark, colorScheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
