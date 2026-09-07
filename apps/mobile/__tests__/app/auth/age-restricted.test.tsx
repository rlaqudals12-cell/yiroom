import fs from 'node:fs';
import path from 'node:path';

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ts from 'typescript';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Stack = ({ children }: { children: React.ReactNode }) => children;
  Stack.Screen = ({ name, options }: { name: string; options: { title: string } }) =>
    name === 'age-restricted'
      ? ReactModule.createElement(Text, { testID: 'age-restricted-stack-title' }, options.title)
      : null;
  return { Stack, useRouter: () => ({ push: mockPush, back: mockBack }) };
});

jest.mock('@/lib/i18n', () => jest.requireActual('@/lib/i18n'));

jest.mock('@/lib/theme', () => ({
  useTheme: () => ({
    brand: { primary: '#7C3AED', primaryForeground: '#FFFFFF' },
    colors: {
      background: '#FFF9F5',
      foreground: '#241F1B',
      mutedForeground: '#6F6259',
    },
    radii: { full: 999 },
    spacing: { sm: 8, smx: 12, md: 16, lg: 24, xl: 32 },
    typography: {
      size: { sm: 13, base: 15, '2xl': 26 },
      weight: { bold: '700' },
    },
  }),
}));

import AgeRestrictedScreen from '@/app/(auth)/age-restricted';
import AuthLayout from '@/app/(auth)/_layout';
import { i18n } from '@/lib/i18n';

function findUiKoreanLiterals(relativePath: string): string[] {
  const absolutePath = path.join(process.cwd(), relativePath);
  const sourceText = fs.readFileSync(absolutePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    absolutePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const violations: string[] = [];

  function visit(node: ts.Node): void {
    if (
      (ts.isStringLiteralLike(node) || ts.isJsxText(node)) &&
      /[가-힣]/.test(node.getText(sourceFile))
    ) {
      violations.push(node.getText(sourceFile));
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

describe('AgeRestrictedScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await i18n.changeLanguage('ko');
  });

  it('연령 제한 안내와 두 후속 동선을 i18n 카탈로그에서 표시한다', () => {
    const { getByLabelText, getByText } = render(<AgeRestrictedScreen />);

    expect(getByText('연령 확인이 필요합니다')).toBeTruthy();
    expect(getByText(/14세 이상/)).toBeTruthy();

    fireEvent.press(getByLabelText('연령 확인하기'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/complete-profile');

    fireEvent.press(getByLabelText('뒤로 가기'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['ko', '이용 연령 안내', '연령 확인이 필요합니다'],
    ['en', 'Age eligibility notice', 'Age verification required'],
  ])('%s Stack 헤더는 짧은 탐색 라벨이며 H1을 중복하지 않는다', async (locale, header, title) => {
    await i18n.changeLanguage(locale);
    const screen = render(
      <>
        <AuthLayout />
        <AgeRestrictedScreen />
      </>
    );
    expect(screen.getByTestId('age-restricted-stack-title').props.children).toBe(header);
    expect(screen.getAllByText(title)).toHaveLength(1);
  });

  it('검수용 영문 카탈로그로 전환하면 제한 안내가 영어로만 렌더링된다', async () => {
    await i18n.changeLanguage('en');
    const screen = render(<AgeRestrictedScreen />);

    expect(screen.getByText('Age verification required')).toBeTruthy();
    expect(screen.getByText(/users aged 14 or older/)).toBeTruthy();
    expect(screen.getByLabelText('Verify age')).toBeTruthy();
    expect(screen.getByLabelText('Go back')).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).not.toMatch(/[가-힣]/);
  });

  it('이관된 화면에 한국어 UI literal이 재유입되지 않는다', () => {
    expect(findUiKoreanLiterals('app/(auth)/age-restricted.tsx')).toEqual([]);
  });
});
