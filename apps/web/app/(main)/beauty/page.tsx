'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { FlaskConical, Palette, Sparkles } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { FadeInUp } from '@/components/animations';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useUserMatching } from '@/hooks/useUserMatching';
import { useUrlTab } from '@/hooks/useUrlTab';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { generateRoutine } from '@/lib/skincare';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BeautyRecommendTab } from '@/components/beauty/BeautyRecommendTab';
import BeautyCareTab from '@/components/beauty/BeautyCareTab';
// 트렌드 탭(BeautyTrendsTab): ADR-098 소셜 피드 게이팅 + 상품 DB 미적재로 임시 숨김. 데이터 채워지면 복원.
import type { SkinAgeMetrics } from '@/components/beauty/SkinAgeCalculator';
import type { RoutineItem } from '@/types/hybrid';
import type { RoutineStep } from '@/types/skincare-routine';

// 큐레이션 → 뷰티 카테고리 매핑
// 추천 탭에 메이크업 대분류가 생겨(2026-07-08) 큐레이션의 lip/base도 메이크업으로 연결한다.
const CURATION_CATEGORY_MAP: Record<
  string,
  'all' | 'cleansing' | 'skincare' | 'suncare' | 'makeup' | 'mask'
> = {
  skincare: 'skincare',
  cleansing: 'cleansing',
  suncare: 'suncare',
  sunscreen: 'suncare',
  mask: 'mask',
  makeup: 'makeup',
  lip: 'makeup',
  base: 'makeup',
};

// NextStepsLinks의 ?filter= → 뷰티 대분류 (딥링크 착지 정밀화)
const FILTER_CATEGORY_MAP: Record<string, 'skincare' | 'makeup'> = {
  'personal-color': 'makeup',
  skin: 'skincare',
};

// 큐레이션 category=lip/base → 메이크업 세부 카테고리 프리셋
// ("코랄 립 보러가기"가 전체 목록 대신 립에 착지)
const CATEGORY_TO_SUBCATEGORY: Record<string, string> = {
  lip: 'lip',
  base: 'base',
  eye: 'eye',
  cheek: 'cheek',
};

// 톤(warm/cool) → 시즌 필터 (초기 개인색 필터 반영)
const TONE_TO_SEASONS: Record<string, Array<'Spring' | 'Summer' | 'Autumn' | 'Winter'>> = {
  warm: ['Spring', 'Autumn'],
  cool: ['Summer', 'Winter'],
};

// 탭 목록 — URL ?tab= 동기화용 (뒤로가기 시 탭 유지)
const BEAUTY_TABS = ['recommend', 'care'] as const;

// 피부 타입
type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';
const skinTypes: { id: SkinType; label: string }[] = [
  { id: 'dry', label: '건성' },
  { id: 'oily', label: '지성' },
  { id: 'combination', label: '복합성' },
  { id: 'sensitive', label: '민감성' },
  { id: 'normal', label: '중성' },
];

// 피부 고민
type SkinConcern =
  | 'hydration'
  | 'whitening'
  | 'pore'
  | 'soothing'
  | 'acne'
  | 'wrinkle'
  | 'elasticity';
const skinConcerns: { id: SkinConcern; label: string }[] = [
  { id: 'hydration', label: '보습' },
  { id: 'whitening', label: '미백' },
  { id: 'pore', label: '모공' },
  { id: 'soothing', label: '진정' },
  { id: 'acne', label: '여드름' },
  { id: 'wrinkle', label: '주름' },
  { id: 'elasticity', label: '탄력' },
];

// 루틴 엔진 스텝 → 케어 탭 표시용 RoutineItem 변환
function toRoutineItems(steps: RoutineStep[], timing: 'morning' | 'evening'): RoutineItem[] {
  return steps.map((step) => ({
    order: step.order,
    category: step.category,
    note: step.purpose,
    timing,
    duration: step.duration,
  }));
}

/**
 * 뷰티 페이지 — 3탭 구조 (추천/케어/트렌드)
 * F1: 15개 섹션 → 3탭으로 분리, 각 탭 ≤ 7블록
 */
export default function BeautyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  // 통합 분석 큐레이션에서 왔는지, 어떤 카테고리로 요청됐는지 파악
  const curationSource = searchParams.get('source');
  const curationCategoryParam = searchParams.get('category');
  const filterParam = searchParams.get('filter'); // NextStepsLinks (?filter=personal-color|skin)
  const toneParam = searchParams.get('tone'); // 큐레이션 (?tone=warm|cool)
  const focusParam = searchParams.get('focus'); // 큐레이션 스킨케어 focus / 세부 프리셋

  // 초기 대분류: category > filter 순으로 해석 (둘 다 없으면 전체)
  const resolveInitialMainCategory = ():
    | 'all'
    | 'cleansing'
    | 'skincare'
    | 'suncare'
    | 'makeup'
    | 'mask' => {
    if (curationCategoryParam) return CURATION_CATEGORY_MAP[curationCategoryParam] ?? 'all';
    if (filterParam) return FILTER_CATEGORY_MAP[filterParam] ?? 'all';
    return 'all';
  };
  const initialMainCategory = resolveInitialMainCategory();

  // 초기 세부 카테고리: category=lip/base → lip/base, 아니면 focus가 세부 id면 그것
  const initialSubCategory: string | null =
    (curationCategoryParam && CATEGORY_TO_SUBCATEGORY[curationCategoryParam]) ||
    (focusParam && CATEGORY_TO_SUBCATEGORY[focusParam]) ||
    null;

  // 초기 시즌 필터: tone=warm/cool → 해당 시즌들 (개인색 필터 반영)
  const initialSeasons = useMemo(
    () => (toneParam ? (TONE_TO_SEASONS[toneParam.toLowerCase()] ?? null) : null),
    [toneParam]
  );

  const isFromIntegrated = curationSource === 'integrated';

  // 탭 상태를 URL ?tab= 과 동기화 — 링크로 나갔다 뒤로가기 해도 탭 유지
  const [activeTab, setActiveTab] = useUrlTab(BEAUTY_TABS, 'recommend');

  // useUserMatching 훅으로 분석 결과 자동 로드
  const {
    skinType: userSkinTypeFromHook,
    skinConcerns: userSkinConcernsFromHook,
    personalColor,
    hasAnalysis,
    getMatchedProducts,
  } = useUserMatching();

  // 훅에서 받은 값을 SkinType으로 변환
  const userSkinType: SkinType = (userSkinTypeFromHook as SkinType) || 'combination';
  const userSkinConcerns: SkinConcern[] = useMemo(
    () => (userSkinConcernsFromHook as SkinConcern[]) || [],
    [userSkinConcernsFromHook]
  );

  // 스킨케어 루틴 — 정본 엔진(lib/skincare generateRoutine, 캡슐 데일리와 동일) 파생.
  // 하드코딩 제품명 루틴 대신 피부타입 기반 실제 루틴 스텝을 사용 (미분석 시 케어 탭이 CTA 표시)
  const { morningRoutine, eveningRoutine } = useMemo(() => {
    if (!hasAnalysis || !userSkinTypeFromHook) {
      return { morningRoutine: [] as RoutineItem[], eveningRoutine: [] as RoutineItem[] };
    }
    const morning = generateRoutine({
      skinType: userSkinType,
      concerns: [],
      timeOfDay: 'morning',
    });
    const evening = generateRoutine({
      skinType: userSkinType,
      concerns: [],
      timeOfDay: 'evening',
    });
    return {
      morningRoutine: toRoutineItems(morning.routine, 'morning'),
      eveningRoutine: toRoutineItems(evening.routine, 'evening'),
    };
  }, [hasAnalysis, userSkinTypeFromHook, userSkinType]);

  // 피부나이 계산용 실지표 — 최신 skin_analyses에서 로드.
  // 세부 지표가 일부 null이어도(통합 분석 경로 등) overall_score가 있으면
  // "종합 점수 기반 추정"으로 계산기를 제공한다 (둘 다 없으면 계산기 숨김).
  const [skinMetrics, setSkinMetrics] = useState<SkinAgeMetrics | null>(null);
  const [skinOverallScore, setSkinOverallScore] = useState<number | null>(null);
  const [skinAnalysisId, setSkinAnalysisId] = useState<string | null>(null);
  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    let cancelled = false;

    const loadSkinMetrics = async (): Promise<void> => {
      try {
        const { data } = await supabase
          .from('skin_analyses')
          .select('id, overall_score, hydration, oil_level, wrinkles, pores, pigmentation')
          .eq('clerk_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled || !data) return;

        setSkinAnalysisId(data.id ?? null);
        if (typeof data.overall_score === 'number') {
          setSkinOverallScore(data.overall_score);
        }

        const { hydration, oil_level, wrinkles, pores, pigmentation } = data;
        const values = [hydration, oil_level, wrinkles, pores, pigmentation];
        if (values.every((v) => typeof v === 'number')) {
          setSkinMetrics({
            hydration: hydration as number,
            oil: oil_level as number,
            wrinkles: wrinkles as number,
            pores: pores as number,
            pigmentation: pigmentation as number,
            // elasticity는 skin_analyses에 없는 지표 — 계산기에서 가중치 재분배로 처리
          });
        }
      } catch (err) {
        console.error('[Beauty] 피부 지표 로드 실패:', err);
      }
    };

    loadSkinMetrics();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id, supabase]);

  // 피부타입 한글 라벨
  const getSkinTypeLabel = (type: SkinType): string => {
    return skinTypes.find((t) => t.id === type)?.label || type;
  };

  // 피부고민 한글 라벨
  const getSkinConcernLabel = (concern: SkinConcern): string => {
    return skinConcerns.find((c) => c.id === concern)?.label || concern;
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="beauty-page">
      {/* F3: 시각적 위계 — h1 sr-only */}
      <h1 className="sr-only">뷰티 - 피부 맞춤 제품 추천</h1>

      {/* 통합 분석 큐레이션에서 진입한 경우 맥락 안내 */}
      {isFromIntegrated && (
        <div
          className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent border-b px-4 py-3"
          data-testid="beauty-integrated-banner"
          role="status"
        >
          <p className="text-sm text-foreground">
            <Sparkles className="w-4 h-4 inline mr-1 text-primary" aria-hidden="true" />
            통합 분석 결과를 바탕으로 추천하는 제품이에요
          </p>
        </div>
      )}

      {/* 프로필 섹션 — 항상 표시 (B1: data-testid, B2: 터치 타겟) */}
      {hasAnalysis ? (
        <FadeInUp>
          <section
            className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-900/20 px-4 py-4 border-b"
            aria-label="내 피부 프로필"
            data-testid="beauty-profile"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-pink-500" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-foreground">내 피부</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Palette className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
                    <span className="text-sm text-muted-foreground">{personalColor}</span>
                  </div>
                </div>
              </div>
              {/* B2: 터치 타겟 44px+ */}
              <button
                onClick={() => router.push('/analysis/integrated')}
                className="text-sm text-primary hover:underline px-3 py-2.5 min-h-[44px] rounded-lg hover:bg-primary/5 transition-colors"
                aria-label="내 분석 결과 보기"
              >
                분석 결과
              </button>
            </div>
            {/* AI 진단 결과: 피부타입 및 피부고민 */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-pink-200 dark:bg-pink-800/50 text-pink-800 dark:text-pink-200 px-2.5 py-1 rounded-full font-medium">
                {getSkinTypeLabel(userSkinType)}
              </span>
              {userSkinConcerns.map((concern) => (
                <span
                  key={concern}
                  className="text-xs bg-rose-100 dark:bg-rose-800/30 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-full"
                >
                  {getSkinConcernLabel(concern)}
                </span>
              ))}
            </div>
          </section>
        </FadeInUp>
      ) : (
        <FadeInUp>
          <section
            className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-900/20 px-4 py-4 border-b"
            data-testid="beauty-profile"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
                  분석하면 내 피부 기준으로 골라드려요
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  내 피부에 딱 맞는 제품을 찾아드려요
                </p>
              </div>
              {/* F2: Primary CTA — 프로필 섹션 1개만 */}
              <button
                onClick={() => router.push('/analysis/skin')}
                className="bg-primary text-primary-foreground px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                분석하기
              </button>
            </div>
          </section>
        </FadeInUp>
      )}

      {/* F1: 2탭 구조 — 추천/케어 (트렌드 탭은 ADR-098 게이팅으로 임시 숨김) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList
          className="grid w-full grid-cols-2 sticky top-0 z-10 bg-background border-b rounded-none h-12"
          aria-label="뷰티 카테고리"
        >
          <TabsTrigger
            value="recommend"
            data-testid="beauty-tab-recommend"
            className="min-h-[44px]"
          >
            추천
          </TabsTrigger>
          <TabsTrigger value="care" data-testid="beauty-tab-care" className="min-h-[44px]">
            케어
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommend">
          <ErrorBoundary>
            <BeautyRecommendTab
              hasAnalysis={hasAnalysis}
              userSkinType={userSkinType}
              userSkinConcerns={userSkinConcerns}
              personalColor={personalColor}
              getMatchedProducts={getMatchedProducts}
              initialMainCategory={initialMainCategory}
              initialSubCategory={initialSubCategory}
              initialSeasons={initialSeasons}
            />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="care">
          <ErrorBoundary>
            <BeautyCareTab
              hasAnalysis={hasAnalysis}
              router={router}
              morningRoutine={morningRoutine}
              eveningRoutine={eveningRoutine}
              skinMetrics={skinMetrics}
              skinOverallScore={skinOverallScore}
              skinAnalysisId={skinAnalysisId}
            />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>

      <BottomNav />
    </div>
  );
}
