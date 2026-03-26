'use client';

import { useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Droplets,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  GlassWater,
  Clock,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// 물 섭취 기록
interface WaterRecord {
  id: string;
  amount: number;
  time: string;
}

// 목표 섭취량 (ml)
const DAILY_GOAL = 2000;
// 빠른 추가 옵션
const QUICK_ADD_OPTIONS = [
  { amount: 250, label: '한 컵', icon: GlassWater },
  { amount: 500, label: '물병', icon: Droplets },
];

export default function WaterPage(): React.ReactElement {
  const { user, isLoaded } = useUser();
  const [records, setRecords] = useState<WaterRecord[]>([
    { id: '1', amount: 250, time: '08:30' },
    { id: '2', amount: 500, time: '10:15' },
    { id: '3', amount: 250, time: '12:00' },
  ]);

  // 오늘 총 섭취량
  const totalIntake = records.reduce((sum, r) => sum + r.amount, 0);
  // 진행률 (최대 100%)
  const progressPercent = Math.min((totalIntake / DAILY_GOAL) * 100, 100);

  // 물 추가
  const addWater = useCallback((amount: number): void => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newRecord: WaterRecord = {
      id: Date.now().toString(),
      amount,
      time: timeStr,
    };
    setRecords((prev) => [newRecord, ...prev]);
  }, []);

  // 기록 삭제
  const removeRecord = useCallback((id: string): void => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // 로딩 상태
  if (!isLoaded) {
    return (
      <div
        data-testid="water-page-loading"
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
      <div data-testid="water-page-error" className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-lg font-semibold mb-1">로그인이 필요해요</p>
          <p className="text-muted-foreground">물 섭취 추적을 하려면 먼저 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="water-page" className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Droplets className="w-7 h-7 text-blue-500" />물 섭취 추적
        </h1>
        <p className="text-muted-foreground mt-1">
          하루 {(DAILY_GOAL / 1000).toFixed(1)}L 목표를 달성해보세요
        </p>
      </div>

      {/* 원형 프로그레스 + 오늘 섭취량 */}
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center">
            {/* CSS 원형 프로그레스 */}
            <div className="relative w-48 h-48 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* 배경 원 */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  className="text-muted/30"
                  strokeWidth="8"
                />
                {/* 진행 원 */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  className="text-blue-500 transition-all duration-700 ease-out"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPercent * 2.639} ${263.9 - progressPercent * 2.639}`}
                />
              </svg>
              {/* 중앙 텍스트 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{totalIntake}</span>
                <span className="text-sm text-muted-foreground">/ {DAILY_GOAL}ml</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4" />
              <span>{Math.round(progressPercent)}% 달성</span>
              {totalIntake >= DAILY_GOAL && (
                <span className="text-green-600 font-medium ml-2">목표 달성!</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 빠른 추가 버튼 */}
      <div className="grid grid-cols-2 gap-3">
        {QUICK_ADD_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <Button
              key={option.amount}
              variant="outline"
              className="h-16 flex-col gap-1"
              onClick={() => addWater(option.amount)}
            >
              <div className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <Icon className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xs text-muted-foreground">
                +{option.amount}ml ({option.label})
              </span>
            </Button>
          );
        })}
      </div>

      {/* 오늘의 기록 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            오늘의 기록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div data-testid="water-empty" className="text-center py-8">
              <GlassWater className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-muted-foreground">아직 기록이 없어요</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                위 버튼으로 물 섭취를 기록해보세요
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {records.map((record) => (
                <li
                  key={record.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <div>
                      <span className="font-medium">{record.amount}ml</span>
                      <span className="text-sm text-muted-foreground ml-2">{record.time}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeRecord(record.id)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
                    aria-label="기록 삭제"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
