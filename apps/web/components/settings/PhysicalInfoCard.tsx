'use client';

import { useState, useEffect, useCallback } from 'react';
import { Ruler, Scale, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PhysicalInfoCardProps {
  heightCm: number | null;
  weightKg: number | null;
  onHeightChange: (height: number) => Promise<boolean>;
  onWeightChange: (weight: number) => Promise<boolean>;
  isLoading?: boolean;
}

// BMI 계산
const calculateBMI = (heightCm: number | null, weightKg: number | null): number | null => {
  if (!heightCm || !weightKg || heightCm < 100) return null;
  return weightKg / (heightCm / 100) ** 2;
};

// BMI 카테고리 (한국 기준)
const getBMICategory = (bmi: number): { label: string; color: string } => {
  if (bmi < 18.5) return { label: '저체중', color: 'text-blue-600' };
  if (bmi < 23) return { label: '정상', color: 'text-green-600' };
  if (bmi < 25) return { label: '과체중', color: 'text-amber-600' };
  return { label: '비만', color: 'text-red-600' };
};

/**
 * 신체 정보 카드 컴포넌트
 * 키, 몸무게 입력 및 BMI 자동 계산
 */
export function PhysicalInfoCard({
  heightCm,
  weightKg,
  onHeightChange,
  onWeightChange,
  isLoading = false,
}: PhysicalInfoCardProps) {
  const [height, setHeight] = useState<string>(heightCm?.toString() || '');
  const [weight, setWeight] = useState<string>(weightKg?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);

  // props 변경 시 로컬 상태 동기화
  useEffect(() => {
    if (heightCm !== null) setHeight(heightCm.toString());
  }, [heightCm]);

  useEffect(() => {
    if (weightKg !== null) setWeight(weightKg.toString());
  }, [weightKg]);

  // 키 저장 (blur 시)
  const handleHeightBlur = useCallback(async () => {
    const num = Number(height);
    if (!height || isNaN(num) || num < 100 || num > 250) return;
    if (num === heightCm) return; // 변경 없음

    setIsSaving(true);
    try {
      await onHeightChange(num);
    } finally {
      setIsSaving(false);
    }
  }, [height, heightCm, onHeightChange]);

  // 몸무게 저장 (blur 시)
  const handleWeightBlur = useCallback(async () => {
    const num = Number(weight);
    if (!weight || isNaN(num) || num < 20 || num > 300) return;
    if (num === weightKg) return; // 변경 없음

    setIsSaving(true);
    try {
      await onWeightChange(num);
    } finally {
      setIsSaving(false);
    }
  }, [weight, weightKg, onWeightChange]);

  // BMI 계산
  const bmi = calculateBMI(Number(height) || null, Number(weight) || null);
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  return (
    <Card data-testid="physical-info-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Ruler className="w-5 h-5" aria-hidden="true" />
          신체 정보
        </CardTitle>
        <CardDescription>체형 분석 및 맞춤 추천에 활용됩니다</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 키 입력 */}
        <div className="space-y-2">
          <Label htmlFor="settings-height" className="flex items-center gap-2 text-sm">
            <Ruler className="w-4 h-4 text-muted-foreground" />키
          </Label>
          <div className="relative">
            <Input
              id="settings-height"
              type="number"
              inputMode="numeric"
              placeholder="165"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              onBlur={handleHeightBlur}
              disabled={isLoading || isSaving}
              className={cn('pr-10', (isLoading || isSaving) && 'opacity-50')}
              min={100}
              max={250}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              cm
            </span>
          </div>
        </div>

        {/* 몸무게 입력 */}
        <div className="space-y-2">
          <Label htmlFor="settings-weight" className="flex items-center gap-2 text-sm">
            <Scale className="w-4 h-4 text-muted-foreground" />
            몸무게
          </Label>
          <div className="relative">
            <Input
              id="settings-weight"
              type="number"
              inputMode="decimal"
              placeholder="55"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onBlur={handleWeightBlur}
              disabled={isLoading || isSaving}
              className={cn('pr-10', (isLoading || isSaving) && 'opacity-50')}
              min={20}
              max={300}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              kg
            </span>
          </div>
        </div>

        {/* BMI 표시 */}
        {bmi && bmiCategory && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">BMI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{bmi.toFixed(1)}</span>
                <span className={cn('text-sm font-medium', bmiCategory.color)}>
                  ({bmiCategory.label})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 미입력 안내 */}
        {(!height || !weight) && (
          <p className="text-xs text-muted-foreground text-center">
            키와 몸무게를 입력하면 BMI가 자동 계산됩니다
          </p>
        )}
      </CardContent>
    </Card>
  );
}
