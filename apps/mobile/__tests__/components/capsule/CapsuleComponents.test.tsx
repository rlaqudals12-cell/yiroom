/**
 * 캡슐 컴포넌트 테스트 — CapsuleProgressBar, GapCard, SafetyBadge
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { CapsuleProgressBar } from '../../../components/capsule/CapsuleProgressBar';
import { GapCard } from '../../../components/capsule/GapCard';
import { SafetyBadge } from '../../../components/capsule/SafetyBadge';
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

// ─── CapsuleProgressBar ────────────────────────────────

describe('CapsuleProgressBar', () => {
  it('기본 렌더링', () => {
    const { getByText } = renderWithTheme(
      <CapsuleProgressBar current={3} optimal={5} />
    );

    expect(getByText('3/5')).toBeTruthy();
    expect(getByText('60%')).toBeTruthy();
  });

  it('0/0일 때 0% 표시', () => {
    const { getByText } = renderWithTheme(
      <CapsuleProgressBar current={0} optimal={0} />
    );

    expect(getByText('0/0')).toBeTruthy();
    expect(getByText('0%')).toBeTruthy();
  });

  it('100% 도달', () => {
    const { getByText } = renderWithTheme(
      <CapsuleProgressBar current={5} optimal={5} />
    );

    expect(getByText('5/5')).toBeTruthy();
    expect(getByText('100%')).toBeTruthy();
  });

  it('current > optimal → 100% 캡', () => {
    const { getByText } = renderWithTheme(
      <CapsuleProgressBar current={7} optimal={5} />
    );

    expect(getByText('7/5')).toBeTruthy();
    expect(getByText('100%')).toBeTruthy();
  });

  it('showLabel=false일 때 라벨 숨김', () => {
    const { queryByText } = renderWithTheme(
      <CapsuleProgressBar current={3} optimal={5} showLabel={false} />
    );

    expect(queryByText('3/5')).toBeNull();
    expect(queryByText('60%')).toBeNull();
  });

  it('testID 전달', () => {
    const { getByTestId } = renderWithTheme(
      <CapsuleProgressBar current={1} optimal={3} testID="progress" />
    );

    expect(getByTestId('progress')).toBeTruthy();
  });

  it('커스텀 accentColor 전달', () => {
    const { getByTestId } = renderWithTheme(
      <CapsuleProgressBar current={2} optimal={4} accentColor="#FF0000" testID="colored" />
    );

    expect(getByTestId('colored')).toBeTruthy();
  });
});

// ─── GapCard ───────────────────────────────────────────

describe('GapCard', () => {
  const baseGap = {
    category: '보습제',
    reason: '건조한 환경에서 수분 보호가 필요해요',
    canReuse: true,
  };

  it('기본 렌더링 — 카테고리와 이유 표시', () => {
    const { getByText } = renderWithTheme(
      <GapCard gap={baseGap} testID="gap-card" />
    );

    expect(getByText('보습제')).toBeTruthy();
    expect(getByText('건조한 환경에서 수분 보호가 필요해요')).toBeTruthy();
  });

  it('testID 전달', () => {
    const { getByTestId } = renderWithTheme(
      <GapCard gap={baseGap} testID="my-gap" />
    );

    expect(getByTestId('my-gap')).toBeTruthy();
  });

  it('canReuse=true일 때 재활용 버튼 표시', () => {
    const onReuse = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <GapCard gap={baseGap} onReuse={onReuse} />
    );

    fireEvent.press(getByLabelText('보습제 재활용'));
    expect(onReuse).toHaveBeenCalledTimes(1);
  });

  it('canReuse=false일 때 재활용 버튼 미표시', () => {
    const gap = { ...baseGap, canReuse: false };
    const { queryByText } = renderWithTheme(
      <GapCard gap={gap} onReuse={() => {}} />
    );

    expect(queryByText('재활용')).toBeNull();
  });

  it('onShop 콜백', () => {
    const onShop = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <GapCard gap={baseGap} onShop={onShop} />
    );

    fireEvent.press(getByLabelText('보습제 쇼핑'));
    expect(onShop).toHaveBeenCalledTimes(1);
  });

  it('콜백 없을 때 버튼 미표시', () => {
    const { queryByText } = renderWithTheme(
      <GapCard gap={baseGap} />
    );

    expect(queryByText('재활용')).toBeNull();
    expect(queryByText('추천 보기')).toBeNull();
  });
});

// ─── SafetyBadge ───────────────────────────────────────

describe('SafetyBadge', () => {
  it('block 등급 렌더링', () => {
    const { getByText, getByLabelText } = renderWithTheme(
      <SafetyBadge level="block" testID="badge" />
    );

    expect(getByText('🚫')).toBeTruthy();
    expect(getByText('차단')).toBeTruthy();
    expect(getByLabelText('차단 등급')).toBeTruthy();
  });

  it('warn 등급 렌더링', () => {
    const { getByText } = renderWithTheme(
      <SafetyBadge level="warn" />
    );

    expect(getByText('⚠️')).toBeTruthy();
    expect(getByText('주의')).toBeTruthy();
  });

  it('info 등급 렌더링', () => {
    const { getByText } = renderWithTheme(
      <SafetyBadge level="info" />
    );

    expect(getByText('ℹ️')).toBeTruthy();
    expect(getByText('참고')).toBeTruthy();
  });

  it('safe 등급 렌더링', () => {
    const { getByText } = renderWithTheme(
      <SafetyBadge level="safe" />
    );

    expect(getByText('✅')).toBeTruthy();
    expect(getByText('안전')).toBeTruthy();
  });

  it('커스텀 라벨 전달', () => {
    const { getByText } = renderWithTheme(
      <SafetyBadge level="warn" label="알레르기 주의" />
    );

    expect(getByText('알레르기 주의')).toBeTruthy();
  });

  it('testID 전달', () => {
    const { getByTestId } = renderWithTheme(
      <SafetyBadge level="safe" testID="safety" />
    );

    expect(getByTestId('safety')).toBeTruthy();
  });

  it('다크모드에서 렌더링', () => {
    const { getByText } = renderWithTheme(
      <SafetyBadge level="block" />,
      true
    );

    expect(getByText('차단')).toBeTruthy();
  });
});
