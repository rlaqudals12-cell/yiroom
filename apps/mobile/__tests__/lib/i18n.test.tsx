import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('@/lib/i18n', () => jest.requireActual('@/lib/i18n'));
jest.mock('@/lib/i18n/provider', () => jest.requireActual('@/lib/i18n/provider'));

import { getLocale, i18n, initI18n, setLocale, t, useTranslation } from '../../lib/i18n';
import en from '../../lib/i18n/locales/en';
import ko from '../../lib/i18n/locales/ko';
import { MobileI18nProvider } from '../../lib/i18n/provider';
import webKo from '../../../web/messages/ko.json';

type JsonRecord = Record<string, unknown>;

function flattenLeaves(value: JsonRecord, prefix = ''): Record<string, string> {
  return Object.entries(value).reduce<Record<string, string>>((leaves, [key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'string') {
      leaves[path] = child;
    } else if (child && typeof child === 'object' && !Array.isArray(child)) {
      Object.assign(leaves, flattenLeaves(child as JsonRecord, path));
    }
    return leaves;
  }, {});
}

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map((match) => match[1]).sort();
}

function LocaleProbe({ testID }: { testID: string }) {
  const { t: translate } = useTranslation();
  return <Text testID={testID}>{translate('auth.signIn')}</Text>;
}

describe('mobile i18n runtime', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (getLocales as jest.Mock).mockReturnValue([{ languageCode: 'ko', regionCode: 'KR' }]);
    await i18n.changeLanguage('ko');
  });

  it('한국어 중첩 키와 named interpolation을 번역한다', () => {
    expect(t('auth.signIn')).toBe('로그인');
    expect(
      t('auth.mobileSignIn.verificationDescription', {
        params: { email: 'hello@example.com' },
      })
    ).toBe('hello@example.com로 전송된 인증 코드를 입력해주세요');
  });

  it('영문 카탈로그 누락 시 한국어 리소스로 폴백한다', async () => {
    i18n.addResource('ko', 'translation', 'test.koOnly', '한국어 폴백');
    await i18n.changeLanguage('en');

    expect(t('test.koOnly')).toBe('한국어 폴백');
  });

  it('미지원 기기 locale과 저장된 미공개 locale은 한국어로 초기화한다', async () => {
    (getLocales as jest.Mock).mockReturnValue([{ languageCode: 'ja', regionCode: 'JP' }]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('en');

    await expect(initI18n()).resolves.toBe('ko');
    expect(getLocale()).toBe('ko');
  });

  it('미공개 locale 설정 요청은 한국어로 닫고 같은 값을 저장한다', async () => {
    await setLocale('en');

    expect(getLocale()).toBe('ko');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@yiroom/locale', 'ko');
  });

  it('언어 변경이 모든 useTranslation 구독자에 전파된다', async () => {
    const screen = render(
      <>
        <LocaleProbe testID="locale-probe-a" />
        <LocaleProbe testID="locale-probe-b" />
      </>
    );

    expect(screen.getByTestId('locale-probe-a').props.children).toBe('로그인');
    expect(screen.getByTestId('locale-probe-b').props.children).toBe('로그인');

    await act(async () => {
      await i18n.changeLanguage('en');
    });

    expect(screen.getByTestId('locale-probe-a').props.children).toBe('Sign In');
    expect(screen.getByTestId('locale-probe-b').props.children).toBe('Sign In');
  });

  it('provider는 저장 locale 초기화가 끝난 뒤 자식 화면을 연다', async () => {
    let resolveLocale: ((value: string | null) => void) | undefined;
    (AsyncStorage.getItem as jest.Mock).mockReturnValue(
      new Promise<string | null>((resolve) => {
        resolveLocale = resolve;
      })
    );

    const screen = render(
      <MobileI18nProvider>
        <Text testID="localized-child">준비됨</Text>
      </MobileI18nProvider>
    );

    expect(screen.queryByTestId('localized-child')).toBeNull();

    await act(async () => {
      resolveLocale?.(null);
    });

    await waitFor(() => expect(screen.getByTestId('localized-child')).toBeTruthy());
  });
});

describe('mobile catalog contract', () => {
  const koLeaves = flattenLeaves(ko as JsonRecord);
  const enLeaves = flattenLeaves(en as JsonRecord);

  it('ko/en의 전체 leaf key와 interpolation 변수가 일치한다', () => {
    expect(Object.keys(enLeaves).sort()).toEqual(Object.keys(koLeaves).sort());

    for (const key of Object.keys(koLeaves)) {
      expect(placeholders(enLeaves[key])).toEqual(placeholders(koLeaves[key]));
    }
  });

  it('모바일 공용 문구 projection은 웹 한국어 정본과 일치한다', () => {
    expect(ko.common.close).toBe(webKo.common.close);
    expect(ko.auth.signIn).toBe(webKo.auth.signIn);
    expect(ko.auth.signUp).toBe(webKo.auth.signUp);
    expect(ko.auth.mobileSignIn).toEqual(webKo.auth.mobileSignIn);
    expect(ko.auth.mobileSignUp).toEqual(webKo.auth.mobileSignUp);
    expect(ko.auth.mobileForgotPassword).toEqual(webKo.auth.mobileForgotPassword);
    expect(ko.auth.mobileAgeVerification).toEqual(webKo.auth.mobileAgeVerification);
    expect(ko.analysis.skinNonMedicalDevice).toBe(webKo.analysis.skinNonMedicalDevice);
    expect(ko.analysis.skinNonMedicalPurpose).toBe(webKo.analysis.skinNonMedicalPurpose);
    expect(ko.analysis.skinNonMedicalLimitsTitle).toBe(webKo.analysis.skinNonMedicalLimitsTitle);
    expect(ko.analysis.skinNonMedicalLimitsSummary).toBe(
      webKo.analysis.skinNonMedicalLimitsSummary
    );
    expect(ko.analysis.skinNonMedicalLimits).toBe(webKo.analysis.skinNonMedicalLimits);
  });
});
