'use client';

/**
 * K-2 스타일 갤러리 페이지
 *
 * @description 10개 스타일 카테고리별 Best 10 코디 탐색
 * @route /style/gallery
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md K-2
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';
import { StyleGallery } from '@/components/fashion/StyleGallery';
import type { StyleCategory, OutfitRecommendation } from '@/lib/fashion';
import type { PersonalColorSeason } from '@/lib/color-recommendations';

export default function StyleGalleryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  // URL에서 초기 카테고리 가져오기
  const initialCategory = (searchParams.get('style') as StyleCategory) || 'casual';

  // 사용자 퍼스널컬러 상태
  const [userPersonalColor, setUserPersonalColor] = useState<PersonalColorSeason | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // 사용자 퍼스널컬러 조회
  useEffect(() => {
    const fetchPersonalColor = async () => {
      if (!isLoaded || !user?.id) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('personal_color_assessments')
          .select('result_season')
          .eq('clerk_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.result_season) {
          setUserPersonalColor(data.result_season as PersonalColorSeason);
        }
      } catch (err) {
        console.error('[StyleGallery] Failed to fetch personal color:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchPersonalColor();
  }, [isLoaded, user?.id, supabase]);

  // 코디 선택 핸들러
  const handleOutfitSelect = (outfit: OutfitRecommendation) => {
    router.push(`/style/outfit/${outfit.id}`);
  };

  // 로딩 상태
  if (!isLoaded || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="style-gallery-page">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                스타일 갤러리
              </h1>
              <p className="text-xs text-muted-foreground">10가지 스타일의 Best 10 코디</p>
            </div>
          </div>
        </div>
      </header>

      {/* 퍼스널컬러 안내 (있는 경우) */}
      {userPersonalColor && (
        <div className="px-4 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">{userPersonalColor}</span>에 어울리는 코디에
            ✨ 표시됩니다
          </p>
        </div>
      )}

      {/* 스타일 갤러리 */}
      <div className="p-4">
        <StyleGallery
          userPersonalColor={userPersonalColor}
          initialCategory={initialCategory}
          onOutfitSelect={handleOutfitSelect}
        />
      </div>

      {/* 퍼스널컬러 분석 유도 (없는 경우) */}
      {!userPersonalColor && (
        <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200">
          <p className="font-medium">퍼스널컬러 분석하면 더 정확해요!</p>
          <p className="text-sm text-muted-foreground mt-1">
            내 피부톤에 맞는 코디를 추천받을 수 있어요
          </p>
          <Button
            onClick={() => router.push('/analysis/personal-color')}
            className="mt-3 w-full"
            variant="outline"
          >
            퍼스널컬러 분석하기
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
