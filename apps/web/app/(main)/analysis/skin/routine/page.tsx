'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { ArrowLeft, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  RoutineCard,
  RoutineStepList,
  RoutineToggle,
  RoutineTimeline,
} from '@/components/skin/routine';
import {
  generateRoutine,
  getSkinTypeLabel,
  getTimeOfDayLabel,
  enrichRoutineWithProducts,
} from '@/lib/skincare/routine';
import { formatDuration, calculateEstimatedTime } from '@/lib/mock/skincare-routine';
import type { TimeOfDay, RoutineStep } from '@/types/skincare-routine';
import type { SkinTypeId, SkinConcernId } from '@/lib/mock/skin-analysis';

// 피부 분석 결과 타입
interface SkinAnalysisData {
  id: string;
  skin_type: SkinTypeId;
  concerns: SkinConcernId[];
  created_at: string;
}

export default function SkincareRoutinePage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();

  // 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skinData, setSkinData] = useState<SkinAnalysisData | null>(null);
  const [activeTime, setActiveTime] = useState<TimeOfDay>('morning');
  const [morningSteps, setMorningSteps] = useState<RoutineStep[]>([]);
  const [eveningSteps, setEveningSteps] = useState<RoutineStep[]>([]);
  const [personalizationNote, setPersonalizationNote] = useState('');

  // 피부 분석 데이터 가져오기
  useEffect(() => {
    async function fetchSkinAnalysis() {
      if (!isLoaded || !isSignedIn) return;

      try {
        const { data, error: fetchError } = await supabase
          .from('skin_analyses')
          .select('id, skin_type, concerns, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError) {
          // 분석 결과 없음
          if (fetchError.code === 'PGRST116') {
            setError('피부 분석을 먼저 진행해주세요.');
            return;
          }
          throw fetchError;
        }

        setSkinData(data as SkinAnalysisData);
      } catch (err) {
        console.error('[Routine] Error fetching skin analysis:', err);
        setError('피부 분석 데이터를 불러오는데 실패했어요.');
      } finally {
        setLoading(false);
      }
    }

    fetchSkinAnalysis();
  }, [isLoaded, isSignedIn, supabase]);

  // 루틴 생성
  useEffect(() => {
    if (!skinData) return;

    const skinType = skinData.skin_type || 'normal';
    const concerns = (skinData.concerns || []) as SkinConcernId[];

    // 아침 루틴 생성
    const morningResult = generateRoutine({
      skinType,
      concerns,
      timeOfDay: 'morning',
      includeOptional: true,
    });

    // 저녁 루틴 생성
    const eveningResult = generateRoutine({
      skinType,
      concerns,
      timeOfDay: 'evening',
      includeOptional: true,
    });

    setMorningSteps(morningResult.routine);
    setEveningSteps(eveningResult.routine);
    setPersonalizationNote(morningResult.personalizationNote);

    // 어필리에이트 제품 연동 (비동기)
    enrichRoutineWithProducts(morningResult.routine, skinType, concerns)
      .then((enriched) => setMorningSteps(enriched))
      .catch((err) => console.error('[Routine] Morning products error:', err));

    enrichRoutineWithProducts(eveningResult.routine, skinType, concerns)
      .then((enriched) => setEveningSteps(enriched))
      .catch((err) => console.error('[Routine] Evening products error:', err));
  }, [skinData]);

  // 현재 활성 루틴
  const currentSteps = useMemo(
    () => (activeTime === 'morning' ? morningSteps : eveningSteps),
    [activeTime, morningSteps, eveningSteps]
  );

  const currentEstimatedTime = useMemo(() => calculateEstimatedTime(currentSteps), [currentSteps]);

  // 제품 클릭 핸들러
  const handleProductClick = useCallback((product: { affiliateUrl: string }) => {
    if (product.affiliateUrl) {
      window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // 뒤로가기
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // 피부 분석 페이지로 이동
  const handleGoToAnalysis = useCallback(() => {
    router.push('/analysis/skin?forceNew=true');
  }, [router]);

  // 로딩 상태
  if (loading || !isLoaded) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">루틴을 준비하고 있어요...</p>
        </div>
      </main>
    );
  }

  // 에러 상태 (분석 결과 없음)
  if (error) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-muted">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* 헤더 */}
          <header className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={handleBack} aria-label="뒤로가기">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">스킨케어 루틴</h1>
          </header>

          <div className="flex items-start gap-3 p-4 mb-6 bg-destructive/10 border border-destructive/20 rounded-xl">
            <AlertCircle
              className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-sm text-destructive">{error}</p>
          </div>

          <Button onClick={handleGoToAnalysis} className="w-full">
            피부 분석하러 가기
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-muted" data-testid="skincare-routine-page">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={handleBack} aria-label="뒤로가기">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">오늘의 스킨케어 루틴</h1>
            {skinData && (
              <p className="text-sm text-muted-foreground">
                {getSkinTypeLabel(skinData.skin_type)} 피부 맞춤 루틴
              </p>
            )}
          </div>
        </header>

        {/* 개인화 노트 */}
        {personalizationNote && (
          <div className="flex items-start gap-2 p-4 mb-6 bg-primary/5 rounded-xl border border-primary/10">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-foreground">{personalizationNote}</p>
          </div>
        )}

        {/* 아침/저녁 토글 */}
        <RoutineToggle
          activeTime={activeTime}
          onToggle={setActiveTime}
          morningStepCount={morningSteps.length}
          eveningStepCount={eveningSteps.length}
          className="mb-6"
        />

        {/* 타임라인 (수평 스크롤) */}
        <div className="mb-6 -mx-4 bg-card py-3 border-y border-border/50">
          <RoutineTimeline steps={currentSteps} currentStep={0} />
        </div>

        {/* 루틴 정보 */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="font-medium">
            {getTimeOfDayLabel(activeTime)} 루틴 • {currentSteps.length}단계
          </span>
          <span className="text-muted-foreground">예상 {formatDuration(currentEstimatedTime)}</span>
        </div>

        {/* 단계 목록 */}
        <RoutineStepList
          steps={currentSteps}
          showProducts={true}
          onProductClick={handleProductClick}
          className="mb-8"
        />

        {/* 하단 안내 */}
        <div className="text-center py-6 text-sm text-muted-foreground border-t border-border/50">
          <p className="mb-2">제품을 클릭하면 구매 페이지로 이동해요</p>
          <p className="flex items-center justify-center gap-1">
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            파트너사 링크를 통해 구매하시면 이룸에 도움이 돼요
          </p>
        </div>
      </div>
    </main>
  );
}
