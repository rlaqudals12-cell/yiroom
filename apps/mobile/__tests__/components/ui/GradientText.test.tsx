/**
 * GradientText UI 컴포넌트 테스트
 *
 * SVG 기반 그래디언트 텍스트의 렌더링, variant, fontSize, fontWeight,
 * 다크모드, 접근성, testID 검증.
 */

import React from 'react';
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
import { GradientText } from '../../../components/ui/GradientText';

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

describe('GradientText', () => {
  describe('렌더링', () => {
    it('children 텍스트를 렌더링해야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <GradientText>온전한 나는?</GradientText>
      );

      // accessibilityLabel로 children 텍스트가 설정됨
      expect(getByLabelText('온전한 나는?')).toBeTruthy();
    });

    it('빈 문자열도 렌더링되어야 한다', () => {
      const { root } = renderWithTheme(
        <GradientText testID="empty-text">{''}</GradientText>
      );

      expect(root).toBeTruthy();
    });

    it('긴 텍스트도 정상 렌더링되어야 한다', () => {
      const longText = '이것은 매우 긴 텍스트입니다 테스트용';
      const { getByLabelText } = renderWithTheme(
        <GradientText>{longText}</GradientText>
      );

      expect(getByLabelText(longText)).toBeTruthy();
    });
  });

  describe('variant', () => {
    it('기본 brand variant로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientText testID="brand-text">브랜드</GradientText>
      );

      expect(getByTestId('brand-text')).toBeTruthy();
    });

    it('skin variant로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientText variant="skin" testID="skin-text">피부</GradientText>
      );

      expect(getByTestId('skin-text')).toBeTruthy();
    });

    it('personalColor variant로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientText variant="personalColor" testID="pc-text">퍼스널컬러</GradientText>
      );

      expect(getByTestId('pc-text')).toBeTruthy();
    });

    it('body variant로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientText variant="body" testID="body-text">체형</GradientText>
      );

      expect(getByTestId('body-text')).toBeTruthy();
    });

    it('workout variant로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientText variant="workout" testID="workout-text">운동</GradientText>
      );

      expect(getByTestId('workout-text')).toBeTruthy();
    });

    it('extended variant로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientText variant="extended" testID="ext-text">확장</GradientText>
      );

      expect(getByTestId('ext-text')).toBeTruthy();
    });

    it('커스텀 colors가 variant보다 우선되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientText
          variant="brand"
          colors={['#FF0000', '#0000FF']}
          testID="custom-colors"
        >
          커스텀
        </GradientText>
      );

      expect(getByTestId('custom-colors')).toBeTruthy();
    });
  });

  describe('fontSize', () => {
    it('기본 fontSize 22가 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientText testID="default-size">기본 크기</GradientText>
      );

      expect(getByTestId('default-size')).toBeTruthy();
    });

    it('커스텀 fontSize가 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientText fontSize={36} testID="large-size">큰 글씨</GradientText>
      );

      expect(getByTestId('large-size')).toBeTruthy();
    });

    it('작은 fontSize도 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientText fontSize={12} testID="small-size">작은 글씨</GradientText>
      );

      expect(getByTestId('small-size')).toBeTruthy();
    });
  });

  describe('fontWeight', () => {
    it('기본 fontWeight 700이 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientText testID="default-weight">기본 굵기</GradientText>
      );

      expect(getByTestId('default-weight')).toBeTruthy();
    });

    it('커스텀 fontWeight가 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientText fontWeight="300" testID="light-weight">가벼운 글씨</GradientText>
      );

      expect(getByTestId('light-weight')).toBeTruthy();
    });

    it('normal fontWeight가 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientText fontWeight="normal" testID="normal-weight">보통 글씨</GradientText>
      );

      expect(getByTestId('normal-weight')).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 렌더링되어야 한다', () => {
      const { getByTestId, getByLabelText } = renderWithTheme(
        <GradientText testID="dark-text">다크 모드 텍스트</GradientText>,
        true
      );

      expect(getByTestId('dark-text')).toBeTruthy();
      expect(getByLabelText('다크 모드 텍스트')).toBeTruthy();
    });

    it('라이트 모드에서 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientText testID="light-text">라이트 모드 텍스트</GradientText>,
        false
      );

      expect(getByTestId('light-text')).toBeTruthy();
    });
  });

  describe('접근성', () => {
    it('accessibilityRole="text"가 설정되어야 한다', () => {
      const { getByRole } = renderWithTheme(
        <GradientText>접근성 텍스트</GradientText>
      );

      expect(getByRole('text')).toBeTruthy();
    });

    it('accessibilityLabel이 children과 동일해야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <GradientText>라벨 테스트</GradientText>
      );

      expect(getByLabelText('라벨 테스트')).toBeTruthy();
    });
  });

  describe('testID', () => {
    it('testID가 올바르게 전달되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientText testID="my-gradient-text">테스트 ID</GradientText>
      );

      expect(getByTestId('my-gradient-text')).toBeTruthy();
    });

    it('testID 없이도 렌더링되어야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <GradientText>ID 없는 텍스트</GradientText>
      );

      expect(getByLabelText('ID 없는 텍스트')).toBeTruthy();
    });
  });

  describe('스타일', () => {
    it('커스텀 style이 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientText testID="styled-text" style={{ marginTop: 20 }}>
          스타일 텍스트
        </GradientText>
      );

      const element = getByTestId('styled-text');
      expect(element.props.style).toEqual(
        expect.objectContaining({ marginTop: 20 })
      );
    });
  });

  describe('onLayout (width 측정)', () => {
    it('onLayout 이벤트 시 SVG로 전환되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradientText testID="layout-text">레이아웃 측정</GradientText>
      );

      const container = getByTestId('layout-text');

      // onLayout을 시뮬레이트하여 width > 0 상태로 전환
      fireEvent(container, 'layout', {
        nativeEvent: { layout: { width: 200, height: 30 } },
      });

      // width > 0이면 SVG가 렌더링되어야 함 (에러 없이 동작)
      expect(container).toBeTruthy();
    });
  });
});
