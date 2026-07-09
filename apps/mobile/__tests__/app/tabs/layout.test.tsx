/**
 * 탭 레이아웃 5탭 IA 테스트 (ADR-114)
 *
 * 대상: app/(tabs)/_layout.tsx
 * 웹 BottomNav 정본과 동일한 5항목 [오늘][뷰티][물어보기][스타일][나] 검증.
 * 물어보기는 물리적 가운데(3번째), 기록 탭은 WELLNESS_PHASE2 플래그로 비노출.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

// --- expo-router Tabs를 검사 가능한 컴포넌트로 대체 ---
jest.mock('expo-router', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');

  const Tabs = ({ children }: { children: React.ReactNode }) => (
    <View testID="tabs-root">{children}</View>
  );
  // 각 Screen을 name/label/href 노출용 마커로 렌더
  Tabs.Screen = ({
    name,
    options,
  }: {
    name: string;
    options?: { tabBarLabel?: string; href?: string | null };
  }) =>
    ReactLib.createElement(View, {
      testID: `tab-screen-${name}`,
      accessibilityLabel: typeof options?.tabBarLabel === 'string' ? options.tabBarLabel : name,
      // href === null 이면 탭바 비노출(게이팅)
      accessibilityState: { disabled: options?.href === null },
    });

  return { Tabs };
});

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy({}, { get: () => (props: Record<string, unknown>) => <View {...props} /> });
});

jest.mock('../../../components/navigation/BrandTabBar', () => ({
  BrandTabBar: () => null,
}));

// WELLNESS_PHASE2=false 기본 (ADR-098 기록 탭 숨김)
jest.mock('@yiroom/shared', () => ({
  FEATURE_FLAGS: { WELLNESS_PHASE2: false },
}));

jest.mock('../../../lib/theme', () => ({
  useTheme: () => ({
    colors: {
      card: '#fff',
      foreground: '#111',
      background: '#fff',
      border: '#eee',
      mutedForeground: '#888',
    },
  }),
}));

import TabLayout from '../../../app/(tabs)/_layout';

describe('TabLayout (5탭 IA, ADR-114)', () => {
  it('5탭 [오늘][뷰티][물어보기][스타일][나]가 모두 등록된다', () => {
    const { getByTestId } = render(<TabLayout />);

    expect(getByTestId('tab-screen-index').props.accessibilityLabel).toBe('오늘');
    expect(getByTestId('tab-screen-beauty').props.accessibilityLabel).toBe('뷰티');
    expect(getByTestId('tab-screen-ask').props.accessibilityLabel).toBe('물어보기');
    expect(getByTestId('tab-screen-style').props.accessibilityLabel).toBe('스타일');
    expect(getByTestId('tab-screen-profile').props.accessibilityLabel).toBe('나');
  });

  it('물어보기 탭이 노출 5탭의 물리적 가운데(3번째)에 위치한다', () => {
    const { getAllByTestId } = render(<TabLayout />);

    // 노출 탭(기록 제외)의 등록 순서 = 탭바 표시 순서
    const visibleOrder = getAllByTestId(/^tab-screen-/)
      .map((node) => node.props.testID as string)
      .filter((id) => id !== 'tab-screen-records');

    expect(visibleOrder).toEqual([
      'tab-screen-index',
      'tab-screen-beauty',
      'tab-screen-ask',
      'tab-screen-style',
      'tab-screen-profile',
    ]);
    expect(visibleOrder[2]).toBe('tab-screen-ask');
  });

  it('기록 탭은 WELLNESS_PHASE2=false 시 href=null로 비노출된다', () => {
    const { getByTestId } = render(<TabLayout />);
    // href === null → accessibilityState.disabled true (mock 규약)
    expect(getByTestId('tab-screen-records').props.accessibilityState.disabled).toBe(true);
  });
});
