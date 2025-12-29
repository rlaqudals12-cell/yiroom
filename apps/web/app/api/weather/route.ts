/**
 * 날씨 API
 * GET /api/weather
 *
 * Query params:
 * - region: KoreaRegion (지역 코드)
 * - lat, lon: number (위도/경도, region 없을 때 사용)
 */

import { NextResponse } from 'next/server';
import type { KoreaRegion } from '@/types/weather';
import {
  getWeatherByRegion,
  getWeatherByCoords,
  generateMockWeather,
} from '@/lib/style/weatherService';

// 유효한 지역 코드 목록
const VALID_REGIONS: KoreaRegion[] = [
  'seoul',
  'busan',
  'daegu',
  'incheon',
  'gwangju',
  'daejeon',
  'ulsan',
  'sejong',
  'gyeonggi',
  'gangwon',
  'chungbuk',
  'chungnam',
  'jeonbuk',
  'jeonnam',
  'gyeongbuk',
  'gyeongnam',
  'jeju',
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionParam = searchParams.get('region');
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');

    // 지역 코드로 조회
    if (regionParam) {
      if (!VALID_REGIONS.includes(regionParam as KoreaRegion)) {
        return NextResponse.json(
          {
            error: 'Invalid region',
            validRegions: VALID_REGIONS,
          },
          { status: 400 }
        );
      }

      const weather = await getWeatherByRegion(regionParam as KoreaRegion);
      return NextResponse.json(weather);
    }

    // 위도/경도로 조회
    if (latParam && lonParam) {
      const lat = parseFloat(latParam);
      const lon = parseFloat(lonParam);

      if (isNaN(lat) || isNaN(lon)) {
        return NextResponse.json(
          { error: 'Invalid coordinates. lat and lon must be numbers.' },
          { status: 400 }
        );
      }

      // 한국 범위 검증 (대략적)
      if (lat < 33 || lat > 39 || lon < 124 || lon > 132) {
        return NextResponse.json(
          { error: 'Coordinates must be within Korea.' },
          { status: 400 }
        );
      }

      const weather = await getWeatherByCoords(lat, lon);
      return NextResponse.json(weather);
    }

    // 파라미터 없으면 서울 기본값
    const weather = await getWeatherByRegion('seoul');
    return NextResponse.json(weather);
  } catch (error) {
    console.error('[Weather API] Error:', error);

    // API 에러 시 Mock 데이터 반환
    const mockWeather = generateMockWeather('seoul');
    return NextResponse.json({
      ...mockWeather,
      _fallback: true,
    });
  }
}
