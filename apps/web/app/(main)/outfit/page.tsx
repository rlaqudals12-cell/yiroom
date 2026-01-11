'use client';

/**
 * Phase J P3: 전체 코디 페이지
 * PC-1 결과 기반 의상+악세서리+메이크업 통합 추천
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Sparkles, Info, AlertCircle, Palette } from 'lucide-react';
import { FullOutfit } from '@/components/styling';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useUser } from '@clerk/nextjs';
import type { SeasonType } from '@/lib/mock/personal-color';

// 시즌 타입별 한글 라벨
const SEASON_LABELS: Record<SeasonType, string> = {
  spring: '봄 웜톤',
  summer: '여름 쿨톤',
  autumn: '가을 웜톤',
  winter: '겨울 쿨톤',
};

export default function OutfitPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  const [seasonType, setSeasonType] = useState<SeasonType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PC-1 결과 가져오기
  useEffect(() => {
    async function fetchPersonalColor() {
      if (!isLoaded || !user) return;

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('personal_color_assessments')
          .select('season')
          .eq('clerk_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('PC_NOT_FOUND');
          } else {
            throw fetchError;
          }
        } else if (data) {
          setSeasonType(data.season.toLowerCase() as SeasonType);
        }
      } catch (err) {
        console.error('[Outfit] Failed to fetch PC result:', err);
        setError('FETCH_ERROR');
      } finally {
        setLoading(false);
      }
    }

    fetchPersonalColor();
  }, [isLoaded, user, supabase]);

  // 저장 핸들러
  const handleSave = (outfitId: string) => {
    console.log('[Outfit] Save outfit:', outfitId);
    // 향후 저장 기능 구현
  };

  // 공유 핸들러
  const handleShare = (outfitId: string) => {
    console.log('[Outfit] Share outfit:', outfitId);
    // 향후 공유 기능 구현
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4" data-testid="outfit-page-loading">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // PC-1 결과 없음
  if (error === 'PC_NOT_FOUND' || !seasonType) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4" data-testid="outfit-page-no-pc">
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <Card className="border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">
                전체 코디 추천을 받으려면 먼저 퍼스널 컬러 분석을 완료해주세요.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button className="mt-4 w-full" onClick={() => router.push('/analysis/personal-color')}>
          <Palette className="w-4 h-4 mr-2" />
          퍼스널 컬러 분석하기
        </Button>
      </div>
    );
  }

  // 에러 상태
  if (error === 'FETCH_ERROR') {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4" data-testid="outfit-page-error">
        <Card className="border-destructive/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">
                데이터를 불러오는데 실패했습니다. 다시 시도해주세요.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4" data-testid="outfit-page">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            전체 코디
          </h1>
          <p className="text-muted-foreground text-sm">
            {SEASON_LABELS[seasonType]}에 어울리는 완성형 스타일링
          </p>
        </div>
      </div>

      {/* 시즌 배지 */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor:
                    seasonType === 'spring'
                      ? '#FFD700'
                      : seasonType === 'summer'
                        ? '#87CEEB'
                        : seasonType === 'autumn'
                          ? '#D2691E'
                          : '#4169E1',
                }}
              >
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold">{SEASON_LABELS[seasonType]}</p>
                <p className="text-sm text-muted-foreground">
                  {seasonType === 'spring' || seasonType === 'autumn' ? '웜톤' : '쿨톤'} 계열
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/styling')}>
              스타일링
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 전체 코디 컴포넌트 */}
      <FullOutfit seasonType={seasonType} onSave={handleSave} onShare={handleShare} />
    </div>
  );
}
