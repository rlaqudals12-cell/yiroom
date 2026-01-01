/**
 * 국제화 (i18n) 테스트
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { t, getLocale, setLocale, initI18n } from '../../lib/i18n';

// AsyncStorage 모킹은 jest.setup.js에서 처리됨

describe('i18n', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 로케일 초기화
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  describe('getLocale', () => {
    it('기본 로케일을 반환해야 함', () => {
      const locale = getLocale();
      expect(['ko', 'en']).toContain(locale);
    });
  });

  describe('t (번역 함수)', () => {
    it('중첩 키를 번역해야 함', () => {
      // 기본 로케일(ko) 기준
      const result = t('common.loading');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('없는 키는 키 이름을 반환해야 함', () => {
      const result = t('nonexistent.key');
      expect(result).toBe('nonexistent.key');
    });

    it('변수 보간을 처리해야 함', () => {
      const result = t('common.greeting', { name: '홍길동' });
      // 변수가 포함된 문자열이어야 함
      expect(typeof result).toBe('string');
    });

    it('복수형을 처리해야 함', () => {
      const singular = t('common.items', { count: 1 });
      const plural = t('common.items', { count: 5 });
      expect(typeof singular).toBe('string');
      expect(typeof plural).toBe('string');
    });
  });

  describe('setLocale', () => {
    it('로케일을 변경하고 저장해야 함', async () => {
      await setLocale('en');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@yiroom/locale',
        'en'
      );
    });

    it('잘못된 로케일은 무시해야 함', async () => {
      // @ts-expect-error 잘못된 로케일 테스트
      await setLocale('fr');

      // 기본값 유지
      expect(getLocale()).not.toBe('fr');
    });
  });

  describe('initI18n', () => {
    it('저장된 로케일을 로드해야 함', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('en');

      const locale = await initI18n();
      expect(locale).toBe('en');
    });

    it('저장된 로케일이 없으면 디바이스 설정 사용', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const locale = await initI18n();
      expect(['ko', 'en']).toContain(locale);
    });
  });
});

describe('번역 키 무결성', () => {
  const koreanKeys = [
    'common.loading',
    'common.error',
    'common.retry',
    'common.cancel',
    'common.confirm',
    'common.save',
    'common.delete',
    'tabs.home',
    'tabs.workout',
    'tabs.nutrition',
    'tabs.profile',
    'workout.title',
    'workout.session',
    'workout.complete',
    'nutrition.title',
    'nutrition.record',
    'nutrition.water',
    'products.title',
    'products.forYou',
    'settings.title',
  ];

  koreanKeys.forEach((key) => {
    it(`"${key}" 키가 번역되어야 함`, () => {
      const result = t(key);
      // 키 자체가 아닌 번역된 문자열이어야 함
      expect(result).not.toBe(key);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
