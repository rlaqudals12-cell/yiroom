'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FlaskConical, Palette, Sparkles } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { FadeInUp } from '@/components/animations';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useUserMatching } from '@/hooks/useUserMatching';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BeautyRecommendTab } from '@/components/beauty/BeautyRecommendTab';
import BeautyCareTab from '@/components/beauty/BeautyCareTab';
// 트렌드 탭(BeautyTrendsTab): ADR-098 소셜 피드 게이팅 + 상품 DB 미적재로 임시 숨김. 데이터 채워지면 복원.
import type { RoutineItem } from '@/types/hybrid';

// 큐레이션 → 뷰티 카테고리 매핑
// 큐레이션은 lip/base/skincare를 사용하지만, /beauty는 스킨케어 계열만 카테고리가 있음.
// 매핑되지 않는 값(lip/base)은 'all' 그대로 두고 source=integrated 배너로 맥락 전달.
const CURATION_CATEGORY_MAP: Record<string, 'all' | 'cleansing' | 'skincare' | 'suncare' | 'mask'> =
  {
    skincare: 'skincare',
    cleansing: 'cleansing',
    suncare: 'suncare',
    mask: 'mask',
  };

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

/**
 * 뷰티 페이지 — 3탭 구조 (추천/케어/트렌드)
 * F1: 15개 섹션 → 3탭으로 분리, 각 탭 ≤ 7블록
 */
export default function BeautyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 통합 분석 큐레이션에서 왔는지, 어떤 카테고리로 요청됐는지 파악
  const curationSource = searchParams.get('source');
  const curationCategoryParam = searchParams.get('category');
  const initialMainCategory = curationCategoryParam
    ? (CURATION_CATEGORY_MAP[curationCategoryParam] ?? 'all')
    : 'all';
  const isFromIntegrated = curationSource === 'integrated';

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

  // 스킨케어 루틴 데이터
  const [morningRoutine] = useState<RoutineItem[]>([
    {
      order: 1,
      category: 'cleanser',
      productName: '젠틀 클렌저',
      timing: 'morning',
      duration: '1분',
    },
    {
      order: 2,
      category: 'toner',
      productName: '히알루론산 토너',
      timing: 'morning',
      duration: '30초',
    },
    {
      order: 3,
      category: 'serum',
      productName: '비타민C 세럼',
      timing: 'morning',
      duration: '30초',
    },
    {
      order: 4,
      category: 'moisturizer',
      productName: '수분 크림',
      timing: 'morning',
      duration: '30초',
    },
    {
      order: 5,
      category: 'sunscreen',
      productName: 'SPF50+ 선크림',
      timing: 'morning',
      duration: '30초',
    },
  ]);
  const [eveningRoutine] = useState<RoutineItem[]>([
    {
      order: 1,
      category: 'cleanser',
      productName: '클렌징 오일',
      timing: 'evening',
      duration: '2분',
    },
    {
      order: 2,
      category: 'cleanser',
      productName: '폼 클렌저',
      timing: 'evening',
      duration: '1분',
    },
    {
      order: 3,
      category: 'toner',
      productName: '각질 케어 토너',
      timing: 'evening',
      duration: '30초',
    },
    {
      order: 4,
      category: 'serum',
      productName: '레티놀 세럼',
      timing: 'evening',
      duration: '30초',
    },
    {
      order: 5,
      category: 'moisturizer',
      productName: '나이트 크림',
      timing: 'evening',
      duration: '30초',
    },
  ]);

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
                onClick={() => router.push('/profile/analysis')}
                className="text-sm text-primary hover:underline px-3 py-2.5 min-h-[44px] rounded-lg hover:bg-primary/5 transition-colors"
                aria-label="피부 프로필 수정"
              >
                수정
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
                  피부 분석하면 98% 맞춤 추천!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  내 피부에 딱 맞는 제품을 찾아드려요
                </p>
              </div>
              {/* F2: Primary CTA — 프로필 섹션 1개만 */}
              <button
                onClick={() => router.push('/onboarding/skin')}
                className="bg-primary text-primary-foreground px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                분석하기
              </button>
            </div>
          </section>
        </FadeInUp>
      )}

      {/* F1: 2탭 구조 — 추천/케어 (트렌드 탭은 ADR-098 게이팅으로 임시 숨김) */}
      <Tabs defaultValue="recommend" className="w-full">
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
            />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>

      <BottomNav />
    </div>
  );
}
