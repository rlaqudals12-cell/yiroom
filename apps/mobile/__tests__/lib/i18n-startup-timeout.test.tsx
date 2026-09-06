import fs from 'node:fs';
import path from 'node:path';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render } from '@testing-library/react-native';
import { getLocales } from 'expo-localization';
import React from 'react';
import { Text } from 'react-native';

import { i18n } from '../../lib/i18n';
import { MobileI18nProvider } from '../../lib/i18n/provider';

jest.mock('@/lib/i18n', () => jest.requireActual('@/lib/i18n'));
jest.mock('@/lib/i18n/provider', () => jest.requireActual('@/lib/i18n/provider'));

const LOCALE_STORAGE_TIMEOUT_MS = 1000;

function renderProvider() {
  return render(
    <MobileI18nProvider>
      <Text testID="localized-child">준비됨</Text>
    </MobileI18nProvider>
  );
}

describe('mobile i18n startup timeout', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (getLocales as jest.Mock).mockReturnValue([{ languageCode: 'ko', regionCode: 'KR' }]);
    await i18n.changeLanguage('ko');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('저장소가 영구 대기해도 상한 전에는 닫고 상한 뒤 한국어로 연다', async () => {
    jest.useFakeTimers();
    (AsyncStorage.getItem as jest.Mock).mockImplementation(() => new Promise(() => undefined));
    const changeLanguage = jest.spyOn(i18n, 'changeLanguage');

    const screen = renderProvider();

    expect(screen.queryByTestId('localized-child')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(LOCALE_STORAGE_TIMEOUT_MS - 1);
      await Promise.resolve();
    });
    expect(screen.queryByTestId('localized-child')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('localized-child')).toBeTruthy();
    expect(i18n.resolvedLanguage).toBe('ko');
    expect(changeLanguage).toHaveBeenCalledTimes(1);
    expect(changeLanguage).toHaveBeenCalledWith('ko');
  });

  it('타임아웃 뒤 늦게 도착한 저장 locale은 언어를 다시 바꾸지 않는다', async () => {
    jest.useFakeTimers();
    let resolveLocale: ((value: string | null) => void) | undefined;
    (AsyncStorage.getItem as jest.Mock).mockReturnValue(
      new Promise<string | null>((resolve) => {
        resolveLocale = resolve;
      })
    );
    const changeLanguage = jest.spyOn(i18n, 'changeLanguage');

    const screen = renderProvider();

    await act(async () => {
      jest.advanceTimersByTime(LOCALE_STORAGE_TIMEOUT_MS);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByTestId('localized-child')).toBeTruthy();
    expect(changeLanguage).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveLocale?.('en');
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(i18n.resolvedLanguage).toBe('ko');
    expect(changeLanguage).toHaveBeenCalledTimes(1);
  });

  it('저장소가 정상 응답하면 상한 전에 초기화를 끝내고 타이머를 정리한다', async () => {
    jest.useFakeTimers();
    let resolveLocale: ((value: string | null) => void) | undefined;
    (AsyncStorage.getItem as jest.Mock).mockReturnValue(
      new Promise<string | null>((resolve) => {
        resolveLocale = resolve;
      })
    );
    const changeLanguage = jest.spyOn(i18n, 'changeLanguage');

    const screen = renderProvider();
    expect(screen.queryByTestId('localized-child')).toBeNull();

    await act(async () => {
      resolveLocale?.('ko');
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('localized-child')).toBeTruthy();
    expect(changeLanguage).toHaveBeenCalledTimes(1);
    expect(changeLanguage).toHaveBeenCalledWith('ko');
  });

  it('저장소 조회가 실패하면 기기 locale로 폴백해 자식을 연다', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('storage unavailable'));

    const screen = renderProvider();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('localized-child')).toBeTruthy();
    expect(i18n.resolvedLanguage).toBe('ko');
  });

  it('루트 레이아웃이 실제 앱 트리를 MobileI18nProvider로 감싼다', () => {
    const rootLayoutSource = fs.readFileSync(path.join(process.cwd(), 'app/_layout.tsx'), 'utf8');

    expect(rootLayoutSource).toContain(
      "import { MobileI18nProvider } from '../lib/i18n/provider';"
    );
    expect(rootLayoutSource).toMatch(
      /<MobileI18nProvider>[\s\S]*<SentryErrorBoundary[\s\S]*<\/MobileI18nProvider>/
    );
  });
});
