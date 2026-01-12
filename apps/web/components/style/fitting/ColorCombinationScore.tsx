'use client';

/**
 * 색상 조합 점수 표시 컴포넌트
 */

import { Palette, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { evaluateColorCombination } from '@/lib/style/color-combination';
import type { ColorCombinationScoreProps } from '@/types/virtual-fitting';

export function ColorCombinationScore({
  colors,
  personalColor,
  className,
}: ColorCombinationScoreProps) {
  const result = evaluateColorCombination(personalColor, colors);

  return (
    <Card data-testid="color-combination-score" className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="h-5 w-5 text-purple-500" />
          색상 조합 평가
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {/* 점수 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">매칭 점수</span>
            <span className="text-2xl font-bold text-foreground">{result.score}점</span>
          </div>
          <Progress value={result.score} className="h-2" />
        </div>

        {/* 퍼스널 컬러 매칭 여부 */}
        {personalColor && (
          <div className="flex items-center gap-2">
            {result.personalColorMatch ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
            <Badge variant={result.personalColorMatch ? 'default' : 'secondary'}>
              {result.personalColorMatch ? '퍼스널 컬러 적합' : '퍼스널 컬러 부적합'}
            </Badge>
          </div>
        )}

        {/* 피드백 */}
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-sm text-foreground">{result.feedback}</p>
        </div>

        {/* 개선 제안 */}
        {result.suggestions.length > 0 && (
          <div className="space-y-2 rounded-lg bg-amber-50 p-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">개선 제안</span>
            </div>
            <ul className="space-y-1">
              {result.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-amber-800">
                  • {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 색상 미리보기 */}
        {colors.length > 0 && (
          <div>
            <span className="mb-2 block text-sm font-medium text-muted-foreground">
              조합된 색상
            </span>
            <div className="flex gap-2">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className="h-10 w-10 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
