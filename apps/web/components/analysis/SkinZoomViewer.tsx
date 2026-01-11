'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SkinImageViewer } from './SkinImageViewer';
import { SolutionPanel } from './SolutionPanel';
import type { ProblemArea } from '@/types/skin-problem-area';

interface SkinZoomViewerProps {
  imageUrl: string;
  problemAreas: ProblemArea[];
  className?: string;
}

/**
 * 피부 확대 뷰어 통합 컴포넌트
 * - SkinImageViewer + SolutionPanel 조합
 * - 문제 영역 선택/해제 상태 관리
 * - 제품 검색 라우팅
 */
export function SkinZoomViewer({ imageUrl, problemAreas, className }: SkinZoomViewerProps) {
  const router = useRouter();
  const [selectedArea, setSelectedArea] = useState<ProblemArea | null>(null);

  const handleAreaClick = useCallback((area: ProblemArea) => {
    setSelectedArea(area);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedArea(null);
  }, []);

  const handleProductClick = useCallback(
    (ingredient: string) => {
      // 성분으로 제품 검색 페이지 이동
      router.push(`/products?search=${encodeURIComponent(ingredient)}`);
    },
    [router]
  );

  return (
    <>
      <SkinImageViewer
        imageUrl={imageUrl}
        problemAreas={problemAreas}
        onAreaClick={handleAreaClick}
        selectedAreaId={selectedArea?.id}
        className={className}
      />

      <SolutionPanel
        area={selectedArea}
        onClose={handleClosePanel}
        onProductClick={handleProductClick}
      />
    </>
  );
}
