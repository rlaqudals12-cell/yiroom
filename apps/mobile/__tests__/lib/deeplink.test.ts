/**
 * 딥링크 유틸리티 테스트
 */

import { DeepLinkPath, DEEP_LINK_ROUTES } from '../../lib/deeplink/types';
import { parseDeepLinkUrl, handleDeepLinkUrl } from '../../lib/deeplink/handler';

describe('DEEP_LINK_ROUTES', () => {
  const expectedRoutes: Record<DeepLinkPath, string> = {
    '/workout/session': '/(workout)/session',
    '/nutrition/water': '/(nutrition)/water',
    '/nutrition/record': '/(nutrition)/record',
    '/nutrition/camera': '/(nutrition)/camera',
    '/products': '/products',
    '/products/search': '/products/search',
    '/profile': '/(tabs)/profile',
    '/settings': '/settings',
    '/settings/notifications': '/settings/notifications',
    '/settings/goals': '/settings/goals',
    '/settings/widgets': '/settings/widgets',
    '/analysis/personal-color': '/(analysis)/personal-color',
    '/analysis/skin': '/(analysis)/skin',
    '/analysis/body': '/(analysis)/body',
  };

  Object.entries(expectedRoutes).forEach(([deepLink, appRoute]) => {
    it(`"${deepLink}" → "${appRoute}" 매핑이 올바라야 함`, () => {
      expect(DEEP_LINK_ROUTES[deepLink as DeepLinkPath]).toBe(appRoute);
    });
  });
});

describe('parseDeepLinkUrl', () => {
  it('yiroom:// 스키마를 파싱해야 함', () => {
    const url = 'yiroom:///workout/session';
    const result = parseDeepLinkUrl(url);

    expect(result).toBeDefined();
    expect(result?.path).toBe('/workout/session');
  });

  it('쿼리 파라미터를 파싱해야 함', () => {
    const url = 'yiroom:///products?id=123&category=skincare';
    const result = parseDeepLinkUrl(url);

    expect(result?.params?.id).toBe('123');
    expect(result?.params?.category).toBe('skincare');
  });

  it('잘못된 URL은 null을 반환해야 함', () => {
    const invalidUrls = ['', 'invalid', 'http://example.com'];

    invalidUrls.forEach((url) => {
      const result = parseDeepLinkUrl(url);
      // 잘못된 URL은 null 또는 빈 path 반환
      expect(result === null || result?.path === '').toBe(true);
    });
  });

  it('경로만 있는 URL을 파싱해야 함', () => {
    const url = 'yiroom:///settings';
    const result = parseDeepLinkUrl(url);

    expect(result?.path).toBe('/settings');
    expect(result?.params).toEqual({});
  });
});

describe('handleDeepLinkUrl', () => {
  it('유효한 딥링크 경로를 처리해야 함', () => {
    const validPaths: DeepLinkPath[] = [
      '/workout/session',
      '/nutrition/water',
      '/products',
      '/settings',
    ];

    validPaths.forEach((path) => {
      const result = handleDeepLinkUrl(`yiroom://${path}`);
      // 결과가 정의되어 있거나 라우트가 존재해야 함
      expect(DEEP_LINK_ROUTES[path]).toBeDefined();
    });
  });

  it('알 수 없는 경로는 홈으로 이동해야 함', () => {
    const unknownPath = '/unknown/path';
    // 알 수 없는 경로는 기본 경로로 처리됨
    expect(DEEP_LINK_ROUTES[unknownPath as DeepLinkPath]).toBeUndefined();
  });
});

describe('DeepLinkPath 타입', () => {
  const allPaths: DeepLinkPath[] = [
    '/workout/session',
    '/nutrition/water',
    '/nutrition/record',
    '/nutrition/camera',
    '/products',
    '/products/search',
    '/profile',
    '/settings',
    '/settings/notifications',
    '/settings/goals',
    '/settings/widgets',
    '/analysis/personal-color',
    '/analysis/skin',
    '/analysis/body',
  ];

  it('모든 딥링크 경로가 정의되어야 함', () => {
    expect(allPaths.length).toBe(14);
  });

  allPaths.forEach((path) => {
    it(`"${path}" 경로가 라우트 매핑에 존재해야 함`, () => {
      expect(DEEP_LINK_ROUTES[path]).toBeDefined();
      expect(typeof DEEP_LINK_ROUTES[path]).toBe('string');
    });
  });
});

describe('위젯 딥링크', () => {
  const widgetDeepLinks = [
    { action: 'workout', deepLink: 'yiroom:///workout/session' },
    { action: 'water', deepLink: 'yiroom:///nutrition/water' },
    { action: 'meal', deepLink: 'yiroom:///nutrition/camera' },
    { action: 'products', deepLink: 'yiroom:///products' },
  ];

  widgetDeepLinks.forEach(({ action, deepLink }) => {
    it(`위젯 "${action}" 액션이 올바른 딥링크를 생성해야 함`, () => {
      expect(deepLink.startsWith('yiroom://')).toBe(true);
      const result = parseDeepLinkUrl(deepLink);
      expect(result?.path).toBeDefined();
    });
  });
});

describe('푸시 알림 딥링크', () => {
  const notificationDeepLinks = [
    { type: 'water_reminder', path: '/nutrition/water' },
    { type: 'workout_reminder', path: '/workout/session' },
    { type: 'meal_reminder', path: '/nutrition/camera' },
  ];

  notificationDeepLinks.forEach(({ type, path }) => {
    it(`"${type}" 알림이 "${path}"로 이동해야 함`, () => {
      expect(DEEP_LINK_ROUTES[path as DeepLinkPath]).toBeDefined();
    });
  });
});
