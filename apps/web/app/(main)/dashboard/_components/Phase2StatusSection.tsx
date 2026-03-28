'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Dumbbell, Utensils, ChevronRight, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

interface Phase2Status {
  workout: {
    hasAnalysis: boolean;
    workoutType?: string;
  };
  nutrition: {
    hasSettings: boolean;
    goal?: string;
  };
}

// GOAL_LABELS / WORKOUT_TYPE_LABELS 는 컴포넌트 내부에서 t()로 생성

/**
 * Phase 2 모듈 상태 표시 섹션 (P3-2.3)
 * - 운동 분석 완료 여부
 * - 영양 설정 완료 여부
 */
export default function Phase2StatusSection() {
  const t = useTranslations('dashboard');
  const supabase = useClerkSupabaseClient();

  const GOAL_LABELS: Record<string, string> = {
    weight_loss: t('goals.weightLoss'),
    muscle_gain: t('goals.muscleGain'),
    maintenance: t('goals.maintenance'),
    health: t('goals.health'),
  };

  const WORKOUT_TYPE_LABELS: Record<string, string> = {
    toner: t('workoutTypes.toner'),
    builder: t('workoutTypes.builder'),
    burner: t('workoutTypes.burner'),
    mover: t('workoutTypes.mover'),
    flexer: t('workoutTypes.flexer'),
  };
  const [status, setStatus] = useState<Phase2Status | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        // 운동 분석 확인 (maybeSingle: 데이터 없어도 오류 안 남)
        const { data: workoutData } = await supabase
          .from('workout_analyses')
          .select('workout_type')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // 영양 설정 확인 (maybeSingle: 데이터 없어도 오류 안 남)
        const { data: nutritionData } = await supabase
          .from('nutrition_settings')
          .select('goal')
          .maybeSingle();

        setStatus({
          workout: {
            hasAnalysis: !!workoutData,
            workoutType: workoutData?.workout_type,
          },
          nutrition: {
            hasSettings: !!nutritionData,
            goal: nutritionData?.goal,
          },
        });
      } catch (error) {
        console.error('Failed to fetch Phase 2 status:', error);
        setStatus({
          workout: { hasAnalysis: false },
          nutrition: { hasSettings: false },
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
  }, [supabase]);

  if (isLoading) {
    return (
      <section data-testid="phase2-status-loading">
        <h2 className="text-xl font-bold text-foreground mb-4">{t('phase2.wellnessManagement')}</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (!status) return null;

  return (
    <section data-testid="phase2-status-section">
      <h2 className="text-xl font-bold text-foreground mb-4">{t('phase2.wellnessManagement')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 운동 모듈 */}
        <StatusCard
          title={t('modules.workout')}
          icon={<Dumbbell className="w-5 h-5" />}
          href="/workout"
          isCompleted={status.workout.hasAnalysis}
          completedText={
            status.workout.workoutType
              ? t('modules.workoutTypeLabel', {
                  type:
                    WORKOUT_TYPE_LABELS[status.workout.workoutType] || status.workout.workoutType,
                })
              : t('modules.analysisComplete')
          }
          pendingText={t('phase2.startWorkoutAnalysis')}
          bgColor="bg-module-workout-light"
          borderColor="border-module-workout/30"
          iconColor="text-module-workout"
        />

        {/* 영양 모듈 */}
        <StatusCard
          title={t('modules.nutrition')}
          icon={<Utensils className="w-5 h-5" />}
          href="/nutrition"
          isCompleted={status.nutrition.hasSettings}
          completedText={
            status.nutrition.goal
              ? t('phase2.nutritionGoalLabel', {
                  goal: GOAL_LABELS[status.nutrition.goal] || status.nutrition.goal,
                })
              : t('modules.settingsComplete')
          }
          pendingText={t('phase2.startNutritionSettings')}
          bgColor="bg-module-nutrition-light"
          borderColor="border-module-nutrition/30"
          iconColor="text-module-nutrition"
        />
      </div>
    </section>
  );
}

interface StatusCardProps {
  title: string;
  icon: React.ReactNode;
  href: string;
  isCompleted: boolean;
  completedText: string;
  pendingText: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
}

function StatusCard({
  title,
  icon,
  href,
  isCompleted,
  completedText,
  pendingText,
  bgColor,
  borderColor,
  iconColor,
}: StatusCardProps) {
  return (
    <Link href={href}>
      <div
        className={`
          ${bgColor} ${borderColor}
          rounded-xl border p-4
          hover:shadow-md transition-shadow cursor-pointer
          group
        `}
        data-testid={`status-card-${title.toLowerCase()}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-card/70 ${iconColor}`}>{icon}</div>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-status-success" />
                    <span className="text-sm text-muted-foreground">{completedText}</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{pendingText}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </Link>
  );
}
