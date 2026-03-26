'use client';

/**
 * 체중 목표 페이지
 * - 현재 체중 표시 + 목표 설정
 * - 진행률 바 + 기록 입력
 * - 최근 10건 히스토리
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Scale,
  Target,
  TrendingDown,
  TrendingUp,
  Plus,
  CalendarDays,
  Minus,
  AlertCircle,
} from 'lucide-react';

interface WeightRecord {
  id: string;
  weight: number;
  date: string;
  note?: string;
}

interface WeightGoalData {
  currentWeight: number | null;
  goalWeight: number | null;
  records: WeightRecord[];
}

export default function WeightGoalPage(): React.ReactElement {
  const { user, isLoaded } = useUser();
  const [data, setData] = useState<WeightGoalData>({
    currentWeight: null,
    goalWeight: null,
    records: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [inputWeight, setInputWeight] = useState('');
  const [inputNote, setInputNote] = useState('');
  const [goalInput, setGoalInput] = useState('');

  // 데이터 로드
  const loadData = useCallback(async (): Promise<void> => {
    if (!isLoaded || !user) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/reports/weight-goal');
      if (!res.ok) throw new Error('데이터를 불러올 수 없어요');
      const result = await res.json();
      setData({
        currentWeight: result.data?.currentWeight ?? null,
        goalWeight: result.data?.goalWeight ?? null,
        records: result.data?.records ?? [],
      });
    } catch {
      setError('체중 데이터를 불러오는 중 문제가 발생했어요.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 체중 기록 추가
  const handleAddRecord = async (): Promise<void> => {
    const weight = parseFloat(inputWeight);
    if (isNaN(weight) || weight < 20 || weight > 300) return;

    try {
      const res = await fetch('/api/reports/weight-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight, note: inputNote || undefined }),
      });
      if (!res.ok) throw new Error('저장 실패');

      setInputWeight('');
      setInputNote('');
      setShowInput(false);
      await loadData();
    } catch {
      setError('기록을 저장할 수 없었어요. 다시 시도해주세요.');
    }
  };

  // 목표 설정
  const handleSetGoal = async (): Promise<void> => {
    const goal = parseFloat(goalInput);
    if (isNaN(goal) || goal < 20 || goal > 300) return;

    try {
      const res = await fetch('/api/reports/weight-goal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalWeight: goal }),
      });
      if (!res.ok) throw new Error('목표 설정 실패');

      setGoalInput('');
      setShowGoalInput(false);
      await loadData();
    } catch {
      setError('목표를 설정할 수 없었어요. 다시 시도해주세요.');
    }
  };

  // 진행률 계산
  const getProgress = (): number => {
    if (!data.currentWeight || !data.goalWeight || data.records.length < 2) return 0;
    const startWeight = data.records[data.records.length - 1]?.weight ?? data.currentWeight;
    const totalDiff = Math.abs(startWeight - data.goalWeight);
    if (totalDiff === 0) return 100;
    const currentDiff = Math.abs(data.currentWeight - data.goalWeight);
    const progress = ((totalDiff - currentDiff) / totalDiff) * 100;
    return Math.max(0, Math.min(100, Math.round(progress)));
  };

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6" data-testid="weight-goal-page">
        <Skeleton className="h-8 w-40 mb-4" />
        <Skeleton className="h-48 rounded-xl mb-4" />
        <Skeleton className="h-32 rounded-xl mb-4" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  // 에러 상태
  if (error && !data.currentWeight && data.records.length === 0) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6" data-testid="weight-goal-page">
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadData} variant="outline">
            다시 시도하기
          </Button>
        </div>
      </div>
    );
  }

  const progress = getProgress();
  const isLosing =
    data.goalWeight !== null && data.currentWeight !== null && data.goalWeight < data.currentWeight;

  return (
    <div className="container max-w-lg mx-auto px-4 py-6" data-testid="weight-goal-page">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Scale className="h-6 w-6 text-blue-500" />
          체중 목표
        </h1>
        <p className="text-sm text-muted-foreground mt-1">목표를 설정하고 꾸준히 기록해보세요</p>
      </div>

      {/* 에러 배너 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 현재 체중 + 목표 */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-center flex-1">
              <p className="text-sm text-muted-foreground mb-1">현재 체중</p>
              <p className="text-3xl font-bold text-foreground">
                {data.currentWeight ? `${data.currentWeight}kg` : '--'}
              </p>
            </div>
            <div className="flex flex-col items-center px-4">
              {isLosing ? (
                <TrendingDown className="h-5 w-5 text-blue-500" />
              ) : (
                <TrendingUp className="h-5 w-5 text-green-500" />
              )}
            </div>
            <div className="text-center flex-1">
              <p className="text-sm text-muted-foreground mb-1">목표 체중</p>
              {data.goalWeight ? (
                <p className="text-3xl font-bold text-primary">{data.goalWeight}kg</p>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowGoalInput(true)}>
                  <Target className="h-4 w-4 mr-1" />
                  설정하기
                </Button>
              )}
            </div>
          </div>

          {/* 진행률 바 */}
          {data.currentWeight && data.goalWeight && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">진행률</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {data.currentWeight !== data.goalWeight && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  목표까지 {Math.abs(data.currentWeight - data.goalWeight).toFixed(1)}kg 남았어요
                </p>
              )}
              {data.currentWeight === data.goalWeight && (
                <p className="text-xs text-green-600 text-center mt-2 font-medium">
                  목표를 달성했어요!
                </p>
              )}
            </div>
          )}

          {/* 목표 변경 */}
          {data.goalWeight && !showGoalInput && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-muted-foreground"
              onClick={() => {
                setGoalInput(String(data.goalWeight));
                setShowGoalInput(true);
              }}
            >
              목표 변경하기
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 목표 설정 입력 */}
      {showGoalInput && (
        <Card className="mb-4 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">목표 체중 설정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="목표 체중 (kg)"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                  min={20}
                  max={300}
                  step={0.1}
                />
              </div>
              <Button onClick={handleSetGoal} size="sm">
                저장
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowGoalInput(false)}>
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 기록 추가 버튼 */}
      {!showInput ? (
        <Button className="w-full mb-4" onClick={() => setShowInput(true)}>
          <Plus className="h-4 w-4 mr-2" />
          체중 기록하기
        </Button>
      ) : (
        <Card className="mb-4 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">오늘의 체중</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 items-center">
              <div className="flex items-center border rounded-lg overflow-hidden flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-3"
                  onClick={() => {
                    const val = parseFloat(inputWeight) || 0;
                    setInputWeight(String(Math.max(20, val - 0.1).toFixed(1)));
                  }}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <input
                  type="number"
                  value={inputWeight}
                  onChange={(e) => setInputWeight(e.target.value)}
                  placeholder="체중 (kg)"
                  className="flex-1 px-2 py-2 text-center text-sm bg-background border-0 focus:outline-none"
                  min={20}
                  max={300}
                  step={0.1}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-3"
                  onClick={() => {
                    const val = parseFloat(inputWeight) || 0;
                    setInputWeight(String(Math.min(300, val + 0.1).toFixed(1)));
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">kg</span>
            </div>
            <input
              type="text"
              value={inputNote}
              onChange={(e) => setInputNote(e.target.value)}
              placeholder="메모 (선택)"
              className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
            />
            <div className="flex gap-2">
              <Button onClick={handleAddRecord} className="flex-1">
                저장하기
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowInput(false);
                  setInputWeight('');
                  setInputNote('');
                }}
              >
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 최근 기록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            최근 기록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.records.length === 0 ? (
            <div className="text-center py-8">
              <Scale className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                아직 기록이 없어요.
                <br />첫 번째 체중을 기록해보세요!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.records.slice(0, 10).map((record, index) => {
                const prevRecord = data.records[index + 1];
                const diff = prevRecord ? record.weight - prevRecord.weight : null;

                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{record.weight}kg</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.date).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                      </p>
                      {record.note && (
                        <p className="text-xs text-muted-foreground mt-0.5">{record.note}</p>
                      )}
                    </div>
                    {diff !== null && (
                      <span
                        className={`text-xs font-medium ${
                          diff < 0
                            ? 'text-blue-500'
                            : diff > 0
                              ? 'text-red-500'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {diff > 0 ? '+' : ''}
                        {diff.toFixed(1)}kg
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
