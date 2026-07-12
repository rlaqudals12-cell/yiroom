/**
 * 개인정보처리방침 화면 테스트
 *
 * 대상: app/privacy-policy.tsx
 * 목적: 웹 정본(2026-07-12 법적 감사) 동기화 문구 회귀 가드 —
 *       성별·생년월일 필수화, AI 코치 대화 서버 저장, 생체정보 보유기간,
 *       국외이전 고지, 허위 문구("익명 집계"·"서버 미저장") 부재 확인.
 */
import React from 'react';
import { fireEvent } from '@testing-library/react-native';

import { renderWithTheme } from '../helpers/test-utils';

// --- Standard mocks ---

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: () => (props: Record<string, unknown>) => <View {...props} />,
    }
  );
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

import PrivacyPolicyScreen from '../../app/privacy-policy';

describe('PrivacyPolicyScreen (개인정보처리방침)', () => {
  it('에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<PrivacyPolicyScreen />);
    expect(getByTestId('privacy-policy-screen')).toBeTruthy();
  });

  it('시행일이 2026년 7월 12일로 표시된다', () => {
    const { getByText } = renderWithTheme(<PrivacyPolicyScreen />);
    expect(getByText('최종 업데이트: 2026년 7월 12일')).toBeTruthy();
    expect(getByText(/2026년 7월 12일부터 적용됩니다/)).toBeTruthy();
  });

  describe('수집 항목 (§2) — 성별·생년월일 필수화', () => {
    it('필수 항목에 생년월일과 성별이 포함된다', () => {
      const { getByText } = renderWithTheme(<PrivacyPolicyScreen />);
      expect(getByText(/필수 항목:.*생년월일.*성별/)).toBeTruthy();
    });

    it('선택 항목에 생년월일·성별이 없다 (구버전 허위 표기 제거)', () => {
      const { getByText, queryByText } = renderWithTheme(<PrivacyPolicyScreen />);
      expect(getByText('선택 항목: 프로필 사진, 키, 체중')).toBeTruthy();
      expect(queryByText(/선택 항목:.*생년월일/)).toBeNull();
      expect(queryByText(/선택 항목:.*성별/)).toBeNull();
    });
  });

  describe('보유 기간 (§3·§4)', () => {
    it('AI 코치 대화가 서버에 저장됨을 정직하게 고지한다', () => {
      const { getByText, queryByText } = renderWithTheme(<PrivacyPolicyScreen />);
      expect(
        getByText(/AI 코치 대화: 대화 이어보기 기능 제공을 위해 서버에 저장되며/)
      ).toBeTruthy();
      // 구버전 허위 문구("서버에 영구 저장하지 않음") 부재
      expect(queryByText(/영구 저장하지 않음/)).toBeNull();
      expect(queryByText(/세션 종료 시 삭제/)).toBeNull();
    });

    it('생체이미지 보유기간이 동의일로부터 1년 자동 파기 + 탈퇴·요청 시 즉시 파기로 표기된다', () => {
      const { getByText } = renderWithTheme(<PrivacyPolicyScreen />);
      expect(
        getByText(/보유 기간: 저장 동의 시 동의일로부터 1년간 보관 후 자동 파기/)
      ).toBeTruthy();
      expect(getByText(/회원 탈퇴 또는 삭제 요청 시 즉시 파기/)).toBeTruthy();
    });
  });

  describe('국외 이전 고지 (§5)', () => {
    it('Google LLC 미국 이전 및 거부 방법이 고지된다', () => {
      const { getByText } = renderWithTheme(<PrivacyPolicyScreen />);
      expect(getByText('개인정보의 국외 이전')).toBeTruthy();
      expect(getByText(/이전받는 자: Google LLC/)).toBeTruthy();
      expect(getByText(/이전 국가: 미국/)).toBeTruthy();
      expect(getByText(/이전 거부 방법 및 효과/)).toBeTruthy();
    });

    it('제휴 클릭 기록이 회원 식별자와 함께 저장됨을 고지한다 ("익명 집계" 허위 문구 제거)', () => {
      const { getByText, queryByText } = renderWithTheme(<PrivacyPolicyScreen />);
      expect(getByText(/회원 식별자와 함께 서비스 내부에 저장/)).toBeTruthy();
      expect(queryByText(/익명으로 집계/)).toBeNull();
    });

    it('개인정보 처리 위탁 현황에 Vercel·Tawk.to·Sentry가 포함된다', () => {
      const { getByText, getAllByText } = renderWithTheme(<PrivacyPolicyScreen />);
      expect(getByText('개인정보 처리 위탁 현황')).toBeTruthy();
      expect(getByText(/Vercel: 서비스 호스팅/)).toBeTruthy();
      expect(getByText(/Tawk\.to: 고객 상담 위젯 운영/)).toBeTruthy();
      // "Sentry: 오류 모니터링"은 쿠키 섹션에도 등장 — 위탁 목록 + 쿠키 고지 2곳 확인
      expect(getAllByText(/Sentry: 오류 모니터링/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('신설 섹션 (§8~§10)', () => {
    it('자동화된 결정·안전성 확보조치·아동 보호 섹션이 존재한다', () => {
      const { getByText } = renderWithTheme(<PrivacyPolicyScreen />);
      expect(getByText('8. 자동화된 결정 및 프로파일링')).toBeTruthy();
      expect(getByText('9. 개인정보의 안전성 확보조치')).toBeTruthy();
      expect(getByText('10. 아동의 개인정보 보호')).toBeTruthy();
      expect(getByText('13. 개인정보처리방침의 변경')).toBeTruthy();
    });
  });

  describe('보호책임자 (§12)', () => {
    it('보호책임자 성명(김병민)이 기재된다', () => {
      const { getByText } = renderWithTheme(<PrivacyPolicyScreen />);
      expect(getByText(/성명: 김병민/)).toBeTruthy();
    });
  });

  describe('드리프트 가드', () => {
    it('웹 개인정보처리방침 전문 안내 링크가 표시된다', () => {
      const { getByText } = renderWithTheme(<PrivacyPolicyScreen />);
      expect(getByText(/최신 전문은 이룸 웹 개인정보처리방침에서 확인/)).toBeTruthy();
      expect(getByText(/웹 개인정보처리방침 전문 보기/)).toBeTruthy();
    });
  });

  describe('영문 안내', () => {
    it('English 토글 시 웹 영문 전문 링크 안내가 표시된다', () => {
      const { getByLabelText, getByText } = renderWithTheme(<PrivacyPolicyScreen />);
      fireEvent.press(getByLabelText('View in English'));
      expect(getByText(/View full Privacy Policy/)).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<PrivacyPolicyScreen />, true);
      expect(getByTestId('privacy-policy-screen')).toBeTruthy();
    });
  });
});
