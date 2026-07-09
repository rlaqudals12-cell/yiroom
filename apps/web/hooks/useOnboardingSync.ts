'use client';

/**
 * 온보딩 데이터 Supabase 동기화 훅
 *
 * localStorage에 임시 저장된 온보딩 데이터를 Supabase로 동기화
 * - 로그인 상태일 때만 동기화
 * - 동기화 완료 후 localStorage 정리
 * - 기기 변경 시 데이터 유지 가능
 */

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

const ALLERGY_STORAGE_KEY = 'yiroom_onboarding_allergies';
const SYNC_FLAG_KEY = 'yiroom_onboarding_synced';

interface OnboardingAllergyData {
  allergies: string[];
  dislikedFoods: string[];
  savedAt: string;
}

/**
 * 온보딩 데이터를 Supabase user_preference_items 테이블에 동기화
 */
export function useOnboardingSync(): void {
  const { user, isSignedIn } = useUser();
  const supabase = useClerkSupabaseClient();
  const syncAttempted = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !user?.id || syncAttempted.current) return;
    syncAttempted.current = true;

    async function syncOnboardingData(): Promise<void> {
      try {
        // 이미 동기화된 경우 건너뛰기
        const alreadySynced = localStorage.getItem(SYNC_FLAG_KEY);
        if (alreadySynced === 'true') return;

        // localStorage에서 온보딩 데이터 읽기
        const rawData = localStorage.getItem(ALLERGY_STORAGE_KEY);
        if (!rawData) return;

        const data: OnboardingAllergyData = JSON.parse(rawData);
        if (!data.allergies?.length && !data.dislikedFoods?.length) return;

        // 도메인 선호/기피 = 전용 테이블 user_preference_items (쇼핑 설정 user_preferences와 분리)
        // avoid_level/avoid_reason은 유효 enum(AvoidLevel/AvoidReason)만 사용한다.
        const preferences = [
          // 알레르기 항목
          ...data.allergies.map((allergy) => ({
            clerk_user_id: user!.id,
            domain: 'nutrition' as const,
            item_type: 'food' as const,
            item_name: allergy,
            is_favorite: false,
            avoid_level: 'cannot' as const,
            avoid_reason: 'allergy',
            priority: 5,
            source: 'user',
          })),
          // 기피 음식 항목
          ...data.dislikedFoods.map((food) => ({
            clerk_user_id: user!.id,
            domain: 'nutrition' as const,
            item_type: 'food' as const,
            item_name: food,
            is_favorite: false,
            avoid_level: 'dislike' as const,
            avoid_reason: 'taste',
            priority: 3,
            source: 'user',
          })),
        ];

        if (preferences.length === 0) return;

        const { error } = await supabase.from('user_preference_items').upsert(preferences, {
          onConflict: 'clerk_user_id,domain,item_type,item_name',
          ignoreDuplicates: true,
        });

        if (error) {
          console.error('[OnboardingSync] Supabase upsert error:', error);
          return;
        }

        // 동기화 성공 → 플래그 설정
        localStorage.setItem(SYNC_FLAG_KEY, 'true');
      } catch (error) {
        console.error('[OnboardingSync] Sync error:', error);
      }
    }

    syncOnboardingData();
  }, [isSignedIn, user?.id, supabase, user]);
}
