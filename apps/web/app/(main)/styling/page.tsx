'use client';

/**
 * Phase J: AI 스타일링 페이지
 * PC-1 결과 기반 색상 조합 및 운동복 스타일링 추천
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Palette, Dumbbell, ArrowLeft, Sparkles, Info, AlertCircle } from 'lucide-react';
import { ColorCombination, WorkoutStyling } from '@/components/styling';
import { getColorCombinations } from '@/lib/mock/styling';
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

export default function StylingPage() {
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
            // 결과 없음
            setError('PC_NOT_FOUND');
          } else {
            throw fetchError;
          }
        } else if (data) {
          setSeasonType(data.season.toLowerCase() as SeasonType);
        }
      } catch (err) {
        console.error('[Styling] Failed to fetch PC result:', err);
        setError('FETCH_ERROR');
      } finally {
        setLoading(false);
      }
    }

    fetchPersonalColor();
  }, [isLoaded, user, supabase]);

  // 제품 클릭 핸들러 (어필리에이트 연동)
  const handleProductClick = (combinationId: string) => {
    // 향후 어필리에이트 제품 페이지로 연결
    console.log('[Styling] Product click:', combinationId);
    router.push('/products');
  };

  // 운동복 제품 클릭 핸들러
  const handleWorkoutProductClick = (combinationId: string, partner: 'musinsa' | 'coupang') => {
    console.log('[Styling] Workout product click:', combinationId, partner);
    // 향후 파트너별 제품 페이지로 연결
    router.push('/products?category=workout');
  };

  // 저장 핸들러
  const handleSave = (combinationId: string) => {
    // 향후 저장 기능 구현
    console.log('[Styling] Save combination:', combinationId);
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4" data-testid="styling-page-loading">
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
      <div className="container max-w-4xl mx-auto py-6 px-4" data-testid="styling-page-no-pc">
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <Card className="border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">
                스타일링 추천을 받으려면 먼저 퍼스널 컬러 분석을 완료해주세요.
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
      <div className="container max-w-4xl mx-auto py-6 px-4" data-testid="styling-page-error">
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

  const combinations = getColorCombinations(seasonType);

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4" data-testid="styling-page">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI 스타일링
          </h1>
          <p className="text-muted-foreground text-sm">
            {SEASON_LABELS[seasonType]}에 어울리는 코디 추천
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/analysis/personal-color')}
            >
              재분석
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 탭 콘텐츠 */}
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="daily" className="gap-1">
            <Palette className="w-4 h-4" />
            일상 코디
          </TabsTrigger>
          <TabsTrigger value="workout" className="gap-1">
            <Dumbbell className="w-4 h-4" />
            운동복
          </TabsTrigger>
        </TabsList>

        {/* 일상 코디 탭 */}
        <TabsContent value="daily">
          <ColorCombination
            combinations={combinations}
            title={`${SEASON_LABELS[seasonType]} 추천 코디`}
            showProducts={true}
            onProductClick={handleProductClick}
            onSave={handleSave}
          />
        </TabsContent>

        {/* 운동복 탭 */}
        <TabsContent value="workout">
          <WorkoutStyling seasonType={seasonType} onProductClick={handleWorkoutProductClick} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
