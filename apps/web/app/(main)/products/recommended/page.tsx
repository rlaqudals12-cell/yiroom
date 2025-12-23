import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { Metadata } from 'next';
import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  getRecommendedCosmetics,
  getRecommendedSupplements,
  getRecommendedEquipment,
  getRecommendedHealthFoods,
} from '@/lib/products';
import { addMatchInfoToProducts } from '@/lib/products/matching';
import type { UserProfile } from '@/lib/products/matching';
import type { SkinType, SkinConcern, PersonalColorSeason } from '@/types/product';
import { ProductCard } from '@/components/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductGridSkeleton } from '@/components/products';

export const metadata: Metadata = {
  title: '맞춤 추천 | 이룸',
  description: '내 분석 결과를 기반으로 맞춤 제품을 추천받으세요.',
};

export default async function RecommendedProductsPage() {
  const { userId } = await auth();

  if (!userId) {
    return <NotLoggedInMessage />;
  }

  // 사용자 분석 데이터 조회
  const supabase = createClerkSupabaseClient();

  const [skinAnalysis, personalColorAssessment, workoutAnalysis, nutritionSettings] =
    await Promise.all([
      supabase
        .from('skin_analyses')
        .select('skin_type, top_concerns')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('personal_color_assessments')
        .select('season')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('workout_analyses')
        .select('workout_type')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('nutrition_settings')
        .select('goal')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  // 사용자 프로필 구성
  const userProfile: UserProfile = {
    skinType: skinAnalysis.data?.skin_type as SkinType | undefined,
    skinConcerns: skinAnalysis.data?.top_concerns as SkinConcern[] | undefined,
    personalColorSeason: personalColorAssessment.data?.season as PersonalColorSeason | undefined,
    workoutGoals: workoutAnalysis.data?.workout_type
      ? [workoutAnalysis.data.workout_type]
      : undefined,
    nutritionGoals: nutritionSettings.data?.goal
      ? [nutritionSettings.data.goal]
      : undefined,
  };

  const hasSkinAnalysis = !!skinAnalysis.data;
  const hasPersonalColor = !!personalColorAssessment.data;
  const hasWorkoutAnalysis = !!workoutAnalysis.data;
  const hasNutritionSettings = !!nutritionSettings.data;

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-primary" />
          맞춤 추천
        </h1>
        <p className="mt-2 text-muted-foreground">
          내 분석 결과를 기반으로 추천된 제품이에요
        </p>
      </header>

      <div className="space-y-10">
        {/* 섹션 1: 내 피부에 맞는 스킨케어 */}
        <Suspense fallback={<SectionSkeleton title="내 피부에 맞는 스킨케어" />}>
          {hasSkinAnalysis ? (
            <SkincareSection userProfile={userProfile} />
          ) : (
            <LockedSection
              title="내 피부에 맞는 스킨케어"
              description="피부 분석을 완료하면 맞춤 스킨케어를 추천받을 수 있어요"
              ctaHref="/analysis/skin"
              ctaLabel="피부 분석하기"
            />
          )}
        </Suspense>

        {/* 섹션 2: 내 퍼스널 컬러에 맞는 메이크업 */}
        <Suspense fallback={<SectionSkeleton title="내 퍼스널 컬러에 맞는 메이크업" />}>
          {hasPersonalColor ? (
            <MakeupSection userProfile={userProfile} />
          ) : (
            <LockedSection
              title="내 퍼스널 컬러에 맞는 메이크업"
              description="퍼스널컬러 진단을 완료하면 맞춤 메이크업을 추천받을 수 있어요"
              ctaHref="/analysis/personal-color"
              ctaLabel="퍼스널컬러 진단하기"
            />
          )}
        </Suspense>

        {/* 섹션 3: 운동 목표에 맞는 영양제 */}
        <Suspense fallback={<SectionSkeleton title="운동 목표에 맞는 영양제" />}>
          {hasWorkoutAnalysis || hasNutritionSettings ? (
            <SupplementSection userProfile={userProfile} />
          ) : (
            <LockedSection
              title="운동 목표에 맞는 영양제"
              description="운동 분석을 완료하면 맞춤 영양제를 추천받을 수 있어요"
              ctaHref="/workout/onboarding/step1"
              ctaLabel="운동 분석하기"
            />
          )}
        </Suspense>

        {/* 섹션 4: 운동 루틴에 필요한 기구 */}
        <Suspense fallback={<SectionSkeleton title="운동 루틴에 필요한 기구" />}>
          {hasWorkoutAnalysis ? (
            <EquipmentSection userProfile={userProfile} />
          ) : (
            <LockedSection
              title="운동 루틴에 필요한 기구"
              description="운동 분석을 완료하면 맞춤 운동 기구를 추천받을 수 있어요"
              ctaHref="/workout/onboarding/step1"
              ctaLabel="운동 분석하기"
            />
          )}
        </Suspense>

        {/* 섹션 5: 식단 목표에 맞는 건강식품 */}
        <Suspense fallback={<SectionSkeleton title="식단 목표에 맞는 건강식품" />}>
          {hasNutritionSettings ? (
            <HealthFoodSection userProfile={userProfile} />
          ) : (
            <LockedSection
              title="식단 목표에 맞는 건강식품"
              description="영양 설정을 완료하면 맞춤 건강식품을 추천받을 수 있어요"
              ctaHref="/nutrition"
              ctaLabel="영양 설정하기"
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}

/** 스킨케어 추천 섹션 */
async function SkincareSection({ userProfile }: { userProfile: UserProfile }) {
  const products = await getRecommendedCosmetics(
    userProfile.skinType!,
    userProfile.skinConcerns,
    undefined // 스킨케어에는 퍼스널컬러 안 씀
  );

  const withMatch = addMatchInfoToProducts(products, userProfile);

  return (
    <RecommendationSection
      title="내 피부에 맞는 스킨케어"
      products={withMatch.slice(0, 6)}
    />
  );
}

/** 메이크업 추천 섹션 */
async function MakeupSection({ userProfile }: { userProfile: UserProfile }) {
  const products = await getRecommendedCosmetics(
    userProfile.skinType || 'normal',
    undefined,
    userProfile.personalColorSeason
  );

  // 메이크업만 필터링
  const makeup = products.filter((p) => p.category === 'makeup');
  const withMatch = addMatchInfoToProducts(makeup, userProfile);

  return (
    <RecommendationSection
      title="내 퍼스널 컬러에 맞는 메이크업"
      products={withMatch.slice(0, 6)}
    />
  );
}

/** 영양제 추천 섹션 */
async function SupplementSection({ userProfile }: { userProfile: UserProfile }) {
  const concerns = userProfile.skinConcerns || [];
  const products = await getRecommendedSupplements(concerns, ['skin', 'energy', 'muscle']);

  const withMatch = addMatchInfoToProducts(products, userProfile);

  return (
    <RecommendationSection
      title="운동 목표에 맞는 영양제"
      products={withMatch.slice(0, 6)}
    />
  );
}

/** 운동 기구 추천 섹션 */
async function EquipmentSection({ userProfile }: { userProfile: UserProfile }) {
  const products = await getRecommendedEquipment(
    undefined,
    undefined,
    userProfile.skillLevel as 'beginner' | 'intermediate' | 'advanced' | undefined
  );

  const withMatch = addMatchInfoToProducts(products, userProfile);

  return (
    <RecommendationSection
      title="운동 루틴에 필요한 기구"
      products={withMatch.slice(0, 6)}
    />
  );
}

/** 건강식품 추천 섹션 */
async function HealthFoodSection({ userProfile }: { userProfile: UserProfile }) {
  const products = await getRecommendedHealthFoods(['muscle_gain', 'energy'], undefined);

  const withMatch = addMatchInfoToProducts(products, userProfile);

  return (
    <RecommendationSection
      title="식단 목표에 맞는 건강식품"
      products={withMatch.slice(0, 6)}
    />
  );
}

/** 추천 섹션 공통 컴포넌트 */
function RecommendationSection({
  title,
  products,
}: {
  title: string;
  products: Array<{ product: { id: string }; matchScore: number }>;
}) {
  if (products.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground">추천 제품이 없습니다.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {products.map(({ product, matchScore }) => (
          <div key={product.id} className="w-[180px] flex-shrink-0">
            <ProductCard
              product={product as Parameters<typeof ProductCard>[0]['product']}
              matchScore={matchScore}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/** 잠금 상태 섹션 */
function LockedSection({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Lock className="h-8 w-8 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">{description}</p>
          <Button asChild className="mt-4">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

/** 로그인 안 된 상태 메시지 */
function NotLoggedInMessage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="mx-auto max-w-md border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            로그인이 필요해요
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            맞춤 추천을 받으려면 로그인하고 분석을 완료해 주세요.
          </p>
          <Button asChild className="w-full">
            <Link href="/sign-in">로그인하기</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/** 섹션 로딩 스켈레톤 */
function SectionSkeleton({ title }: { title: string }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        <ProductGridSkeleton count={4} />
      </div>
    </section>
  );
}
