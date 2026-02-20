/**
 * useTheme 훅
 *
 * ThemeProvider에서 제공하는 테마 값에 접근.
 * ThemeProvider 외부에서 호출 시 에러 발생.
 */
import { useContext } from 'react';

import { ThemeContext, type ThemeContextValue } from './ThemeProvider';

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
