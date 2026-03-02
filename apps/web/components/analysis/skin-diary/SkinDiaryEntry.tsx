'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Sun,
  Cloud,
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  Moon,
  Droplet,
  Brain,
  Clock,
  Sparkles,
  Check,
  X,
} from 'lucide-react';

// 5점 척도 (피부 컨디션, 수면 품질, 스트레스 수준)
type FivePointScale = 1 | 2 | 3 | 4 | 5;

// 날씨 타입
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'cold' | 'hot' | 'humid' | 'dry';

// 다이어리 엔트리 타입
export interface DiaryEntry {
  skinCondition: FivePointScale;
  conditionNotes?: string;
  sleepHours?: number;
  sleepQuality?: FivePointScale;
  waterIntakeMl?: number;
  stressLevel?: FivePointScale;
  weather?: WeatherType;
  outdoorHours?: number;
  morningRoutineCompleted: boolean;
  eveningRoutineCompleted: boolean;
  specialTreatments: string[];
}

// 날씨 옵션
const WEATHER_OPTIONS: { value: WeatherType; label: string; icon: typeof Sun }[] = [
  { value: 'sunny', label: '맑음', icon: Sun },
  { value: 'cloudy', label: '흐림', icon: Cloud },
  { value: 'rainy', label: '비', icon: CloudRain },
  { value: 'cold', label: '추움', icon: Thermometer },
  { value: 'hot', label: '더움', icon: Thermometer },
  { value: 'humid', label: '습함', icon: Droplets },
  { value: 'dry', label: '건조', icon: Wind },
];

// 특별 케어 옵션
const SPECIAL_TREATMENTS = [
  '시트마스크',
  '필링',
  '에센스 집중케어',
  '수분팩',
  '클레이팩',
  '슬리핑팩',
  '스팟케어',
  '마사지',
];

// 컨디션 라벨
const CONDITION_LABELS: Record<number, string> = {
  1: '매우 나쁨',
  2: '나쁨',
  3: '보통',
  4: '좋음',
  5: '매우 좋음',
};

// 컨디션 이모지
const CONDITION_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
};

export interface SkinDiaryEntryProps {
  /** 날짜 */
  date: Date;
  /** 기존 엔트리 (수정 모드) */
  existingEntry?: Partial<DiaryEntry>;
  /** 저장 핸들러 */
  onSave: (entry: DiaryEntry) => Promise<void>;
  /** 취소 핸들러 */
  onCancel: () => void;
  /** 저장 중 상태 */
  isSaving?: boolean;
  className?: string;
}

/**
 * 피부 다이어리 엔트리 폼 컴포넌트
 */
export function SkinDiaryEntry({
  date,
  existingEntry,
  onSave,
  onCancel,
  isSaving = false,
  className,
}: SkinDiaryEntryProps) {
  // 폼 상태
  const [skinCondition, setSkinCondition] = useState<FivePointScale>(
    existingEntry?.skinCondition ?? 3
  );
  const [conditionNotes, setConditionNotes] = useState(existingEntry?.conditionNotes ?? '');
  const [sleepHours, setSleepHours] = useState(existingEntry?.sleepHours ?? 7);
  const [sleepQuality, setSleepQuality] = useState<FivePointScale>(
    existingEntry?.sleepQuality ?? 3
  );
  const [waterIntakeMl, setWaterIntakeMl] = useState(existingEntry?.waterIntakeMl ?? 1500);
  const [stressLevel, setStressLevel] = useState<FivePointScale>(
    existingEntry?.stressLevel ?? 3
  );
  const [weather, setWeather] = useState<WeatherType | undefined>(existingEntry?.weather);
  const [outdoorHours, setOutdoorHours] = useState(existingEntry?.outdoorHours ?? 1);
  const [morningRoutineCompleted, setMorningRoutineCompleted] = useState(
    existingEntry?.morningRoutineCompleted ?? false
  );
  const [eveningRoutineCompleted, setEveningRoutineCompleted] = useState(
    existingEntry?.eveningRoutineCompleted ?? false
  );
  const [specialTreatments, setSpecialTreatments] = useState<string[]>(
    existingEntry?.specialTreatments ?? []
  );

  // 특별 케어 토글
  const toggleTreatment = useCallback((treatment: string) => {
    setSpecialTreatments((prev) =>
      prev.includes(treatment) ? prev.filter((t) => t !== treatment) : [...prev, treatment]
    );
  }, []);

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    const entry: DiaryEntry = {
      skinCondition,
      conditionNotes: conditionNotes || undefined,
      sleepHours,
      sleepQuality,
      waterIntakeMl,
      stressLevel,
      weather,
      outdoorHours,
      morningRoutineCompleted,
      eveningRoutineCompleted,
      specialTreatments,
    };
    await onSave(entry);
  }, [
    skinCondition,
    conditionNotes,
    sleepHours,
    sleepQuality,
    waterIntakeMl,
    stressLevel,
    weather,
    outdoorHours,
    morningRoutineCompleted,
    eveningRoutineCompleted,
    specialTreatments,
    onSave,
  ]);

  // 날짜 포맷
  const formattedDate = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className={cn('space-y-4', className)} data-testid="skin-diary-entry">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-lg font-semibold">{formattedDate}</h2>
        <p className="text-sm text-muted-foreground">오늘의 피부 상태를 기록해주세요</p>
      </div>

      {/* 피부 컨디션 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            피부 컨디션
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 이모지 선택 */}
          <div className="flex justify-center gap-2">
            {([1, 2, 3, 4, 5] as const).map((value) => (
              <button
                key={value}
                onClick={() => setSkinCondition(value)}
                className={cn(
                  'w-12 h-12 rounded-full text-2xl transition-all',
                  skinCondition === value
                    ? 'bg-primary/20 ring-2 ring-primary scale-110'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                {CONDITION_EMOJIS[value]}
              </button>
            ))}
          </div>
          <div className="text-center text-sm text-muted-foreground">
            {CONDITION_LABELS[skinCondition]}
          </div>

          {/* 메모 */}
          <Textarea
            placeholder="오늘 피부 상태에 대해 간단히 메모해주세요 (선택)"
            value={conditionNotes}
            onChange={(e) => setConditionNotes(e.target.value)}
            className="resize-none"
            rows={2}
          />
        </CardContent>
      </Card>

      {/* 생활 요인 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="w-4 h-4 text-primary" />
            생활 요인
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 수면 시간 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">수면 시간</Label>
              <span className="text-sm font-medium">{sleepHours}시간</span>
            </div>
            <Slider
              value={[sleepHours]}
              onValueChange={(values: number[]) => setSleepHours(values[0])}
              min={0}
              max={12}
              step={0.5}
            />
          </div>

          {/* 수면 품질 */}
          <div className="space-y-2">
            <Label className="text-sm">수면 품질</Label>
            <div className="flex justify-center gap-1">
              {([1, 2, 3, 4, 5] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setSleepQuality(value)}
                  className={cn(
                    'w-8 h-8 rounded-md text-sm font-medium transition-all',
                    sleepQuality === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* 수분 섭취 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-1">
                <Droplet className="w-3 h-3" />
                수분 섭취
              </Label>
              <span className="text-sm font-medium">{waterIntakeMl}ml</span>
            </div>
            <Slider
              value={[waterIntakeMl]}
              onValueChange={(values: number[]) => setWaterIntakeMl(values[0])}
              min={0}
              max={3000}
              step={100}
            />
          </div>

          {/* 스트레스 */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1">
              <Brain className="w-3 h-3" />
              스트레스
            </Label>
            <div className="flex justify-center gap-1">
              {([1, 2, 3, 4, 5] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setStressLevel(value)}
                  className={cn(
                    'w-8 h-8 rounded-md text-sm font-medium transition-all',
                    stressLevel !== value && 'bg-muted hover:bg-muted/80',
                    stressLevel === value && value >= 4 && 'bg-destructive text-destructive-foreground',
                    stressLevel === value && value < 4 && 'bg-primary text-primary-foreground'
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground">1: 낮음 ~ 5: 높음</p>
          </div>
        </CardContent>
      </Card>

      {/* 외부 요인 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sun className="w-4 h-4 text-primary" />
            외부 요인
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 날씨 */}
          <div className="space-y-2">
            <Label className="text-sm">오늘 날씨</Label>
            <div className="flex flex-wrap gap-2">
              {WEATHER_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setWeather(value)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all',
                    weather === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 야외 활동 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-1">
                <Clock className="w-3 h-3" />
                야외 활동
              </Label>
              <span className="text-sm font-medium">{outdoorHours}시간</span>
            </div>
            <Slider
              value={[outdoorHours]}
              onValueChange={(values: number[]) => setOutdoorHours(values[0])}
              min={0}
              max={12}
              step={0.5}
            />
          </div>
        </CardContent>
      </Card>

      {/* 스킨케어 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="w-4 h-4 text-primary" />
            스킨케어
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 루틴 완료 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="morning-routine" className="text-sm">
              아침 루틴 완료
            </Label>
            <Switch
              id="morning-routine"
              checked={morningRoutineCompleted}
              onCheckedChange={setMorningRoutineCompleted}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="evening-routine" className="text-sm">
              저녁 루틴 완료
            </Label>
            <Switch
              id="evening-routine"
              checked={eveningRoutineCompleted}
              onCheckedChange={setEveningRoutineCompleted}
            />
          </div>

          {/* 특별 케어 */}
          <div className="space-y-2">
            <Label className="text-sm">오늘 한 특별 케어</Label>
            <div className="flex flex-wrap gap-2">
              {SPECIAL_TREATMENTS.map((treatment) => (
                <Badge
                  key={treatment}
                  variant={specialTreatments.includes(treatment) ? 'default' : 'outline'}
                  className="cursor-pointer transition-all"
                  onClick={() => toggleTreatment(treatment)}
                >
                  {specialTreatments.includes(treatment) && <Check className="w-3 h-3 mr-1" />}
                  {treatment}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isSaving}>
          <X className="w-4 h-4 mr-1" />
          취소
        </Button>
        <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>저장 중...</>
          ) : (
            <>
              <Check className="w-4 h-4 mr-1" />
              저장하기
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default SkinDiaryEntry;
