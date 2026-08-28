import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

import { navigateToDeepLink, parseDeepLink } from '../../../lib/deeplink/handler';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('@yiroom/shared', () => ({
  FEATURE_FLAGS: { WELLNESS_PHASE2: false },
}));

jest.mock('../../../lib/utils/logger', () => ({
  deepLinkLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const HIDDEN_WELLNESS_DEEP_LINKS = [
  '/workout/session',
  '/workout/log',
  '/workout/history',
  '/nutrition/dashboard',
  '/nutrition/camera',
  '/nutrition/water',
] as const;

describe('숨김 웰니스 딥링크 게이트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(HIDDEN_WELLNESS_DEEP_LINKS)('%s 진입을 차단한다', (path) => {
    const parsed = parseDeepLink(`yiroom://${path.slice(1)}`);

    expect(navigateToDeepLink(parsed)).toBe(false);
    expect(router.push).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('노출 중인 제품 딥링크는 계속 이동한다', () => {
    const parsed = parseDeepLink('yiroom://products');

    expect(navigateToDeepLink(parsed)).toBe(true);
    expect(router.push).toHaveBeenCalledWith('/products');
  });

  it.each(['/products/search', '/products/qa'])(
    '폐기한 %s 딥링크는 제품 상세로 위장해 열지 않는다',
    (path) => {
      const parsed = parseDeepLink(`yiroom://${path.slice(1)}`);

      expect(navigateToDeepLink(parsed)).toBe(false);
      expect(router.push).not.toHaveBeenCalled();
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    }
  );

  it('실제 제품 ID 딥링크는 상세 화면으로 계속 이동한다', () => {
    const parsed = parseDeepLink('yiroom://products/cosmetic-1');

    expect(navigateToDeepLink(parsed)).toBe(true);
    expect(router.push).toHaveBeenCalledWith('/products/cosmetic-1');
  });
});
