/**
 * 피부 상담 API·정직성 회귀 테스트
 *
 * 별도 404 경로와 키워드 고정 답변이 AI 응답처럼 노출되지 않도록 검증한다.
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockGetToken = jest.fn();
const mockSendCoachMessage = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

jest.mock('@/lib/coach', () => ({
  sendCoachMessage: (...args: unknown[]) => mockSendCoachMessage(...args),
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return { Send: (props: Record<string, unknown>) => <View {...props} /> };
});

jest.mock('@/components/ui', () => {
  const { View } = require('react-native');
  return {
    ScreenContainer: ({ children, ...props }: { children: React.ReactNode }) => (
      <View {...props}>{children}</View>
    ),
    GlassCard: ({ children, ...props }: { children: React.ReactNode }) => (
      <View {...props}>{children}</View>
    ),
  };
});

jest.mock('../../../lib/theme', () => ({
  useTheme: () => ({
    colors: {
      card: '#fff',
      border: '#ddd',
      foreground: '#111',
      background: '#fff',
      muted: '#777',
    },
  }),
  brand: { primary: '#000', primaryForeground: '#fff' },
  typography: {
    size: { xs: 12, sm: 14, base: 16 },
    weight: { semibold: '600' },
  },
  spacing: { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24 },
  radii: { xl: 16, full: 999, circle: 999 },
}));

import SkinConsultationScreen from '../../../app/(analysis)/skin/consultation';

describe('SkinConsultationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('clerk-token');
    mockSendCoachMessage.mockResolvedValue({ message: '서버에서 생성한 상담 답변이에요.' });
    global.fetch = jest.fn().mockRejectedValue(new Error('legacy endpoint must not be used'));
  });

  it('빠른 질문을 인증된 공용 coach/chat 클라이언트로 전송한다', async () => {
    const { getByText } = render(<SkinConsultationScreen />);

    await act(async () => {
      fireEvent.press(getByText('💧 건조함'));
    });

    await waitFor(() => {
      expect(mockGetToken).toHaveBeenCalledTimes(1);
      expect(mockSendCoachMessage).toHaveBeenCalledWith(
        '피부가 건조한데 어떻게 관리해야 하나요?',
        expect.any(Array),
        'clerk-token'
      );
      expect(getByText('서버에서 생성한 상담 답변이에요.')).toBeTruthy();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('API 실패 시 키워드 답변 대신 AI가 아닌 연결 안내만 표시한다', async () => {
    mockSendCoachMessage.mockRejectedValue(new Error('service unavailable'));
    const { getByText, queryByText } = render(<SkinConsultationScreen />);

    await act(async () => {
      fireEvent.press(getByText('💧 건조함'));
    });

    await waitFor(() => {
      expect(getByText('AI 응답이 아닌 연결 안내예요.')).toBeTruthy();
      expect(
        getByText('상담 서비스에 연결하지 못했어요. 잠시 후 다시 시도해주세요.')
      ).toBeTruthy();
    });
    expect(queryByText(/클렌징 후 3분 이내/)).toBeNull();
    expect(queryByText(/세라마이드 성분 크림 사용/)).toBeNull();
  });
});
