'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface NutritionLayoutClientProps {
  children: React.ReactNode;
}

/**
 * N-1 영양/식단 모듈 레이아웃 (클라이언트)
 */
export default function NutritionLayoutClient({ children }: NutritionLayoutClientProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FAFAFA]" role="main">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-10 bg-card border-b border-border/50">
        <div className="max-w-[480px] mx-auto px-4 h-14 flex items-center">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="w-5 h-5 text-foreground/80" />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-foreground">영양 관리</h1>
        </div>
      </header>

      {/* 콘텐츠 영역 - 하단 여백 80px (하단 네비게이션 공간) */}
      <div className="max-w-[480px] mx-auto px-4 py-6 pb-20">{children}</div>
    </div>
  );
}
