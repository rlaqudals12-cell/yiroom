/**
 * N-1 간헐적 단식 설정 페이지 (Task 2.16)
 *
 * 간헐적 단식 설정:
 * - 단식 활성화/비활성화 토글
 * - 단식 유형 선택 (16:8, 18:6, 20:4, 커스텀)
 * - 단식 시작 시간 설정
 * - 식사 가능 시간대 표시
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Moon, Sun, Clock, Check } from 'lucide-react';

// 단식 유형 옵션
const FASTING_TYPES = [
  {
    id: '16:8',
    name: '16:8',
    fastingHours: 16,
    eatingHours: 8,
    description: '16시간 단식, 8시간 식사',
  },
  {
    id: '18:6',
    name: '18:6',
    fastingHours: 18,
    eatingHours: 6,
    description: '18시간 단식, 6시간 식사',
  },
  {
    id: '20:4',
    name: '20:4',
    fastingHours: 20,
    eatingHours: 4,
    description: '20시간 단식, 4시간 식사',
  },
  {
    id: 'custom',
    name: '커스텀',
    fastingHours: null,
    eatingHours: null,
    description: '직접 설정',
  },
];

interface FastingSettings {
  fastingEnabled: boolean;
  fastingType: string | null;
  fastingStartTime: string | null;
  eatingWindowHours: number | null;
}

export default function FastingSettingsPage() {
  const router = useRouter();

  // 상태 관리
  const [settings, setSettings] = useState<FastingSettings>({
    fastingEnabled: false,
    fastingType: null,
    fastingStartTime: null,
    eatingWindowHours: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 설정 불러오기
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/nutrition/settings');

      if (!response.ok) {
        throw new Error('설정을 불러오는 데 실패했어요');
      }

      const result = await response.json();
      const data = result.data;

      // API는 snake_case 반환, UI는 camelCase 사용
      setSettings({
        fastingEnabled: data?.fasting_enabled ?? false,
        fastingType: data?.fasting_type ?? null,
        fastingStartTime: data?.fasting_start_time ?? '20:00',
        eatingWindowHours: data?.eating_window_hours ?? 8,
      });
    } catch (err) {
      console.error('[N-1] Fasting settings fetch error:', err);
      setError('설정을 불러오는 중 오류가 발생했어요');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // 토글 핸들러
  const handleToggle = () => {
    setSettings((prev) => ({
      ...prev,
      fastingEnabled: !prev.fastingEnabled,
      // 활성화 시 기본값 설정
      fastingType: !prev.fastingEnabled ? prev.fastingType || '16:8' : prev.fastingType,
      fastingStartTime: !prev.fastingEnabled
        ? prev.fastingStartTime || '20:00'
        : prev.fastingStartTime,
      eatingWindowHours: !prev.fastingEnabled
        ? prev.eatingWindowHours || 8
        : prev.eatingWindowHours,
    }));
  };

  // 유형 선택 핸들러
  const handleTypeSelect = (typeId: string) => {
    const selectedType = FASTING_TYPES.find((t) => t.id === typeId);
    setSettings((prev) => ({
      ...prev,
      fastingType: typeId,
      eatingWindowHours: selectedType?.eatingHours ?? prev.eatingWindowHours,
    }));
  };

  // 시간 변경 핸들러
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings((prev) => ({
      ...prev,
      fastingStartTime: e.target.value,
    }));
  };

  // 식사 가능 시간 변경 핸들러 (커스텀)
  const handleEatingHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 23) {
      setSettings((prev) => ({
        ...prev,
        eatingWindowHours: value,
      }));
    }
  };

  // 식사 가능 시간대 계산
  const calculateEatingWindow = (): string => {
    if (!settings.fastingStartTime || !settings.eatingWindowHours) {
      return '';
    }

    const [startHour, startMinute] = settings.fastingStartTime.split(':').map(Number);
    const fastingHours = 24 - settings.eatingWindowHours;

    // 식사 시작 시간 = 단식 시작 시간 + 단식 시간
    const eatingStartHour = (startHour + fastingHours) % 24;
    const eatingEndHour = startHour;

    const formatTime = (hour: number, minute: number = 0) => {
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };

    return `${formatTime(eatingStartHour, startMinute)} ~ ${formatTime(eatingEndHour, startMinute)}`;
  };

  // 저장 핸들러
  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/nutrition/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fasting_enabled: settings.fastingEnabled,
          fasting_type: settings.fastingType,
          fasting_start_time: settings.fastingStartTime,
          eating_window_hours: settings.eatingWindowHours,
        }),
      });

      if (!response.ok) {
        throw new Error('저장에 실패했어요');
      }

      router.back();
    } catch (err) {
      console.error('[N-1] Fasting settings save error:', err);
      setError('저장 중 오류가 발생했어요');
    } finally {
      setIsSaving(false);
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div data-testid="fasting-loading" className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  // 에러 상태
  if (error && !settings.fastingEnabled && isLoading === false) {
    return (
      <div data-testid="fasting-settings-page" className="min-h-screen bg-muted p-4">
        <div className="mx-auto max-w-md">
          <div className="rounded-lg bg-red-50 p-6 text-center">
            <p className="mb-4 text-red-600">{error}</p>
            <button
              onClick={fetchSettings}
              className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="fasting-settings-page" className="min-h-screen bg-muted">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label="뒤로가기"
            className="rounded-full p-2 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">간헐적 단식</h1>
        </div>
      </header>

      {/* 콘텐츠 */}
      <div className="mx-auto max-w-md p-4">
        {/* 단식 활성화 토글 */}
        <div className="mb-6 rounded-xl bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2">
                <Moon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">간헐적 단식</p>
                <p className="text-sm text-muted-foreground">단식 시간을 관리하세요</p>
              </div>
            </div>
            <button
              data-testid="fasting-toggle"
              onClick={handleToggle}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                settings.fastingEnabled ? 'bg-green-500' : 'bg-muted-foreground'
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  settings.fastingEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 단식 활성화 시에만 설정 표시 */}
        {settings.fastingEnabled && (
          <>
            {/* 단식 유형 선택 */}
            <div className="mb-6 rounded-xl bg-card p-4 shadow-sm">
              <h2 className="mb-4 font-medium">단식 유형</h2>
              <div className="grid grid-cols-2 gap-3">
                {FASTING_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className={`relative rounded-lg border-2 p-3 text-left transition-all ${
                      settings.fastingType === type.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-border hover:border-border/80'
                    }`}
                  >
                    {settings.fastingType === type.id && (
                      <Check className="absolute right-2 top-2 h-4 w-4 text-green-500" />
                    )}
                    <p className="font-semibold">{type.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {type.id === 'custom'
                        ? '직접 설정'
                        : `${type.fastingHours}시간 단식, ${type.eatingHours}시간 식사`}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 단식 시작 시간 */}
            <div className="mb-6 rounded-xl bg-card p-4 shadow-sm">
              <label className="mb-3 block font-medium" htmlFor="fasting-start-time">
                단식 시작 시간
              </label>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <input
                  type="time"
                  id="fasting-start-time"
                  aria-label="단식 시작 시간"
                  value={settings.fastingStartTime || '20:00'}
                  onChange={handleTimeChange}
                  className="flex-1 rounded-lg border border-border px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            {/* 커스텀일 때 식사 가능 시간 입력 */}
            {settings.fastingType === 'custom' && (
              <div className="mb-6 rounded-xl bg-card p-4 shadow-sm">
                <label className="mb-3 block font-medium" htmlFor="eating-hours">
                  식사 가능 시간
                </label>
                <div className="flex items-center gap-3">
                  <Sun className="h-5 w-5 text-muted-foreground" />
                  <input
                    type="number"
                    id="eating-hours"
                    aria-label="식사 가능 시간"
                    min={1}
                    max={23}
                    value={settings.eatingWindowHours || 8}
                    onChange={handleEatingHoursChange}
                    className="w-20 rounded-lg border border-border px-3 py-2 text-center focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <span className="text-muted-foreground">시간</span>
                </div>
              </div>
            )}

            {/* 식사 가능 시간대 표시 */}
            <div className="mb-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Sun className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">식사 가능 시간</p>
                  <p className="text-xl font-bold text-green-700">{calculateEatingWindow()}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-xl bg-green-500 py-3 font-semibold text-white transition-colors hover:bg-green-600 disabled:bg-muted"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
