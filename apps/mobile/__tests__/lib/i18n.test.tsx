import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('@/lib/i18n', () => jest.requireActual('@/lib/i18n'));
jest.mock('@/lib/i18n/provider', () => jest.requireActual('@/lib/i18n/provider'));

import {
  getLocale,
  i18n,
  initI18n,
  MobileI18nProvider,
  setLocale,
  t,
  useTranslation,
} from '../../lib/i18n';
import en from '../../lib/i18n/locales/en';
import ko from '../../lib/i18n/locales/ko';
import webKo from '../../../web/messages/ko.json';
import webEn from '../../../web/messages/en.json';

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

  it.each(['ko', 'en'])(
    '%s에서 없는 키는 반복 호출해도 실패하며 카탈로그를 오염시키지 않는다',
    async (locale) => {
      await i18n.changeLanguage(locale);
      for (let attempt = 0; attempt < 2; attempt += 1) {
        expect(() => t('test.missing')).toThrow(
          '[i18n] Missing translation: translation:test.missing'
        );
        expect(() => i18n.t('test.missing', { defaultValue: 'Raw fallback' })).toThrow(
          'Missing translation'
        );
      }
      expect(i18n.exists('test.missing')).toBe(false);
    }
  );

  it('훅에서 사용하는 번역 함수도 누락 키를 실패로 드러낸다', () => {
    let translate: ReturnType<typeof useTranslation>['t'] | undefined;
    function HookProbe() {
      translate = useTranslation().t;
      return null;
    }
    render(<HookProbe />);
    expect(() => translate?.('test.missingHook')).toThrow('Missing translation');
  });

  it('개발 환경에서는 NODE_ENV가 test가 아니어도 누락을 실패로 드러낸다', () => {
    const previousEnv = process.env.NODE_ENV;
    const previousDev = __DEV__;
    try {
      Object.assign(process.env, { NODE_ENV: 'development' });
      Object.assign(globalThis, { __DEV__: true });
      expect(() => t('test.missingDevelopment')).toThrow('Missing translation');
    } finally {
      Object.assign(process.env, { NODE_ENV: previousEnv });
      Object.assign(globalThis, { __DEV__: previousDev });
    }
  });

  it('운영에서는 한국어 폴백을 사용하고 정본에도 없는 키를 그대로 노출하지 않는다', async () => {
    const previousEnv = process.env.NODE_ENV;
    const previousDev = __DEV__;
    try {
      Object.assign(process.env, { NODE_ENV: 'production' });
      Object.assign(globalThis, { __DEV__: false });
      await i18n.changeLanguage('en');
      i18n.addResource('ko', 'translation', 'test.productionKoOnly', '한국어 안내');
      expect(t('test.productionKoOnly')).toBe('한국어 안내');
      expect(t('test.productionMissing')).toBe(ko.common.translationUnavailable);
      expect(t('test.productionMissing', { defaultValue: 'Raw fallback' })).toBe(
        ko.common.translationUnavailable
      );
      expect(i18n.exists('test.productionMissing')).toBe(false);
    } finally {
      Object.assign(process.env, { NODE_ENV: previousEnv });
      Object.assign(globalThis, { __DEV__: previousDev });
    }
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

  it.each([
    ['ko', koLeaves, flattenLeaves(webKo)],
    ['en', enLeaves, flattenLeaves(webEn)],
  ])('%s 모바일 전체 투영 문구가 웹 정본과 일치한다', (_locale, mobileLeaves, webLeaves) => {
    for (const [key, value] of Object.entries(mobileLeaves)) {
      expect({ key, value }).toEqual({ key, value: webLeaves[key] });
    }
  });

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
