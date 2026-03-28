'use client';

import { memo, useState, useEffect } from 'react';
import { Moon, Droplets, Brain, Cloud, Sun as SunIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  LifestyleFactorsProps,
  SleepQualityScore,
  StressLevelScore,
  WeatherType,
} from '@/types/skin-diary';
import { WEATHER_EMOJIS, WEATHER_LABELS } from '@/types/skin-diary';
import { useTranslations } from 'next-intl';

/**
 * 생활 요인 입력 컴포넌트
 * - 수면 시간/품질
 * - 수분 섭취량
 * - 스트레스 레벨
 * - 날씨/외출 시간
 */
const LifestyleFactors = memo(function LifestyleFactors({
  sleepHours,
  sleepQuality,
  waterIntakeMl,
  stressLevel,
  weather,
  outdoorHours,
  onChange,
  className,
}: LifestyleFactorsProps) {
  const t = useTranslations('skinUI');
  // 로컬 상태 관리
  const [localSleepHours, setLocalSleepHours] = useState(sleepHours ?? 7);
  const [localSleepQuality, setLocalSleepQuality] = useState(sleepQuality ?? 3);
  const [localWaterIntake, setLocalWaterIntake] = useState(waterIntakeMl ?? 1500);
  const [localStressLevel, setLocalStressLevel] = useState(stressLevel ?? 3);
  const [localWeather, setLocalWeather] = useState<WeatherType | undefined>(weather);
  const [localOutdoorHours, setLocalOutdoorHours] = useState(outdoorHours ?? 0);

  // Props 변경 시 로컬 상태 업데이트
  useEffect(() => {
    if (sleepHours !== undefined) setLocalSleepHours(sleepHours);
    if (sleepQuality !== undefined) setLocalSleepQuality(sleepQuality);
    if (waterIntakeMl !== undefined) setLocalWaterIntake(waterIntakeMl);
    if (stressLevel !== undefined) setLocalStressLevel(stressLevel);
    if (weather !== undefined) setLocalWeather(weather);
    if (outdoorHours !== undefined) setLocalOutdoorHours(outdoorHours);
  }, [sleepHours, sleepQuality, waterIntakeMl, stressLevel, weather, outdoorHours]);

  // 변경 사항 부모에게 전달
  const notifyChange = (updates: Partial<LifestyleFactorsProps>) => {
    onChange({
      sleepHours: updates.sleepHours ?? localSleepHours,
      sleepQuality: (updates.sleepQuality ?? localSleepQuality) as SleepQualityScore,
      waterIntakeMl: updates.waterIntakeMl ?? localWaterIntake,
      stressLevel: (updates.stressLevel ?? localStressLevel) as StressLevelScore,
      weather: updates.weather ?? localWeather,
      outdoorHours: updates.outdoorHours ?? localOutdoorHours,
    });
  };

  const weatherTypes: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'cold', 'hot', 'humid', 'dry'];

  return (
    <div className={cn('space-y-6', className)} data-testid="lifestyle-factors">
      {/* 수면 섹션 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-indigo-500" aria-hidden="true" />
          <h3 className="text-sm font-medium">{t('lifestyleFactors0')}</h3>
        </div>

        {/* 수면 시간 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">{t('lifestyleFactors1')}</Label>
            <span className="text-sm font-medium">{localSleepHours.toFixed(1)}시간</span>
          </div>
          <Slider
            value={[localSleepHours]}
            onValueChange={([value]) => {
              setLocalSleepHours(value);
              notifyChange({ sleepHours: value });
            }}
            min={0}
            max={12}
            step={0.5}
            className="py-2"
            aria-label="수면 시간"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('lifestyleFactors2')}</span>
            <span>{t('lifestyleFactors3')}</span>
          </div>
        </div>

        {/* 수면 품질 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">{t('lifestyleFactors4')}</Label>
            <span className="text-sm font-medium">
              {
                [
                  t('lifestyleFactors5'),
                  t('lifestyleFactors6'),
                  t('lifestyleFactors7'),
                  t('lifestyleFactors8'),
                  t('lifestyleFactors9'),
                ][localSleepQuality - 1]
              }
            </span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((quality) => (
              <button
                key={quality}
                type="button"
                onClick={() => {
                  setLocalSleepQuality(quality as SleepQualityScore);
                  notifyChange({ sleepQuality: quality as SleepQualityScore });
                }}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                  localSleepQuality === quality
                    ? 'bg-indigo-500 text-white'
                    : 'bg-muted hover:bg-muted/80'
                )}
                aria-label={`수면 품질 ${quality}점`}
                aria-pressed={localSleepQuality === quality}
              >
                {quality}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 수분 섭취 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-500" aria-hidden="true" />
          <h3 className="text-sm font-medium">{t('lifestyleFactors11')}</h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">{t('lifestyleFactors12')}</Label>
            <span className="text-sm font-medium">{localWaterIntake.toLocaleString()}ml</span>
          </div>
          <Slider
            value={[localWaterIntake]}
            onValueChange={([value]) => {
              setLocalWaterIntake(value);
              notifyChange({ waterIntakeMl: value });
            }}
            min={0}
            max={3000}
            step={100}
            className="py-2"
            aria-label="수분 섭취량"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0ml</span>
            <span>3,000ml</span>
          </div>
        </div>
      </div>

      {/* 스트레스 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-rose-500" aria-hidden="true" />
          <h3 className="text-sm font-medium">{t('lifestyleFactors13')}</h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">{t('lifestyleFactors14')}</Label>
            <span className="text-sm font-medium">
              {
                [
                  t('lifestyleFactors15'),
                  t('lifestyleFactors16'),
                  t('lifestyleFactors7'),
                  t('lifestyleFactors17'),
                  t('lifestyleFactors18'),
                ][localStressLevel - 1]
              }
            </span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => {
                  setLocalStressLevel(level as StressLevelScore);
                  notifyChange({ stressLevel: level as StressLevelScore });
                }}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                  localStressLevel === level
                    ? 'bg-rose-500 text-white'
                    : 'bg-muted hover:bg-muted/80'
                )}
                aria-label={`스트레스 레벨 ${level}점`}
                aria-pressed={localStressLevel === level}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t('lifestyleFactors20')}</p>
        </div>
      </div>

      {/* 날씨 & 외출 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-sky-500" aria-hidden="true" />
          <h3 className="text-sm font-medium">{t('lifestyleFactors21')}</h3>
        </div>

        {/* 날씨 선택 */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">{t('lifestyleFactors22')}</Label>
          <div className="flex flex-wrap gap-2">
            {weatherTypes.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  setLocalWeather(w);
                  notifyChange({ weather: w });
                }}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1',
                  localWeather === w ? 'bg-sky-500 text-white' : 'bg-muted hover:bg-muted/80'
                )}
                aria-label={`날씨: ${WEATHER_LABELS[w]}`}
                aria-pressed={localWeather === w}
              >
                <span>{WEATHER_EMOJIS[w]}</span>
                <span>{WEATHER_LABELS[w]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 외출 시간 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <SunIcon className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <Label className="text-sm text-muted-foreground">{t('lifestyleFactors24')}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={localOutdoorHours}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                setLocalOutdoorHours(value);
                notifyChange({ outdoorHours: value });
              }}
              className="w-24"
              aria-label="외출 시간"
            />
            <span className="text-sm text-muted-foreground">{t('lifestyleFactors25')}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default LifestyleFactors;
