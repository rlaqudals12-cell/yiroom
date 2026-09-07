import fs from 'node:fs';
import path from 'node:path';

import { act, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import ts from 'typescript';

import HairAnalysisScreen from '../../../app/(analysis)/hair/index';
import { i18n } from '../../../lib/i18n';
import { renderWithTheme } from '../../helpers/test-utils';

jest.mock('@/lib/i18n', () => jest.requireActual('@/lib/i18n'));

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => (
      <View {...props}>{children}</View>
    ),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

describe('헤어 분석 입력 화면 i18n', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await i18n.changeLanguage('ko');
  });

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('ko');
    });
  });

  it.each([
    {
      locale: 'ko',
      title: 'AI 헤어 분석',
      subtitle: '모발 상태를 분석하고\n맞춤 케어 루틴을 추천해 드려요',
      featuresTitle: '분석 항목',
      features: [
        '모발 질감 분석',
        '직모/웨이브/컬리 등 모발 유형 파악',
        '두피 건강 체크',
        '두피 상태와 유분/수분 밸런스 확인',
        '맞춤 케어 루틴',
        'AI 기반 개인 맞춤 헤어 관리법 추천',
        '스타일 추천',
        '모발 특성에 맞는 헤어스타일 제안',
      ],
      guideTitle: '촬영 가이드',
      guides: [
        '• 자연광에서 헤어가 잘 보이게 촬영해주세요',
        '• 묶지 않은 자연스러운 상태가 좋아요',
        '• 앞·옆·뒤 다양한 각도를 촬영하면 정확해요',
      ],
      start: '헤어 분석 시작하기',
    },
    {
      locale: 'en',
      title: 'AI Hair Analysis',
      subtitle: 'Analyze your hair condition\nand get a personalized care routine',
      featuresTitle: 'What we analyze',
      features: [
        'Hair texture analysis',
        'Identify straight, wavy, curly, and other hair types',
        'Scalp health check',
        'Check scalp condition and oil/moisture balance',
        'Personalized care routine',
        'AI-based recommendations for your hair care',
        'Style recommendations',
        'Explore hairstyles suited to your hair',
      ],
      guideTitle: 'Photo guide',
      guides: [
        '• Take a photo in natural light with your hair clearly visible',
        '• Leave your hair down in its natural state',
        '• Capture front, side, and back views for better accuracy',
      ],
      start: 'Start hair analysis',
    },
  ])('$locale 화면 전체 문구와 접근성 CTA를 표시하고 촬영으로 이동한다', async (copy) => {
    await i18n.changeLanguage(copy.locale);
    const screen = renderWithTheme(<HairAnalysisScreen />);
    expect(screen.getByTestId('analysis-hair-screen')).toBeTruthy();
    [
      copy.title,
      copy.subtitle,
      copy.featuresTitle,
      ...copy.features,
      copy.guideTitle,
      ...copy.guides,
      copy.start,
    ].forEach((text) => expect(screen.getByText(text)).toBeTruthy());
    fireEvent.press(screen.getByRole('button', { name: copy.start }));
    expect(router.push).toHaveBeenCalledWith('/(analysis)/hair/camera');
  });

  it('이미 열린 화면의 언어를 바꾸면 기능 설명과 접근성 CTA도 갱신한다', async () => {
    const screen = renderWithTheme(<HairAnalysisScreen />);
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    expect(screen.queryByText('AI 헤어 분석')).toBeNull();
    expect(screen.getByText('Hair texture analysis')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start hair analysis' })).toBeTruthy();
  });

  it('화면의 JSX와 문자열에 한국어 하드코딩이 남지 않는다', () => {
    const filename = path.join(process.cwd(), 'app/(analysis)/hair/index.tsx');
    const source = ts.createSourceFile(
      filename,
      fs.readFileSync(filename, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );
    const violations: string[] = [];
    function visit(node: ts.Node): void {
      if (
        (ts.isStringLiteralLike(node) || ts.isJsxText(node) || ts.isTemplateSpan(node)) &&
        /[가-힣]/.test(node.getText(source))
      ) {
        violations.push(node.getText(source));
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    expect(violations).toEqual([]);
  });
});
