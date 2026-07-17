'use client';

/**
 * DrapingSection 지연 로드 래퍼 — 캔버스 합성 코드는 초기 뷰포트 밖이라 번들 분리.
 * (Server Component에서는 ssr:false 불가 → 클라 래퍼 파일 관행, performance-guidelines)
 */

import dynamic from 'next/dynamic';

export const DrapingSectionDynamic = dynamic(
  () => import('./DrapingSection').then((mod) => ({ default: mod.DrapingSection })),
  { ssr: false, loading: () => null }
);
