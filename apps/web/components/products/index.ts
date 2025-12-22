// Product UI 컴포넌트 통합 export

// 카드
export { ProductCard } from './ProductCard';
export { ProductCardSkeleton, ProductGridSkeleton } from './ProductCardSkeleton';

// 그리드
export { ProductGrid, extractMatchScores } from './ProductGrid';

// 탭/필터/정렬/검색
export { CategoryTabs } from './CategoryTabs';
export { ProductFilters, type ProductFilterState } from './ProductFilters';
export { ProductSort } from './ProductSort';
export { ProductSearch } from './ProductSearch';

// 상세 페이지
export { ProductDetailTabs } from './detail/ProductDetailTabs';
export { ProductMatchCard } from './detail/ProductMatchCard';
export { PriceHistoryChart } from './detail/PriceHistoryChart';

// 위시리스트
export { WishlistButton } from './WishlistButton';

// Q&A
export { ProductQASection } from './ProductQASection';

// 페이지 클라이언트
export { ProductsPageClient } from './ProductsPageClient';
