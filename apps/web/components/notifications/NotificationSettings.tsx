'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  BellOff,
  Clock,
  Dumbbell,
  Utensils,
  Flame,
  Sparkles,
  Smartphone,
  Loader2,
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
  loadNotificationSettings,
  saveNotificationSettings,
  showTestNotification,
  startReminderSchedule,
  stopReminderSchedule,
  type NotificationSettings as NotificationSettingsType,
} from '@/lib/notifications';
import {
  isPushSupported,
  getPushSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
} from '@/lib/push';
import { toast } from 'sonner';

// 시간 옵션 생성 (30분 단위)
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${minute}`;
});

/**
 * 알림 설정 컴포넌트
 * 브라우저 푸시 알림 권한 요청 및 리마인더 설정
 */
export function NotificationSettings() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [settings, setSettings] = useState<NotificationSettingsType>({
    enabled: false,
    reminderTime: '09:00',
    workoutReminder: true,
    nutritionReminder: true,
    streakWarning: true,
  });

  // Web Push 상태
  const [isPushActive, setIsPushActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);

  // Push 상태 확인
  const checkPushStatus = useCallback(async () => {
    if (!isPushSupported()) return;

    const status = await getPushSubscriptionStatus();
    setIsPushActive(status.isSubscribed);
  }, []);

  // 초기화
  useEffect(() => {
    const supported = isNotificationSupported();
    setIsSupported(supported);

    if (supported) {
      setPermission(getNotificationPermission());
      setSettings(loadNotificationSettings());
      checkPushStatus();
    }
  }, [checkPushStatus]);

  // 설정 변경 시 저장 및 스케줄 관리
  useEffect(() => {
    saveNotificationSettings(settings);

    if (settings.enabled && permission === 'granted') {
      startReminderSchedule();
    } else {
      stopReminderSchedule();
    }
  }, [settings, permission]);

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
  const handleToggle = (key: keyof NotificationSettingsType) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTimeChange = (time: string) => {
    setSettings((prev) => ({ ...prev, reminderTime: time }));
    toast.success(`리마인더 시간이 ${time}으로 설정되었습니다.`);
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

  return (
    <Card data-testid="notification-settings">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-500" />
          알림 설정
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

        {/* 리마인더 시간 */}
        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="font-medium">리마인더 시간</p>
              <p className="text-sm text-muted-foreground">매일 알림 받을 시간</p>
            </div>
          </div>
          <Select
            value={settings.reminderTime}
            onValueChange={handleTimeChange}
            disabled={!settings.enabled}
          >
            <SelectTrigger className="w-24" data-testid="reminder-time-select">
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

        {/* 운동 리마인더 */}
        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-5 h-5 text-blue-500" aria-hidden="true" />
            <div>
              <p className="font-medium">운동 리마인더</p>
              <p className="text-sm text-muted-foreground">운동 기록 알림</p>
            </div>
          </div>
          <Switch
            checked={settings.workoutReminder}
            onCheckedChange={() => handleToggle('workoutReminder')}
            disabled={!settings.enabled}
            data-testid="workout-reminder-toggle"
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

        {/* Streak 경고 */}
        <div className="flex items-center justify-between py-3">
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
