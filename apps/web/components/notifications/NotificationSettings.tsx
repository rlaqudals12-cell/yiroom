'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell,
  BellOff,
  Dumbbell,
  Utensils,
  Flame,
  Sparkles,
  Smartphone,
  Loader2,
  Droplets,
  Users,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  loadNotificationSettings as loadLocalSettings,
  saveNotificationSettings as saveLocalSettings,
  showTestNotification,
  startReminderSchedule,
  stopReminderSchedule,
} from '@/lib/notifications';
import {
  isPushSupported,
  getPushSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
} from '@/lib/push';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import type { NotificationSettings as DbNotificationSettings } from '@/types/notifications';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/types/notifications';

// 시간 옵션 생성 (30분 단위)
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${minute}`;
});

// 수분 섭취 알림 간격 옵션 (시간 단위)
const WATER_INTERVAL_OPTIONS = [1, 2, 3, 4] as const;

/**
 * 알림 설정 컴포넌트
 * 브라우저 푸시 알림 권한 요청 및 리마인더 설정
 * DB에 설정 저장, localStorage를 fallback으로 사용
 */
export function NotificationSettings() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [settings, setSettings] = useState<DbNotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Web Push 상태
  const [isPushActive, setIsPushActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);

  // 설정 변경 디바운스를 위한 ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // Push 상태 확인
  const checkPushStatus = useCallback(async () => {
    if (!isPushSupported()) return;

    const status = await getPushSubscriptionStatus();
    setIsPushActive(status.isSubscribed);
  }, []);

  // DB에서 설정 로드
  const loadSettingsFromDb = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();

      if (data.success && data.data) {
        return data.data as DbNotificationSettings;
      }
      return null;
    } catch (error) {
      console.error('[NotificationSettings] Failed to load from DB:', error);
      return null;
    }
  }, []);

  // DB에 설정 저장
  const saveSettingsToDb = useCallback(async (newSettings: DbNotificationSettings) => {
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('[NotificationSettings] Failed to save to DB:', error);
      return false;
    }
  }, []);

  // localStorage에서 기존 설정 마이그레이션 (DB 타입으로 변환)
  const migrateLocalSettings = useCallback((): DbNotificationSettings => {
    const localSettings = loadLocalSettings();
    return {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      enabled: localSettings.enabled,
      workoutReminder: localSettings.workoutReminder,
      workoutReminderTime: localSettings.reminderTime,
      nutritionReminder: localSettings.nutritionReminder,
      streakWarning: localSettings.streakWarning,
    };
  }, []);

  // localStorage에 설정 저장 (기존 형식으로 변환)
  const saveToLocalStorage = useCallback((newSettings: DbNotificationSettings) => {
    saveLocalSettings({
      enabled: newSettings.enabled,
      reminderTime: newSettings.workoutReminderTime,
      workoutReminder: newSettings.workoutReminder,
      nutritionReminder: newSettings.nutritionReminder,
      streakWarning: newSettings.streakWarning,
    });
  }, []);

  // 초기화: DB에서 설정 로드, fallback으로 localStorage
  useEffect(() => {
    const initializeSettings = async () => {
      const supported = isNotificationSupported();
      setIsSupported(supported);

      if (!supported) {
        setIsInitialLoading(false);
        return;
      }

      setPermission(getNotificationPermission());
      checkPushStatus();

      // 로그인한 사용자는 DB에서 로드
      if (isUserLoaded && user) {
        const dbSettings = await loadSettingsFromDb();
        if (dbSettings) {
          setSettings(dbSettings);
          // DB 설정을 localStorage에도 동기화 (오프라인 fallback)
          saveToLocalStorage(dbSettings);
        } else {
          // DB에 없으면 localStorage에서 마이그레이션
          const migrated = migrateLocalSettings();
          setSettings(migrated);
        }
      } else if (isUserLoaded) {
        // 비로그인 사용자는 localStorage만 사용
        const migrated = migrateLocalSettings();
        setSettings(migrated);
      }

      setIsInitialLoading(false);
    };

    initializeSettings();
  }, [
    isUserLoaded,
    user,
    checkPushStatus,
    loadSettingsFromDb,
    migrateLocalSettings,
    saveToLocalStorage,
  ]);

  // 설정 변경 시 저장 (디바운스 적용)
  useEffect(() => {
    // 첫 렌더링이거나 초기 로딩 중이면 저장하지 않음
    if (isFirstRender.current || isInitialLoading) {
      isFirstRender.current = false;
      return;
    }

    // localStorage에 즉시 저장 (오프라인 fallback)
    saveToLocalStorage(settings);

    // 스케줄 관리
    if (settings.enabled && permission === 'granted') {
      startReminderSchedule();
    } else {
      stopReminderSchedule();
    }

    // DB 저장 디바운스 (500ms)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (user) {
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        const success = await saveSettingsToDb(settings);
        setIsSaving(false);

        if (!success) {
          console.warn('[NotificationSettings] DB save failed, localStorage backup used');
        }
      }, 500);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [settings, permission, user, isInitialLoading, saveToLocalStorage, saveSettingsToDb]);

  // 알림 권한 요청 + Push 구독
  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);

      if (result === 'granted') {
        // Push 구독 시도
        const subscription = await subscribeToPush();
        if (subscription) {
          setIsPushActive(true);
          toast.success('푸시 알림이 활성화되었습니다!');
        } else {
          toast.success('알림 권한이 허용되었습니다!');
        }
        setSettings((prev) => ({ ...prev, enabled: true }));
        showTestNotification();
      } else if (result === 'denied') {
        toast.error('알림 권한이 거부되었습니다. 브라우저 설정에서 변경할 수 있습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Push 구독 토글
  const handlePushToggle = async () => {
    setIsLoading(true);
    try {
      if (isPushActive) {
        const success = await unsubscribeFromPush();
        if (success) {
          setIsPushActive(false);
          toast.success('백그라운드 푸시 알림이 비활성화되었습니다.');
        }
      } else {
        const subscription = await subscribeToPush();
        if (subscription) {
          setIsPushActive(true);
          toast.success('백그라운드 푸시 알림이 활성화되었습니다!');
        } else {
          toast.error('푸시 알림 등록에 실패했습니다.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 푸시 테스트
  const handleTestPush = async () => {
    setIsTestingPush(true);
    try {
      const success = await sendTestPush();
      if (success) {
        toast.success('테스트 푸시 알림을 발송했습니다!');
      } else {
        toast.error('푸시 알림 발송에 실패했습니다.');
      }
    } finally {
      setIsTestingPush(false);
    }
  };

  // 설정 변경 핸들러
  const handleToggle = (key: keyof DbNotificationSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTimeChange = (key: keyof DbNotificationSettings, time: string) => {
    setSettings((prev) => ({ ...prev, [key]: time }));
    toast.success(`시간이 ${time}으로 설정되었습니다.`);
  };

  const handleIntervalChange = (interval: number) => {
    setSettings((prev) => ({ ...prev, waterReminderInterval: interval }));
    toast.success(`수분 섭취 알림 간격이 ${interval}시간으로 설정되었습니다.`);
  };

  // 지원하지 않는 브라우저
  if (!isSupported) {
    return (
      <Card data-testid="notification-settings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5 text-muted-foreground" />
            알림 설정
          </CardTitle>
          <CardDescription>이 브라우저는 푸시 알림을 지원하지 않습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 로딩 중
  if (isInitialLoading) {
    return (
      <Card data-testid="notification-settings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            알림 설정
          </CardTitle>
          <CardDescription>설정을 불러오는 중...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="notification-settings">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-500" />
          알림 설정
          {isSaving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </CardTitle>
        <CardDescription>리마인더 알림을 설정하여 꾸준한 기록을 유지하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 권한 요청 */}
        {permission !== 'granted' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-900 mb-1">알림 권한 필요</p>
                <p className="text-sm text-amber-700 mb-3">
                  리마인더 알림을 받으려면 브라우저 알림 권한이 필요합니다.
                </p>
                <Button
                  onClick={handleRequestPermission}
                  className="bg-amber-500 hover:bg-amber-600"
                  size="sm"
                  disabled={permission === 'denied' || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      처리 중...
                    </>
                  ) : permission === 'denied' ? (
                    '권한 거부됨'
                  ) : (
                    '알림 허용하기'
                  )}
                </Button>
                {permission === 'denied' && (
                  <p className="text-xs text-amber-600 mt-2">
                    브라우저 설정에서 알림 권한을 변경할 수 있습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 알림 활성화 토글 */}
        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="font-medium">알림 활성화</p>
              <p className="text-sm text-muted-foreground">리마인더 알림 받기</p>
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={() => handleToggle('enabled')}
            disabled={permission !== 'granted'}
            data-testid="notification-toggle"
          />
        </div>

        {/* 백그라운드 푸시 알림 (Web Push) */}
        {permission === 'granted' && isPushSupported() && (
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-purple-500" aria-hidden="true" />
              <div>
                <p className="font-medium">백그라운드 푸시</p>
                <p className="text-sm text-muted-foreground">앱이 꺼져 있어도 알림 받기</p>
              </div>
            </div>
            <Switch
              checked={isPushActive}
              onCheckedChange={handlePushToggle}
              disabled={isLoading || !settings.enabled}
              data-testid="push-toggle"
            />
          </div>
        )}

        {/* 운동 리마인더 */}
        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-5 h-5 text-blue-500" aria-hidden="true" />
            <div>
              <p className="font-medium">운동 리마인더</p>
              <p className="text-sm text-muted-foreground">운동 기록 알림</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={settings.workoutReminderTime}
              onValueChange={(time) => handleTimeChange('workoutReminderTime', time)}
              disabled={!settings.enabled || !settings.workoutReminder}
            >
              <SelectTrigger className="w-20" data-testid="workout-time-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Switch
              checked={settings.workoutReminder}
              onCheckedChange={() => handleToggle('workoutReminder')}
              disabled={!settings.enabled}
              data-testid="workout-reminder-toggle"
            />
          </div>
        </div>

        {/* Streak 경고 */}
        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-orange-500" aria-hidden="true" />
            <div>
              <p className="font-medium">Streak 끊김 경고</p>
              <p className="text-sm text-muted-foreground">연속 기록이 끊길 위험 시 알림</p>
            </div>
          </div>
          <Switch
            checked={settings.streakWarning}
            onCheckedChange={() => handleToggle('streakWarning')}
            disabled={!settings.enabled}
            data-testid="streak-warning-toggle"
          />
        </div>

        {/* 식단 리마인더 */}
        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-3">
            <Utensils className="w-5 h-5 text-green-500" aria-hidden="true" />
            <div>
              <p className="font-medium">식단 리마인더</p>
              <p className="text-sm text-muted-foreground">식단 기록 알림</p>
            </div>
          </div>
          <Switch
            checked={settings.nutritionReminder}
            onCheckedChange={() => handleToggle('nutritionReminder')}
            disabled={!settings.enabled}
            data-testid="nutrition-reminder-toggle"
          />
        </div>

        {/* 식단 시간대별 알림 (영양 리마인더 활성화 시) */}
        {settings.nutritionReminder && settings.enabled && (
          <div className="ml-8 space-y-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">아침</p>
              <Select
                value={settings.mealReminderBreakfast}
                onValueChange={(time) => handleTimeChange('mealReminderBreakfast', time)}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">점심</p>
              <Select
                value={settings.mealReminderLunch}
                onValueChange={(time) => handleTimeChange('mealReminderLunch', time)}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">저녁</p>
              <Select
                value={settings.mealReminderDinner}
                onValueChange={(time) => handleTimeChange('mealReminderDinner', time)}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* 수분 섭취 알림 */}
        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-3">
            <Droplets className="w-5 h-5 text-cyan-500" aria-hidden="true" />
            <div>
              <p className="font-medium">수분 섭취 알림</p>
              <p className="text-sm text-muted-foreground">물 마시기 알림</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(settings.waterReminderInterval)}
              onValueChange={(val) => handleIntervalChange(Number(val))}
              disabled={!settings.enabled || !settings.waterReminder}
            >
              <SelectTrigger className="w-20" data-testid="water-interval-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WATER_INTERVAL_OPTIONS.map((interval) => (
                  <SelectItem key={interval} value={String(interval)}>
                    {interval}시간
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Switch
              checked={settings.waterReminder}
              onCheckedChange={() => handleToggle('waterReminder')}
              disabled={!settings.enabled}
              data-testid="water-reminder-toggle"
            />
          </div>
        </div>

        {/* 소셜 알림 */}
        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-indigo-500" aria-hidden="true" />
            <div>
              <p className="font-medium">소셜 알림</p>
              <p className="text-sm text-muted-foreground">친구 활동, 댓글, 좋아요 알림</p>
            </div>
          </div>
          <Switch
            checked={settings.socialNotifications}
            onCheckedChange={() => handleToggle('socialNotifications')}
            disabled={!settings.enabled}
            data-testid="social-notifications-toggle"
          />
        </div>

        {/* 성취 알림 */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-yellow-500" aria-hidden="true" />
            <div>
              <p className="font-medium">성취 알림</p>
              <p className="text-sm text-muted-foreground">배지, 레벨업, 목표 달성 알림</p>
            </div>
          </div>
          <Switch
            checked={settings.achievementNotifications}
            onCheckedChange={() => handleToggle('achievementNotifications')}
            disabled={!settings.enabled}
            data-testid="achievement-notifications-toggle"
          />
        </div>

        {/* 테스트 알림 */}
        {settings.enabled && permission === 'granted' && (
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                showTestNotification();
                toast.success('테스트 알림을 보냈습니다!');
              }}
              data-testid="test-notification-button"
            >
              브라우저 알림 테스트
            </Button>
            {isPushActive && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleTestPush}
                disabled={isTestingPush}
                data-testid="test-push-button"
              >
                {isTestingPush ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    발송 중...
                  </>
                ) : (
                  '서버 푸시 알림 테스트'
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NotificationSettings;
