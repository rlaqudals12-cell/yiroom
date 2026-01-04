/**
 * 국제화 (i18n) 테스트
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// jest.setup.js의 모킹을 실제 구현으로 대체
jest.mock('@/lib/i18n', () => jest.requireActual('@/lib/i18n'));

// 실제 i18n 모듈 import
import { t, getLocale, setLocale, initI18n } from '../../lib/i18n';

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
      // home.greeting에 {{name}} 변수가 있음
      const result = t('home.greeting', { params: { name: '홍길동' } });
      // 변수가 포함된 문자열이어야 함
      expect(typeof result).toBe('string');
      expect(result).toContain('홍길동');
    });

    it('변수가 있는 다른 키도 처리해야 함', () => {
      // workout.caloriesBurned에 {{calories}} 변수가 있음
      const result = t('workout.caloriesBurned', { params: { calories: 200 } });
      expect(typeof result).toBe('string');
      expect(result).toContain('200');
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

    it('지원되는 로케일만 설정해야 함', async () => {
      // ko와 en만 지원
      await setLocale('ko');
      expect(getLocale()).toBe('ko');

      await setLocale('en');
      expect(getLocale()).toBe('en');
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
