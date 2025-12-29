'use client';

/**
 * 레이어링 가이드 컴포넌트
 *
 * 체감온도별 레이어 수 시각화
 */

import { Thermometer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TEMP_LAYERS, type TempLayerInfo } from '@/types/weather';
import { cn } from '@/lib/utils';

interface LayeringGuideProps {
  feelsLike: number;
  className?: string;
}

// 현재 온도 구간 찾기
function getCurrentLayer(feelsLike: number): { key: string; info: TempLayerInfo } {
  for (const [key, info] of Object.entries(TEMP_LAYERS)) {
    if (feelsLike > info.min && feelsLike <= info.max) {
      return { key, info };
    }
  }
  return { key: 'mild', info: TEMP_LAYERS.mild };
}

// 온도 구간 한글
const TEMP_LABELS: Record<string, string> = {
  extreme_cold: '한파',
  very_cold: '매우 추움',
  cold: '추움',
  cool: '쌀쌀함',
  mild: '선선함',
  warm: '따뜻함',
  hot: '더움',
};

// 레이어 수에 따른 색상
function getLayerColor(layers: number): string {
  if (layers >= 3) return 'from-blue-500 to-indigo-600';
  if (layers >= 2) return 'from-cyan-500 to-blue-500';
  if (layers >= 1) return 'from-green-400 to-cyan-500';
  return 'from-yellow-400 to-orange-500';
}

export function LayeringGuide({ feelsLike, className }: LayeringGuideProps) {
  const { key, info } = getCurrentLayer(feelsLike);
  const layerPercent = Math.min((info.layers / 4) * 100, 100);

  return (
    <Card data-testid="layering-guide" className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-muted-foreground" />
            레이어링 가이드
          </span>
          <Badge variant="outline">{TEMP_LABELS[key]}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 현재 체감온도 */}
        <div className="text-center">
          <p className="text-4xl font-bold">{feelsLike}°C</p>
          <p className="text-sm text-muted-foreground">체감온도</p>
        </div>

        {/* 레이어 프로그레스 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">레이어 수</span>
            <span className="font-medium">
              {info.layers >= 1 ? `${Math.floor(info.layers)}겹` : '최소'}
            </span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full bg-gradient-to-r transition-all',
                getLayerColor(info.layers)
              )}
              style={{ width: `${layerPercent}%` }}
            />
          </div>
        </div>

        {/* 추천 레이어링 */}
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-sm font-medium">{info.description}</p>
        </div>

        {/* 온도 구간 범례 */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>❄️ -5°C 이하: 4겹</span>
            <span>🥶 -5~5°C: 3겹</span>
          </div>
          <div className="flex justify-between">
            <span>🧥 5~12°C: 2겹</span>
            <span>🧣 12~18°C: 1.5겹</span>
          </div>
          <div className="flex justify-between">
            <span>👕 18~23°C: 1겹</span>
            <span>☀️ 23°C+: 얇게</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
