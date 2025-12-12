/**
 * N-1 음식 검색 API (Task 2.12)
 *
 * GET /api/nutrition/foods/search?q=검색어&category=카테고리&trafficLight=신호등&limit=20
 *
 * 공용 foods 테이블에서 음식을 검색합니다.
 * - 인증 불필요 (공용 데이터)
 * - 한국어/영어 이름 모두 검색
 * - 한국 음식 우선 정렬
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// 유효한 카테고리 목록
const VALID_CATEGORIES = [
  'rice',      // 밥류
  'soup',      // 국/찌개
  'side',      // 반찬
  'meat',      // 고기
  'seafood',   // 해산물
  'noodle',    // 면류
  'bread',     // 빵/디저트
  'beverage',  // 음료
  'fruit',     // 과일
  'fastfood',  // 패스트푸드
];

// 유효한 신호등 색상
const VALID_TRAFFIC_LIGHTS = ['green', 'yellow', 'red'];

export async function GET(req: Request) {
  try {
    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();
    const category = searchParams.get('category');
    const trafficLight = searchParams.get('trafficLight');
    const limitParam = searchParams.get('limit');

    // 검색어 유효성 검사
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // limit 처리 (기본 20, 최대 50)
    let limit = 20;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 50);
      }
    }

    // 쿼리 빌드
    let dbQuery = supabase
      .from('foods')
      .select('*')
      .or(`name.ilike.%${query}%,name_en.ilike.%${query}%`);

    // 카테고리 필터 (유효한 경우에만)
    if (category && VALID_CATEGORIES.includes(category)) {
      dbQuery = dbQuery.eq('category', category);
    }

    // 신호등 필터 (유효한 경우에만)
    if (trafficLight && VALID_TRAFFIC_LIGHTS.includes(trafficLight)) {
      dbQuery = dbQuery.eq('traffic_light', trafficLight);
    }

    // 정렬 및 제한
    dbQuery = dbQuery
      .order('is_korean', { ascending: false }) // 한국 음식 우선
      .order('name', { ascending: true })
      .limit(limit);

    const { data: foods, error } = await dbQuery;

    if (error) {
      console.error('[N-1] Food search error:', error);
      return NextResponse.json(
        { error: 'Failed to search foods' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      foods: foods || [],
      count: foods?.length || 0,
      query,
    });
  } catch (error) {
    console.error('[N-1] Food search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
