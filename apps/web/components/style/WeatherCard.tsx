'use client';

/**
 * 날씨 정보 카드
 *
 * 현재 날씨 + 시간별 예보 표시
 */

import { Cloud, Droplets, Sun, Thermometer, Wind } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WeatherData, HourlyForecast } from '@/types/weather';
import { cn } from '@/lib/utils';

interface WeatherCardProps {
  weather: WeatherData;
  className?: string;
  compact?: boolean;
}

// 날씨 아이콘 코드에 따른 이모지/아이콘 매핑
function getWeatherIcon(iconCode: string): React.ReactNode {
  const isDay = iconCode.endsWith('d');

  if (iconCode.startsWith('01')) {
    return <Sun className={cn('h-6 w-6', isDay ? 'text-yellow-500' : 'text-gray-400')} />;
  }
  if (iconCode.startsWith('02') || iconCode.startsWith('03') || iconCode.startsWith('04')) {
    return <Cloud className="h-6 w-6 text-gray-400" />;
  }
  if (iconCode.startsWith('09') || iconCode.startsWith('10')) {
    return <Droplets className="h-6 w-6 text-blue-400" />;
  }
  if (iconCode.startsWith('11')) {
    return <Cloud className="h-6 w-6 text-purple-500" />;
  }
  if (iconCode.startsWith('13')) {
    return <Cloud className="h-6 w-6 text-blue-200" />;
  }

  return <Cloud className="h-6 w-6 text-gray-400" />;
}

// UV 지수에 따른 레벨
function getUVLevel(uvi: number): { label: string; color: string } {
  if (uvi <= 2) return { label: '낮음', color: 'bg-green-100 text-green-700' };
  if (uvi <= 5) return { label: '보통', color: 'bg-yellow-100 text-yellow-700' };
  if (uvi <= 7) return { label: '높음', color: 'bg-orange-100 text-orange-700' };
  if (uvi <= 10) return { label: '매우 높음', color: 'bg-red-100 text-red-700' };
  return { label: '위험', color: 'bg-purple-100 text-purple-700' };
}

export function WeatherCard({ weather, className, compact = false }: WeatherCardProps) {
  const { location, current, forecast } = weather;
  const uvLevel = getUVLevel(current.uvi);

  if (compact) {
    return (
      <Card data-testid="weather-card" className={cn('overflow-hidden', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-sky-100">
                {getWeatherIcon(current.icon)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{location}</p>
                <p className="text-2xl font-bold">{current.temp}°C</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{current.description}</p>
              <p className="text-sm">체감 {current.feelsLike}°C</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="weather-card" className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-sky-50 pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{location} 날씨</span>
          <Badge variant="outline" className="font-normal">
            {new Date().toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
              weekday: 'short',
            })}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {/* 현재 날씨 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-sky-100">
              {getWeatherIcon(current.icon)}
            </div>
            <div>
              <p className="text-3xl font-bold">{current.temp}°C</p>
              <p className="text-muted-foreground">{current.description}</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="flex items-center justify-end gap-1 text-muted-foreground">
              <Thermometer className="h-4 w-4" />
              체감 {current.feelsLike}°C
            </div>
            <div className="flex items-center justify-end gap-1 text-muted-foreground">
              <Droplets className="h-4 w-4" />
              습도 {current.humidity}%
            </div>
            <div className="flex items-center justify-end gap-1 text-muted-foreground">
              <Wind className="h-4 w-4" />
              풍속 {current.windSpeed}m/s
            </div>
          </div>
        </div>

        {/* 지표 배지 */}
        <div className="flex flex-wrap gap-2">
          {current.precipitation > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              강수 {current.precipitation}%
            </Badge>
          )}
          <Badge variant="secondary" className={uvLevel.color}>
            UV {uvLevel.label}
          </Badge>
        </div>

        {/* 시간별 예보 */}
        {forecast.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">시간별 예보</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {forecast.map((hour, index) => (
                <HourlyForecastItem key={index} forecast={hour} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HourlyForecastItem({ forecast }: { forecast: HourlyForecast }) {
  return (
    <div className="flex min-w-[60px] flex-col items-center gap-1 rounded-lg bg-muted/50 p-2 text-center">
      <span className="text-xs text-muted-foreground">{forecast.time}</span>
      <div className="flex h-6 w-6 items-center justify-center">
        {getWeatherIcon(forecast.icon)}
      </div>
      <span className="text-sm font-medium">{forecast.temp}°C</span>
      {forecast.precipitation > 0 && (
        <span className="text-xs text-blue-500">{forecast.precipitation}%</span>
      )}
    </div>
  );
}
