'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import { useTheme } from '@/components/providers/theme-provider';
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
  EyeOff,
  Trash2,
  FileText,
  Lock,
  LogOut,
} from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { cn } from '@/lib/utils';
import { DeleteAccountDialog, DataExportButton } from '@/components/settings';

/**
 * 설정 페이지 - UX 리스트럭처링
 * - 계정 설정 (이름, 이메일, 프로필 사진)
 * - 알림 설정 (토글: 푸시, 이메일, 마케팅)
 * - 앱 설정 (테마, 언어)
 * - 개인정보 설정 (프로필 공개, 활동 공개)
 * - 데이터 관리 (내보내기, 삭제)
 * - 앱 정보 (버전, 이용약관, 개인정보처리방침)
 */

type SettingsTab = 'account' | 'notifications' | 'app' | 'privacy' | 'data' | 'info';

interface SettingSection {
  id: SettingsTab;
  label: string;
  icon: typeof User;
}

const settingsSections: SettingSection[] = [
  { id: 'account', label: '계정', icon: User },
  { id: 'notifications', label: '알림', icon: Bell },
  { id: 'app', label: '앱 설정', icon: Palette },
  { id: 'privacy', label: '개인정보', icon: Shield },
  { id: 'data', label: '데이터 관리', icon: Database },
  { id: 'info', label: '앱 정보', icon: Info },
];

// LocalStorage 키
const STORAGE_KEYS = {
  notifications: 'yiroom_notification_settings',
  privacy: 'yiroom_privacy_settings',
  language: 'yiroom_language',
} as const;

// 기본 설정값
const DEFAULT_NOTIFICATION_SETTINGS = {
  push: true,
  email: true,
  marketing: false,
  friendRequest: true,
  challenge: true,
  reminder: true,
};

const DEFAULT_PRIVACY_SETTINGS = {
  profilePublic: true,
  activityPublic: false,
  leaderboardPublic: true,
};

// Toggle 컴포넌트
function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors',
        enabled ? 'bg-primary' : 'bg-muted'
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
          <Icon
            className={cn('w-5 h-5', danger ? 'text-destructive' : 'text-muted-foreground')}
          />
        </div>
        <div className="flex-1">
          <p className={cn('font-medium', danger ? 'text-destructive' : 'text-foreground')}>
            {label}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
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
    <div className="flex items-center justify-between p-4 bg-card rounded-xl border">
      {content}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signOut, openUserProfile } = useClerk();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'account';

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const userEmail = user?.emailAddresses[0]?.emailAddress || '';

  // 알림 설정 상태
  const [notificationSettings, setNotificationSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);

  // 개인정보 설정 상태
  const [privacySettings, setPrivacySettings] = useState(DEFAULT_PRIVACY_SETTINGS);

  // 언어 설정 상태
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');

  // 마운트 시 LocalStorage에서 설정 불러오기
  useEffect(() => {
    // 알림 설정 불러오기
    const savedNotifications = localStorage.getItem(STORAGE_KEYS.notifications);
    if (savedNotifications) {
      try {
        setNotificationSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(savedNotifications) });
      } catch { /* 무시 */ }
    }

    // 개인정보 설정 불러오기
    const savedPrivacy = localStorage.getItem(STORAGE_KEYS.privacy);
    if (savedPrivacy) {
      try {
        setPrivacySettings({ ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(savedPrivacy) });
      } catch { /* 무시 */ }
    }

    // 언어 설정 불러오기
    const savedLanguage = localStorage.getItem(STORAGE_KEYS.language);
    if (savedLanguage === 'ko' || savedLanguage === 'en') {
      setLanguage(savedLanguage);
    }
  }, []);

  // 알림 설정 변경 시 저장
  const updateNotificationSettings = (update: Partial<typeof notificationSettings>) => {
    setNotificationSettings((prev) => {
      const newSettings = { ...prev, ...update };
      localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(newSettings));
      return newSettings;
    });
  };

  // 개인정보 설정 변경 시 저장
  const updatePrivacySettings = (update: Partial<typeof privacySettings>) => {
    setPrivacySettings((prev) => {
      const newSettings = { ...prev, ...update };
      localStorage.setItem(STORAGE_KEYS.privacy, JSON.stringify(newSettings));
      return newSettings;
    });
  };

  // 테마 변경 핸들러
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  // 언어 변경 핸들러
  const handleLanguageChange = (newLanguage: 'ko' | 'en') => {
    setLanguage(newLanguage);
    localStorage.setItem(STORAGE_KEYS.language, newLanguage);
  };

  // 현재 테마 (next-themes)
  const currentTheme = (theme as 'light' | 'dark' | 'system') || 'system';

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <FadeInUp>
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
          </FadeInUp>
        );

      case 'notifications':
        return (
          <FadeInUp>
            <div className="space-y-6">
              {/* 일반 알림 */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                  일반
                </h3>
                <div className="space-y-3">
                  <SettingItem
                    icon={Bell}
                    label="푸시 알림"
                    description="앱 알림 받기"
                    action={
                      <Toggle
                        enabled={notificationSettings.push}
                        onChange={(v) => updateNotificationSettings({ push: v })}
                      />
                    }
                  />
                  <SettingItem
                    icon={Bell}
                    label="이메일 알림"
                    description="중요한 알림을 이메일로 받기"
                    action={
                      <Toggle
                        enabled={notificationSettings.email}
                        onChange={(v) => updateNotificationSettings({ email: v })}
                      />
                    }
                  />
                  <SettingItem
                    icon={Bell}
                    label="마케팅 알림"
                    description="이벤트, 프로모션 소식 받기"
                    action={
                      <Toggle
                        enabled={notificationSettings.marketing}
                        onChange={(v) => updateNotificationSettings({ marketing: v })}
                      />
                    }
                  />
                </div>
              </div>

              {/* 활동 알림 */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                  활동
                </h3>
                <div className="space-y-3">
                  <SettingItem
                    icon={User}
                    label="친구 요청"
                    action={
                      <Toggle
                        enabled={notificationSettings.friendRequest}
                        onChange={(v) => updateNotificationSettings({ friendRequest: v })}
                      />
                    }
                  />
                  <SettingItem
                    icon={Bell}
                    label="챌린지 알림"
                    action={
                      <Toggle
                        enabled={notificationSettings.challenge}
                        onChange={(v) => updateNotificationSettings({ challenge: v })}
                      />
                    }
                  />
                  <SettingItem
                    icon={Bell}
                    label="리마인더"
                    action={
                      <Toggle
                        enabled={notificationSettings.reminder}
                        onChange={(v) => updateNotificationSettings({ reminder: v })}
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
                <div className="flex gap-2">
                  {[
                    { id: 'light', label: '라이트', icon: Sun },
                    { id: 'dark', label: '다크', icon: Moon },
                    { id: 'system', label: '시스템', icon: Palette },
                  ].map((themeOption) => (
                    <button
                      key={themeOption.id}
                      onClick={() => handleThemeChange(themeOption.id as 'light' | 'dark' | 'system')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors',
                        currentTheme === themeOption.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                      )}
                    >
                      <themeOption.icon className="w-4 h-4" />
                      <span className="text-sm">{themeOption.label}</span>
                    </button>
                  ))}
                </div>
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
                <div className="flex gap-2">
                  {[
                    { id: 'ko', label: '한국어' },
                    { id: 'en', label: 'English' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang.id as 'ko' | 'en')}
                      className={cn(
                        'flex-1 py-2 rounded-lg border transition-colors',
                        language === lang.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                      )}
                    >
                      <span className="text-sm">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </FadeInUp>
        );

      case 'privacy':
        return (
          <FadeInUp>
            <div className="space-y-3">
              <SettingItem
                icon={Eye}
                label="프로필 공개"
                description="다른 사용자가 내 프로필을 볼 수 있음"
                action={
                  <Toggle
                    enabled={privacySettings.profilePublic}
                    onChange={(v) => updatePrivacySettings({ profilePublic: v })}
                  />
                }
              />
              <SettingItem
                icon={privacySettings.activityPublic ? Eye : EyeOff}
                label="활동 공개"
                description="운동, 영양 기록을 친구에게 공개"
                action={
                  <Toggle
                    enabled={privacySettings.activityPublic}
                    onChange={(v) => updatePrivacySettings({ activityPublic: v })}
                  />
                }
              />
              <SettingItem
                icon={Eye}
                label="리더보드 참여"
                description="랭킹에 내 정보 표시"
                action={
                  <Toggle
                    enabled={privacySettings.leaderboardPublic}
                    onChange={(v) => updatePrivacySettings({ leaderboardPublic: v })}
                  />
                }
              />
            </div>
          </FadeInUp>
        );

      case 'data':
        return (
          <FadeInUp>
            <div className="space-y-3">
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
              <SettingItem
                icon={Info}
                label="앱 버전"
                description="1.0.0"
              />
              <SettingItem
                icon={FileText}
                label="이용약관"
                onClick={() => router.push('/terms')}
              />
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
        <div className="flex gap-1 px-4 py-2 overflow-x-auto">
          {settingsSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors',
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
      <main className="px-4 py-4">{renderContent()}</main>
    </div>
  );
}
