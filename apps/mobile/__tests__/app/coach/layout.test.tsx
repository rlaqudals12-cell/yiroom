import React from 'react';
import { fireEvent } from '@testing-library/react-native';

import { renderWithTheme } from '../../helpers/test-utils';

const mockRouterPush = jest.fn();

jest.mock('expo-router', () => {
  const { View } = require('react-native');
  const Stack = ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
  Stack.Screen = ({
    name,
    options,
  }: {
    name: string;
    options?: { headerRight?: () => React.ReactNode };
  }) => <View testID={`coach-stack-${name}`}>{options?.headerRight?.()}</View>;

  return {
    Stack,
    router: { push: (...args: unknown[]) => mockRouterPush(...args) },
  };
});

jest.mock('../../../lib/coach', () => ({
  BEAUTY_TEAM_HISTORY_ENABLED: true,
}));

import CoachLayout from '../../../app/(coach)/_layout';

describe('CoachLayout', () => {
  it('뷰티팀 헤더에서 대화 기록 화면에 진입할 수 있다', () => {
    const { getByText } = renderWithTheme(<CoachLayout />);

    fireEvent.press(getByText('기록'));

    expect(mockRouterPush).toHaveBeenCalledWith('/(coach)/history');
  });
});
