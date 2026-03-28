'use client';

import { useState, useMemo, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Dumbbell,
  Clock,
  Flame,
  Loader2,
  AlertCircle,
  Plus,
  Calendar,
  Zap,
  Timer,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 운동 종류
const WORKOUT_TYPES = [
  { id: 'cardio', label: '유산소', color: 'text-red-500' },
  { id: 'strength', label: '근력', color: 'text-blue-500' },
  { id: 'flexibility', label: '유연성', color: 'text-purple-500' },
  { id: 'hiit', label: 'HIIT', color: 'text-orange-500' },
  { id: 'sports', label: '스포츠', color: 'text-green-500' },
] as const;

type WorkoutTypeId = (typeof WORKOUT_TYPES)[number]['id'];

// 강도
const INTENSITY_LEVELS = [
  { id: 'low', label: '가벼움' },
  { id: 'medium', label: '보통' },
  { id: 'high', label: '격렬' },
] as const;

type IntensityId = (typeof INTENSITY_LEVELS)[number]['id'];

// 운동 기록
interface WorkoutLog {
  id: string;
  type: WorkoutTypeId;
  name: string;
  duration: number;
  intensity: IntensityId;
  calories: number;
  date: string;
}

// 칼로리 추정 (MET 기반 간소화)
function estimateCalories(type: WorkoutTypeId, duration: number, intensity: IntensityId): number {
  const metMap: Record<WorkoutTypeId, Record<IntensityId, number>> = {
    cardio: { low: 4, medium: 7, high: 10 },
    strength: { low: 3, medium: 5, high: 8 },
    flexibility: { low: 2.5, medium: 3.5, high: 5 },
    hiit: { low: 6, medium: 9, high: 12 },
    sports: { low: 4, medium: 6, high: 9 },
  };
  // 체중 70kg 기준 간소화
  const met = metMap[type][intensity];
  return Math.round(met * 70 * (duration / 60));
}

// 초기 목업 데이터
const INITIAL_LOGS: WorkoutLog[] = [
  {
    id: '1',
    type: 'strength',
    name: '벤치프레스 + 덤벨 컬',
    duration: 45,
    intensity: 'medium',
    calories: 263,
    date: '2026-03-26',
  },
  {
    id: '2',
    type: 'cardio',
    name: '러닝',
    duration: 30,
    intensity: 'high',
    calories: 350,
    date: '2026-03-25',
  },
  {
    id: '3',
    type: 'flexibility',
    name: '요가',
    duration: 60,
    intensity: 'low',
    calories: 175,
    date: '2026-03-24',
  },
];

export default function WorkoutLogPage(): React.ReactElement {
  const { user, isLoaded } = useUser();
  const [logs, setLogs] = useState<WorkoutLog[]>(INITIAL_LOGS);

  // 폼 상태
  const [selectedType, setSelectedType] = useState<WorkoutTypeId>('cardio');
  const [workoutName, setWorkoutName] = useState('');
  const [duration, setDuration] = useState('30');
  const [intensity, setIntensity] = useState<IntensityId>('medium');
  const [showForm, setShowForm] = useState(false);

  // 주간 요약
  const weeklySummary = useMemo(() => {
    const totalMinutes = logs.reduce((sum, log) => sum + log.duration, 0);
    const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);
    const totalSessions = logs.length;
    return { totalMinutes, totalCalories, totalSessions };
  }, [logs]);

  // 운동 기록 추가
  const addLog = useCallback((): void => {
    if (!workoutName.trim()) return;

    const durationNum = parseInt(duration, 10) || 30;
    const calories = estimateCalories(selectedType, durationNum, intensity);

    const newLog: WorkoutLog = {
      id: Date.now().toString(),
      type: selectedType,
      name: workoutName.trim(),
      duration: durationNum,
      intensity,
      calories,
      date: new Date().toISOString().split('T')[0],
    };

    setLogs((prev) => [newLog, ...prev]);
    setWorkoutName('');
    setDuration('30');
    setIntensity('medium');
    setShowForm(false);
  }, [selectedType, workoutName, duration, intensity]);

  // 로딩 상태
  if (!isLoaded) {
    return (
      <div
        data-testid="workout-log-loading"
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">데이터를 불러오고 있어요...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 (미로그인)
  if (!user) {
    return (
      <div
        data-testid="workout-log-error"
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-lg font-semibold mb-1">로그인이 필요해요</p>
          <p className="text-muted-foreground">운동을 기록하려면 먼저 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="workout-log-page" className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Dumbbell className="w-7 h-7 text-primary" />
            운동 기록
          </h1>
          <p className="text-muted-foreground mt-1">오늘의 운동을 기록해보세요</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-1">
          <Plus className="w-4 h-4" />
          기록하기
        </Button>
      </div>

      {/* 주간 요약 */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Timer className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{weeklySummary.totalMinutes}</p>
            <p className="text-xs text-muted-foreground">총 운동시간(분)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{weeklySummary.totalCalories.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">소모 칼로리</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{weeklySummary.totalSessions}</p>
            <p className="text-xs text-muted-foreground">운동 횟수</p>
          </CardContent>
        </Card>
      </div>

      {/* 운동 기록 폼 */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">새 운동 기록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 운동 종류 선택 */}
            <div>
              <label className="text-sm font-medium mb-2 block">운동 종류</label>
              <div className="flex gap-2 flex-wrap">
                {WORKOUT_TYPES.map((type) => (
                  <Button
                    key={type.id}
                    variant={selectedType === type.id ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setSelectedType(type.id)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 운동명 */}
            <div>
              <label htmlFor="workout-name" className="text-sm font-medium mb-2 block">
                운동명
              </label>
              <Input
                id="workout-name"
                placeholder="예: 스쿼트, 러닝, 수영..."
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
              />
            </div>

            {/* 시간 */}
            <div>
              <label htmlFor="workout-duration" className="text-sm font-medium mb-2 block">
                운동 시간 (분)
              </label>
              <Input
                id="workout-duration"
                type="number"
                min="1"
                max="300"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            {/* 강도 */}
            <div>
              <label className="text-sm font-medium mb-2 block">강도</label>
              <div className="flex gap-2">
                {INTENSITY_LEVELS.map((level) => (
                  <Button
                    key={level.id}
                    variant={intensity === level.id ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => setIntensity(level.id)}
                  >
                    {level.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 예상 칼로리 */}
            <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">예상 소모 칼로리</span>
              <span className="font-semibold text-orange-600">
                ~{estimateCalories(selectedType, parseInt(duration, 10) || 30, intensity)}kcal
              </span>
            </div>

            {/* 제출 */}
            <Button className="w-full" onClick={addLog} disabled={!workoutName.trim()}>
              기록 저장하기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 최근 기록 */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5" />
          최근 기록
        </h2>

        {logs.length === 0 ? (
          <div data-testid="workout-log-empty" className="text-center py-12">
            <Dumbbell className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-lg font-medium text-muted-foreground">아직 운동 기록이 없어요</p>
            <p className="text-sm text-muted-foreground/70 mt-1">첫 번째 운동을 기록해보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const typeInfo = WORKOUT_TYPES.find((t) => t.id === log.type);
              const intensityInfo = INTENSITY_LEVELS.find((i) => i.id === log.intensity);
              return (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{typeInfo?.label}</span>
                        <div>
                          <h3 className="font-semibold">{log.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {log.duration}분
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5" />
                              {intensityInfo?.label}
                            </span>
                            <span className="flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5" />
                              {log.calories}kcal
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{log.date}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
