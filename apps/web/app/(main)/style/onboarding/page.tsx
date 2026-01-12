'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Loader2, Ruler, Scale, Percent, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * 스타일 온보딩 - 키/몸무게 필수 입력
 * L-1-2: 패션 맞춤 추천을 위한 신체 정보 수집
 */

// BMI 카테고리 계산
function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: '저체중', color: 'text-blue-600' };
  if (bmi < 23) return { label: '정상', color: 'text-green-600' };
  if (bmi < 25) return { label: '과체중', color: 'text-yellow-600' };
  return { label: '비만', color: 'text-red-600' };
}

export default function StyleOnboardingPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 입력 상태
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [bodyFat, setBodyFat] = useState<string>('');

  // BMI 계산
  const bmi = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h < 100 || h > 250 || w < 20 || w > 200) return null;
    return Math.round((w / (h / 100) ** 2) * 10) / 10;
  }, [height, weight]);

  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  // 유효성 검사
  const isValid = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const bf = bodyFat ? parseFloat(bodyFat) : null;

    const heightValid = h >= 100 && h <= 250;
    const weightValid = w >= 20 && w <= 200;
    const bodyFatValid = bf === null || (bf >= 3 && bf <= 60);

    return heightValid && weightValid && bodyFatValid;
  }, [height, weight, bodyFat]);

  // 저장
  const handleSubmit = async () => {
    if (!isValid) {
      toast.error('입력값을 확인해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height: parseFloat(height),
          weight: parseFloat(weight),
          bodyFat: bodyFat ? parseFloat(bodyFat) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '저장에 실패했습니다');
      }

      toast.success('신체 정보가 저장되었습니다');
      router.push('/style');
    } catch (err) {
      console.error('[StyleOnboarding] Submit error:', err);
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로딩
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 미로그인
  if (!isSignedIn) {
    router.replace('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="style-onboarding-page">
      {/* 헤더 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* 타이틀 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ruler className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">맞춤 스타일링을 위해</h1>
            <p className="text-muted-foreground mt-2">신체 정보를 입력해주세요</p>
          </div>

          {/* 입력 폼 */}
          <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
            {/* 키 */}
            <div>
              <Label htmlFor="height" className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-muted-foreground" />키 (cm){' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="height"
                type="number"
                min={100}
                max={250}
                placeholder="예: 170"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="mt-2"
                data-testid="height-input"
              />
              {height && (parseFloat(height) < 100 || parseFloat(height) > 250) && (
                <p className="text-xs text-destructive mt-1">100~250cm 범위로 입력해주세요</p>
              )}
            </div>

            {/* 몸무게 */}
            <div>
              <Label htmlFor="weight" className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-muted-foreground" />
                몸무게 (kg) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="weight"
                type="number"
                min={20}
                max={200}
                placeholder="예: 65"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-2"
                data-testid="weight-input"
              />
              {weight && (parseFloat(weight) < 20 || parseFloat(weight) > 200) && (
                <p className="text-xs text-destructive mt-1">20~200kg 범위로 입력해주세요</p>
              )}
            </div>

            {/* BMI 미리보기 */}
            {bmi && bmiCategory && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">BMI</span>
                  <div className="text-right">
                    <span className="text-lg font-bold">{bmi}</span>
                    <span className={cn('text-sm ml-2 font-medium', bmiCategory.color)}>
                      ({bmiCategory.label})
                    </span>
                  </div>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all',
                      bmi < 18.5
                        ? 'bg-blue-500'
                        : bmi < 23
                          ? 'bg-green-500'
                          : bmi < 25
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                    )}
                    style={{ width: `${Math.min((bmi / 35) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* 체지방률 (선택) */}
            <div>
              <Label htmlFor="bodyFat" className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-muted-foreground" />
                체지방률 (%) <span className="text-xs text-muted-foreground">- 선택</span>
              </Label>
              <Input
                id="bodyFat"
                type="number"
                min={3}
                max={60}
                placeholder="예: 20"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                className="mt-2"
                data-testid="body-fat-input"
              />
              {bodyFat && (parseFloat(bodyFat) < 3 || parseFloat(bodyFat) > 60) && (
                <p className="text-xs text-destructive mt-1">3~60% 범위로 입력해주세요</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                체지방률을 입력하면 더 정확한 사이즈를 추천받을 수 있어요
              </p>
            </div>
          </div>

          {/* 안내 */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            입력한 정보는 맞춤 사이즈 추천에만 사용됩니다
          </p>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="sticky bottom-0 bg-background border-t p-4">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full h-12 text-base font-semibold"
            data-testid="submit-button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                저장하고 스타일링 시작
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
