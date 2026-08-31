import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockGetToken = jest.fn();
const mockSignOut = jest.fn();
const mockReplace = jest.fn();
const mockSaveBirthdate = jest.fn();
const mockFetchBirthdate = jest.fn();
let mockIsSignedIn = true;
let mockReason: string | undefined;
let mockIsConnected = true;

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({
    getToken: mockGetToken,
    isLoaded: true,
    isSignedIn: mockIsSignedIn,
    signOut: mockSignOut,
  }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ reason: mockReason }),
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/lib/api/birthdate', () => {
  const actual = jest.requireActual('@/lib/api/birthdate');
  return {
    ...actual,
    fetchBirthdate: (...args: unknown[]) => mockFetchBirthdate(...args),
    saveBirthdate: (...args: unknown[]) => mockSaveBirthdate(...args),
  };
});

jest.mock('@/lib/offline', () => ({
  useNetworkStatus: () => ({ isConnected: mockIsConnected }),
}));

jest.mock('@/lib/theme', () => ({
  useTheme: () => ({
    brand: { primary: '#7C3AED', primaryForeground: '#FFFFFF' },
    colors: {
      background: '#FFF9F5',
      border: '#E8DDD5',
      card: '#FFFCFA',
      destructive: '#B42318',
      foreground: '#241F1B',
      muted: '#F5EEE9',
      mutedForeground: '#6F6259',
    },
    radii: { full: 999, xl: 16 },
    spacing: {},
    typography: {
      size: { sm: 13, base: 15, '2xl': 26 },
      weight: { semibold: '600' },
    },
  }),
}));

import CompleteProfileScreen from '@/app/(auth)/complete-profile';
import { BirthdateApiError } from '@/lib/api/birthdate';

describe('CompleteProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSignedIn = true;
    mockReason = undefined;
    mockIsConnected = true;
    mockGetToken.mockResolvedValue('clerk-token');
    mockSignOut.mockResolvedValue(undefined);
    mockSaveBirthdate.mockResolvedValue(undefined);
    mockFetchBirthdate.mockResolvedValue({ birthDate: null, hasBirthDate: false });
  });

  it('기존 계정의 생년월일을 서버 정본에 저장한 뒤 탭으로 보낸다', async () => {
    const { getByTestId } = render(<CompleteProfileScreen />);

    fireEvent.changeText(getByTestId('complete-profile-birthdate-input'), '20000615');
    expect(getByTestId('complete-profile-birthdate-input').props.value).toBe('2000-06-15');
    fireEvent.press(getByTestId('complete-profile-age-confirmation'));
    fireEvent.press(getByTestId('complete-profile-submit'));

    await waitFor(() => {
      expect(mockSaveBirthdate).toHaveBeenCalledWith('2000-06-15', 'clerk-token');
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('만 14세 미만 입력은 저장 호출 전에 세션을 폐기하고 제한 화면으로 보낸다', async () => {
    const { getByTestId } = render(<CompleteProfileScreen />);

    fireEvent.changeText(getByTestId('complete-profile-birthdate-input'), '20180101');
    fireEvent.press(getByTestId('complete-profile-submit'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/age-restricted');
    });
    expect(mockSaveBirthdate).not.toHaveBeenCalled();
  });

  it('서버가 미성년 판정을 반환해도 세션을 폐기하고 제한 화면으로 보낸다', async () => {
    mockSaveBirthdate.mockRejectedValue(
      new BirthdateApiError('만 14세 이상만 이용할 수 있어요.', 403, 'AGE_RESTRICTION', true)
    );
    const { getByTestId } = render(<CompleteProfileScreen />);

    fireEvent.changeText(getByTestId('complete-profile-birthdate-input'), '20000615');
    fireEvent.press(getByTestId('complete-profile-age-confirmation'));
    fireEvent.press(getByTestId('complete-profile-submit'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/age-restricted');
    });
  });

  it('유효하지 않은 입력은 저장하지 않고 인라인 오류를 보여준다', () => {
    const { getByTestId } = render(<CompleteProfileScreen />);

    fireEvent.changeText(getByTestId('complete-profile-birthdate-input'), '20261340');
    fireEvent.press(getByTestId('complete-profile-submit'));

    expect(getByTestId('complete-profile-error')).toBeTruthy();
    expect(mockSaveBirthdate).not.toHaveBeenCalled();
  });

  it('연령 조회가 불가능한 오프라인 진입은 네트워크 안내와 다시 확인하기만 노출한다', () => {
    mockReason = 'unavailable';
    mockIsConnected = false;

    const { getByText, getByTestId, queryByTestId } = render(<CompleteProfileScreen />);

    expect(getByText('연령 확인 정보를 불러오지 못했어요')).toBeTruthy();
    expect(getByText(/네트워크 연결을 확인한 뒤/)).toBeTruthy();
    expect(getByTestId('complete-profile-recheck')).toBeTruthy();
    expect(queryByTestId('complete-profile-submit')).toBeNull();
  });

  it('다시 확인해 저장된 성인 생년월일을 찾으면 재입력 없이 탭으로 복귀한다', async () => {
    mockReason = 'unavailable';
    mockIsConnected = false;
    mockFetchBirthdate.mockResolvedValue({ birthDate: '2000-06-15', hasBirthDate: true });

    const { getByTestId } = render(<CompleteProfileScreen />);
    fireEvent.press(getByTestId('complete-profile-recheck'));

    await waitFor(() => {
      expect(mockFetchBirthdate).toHaveBeenCalledWith('clerk-token');
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
    expect(mockSaveBirthdate).not.toHaveBeenCalled();
  });
});
