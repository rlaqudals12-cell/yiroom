/**
 * DataStateWrapper UI 컴포넌트 테스트
 *
 * 로딩/에러/빈 상태/정상 상태 전환 및 children 렌더링 검증.
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
import { DataStateWrapper } from '../../../components/ui/DataStateWrapper';

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

describe('DataStateWrapper', () => {
  describe('로딩 상태', () => {
    it('isLoading=true일 때 스켈레톤 로딩을 표시해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DataStateWrapper isLoading={true}>
          <Text>데이터 내용</Text>
        </DataStateWrapper>
      );

      expect(getByTestId('data-state-loading')).toBeTruthy();
    });

    it('isLoading=true일 때 children을 렌더링하지 않아야 한다', () => {
      const { queryByText } = renderWithTheme(
        <DataStateWrapper isLoading={true}>
          <Text>데이터 내용</Text>
        </DataStateWrapper>
      );

      expect(queryByText('데이터 내용')).toBeNull();
    });

    it('커스텀 로딩 컴포넌트를 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <DataStateWrapper
          isLoading={true}
          loadingComponent={<Text>커스텀 로딩...</Text>}
        >
          <Text>데이터 내용</Text>
        </DataStateWrapper>
      );

      expect(getByText('커스텀 로딩...')).toBeTruthy();
    });
  });

  describe('에러 상태', () => {
    it('error가 있으면 에러 상태를 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <DataStateWrapper isLoading={false} error={new Error('서버 오류')}>
          <Text>데이터 내용</Text>
        </DataStateWrapper>
      );

      expect(getByText('서버 오류')).toBeTruthy();
      expect(getByText('문제가 발생했어요')).toBeTruthy();
    });

    it('문자열 에러를 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <DataStateWrapper isLoading={false} error="네트워크 오류">
          <Text>데이터 내용</Text>
        </DataStateWrapper>
      );

      expect(getByText('네트워크 오류')).toBeTruthy();
    });

    it('에러 상태에서 children을 렌더링하지 않아야 한다', () => {
      const { queryByText } = renderWithTheme(
        <DataStateWrapper isLoading={false} error="에러 발생">
          <Text>데이터 내용</Text>
        </DataStateWrapper>
      );

      expect(queryByText('데이터 내용')).toBeNull();
    });

    it('onRetry를 에러 상태에 전달해야 한다', () => {
      const onRetry = jest.fn();
      const { getByLabelText } = renderWithTheme(
        <DataStateWrapper isLoading={false} error="오류" onRetry={onRetry}>
          <Text>데이터 내용</Text>
        </DataStateWrapper>
      );

      fireEvent.press(getByLabelText('다시 시도'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('빈 상태', () => {
    it('isEmpty=true이고 emptyConfig가 있으면 빈 상태를 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <DataStateWrapper
          isLoading={false}
          isEmpty={true}
          emptyConfig={{
            icon: <Text>📭</Text>,
            title: '아직 데이터가 없어요',
            description: '첫 번째 기록을 추가해보세요',
          }}
        >
          <Text>데이터 내용</Text>
        </DataStateWrapper>
      );

      expect(getByText('아직 데이터가 없어요')).toBeTruthy();
      expect(getByText('첫 번째 기록을 추가해보세요')).toBeTruthy();
    });

    it('isEmpty=true이지만 emptyConfig가 없으면 children을 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <DataStateWrapper isLoading={false} isEmpty={true}>
          <Text>데이터 내용</Text>
        </DataStateWrapper>
      );

      expect(getByText('데이터 내용')).toBeTruthy();
    });

    it('빈 상태에서 children을 렌더링하지 않아야 한다', () => {
      const { queryByText } = renderWithTheme(
        <DataStateWrapper
          isLoading={false}
          isEmpty={true}
          emptyConfig={{
            icon: <Text>📭</Text>,
            title: '비어 있음',
            description: '설명',
          }}
        >
          <Text>데이터 내용</Text>
        </DataStateWrapper>
      );

      expect(queryByText('데이터 내용')).toBeNull();
    });
  });

  describe('정상 상태', () => {
    it('정상 상태에서 children을 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <DataStateWrapper isLoading={false}>
          <Text>데이터 내용</Text>
        </DataStateWrapper>
      );

      expect(getByText('데이터 내용')).toBeTruthy();
    });

    it('여러 children을 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <DataStateWrapper isLoading={false}>
          <Text>첫 번째 항목</Text>
          <Text>두 번째 항목</Text>
        </DataStateWrapper>
      );

      expect(getByText('첫 번째 항목')).toBeTruthy();
      expect(getByText('두 번째 항목')).toBeTruthy();
    });
  });

  describe('testID', () => {
    it('기본 testID가 data-state-wrapper여야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DataStateWrapper isLoading={false}>
          <Text>내용</Text>
        </DataStateWrapper>
      );

      expect(getByTestId('data-state-wrapper')).toBeTruthy();
    });

    it('커스텀 testID가 전달되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DataStateWrapper isLoading={false} testID="custom-wrapper">
          <Text>내용</Text>
        </DataStateWrapper>
      );

      expect(getByTestId('custom-wrapper')).toBeTruthy();
    });
  });

  describe('상태 우선순위', () => {
    it('로딩이 에러보다 우선해야 한다', () => {
      const { getByTestId, queryByText } = renderWithTheme(
        <DataStateWrapper isLoading={true} error="에러">
          <Text>내용</Text>
        </DataStateWrapper>
      );

      expect(getByTestId('data-state-loading')).toBeTruthy();
      expect(queryByText('에러')).toBeNull();
    });

    it('에러가 빈 상태보다 우선해야 한다', () => {
      const { getByText, queryByText } = renderWithTheme(
        <DataStateWrapper
          isLoading={false}
          error="에러 발생"
          isEmpty={true}
          emptyConfig={{
            icon: <Text>📭</Text>,
            title: '비어 있음',
            description: '설명',
          }}
        >
          <Text>내용</Text>
        </DataStateWrapper>
      );

      expect(getByText('에러 발생')).toBeTruthy();
      expect(queryByText('비어 있음')).toBeNull();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <DataStateWrapper isLoading={false}>
          <Text>다크 내용</Text>
        </DataStateWrapper>,
        true
      );

      expect(getByText('다크 내용')).toBeTruthy();
    });
  });
});
