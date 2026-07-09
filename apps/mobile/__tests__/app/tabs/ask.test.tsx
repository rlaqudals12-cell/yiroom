/**
 * 물어보기 탭 렌더링 테스트 (ADR-114)
 *
 * 대상: app/(tabs)/ask.tsx (AskScreen)
 * 코치 ChatInterface(정본)를 탭으로 마운트하는지 검증.
 */
import React from 'react';

import { renderWithTheme } from '../../helpers/test-utils';

// --- 공통 mock ---

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy({}, { get: () => (props: Record<string, unknown>) => <View {...props} /> });
});

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

// --- 컴포넌트 mock ---

jest.mock('../../../components/ui', () => {
  const { View } = require('react-native');
  return {
    ScreenContainer: ({
      children,
      testID,
    }: {
      children: React.ReactNode;
      testID?: string;
      [key: string]: unknown;
    }) => <View testID={testID}>{children}</View>,
  };
});

// 코치 ChatInterface가 정본 — chat 컴포넌트가 아님
jest.mock('../../../components/coach/ChatInterface', () => {
  const { View, Text } = require('react-native');
  return {
    ChatInterface: () => (
      <View testID="coach-chat-interface">
        <Text>Coach ChatInterface Mock</Text>
      </View>
    ),
  };
});

// --- 테스트 ---

import AskScreen from '../../../app/(tabs)/ask';

describe('AskScreen (물어보기 탭)', () => {
  it('에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<AskScreen />);
    expect(getByTestId('ask-screen')).toBeTruthy();
  });

  it('코치 ChatInterface가 포함된다 (상담 정본 단일화)', () => {
    const { getByTestId } = renderWithTheme(<AskScreen />);
    expect(getByTestId('coach-chat-interface')).toBeTruthy();
  });

  it('다크 모드에서도 에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<AskScreen />, true);
    expect(getByTestId('ask-screen')).toBeTruthy();
  });
});
