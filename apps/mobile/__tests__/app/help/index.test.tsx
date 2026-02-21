/**
 * 도움말/FAQ 스크린 테스트
 *
 * 대상: app/help/index.tsx (HelpScreen)
 * 의존성: useTheme, Linking
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';

import {
  ThemeContext,
  type ThemeContextValue,
} from '../../../lib/theme/ThemeProvider';
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

// react-native-safe-area-context mock
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

import HelpScreen from '../../../app/help/index';

// ============================================================
// 테마 헬퍼
// ============================================================

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

// ============================================================
// 테스트
// ============================================================

describe('HelpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<HelpScreen />);
      expect(getByTestId('help-screen')).toBeTruthy();
    });

    it('헤더 타이틀이 표시된다', () => {
      const { getByText } = renderWithTheme(<HelpScreen />);
      expect(getByText('도움말')).toBeTruthy();
    });

    it('부제가 표시된다', () => {
      const { getByText } = renderWithTheme(<HelpScreen />);
      expect(getByText('자주 묻는 질문을 확인해보세요')).toBeTruthy();
    });
  });

  describe('FAQ 목록 표시', () => {
    it('6개의 질문이 모두 표시된다', () => {
      const { getByText } = renderWithTheme(<HelpScreen />);
      expect(getByText('분석 결과는 얼마나 정확한가요?')).toBeTruthy();
      expect(getByText('사진은 어떻게 촬영하면 좋나요?')).toBeTruthy();
      expect(getByText('분석 결과를 다시 받을 수 있나요?')).toBeTruthy();
      expect(getByText('운동/식단 데이터는 어디에 저장되나요?')).toBeTruthy();
      expect(getByText('오프라인에서도 사용할 수 있나요?')).toBeTruthy();
      expect(getByText('알림이 오지 않아요')).toBeTruthy();
    });

    it('초기 상태에서 답변이 숨겨져 있다 (▼ 표시)', () => {
      const { getAllByText } = renderWithTheme(<HelpScreen />);
      const downArrows = getAllByText('▼');
      expect(downArrows.length).toBe(6);
    });
  });

  describe('아코디언 동작', () => {
    it('질문 클릭 시 답변이 펼쳐진다', () => {
      const { getByText, queryByText } = renderWithTheme(<HelpScreen />);

      // 클릭 전 답변이 보이지 않음
      expect(
        queryByText(/AI 분석 결과는 참고용이에요/)
      ).toBeNull();

      // 질문 클릭
      fireEvent.press(getByText('분석 결과는 얼마나 정확한가요?'));

      // 답변 표시
      expect(getByText(/AI 분석 결과는 참고용이에요/)).toBeTruthy();
    });

    it('펼쳐진 질문을 다시 클릭하면 답변이 접힌다', () => {
      const { getByText, queryByText } = renderWithTheme(<HelpScreen />);

      // 펼치기
      fireEvent.press(getByText('분석 결과는 얼마나 정확한가요?'));
      expect(getByText(/AI 분석 결과는 참고용이에요/)).toBeTruthy();

      // 접기
      fireEvent.press(getByText('분석 결과는 얼마나 정확한가요?'));
      expect(queryByText(/AI 분석 결과는 참고용이에요/)).toBeNull();
    });

    it('다른 질문 클릭 시 기존 답변이 접힌다', () => {
      const { getByText, queryByText } = renderWithTheme(<HelpScreen />);

      // 첫 번째 질문 펼치기
      fireEvent.press(getByText('분석 결과는 얼마나 정확한가요?'));
      expect(getByText(/AI 분석 결과는 참고용이에요/)).toBeTruthy();

      // 다른 질문 클릭
      fireEvent.press(getByText('사진은 어떻게 촬영하면 좋나요?'));

      // 첫 번째 답변 접힘, 두 번째 답변 펼침
      expect(queryByText(/AI 분석 결과는 참고용이에요/)).toBeNull();
      expect(getByText(/자연광에서 정면을 바라보고 촬영하세요/)).toBeTruthy();
    });

    it('펼친 질문에 ▲ 아이콘이 표시된다', () => {
      const { getByText, getAllByText } = renderWithTheme(<HelpScreen />);

      fireEvent.press(getByText('분석 결과는 얼마나 정확한가요?'));

      const upArrows = getAllByText('▲');
      expect(upArrows.length).toBe(1);

      const downArrows = getAllByText('▼');
      expect(downArrows.length).toBe(5);
    });
  });

  describe('문의하기 CTA', () => {
    it('문의하기 안내 문구가 표시된다', () => {
      const { getByText } = renderWithTheme(<HelpScreen />);
      expect(getByText('찾는 답이 없나요?')).toBeTruthy();
    });

    it('문의하기 버튼이 표시된다', () => {
      const { getByText } = renderWithTheme(<HelpScreen />);
      expect(getByText('문의하기')).toBeTruthy();
    });

    it('문의하기 클릭 시 mailto 링크를 연다', () => {
      jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

      const { getByText } = renderWithTheme(<HelpScreen />);
      fireEvent.press(getByText('문의하기'));

      expect(Linking.openURL).toHaveBeenCalledWith('mailto:support@yiroom.app');
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<HelpScreen />, true);
      expect(getByTestId('help-screen')).toBeTruthy();
    });

    it('다크 모드에서 FAQ 목록이 표시된다', () => {
      const { getByText } = renderWithTheme(<HelpScreen />, true);
      expect(getByText('도움말')).toBeTruthy();
      expect(getByText('분석 결과는 얼마나 정확한가요?')).toBeTruthy();
    });
  });
});
