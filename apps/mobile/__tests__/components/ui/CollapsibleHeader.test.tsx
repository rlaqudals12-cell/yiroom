/**
 * CollapsibleHeader UI 컴포넌트 테스트
 *
 * 확장 헤더 렌더링, 타이틀, 스크롤 콘텐츠, 다크모드 검증.
 * react-native-reanimated는 __mocks__에서 자동 모킹됨.
 */

import React from 'react';
import { Text, View } from 'react-native';
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
import { CollapsibleHeader } from '../../../components/ui/CollapsibleHeader';

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

describe('CollapsibleHeader', () => {
  const scrollContent = (
    <View>
      <Text>스크롤 아이템 1</Text>
      <Text>스크롤 아이템 2</Text>
      <Text>스크롤 아이템 3</Text>
    </View>
  );

  describe('렌더링', () => {
    it('확장 헤더가 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <CollapsibleHeader title="테스트 헤더" scrollContent={scrollContent} />
      );

      expect(getByTestId('collapsible-header')).toBeTruthy();
      expect(getByTestId('collapsible-header-header')).toBeTruthy();
      expect(getByTestId('collapsible-header-expanded')).toBeTruthy();
    });

    it('축소 영역이 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <CollapsibleHeader title="축소 헤더" scrollContent={scrollContent} />
      );

      expect(getByTestId('collapsible-header-collapsed')).toBeTruthy();
    });
  });

  describe('타이틀', () => {
    it('확장 상태 타이틀이 표시되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <CollapsibleHeader title="프로필" scrollContent={scrollContent} />
      );

      expect(getByTestId('collapsible-header-title-expanded')).toBeTruthy();
    });

    it('축소 상태 타이틀이 존재해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <CollapsibleHeader title="프로필" scrollContent={scrollContent} />
      );

      expect(getByTestId('collapsible-header-title-collapsed')).toBeTruthy();
    });
  });

  describe('스크롤 콘텐츠', () => {
    it('스크롤 영역 콘텐츠가 렌더링되어야 한다', () => {
      const { getByText, getByTestId } = renderWithTheme(
        <CollapsibleHeader title="목록" scrollContent={scrollContent} />
      );

      expect(getByTestId('collapsible-header-scroll')).toBeTruthy();
      expect(getByText('스크롤 아이템 1')).toBeTruthy();
      expect(getByText('스크롤 아이템 2')).toBeTruthy();
    });
  });

  describe('children (확장 콘텐츠)', () => {
    it('확장 영역에 children이 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <CollapsibleHeader title="상세" scrollContent={scrollContent}>
          <Text>확장 정보</Text>
          <Text>서브 타이틀</Text>
        </CollapsibleHeader>
      );

      expect(getByText('확장 정보')).toBeTruthy();
      expect(getByText('서브 타이틀')).toBeTruthy();
    });
  });

  describe('배경 렌더러', () => {
    it('renderBackground가 호출되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <CollapsibleHeader
          title="배경 헤더"
          scrollContent={scrollContent}
          renderBackground={() => <Text>배경 이미지</Text>}
        />
      );

      expect(getByText('배경 이미지')).toBeTruthy();
    });
  });

  describe('testID', () => {
    it('커스텀 testID가 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <CollapsibleHeader
          title="커스텀"
          scrollContent={scrollContent}
          testID="my-header"
        />
      );

      expect(getByTestId('my-header')).toBeTruthy();
      expect(getByTestId('my-header-header')).toBeTruthy();
      expect(getByTestId('my-header-scroll')).toBeTruthy();
    });
  });

  describe('높이 설정', () => {
    it('커스텀 확장/축소 높이로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <CollapsibleHeader
          title="커스텀 높이"
          scrollContent={scrollContent}
          expandedHeight={300}
          collapsedHeight={80}
        />
      );

      expect(getByTestId('collapsible-header')).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링되어야 한다', () => {
      const { getByText, getByTestId } = renderWithTheme(
        <CollapsibleHeader title="다크 헤더" scrollContent={scrollContent}>
          <Text>다크 확장 콘텐츠</Text>
        </CollapsibleHeader>,
        true
      );

      expect(getByTestId('collapsible-header')).toBeTruthy();
      expect(getByText('다크 확장 콘텐츠')).toBeTruthy();
    });

    it('다크 모드에서 스크롤 콘텐츠가 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <CollapsibleHeader
          title="다크 스크롤"
          scrollContent={
            <View>
              <Text>다크 아이템</Text>
            </View>
          }
        />,
        true
      );

      expect(getByText('다크 아이템')).toBeTruthy();
    });
  });
});
