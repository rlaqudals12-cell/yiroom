'use client';

/**
 * 신규 사용자 온보딩 체크리스트
 *
 * 3단계 가이드로 첫 사용자가 무엇을 해야 하는지 안내:
 * 1. 회원가입 완료 (항상 체크됨)
 * 2. 첫 AI 분석 해보기
 * 3. 맞춤 추천 받기
 *
 * 분석 1개 이상 완료 시 자동으로 숨겨짐
 */

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';
import { CheckCircle2, Circle, ArrowRight, Sparkles } from 'lucide-react';

interface Step {
  label: string;
  description: string;
  done: boolean;
  href?: string;
}

export default function HomeOnboardingChecklist() {
  const router = useRouter();
  const t = useTranslations('home');
  const { isLoading, isNewUser } = useAnalysisStatus();

  // 로딩 중이거나 기존 사용자면 숨김
  if (isLoading || !isNewUser) {
    return null;
  }

  const steps: Step[] = [
    {
      label: t('signupComplete'),
      description: t('signupCompleteDesc'),
      done: true,
    },
    {
      label: t('firstAnalysis'),
      description: t('firstAnalysisDesc'),
      done: false,
      href: '/analysis/personal-color',
    },
    {
      label: t('getRecommendation'),
      description: t('getRecommendationDesc'),
      done: false,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <section
      className="animate-fade-in-up animation-delay-50"
      data-testid="home-onboarding-checklist"
      role="region"
      aria-label={t('onboardingChecklist')}
    >
      {/* 환영 카드 */}
      <div className="bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-pink-500/10 dark:from-violet-500/20 dark:via-purple-500/20 dark:to-pink-500/20 rounded-2xl border border-violet-200/50 dark:border-violet-800/50 p-5">
        {/* 진행 상태 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <h2 className="font-bold text-slate-900 dark:text-white">{t('onboardingGuide')}</h2>
          </div>
          <span className="text-sm text-violet-600 dark:text-violet-400 font-medium">
            {t('completedCount', { completed: completedCount })}
          </span>
        </div>

        {/* 프로그레스 바 */}
        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 3) * 100}%` }}
          />
        </div>

        {/* 단계별 체크리스트 */}
        <div className="space-y-3">
          {steps.map((step, i) => {
            const isActive = !step.done && steps.slice(0, i).every((s) => s.done);

            return (
              <button
                key={i}
                onClick={() => step.href && router.push(step.href)}
                disabled={!step.href || step.done}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-white/80 dark:bg-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.01]'
                    : step.done
                      ? 'opacity-70'
                      : 'opacity-50'
                }`}
              >
                {/* 체크 아이콘 */}
                {step.done ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-violet-500' : 'text-slate-300 dark:text-slate-600'}`}
                  />
                )}

                {/* 텍스트 */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      step.done
                        ? 'text-slate-500 dark:text-slate-400 line-through'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {step.description}
                  </p>
                </div>

                {/* 화살표 (활성 단계) */}
                {isActive && step.href && (
                  <ArrowRight className="w-4 h-4 text-violet-500 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
