const mockSetNotificationChannelAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { appOwnership: 'expo' },
}));

jest.mock('expo-notifications', () => ({
  AndroidImportance: {
    DEFAULT: 3,
    LOW: 2,
  },
  setNotificationChannelAsync: (...args: unknown[]) => mockSetNotificationChannelAsync(...args),
  setNotificationHandler: jest.fn(),
}));

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: jest.fn(),
}));

import { setupAndroidChannels } from '../../../lib/notifications/useNotifications';

describe('setupAndroidChannels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('출시에서 숨긴 운동·식단·소셜 채널을 Android에 생성하지 않는다', async () => {
    await setupAndroidChannels();

    const channelIds = mockSetNotificationChannelAsync.mock.calls.map(([channelId]) => channelId);
    expect(channelIds).toEqual(['system']);
    expect(channelIds).not.toContain('workout');
    expect(channelIds).not.toContain('nutrition');
    expect(channelIds).not.toContain('social');
    expect(channelIds).not.toContain('achievement');
  });
});
