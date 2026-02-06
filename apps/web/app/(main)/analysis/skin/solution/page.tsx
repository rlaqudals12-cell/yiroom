'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SolutionTabs } from '@/components/analysis/skin/solution';
import type { SkinType } from '@/lib/mock/cleanser-types';

export default function SkinSolutionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [skinType, setSkinType] = useState<SkinType | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // URL 파라미터에서 피부 타입 가져오기 또는 DB에서 조회
  useEffect(() => {
    const fetchSkinType = async () => {
      // URL 파라미터에서 피부 타입 확인
      const typeFromUrl = searchParams.get('skinType');
      if (typeFromUrl) {
        setSkinType(typeFromUrl.toLowerCase() as SkinType);
        setIsLoading(false);
        return;
      }

      // DB에서 최근 분석 결과의 피부 타입 조회
      if (isSignedIn) {
        try {
          const { data } = await supabase
            .from('skin_analyses')
            .select('skin_type')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (data?.skin_type) {
            setSkinType(data.skin_type.toLowerCase() as SkinType);
          }
        } catch (err) {
          console.error('[Solution] Failed to fetch skin type:', err);
        }
      }
      setIsLoading(false);
    };

    if (isLoaded) {
      fetchSkinType();
    }
  }, [isLoaded, isSignedIn, supabase, searchParams]);

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            뒤로
          </Button>
          <h1 className="text-lg font-bold text-foreground">피부 솔루션</h1>
          <div className="w-16" />
        </header>

        {/* 솔루션 탭 */}
        <SolutionTabs userSkinType={skinType} />

        {/* 분석 유도 (피부 타입이 없을 때) */}
        {!skinType && (
          <div className="mt-6 p-4 bg-card rounded-xl border text-center">
            <p className="text-sm text-muted-foreground mb-3">
              피부 분석을 완료하면 맞춤 솔루션을 제공해드려요
            </p>
            <Button asChild>
              <Link href="/analysis/skin">피부 분석하기</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
