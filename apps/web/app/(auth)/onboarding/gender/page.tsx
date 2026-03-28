/**
 * K-1 성별 선택 온보딩 페이지
 *
 * @description 사용자 성별 및 스타일 선호도 선택
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserCircle, Users, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useGenderProfile } from '@/components/providers/gender-provider';
import type { GenderPreference, StylePreference } from '@/lib/content/gender-adaptive';

const GENDER_ICONS: Record<GenderPreference, typeof User> = {
  male: User,
  female: UserCircle,
  neutral: Users,
};

const GENDER_KEYS: GenderPreference[] = ['male', 'female', 'neutral'];
const STYLE_KEYS: StylePreference[] = ['masculine', 'feminine', 'unisex'];

// i18n 키 매핑 (gender → onboarding 네임스페이스)
const STYLE_I18N_MAP: Record<StylePreference, { label: string; desc: string }> = {
  masculine: { label: 'minimal', desc: 'minimalDesc' },
  feminine: { label: 'soft', desc: 'softDesc' },
  unisex: { label: 'free', desc: 'freeDesc' },
};

export default function GenderOnboardingPage() {
  const router = useRouter();
  const t = useTranslations('onboarding');
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

      // 온보딩 완료 → 분석 선택 페이지로 유도 (첫 분석 플로우 연결)
      router.push('/onboarding');
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
            {step === 'gender' ? t('genderTitle') : t('styleTitle')}
          </CardTitle>
          <CardDescription>
            {step === 'gender' ? t('genderSubtitle') : t('styleSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'gender' ? (
            <div className="space-y-3" data-testid="gender-selection">
              {GENDER_KEYS.map((key) => {
                const Icon = GENDER_ICONS[key];
                return (
                  <button
                    key={key}
                    onClick={() => handleGenderSelect(key)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all',
                      'hover:border-primary hover:bg-primary/5',
                      gender === key ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    )}
                    data-testid={`gender-option-${key}`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{t(key)}</div>
                      <div className="text-sm text-muted-foreground">{t(`${key}Desc`)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3" data-testid="style-selection">
              {STYLE_KEYS.map((key) => {
                const i18n = STYLE_I18N_MAP[key];
                return (
                  <button
                    key={key}
                    onClick={() => handleStyleSelect(key)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all',
                      'hover:border-primary hover:bg-primary/5',
                      stylePreference === key
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card'
                    )}
                    data-testid={`style-option-${key}`}
                  >
                    <div className="text-left">
                      <div className="font-medium">{t(i18n.label)}</div>
                      <div className="text-sm text-muted-foreground">{t(i18n.desc)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {step === 'style' && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                {t('back')}
              </Button>
            )}
            {step === 'gender' ? (
              <Button variant="ghost" onClick={handleSkip} className="flex-1">
                {t('skip')}
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!stylePreference || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? t('saving') : t('submit')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
