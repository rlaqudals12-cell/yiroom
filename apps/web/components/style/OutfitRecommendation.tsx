'use client';

/**
 * 코디 추천 카드
 *
 * 레이어별 아이템 + 액세서리 + 색상 + 팁 표시
 */

import { Shirt, Footprints, Umbrella, Palette, Lightbulb, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { OutfitRecommendation as OutfitRecommendationType, LayerItem } from '@/types/weather';
import { cn } from '@/lib/utils';

interface OutfitRecommendationProps {
  recommendation: OutfitRecommendationType;
  className?: string;
  onProductClick?: (layer: LayerItem) => void;
}

// 레이어 타입별 아이콘
function getLayerIcon(type: LayerItem['type']): React.ReactNode {
  switch (type) {
    case 'outer':
      return <Shirt className="h-5 w-5" />;
    case 'top':
      return <Shirt className="h-5 w-5 rotate-180" />;
    case 'bottom':
      return <Shirt className="h-5 w-5" />;
    case 'shoes':
      return <Footprints className="h-5 w-5" />;
    default:
      return <Shirt className="h-5 w-5" />;
  }
}

// 레이어 타입 한글
function getLayerLabel(type: LayerItem['type']): string {
  switch (type) {
    case 'outer':
      return '아우터';
    case 'top':
      return '상의';
    case 'bottom':
      return '하의';
    case 'shoes':
      return '신발';
    default:
      return type;
  }
}

export function OutfitRecommendation({
  recommendation,
  className,
  onProductClick,
}: OutfitRecommendationProps) {
  const { layers, accessories, colors, materials, tips, weatherSummary } = recommendation;

  return (
    <Card data-testid="outfit-recommendation" className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          오늘의 코디 추천
        </CardTitle>
        {weatherSummary && (
          <p className="text-sm text-muted-foreground">{weatherSummary}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-5 p-4">
        {/* 레이어별 아이템 */}
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-medium">
            <Shirt className="h-4 w-4 text-muted-foreground" />
            레이어링 가이드
          </h4>
          <div className="space-y-2">
            {layers.map((layer, index) => (
              <LayerItemCard
                key={index}
                layer={layer}
                onClick={onProductClick ? () => onProductClick(layer) : undefined}
              />
            ))}
          </div>
        </div>

        {/* 액세서리 */}
        {accessories.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium">
              <Umbrella className="h-4 w-4 text-muted-foreground" />
              오늘 필요한 아이템
            </h4>
            <div className="flex flex-wrap gap-2">
              {accessories.map((item, index) => (
                <Badge key={index} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 추천 색상 */}
        {colors.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium">
              <Palette className="h-4 w-4 text-muted-foreground" />
              추천 색상
            </h4>
            <div className="flex flex-wrap gap-2">
              {colors.map((color, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-dashed"
                >
                  {color}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 추천 소재 */}
        {materials.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">추천 소재</h4>
            <p className="text-sm">{materials.join(', ')}</p>
          </div>
        )}

        {/* 스타일 팁 */}
        {tips.length > 0 && (
          <div className="space-y-2 rounded-lg bg-amber-50 p-3">
            <h4 className="flex items-center gap-2 text-sm font-medium text-amber-700">
              <Lightbulb className="h-4 w-4" />
              스타일 팁
            </h4>
            <ul className="space-y-1">
              {tips.map((tip, index) => (
                <li key={index} className="text-sm text-amber-800">
                  • {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LayerItemCard({
  layer,
  onClick,
}: {
  layer: LayerItem;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3',
        onClick && 'cursor-pointer transition-colors hover:bg-muted/50'
      )}
      onClick={onClick}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        {getLayerIcon(layer.type)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {getLayerLabel(layer.type)}
          </span>
        </div>
        <p className="font-medium">{layer.name}</p>
        <p className="text-xs text-muted-foreground">{layer.reason}</p>
      </div>
      {layer.productLink && (
        <Badge variant="outline" className="text-xs">
          제품 보기
        </Badge>
      )}
    </div>
  );
}
