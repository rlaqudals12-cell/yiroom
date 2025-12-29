'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import {
  calculateMatchScore,
  addMatchInfoToProducts,
  type UserProfile,
} from '@/lib/products/matching';
import type { AnyProduct, ProductWithMatch } from '@/types/product';

/**
 * 사용자 프로필 기반 제품 매칭 훅
 * - 사용자의 분석 결과(피부, 체형, 퍼스널컬러)를 조회
 * - 제품에 매칭 점수 계산
 * - 매칭률 필터링 지원
 */

interface UseUserMatchingResult {
  // 사용자 프로필
  profile: UserProfile | null;
  isLoading: boolean;
  hasAnalysis: boolean;

  // 분석 결과 요약
  skinType: string | null;
  skinConcerns: string[];
  personalColor: string | null;
  bodyType: string | null;

  // 매칭 함수
  calculateProductMatch: (product: AnyProduct) => number;
  getMatchedProducts: <T extends AnyProduct>(products: T[]) => ProductWithMatch<T>[];
  filterByMatchRate: <T extends AnyProduct>(
    products: ProductWithMatch<T>[],
    minRate: number
  ) => ProductWithMatch<T>[];
}

export function useUserMatching(): UseUserMatchingResult {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 분석 결과 요약 상태
  const [skinType, setSkinType] = useState<string | null>(null);
  const [skinConcerns, setSkinConcerns] = useState<string[]>([]);
  const [personalColor, setPersonalColor] = useState<string | null>(null);
  const [bodyType, setBodyType] = useState<string | null>(null);

  // 사용자 분석 데이터 로드
  useEffect(() => {
    async function loadUserProfile() {
      if (!isLoaded || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // 병렬로 모든 분석 데이터 조회
        const [skinResult, colorResult, bodyResult] = await Promise.all([
          // 피부 분석
          supabase
            .from('skin_assessments')
            .select('skin_type, concerns')
            .eq('clerk_user_id', user.id)
            .order('assessed_at', { ascending: false })
            .limit(1)
            .single(),

          // 퍼스널컬러 분석
          supabase
            .from('personal_color_assessments')
            .select('season')
            .eq('clerk_user_id', user.id)
            .order('assessed_at', { ascending: false })
            .limit(1)
            .single(),

          // 체형 분석
          supabase
            .from('body_assessments')
            .select('body_type')
            .eq('clerk_user_id', user.id)
            .order('assessed_at', { ascending: false })
            .limit(1)
            .single(),
        ]);

        // 프로필 구성
        const userProfile: UserProfile = {};

        if (skinResult.data) {
          userProfile.skinType = skinResult.data.skin_type;
          userProfile.skinConcerns = skinResult.data.concerns || [];
          setSkinType(skinResult.data.skin_type);
          setSkinConcerns(skinResult.data.concerns || []);
        }

        if (colorResult.data) {
          userProfile.personalColorSeason = colorResult.data.season;
          setPersonalColor(colorResult.data.season);
        }

        if (bodyResult.data) {
          setBodyType(bodyResult.data.body_type);
        }

        setProfile(userProfile);
      } catch (error) {
        console.error('[useUserMatching] Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserProfile();
  }, [isLoaded, user, supabase]);

  // 분석 완료 여부
  const hasAnalysis = useMemo(() => {
    return !!(skinType || personalColor || bodyType);
  }, [skinType, personalColor, bodyType]);

  // 단일 제품 매칭 점수 계산
  const calculateProductMatch = useCallback(
    (product: AnyProduct): number => {
      if (!profile) return 50; // 기본 점수
      return calculateMatchScore(product, profile).score;
    },
    [profile]
  );

  // 제품 목록에 매칭 정보 추가
  const getMatchedProducts = useCallback(
    <T extends AnyProduct>(products: T[]): ProductWithMatch<T>[] => {
      if (!profile) {
        // 프로필 없으면 기본 점수로 반환
        return products.map((product) => ({
          product,
          matchScore: 50,
          matchReasons: [],
        }));
      }
      return addMatchInfoToProducts(products, profile);
    },
    [profile]
  );

  // 매칭률로 필터링
  const filterByMatchRate = useCallback(
    <T extends AnyProduct>(
      products: ProductWithMatch<T>[],
      minRate: number
    ): ProductWithMatch<T>[] => {
      return products.filter((p) => p.matchScore >= minRate);
    },
    []
  );

  return {
    profile,
    isLoading,
    hasAnalysis,
    skinType,
    skinConcerns,
    personalColor,
    bodyType,
    calculateProductMatch,
    getMatchedProducts,
    filterByMatchRate,
  };
}

/**
 * 체형 기반 스타일 매칭 훅
 * - 체형 분석 결과 기반
 * - 퍼스널컬러 연동
 */
export function useStyleMatching() {
  const { bodyType, personalColor, hasAnalysis, isLoading } = useUserMatching();

  // 체형별 추천 스타일
  const recommendedStyles = useMemo(() => {
    if (!bodyType) return [];

    const styleMap: Record<string, string[]> = {
      웨이브: ['하이웨스트', '플레어', 'A라인', '크롭', '피트앤플레어'],
      스트레이트: ['H라인', '테일러드', '스트레이트', '미니멀', '정장'],
      내추럴: ['오버사이즈', '레이어드', '루즈핏', '캐주얼', '빈티지'],
    };

    return styleMap[bodyType] || [];
  }, [bodyType]);

  // 추천 컬러 팔레트
  const recommendedColors = useMemo(() => {
    if (!personalColor) return [];

    const colorMap: Record<string, Array<{ name: string; hex: string }>> = {
      '봄 웜톤': [
        { name: '코랄', hex: '#FF6B6B' },
        { name: '피치', hex: '#FFB4A2' },
        { name: '아이보리', hex: '#FFF8E7' },
        { name: '베이지', hex: '#D4A574' },
      ],
      '여름 쿨톤': [
        { name: '라벤더', hex: '#E6E6FA' },
        { name: '로즈', hex: '#FFB6C1' },
        { name: '스카이블루', hex: '#87CEEB' },
        { name: '그레이', hex: '#A9A9A9' },
      ],
      '가을 웜톤': [
        { name: '버건디', hex: '#800020' },
        { name: '머스타드', hex: '#FFDB58' },
        { name: '올리브', hex: '#808000' },
        { name: '브라운', hex: '#8B4513' },
      ],
      '겨울 쿨톤': [
        { name: '블랙', hex: '#000000' },
        { name: '화이트', hex: '#FFFFFF' },
        { name: '레드', hex: '#FF0000' },
        { name: '네이비', hex: '#000080' },
      ],
    };

    return colorMap[personalColor] || [];
  }, [personalColor]);

  return {
    bodyType,
    personalColor,
    hasAnalysis,
    isLoading,
    recommendedStyles,
    recommendedColors,
  };
}
