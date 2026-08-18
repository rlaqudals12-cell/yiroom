import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

const { navigationState } = vi.hoisted(() => ({
  navigationState: { tab: 'notifications' },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: (key: string) => (key === 'tab' ? navigationState.tab : null) }),
}));
vi.mock('@clerk/nextjs', () => ({
  useClerk: () => ({ signOut: vi.fn(), openUserProfile: vi.fn() }),
  useUser: () => ({ user: null }),
  useAuth: () => ({ userId: 'user-123', isLoaded: true }),
}));
vi.mock('@/components/providers/theme-provider', () => ({
  useTheme: () => ({ theme: 'system', setTheme: vi.fn() }),
}));
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: { gender: 'neutral', heightCm: null, weightKg: null, allergies: [] },
    updateGender: vi.fn(),
    updateHeight: vi.fn(),
    updateWeight: vi.fn(),
    updateAllergies: vi.fn(),
    isLoading: false,
  }),
}));
vi.mock('@/hooks/useColorBlindMode', () => ({
  useColorBlindMode: () => ({ isColorBlind: false, toggleColorBlind: vi.fn() }),
}));
vi.mock('@/components/animations', () => ({
  FadeInUp: ({ children }: React.PropsWithChildren) => children,
}));
vi.mock('@/components/settings', () => ({
  DeleteAccountDialog: () => null,
  DataExportButton: () => null,
  PhysicalInfoCard: () => null,
  AllergyInfoCard: () => null,
}));
vi.mock('@yiroom/shared', () => ({ FEATURE_FLAGS: { WELLNESS_PHASE2: false } }));
vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

import SettingsPage from '@/app/(main)/profile/settings/page';

const settings = {
  enabled: true,
  workoutReminder: true,
  workoutReminderTime: '09:00',
  streakWarning: true,
  nutritionReminder: true,
  mealReminderBreakfast: '08:30',
  mealReminderLunch: '12:30',
  mealReminderDinner: '18:30',
  waterReminder: true,
  waterReminderInterval: 2,
  socialNotifications: true,
  achievementNotifications: true,
};

describe('SettingsPage 알림 저장', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationState.tab = 'notifications';
  });

  it('초기 조회 중과 조회 오류 뒤에는 알림 변경을 차단한다', async () => {
    let rejectFetch!: (reason?: unknown) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((_resolve, reject) => {
            rejectFetch = reject;
          })
      )
    );

    render(<SettingsPage />);
    expect(screen.getByRole('switch', { name: '알림 받기' })).toBeDisabled();

    rejectFetch(new Error('offline'));
    expect(await screen.findByRole('alert')).toHaveTextContent('알림 설정을 불러오지 못했어요');
    expect(screen.getByRole('switch', { name: '알림 받기' })).toBeDisabled();
  });

  it('필드별 PATCH를 병렬 저장하고 실패한 필드만 이전 값으로 되돌린다', async () => {
    let rejectSocial!: () => void;
    let resolveAchievement!: (response: Response) => void;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: settings }), { status: 200 })
      )
      .mockImplementationOnce(
        () =>
          new Promise<Response>((_resolve, reject) => {
            rejectSocial = reject;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveAchievement = resolve;
          })
      );
    vi.stubGlobal('fetch', fetchMock);

    render(<SettingsPage />);
    const social = await screen.findByRole('switch', { name: '소셜 알림' });
    const achievement = screen.getByRole('switch', { name: '성취 알림' });
    await waitFor(() => expect(social).toBeEnabled());

    fireEvent.click(social);
    fireEvent.click(achievement);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/user/notification-settings',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ socialNotifications: false }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/user/notification-settings',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ achievementNotifications: false }),
      })
    );

    rejectSocial();
    resolveAchievement(
      new Response(JSON.stringify({ success: true, data: settings }), { status: 200 })
    );

    await waitFor(() => expect(social).toHaveAttribute('aria-checked', 'true'));
    expect(achievement).toHaveAttribute('aria-checked', 'false');
    expect(mockToastError).toHaveBeenCalledWith('알림 설정 저장에 실패했어요');
  });

  it('성별을 native radio group으로 노출한다', async () => {
    navigationState.tab = 'account';
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ success: true, data: settings }), { status: 200 })
        )
    );

    render(<SettingsPage />);

    expect(screen.getByRole('group', { name: '성별 선택' })).toBeInTheDocument();
    const neutral = screen.getByRole('radio', { name: '선택 안함' });
    expect(neutral).toBeChecked();
    expect(neutral).toHaveAttribute('aria-checked', 'true');
  });

  it('테마·언어를 native radio group으로 노출하고 언어명을 lang으로 표시한다', async () => {
    navigationState.tab = 'app';
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ success: true, data: settings }), { status: 200 })
        )
    );

    render(<SettingsPage />);

    expect(screen.getByRole('group', { name: '테마 선택' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '시스템' })).toBeChecked();
    expect(screen.getByRole('group', { name: '언어 선택' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '한국어' })).toBeChecked();
    expect(screen.getByText('English')).toHaveAttribute('lang', 'en');
    expect(screen.getByText('日本語')).toHaveAttribute('lang', 'ja');
    expect(screen.getByText('中文')).toHaveAttribute('lang', 'zh');
  });
});
