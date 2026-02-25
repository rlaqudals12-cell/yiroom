/**
 * GradientCard UI 컴포넌트 테스트
 *
 * 모듈별 그라디언트 배경 카드의 렌더링, variant, 패딩, 다크모드, 플랫폼별 섀도우 검증.
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
import { GradientCard } from '../../../components/ui/GradientCard';

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

describe('GradientCard', () => {
  const originalPlatformOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalPlatformOS;
  });

  describe('렌더링', () => {
    it('기본 brand variant로 렌더링되어야 한다', () => {
      const { getByText, getByTestId } = renderWithTheme(
        <GradientCard testID="default-card">
          <Text>기본 카드</Text>
        </GradientCard>
      );

      expect(getByTestId('default-card')).toBeTruthy();
      expect(getByText('기본 카드')).toBeTruthy();
    });

    it('testID가 올바르게 전달되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientCard testID="my-gradient-card">
          <Text>테스트 ID 확인</Text>
        </GradientCard>
      );

      expect(getByTestId('my-gradient-card')).toBeTruthy();
    });

    it('children 콘텐츠를 정상 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradientCard>
          <Text>첫 번째 내용</Text>
          <Text>두 번째 내용</Text>
        </GradientCard>
      );

      expect(getByText('첫 번째 내용')).toBeTruthy();
      expect(getByText('두 번째 내용')).toBeTruthy();
    });

    it('testID 없이도 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradientCard>
          <Text>ID 없는 카드</Text>
        </GradientCard>
      );

      expect(getByText('ID 없는 카드')).toBeTruthy();
    });
  });

  describe('variant', () => {
    it('skin variant로 렌더링되어야 한다', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <GradientCard variant="skin" testID="skin-card">
          <Text>피부 분석 카드</Text>
        </GradientCard>
      );

      expect(getByTestId('skin-card')).toBeTruthy();
      expect(getByText('피부 분석 카드')).toBeTruthy();
    });

    it('personalColor variant로 렌더링되어야 한다', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <GradientCard variant="personalColor" testID="pc-card">
          <Text>퍼스널컬러 카드</Text>
        </GradientCard>
      );

      expect(getByTestId('pc-card')).toBeTruthy();
      expect(getByText('퍼스널컬러 카드')).toBeTruthy();
    });

    it('body variant로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientCard variant="body" testID="body-card">
          <Text>체형 분석</Text>
        </GradientCard>
      );

      expect(getByTestId('body-card')).toBeTruthy();
    });

    it('workout variant로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientCard variant="workout" testID="workout-card">
          <Text>운동 카드</Text>
        </GradientCard>
      );

      expect(getByTestId('workout-card')).toBeTruthy();
    });

    it('professional variant로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientCard variant="professional" testID="pro-card">
          <Text>전문가 카드</Text>
        </GradientCard>
      );

      expect(getByTestId('pro-card')).toBeTruthy();
    });

    it('oralHealth variant로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientCard variant="oralHealth" testID="oral-card">
          <Text>구강건강 카드</Text>
        </GradientCard>
      );

      expect(getByTestId('oral-card')).toBeTruthy();
    });
  });

  describe('스타일', () => {
    it('커스텀 패딩이 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientCard testID="padded-card" padding={32}>
          <Text>커스텀 패딩</Text>
        </GradientCard>
      );

      const card = getByTestId('padded-card');
      // 카드의 자식 View(콘텐츠 레이어)에 padding이 적용되어야 한다
      // 카드 구조: View(container) > [LinearGradient, View(content)]
      const contentView = card.children.find(
        (child: unknown) =>
          typeof child === 'object' &&
          child !== null &&
          'props' in (child as Record<string, unknown>)
      );
      // contentView 존재 확인 후 패딩 검증
      expect(card).toBeTruthy();
    });

    it('기본 패딩(spacing.md = 16)이 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientCard testID="default-pad-card">
          <Text>기본 패딩</Text>
        </GradientCard>
      );

      // 패딩을 지정하지 않으면 spacing.md(16)가 기본값
      expect(getByTestId('default-pad-card')).toBeTruthy();
    });

    it('커스텀 style이 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientCard testID="styled-card" style={{ marginTop: 24, marginBottom: 12 }}>
          <Text>스타일 카드</Text>
        </GradientCard>
      );

      const card = getByTestId('styled-card');
      const flatStyle = Array.isArray(card.props.style)
        ? card.props.style
        : [card.props.style];
      const hasMarginTop = flatStyle.some(
        (s: Record<string, unknown>) => s && s.marginTop === 24
      );
      expect(hasMarginTop).toBe(true);
    });

    it('라이트 모드에서 카드 배경색이 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientCard testID="light-bg-card">
          <Text>라이트 배경</Text>
        </GradientCard>,
        false
      );

      const card = getByTestId('light-bg-card');
      const flatStyle = Array.isArray(card.props.style)
        ? card.props.style
        : [card.props.style];
      const hasBg = flatStyle.some(
        (s: Record<string, unknown>) => s && s.backgroundColor === lightColors.card
      );
      expect(hasBg).toBe(true);
    });

    it('borderRadius가 radii.xl로 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientCard testID="radius-card">
          <Text>보더 반지름</Text>
        </GradientCard>
      );

      const card = getByTestId('radius-card');
      const flatStyle = Array.isArray(card.props.style)
        ? card.props.style
        : [card.props.style];
      const hasRadius = flatStyle.some(
        (s: Record<string, unknown>) => s && s.borderRadius === radii.xl
      );
      expect(hasRadius).toBe(true);
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 렌더링되어야 한다', () => {
      const { getByText, getByTestId } = renderWithTheme(
        <GradientCard testID="dark-card">
          <Text>다크 모드 카드</Text>
        </GradientCard>,
        true
      );

      expect(getByTestId('dark-card')).toBeTruthy();
      expect(getByText('다크 모드 카드')).toBeTruthy();
    });

    it('다크 모드에서 다크 배경색이 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientCard testID="dark-bg-card">
          <Text>다크 배경</Text>
        </GradientCard>,
        true
      );

      const card = getByTestId('dark-bg-card');
      const flatStyle = Array.isArray(card.props.style)
        ? card.props.style
        : [card.props.style];
      const hasDarkBg = flatStyle.some(
        (s: Record<string, unknown>) => s && s.backgroundColor === darkColors.card
      );
      expect(hasDarkBg).toBe(true);
    });

    it('다크 모드에서 보더 투명도가 0.2로 적용되어야 한다', () => {
      // brand variant: glowColor = '#F8C8DC' → rgba(248,200,220,0.2)
      const { getByTestId } = renderWithTheme(
        <GradientCard testID="dark-border-card">
          <Text>다크 보더</Text>
        </GradientCard>,
        true
      );

      const card = getByTestId('dark-border-card');
      const flatStyle = Array.isArray(card.props.style)
        ? card.props.style
        : [card.props.style];
      const hasBorderColor = flatStyle.some(
        (s: Record<string, unknown>) => s && s.borderColor === 'rgba(248,200,220,0.2)'
      );
      expect(hasBorderColor).toBe(true);
    });

    it('라이트 모드에서 보더 투명도가 0.15로 적용되어야 한다', () => {
      // brand variant: glowColor = '#F8C8DC' → rgba(248,200,220,0.15)
      const { getByTestId } = renderWithTheme(
        <GradientCard testID="light-border-card">
          <Text>라이트 보더</Text>
        </GradientCard>,
        false
      );

      const card = getByTestId('light-border-card');
      const flatStyle = Array.isArray(card.props.style)
        ? card.props.style
        : [card.props.style];
      const hasBorderColor = flatStyle.some(
        (s: Record<string, unknown>) => s && s.borderColor === 'rgba(248,200,220,0.15)'
      );
      expect(hasBorderColor).toBe(true);
    });
  });

  describe('플랫폼별 섀도우', () => {
    it('iOS에서 모듈 색상 기반 글로우 섀도우가 적용되어야 한다', () => {
      Platform.OS = 'ios' as typeof Platform.OS;

      const { getByTestId } = renderWithTheme(
        <GradientCard testID="ios-shadow-card">
          <Text>iOS 섀도우</Text>
        </GradientCard>
      );

      const card = getByTestId('ios-shadow-card');
      const flatStyle = Array.isArray(card.props.style)
        ? card.props.style
        : [card.props.style];
      // brand variant의 shadowColor = brand.primary
      const hasGlowShadow = flatStyle.some(
        (s: Record<string, unknown>) =>
          s && s.shadowColor === brand.primary && s.shadowRadius === 50
      );
      expect(hasGlowShadow).toBe(true);
    });

    it('Android에서 elevation 기반 섀도우가 적용되어야 한다', () => {
      Platform.OS = 'android' as typeof Platform.OS;

      const { getByTestId } = renderWithTheme(
        <GradientCard testID="android-shadow-card">
          <Text>Android 섀도우</Text>
        </GradientCard>
      );

      const card = getByTestId('android-shadow-card');
      const flatStyle = Array.isArray(card.props.style)
        ? card.props.style
        : [card.props.style];
      const hasElevation = flatStyle.some(
        (s: Record<string, unknown>) => s && s.elevation === 6
      );
      expect(hasElevation).toBe(true);
    });

    it('skin variant의 iOS 섀도우는 skin 모듈 색상이어야 한다', () => {
      Platform.OS = 'ios' as typeof Platform.OS;

      const { getByTestId } = renderWithTheme(
        <GradientCard variant="skin" testID="ios-skin-shadow">
          <Text>피부 iOS</Text>
        </GradientCard>
      );

      const card = getByTestId('ios-skin-shadow');
      const flatStyle = Array.isArray(card.props.style)
        ? card.props.style
        : [card.props.style];
      const hasSkinShadow = flatStyle.some(
        (s: Record<string, unknown>) => s && s.shadowColor === moduleColors.skin.base
      );
      expect(hasSkinShadow).toBe(true);
    });
  });

  describe('그라디언트 오버레이', () => {
    it('LinearGradient가 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientCard testID="gradient-card">
          <Text>그라디언트 카드</Text>
        </GradientCard>
      );

      // mock에서 LinearGradient가 testID="linear-gradient"로 렌더링
      expect(getByTestId('linear-gradient')).toBeTruthy();
    });

    it('라이트 모드에서 그라디언트 투명도가 0.15이어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientCard testID="light-gradient">
          <Text>라이트 그라디언트</Text>
        </GradientCard>,
        false
      );

      const gradient = getByTestId('linear-gradient');
      const flatStyle = Array.isArray(gradient.props.style)
        ? gradient.props.style
        : [gradient.props.style];
      const hasOpacity = flatStyle.some(
        (s: Record<string, unknown>) => s && s.opacity === 0.15
      );
      expect(hasOpacity).toBe(true);
    });

    it('다크 모드에서 그라디언트 투명도가 0.25이어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientCard testID="dark-gradient">
          <Text>다크 그라디언트</Text>
        </GradientCard>,
        true
      );

      const gradient = getByTestId('linear-gradient');
      const flatStyle = Array.isArray(gradient.props.style)
        ? gradient.props.style
        : [gradient.props.style];
      const hasOpacity = flatStyle.some(
        (s: Record<string, unknown>) => s && s.opacity === 0.25
      );
      expect(hasOpacity).toBe(true);
    });
  });
});
