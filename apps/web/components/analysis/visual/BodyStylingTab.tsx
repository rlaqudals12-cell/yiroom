'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { mapToClass } from '@/lib/utils/conditional-helpers';
import type { BodyType3 } from '@/lib/mock/body-analysis';
import { BODY_TYPES_3 } from '@/lib/mock/body-analysis';

// 체형별 색상 테마
const BODY_TYPE_THEMES: Record<BodyType3, { primary: string; bg: string; border: string }> = {
  S: {
    primary: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
  },
  W: {
    primary: 'text-pink-600',
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    border: 'border-pink-200 dark:border-pink-800',
  },
  N: {
    primary: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
  },
};

// 스타일 키워드 아이콘 매핑
const STYLE_ICONS: Record<string, string> = {
  심플: '✨',
  베이직: '📐',
  깔끔: '🎯',
  정장: '👔',
  페미닌: '🌸',
  하이웨이스트: '📏',
  프릴: '🎀',
  캐주얼: '👕',
  오버핏: '🧥',
  레이어드: '📚',
};

interface BodyStylingTabProps {
  /** 체형 타입 (3타입) */
  bodyType: BodyType3;
  /** 측정값 (어깨/허리/골반) */
  measurements?: Array<{ name: string; value: number }>;
  /** 퍼스널 컬러 시즌 */
  personalColorSeason?: string | null;
  /** 추가 클래스 */
  className?: string;
}

/**
 * C-1+ 체형 스타일링 시각화 탭
 * - 체형 실루엣 시각화
 * - 스타일 키워드 및 추천
 * - 측정값 그래프
 */
export default function BodyStylingTab({
  bodyType,
  measurements,
  personalColorSeason,
  className,
}: BodyStylingTabProps) {
  const [activeTab, setActiveTab] = useState<'silhouette' | 'style'>('silhouette');

  const typeInfo = BODY_TYPES_3[bodyType];
  const theme = BODY_TYPE_THEMES[bodyType];

  // 퍼스널 컬러 기반 추천 색상
  const seasonColors = useMemo(() => {
    if (!personalColorSeason) return null;
    const season = personalColorSeason.toLowerCase();
    const colorMap: Record<string, string[]> = {
      spring: ['#FF7F50', '#FFCBA4', '#FA8072', '#FFFFF0'],
      summer: ['#E6E6FA', '#FF007F', '#87CEEB', '#98FF98'],
      autumn: ['#E2725B', '#808000', '#FFDB58', '#800020'],
      winter: ['#FF00FF', '#4169E1', '#50C878', '#000000'],
    };
    return colorMap[season] || null;
  }, [personalColorSeason]);

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="body-styling-tab">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="text-xl">{typeInfo.emoji}</span>
          <span>{typeInfo.label} 스타일 가이드</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 탭 전환 */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'silhouette' | 'style')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="silhouette">체형 시각화</TabsTrigger>
            <TabsTrigger value="style">스타일 가이드</TabsTrigger>
          </TabsList>

          {/* 체형 실루엣 탭 */}
          <TabsContent value="silhouette" className="mt-4 space-y-4">
            {/* 체형 실루엣 SVG */}
            <div className={cn('relative rounded-2xl p-6', theme.bg, theme.border, 'border')}>
              <div className="flex items-center justify-center">
                <BodySilhouetteSVG bodyType={bodyType} />
              </div>
              <div className="text-center mt-4">
                <p className={cn('text-lg font-bold', theme.primary)}>{typeInfo.label}</p>
                <p className="text-sm text-muted-foreground">{typeInfo.labelEn}</p>
              </div>
            </div>

            {/* 측정값 바 그래프 */}
            {measurements && measurements.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">체형 비율</h4>
                {measurements.map((m) => (
                  <div key={m.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{m.name}</span>
                      <span className="font-medium">{m.value}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          mapToClass(bodyType, { S: 'bg-blue-500', W: 'bg-pink-500' }, 'bg-green-500')
                        )}
                        style={{ width: `${m.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 특징 요약 */}
            <div className={cn('p-4 rounded-xl', theme.bg)}>
              <p className="text-sm leading-relaxed">{typeInfo.characteristics}</p>
            </div>
          </TabsContent>

          {/* 스타일 가이드 탭 */}
          <TabsContent value="style" className="mt-4 space-y-4">
            {/* 스타일 키워드 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">스타일 키워드</h4>
              <div className="flex flex-wrap gap-2">
                {typeInfo.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium',
                      theme.bg,
                      theme.border,
                      'border'
                    )}
                  >
                    {STYLE_ICONS[keyword] || '•'} {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* 추천 아이템 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">추천 아이템</h4>
              <div className="grid gap-2">
                {typeInfo.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/50"
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center text-lg',
                        theme.bg
                      )}
                    >
                      {['👔', '👖', '👕', '🧥'][i % 4]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rec.item}</p>
                      <p className="text-xs text-muted-foreground">{rec.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 피해야 할 스타일 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-orange-600">피해야 할 스타일</h4>
              <div className="flex flex-wrap gap-2">
                {typeInfo.avoidStyles.map((style) => (
                  <span
                    key={style}
                    className="px-3 py-1.5 rounded-full text-sm bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800"
                  >
                    ✕ {style}
                  </span>
                ))}
              </div>
            </div>

            {/* 퍼스널 컬러 연동 색상 */}
            {seasonColors && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">추천 색상 (퍼스널 컬러 기반)</h4>
                <div className="flex gap-2">
                  {seasonColors.map((color) => (
                    <div
                      key={color}
                      className="w-12 h-12 rounded-xl border-2 border-white shadow-md"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/**
 * 체형별 실루엣 SVG 컴포넌트
 */
function BodySilhouetteSVG({ bodyType }: { bodyType: BodyType3 }) {
  // 체형별 SVG 경로 데이터
  const silhouettes: Record<BodyType3, { path: string; color: string }> = {
    // S (스트레이트): 직선적, 상체 볼륨
    S: {
      path: 'M50 15 C55 15 58 18 58 25 L58 28 C65 30 70 35 70 42 L70 55 C70 60 68 65 65 68 L65 85 C65 90 62 95 58 98 L58 130 C58 135 55 140 50 140 C45 140 42 135 42 130 L42 98 C38 95 35 90 35 85 L35 68 C32 65 30 60 30 55 L30 42 C30 35 35 30 42 28 L42 25 C42 18 45 15 50 15 Z',
      color: '#3B82F6', // blue
    },
    // W (웨이브): 곡선적, 하체 볼륨
    W: {
      path: 'M50 15 C55 15 57 18 57 25 L57 28 C62 30 65 35 65 42 L65 52 C65 58 63 62 60 65 L62 75 C68 80 72 88 70 95 L68 110 C66 120 60 130 55 135 L55 140 C55 142 52 145 50 145 C48 145 45 142 45 140 L45 135 C40 130 34 120 32 110 L30 95 C28 88 32 80 38 75 L40 65 C37 62 35 58 35 52 L35 42 C35 35 38 30 43 28 L43 25 C43 18 45 15 50 15 Z',
      color: '#EC4899', // pink
    },
    // N (내추럴): 골격감, 프레임 큼
    N: {
      path: 'M50 12 C56 12 60 16 60 24 L60 28 C70 32 75 38 75 48 L75 58 C75 65 72 70 68 73 L68 88 C68 95 65 102 60 108 L60 135 C60 140 56 145 50 145 C44 145 40 140 40 135 L40 108 C35 102 32 95 32 88 L32 73 C28 70 25 65 25 58 L25 48 C25 38 30 32 40 28 L40 24 C40 16 44 12 50 12 Z',
      color: '#22C55E', // green
    },
  };

  const { path, color } = silhouettes[bodyType];

  return (
    <svg viewBox="0 0 100 160" className="w-32 h-48" aria-label={`${bodyType} 체형 실루엣`}>
      <defs>
        <linearGradient id={`grad-${bodyType}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill={`url(#grad-${bodyType})`}
        stroke={color}
        strokeWidth="1.5"
        className="drop-shadow-md"
      />
      {/* 얼굴 원 */}
      <circle cx="50" cy="8" r="6" fill={color} opacity="0.6" />
    </svg>
  );
}
