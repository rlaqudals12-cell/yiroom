'use client';

import { useState, useEffect } from 'react';
import { Sun, Droplets, Cloud, Thermometer } from 'lucide-react';
import {
  getCurrentWeather,
  generateEnvironmentAdvice,
  type WeatherData,
  type EnvironmentAdvice,
} from '@/lib/weather';

/**
 * 환경 기반 웰니스 조언 카드
 *
 * 현재 날씨/UV/습도에 따른 피부/패션/영양/운동 크로스 조언 표시
 * 홈 페이지 또는 대시보드에서 사용
 *
 * @see docs/TODO.md 섹션 7 "환경 적응형"
 */
export function EnvironmentAdviceCard(): React.JSX.Element | null {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [advice, setAdvice] = useState<EnvironmentAdvice | null>(null);

  useEffect(() => {
    async function fetchWeather(): Promise<void> {
      const data = await getCurrentWeather();
      if (data) {
        setWeather(data);
        setAdvice(generateEnvironmentAdvice(data));
      }
    }
    fetchWeather();
  }, []);

  if (!weather || !advice) return null;

  // 가장 중요한 조언만 표시 (각 카테고리 첫 번째)
  const topAdvice = [
    advice.skin[0],
    advice.fashion[0],
    ...(advice.nutrition.length > 0 ? [advice.nutrition[0]] : []),
    ...(advice.exercise.length > 0 ? [advice.exercise[0]] : []),
  ].filter(Boolean);

  if (topAdvice.length <= 1) return null; // 기본 조언만이면 표시 안 함

  return (
    <div
      className="rounded-2xl border border-zinc-800 bg-neutral-900/50 p-4"
      data-testid="environment-advice-card"
    >
      {/* 헤더: 현재 날씨 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Thermometer className="h-3.5 w-3.5" />
          <span>{weather.temp}°C</span>
          <span className="text-zinc-600">·</span>
          <Droplets className="h-3.5 w-3.5" />
          <span>{weather.humidity}%</span>
          <span className="text-zinc-600">·</span>
          <Sun className="h-3.5 w-3.5" />
          <span>UV {weather.uvIndex}</span>
        </div>
        <span className="ml-auto text-[10px] text-zinc-600">{weather.condition}</span>
      </div>

      {/* 조언 목록 */}
      <div className="space-y-2">
        {topAdvice.map((tip, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
            <Cloud className="mt-0.5 h-3 w-3 shrink-0 text-pink-400" />
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
