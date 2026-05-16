import { redirect } from 'next/navigation';
import { FEATURE_FLAGS } from '@yiroom/shared';

/**
 * /products/recommended — ADR-098: 운동/영양 목표 기반 추천(영양제·기구·건강식품)
 * 페이지. W/N 보류 영역이라 orphan + sitemap 제외 상태이나, 직접 URL 접근까지
 * 차단해 정합성 확보. 복원 시 WELLNESS_PHASE2=true 전환.
 */
export default function RecommendedProductsLayout({ children }: { children: React.ReactNode }) {
  if (!FEATURE_FLAGS.WELLNESS_PHASE2) {
    redirect('/products');
  }
  return <>{children}</>;
}
