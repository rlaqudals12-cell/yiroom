/**
 * 이룸 테마 프로바이더
 *
 * 앱 전체에 라이트/다크 모드 색상을 제공하는 React Context.
 * 각 화면에서 useColorScheme()을 직접 호출하는 대신 useTheme()을 사용.
 *
 * 사용자 테마 선택(system/light/dark)은 AsyncStorage에 영속 저장.
 */
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
} from './tokens';
import type { SemanticColors } from './tokens';

/** 사용자 테마 모드 */
export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = '@yiroom/theme-mode';

export interface ThemeContextValue {
  /** 현재 모드에 맞는 시맨틱 색상 */
  colors: SemanticColors;
  /** 모드 무관 브랜드 색상 */
  brand: typeof brand;
  /** 모듈별 악센트 색상 */
  module: typeof moduleColors;
  /** 상태 색상 */
  status: typeof statusColors;
  /** 등급 색상 (diamond/gold/silver/bronze) */
  grade: typeof gradeColors;
  /** 영양소 색상 (탄단지) */
  nutrient: typeof nutrientColors;
  /** 점수 구간 색상 (excellent/good/caution/poor) */
  score: typeof scoreColors;
  /** 신뢰도 배지 색상 (ai/fallback) */
  trust: typeof trustColors;
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
  /** 사용자 선택 테마 모드 */
  themeMode: ThemeMode;
  /** 테마 모드 변경 (AsyncStorage에 영속 저장) */
  setThemeMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  // AsyncStorage에서 저장된 테마 모드 로드
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeModeState(saved);
      }
    });
  }, []);

  // 테마 모드 변경 + AsyncStorage 영속
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  // themeMode에 따라 isDark 결정
  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      brand,
      module: moduleColors,
      status: statusColors,
      grade: gradeColors,
      nutrient: nutrientColors,
      score: scoreColors,
      trust: trustColors,
      spacing,
      radii,
      shadows,
      typography,
      isDark,
      colorScheme: systemColorScheme,
      themeMode,
      setThemeMode,
    }),
    [isDark, systemColorScheme, themeMode, setThemeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
