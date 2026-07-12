'use client';

/**
 * 날씨 기반 코디 추천 페이지
 * /style/weather
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
  // 위치 사용 상태 — 위치정보보호법: 브라우저 권한 프롬프트만으로는 부족하다.
  // 앱 내 명시적 동의(버튼) 후에만 좌표를 날씨 조회에 '일시' 사용하고, 좌표는 저장하지 않는다.
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'loading' | 'active' | 'unavailable'
  >('idle');

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
      setError('날씨 정보를 불러오는 데 실패했어요.');
    } finally {
      setLoading(false);
    }
  }, [region, occasion]);

  // 초기 로드 및 지역/상황 변경 시 — 지역(폴백) 기준으로 시작한다.
  // 위치정보보호법: 페이지 로드만으로 위치를 요청하지 않는다(과거엔 위치 버튼이 목적 고지 없이 GPS를 요청했음).
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 위치 기반 날씨 로드 — 앱 내 명시적 동의 이후에만 호출한다.
  // 좌표는 이 1회 조회에만 사용하고 저장하지 않는다(동의 플래그만 저장).
  const loadWeatherFromLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('이 브라우저에서는 위치 서비스를 지원하지 않아요.');
      setLocationStatus('unavailable');
      return;
    }

    setLocationStatus('loading');

    // eslint-disable-next-line sonarjs/no-intrusive-permissions -- 앱 내 명시적 동의 후에만 호출, 좌표는 이 1회 조회에만 사용하고 저장하지 않음
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          setLoading(true);
          setError(null);
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
          setLocationStatus('active');
        } catch (err) {
          console.error('[WeatherOutfit] Location error:', err);
          setError('위치 기반 날씨를 불러오는 데 실패했어요.');
          setLocationStatus('unavailable');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        // 권한 거부/실패 → 지역 기준 추정 유지(계속 사용 가능)
        console.error('[WeatherOutfit] Geolocation error:', err);
        setLocationStatus('unavailable');
      }
    );
  }, [occasion]);

  // 위치 사용 동의 — 명시적 사용자 액션. 동의 플래그만 저장하고 좌표는 저장하지 않는다.
  const handleUseLocation = useCallback(() => {
    try {
      localStorage.setItem('location_consent', 'granted');
    } catch {
      /* 스토리지 비활성(사생활 모드 등) — 이번 세션에만 위치 사용 */
    }
    loadWeatherFromLocation();
  }, [loadWeatherFromLocation]);

  // 재방문 자동 반영 — 마운트만으로 위치를 요청하지 않되, 이전에 앱 내 동의한 사용자는
  // 다시 묻지 않고 자동 반영한다(좌표 미저장, 동의 플래그만 저장). ref로 1회만 실행해
  // occasion 변경으로 GPS를 반복 요청하지 않는다.
  const autoLoadedRef = useRef(false);
  useEffect(() => {
    if (autoLoadedRef.current) return;
    if (typeof window !== 'undefined' && localStorage.getItem('location_consent') === 'granted') {
      autoLoadedRef.current = true;
      loadWeatherFromLocation();
    }
  }, [loadWeatherFromLocation]);

  return (
    <div data-testid="weather-outfit-page" className="container max-w-lg space-y-4 py-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">오늘의 코디</h1>
        <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* 필터 — 지역/상황(폴백 기준) */}
      <div className="flex flex-wrap gap-2">
        {/* 지역 선택 */}
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

      {/* 위치 사용 동의 — 위치정보보호법: 브라우저 권한만으로는 부족, 앱 내 목적 고지·명시적 동의 필요.
          위치가 반영되기 전(동의 전/실패)에만 노출한다. 좌표는 저장하지 않는다. */}
      {locationStatus !== 'active' && (
        <div
          className="rounded-lg border border-dashed border-border bg-muted/30 p-3"
          data-testid="location-consent"
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            날씨 기반 조언을 위해 현재 위치를 일시적으로 사용해요. 저장하지 않아요.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-8 text-xs"
            onClick={handleUseLocation}
            disabled={locationStatus === 'loading'}
            data-testid="location-consent-button"
          >
            <MapPin className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {locationStatus === 'loading' ? '위치 확인 중...' : '현재 위치로 날씨 반영하기'}
          </Button>
          {locationStatus === 'unavailable' && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              위치를 사용할 수 없어 지역 기준으로 안내했어요.
            </p>
          )}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
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
