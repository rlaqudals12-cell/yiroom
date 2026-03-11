/**
 * InternalizationWidget 테스트
 *
 * 4-status 세그먼트 바, 통계 표시, 빈 상태 처리
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

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
import { InternalizationWidget } from '../../../components/home/InternalizationWidget';

// Mock Clerk
jest.mock('@clerk/clerk-expo', () => ({
  useUser: jest.fn(() => ({ user: { id: 'test_user_123' }, isLoaded: true })),
  useAuth: jest.fn(() => ({
    getToken: jest.fn().mockResolvedValue('mock-token'),
  })),
}));

// Mock Supabase
jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: jest.fn(() => ({})),
}));

// Mock connection-awareness
const mockGetConnectionStats = jest.fn();
jest.mock('../../../lib/connection-awareness', () => ({
  getConnectionStats: (...args: unknown[]) => mockGetConnectionStats(...args),
}));

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

describe('InternalizationWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('데이터가 없으면 null을 반환해야 한다', async () => {
    mockGetConnectionStats.mockResolvedValue({
      totalConnections: 0,
      internalizationRate: 0,
      independentCount: 0,
      byStatus: { exposed: 0, recognized: 0, internalized: 0, independent: 0 },
    });

    const { toJSON } = renderWithTheme(<InternalizationWidget />);

    await waitFor(() => {
      expect(toJSON()).toBeNull();
    });
  });

  it('통계가 있으면 위젯을 표시해야 한다', async () => {
    mockGetConnectionStats.mockResolvedValue({
      totalConnections: 10,
      internalizationRate: 0.4,
      independentCount: 2,
      byStatus: { exposed: 3, recognized: 3, internalized: 2, independent: 2 },
    });

    const { getByText, getByTestId } = renderWithTheme(<InternalizationWidget />);

    await waitFor(() => {
      expect(getByTestId('internalization-widget')).toBeTruthy();
      expect(getByText('자기 이해 내재화')).toBeTruthy();
      expect(getByText('40%')).toBeTruthy();
    });
  });

  it('범례에 0이 아닌 상태만 표시해야 한다', async () => {
    mockGetConnectionStats.mockResolvedValue({
      totalConnections: 5,
      internalizationRate: 0,
      independentCount: 0,
      byStatus: { exposed: 3, recognized: 2, internalized: 0, independent: 0 },
    });

    const { getByText, queryByText } = renderWithTheme(<InternalizationWidget />);

    await waitFor(() => {
      expect(getByText('발견 3')).toBeTruthy();
      expect(getByText('인식 2')).toBeTruthy();
      expect(queryByText('내재화')).toBeNull();
      expect(queryByText('자립')).toBeNull();
    });
  });

  it('다크모드에서 렌더링되어야 한다', async () => {
    mockGetConnectionStats.mockResolvedValue({
      totalConnections: 5,
      internalizationRate: 0.2,
      independentCount: 1,
      byStatus: { exposed: 2, recognized: 1, internalized: 1, independent: 1 },
    });

    const { getByText } = renderWithTheme(<InternalizationWidget />, true);

    await waitFor(() => {
      expect(getByText('자기 이해 내재화')).toBeTruthy();
      expect(getByText('20%')).toBeTruthy();
    });
  });

  it('커스텀 testID를 적용해야 한다', async () => {
    mockGetConnectionStats.mockResolvedValue({
      totalConnections: 3,
      internalizationRate: 0,
      independentCount: 0,
      byStatus: { exposed: 3, recognized: 0, internalized: 0, independent: 0 },
    });

    const { getByTestId } = renderWithTheme(
      <InternalizationWidget testID="custom-widget" />
    );

    await waitFor(() => {
      expect(getByTestId('custom-widget')).toBeTruthy();
    });
  });

  it('API 오류 시 숨겨야 한다', async () => {
    mockGetConnectionStats.mockRejectedValue(new Error('DB error'));

    const { toJSON } = renderWithTheme(<InternalizationWidget />);

    await waitFor(() => {
      expect(toJSON()).toBeNull();
    });
  });
});
