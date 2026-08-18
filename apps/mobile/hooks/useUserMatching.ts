'use client';

import { useAuth, useUser } from '@clerk/clerk-expo';
import { useState, useEffect, useMemo, useCallback } from 'react';

import { getLatestAnalysisDetails } from '@/lib/api/analysis-history';
import {
  calculateMatchScore,
  addMatchInfoToProducts,
  type UserProfile,
} from '@/lib/products/matching';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import type {
  AnyProduct,
  PersonalColorSeason,
  ProductWithMatch,
  SkinConcern,
  SkinType,
} from '@/types/product';

const SKIN_TYPES: SkinType[] = ['dry', 'oily', 'combination', 'sensitive', 'normal'];
const PERSONAL_COLOR_SEASONS: PersonalColorSeason[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

function toSkinType(value: unknown): SkinType | null {
  return typeof value === 'string' && SKIN_TYPES.includes(value as SkinType)
    ? (value as SkinType)
    : null;
}

function toPersonalColorSeason(value: unknown): PersonalColorSeason | null {
  if (typeof value !== 'string') return null;
  const normalized = `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}`;
  return PERSONAL_COLOR_SEASONS.includes(normalized as PersonalColorSeason)
    ? (normalized as PersonalColorSeason)
    : null;
}

/**
 * 사용자 프로필 기반 제품 매칭 훅
 * - 사용자의 분석 결과(피부, 체형, 퍼스널컬러, 헤어, 메이크업)를 조회
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
  hairType: string | null;
  undertone: string | null;
  workoutGoal: string | null;
  nutritionGoal: string | null;

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
  const { getToken } = useAuth();
  const supabase = useClerkSupabaseClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 분석 결과 요약 상태
  const [skinType, setSkinType] = useState<string | null>(null);
  const [skinConcerns, setSkinConcerns] = useState<string[]>([]);
  const [personalColor, setPersonalColor] = useState<string | null>(null);
  const [bodyType, setBodyType] = useState<string | null>(null);
  const [hairType, setHairType] = useState<string | null>(null);
  const [undertone, setUndertone] = useState<string | null>(null);
  const [workoutGoal, setWorkoutGoal] = useState<string | null>(null);
  const [nutritionGoal, setNutritionGoal] = useState<string | null>(null);

  // 사용자 분석 데이터 로드
  useEffect(() => {
    async function loadUserProfile(): Promise<void> {
      if (!isLoaded || !user) {
        setIsLoading(false);
        return;
      }

      try {
        const token = await getToken();
        if (!token) throw new Error('로그인이 필요합니다.');
        // 병렬로 모든 분석 데이터 조회 — 하나 실패해도 나머지는 사용
        const results = await Promise.allSettled([
          getLatestAnalysisDetails(token, 'skin').then((details) => {
            const skinType = toSkinType(details?.skinType);
            return {
              data: skinType ? { skin_type: skinType, concerns: [] as SkinConcern[] } : null,
            };
          }),
          getLatestAnalysisDetails(token, 'personal-color').then((details) => {
            const season = toPersonalColorSeason(details?.season);
            return { data: season ? { season } : null };
          }),
          getLatestAnalysisDetails(token, 'body').then((details) => ({
            data: details ? { body_type: String(details.bodyType ?? '') } : null,
          })),

          // H-1 헤어 분석
          supabase
            .from('hair_analyses')
            .select('hair_type, scalp_type, concerns')
            .eq('clerk_user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),

          // M-1 메이크업 분석
          supabase
            .from('makeup_analyses')
            .select('undertone, face_shape')
            .eq('clerk_user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),

          // W-1 운동 분석
          supabase
            .from('workout_analyses')
            .select('goal, workout_type')
            .eq('clerk_user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),

          // N-1 영양 설정
          supabase
            .from('nutrition_settings')
            .select('goal')
            .eq('clerk_user_id', user.id)
            .maybeSingle(),
        ]);

        // 개별 결과 추출 — rejected된 쿼리는 null로 처리
        const settled = <T>(r: PromiseSettledResult<T>): T => {
          if (r.status === 'fulfilled') return r.value;
          console.warn('[useUserMatching] 쿼리 실패 (부분 로딩 계속):', r.reason);
          return { data: null, error: null } as T;
        };
        const skinResult = settled(results[0]);
        const colorResult = settled(results[1]);
        const bodyResult = settled(results[2]);
        const hairResult = settled(results[3]);
        const makeupResult = settled(results[4]);
        const workoutResult = settled(results[5]);
        const nutritionResult = settled(results[6]);

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

        // H-1 헤어 데이터 매핑
        if (hairResult.data) {
          userProfile.hairType = hairResult.data.hair_type;
          userProfile.scalpType = hairResult.data.scalp_type;
          userProfile.hairConcerns = hairResult.data.concerns || [];
          setHairType(hairResult.data.hair_type);
        }

        // M-1 메이크업 데이터 매핑
        if (makeupResult.data) {
          userProfile.undertone = makeupResult.data.undertone;
          userProfile.faceShape = makeupResult.data.face_shape;
          setUndertone(makeupResult.data.undertone);
        }

        // W-1 운동 데이터 매핑
        if (workoutResult.data) {
          userProfile.workoutGoals = workoutResult.data.goal ? [workoutResult.data.goal] : [];
          setWorkoutGoal(workoutResult.data.goal);
        }

        // N-1 영양 데이터 매핑
        if (nutritionResult.data) {
          userProfile.nutritionGoals = nutritionResult.data.goal ? [nutritionResult.data.goal] : [];
          setNutritionGoal(nutritionResult.data.goal);
        }

        setProfile(userProfile);
      } catch (error) {
        console.error('[useUserMatching] Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserProfile();
  }, [isLoaded, user, getToken, supabase]);

  // 분석 완료 여부
  const hasAnalysis = useMemo(() => {
    return !!(skinType || personalColor || bodyType || hairType || undertone);
  }, [skinType, personalColor, bodyType, hairType, undertone]);

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
    hairType,
    undertone,
    workoutGoal,
    nutritionGoal,
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

    const colorMap: Record<string, { name: string; hex: string }[]> = {
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
