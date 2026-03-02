/**
 * W-2 스트레칭 가이드 컴포넌트
 *
 * @description ACSM 가이드라인 기반 스트레칭 실행 UI
 * @see docs/specs/SDD-W-2-ADVANCED-STRETCHING.md
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { selectByKey } from '@/lib/utils/conditional-helpers';

import type {
  StretchingPrescription,
  PrescribedStretch,
  StretchExercise,
} from '@/types/stretching';
import { MUSCLE_NAME_KO } from '@/lib/workout';

// ============================================
// Props 타입
// ============================================

interface StretchingGuideProps {
  prescription: StretchingPrescription;
  onComplete?: (sessionData: SessionData) => void;
  className?: string;
}

interface SessionData {
  prescriptionId: string;
  completedExercises: CompletedExerciseData[];
  totalDuration: number;
  startedAt: string;
  completedAt: string;
}

interface CompletedExerciseData {
  exerciseId: string;
  actualDuration: number;
  actualSets: number;
}

// ============================================
// 메인 컴포넌트
// ============================================

export function StretchingGuide({ prescription, onComplete, className }: StretchingGuideProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<CompletedExerciseData[]>([]);
  const [sessionStartedAt] = useState(new Date().toISOString());
  const [showInstructions, setShowInstructions] = useState(true);

  const currentStretch = prescription.stretches[currentIndex];
  const exercise = currentStretch?.exercise;
  const totalExercises = prescription.stretches.length;
  const progressPercent = (currentIndex / totalExercises) * 100;

  // 타이머 초기화
  useEffect(() => {
    if (currentStretch) {
      setTimeLeft(currentStretch.adjustedDuration);
    }
  }, [currentStretch]);

  // 세션 완료 처리
  const handleSessionComplete = useCallback(() => {
    setIsPlaying(false);
    const sessionData: SessionData = {
      prescriptionId: prescription.prescriptionId,
      completedExercises,
      totalDuration: completedExercises.reduce((sum, ex) => sum + ex.actualDuration, 0),
      startedAt: sessionStartedAt,
      completedAt: new Date().toISOString(),
    };
    onComplete?.(sessionData);
  }, [prescription, completedExercises, sessionStartedAt, onComplete]);

  // 세트 완료 처리
  const handleSetComplete = useCallback(() => {
    if (currentSet < currentStretch.adjustedSets) {
      // 다음 세트
      setCurrentSet((prev) => prev + 1);
      setTimeLeft(currentStretch.adjustedDuration);
      setIsPlaying(false); // 휴식 시간
    } else {
      // 운동 완료 → 다음 운동
      setCompletedExercises((prev) => [
        ...prev,
        {
          exerciseId: exercise.id,
          actualDuration: currentStretch.adjustedDuration * currentStretch.adjustedSets,
          actualSets: currentStretch.adjustedSets,
        },
      ]);

      if (currentIndex < totalExercises - 1) {
        setCurrentIndex((prev) => prev + 1);
        setCurrentSet(1);
        setIsPlaying(false);
      } else {
        // 전체 완료
        handleSessionComplete();
      }
    }
  }, [currentSet, currentStretch, currentIndex, totalExercises, exercise, handleSessionComplete]);

  // 타이머 로직
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isPlaying && timeLeft === 0) {
      // 세트 완료
      handleSetComplete();
    }

    return () => clearInterval(interval);
  }, [isPlaying, timeLeft, handleSetComplete]);

  // 다음 운동으로 건너뛰기
  const handleSkip = () => {
    if (currentIndex < totalExercises - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentSet(1);
      setIsPlaying(false);
    }
  };

  // 현재 운동 다시 시작
  const handleReset = () => {
    setCurrentSet(1);
    setTimeLeft(currentStretch.adjustedDuration);
    setIsPlaying(false);
  };

  if (!exercise) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold">스트레칭 완료!</h3>
          <p className="text-muted-foreground mt-2">오늘의 스트레칭을 모두 마쳤어요.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)} data-testid="stretching-guide">
      {/* 진행 상황 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {totalExercises} 운동
            </span>
            <span className="text-sm text-muted-foreground">
              예상 {prescription.totalDuration}분
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* 현재 운동 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{exercise.nameKo}</CardTitle>
              <CardDescription>{exercise.nameEn}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={exercise.type === 'static' ? 'secondary' : 'default'}>
                {selectByKey(exercise.type, { static: '정적', dynamic: '동적' }, 'PNF')}
              </Badge>
              <Badge variant="outline">
                {selectByKey(exercise.difficulty, { beginner: '초급', intermediate: '중급' }, '고급')}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 타이머 */}
          <TimerDisplay
            timeLeft={timeLeft}
            totalTime={currentStretch.adjustedDuration}
            currentSet={currentSet}
            totalSets={currentStretch.adjustedSets}
            isPlaying={isPlaying}
            durationUnit={exercise.durationUnit}
          />

          {/* 컨트롤 버튼 */}
          <div className="flex justify-center gap-4">
            <Button variant="outline" size="icon" onClick={handleReset} title="다시 시작">
              <RotateCcw className="w-5 h-5" />
            </Button>

            <Button size="lg" onClick={() => setIsPlaying(!isPlaying)} className="w-24">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleSkip}
              disabled={currentIndex >= totalExercises - 1}
              title="건너뛰기"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>

          {/* 타겟 근육 */}
          <MuscleTargets exercise={exercise} />

          {/* 실행 가이드 */}
          <div>
            <button
              className="flex items-center gap-2 text-sm font-medium w-full"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              <Info className="w-4 h-4" />
              실행 방법
              {showInstructions ? (
                <ChevronUp className="w-4 h-4 ml-auto" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-auto" />
              )}
            </button>

            {showInstructions && (
              <div className="mt-3 space-y-4">
                <InstructionList exercise={exercise} />
                <BreathingGuide guide={exercise.breathingGuide} />
                {exercise.commonMistakes.length > 0 && (
                  <CommonMistakes mistakes={exercise.commonMistakes} />
                )}
              </div>
            )}
          </div>

          {/* 안전 경고 */}
          {(exercise.contraindications.length > 0 || exercise.redFlags.length > 0) && (
            <SafetyWarnings exercise={exercise} />
          )}
        </CardContent>
      </Card>

      {/* 다음 운동 미리보기 */}
      {currentIndex < totalExercises - 1 && (
        <NextExercisePreview nextStretch={prescription.stretches[currentIndex + 1]} />
      )}
    </div>
  );
}

// ============================================
// 서브 컴포넌트
// ============================================

interface TimerDisplayProps {
  timeLeft: number;
  totalTime: number;
  currentSet: number;
  totalSets: number;
  isPlaying: boolean;
  durationUnit: 'seconds' | 'reps';
}

function TimerDisplay({
  timeLeft,
  totalTime,
  currentSet,
  totalSets,
  isPlaying,
  durationUnit,
}: TimerDisplayProps) {
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="text-center py-6">
      <div className="relative inline-flex items-center justify-center">
        {/* 원형 프로그레스 */}
        <svg className="w-40 h-40 -rotate-90">
          <circle cx="80" cy="80" r="70" strokeWidth="8" fill="none" className="stroke-muted" />
          <circle
            cx="80"
            cy="80"
            r="70"
            strokeWidth="8"
            fill="none"
            className={cn(
              'transition-all duration-1000',
              isPlaying ? 'stroke-primary' : 'stroke-muted-foreground'
            )}
            strokeDasharray={`${2 * Math.PI * 70}`}
            strokeDashoffset={`${2 * Math.PI * 70 * (1 - progressPercent / 100)}`}
            strokeLinecap="round"
          />
        </svg>

        {/* 시간 표시 */}
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-bold tabular-nums">
            {durationUnit === 'seconds' ? formatTime(timeLeft) : `${timeLeft}회`}
          </span>
          <span className="text-sm text-muted-foreground">
            {currentSet} / {totalSets} 세트
          </span>
        </div>
      </div>
    </div>
  );
}

function MuscleTargets({ exercise }: { exercise: StretchExercise }) {
  return (
    <div className="flex flex-wrap gap-2">
      {exercise.targetMuscles.map((muscle) => (
        <Badge key={muscle} variant="secondary" className="text-xs">
          {MUSCLE_NAME_KO[muscle]}
        </Badge>
      ))}
      {exercise.secondaryMuscles.map((muscle) => (
        <Badge key={muscle} variant="outline" className="text-xs opacity-60">
          {MUSCLE_NAME_KO[muscle]}
        </Badge>
      ))}
    </div>
  );
}

function InstructionList({ exercise }: { exercise: StretchExercise }) {
  return (
    <ol className="list-decimal list-inside space-y-2 text-sm">
      {exercise.instructions.map((instruction, idx) => (
        <li key={idx} className="text-muted-foreground">
          {instruction}
        </li>
      ))}
    </ol>
  );
}

function BreathingGuide({ guide }: { guide: string }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
      <p className="text-sm">
        <span className="font-medium">🌬️ 호흡:</span>{' '}
        <span className="text-muted-foreground">{guide}</span>
      </p>
    </div>
  );
}

function CommonMistakes({ mistakes }: { mistakes: string[] }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
      <p className="text-sm font-medium mb-1">⚠️ 흔한 실수</p>
      <ul className="list-disc list-inside text-sm text-muted-foreground">
        {mistakes.map((mistake, idx) => (
          <li key={idx}>{mistake}</li>
        ))}
      </ul>
    </div>
  );
}

function SafetyWarnings({ exercise }: { exercise: StretchExercise }) {
  return (
    <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 space-y-2">
      {exercise.contraindications.length > 0 && (
        <div>
          <p className="text-sm font-medium flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            금기사항
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            {exercise.contraindications.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {exercise.redFlags.length > 0 && (
        <div>
          <p className="text-sm font-medium text-red-600">
            🛑 즉시 중단: {exercise.redFlags.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}

function NextExercisePreview({ nextStretch }: { nextStretch: PrescribedStretch }) {
  return (
    <Card className="opacity-60">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">다음 운동</p>
        <p className="font-medium">{nextStretch.exercise.nameKo}</p>
        <p className="text-sm text-muted-foreground">
          {nextStretch.adjustedSets}세트 x {nextStretch.adjustedDuration}
          {nextStretch.exercise.durationUnit === 'seconds' ? '초' : '회'}
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================
// 유틸리티
// ============================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}`;
}

// ============================================
// Export
// ============================================

export default StretchingGuide;
