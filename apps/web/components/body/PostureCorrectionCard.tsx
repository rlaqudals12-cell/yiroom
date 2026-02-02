'use client';

/**
 * 자세 교정 운동 카드 컴포넌트 - K-3 체형 분석 고도화
 * @description 체형별 자세 문제와 교정 운동을 표시하는 카드
 *
 * @see lib/body/posture-correction.ts
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md 섹션 4.1 B-05
 */

import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Target,
  Clock,
  Calendar,
  CheckCircle2,
  PlayCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BodyShape7 } from '@/lib/body/types';
import {
  getPostureCorrectionGuide,
  getPostureIssueDetail,
  filterExercisesByDifficulty,
  type PostureIssue,
  type CorrectionExercise,
  type PostureCorrectionGuide,
} from '@/lib/body/posture-correction';

// 난이도 레이블
const DIFFICULTY_LABELS = {
  1: { label: '쉬움', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  2: { label: '보통', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  3: { label: '어려움', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
} as const;

// 자세 문제 아이콘 색상
const ISSUE_COLORS: Record<string, string> = {
  forward_head: 'text-orange-500',
  rounded_shoulders: 'text-blue-500',
  kyphosis: 'text-purple-500',
  lordosis: 'text-pink-500',
  anterior_pelvic_tilt: 'text-rose-500',
  posterior_pelvic_tilt: 'text-indigo-500',
  scoliosis: 'text-violet-500',
  flat_back: 'text-cyan-500',
  uneven_shoulders: 'text-teal-500',
  leg_length_discrepancy: 'text-emerald-500',
};

interface PostureCorrectionCardProps {
  /** 체형 (7-type) */
  bodyType: BodyShape7;
  /** 컴팩트 모드 (간략히 표시) */
  compact?: boolean;
  /** 최대 난이도 필터 */
  maxDifficulty?: 1 | 2 | 3;
  /** 클래스명 */
  className?: string;
}

export function PostureCorrectionCard({
  bodyType,
  compact = false,
  maxDifficulty = 3,
  className,
}: PostureCorrectionCardProps) {
  const [expandedIssue, setExpandedIssue] = useState<PostureIssue | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  // 체형별 자세 교정 가이드 생성
  const guide: PostureCorrectionGuide = useMemo(
    () => getPostureCorrectionGuide(bodyType),
    [bodyType]
  );

  // 난이도 필터링된 운동
  const filteredExercises = useMemo(
    () => filterExercisesByDifficulty(guide.exercises, maxDifficulty),
    [guide.exercises, maxDifficulty]
  );

  // 운동 완료 토글
  const toggleExerciseComplete = (exerciseId: string) => {
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  // 진행률 계산
  const progressPercent = Math.round(
    (completedExercises.size / filteredExercises.length) * 100
  );

  return (
    <div
      className={cn(
        'bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-lg overflow-hidden',
        className
      )}
      data-testid="posture-correction-card"
    >
      {/* 헤더 */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            자세 교정 가이드
          </h3>
          {!compact && (
            <span className="text-sm text-muted-foreground">
              {filteredExercises.length}개 운동
            </span>
          )}
        </div>

        {/* 진행률 바 */}
        {!compact && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">오늘의 진행률</span>
              <span className="font-medium text-primary">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 자세 문제 섹션 */}
      {!compact && (
        <div className="p-5 border-b border-slate-100 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            주의해야 할 자세 문제
          </h4>
          <div className="space-y-2">
            {guide.commonIssues.map((issue) => {
              const detail = getPostureIssueDetail(issue);
              const isExpanded = expandedIssue === issue;

              return (
                <div
                  key={issue}
                  className="bg-slate-50/50 dark:bg-slate-700/30 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedIssue(isExpanded ? null : issue)}
                    className="w-full flex items-center justify-between p-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full',
                          ISSUE_COLORS[issue] || 'text-slate-400',
                          'bg-current'
                        )}
                      />
                      <span className="font-medium text-foreground">{detail.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 animate-in slide-in-from-top-2">
                      <p className="text-sm text-muted-foreground">{detail.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">원인:</span>
                          <ul className="mt-1 space-y-0.5">
                            {detail.causes.slice(0, 2).map((cause, i) => (
                              <li key={i} className="text-foreground">
                                · {cause}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-muted-foreground">증상:</span>
                          <ul className="mt-1 space-y-0.5">
                            {detail.symptoms.slice(0, 2).map((symptom, i) => (
                              <li key={i} className="text-foreground">
                                · {symptom}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 교정 운동 섹션 */}
      <div className="p-5">
        <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <PlayCircle className="w-4 h-4" />
          추천 교정 운동
        </h4>

        <div className="space-y-3">
          {(compact ? filteredExercises.slice(0, 3) : filteredExercises).map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              isExpanded={expandedExercise === exercise.id}
              isCompleted={completedExercises.has(exercise.id)}
              onToggleExpand={() =>
                setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id)
              }
              onToggleComplete={() => toggleExerciseComplete(exercise.id)}
              compact={compact}
            />
          ))}
        </div>

        {compact && filteredExercises.length > 3 && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            +{filteredExercises.length - 3}개 운동 더보기
          </p>
        )}
      </div>

      {/* 일상 생활 팁 */}
      {!compact && guide.dailyTips.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border-t border-slate-100 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            일상 생활 팁
          </h4>
          <ul className="space-y-1">
            {guide.dailyTips.map((tip, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-blue-500">·</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 주의사항 */}
      {!compact && (
        <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 border-t border-amber-100 dark:border-amber-900/30">
          <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            심한 통증이 있을 경우 운동을 중단하고 전문의와 상담하세요.
          </p>
        </div>
      )}
    </div>
  );
}

// 운동 카드 서브컴포넌트
interface ExerciseCardProps {
  exercise: CorrectionExercise;
  isExpanded: boolean;
  isCompleted: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  compact?: boolean;
}

function ExerciseCard({
  exercise,
  isExpanded,
  isCompleted,
  onToggleExpand,
  onToggleComplete,
  compact,
}: ExerciseCardProps) {
  const difficultyInfo = DIFFICULTY_LABELS[exercise.difficulty];

  return (
    <div
      className={cn(
        'rounded-xl border transition-all',
        isCompleted
          ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10'
          : 'border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800'
      )}
    >
      {/* 운동 헤더 */}
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={onToggleComplete}
          className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0',
            isCompleted
              ? 'border-green-500 bg-green-500 text-white'
              : 'border-slate-300 dark:border-slate-600 hover:border-primary'
          )}
        >
          {isCompleted && <CheckCircle2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onToggleExpand}
          className="flex-1 flex items-center justify-between text-left"
        >
          <div>
            <p
              className={cn(
                'font-medium',
                isCompleted ? 'text-green-700 dark:text-green-400' : 'text-foreground'
              )}
            >
              {exercise.name}
            </p>
            {!compact && (
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {exercise.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {exercise.frequency}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={cn('text-xs px-2 py-0.5 rounded-full', difficultyInfo.color)}>
              {difficultyInfo.label}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </div>

      {/* 운동 상세 */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 space-y-3 animate-in slide-in-from-top-2 border-t border-slate-100 dark:border-slate-700 mt-2">
          <p className="text-sm text-muted-foreground pt-3">{exercise.description}</p>

          {/* 타겟 부위 */}
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">{exercise.targetArea}</span>
          </div>

          {/* 동작 단계 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">동작 순서</p>
            <ol className="space-y-1.5">
              {exercise.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* 주의사항 */}
          {exercise.cautions.length > 0 && (
            <div className="p-2 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                주의사항
              </p>
              <ul className="space-y-0.5">
                {exercise.cautions.map((caution, i) => (
                  <li key={i} className="text-xs text-amber-600 dark:text-amber-500">
                    · {caution}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PostureCorrectionCard;
