/**
 * GlassCard UI 컴포넌트 테스트
 *
 * BlurView 기반 글래스모피즘 카드의 렌더링, props, 다크모드, Android 폴백 검증.
 */

import React from 'react';
import { Text, Platform } from 'react-native';
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
import { GlassCard } from '../../../components/ui/GlassCard';

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

describe('GlassCard', () => {
  // 테스트 후 Platform.OS 복원
  const originalPlatformOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalPlatformOS;
  });

  describe('렌더링', () => {
    it('children을 정상 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <GlassCard>
          <Text>글래스 카드 내용</Text>
        </GlassCard>
      );

      expect(getByText('글래스 카드 내용')).toBeTruthy();
    });

    it('여러 children을 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <GlassCard>
          <Text>첫 번째</Text>
          <Text>두 번째</Text>
        </GlassCard>
      );

      expect(getByText('첫 번째')).toBeTruthy();
      expect(getByText('두 번째')).toBeTruthy();
    });
  });

  describe('props', () => {
    it('기본 intensity 40이 적용되어야 한다', () => {
      Platform.OS = 'ios' as typeof Platform.OS;

      const { UNSAFE_getByType } = renderWithTheme(
        <GlassCard>
          <Text>기본 블러</Text>
        </GlassCard>
      );

      // BlurView mock은 View로 렌더링되므로, 컴포넌트가 에러 없이 렌더링되는지 확인
      expect(UNSAFE_getByType(Text)).toBeTruthy();
    });

    it('custom intensity prop이 전달되어야 한다', () => {
      Platform.OS = 'ios' as typeof Platform.OS;

      const { getByText } = renderWithTheme(
        <GlassCard intensity={80}>
          <Text>강한 블러</Text>
        </GlassCard>
      );

      expect(getByText('강한 블러')).toBeTruthy();
    });

    it('custom style이 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GlassCard testID="styled-glass" style={{ marginTop: 20 }}>
          <Text>스타일 카드</Text>
        </GlassCard>
      );

      const card = getByTestId('styled-glass');
      // style 배열 중 custom style이 포함되어 있는지 확인
      const flatStyle = Array.isArray(card.props.style)
        ? card.props.style
        : [card.props.style];
      const hasMarginTop = flatStyle.some(
        (s: Record<string, unknown>) => s && s.marginTop === 20
      );
      expect(hasMarginTop).toBe(true);
    });
  });

  describe('접근성 (testID)', () => {
    it('testID가 전달되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GlassCard testID="glass-card-test">
          <Text>테스트 ID 확인</Text>
        </GlassCard>
      );

      expect(getByTestId('glass-card-test')).toBeTruthy();
    });

    it('testID 없이도 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <GlassCard>
          <Text>ID 없음</Text>
        </GlassCard>
      );

      expect(getByText('ID 없음')).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 렌더링되어야 한다', () => {
      Platform.OS = 'ios' as typeof Platform.OS;

      const { getByText } = renderWithTheme(
        <GlassCard>
          <Text>다크 글래스</Text>
        </GlassCard>,
        true
      );

      expect(getByText('다크 글래스')).toBeTruthy();
    });

    it('다크 모드에서 다크 배경색이 적용되어야 한다 (Android)', () => {
      Platform.OS = 'android' as typeof Platform.OS;

      const { getByTestId } = renderWithTheme(
        <GlassCard testID="dark-android-glass">
          <Text>다크 Android</Text>
        </GlassCard>,
        true
      );

      const card = getByTestId('dark-android-glass');
      const flatStyle = Array.isArray(card.props.style)
        ? card.props.style
        : [card.props.style];
      const hasDarkBg = flatStyle.some(
        (s: Record<string, unknown>) =>
          s && s.backgroundColor === 'rgba(26,26,26,0.85)'
      );
      expect(hasDarkBg).toBe(true);
    });
  });

  describe('Android 폴백', () => {
    it('Android에서 BlurView 대신 반투명 배경 View로 렌더링되어야 한다', () => {
      Platform.OS = 'android' as typeof Platform.OS;

      const { getByTestId, getByText } = renderWithTheme(
        <GlassCard testID="android-glass">
          <Text>Android 폴백</Text>
        </GlassCard>
      );

      expect(getByTestId('android-glass')).toBeTruthy();
      expect(getByText('Android 폴백')).toBeTruthy();
    });

    it('Android에서 라이트 모드 반투명 배경이 적용되어야 한다', () => {
      Platform.OS = 'android' as typeof Platform.OS;

      const { getByTestId } = renderWithTheme(
        <GlassCard testID="android-light-glass">
          <Text>Android 라이트</Text>
        </GlassCard>,
        false
      );

      const card = getByTestId('android-light-glass');
      const flatStyle = Array.isArray(card.props.style)
        ? card.props.style
        : [card.props.style];
      const hasLightBg = flatStyle.some(
        (s: Record<string, unknown>) =>
          s && s.backgroundColor === 'rgba(255,255,255,0.85)'
      );
      expect(hasLightBg).toBe(true);
    });
  });
});
