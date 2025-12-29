/**
 * 코디 추천 API
 * POST /api/style/recommend
 *
 * Body:
 * - weather: WeatherData (날씨 데이터)
 * - bodyType: string (체형 - S, W, N)
 * - personalColor: string (퍼스널컬러)
 * - occasion?: string (상황 - casual, formal, workout, date)
 *
 * GET /api/style/recommend
 * Query params:
 * - region: KoreaRegion
 * - bodyType: string
 * - personalColor: string
 * - occasion?: string
 */

import { NextResponse } from 'next/server';
import type { KoreaRegion, WeatherData, OutfitRecommendRequest } from '@/types/weather';
import { getWeatherByRegion, generateMockWeather } from '@/lib/style/weatherService';
import { recommendOutfit, adjustForOccasion } from '@/lib/style/outfitRecommender';

// 유효한 체형
const VALID_BODY_TYPES = ['S', 'W', 'N'];

// 유효한 상황
const VALID_OCCASIONS = ['casual', 'formal', 'workout', 'date'];

export async function POST(request: Request) {
  try {
    const body: OutfitRecommendRequest = await request.json();
    const { weather, bodyType, personalColor, occasion } = body;

    if (!weather || !weather.current) {
      return NextResponse.json(
        { error: 'Weather data is required' },
        { status: 400 }
      );
    }

    // 체형 검증
    const validBodyType = VALID_BODY_TYPES.includes(bodyType) ? bodyType : 'N';

    // 코디 추천 생성
    let recommendation = recommendOutfit(weather, validBodyType, personalColor || '');

    // 상황별 조정
    if (occasion && VALID_OCCASIONS.includes(occasion)) {
      recommendation = adjustForOccasion(
        recommendation,
        occasion as 'casual' | 'formal' | 'workout' | 'date'
      );
    }

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error('[Style Recommend API] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate outfit recommendation' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = (searchParams.get('region') || 'seoul') as KoreaRegion;
    const bodyType = searchParams.get('bodyType') || 'N';
    const personalColor = searchParams.get('personalColor') || '';
    const occasion = searchParams.get('occasion') || 'casual';

    // 날씨 데이터 가져오기
    let weather: WeatherData;
    try {
      weather = await getWeatherByRegion(region);
    } catch {
      weather = generateMockWeather(region);
    }

    // 체형 검증
    const validBodyType = VALID_BODY_TYPES.includes(bodyType) ? bodyType : 'N';

    // 코디 추천 생성
    let recommendation = recommendOutfit(weather, validBodyType, personalColor);

    // 상황별 조정
    if (VALID_OCCASIONS.includes(occasion)) {
      recommendation = adjustForOccasion(
        recommendation,
        occasion as 'casual' | 'formal' | 'workout' | 'date'
      );
    }

    return NextResponse.json({
      weather,
      recommendation,
    });
  } catch (error) {
    console.error('[Style Recommend API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate outfit recommendation' },
      { status: 500 }
    );
  }
}
