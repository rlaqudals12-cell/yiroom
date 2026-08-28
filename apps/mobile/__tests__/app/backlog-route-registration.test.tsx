import { existsSync } from 'node:fs';
import path from 'node:path';

import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => {
  const { View } = require('react-native');
  const Stack = Object.assign(
    ({ children }: { children: React.ReactNode }) => <View testID="route-stack">{children}</View>,
    {
      Screen: ({ name, redirect }: { name: string; redirect?: boolean }) => (
        <View accessibilityState={{ disabled: redirect === true }} testID={`route-${name}`} />
      ),
    }
  );

  return { Stack };
});

jest.mock('../../lib/theme', () => ({
  useTheme: () => ({
    colors: { background: '#fff', card: '#fff', foreground: '#111' },
    typography: { weight: { semibold: '600' } },
  }),
}));

import ClosetLayout from '../../app/(closet)/_layout';
import ProductsLayout from '../../app/products/_layout';
import SettingsLayout from '../../app/settings/_layout';

describe('백로그 라우트 등록 계약', () => {
  it.each(['gallery', 'weather', 'style-profile', 'wardrobe-stats', 'color-analysis', 'style'])(
    '옷장 %s 표면을 직접 탐색 대상에서 제외한다',
    (routeName) => {
      const screen = render(<ClosetLayout />);

      expect(screen.getByTestId(`route-${routeName}`).props.accessibilityState).toEqual({
        disabled: true,
      });
    }
  );

  it('현재 사용 중인 옷장 홈과 추천 동선은 유지한다', () => {
    const screen = render(<ClosetLayout />);

    expect(screen.getByTestId('route-index').props.accessibilityState).toEqual({ disabled: false });
    expect(screen.getByTestId('route-recommend').props.accessibilityState).toEqual({
      disabled: false,
    });
  });

  it('건강 연동 화면만 설정 라우트 등록에서 제외한다', () => {
    const screen = render(<SettingsLayout />);

    expect(screen.getByTestId('route-health-sync').props.accessibilityState).toEqual({
      disabled: true,
    });
    expect(screen.getByTestId('route-index').props.accessibilityState).toEqual({ disabled: false });
  });

  it.each(['search.tsx', 'qa.tsx'])('위장 제품 화면 %s를 Expo Router 파일에서 제거한다', (file) => {
    const screen = render(<ProductsLayout />);
    const routeName = path.basename(file, path.extname(file));

    expect(existsSync(path.resolve(__dirname, '../../app/products', file))).toBe(false);
    expect(screen.queryByTestId(`route-${routeName}`)).toBeNull();
  });
});
