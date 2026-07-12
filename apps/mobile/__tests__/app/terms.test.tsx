/**
 * 이용약관 화면 테스트
 *
 * 대상: app/terms.tsx
 * 검증: 웹 정본 15조 체계 동기화(2026-07-12), 미제공 서비스(운동·영양·소셜) 미표기,
 *       신규 조항(미성년자·서비스 종료·게시물·손해배상), 드리프트 가드 문구, 한/영 토글.
 */
import React from 'react';
import { fireEvent } from '@testing-library/react-native';

import { renderWithTheme } from '../helpers/test-utils';

// react-native-safe-area-context mock
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

// ScreenContainer mock (내부 그라디언트·스크롤 의존성 제거)
jest.mock('../../components/ui', () => {
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

import TermsScreen from '../../app/terms';

describe('TermsScreen (이용약관)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('기본 렌더링 (한국어)', () => {
    it('에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<TermsScreen />);
      expect(getByTestId('terms-screen')).toBeTruthy();
    });

    it('시행일이 웹 정본과 동일하게 2026년 7월 12일로 표시된다', () => {
      const { getByText } = renderWithTheme(<TermsScreen />);
      expect(getByText(/시행일: 2026년 7월 12일/)).toBeTruthy();
    });

    it('15조 체계의 조 제목이 표시된다', () => {
      const { getByText } = renderWithTheme(<TermsScreen />);
      expect(getByText('제1조 (목적)')).toBeTruthy();
      expect(getByText('제6조 (서비스의 제공)')).toBeTruthy();
      expect(getByText('제15조 (분쟁 해결)')).toBeTruthy();
    });

    it('2026-07-12 신설 조항(미성년자·종료·게시물·손해배상)이 포함된다', () => {
      const { getByText } = renderWithTheme(<TermsScreen />);
      expect(getByText('제5조 (미성년자의 이용)')).toBeTruthy();
      expect(getByText('제7조 (서비스의 변경 및 중단·종료)')).toBeTruthy();
      expect(getByText('제10조 (이용자 게시물 및 콘텐츠 관리)')).toBeTruthy();
      expect(getByText('제14조 (손해배상 및 책임의 제한)')).toBeTruthy();
    });

    it('만 14세 연령 기준과 법정대리인 동의가 명시된다', () => {
      const { getByText } = renderWithTheme(<TermsScreen />);
      expect(getByText(/만 14세 이상인 자만 이용할 수 있으며/)).toBeTruthy();
      expect(getByText(/법정대리인\(부모 등\)의 동의/)).toBeTruthy();
    });

    it('서비스 종료 시 최소 30일 전 사전 고지가 명시된다', () => {
      const { getByText } = renderWithTheme(<TermsScreen />);
      expect(getByText(/종료일로부터 최소 30일 전에 서비스 내 공지/)).toBeTruthy();
    });

    it('AI 결과 무보장과 제휴 링크 면책이 명시된다', () => {
      const { getByText } = renderWithTheme(<TermsScreen />);
      expect(
        getByText(/정확성, 완전성 또는 특정 목적에의 적합성을 보장하지 않습니다/)
      ).toBeTruthy();
      expect(getByText(/제휴 링크를 통해 외부 서비스를 이용하는 경우/)).toBeTruthy();
    });

    it('미제공(게이팅) 서비스인 운동·영양·소셜 피드가 서비스 내용에 없다', () => {
      const { queryAllByText } = renderWithTheme(<TermsScreen />);
      expect(queryAllByText(/운동/)).toHaveLength(0);
      expect(queryAllByText(/영양/)).toHaveLength(0);
      expect(queryAllByText(/소셜/)).toHaveLength(0);
      expect(queryAllByText(/피드/)).toHaveLength(0);
      expect(queryAllByText(/챌린지/)).toHaveLength(0);
      expect(queryAllByText(/리더보드/)).toHaveLength(0);
      expect(queryAllByText(/웰니스/)).toHaveLength(0);
    });

    it('실제 제공 서비스(5축 분석·스타일링·AI 코치·제품 추천)가 기재된다', () => {
      const { getByText } = renderWithTheme(<TermsScreen />);
      expect(getByText(/AI 기반 퍼스널컬러, 피부, 체형, 헤어, 메이크업 분석/)).toBeTruthy();
      expect(getByText(/분석 결과 기반 맞춤 스타일링 제안/)).toBeTruthy();
      expect(getByText(/AI 코치 상담 서비스/)).toBeTruthy();
      expect(getByText(/제품 추천 및 정보 제공/)).toBeTruthy();
    });

    it('드리프트 가드 안내(최신 전문 = 웹 이용약관)가 마지막에 표시된다', () => {
      const { getByText } = renderWithTheme(<TermsScreen />);
      expect(
        getByText(/최신 전문: 이 약관의 최신 전문은 이룸\(yiroom\) 웹 이용약관 페이지/)
      ).toBeTruthy();
    });

    it('문의 이메일이 웹과 동일하게 표시된다', () => {
      const { getByText } = renderWithTheme(<TermsScreen />);
      expect(getByText(/contact@yiroom\.app/)).toBeTruthy();
    });
  });

  describe('언어 토글 (영어)', () => {
    it('English 버튼을 누르면 영문 약관이 표시된다', () => {
      const { getByText } = renderWithTheme(<TermsScreen />);
      fireEvent.press(getByText('English'));

      expect(getByText(/Effective: July 12, 2026/)).toBeTruthy();
      expect(getByText('5. Minors')).toBeTruthy();
      expect(getByText('7. Modification, Suspension, and Termination of Service')).toBeTruthy();
      expect(getByText('10. User Content and Moderation')).toBeTruthy();
      expect(getByText('14. Limitation of Liability')).toBeTruthy();
      expect(getByText('15. Governing Law')).toBeTruthy();
    });

    it('영문 약관에도 미제공 서비스(workout/nutrition/social)가 없다', () => {
      const { getByText, queryAllByText } = renderWithTheme(<TermsScreen />);
      fireEvent.press(getByText('English'));

      expect(queryAllByText(/workout/i)).toHaveLength(0);
      expect(queryAllByText(/nutrition/i)).toHaveLength(0);
      expect(queryAllByText(/social features/i)).toHaveLength(0);
      expect(queryAllByText(/leaderboard/i)).toHaveLength(0);
      expect(queryAllByText(/wellness/i)).toHaveLength(0);
    });

    it('한국어 버튼으로 다시 전환된다', () => {
      const { getByText } = renderWithTheme(<TermsScreen />);
      fireEvent.press(getByText('English'));
      fireEvent.press(getByText('한국어'));

      expect(getByText('제1조 (목적)')).toBeTruthy();
    });
  });
});
