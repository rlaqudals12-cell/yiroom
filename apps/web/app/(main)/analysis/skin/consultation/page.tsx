'use client';

/**
 * Phase D: 피부 상담 페이지
 * AI 챗봇 기반 피부 고민 상담
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SkinConsultationChat } from '@/components/skin-consultation';
import type { SkinAnalysisSummary } from '@/types/skin-consultation';

export default function SkinConsultationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();

  const [skinAnalysis, setSkinAnalysis] = useState<SkinAnalysisSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // URL에서 분석 ID 가져오기 (선택적)
  const analysisId = searchParams.get('analysisId');

  // 피부 분석 결과 로드
  useEffect(() => {
    async function loadSkinAnalysis() {
      if (!isLoaded || !userId) {
        setIsLoading(false);
        return;
      }

      try {
        // 특정 분석 ID가 있으면 해당 분석 로드
        let query = supabase
          .from('skin_analyses')
          .select('id, skin_type, hydration, oil_level, sensitivity, created_at')
          .order('created_at', { ascending: false })
          .limit(1);

        if (analysisId) {
          query = query.eq('id', analysisId);
        }

        const { data, error } = await query.single();

        if (error) {
          console.error('[SkinConsultation] Failed to load analysis:', error);
          setSkinAnalysis(null);
        } else if (data) {
          setSkinAnalysis({
            skinType: data.skin_type || '복합성',
            hydration: data.hydration || 50,
            oiliness: data.oil_level || 50,
            sensitivity: data.sensitivity || 50,
            analyzedAt: new Date(data.created_at),
          });
        }
      } catch (err) {
        console.error('[SkinConsultation] Error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSkinAnalysis();
  }, [isLoaded, userId, analysisId, supabase]);

  // 제품 클릭 핸들러
  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]" data-testid="skin-consultation-page">
      {/* 헤더 */}
      <header className="flex items-center gap-3 px-4 py-3 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">AI 피부 상담</h1>
      </header>

      {/* 채팅 영역 */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">분석 결과를 불러오는 중...</div>
        </div>
      ) : (
        <SkinConsultationChat skinAnalysis={skinAnalysis} onProductClick={handleProductClick} />
      )}
    </div>
  );
}
