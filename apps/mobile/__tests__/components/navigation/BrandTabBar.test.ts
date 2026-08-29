import {
  getTabBarBottomPadding,
  isTabRouteHidden,
} from '../../../components/navigation/BrandTabBar';

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

describe('BrandTabBar safe-area contract', () => {
  it('하단 inset이 기본 여백보다 크면 기기 inset을 그대로 사용한다', () => {
    expect(getTabBarBottomPadding(34)).toBe(34);
  });

  it('하단 inset이 없어도 최소 8pt 여백을 유지한다', () => {
    expect(getTabBarBottomPadding(0)).toBe(8);
  });
});
