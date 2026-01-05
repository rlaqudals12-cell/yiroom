/**
 * 날씨 기반 코디 추천 API
 * POST /api/ai/weather-outfit
 *
 * 현재 날씨와 상황에 맞는 코디를 AI가 추천
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { recommendWeatherOutfit, type WeatherOutfitInput } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // 필수 필드 검증
    if (!body.weather || body.weather.temp === undefined || !body.occasion) {
      return NextResponse.json(
        { error: 'weather (with temp) and occasion are required' },
        { status: 400 }
      );
    }

    // occasion 유효성 검사
    const validOccasions = ['casual', 'work', 'date', 'outdoor', 'exercise'];
    if (!validOccasions.includes(body.occasion)) {
      return NextResponse.json(
        { error: `Invalid occasion. Must be one of: ${validOccasions.join(', ')}` },
        { status: 400 }
      );
    }

    const input: WeatherOutfitInput = {
      weather: {
        temp: body.weather.temp,
        condition: body.weather.condition || 'sunny',
        humidity: body.weather.humidity,
        wind: body.weather.wind,
      },
      occasion: body.occasion,
      personalColor: body.personalColor,
      bodyType: body.bodyType,
      preferences: body.preferences,
    };

    const result = await recommendWeatherOutfit(input);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[AI Weather Outfit API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
