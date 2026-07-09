'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Package,
  ShieldAlert,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoutineStepList, RoutineToggle, RoutineTimeline } from '@/components/skin/routine';
import {
  generateRoutine,
  getSkinTypeLabel,
  getTimeOfDayLabel,
  enrichRoutineWithProducts,
} from '@/lib/skincare/routine';
import { generateRoutineFromShelf } from '@/lib/skincare';
import { formatDuration, calculateEstimatedTime } from '@/lib/mock/skincare-routine';
import type { TimeOfDay, RoutineStep, ProductCategory } from '@/types/skincare-routine';
import type { SkinTypeId, SkinConcernId } from '@/lib/mock/skin-analysis';
import type { ShelfItem } from '@/lib/scan/product-shelf';

// ADR-117: enrichRoutineWithProducts는 R1이 shelf 인자(4번째)를 신설 중.
// 시그니처 배포 전에도 shelf를 전달할 수 있도록 로컬 타입으로 브리지(배포 후에도 호환).
type EnrichWithShelfFn = (
  steps: RoutineStep[],
  skinType: SkinTypeId,
  concerns: SkinConcernId[],
  shelfItems?: ShelfItem[]
) => Promise<RoutineStep[]>;

// 화장대 궁합 안내용 카테고리 한글 라벨
const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cleanser: '클렌저',
  toner: '토너',
  essence: '에센스',
  serum: '세럼',
  ampoule: '앰플',
  cream: '크림',
  sunscreen: '선크림',
  mask: '마스크',
  eye_cream: '아이크림',
  oil: '페이스오일',
  spot_treatment: '스팟 트리트먼트',
};

// 피부 분석 결과 타입 (skin_analyses 실존 컬럼만 — concerns 컬럼은 존재하지 않음)
interface SkinAnalysisData {
  id: string;
  skin_type: SkinTypeId;
  hydration: number;
  oil_level: number;
  pores: number;
  pigmentation: number;
  wrinkles: number;
  sensitivity: number;
  created_at: string;
}

// 지표 점수 → 피부 고민 파생 (41 미만 = 케어 필요, 결과 페이지 warning 기준과 동일)
function deriveConcernsFromMetrics(data: SkinAnalysisData): SkinConcernId[] {
  const CONCERN_THRESHOLD = 40;
  const concerns: SkinConcernId[] = [];
  if (data.hydration <= CONCERN_THRESHOLD) concerns.push('dryness');
  if (data.oil_level <= CONCERN_THRESHOLD) concerns.push('excess_oil');
  if (data.pores <= CONCERN_THRESHOLD) concerns.push('pores');
  if (data.pigmentation <= CONCERN_THRESHOLD) concerns.push('pigmentation');
  if (data.wrinkles <= CONCERN_THRESHOLD) concerns.push('wrinkles');
  if (data.sensitivity <= CONCERN_THRESHOLD) concerns.push('sensitivity');
  return concerns;
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
  // 내 화장대(제품함) 보유 제품 — 루틴 배치·궁합 안내에 사용. 실패 시 빈 배열(카탈로그 폴백).
  const [shelfItems, setShelfItems] = useState<ShelfItem[]>([]);

  // 피부 분석 데이터 가져오기
  useEffect(() => {
    async function fetchSkinAnalysis() {
      if (!isLoaded || !isSignedIn) return;

      try {
        const { data, error: fetchError } = await supabase
          .from('skin_analyses')
          .select(
            'id, skin_type, hydration, oil_level, pores, pigmentation, wrinkles, sensitivity, created_at'
          )
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

  // 내 화장대(보유 제품) 1회 조회 — ShelfList와 동일한 /api/scan/shelf 패턴.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    async function loadShelf() {
      try {
        const res = await fetch('/api/scan/shelf?status=owned&limit=100');
        if (!res.ok) return; // 비로그인/오류 시 조용히 카탈로그 폴백
        const data = await res.json();
        if (!cancelled && Array.isArray(data.items)) {
          setShelfItems(data.items as ShelfItem[]);
        }
      } catch {
        /* 조회 실패 — shelf 미사용, 카탈로그 추천으로 폴백 */
      }
    }
    loadShelf();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  // 루틴 생성
  useEffect(() => {
    if (!skinData) return;

    const skinType = skinData.skin_type || 'normal';
    // 실측 지표에서 고민 파생 (DB에 concerns 컬럼 없음)
    const concerns = deriveConcernsFromMetrics(skinData);

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

    // 제품 연동 (비동기) — shelf 우선(보유 제품 배치), 없으면 카탈로그 추천.
    const enrich = enrichRoutineWithProducts as EnrichWithShelfFn;
    enrich(morningResult.routine, skinType, concerns, shelfItems)
      .then((enriched) => setMorningSteps(enriched))
      .catch((err) => console.error('[Routine] Morning products error:', err));

    enrich(eveningResult.routine, skinType, concerns, shelfItems)
      .then((enriched) => setEveningSteps(enriched))
      .catch((err) => console.error('[Routine] Evening products error:', err));
  }, [skinData, shelfItems]);

  // 현재 활성 루틴
  const currentSteps = useMemo(
    () => (activeTime === 'morning' ? morningSteps : eveningSteps),
    [activeTime, morningSteps, eveningSteps]
  );

  const currentEstimatedTime = useMemo(() => calculateEstimatedTime(currentSteps), [currentSteps]);

  // 내 화장대 궁합 — 보유 제품 2개 이상일 때만(1개 이하면 지어내지 않고 미렌더).
  // 현재 시간대(아침/저녁) 기준으로 성분 궁합·빈 필수 단계를 계산.
  const ownedCount = useMemo(
    () => shelfItems.filter((i) => i.status === 'owned').length,
    [shelfItems]
  );
  const shelfSync = useMemo(() => {
    if (ownedCount < 2 || !skinData) return null;
    const skinType = (skinData.skin_type || 'normal') as SkinTypeId;
    return generateRoutineFromShelf(shelfItems, skinType, activeTime);
  }, [ownedCount, shelfItems, skinData, activeTime]);

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
      <div className="min-h-[calc(100vh-80px)] bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">루틴을 준비하고 있어요...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 (분석 결과 없음)
  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-muted">
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
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted" data-testid="skincare-routine-page">
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

        {/* 내 화장대 궁합 — 보유 제품 2개 이상일 때만 노출 */}
        {shelfSync && (
          <section
            className="mb-6 rounded-xl border border-primary/10 bg-card p-4"
            data-testid="shelf-compatibility"
            aria-label="내 화장대 궁합"
          >
            <div className="mb-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-base font-semibold text-foreground">내 화장대 궁합</h2>
            </div>

            {/* 성분 충돌 — 사실 인용 톤 경고 */}
            {shelfSync.conflicts.length > 0 && (
              <div className="mb-3 space-y-2" data-testid="shelf-conflicts">
                {shelfSync.conflicts.map((c, i) => (
                  <div
                    key={`conflict-${i}`}
                    className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30"
                  >
                    <ShieldAlert
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400"
                      aria-hidden="true"
                    />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        {c.ingredients[0]} · {c.ingredients[1]} 함께 쓸 때 참고하세요
                      </p>
                      <p className="text-xs text-muted-foreground">{c.reason}</p>
                      <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                        {c.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 성분 시너지 */}
            {shelfSync.synergies.length > 0 && (
              <div className="mb-3 space-y-2" data-testid="shelf-synergies">
                {shelfSync.synergies.map((s, i) => (
                  <div
                    key={`synergy-${i}`}
                    className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30"
                  >
                    <Heart
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                    <div className="text-sm">
                      <p className="font-medium text-emerald-800 dark:text-emerald-200">
                        {s.ingredients[0]} · {s.ingredients[1]} 함께 쓰면 좋아요
                      </p>
                      <p className="text-xs text-muted-foreground">{s.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 빈 필수 단계 — 맞는 제품 보기 안내 */}
            {shelfSync.missingCategories.length > 0 && (
              <div className="space-y-1.5" data-testid="shelf-missing">
                {shelfSync.missingCategories.map((cat) => (
                  <Link
                    key={cat}
                    href="/beauty"
                    className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-3 text-sm transition-colors hover:bg-muted"
                    data-testid="shelf-missing-item"
                  >
                    <span className="text-foreground">
                      {getTimeOfDayLabel(activeTime)} 필수 단계 중 {CATEGORY_LABELS[cat]}이(가)
                      화장대에 없어요
                    </span>
                    <span className="flex flex-shrink-0 items-center gap-0.5 font-medium text-primary">
                      맞는 제품 보기
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* 충돌/시너지/빈 단계가 모두 없을 때 — 잘 갖춰졌다는 긍정 신호 */}
            {shelfSync.conflicts.length === 0 &&
              shelfSync.synergies.length === 0 &&
              shelfSync.missingCategories.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  보유 제품으로 {getTimeOfDayLabel(activeTime)} 필수 단계가 잘 갖춰져 있어요.
                </p>
              )}
          </section>
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
    </div>
  );
}
