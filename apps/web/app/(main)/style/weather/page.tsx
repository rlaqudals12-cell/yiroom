'use client';

/**
 * 날씨 기반 코디 추천 페이지
 * /style/weather
 */

import { useState, useEffect, useCallback } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { WeatherCard } from '@/components/style/WeatherCard';
import { OutfitRecommendation } from '@/components/style/OutfitRecommendation';
import { LayeringGuide } from '@/components/style/LayeringGuide';
import type {
  KoreaRegion,
  WeatherData,
  OutfitRecommendation as OutfitRecommendationType,
} from '@/types/weather';

// 지역 옵션
const REGION_OPTIONS: { value: KoreaRegion; label: string }[] = [
  { value: 'seoul', label: '서울' },
  { value: 'busan', label: '부산' },
  { value: 'daegu', label: '대구' },
  { value: 'incheon', label: '인천' },
  { value: 'gwangju', label: '광주' },
  { value: 'daejeon', label: '대전' },
  { value: 'ulsan', label: '울산' },
  { value: 'sejong', label: '세종' },
  { value: 'gyeonggi', label: '경기' },
  { value: 'gangwon', label: '강원' },
  { value: 'chungbuk', label: '충북' },
  { value: 'chungnam', label: '충남' },
  { value: 'jeonbuk', label: '전북' },
  { value: 'jeonnam', label: '전남' },
  { value: 'gyeongbuk', label: '경북' },
  { value: 'gyeongnam', label: '경남' },
  { value: 'jeju', label: '제주' },
];

// 상황 옵션
const OCCASION_OPTIONS = [
  { value: 'casual', label: '일상' },
  { value: 'formal', label: '포멀' },
  { value: 'workout', label: '운동' },
  { value: 'date', label: '데이트' },
];

export default function WeatherOutfitPage() {
  const [region, setRegion] = useState<KoreaRegion>('seoul');
  const [occasion, setOccasion] = useState('casual');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [recommendation, setRecommendation] = useState<OutfitRecommendationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingLocation, setUsingLocation] = useState(false);

  // 데이터 조회
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `/api/style/recommend?region=${region}&occasion=${occasion}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch recommendation');
      }

      const data = await response.json();
      setWeather(data.weather);
      setRecommendation(data.recommendation);
    } catch (err) {
      console.error('[WeatherOutfit] Error:', err);
      setError('날씨 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [region, occasion]);

  // 초기 로드 및 지역/상황 변경 시
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 현재 위치 사용
  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    setUsingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          setLoading(true);
          const url = `/api/style/recommend?lat=${latitude}&lon=${longitude}&occasion=${occasion}`;
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error('Failed to fetch recommendation');
          }

          const data = await response.json();
          setWeather(data.weather);
          setRecommendation(data.recommendation);

          // 가장 가까운 지역으로 셀렉트 업데이트
          if (data.weather?.region) {
            setRegion(data.weather.region);
          }
        } catch (err) {
          console.error('[WeatherOutfit] Location error:', err);
          setError('위치 기반 날씨를 불러오는데 실패했습니다.');
        } finally {
          setLoading(false);
          setUsingLocation(false);
        }
      },
      (err) => {
        console.error('[WeatherOutfit] Geolocation error:', err);
        setError('위치 정보를 가져오는데 실패했습니다.');
        setUsingLocation(false);
      }
    );
  }, [occasion]);

  return (
    <div data-testid="weather-outfit-page" className="container max-w-lg space-y-4 py-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">오늘의 코디</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-2">
        {/* 지역 선택 */}
        <div className="flex items-center gap-2">
          <Select value={region} onValueChange={(v) => setRegion(v as KoreaRegion)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleUseLocation}
            disabled={usingLocation}
            title="현재 위치 사용"
          >
            <MapPin className={`h-4 w-4 ${usingLocation ? 'animate-pulse' : ''}`} />
          </Button>
        </div>

        {/* 상황 선택 */}
        <Select value={occasion} onValueChange={setOccasion}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OCCASION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-[180px] w-full rounded-lg" />
          <Skeleton className="h-[120px] w-full rounded-lg" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
      )}

      {/* 콘텐츠 */}
      {!loading && weather && recommendation && (
        <div className="space-y-4">
          {/* 날씨 카드 */}
          <WeatherCard weather={weather} />

          {/* 레이어링 가이드 */}
          <LayeringGuide feelsLike={weather.current.feelsLike} />

          {/* 코디 추천 */}
          <OutfitRecommendation recommendation={recommendation} />
        </div>
      )}
    </div>
  );
}
