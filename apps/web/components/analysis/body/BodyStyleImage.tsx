'use client';

import { cn } from '@/lib/utils';
import { type BodyType3 } from '@/lib/mock/body-analysis';
import { Sparkles, Heart, Crown, Shirt, Wind, Layers } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

/**
 * 체형 타입별 추천 스타일 데이터
 * - 각 체형(S/W/N)별 3가지 추천 스타일
 * - 이미지 대신 아이콘 + 키 아이템으로 시각화
 */
const STYLE_DATA: Record<
  BodyType3,
  Array<{
    style: string;
    icon: LucideIcon;
    description: string;
    keyItems: string[];
  }>
> = {
  S: [
    {
      style: '포멀',
      icon: Crown,
      description: '깔끔한 I라인 실루엣',
      keyItems: ['테일러드 재킷', '슬림핏 슬랙스'],
    },
    {
      style: '캐주얼',
      icon: Shirt,
      description: '심플하고 단정한 룩',
      keyItems: ['V넥 니트', '스트레이트 진'],
    },
    {
      style: '미니멀',
      icon: Sparkles,
      description: '절제된 모던 스타일',
      keyItems: ['베이직 셔츠', '미디 스커트'],
    },
  ],
  W: [
    {
      style: '페미닌',
      icon: Heart,
      description: '부드러운 X라인 실루엣',
      keyItems: ['페플럼 블라우스', 'A라인 스커트'],
    },
    {
      style: '로맨틱',
      icon: Sparkles,
      description: '우아한 곡선 강조',
      keyItems: ['프릴 원피스', '하이웨이스트 팬츠'],
    },
    {
      style: '엘레강스',
      icon: Crown,
      description: '세련된 여성스러움',
      keyItems: ['랩 원피스', '니트 카디건'],
    },
  ],
  N: [
    {
      style: '캐주얼',
      icon: Shirt,
      description: '편안한 오버핏 룩',
      keyItems: ['오버사이즈 셔츠', '와이드 팬츠'],
    },
    {
      style: '릴렉스드',
      icon: Wind,
      description: '자연스러운 여유 있는 핏',
      keyItems: ['루즈핏 니트', '배기 팬츠'],
    },
    {
      style: '오버사이즈',
      icon: Layers,
      description: '레이어드 스타일링',
      keyItems: ['롱 코트', '맥시 스커트'],
    },
  ],
};

// 체형별 테마 색상 (다크모드 포함)
const BODY_TYPE_THEMES: Record<
  BodyType3,
  {
    gradient: string;
    border: string;
    iconBg: string;
    iconColor: string;
    tagBg: string;
    tagText: string;
  }
> = {
  S: {
    gradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30',
    border: 'border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    tagBg: 'bg-blue-100/80 dark:bg-blue-900/40',
    tagText: 'text-blue-700 dark:text-blue-300',
  },
  W: {
    gradient: 'from-pink-50 to-rose-50 dark:from-pink-950/40 dark:to-rose-950/30',
    border: 'border-pink-200 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600',
    iconBg: 'bg-pink-100 dark:bg-pink-900/50',
    iconColor: 'text-pink-600 dark:text-pink-400',
    tagBg: 'bg-pink-100/80 dark:bg-pink-900/40',
    tagText: 'text-pink-700 dark:text-pink-300',
  },
  N: {
    gradient: 'from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/30',
    border:
      'border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600',
    iconBg: 'bg-green-100 dark:bg-green-900/50',
    iconColor: 'text-green-600 dark:text-green-400',
    tagBg: 'bg-green-100/80 dark:bg-green-900/40',
    tagText: 'text-green-700 dark:text-green-300',
  },
};

interface BodyStyleImageProps {
  bodyType: BodyType3;
  className?: string;
  showLabels?: boolean;
  onImageClick?: (index: number) => void;
}

/**
 * 체형별 추천 스타일 카드 컴포넌트
 * - 체형별 3가지 추천 스타일을 카드로 표시
 * - 아이콘 + 스타일명 + 키 아이템으로 시각화
 * - 다크모드 완벽 지원
 */
export function BodyStyleImage({
  bodyType,
  className,
  showLabels = true,
  onImageClick,
}: BodyStyleImageProps) {
  const styles = STYLE_DATA[bodyType];
  const theme = BODY_TYPE_THEMES[bodyType];

  return (
    <div className={cn('grid grid-cols-3 gap-3', className)} data-testid="body-style-image">
      {styles.map((styleInfo, index) => {
        const IconComponent = styleInfo.icon;

        return (
          <div
            key={index}
            className={cn(
              'relative rounded-xl overflow-hidden border-2 transition-all',
              'bg-gradient-to-b',
              theme.gradient,
              theme.border,
              onImageClick && 'cursor-pointer'
            )}
            onClick={() => onImageClick?.(index)}
            role={onImageClick ? 'button' : undefined}
            tabIndex={onImageClick ? 0 : undefined}
            aria-label={`${styleInfo.style} 스타일 - ${styleInfo.description}`}
            onKeyDown={(e) => {
              if (onImageClick && (e.key === 'Enter' || e.key === ' ')) {
                onImageClick(index);
              }
            }}
          >
            <div className="flex flex-col items-center p-3 py-4 gap-2">
              {/* 아이콘 */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  theme.iconBg
                )}
              >
                <IconComponent className={cn('w-5 h-5', theme.iconColor)} />
              </div>

              {/* 스타일명 */}
              {showLabels && (
                <span className={cn('text-sm font-semibold', theme.iconColor)}>
                  {styleInfo.style}
                </span>
              )}

              {/* 설명 */}
              <p className="text-[10px] text-muted-foreground text-center leading-tight">
                {styleInfo.description}
              </p>

              {/* 키 아이템 태그 */}
              <div className="flex flex-col gap-1 w-full mt-1">
                {styleInfo.keyItems.map((item) => (
                  <span
                    key={item}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full text-center truncate',
                      theme.tagBg,
                      theme.tagText
                    )}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BodyStyleImage;
