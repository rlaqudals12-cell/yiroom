/**
 * TopActionsCard 컴포넌트 테스트 (ADR-111 표현 원칙 1: 결론 먼저)
 *
 * 검증:
 * - 첫 화면에 액션 1~3개 렌더
 * - 빈 배열 = 미노출 (null 렌더)
 * - 3개 초과분은 렌더하지 않음
 * - 스와치 / 상세 / 링크(href) 렌더 및 이동
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

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
import { TopActionsCard } from '../../../components/analysis/TopActionsCard';
import type { TopAction } from '../../../lib/analysis/top-actions';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
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
    colorScheme: isDark ? 'dark' : 'light',
    themeMode: 'system',
    setThemeMode: jest.fn(),
  };
}

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeContext.Provider value={createThemeValue()}>{ui}</ThemeContext.Provider>);
}

beforeEach(() => {
  mockPush.mockClear();
});

describe('TopActionsCard', () => {
  it('액션 1~3개를 번호와 함께 렌더한다', () => {
    const actions: TopAction[] = [
      { title: '코랄 립부터 발라보세요' },
      { title: '골드 주얼리를 활용하세요' },
    ];
    const { getByTestId, getByText } = renderWithTheme(<TopActionsCard actions={actions} />);

    expect(getByTestId('top-actions-card')).toBeTruthy();
    expect(getByText('코랄 립부터 발라보세요')).toBeTruthy();
    expect(getByText('골드 주얼리를 활용하세요')).toBeTruthy();
    // 번호 배지
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
  });

  it('빈 배열이면 아무것도 렌더하지 않는다 (미노출)', () => {
    const { queryByTestId } = renderWithTheme(<TopActionsCard actions={[]} />);
    expect(queryByTestId('top-actions-card')).toBeNull();
  });

  it('제목이 비어있는 액션만 있으면 미노출된다', () => {
    const { queryByTestId } = renderWithTheme(
      <TopActionsCard actions={[{ title: '   ' }, { title: '' }]} />
    );
    expect(queryByTestId('top-actions-card')).toBeNull();
  });

  it('3개를 초과하면 앞의 3개만 렌더한다', () => {
    const actions: TopAction[] = [
      { title: '액션1' },
      { title: '액션2' },
      { title: '액션3' },
      { title: '액션4' },
    ];
    const { getByText, queryByText } = renderWithTheme(<TopActionsCard actions={actions} />);
    expect(getByText('액션3')).toBeTruthy();
    expect(queryByText('액션4')).toBeNull();
  });

  it('상세(detail)와 스와치를 렌더한다', () => {
    const actions: TopAction[] = [
      {
        title: '베스트 컬러부터 활용해보세요',
        detail: '봄 웜톤에 잘 어울리는 컬러예요',
        swatches: [
          { hex: '#FFB6C1', name: '#FFB6C1' },
          { hex: '#FFDAB9', name: '#FFDAB9' },
        ],
      },
    ];
    const { getByText, getAllByTestId } = renderWithTheme(<TopActionsCard actions={actions} />);
    expect(getByText('봄 웜톤에 잘 어울리는 컬러예요')).toBeTruthy();
    expect(getAllByTestId('top-actions-card-swatch')).toHaveLength(2);
  });

  it('href가 있으면 링크를 누를 때 해당 라우트로 이동한다', () => {
    const actions: TopAction[] = [
      {
        title: '전체 루틴을 확인하세요',
        href: '/(analysis)/skin/routine',
        hrefLabel: '전체 루틴 보기',
      },
    ];
    const { getByTestId, getByText } = renderWithTheme(<TopActionsCard actions={actions} />);
    expect(getByText('전체 루틴 보기 →')).toBeTruthy();
    fireEvent.press(getByTestId('top-actions-card-link-0'));
    expect(mockPush).toHaveBeenCalledWith('/(analysis)/skin/routine');
  });
});
