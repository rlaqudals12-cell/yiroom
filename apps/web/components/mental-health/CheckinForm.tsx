'use client';

import { useState } from 'react';
import { MoodSelector } from './MoodSelector';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, Moon, Battery, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckinFormProps {
  onSubmit: (data: CheckinData) => Promise<void>;
  initialData?: Partial<CheckinData>;
  isLoading?: boolean;
}

export interface CheckinData {
  moodScore: number;
  stressLevel: number;
  sleepHours: number;
  sleepQuality: number;
  energyLevel: number;
  notes?: string;
}

export function CheckinForm({ onSubmit, initialData, isLoading }: CheckinFormProps) {
  const [moodScore, setMoodScore] = useState<number | null>(initialData?.moodScore ?? null);
  const [stressLevel, setStressLevel] = useState(initialData?.stressLevel ?? 5);
  const [sleepHours, setSleepHours] = useState(initialData?.sleepHours ?? 7);
  const [sleepQuality, setSleepQuality] = useState(initialData?.sleepQuality ?? 3);
  const [energyLevel, setEnergyLevel] = useState(initialData?.energyLevel ?? 3);
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (moodScore === null) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        moodScore,
        stressLevel,
        sleepHours,
        sleepQuality,
        energyLevel,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ENERGY_EMOJIS = ['🪫', '🔋', '⚡', '💪', '🔥'];
  const SLEEP_LABELS = ['매우 나쁨', '나쁨', '보통', '좋음', '매우 좋음'];
  const SLEEP_HOURS_OPTIONS = [4, 5, 6, 7, 8, 9, 10];

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="checkin-form">
      {/* 기분 선택 */}
      <section>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <span>오늘 기분은 어떠세요?</span>
          {moodScore && <span className="text-primary">✓</span>}
        </h3>
        <MoodSelector value={moodScore} onChange={setMoodScore} disabled={isLoading} />
      </section>

      {/* 스트레스 레벨 */}
      <section>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4" />
          <span>스트레스 레벨</span>
          <span className="ml-auto text-muted-foreground">{stressLevel}/10</span>
        </h3>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setStressLevel(level)}
              disabled={isLoading}
              className={cn(
                'flex-1 py-2 rounded text-xs font-medium transition-colors',
                stressLevel === level
                  ? level <= 3
                    ? 'bg-green-500 text-white'
                    : level <= 6
                      ? 'bg-yellow-500 text-white'
                      : 'bg-red-500 text-white'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {level}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>낮음</span>
          <span>높음</span>
        </div>
      </section>

      {/* 수면 */}
      <section className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Moon className="w-4 h-4" />
            <span>수면 시간</span>
          </h3>
          <div className="flex flex-wrap gap-1">
            {SLEEP_HOURS_OPTIONS.map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => setSleepHours(hours)}
                disabled={isLoading}
                className={cn(
                  'px-3 py-2 rounded text-xs font-medium transition-colors',
                  sleepHours === hours
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                {hours}h
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-3">수면 품질</h3>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setSleepQuality(q)}
                disabled={isLoading}
                className={cn(
                  'flex-1 py-2 rounded text-xs transition-colors',
                  sleepQuality === q
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                {q}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-1">
            {SLEEP_LABELS[sleepQuality - 1]}
          </p>
        </div>
      </section>

      {/* 에너지 레벨 */}
      <section>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Battery className="w-4 h-4" />
          <span>에너지 레벨</span>
        </h3>
        <div className="flex justify-between gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setEnergyLevel(level)}
              disabled={isLoading}
              className={cn(
                'flex-1 py-3 rounded-lg text-xl transition-all',
                energyLevel === level
                  ? 'bg-primary/10 ring-2 ring-primary scale-105'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {ENERGY_EMOJIS[level - 1]}
            </button>
          ))}
        </div>
      </section>

      {/* 메모 */}
      <section>
        <h3 className="text-sm font-medium mb-3">오늘의 메모 (선택)</h3>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="오늘 하루는 어땠나요?"
          disabled={isLoading}
          className="resize-none"
          rows={3}
        />
      </section>

      {/* 제출 버튼 */}
      <Button
        type="submit"
        className="w-full"
        disabled={moodScore === null || isSubmitting || isLoading}
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            저장 중...
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            저장 완료!
          </>
        ) : (
          '체크인 완료'
        )}
      </Button>
    </form>
  );
}

export default CheckinForm;
