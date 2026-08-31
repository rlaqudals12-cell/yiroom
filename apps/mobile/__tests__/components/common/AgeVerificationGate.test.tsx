import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

const mockReplace = jest.fn();
const mockGetToken = jest.fn();
const mockSignOut = jest.fn();
const mockFetchBirthdate = jest.fn();
let mockSegments: string[] = ['(tabs)'];
let mockAuthState = {
  getToken: mockGetToken,
  isLoaded: true,
  isSignedIn: true,
  signOut: mockSignOut,
  userId: 'user_existing',
};

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSegments: () => mockSegments,
}));

jest.mock('@/lib/api/birthdate', () => {
  const actual = jest.requireActual('@/lib/api/birthdate');
  return {
    ...actual,
    fetchBirthdate: (...args: unknown[]) => mockFetchBirthdate(...args),
  };
});

import {
  AgeVerificationGate,
  buildAgeVerificationPath,
} from '@/components/common/AgeVerificationGate';
import { BirthdateApiError } from '@/lib/api/birthdate';

describe('AgeVerificationGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSegments = ['(tabs)'];
    mockAuthState = {
      getToken: mockGetToken,
      isLoaded: true,
      isSignedIn: true,
      signOut: mockSignOut,
      userId: 'user_existing',
    };
    mockGetToken.mockResolvedValue('clerk-token');
    mockSignOut.mockResolvedValue(undefined);
  });

  it('Expo route group을 연령 경로 계약으로 복원한다', () => {
    expect(buildAgeVerificationPath(['(tabs)', 'beauty'])).toBe('/(tabs)/beauty');
    expect(buildAgeVerificationPath([])).toBe('/');
  });

  it('birth_date 없는 기존 계정의 탭 직접 진입을 수집 화면으로 막는다', async () => {
    mockFetchBirthdate.mockResolvedValue({ birthDate: null, hasBirthDate: false });

    const { getByTestId } = render(
      <AgeVerificationGate loadingColor="#111111">
        <Text testID="protected-tabs">보호 화면</Text>
      </AgeVerificationGate>
    );

    expect(getByTestId('global-age-verification-loading')).toBeTruthy();
    await waitFor(() => {
      expect(mockFetchBirthdate).toHaveBeenCalledWith('clerk-token');
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/complete-profile');
    });
  });

  it('/(closet)/recommend 직접 진입도 일반 표면 우회 없이 수집 화면으로 막는다', async () => {
    mockSegments = ['(closet)', 'recommend'];
    mockFetchBirthdate.mockResolvedValue({ birthDate: null, hasBirthDate: false });

    const { getByTestId } = render(
      <AgeVerificationGate loadingColor="#111111">
        <Text testID="protected-closet">옷장 추천</Text>
      </AgeVerificationGate>
    );

    expect(getByTestId('global-age-verification-loading')).toBeTruthy();
    expect(
      getByTestId('age-verification-content', { includeHiddenElements: true }).props.pointerEvents
    ).toBe('none');
    await waitFor(() => {
      expect(mockFetchBirthdate).toHaveBeenCalledWith('clerk-token');
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/complete-profile');
    });
  });

  it('저장된 성인 생년월일을 확인한 뒤에만 보호 화면을 연다', async () => {
    mockFetchBirthdate.mockResolvedValue({ birthDate: '2000-06-15', hasBirthDate: true });

    const { getByTestId, queryByTestId } = render(
      <AgeVerificationGate loadingColor="#111111">
        <Text testID="protected-tabs">보호 화면</Text>
      </AgeVerificationGate>
    );

    await waitFor(
      () => {
        expect(mockFetchBirthdate).toHaveBeenCalledWith('clerk-token');
      },
      { timeout: 3000 }
    );
    await waitFor(
      () => {
        expect(queryByTestId('global-age-verification-loading')).toBeNull();
      },
      { timeout: 3000 }
    );
    expect(getByTestId('protected-tabs')).toBeTruthy();
    expect(getByTestId('age-verification-content').props.pointerEvents).toBe('auto');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('계정이 바뀌면 이전 사용자의 연령 확인 상태를 재사용하지 않는다', async () => {
    mockFetchBirthdate.mockResolvedValue({ birthDate: '2000-06-15', hasBirthDate: true });

    const view = render(
      <AgeVerificationGate loadingColor="#111111">
        <Text testID="protected-tabs">보호 화면</Text>
      </AgeVerificationGate>
    );

    await waitFor(() => expect(view.getByTestId('protected-tabs')).toBeTruthy());

    mockReplace.mockClear();
    mockFetchBirthdate.mockResolvedValue({ birthDate: null, hasBirthDate: false });
    mockAuthState = { ...mockAuthState, userId: 'user_without_birthdate' };
    view.rerender(
      <AgeVerificationGate loadingColor="#111111">
        <Text testID="protected-tabs">보호 화면</Text>
      </AgeVerificationGate>
    );

    expect(
      view.getByTestId('age-verification-content', { includeHiddenElements: true }).props
        .pointerEvents
    ).toBe('none');
    expect(view.getByTestId('global-age-verification-loading')).toBeTruthy();
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/complete-profile');
    });
  });

  it('기존 미성년 생년월일이면 세션을 폐기하고 제한 화면으로 보낸다', async () => {
    mockFetchBirthdate.mockResolvedValue({ birthDate: '2018-01-01', hasBirthDate: true });

    render(
      <AgeVerificationGate loadingColor="#111111">
        <Text>보호 화면</Text>
      </AgeVerificationGate>
    );

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/age-restricted');
    });
  });

  it('연령 조회 실패도 통과시키지 않고 수집 화면으로 닫는다', async () => {
    mockFetchBirthdate.mockRejectedValue(new Error('network'));

    render(
      <AgeVerificationGate loadingColor="#111111">
        <Text>보호 화면</Text>
      </AgeVerificationGate>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/complete-profile');
    });
  });

  it('네트워크 전송 실패는 unavailable 사유와 함께 수집 화면으로 닫는다', async () => {
    mockFetchBirthdate.mockRejectedValue(
      new BirthdateApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR')
    );

    render(
      <AgeVerificationGate loadingColor={'#111111'}>
        <Text>보호 화면</Text>
      </AgeVerificationGate>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/(auth)/complete-profile',
        params: { reason: 'unavailable' },
      });
    });
  });

  it('연령 조회가 8초를 넘기면 unavailable 사유와 함께 수집 화면으로 닫는다', async () => {
    jest.useFakeTimers();
    mockFetchBirthdate.mockImplementation(() => new Promise(() => undefined));

    try {
      render(
        <AgeVerificationGate loadingColor={'#111111'}>
          <Text>보호 화면</Text>
        </AgeVerificationGate>
      );

      await waitFor(() => expect(mockFetchBirthdate).toHaveBeenCalledTimes(1));
      await act(async () => {
        jest.advanceTimersByTime(8000);
        await Promise.resolve();
      });

      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/(auth)/complete-profile',
        params: { reason: 'unavailable' },
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('연령 수집 auth 경로에서는 재검사 루프를 만들지 않는다', () => {
    mockSegments = ['(auth)', 'complete-profile'];

    const { getByTestId, queryByTestId } = render(
      <AgeVerificationGate loadingColor="#111111">
        <Text testID="complete-profile-content">수집 화면</Text>
      </AgeVerificationGate>
    );

    expect(getByTestId('complete-profile-content')).toBeTruthy();
    expect(queryByTestId('global-age-verification-loading')).toBeNull();
    expect(mockFetchBirthdate).not.toHaveBeenCalled();
  });
});
