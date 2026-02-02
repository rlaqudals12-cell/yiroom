/**
 * K-3 BMI 계산기 컴포넌트
 *
 * @description 아시아 기준 BMI 계산 및 결과 표시
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md
 */
'use client';

import { useState, useCallback } from 'react';
import { Scale, Ruler, Info, TrendingDown, TrendingUp, Minus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { calculateBMI, type BMIResult, type BMICategory } from '@/lib/body/bmi-calculator';

interface BmiCalculatorProps {
  onResult?: (result: BMIResult) => void;
  initialHeight?: number;
  initialWeight?: number;
  className?: string;
}

// BMI 카테고리별 색상 및 스타일
const CATEGORY_STYLES: Record<BMICategory, { color: string; bgColor: string; icon: typeof Minus }> =
  {
    underweight: { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: TrendingDown },
    normal: { color: 'text-green-600', bgColor: 'bg-green-50', icon: Minus },
    overweight: { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: TrendingUp },
    obese1: { color: 'text-orange-600', bgColor: 'bg-orange-50', icon: TrendingUp },
    obese2: { color: 'text-red-500', bgColor: 'bg-red-50', icon: TrendingUp },
    obese3: { color: 'text-red-700', bgColor: 'bg-red-100', icon: TrendingUp },
  };

export function BmiCalculator({
  onResult,
  initialHeight,
  initialWeight,
  className,
}: BmiCalculatorProps) {
  const [height, setHeight] = useState<string>(initialHeight?.toString() || '');
  const [weight, setWeight] = useState<string>(initialWeight?.toString() || '');
  const [result, setResult] = useState<BMIResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = useCallback(() => {
    setError(null);

    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (isNaN(heightNum) || heightNum <= 0) {
      setError('올바른 키를 입력해주세요');
      return;
    }

    if (isNaN(weightNum) || weightNum <= 0) {
      setError('올바른 체중을 입력해주세요');
      return;
    }

    if (heightNum < 100 || heightNum > 250) {
      setError('키는 100~250cm 사이로 입력해주세요');
      return;
    }

    if (weightNum < 20 || weightNum > 300) {
      setError('체중은 20~300kg 사이로 입력해주세요');
      return;
    }

    const bmiResult = calculateBMI(heightNum, weightNum);
    setResult(bmiResult);
    onResult?.(bmiResult);
  }, [height, weight, onResult]);

  const handleReset = () => {
    setHeight('');
    setWeight('');
    setResult(null);
    setError(null);
  };

  const categoryStyle = result ? CATEGORY_STYLES[result.category] : null;
  const CategoryIcon = categoryStyle?.icon || Minus;

  return (
    <Card className={cn('w-full max-w-md', className)} data-testid="bmi-calculator">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          BMI 계산기
        </CardTitle>
        <CardDescription>
          아시아 기준 (대한비만학회, KSSO)으로 BMI를 계산합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 입력 폼 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="height" className="flex items-center gap-1">
              <Ruler className="h-4 w-4" />키 (cm)
            </Label>
            <Input
              id="height"
              type="number"
              placeholder="170"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              data-testid="height-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight" className="flex items-center gap-1">
              <Scale className="h-4 w-4" />
              체중 (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              placeholder="65"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              data-testid="weight-input"
            />
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-sm text-red-500" data-testid="error-message">
            {error}
          </p>
        )}

        {/* 버튼 */}
        <div className="flex gap-2">
          <Button onClick={handleCalculate} className="flex-1" data-testid="calculate-button">
            계산하기
          </Button>
          {result && (
            <Button variant="outline" onClick={handleReset}>
              초기화
            </Button>
          )}
        </div>

        {/* 결과 표시 */}
        {result && categoryStyle && (
          <div
            className={cn('rounded-lg p-4 space-y-3', categoryStyle.bgColor)}
            data-testid="bmi-result"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">나의 BMI</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">{result.disclaimer}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center gap-3">
              <span className={cn('text-4xl font-bold', categoryStyle.color)}>{result.value}</span>
              <div className="flex items-center gap-1">
                <CategoryIcon className={cn('h-5 w-5', categoryStyle.color)} />
                <span className={cn('font-medium', categoryStyle.color)}>
                  {result.categoryLabel}
                </span>
              </div>
            </div>

            {/* 체중 차이 */}
            {result.weightDifference !== 0 && (
              <p className="text-sm text-muted-foreground">
                {result.weightDifference > 0
                  ? `정상 체중까지 ${Math.abs(result.weightDifference).toFixed(1)}kg 감량 권장`
                  : `정상 체중까지 ${Math.abs(result.weightDifference).toFixed(1)}kg 증량 권장`}
              </p>
            )}

            {/* 건강 체중 범위 */}
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                건강 체중 범위: {result.healthyWeightRange.min.toFixed(1)}kg ~{' '}
                {result.healthyWeightRange.max.toFixed(1)}kg
              </p>
            </div>
          </div>
        )}

        {/* 면책 조항 (결과 없을 때) */}
        {!result && (
          <p className="text-xs text-muted-foreground text-center">
            * BMI는 참고 지표이며, 정확한 건강 상태는 전문의와 상담하세요
          </p>
        )}
      </CardContent>
    </Card>
  );
}
