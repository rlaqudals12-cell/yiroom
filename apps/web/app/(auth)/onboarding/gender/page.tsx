/**
 * K-1 성별 선택 온보딩 페이지
 *
 * @description 사용자 성별 및 스타일 선호도 선택
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Users, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useGenderProfile } from '@/components/providers/gender-provider';
import type { GenderPreference, StylePreference } from '@/lib/content/gender-adaptive';

interface GenderOption {
  value: GenderPreference;
  label: string;
  description: string;
  icon: typeof User;
}

interface StyleOption {
  value: StylePreference;
  label: string;
  description: string;
}

const GENDER_OPTIONS: GenderOption[] = [
  {
    value: 'male',
    label: '남성',
    description: '남성용 추천 스타일과 제품을 받아보세요',
    icon: User,
  },
  {
    value: 'female',
    label: '여성',
    description: '여성용 추천 스타일과 제품을 받아보세요',
    icon: User,
  },
  {
    value: 'neutral',
    label: '선택 안함',
    description: '성별 구분 없이 다양한 추천을 받아보세요',
    icon: Users,
  },
];

const STYLE_OPTIONS: StyleOption[] = [
  {
    value: 'masculine',
    label: '남성적 스타일',
    description: '깔끔하고 심플한 스타일 선호',
  },
  {
    value: 'feminine',
    label: '여성적 스타일',
    description: '화사하고 부드러운 스타일 선호',
  },
  {
    value: 'unisex',
    label: '유니섹스 스타일',
    description: '성별 구분 없는 스타일 선호',
  },
];

export default function GenderOnboardingPage() {
  const router = useRouter();
  const { updateGenderProfile, isLoading } = useGenderProfile();
  const [gender, setGender] = useState<GenderPreference | null>(null);
  const [stylePreference, setStylePreference] = useState<StylePreference | null>(null);
  const [step, setStep] = useState<'gender' | 'style'>('gender');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenderSelect = (value: GenderPreference) => {
    setGender(value);
    // neutral 선택 시 스타일도 unisex로 자동 설정
    if (value === 'neutral') {
      setStylePreference('unisex');
    }
    setStep('style');
  };

  const handleStyleSelect = (value: StylePreference) => {
    setStylePreference(value);
  };

  const handleSubmit = async () => {
    if (!gender || !stylePreference) return;

    setIsSubmitting(true);
    try {
      // GenderProvider를 통해 성별/스타일 저장 (Supabase + localStorage)
      await updateGenderProfile({
        gender,
        stylePreference,
      });

      router.push('/home');
    } catch (error) {
      console.error('[Onboarding] Failed to save preferences:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStep('gender');
  };

  const handleSkip = () => {
    router.push('/home');
  };

  // 로딩 중일 때 스피너 표시
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30"
        data-testid="gender-onboarding-loading"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <Card className="w-full max-w-lg" data-testid="gender-onboarding">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {step === 'gender' ? '나에게 맞는 추천 받기' : '스타일 선호도'}
          </CardTitle>
          <CardDescription>
            {step === 'gender'
              ? '성별에 맞는 맞춤 추천을 받아보세요'
              : '선호하는 스타일을 선택해주세요'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'gender' ? (
            <div className="space-y-3" data-testid="gender-selection">
              {GENDER_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleGenderSelect(option.value)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all',
                      'hover:border-primary hover:bg-primary/5',
                      gender === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card'
                    )}
                    data-testid={`gender-option-${option.value}`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3" data-testid="style-selection">
              {STYLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStyleSelect(option.value)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all',
                    'hover:border-primary hover:bg-primary/5',
                    stylePreference === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card'
                  )}
                  data-testid={`style-option-${option.value}`}
                >
                  <div className="text-left">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {step === 'style' && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                이전
              </Button>
            )}
            {step === 'gender' ? (
              <Button variant="ghost" onClick={handleSkip} className="flex-1">
                나중에 설정
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!stylePreference || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? '저장 중...' : '시작하기'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
