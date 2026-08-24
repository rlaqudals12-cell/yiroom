import { isTabRouteHidden } from '../../../components/navigation/BrandTabBar';

describe('BrandTabBar hidden route contract', () => {
  it('Expo Router href=null 화면을 렌더 대상에서 제외한다', () => {
    expect(isTabRouteHidden({ href: null })).toBe(true);
  });

  it('tabBarButton으로 숨긴 화면을 렌더 대상에서 제외한다', () => {
    expect(isTabRouteHidden({ tabBarButton: () => null })).toBe(true);
  });

  it('일반 화면은 유지한다', () => {
    expect(isTabRouteHidden({ href: '/home' })).toBe(false);
  });
});
