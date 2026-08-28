import React from 'react';
import { render } from '@testing-library/react-native';

const mockUseLocalSearchParams = jest.fn(() => ({}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock('@/lib/theme', () => ({
  useTheme: () => ({ colors: { background: '#FFF' } }),
}));

jest.mock('../../../components/coach/ChatInterface', () => {
  const { View } = require('react-native');
  return {
    ChatInterface: ({
      initialSessionId,
      surface,
    }: {
      initialSessionId?: string;
      surface?: string;
    }) => (
      <View
        testID="coach-chat-interface"
        accessibilityLabel={`${surface}:${initialSessionId ?? ''}`}
      />
    ),
  };
});

jest.mock('../../../components/ui', () => {
  const { View } = require('react-native');
  return {
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
      <View testID={testID}>{children}</View>
    ),
  };
});

import CoachScreen from '../../../app/(coach)/index';

describe('(coach) 직접 진입 게이트', () => {
  beforeEach(() => {
    mockUseLocalSearchParams.mockReturnValue({});
  });

  it('기존 딥링크도 뷰티팀 표면으로 마운트한다', () => {
    const { getByTestId } = render(<CoachScreen />);

    expect(getByTestId('coach-chat-interface').props.accessibilityLabel).toBe('beauty-team:');
  });

  it('뷰티팀 이력의 sessionId를 채팅 화면에 전달한다', () => {
    mockUseLocalSearchParams.mockReturnValue({ sessionId: 'beauty-session-1' });

    const { getByTestId } = render(<CoachScreen />);

    expect(getByTestId('coach-chat-interface').props.accessibilityLabel).toBe(
      'beauty-team:beauty-session-1'
    );
  });
});
