'use client';

/**
 * IngredientAnalysisSection 동적 로딩 래퍼
 * Server Component에서 사용할 수 있도록 Client Component로 분리
 */

import dynamic from 'next/dynamic';
import { IngredientAnalysisSectionSkeleton } from './IngredientAnalysisSection';

export const IngredientAnalysisSectionDynamic = dynamic(
  () => import('./IngredientAnalysisSection').then((mod) => mod.IngredientAnalysisSection),
  {
    ssr: false,
    loading: () => <IngredientAnalysisSectionSkeleton />,
  }
);
