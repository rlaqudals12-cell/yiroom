'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useClerk, useUser, useAuth } from '@clerk/nextjs';
import { useTheme } from '@/components/providers/theme-provider';
import { useUserProfile, type GenderType } from '@/hooks/useUserProfile';
import {
  ArrowLeft,
  User,
  Bell,
  Palette,
  Shield,
  Database,
  Info,
  ChevronRight,
  Moon,
  Sun,
  Globe,
  Eye,
  Trash2,
  FileText,
  Lock,
  LogOut,
  Users,
  Dumbbell,
  UtensilsCrossed,
  Droplets,
} from 'lucide-react';
import type { NotificationSettings } from '@/types/notifications';
import { DEFAULT_NOTIFICATION_SETTINGS as DB_DEFAULT_SETTINGS } from '@/types/notifications';
import { FadeInUp } from '@/components/animations';
import { cn } from '@/lib/utils';
import { FEATURE_FLAGS } from '@yiroom/shared';
import {
  DeleteAccountDialog,
  DataExportButton,
  PhysicalInfoCard,
  AllergyInfoCard,
} from '@/components/settings';
import { useColorBlindMode } from '@/hooks/useColorBlindMode';

/**
 * 설정 페이지 - UX 리스트럭처링
 * - 계정 설정 (이름, 이메일, 프로필 사진)
 * - 알림 설정 (토글: 푸시, 이메일, 마케팅)
 * - 앱 설정 (테마, 언어)
 * - 데이터 관리 (내보내기, 삭제)
 * - 앱 정보 (버전, 이용약관, 개인정보처리방침)
 *
 * 개인정보 공개 토글(프로필/활동/리더보드)은 읽는 곳이 없는 무효 설정이라 제거 (정직 원칙)
 */

type ThemeOption = 'light' | 'dark' | 'system';
type SettingsTab = 'account' | 'notifications' | 'app' | 'data' | 'info';

interface SettingSection {
  id: SettingsTab;
  label: string;
  icon: typeof User;
}

const settingsSections: SettingSection[] = [
  { id: 'account', label: '계정', icon: User },
  { id: 'notifications', label: '알림', icon: Bell },
  { id: 'app', label: '앱 설정', icon: Palette },
  { id: 'data', label: '데이터 관리', icon: Database },
  { id: 'info', label: '앱 정보', icon: Info },
];

// 시간 선택 옵션 (HH:00 ~ HH:30)
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

// 시간 선택 컴포넌트
function TimePicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (time: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'px-3 py-1.5 text-sm rounded-lg border bg-card text-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-label="시간 선택"
    >
      {TIME_OPTIONS.map((time) => (
        <option key={time} value={time}>
          {time}
        </option>
      ))}
    </select>
  );
}

// Toggle 컴포넌트
function Toggle({
  enabled,
  onChange,
  disabled = false,
  label,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors',
        enabled ? 'bg-primary' : 'bg-muted',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <div
        className={cn(
          'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

// SettingItem 컴포넌트
function SettingItem({
  icon: Icon,
  label,
  description,
  action,
  onClick,
  danger,
}: {
  icon: typeof User;
  label: string;
  description?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            danger ? 'bg-destructive/10' : 'bg-muted'
          )}
        >
          <Icon className={cn('w-5 h-5', danger ? 'text-destructive' : 'text-muted-foreground')} />
        </div>
        <div className="flex-1">
          <p className={cn('font-medium', danger ? 'text-destructive' : 'text-foreground')}>
            {label}
          </p>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {action || (onClick && <ChevronRight className="w-5 h-5 text-muted-foreground" />)}
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 bg-card rounded-xl border hover:bg-muted/50 transition-colors"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-xl border">{content}</div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signOut, openUserProfile } = useClerk();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const {
    profile,
    updateGender,
    updateHeight,
    updateWeight,
    updateAllergies,
    isLoading: isProfileLoading,
  } = useUserProfile();
  // URL tab 파라미터 검증 — 존재하지 않는 탭(제거된 privacy 등)은 account로 폴백
  const tabParam = searchParams.get('tab');
  const initialTab: SettingsTab = settingsSections.some((s) => s.id === tabParam)
    ? (tabParam as SettingsTab)
    : 'account';

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { isColorBlind, toggleColorBlind } = useColorBlindMode();
  const userEmail = user?.emailAddresses[0]?.emailAddress || '';

  // 알림 설정 상태 (DB-backed)
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(DB_DEFAULT_SETTINGS);
  const [notificationStatus, setNotificationStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  );
  const [notificationReloadKey, setNotificationReloadKey] = useState(0);
  const [savingNotificationFields, setSavingNotificationFields] = useState<
    Set<keyof NotificationSettings>
  >(new Set());
  const { userId, isLoaded: isAuthLoaded } = useAuth();

  // 언어 설정 상태
  const [language, setLanguage] = useState<string>(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
      if (match) return match[1];
    }
    return 'ko';
  });

  // 마운트 시 설정 불러오기
  useEffect(() => {
    if (!isAuthLoaded) return;

    if (!userId) {
      setNotificationStatus('error');
      return;
    }

    const controller = new AbortController();
    setNotificationStatus('loading');

    void (async () => {
      try {
        const response = await fetch('/api/user/notification-settings', {
          signal: controller.signal,
        });
        const result = (await response.json()) as {
          success?: boolean;
          data?: Partial<NotificationSettings> | null;
        };
        if (!response.ok || !result.success) throw new Error('notification settings load failed');

        setNotificationSettings({ ...DB_DEFAULT_SETTINGS, ...(result.data ?? {}) });
        setNotificationStatus('ready');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setNotificationStatus('error');
      }
    })();

    // 언어 설정: 쿠키에서 읽기 (localStorage 대신)
    const localeMatch = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
    if (localeMatch) {
      setLanguage(localeMatch[1]);
    }
    return () => controller.abort();
  }, [isAuthLoaded, notificationReloadKey, userId]);

  // 알림 설정 변경 시 Supabase에 저장
  const updateNotificationSetting = useCallback(
    async <K extends keyof NotificationSettings>(field: K, value: NotificationSettings[K]) => {
      if (notificationStatus !== 'ready' || savingNotificationFields.has(field)) return;

      const previousValue = notificationSettings[field];
      setNotificationSettings((previous) => ({ ...previous, [field]: value }));
      setSavingNotificationFields((previous) => new Set(previous).add(field));

      try {
        const response = await fetch('/api/user/notification-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        });
        const result = (await response.json()) as { success?: boolean };
        if (!response.ok || !result.success) throw new Error('notification settings save failed');
        toast.success('알림 설정이 저장되었어요');
      } catch {
        // 다른 필드의 낙관적 변경은 유지하고 실패한 필드만 되돌린다.
        setNotificationSettings((previous) => ({ ...previous, [field]: previousValue }));
        toast.error('알림 설정 저장에 실패했어요');
      } finally {
        setSavingNotificationFields((previous) => {
          const next = new Set(previous);
          next.delete(field);
          return next;
        });
      }
    },
    [notificationSettings, notificationStatus, savingNotificationFields]
  );

  const isNotificationControlDisabled = useCallback(
    (field: keyof NotificationSettings, additionallyDisabled = false) =>
      notificationStatus !== 'ready' || savingNotificationFields.has(field) || additionallyDisabled,
    [notificationStatus, savingNotificationFields]
  );

  // 테마 변경 핸들러
  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
  };

  // 언어 변경 핸들러 (쿠키 기반 → 서버 재렌더링)
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    document.cookie = `NEXT_LOCALE=${newLanguage};path=/;max-age=31536000;SameSite=Lax`;
    router.refresh();
  };

  // 성별 변경 핸들러
  const handleGenderChange = async (newGender: GenderType) => {
    await updateGender(newGender);
  };

  // 현재 테마 (next-themes)
  const currentTheme = (theme as ThemeOption) || 'system';

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <FadeInUp>
            <div className="space-y-6">
              {/* 내 정보 섹션 */}
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">내 정보</h2>
                <div className="space-y-3">
                  {/* 성별 선택 */}
                  <div className="p-4 bg-card rounded-xl border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">성별</p>
                        <p className="text-sm text-muted-foreground">맞춤 추천에 활용됩니다</p>
                      </div>
                    </div>
                    <fieldset className="flex gap-2">
                      <legend className="sr-only">성별 선택</legend>
                      {[
                        { id: 'male' as GenderType, label: '남성' },
                        { id: 'female' as GenderType, label: '여성' },
                        { id: 'neutral' as GenderType, label: '선택 안함' },
                      ].map((genderOption) => (
                        <label
                          key={genderOption.id}
                          className={cn(
                            'flex-1 cursor-pointer rounded-lg border py-2 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2',
                            profile.gender === genderOption.id
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted',
                            isProfileLoading && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <input
                            type="radio"
                            name="gender"
                            value={genderOption.id}
                            checked={profile.gender === genderOption.id}
                            aria-checked={profile.gender === genderOption.id}
                            onChange={() => handleGenderChange(genderOption.id)}
                            disabled={isProfileLoading}
                            className="sr-only"
                          />
                          <span className="text-sm">{genderOption.label}</span>
                        </label>
                      ))}
                    </fieldset>
                  </div>

                  {/* 신체 정보 카드 */}
                  <PhysicalInfoCard
                    heightCm={profile.heightCm}
                    weightKg={profile.weightKg}
                    onHeightChange={updateHeight}
                    onWeightChange={updateWeight}
                    isLoading={isProfileLoading}
                  />

                  {/* 알러지 정보 카드 — 영양(N-1) 입력이라 W/N 게이팅과 대칭 (ADR-098, 코드·데이터 유지) */}
                  {FEATURE_FLAGS.WELLNESS_PHASE2 && (
                    <AllergyInfoCard
                      allergies={profile.allergies}
                      onAllergiesChange={updateAllergies}
                      isLoading={isProfileLoading}
                    />
                  )}
                </div>
              </div>

              {/* 계정 관리 섹션 */}
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">계정 관리</h2>
                <div className="space-y-3">
                  <SettingItem
                    icon={User}
                    label="프로필 편집"
                    description="이름, 프로필 사진 변경"
                    onClick={() => openUserProfile()}
                  />
                  <SettingItem
                    icon={Lock}
                    label="비밀번호 및 보안"
                    description="비밀번호 변경, 2단계 인증"
                    onClick={() => openUserProfile()}
                  />
                  <SettingItem
                    icon={LogOut}
                    label="로그아웃"
                    description="현재 기기에서 로그아웃"
                    onClick={() => signOut({ redirectUrl: '/' })}
                    danger
                  />
                </div>
              </div>
            </div>
          </FadeInUp>
        );

      case 'notifications':
        return (
          <FadeInUp>
            <div className="space-y-6" data-testid="notification-settings">
              {notificationStatus === 'loading' && (
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  알림 설정을 불러오는 중이에요.
                </p>
              )}
              {notificationStatus === 'error' && (
                <div
                  className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
                  role="alert"
                >
                  <p className="text-sm text-destructive">알림 설정을 불러오지 못했어요.</p>
                  <button
                    type="button"
                    className="rounded-lg border border-destructive/30 px-3 py-1.5 text-sm text-destructive"
                    onClick={() => setNotificationReloadKey((value) => value + 1)}
                  >
                    다시 시도
                  </button>
                </div>
              )}
              {/* 마스터 토글 */}
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">전체</h2>
                <div className="space-y-3">
                  <SettingItem
                    icon={Bell}
                    label="알림 받기"
                    description="모든 알림을 한번에 켜거나 끌 수 있어요"
                    action={
                      <Toggle
                        enabled={notificationSettings.enabled}
                        label="알림 받기"
                        disabled={isNotificationControlDisabled('enabled')}
                        onChange={(value) => updateNotificationSetting('enabled', value)}
                      />
                    }
                  />
                </div>
              </div>

              {/* 운동 알림 — ADR-098: W-1 숨김 (WELLNESS_PHASE2) */}
              {FEATURE_FLAGS.WELLNESS_PHASE2 && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">운동</h2>
                  <div className="space-y-3">
                    <SettingItem
                      icon={Dumbbell}
                      label="운동 리마인더"
                      description="설정한 시간에 운동 알림을 받아요"
                      action={
                        <div className="flex items-center gap-3">
                          <TimePicker
                            value={notificationSettings.workoutReminderTime}
                            onChange={(value) =>
                              updateNotificationSetting('workoutReminderTime', value)
                            }
                            disabled={isNotificationControlDisabled(
                              'workoutReminderTime',
                              !notificationSettings.enabled || !notificationSettings.workoutReminder
                            )}
                          />
                          <Toggle
                            enabled={notificationSettings.workoutReminder}
                            label="운동 리마인더"
                            disabled={isNotificationControlDisabled('workoutReminder')}
                            onChange={(value) =>
                              updateNotificationSetting('workoutReminder', value)
                            }
                          />
                        </div>
                      }
                    />
                    <SettingItem
                      icon={Bell}
                      label="연속 기록 경고"
                      description="연속 기록이 끊기기 전에 알려드려요"
                      action={
                        <Toggle
                          enabled={notificationSettings.streakWarning}
                          label="연속 기록 경고"
                          disabled={isNotificationControlDisabled('streakWarning')}
                          onChange={(value) => updateNotificationSetting('streakWarning', value)}
                        />
                      }
                    />
                  </div>
                </div>
              )}

              {/* 식사 알림 — ADR-098: N-1 숨김 (WELLNESS_PHASE2) */}
              {FEATURE_FLAGS.WELLNESS_PHASE2 && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">식사</h2>
                  <div className="space-y-3">
                    <SettingItem
                      icon={UtensilsCrossed}
                      label="식사 리마인더"
                      description="식사 시간에 기록 알림을 받아요"
                      action={
                        <Toggle
                          enabled={notificationSettings.nutritionReminder}
                          label="식사 리마인더"
                          disabled={isNotificationControlDisabled('nutritionReminder')}
                          onChange={(value) =>
                            updateNotificationSetting('nutritionReminder', value)
                          }
                        />
                      }
                    />
                    {notificationSettings.nutritionReminder && (
                      <>
                        <div className="flex items-center justify-between px-4 py-3 bg-card rounded-xl border">
                          <span className="text-sm text-muted-foreground">아침</span>
                          <TimePicker
                            value={notificationSettings.mealReminderBreakfast}
                            onChange={(value) =>
                              updateNotificationSetting('mealReminderBreakfast', value)
                            }
                            disabled={isNotificationControlDisabled(
                              'mealReminderBreakfast',
                              !notificationSettings.enabled
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 bg-card rounded-xl border">
                          <span className="text-sm text-muted-foreground">점심</span>
                          <TimePicker
                            value={notificationSettings.mealReminderLunch}
                            onChange={(value) =>
                              updateNotificationSetting('mealReminderLunch', value)
                            }
                            disabled={isNotificationControlDisabled(
                              'mealReminderLunch',
                              !notificationSettings.enabled
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 bg-card rounded-xl border">
                          <span className="text-sm text-muted-foreground">저녁</span>
                          <TimePicker
                            value={notificationSettings.mealReminderDinner}
                            onChange={(value) =>
                              updateNotificationSetting('mealReminderDinner', value)
                            }
                            disabled={isNotificationControlDisabled(
                              'mealReminderDinner',
                              !notificationSettings.enabled
                            )}
                          />
                        </div>
                      </>
                    )}
                    <SettingItem
                      icon={Droplets}
                      label="수분 섭취 알림"
                      description={`${notificationSettings.waterReminderInterval}시간마다 알려드려요`}
                      action={
                        <div className="flex items-center gap-3">
                          <select
                            value={notificationSettings.waterReminderInterval}
                            onChange={(e) =>
                              updateNotificationSetting(
                                'waterReminderInterval',
                                Number(e.target.value)
                              )
                            }
                            disabled={isNotificationControlDisabled(
                              'waterReminderInterval',
                              !notificationSettings.enabled || !notificationSettings.waterReminder
                            )}
                            className={cn(
                              'px-2 py-1 text-sm rounded-lg border bg-card text-foreground',
                              (!notificationSettings.enabled ||
                                !notificationSettings.waterReminder) &&
                                'opacity-50 cursor-not-allowed'
                            )}
                            aria-label="수분 알림 간격"
                          >
                            <option value={1}>1시간</option>
                            <option value={2}>2시간</option>
                            <option value={3}>3시간</option>
                            <option value={4}>4시간</option>
                          </select>
                          <Toggle
                            enabled={notificationSettings.waterReminder}
                            label="수분 섭취 알림"
                            disabled={isNotificationControlDisabled('waterReminder')}
                            onChange={(value) => updateNotificationSetting('waterReminder', value)}
                          />
                        </div>
                      }
                    />
                  </div>
                </div>
              )}

              {/* 소셜 & 성취 */}
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">소셜</h2>
                <div className="space-y-3">
                  <SettingItem
                    icon={Users}
                    label="소셜 알림"
                    description="친구 요청, 좋아요, 댓글 알림"
                    action={
                      <Toggle
                        enabled={notificationSettings.socialNotifications}
                        label="소셜 알림"
                        disabled={isNotificationControlDisabled('socialNotifications')}
                        onChange={(value) =>
                          updateNotificationSetting('socialNotifications', value)
                        }
                      />
                    }
                  />
                  <SettingItem
                    icon={Bell}
                    label="성취 알림"
                    description="배지 획득, 레벨업 알림"
                    action={
                      <Toggle
                        enabled={notificationSettings.achievementNotifications}
                        label="성취 알림"
                        disabled={isNotificationControlDisabled('achievementNotifications')}
                        onChange={(value) =>
                          updateNotificationSetting('achievementNotifications', value)
                        }
                      />
                    }
                  />
                </div>
              </div>
            </div>
          </FadeInUp>
        );

      case 'app':
        return (
          <FadeInUp>
            <div className="space-y-3">
              {/* 테마 선택 */}
              <div className="p-4 bg-card rounded-xl border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Palette className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">테마</p>
                    <p className="text-sm text-muted-foreground">앱 색상 모드</p>
                  </div>
                </div>
                <fieldset className="flex gap-2">
                  <legend className="sr-only">테마 선택</legend>
                  {[
                    { id: 'light', label: '라이트', icon: Sun },
                    { id: 'dark', label: '다크', icon: Moon },
                    { id: 'system', label: '시스템', icon: Palette },
                  ].map((themeOption) => (
                    <label
                      key={themeOption.id}
                      className={cn(
                        'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border py-2 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2',
                        currentTheme === themeOption.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                      )}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={themeOption.id}
                        checked={currentTheme === themeOption.id}
                        aria-checked={currentTheme === themeOption.id}
                        onChange={() => handleThemeChange(themeOption.id as ThemeOption)}
                        className="sr-only"
                      />
                      <themeOption.icon className="w-4 h-4" aria-hidden="true" />
                      <span className="text-sm">{themeOption.label}</span>
                    </label>
                  ))}
                </fieldset>
              </div>

              {/* 언어 선택 */}
              <div className="p-4 bg-card rounded-xl border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">언어</p>
                    <p className="text-sm text-muted-foreground">앱 표시 언어</p>
                  </div>
                </div>
                <fieldset className="flex gap-2">
                  <legend className="sr-only">언어 선택</legend>
                  {[
                    { id: 'ko', label: '한국어' },
                    { id: 'en', label: 'English' },
                    { id: 'ja', label: '日本語' },
                    { id: 'zh', label: '中文' },
                  ].map((lang) => (
                    <label
                      key={lang.id}
                      className={cn(
                        'flex-1 cursor-pointer rounded-lg border py-2 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2',
                        language === lang.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                      )}
                    >
                      <input
                        type="radio"
                        name="language"
                        value={lang.id}
                        checked={language === lang.id}
                        aria-checked={language === lang.id}
                        onChange={() => handleLanguageChange(lang.id)}
                        className="sr-only"
                      />
                      <span className="text-sm" lang={lang.id}>
                        {lang.label}
                      </span>
                    </label>
                  ))}
                </fieldset>
              </div>

              {/* 색맹 모드 */}
              <div className="p-4 bg-card rounded-xl border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Eye className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">색맹 모드</p>
                      <p className="text-sm text-muted-foreground">적녹색맹 친화적 색상 팔레트</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleColorBlind}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      isColorBlind ? 'bg-primary' : 'bg-muted'
                    )}
                    role="switch"
                    aria-checked={isColorBlind}
                    aria-label="색맹 모드 토글"
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                        isColorBlind ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </FadeInUp>
        );

      case 'data':
        return (
          <FadeInUp>
            <div className="space-y-3">
              {/* 개인정보·동의 관리 — 이미지 저장·마케팅 동의 및 철회, 약관 동의 내역 (/settings/privacy) */}
              <SettingItem
                icon={Shield}
                label="개인정보·동의 관리"
                description="이미지 저장·마케팅 동의 및 철회, 약관 동의 내역"
                onClick={() => router.push('/settings/privacy')}
              />
              <DataExportButton />
              <SettingItem
                icon={Trash2}
                label="계정 삭제"
                description="모든 데이터가 영구적으로 삭제됩니다"
                onClick={() => setDeleteDialogOpen(true)}
                danger
              />
            </div>

            {/* 계정 삭제 다이얼로그 */}
            <DeleteAccountDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              userEmail={userEmail}
            />
          </FadeInUp>
        );

      case 'info':
        return (
          <FadeInUp>
            <div className="space-y-3">
              <SettingItem icon={Info} label="앱 버전" description="1.0.0" />
              <SettingItem icon={FileText} label="이용약관" onClick={() => router.push('/terms')} />
              <SettingItem
                icon={Shield}
                label="개인정보처리방침"
                onClick={() => router.push('/privacy')}
              />
              <SettingItem
                icon={FileText}
                label="오픈소스 라이선스"
                onClick={() => router.push('/licenses')}
              />
            </div>
          </FadeInUp>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="settings-page">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">설정</h1>
        </div>

        {/* 탭 네비게이션 */}
        <div
          className="flex gap-1 px-4 py-2 overflow-x-auto"
          role="tablist"
          aria-label="설정 카테고리"
        >
          {settingsSections.map((section) => (
            <button
              key={section.id}
              role="tab"
              aria-selected={activeTab === section.id}
              onClick={() => setActiveTab(section.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 rounded-full text-sm whitespace-nowrap transition-colors',
                activeTab === section.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </div>
      </header>

      {/* 본문 */}
      <div className="px-4 py-4" role="tabpanel" aria-live="polite">
        {renderContent()}
      </div>
    </div>
  );
}
