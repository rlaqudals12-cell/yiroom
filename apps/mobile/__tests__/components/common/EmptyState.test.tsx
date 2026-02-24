/**
 * EmptyState 공통 컴포넌트 테스트
 *
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
 */

import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

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
import { EmptyState } from '../../../components/common/EmptyState';

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

describe('EmptyState', () => {
  it('제목과 설명을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <EmptyState
        icon={<Text>📝</Text>}
        title="아직 리뷰가 없어요"
        description="첫 번째 리뷰를 작성해보세요!"
      />
    );

    expect(getByText('아직 리뷰가 없어요')).toBeTruthy();
    expect(getByText('첫 번째 리뷰를 작성해보세요!')).toBeTruthy();
  });

  it('아이콘을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <EmptyState
        icon={<Text>📝</Text>}
        title="빈 상태"
        description="설명 텍스트"
      />
    );

    expect(getByText('📝')).toBeTruthy();
  });

  it('testID가 전달되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <EmptyState
        icon={<Text>📝</Text>}
        title="빈 상태"
        description="설명"
        testID="custom-empty"
      />
    );

    expect(getByTestId('custom-empty')).toBeTruthy();
  });

  it('기본 testID가 empty-state여야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <EmptyState
        icon={<Text>📝</Text>}
        title="빈 상태"
        description="설명"
      />
    );

    expect(getByTestId('empty-state')).toBeTruthy();
  });

  it('액션 버튼이 있으면 렌더링해야 한다', () => {
    const onAction = jest.fn();
    const { getByText } = renderWithTheme(
      <EmptyState
        icon={<Text>📝</Text>}
        title="빈 상태"
        description="설명"
        actionLabel="리뷰 작성하기"
        onAction={onAction}
      />
    );

    expect(getByText('리뷰 작성하기')).toBeTruthy();
  });

  it('액션 버튼 클릭 시 onAction이 호출되어야 한다', () => {
    const onAction = jest.fn();
    const { getByText } = renderWithTheme(
      <EmptyState
        icon={<Text>📝</Text>}
        title="빈 상태"
        description="설명"
        actionLabel="리뷰 작성하기"
        onAction={onAction}
      />
    );

    fireEvent.press(getByText('리뷰 작성하기'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('onAction 없으면 액션 버튼이 렌더링되지 않아야 한다', () => {
    const { queryByText } = renderWithTheme(
      <EmptyState
        icon={<Text>📝</Text>}
        title="빈 상태"
        description="설명"
        actionLabel="리뷰 작성하기"
      />
    );

    expect(queryByText('리뷰 작성하기')).toBeNull();
  });

  it('다크 모드에서도 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <EmptyState
        icon={<Text>🌙</Text>}
        title="다크 모드 빈 상태"
        description="다크 모드 설명"
      />,
      true
    );

    expect(getByText('다크 모드 빈 상태')).toBeTruthy();
  });
});
