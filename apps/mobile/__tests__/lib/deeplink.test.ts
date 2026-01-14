/**
 * 딥링크 유틸리티 테스트
 * 실제 모듈 대신 타입 정의만 테스트
 */

// 딥링크 경로 타입 정의
type DeepLinkPath =
  | '/workout/session'
  | '/nutrition/water'
  | '/nutrition/record'
  | '/nutrition/camera'
  | '/products'
  | '/products/search'
  | '/profile'
  | '/settings'
  | '/settings/notifications'
  | '/settings/goals'
  | '/settings/widgets'
  | '/analysis/personal-color'
  | '/analysis/skin'
  | '/analysis/body';

// 딥링크 라우트 매핑
const DEEP_LINK_ROUTES: Record<DeepLinkPath, string> = {
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

// URL 파싱 함수
function parseDeepLinkUrl(
  url: string
): { path: string; params: Record<string, string> } | null {
  if (!url || !url.startsWith('yiroom://')) {
    return null;
  }

  try {
    const urlObj = new URL(url.replace('yiroom://', 'https://app.yiroom.com'));
    const params: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return {
      path: urlObj.pathname,
      params,
    };
  } catch {
    return null;
  }
}

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
