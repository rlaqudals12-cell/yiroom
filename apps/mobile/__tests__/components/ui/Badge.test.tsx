/**
 * Badge UI 컴포넌트 테스트
 *
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
 * variant: default | secondary | destructive | outline | trust
 * module: skin | body | personalColor | workout | nutrition 등 모듈별 색상 뱃지
 */

import React from 'react';
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
import { Badge } from '../../../components/ui/Badge';

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

/** hex 색상을 rgba 문자열로 변환 (Badge 내부 함수와 동일 로직) */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ========================================
// 기본 variant 테스트
// ========================================

describe('Badge', () => {
  it('텍스트를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(<Badge>신규</Badge>);

    expect(getByText('신규')).toBeTruthy();
  });

  it('testID가 전달되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <Badge testID="my-badge">테스트</Badge>
    );

    expect(getByTestId('my-badge')).toBeTruthy();
  });

  it('default variant가 기본값이어야 한다', () => {
    const { getByText } = renderWithTheme(<Badge>기본</Badge>);

    expect(getByText('기본')).toBeTruthy();
  });

  it('secondary variant를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <Badge variant="secondary">보조</Badge>
    );

    expect(getByText('보조')).toBeTruthy();
  });

  it('destructive variant를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <Badge variant="destructive">위험</Badge>
    );

    expect(getByText('위험')).toBeTruthy();
  });

  it('outline variant를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <Badge variant="outline">외곽선</Badge>
    );

    expect(getByText('외곽선')).toBeTruthy();
  });

  it('다크 모드에서도 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <Badge variant="default">다크 뱃지</Badge>,
      true
    );

    expect(getByText('다크 뱃지')).toBeTruthy();
  });

  it('다크 모드에서 모든 variant가 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <>
        <Badge variant="default">A</Badge>
        <Badge variant="secondary">B</Badge>
        <Badge variant="destructive">C</Badge>
        <Badge variant="outline">D</Badge>
      </>,
      true
    );

    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
    expect(getByText('C')).toBeTruthy();
    expect(getByText('D')).toBeTruthy();
  });
});

// ========================================
// module prop 테스트
// ========================================

describe('Badge - module prop', () => {
  it('module=skin일 때 피부 모듈 색상으로 렌더링해야 한다', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <Badge module="skin" testID="skin-badge">피부</Badge>
    );

    const badge = getByTestId('skin-badge');
    const flatStyle = Array.isArray(badge.props.style)
      ? Object.assign({}, ...badge.props.style.filter(Boolean))
      : badge.props.style;

    // 피부 모듈 base=#60A5FA, 라이트모드 alpha=0.15
    expect(flatStyle.backgroundColor).toBe(hexToRgba(moduleColors.skin.base, 0.15));
    expect(getByText('피부')).toBeTruthy();
  });

  it('module=body일 때 체형 모듈 색상으로 렌더링해야 한다', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <Badge module="body" testID="body-badge">체형</Badge>
    );

    const badge = getByTestId('body-badge');
    const flatStyle = Array.isArray(badge.props.style)
      ? Object.assign({}, ...badge.props.style.filter(Boolean))
      : badge.props.style;

    expect(flatStyle.backgroundColor).toBe(hexToRgba(moduleColors.body.base, 0.15));
    expect(getByText('체형')).toBeTruthy();
  });

  it('module=personalColor일 때 퍼스널컬러 모듈 색상으로 렌더링해야 한다', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <Badge module="personalColor" testID="pc-badge">퍼스널컬러</Badge>
    );

    const badge = getByTestId('pc-badge');
    const flatStyle = Array.isArray(badge.props.style)
      ? Object.assign({}, ...badge.props.style.filter(Boolean))
      : badge.props.style;

    expect(flatStyle.backgroundColor).toBe(hexToRgba(moduleColors.personalColor.base, 0.15));
    expect(getByText('퍼스널컬러')).toBeTruthy();
  });

  it('module=workout일 때 운동 모듈 색상으로 렌더링해야 한다', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <Badge module="workout" testID="workout-badge">운동</Badge>
    );

    const badge = getByTestId('workout-badge');
    const flatStyle = Array.isArray(badge.props.style)
      ? Object.assign({}, ...badge.props.style.filter(Boolean))
      : badge.props.style;

    expect(flatStyle.backgroundColor).toBe(hexToRgba(moduleColors.workout.base, 0.15));
    expect(getByText('운동')).toBeTruthy();
  });

  it('module prop이 있으면 borderWidth: 1이 적용되어야 한다 (outlined 스타일)', () => {
    const { getByTestId } = renderWithTheme(
      <Badge module="skin" testID="bordered-badge">테두리</Badge>
    );

    const badge = getByTestId('bordered-badge');
    const flatStyle = Array.isArray(badge.props.style)
      ? Object.assign({}, ...badge.props.style.filter(Boolean))
      : badge.props.style;

    expect(flatStyle.borderWidth).toBe(1);
    expect(flatStyle.borderColor).toBe(hexToRgba(moduleColors.skin.base, 0.2));
  });

  it('module prop이 있으면 텍스트에 모듈 dark 색상을 사용해야 한다 (라이트 모드)', () => {
    const { getByText } = renderWithTheme(
      <Badge module="skin">피부 텍스트</Badge>
    );

    const textEl = getByText('피부 텍스트');
    const flatStyle = Array.isArray(textEl.props.style)
      ? Object.assign({}, ...textEl.props.style.filter(Boolean))
      : textEl.props.style;

    // 라이트 모드: fg = mod.dark
    expect(flatStyle.color).toBe(moduleColors.skin.dark);
  });

  it('다크 모드에서 module=skin이 올바른 색상을 사용해야 한다', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <Badge module="skin" testID="dark-skin-badge">피부 다크</Badge>,
      true
    );

    const badge = getByTestId('dark-skin-badge');
    const flatStyle = Array.isArray(badge.props.style)
      ? Object.assign({}, ...badge.props.style.filter(Boolean))
      : badge.props.style;

    // 다크 모드: alpha=0.2, borderColor alpha=0.3
    expect(flatStyle.backgroundColor).toBe(hexToRgba(moduleColors.skin.base, 0.2));
    expect(flatStyle.borderColor).toBe(hexToRgba(moduleColors.skin.base, 0.3));

    // 다크 모드: fg = mod.light
    const textEl = getByText('피부 다크');
    const textStyle = Array.isArray(textEl.props.style)
      ? Object.assign({}, ...textEl.props.style.filter(Boolean))
      : textEl.props.style;
    expect(textStyle.color).toBe(moduleColors.skin.light);
  });

  it('다크 모드에서 module=body가 올바른 색상을 사용해야 한다', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <Badge module="body" testID="dark-body-badge">체형 다크</Badge>,
      true
    );

    const badge = getByTestId('dark-body-badge');
    const flatStyle = Array.isArray(badge.props.style)
      ? Object.assign({}, ...badge.props.style.filter(Boolean))
      : badge.props.style;

    expect(flatStyle.backgroundColor).toBe(hexToRgba(moduleColors.body.base, 0.2));

    const textEl = getByText('체형 다크');
    const textStyle = Array.isArray(textEl.props.style)
      ? Object.assign({}, ...textEl.props.style.filter(Boolean))
      : textEl.props.style;
    expect(textStyle.color).toBe(moduleColors.body.light);
  });
});

// ========================================
// trust variant 테스트
// ========================================

describe('Badge - trust variant', () => {
  it('trust variant가 녹색 기반 배경으로 렌더링해야 한다', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <Badge variant="trust" testID="trust-badge">검증됨</Badge>
    );

    const badge = getByTestId('trust-badge');
    const flatStyle = Array.isArray(badge.props.style)
      ? Object.assign({}, ...badge.props.style.filter(Boolean))
      : badge.props.style;

    // 라이트 모드: rgba(34, 197, 94, 0.1)
    expect(flatStyle.backgroundColor).toBe('rgba(34, 197, 94, 0.1)');
    expect(getByText('검증됨')).toBeTruthy();
  });

  it('trust variant가 녹색 텍스트 색상을 사용해야 한다 (라이트 모드)', () => {
    const { getByText } = renderWithTheme(
      <Badge variant="trust">신뢰도</Badge>
    );

    const textEl = getByText('신뢰도');
    const flatStyle = Array.isArray(textEl.props.style)
      ? Object.assign({}, ...textEl.props.style.filter(Boolean))
      : textEl.props.style;

    expect(flatStyle.color).toBe('#16A34A');
  });

  it('trust variant에 borderWidth: 1이 적용되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <Badge variant="trust" testID="trust-bordered">신뢰</Badge>
    );

    const badge = getByTestId('trust-bordered');
    const flatStyle = Array.isArray(badge.props.style)
      ? Object.assign({}, ...badge.props.style.filter(Boolean))
      : badge.props.style;

    expect(flatStyle.borderWidth).toBe(1);
    expect(flatStyle.borderColor).toBe('rgba(34, 197, 94, 0.2)');
  });

  it('다크 모드에서 trust variant가 올바른 색상을 사용해야 한다', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <Badge variant="trust" testID="dark-trust-badge">다크 신뢰</Badge>,
      true
    );

    const badge = getByTestId('dark-trust-badge');
    const flatStyle = Array.isArray(badge.props.style)
      ? Object.assign({}, ...badge.props.style.filter(Boolean))
      : badge.props.style;

    // 다크 모드: rgba(34, 197, 94, 0.15), borderColor rgba(34, 197, 94, 0.3)
    expect(flatStyle.backgroundColor).toBe('rgba(34, 197, 94, 0.15)');
    expect(flatStyle.borderColor).toBe('rgba(34, 197, 94, 0.3)');

    const textEl = getByText('다크 신뢰');
    const textStyle = Array.isArray(textEl.props.style)
      ? Object.assign({}, ...textEl.props.style.filter(Boolean))
      : textEl.props.style;

    expect(textStyle.color).toBe('#86EFAC');
  });
});
