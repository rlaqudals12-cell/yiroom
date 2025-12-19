/**
 * Products Dynamic Import
 * 초기 로드 불필요한 무거운 컴포넌트 지연 로딩
 *
 * 성능 최적화: ~50KB 번들 크기 감소 (Filter Sheet)
 */

import dynamic from 'next/dynamic';

// ProductFilters - Sheet 컴포넌트 (필터 버튼 클릭 시에만 필요)
export const ProductFiltersDynamic = dynamic(
  () => import('./ProductFilters').then(mod => ({ default: mod.ProductFilters })),
  {
    ssr: false,
    loading: () => null,
  }
);

// ProductDetailTabs - 제품 상세 페이지 하단 탭 (스크롤 아래)
export const ProductDetailTabsDynamic = dynamic(
  () => import('./detail/ProductDetailTabs').then(mod => ({ default: mod.ProductDetailTabs })),
  {
    ssr: false,
    loading: () => null,
  }
);
