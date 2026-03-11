/**
 * SendEncouragement 컴포넌트 테스트
 *
 * 대상: components/social/SendEncouragement.tsx
 * 응원 보내기 버튼 + 바텀시트 — 프리셋 5종 + 커스텀 입력 + API 호출
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { SendEncouragement } from '../../../components/social/SendEncouragement';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors, brand, module: moduleColors,
    status: statusColors, grade: gradeColors, nutrient: nutrientColors,
    score: scoreColors, trust: trustColors, spacing, radii, shadows, typography,
    isDark, colorScheme: isDark ? 'dark' : 'light', themeMode: 'system', setThemeMode: jest.fn(),
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>
  );
}

const defaultProps = {
  toUserId: 'user_789',
  toUserName: '이영희',
  activityType: 'workout',
  activityId: 'activity_001',
  onSuccess: jest.fn(),
};

// global.fetch mock
const mockFetch = jest.fn();

beforeAll(() => {
  (global as unknown as Record<string, unknown>).fetch = mockFetch;
  process.env.EXPO_PUBLIC_API_URL = 'https://api.test.com';
});

afterAll(() => {
  delete (global as unknown as Record<string, unknown>).fetch;
});

describe('SendEncouragement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockFetch.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('트리거 버튼', () => {
    it('응원 버튼이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(
        <SendEncouragement {...defaultProps} />
      );
      expect(getByTestId('send-encouragement-button')).toBeTruthy();
    });

    it('응원 텍스트가 표시된다', () => {
      const { getByText } = renderWithTheme(
        <SendEncouragement {...defaultProps} />
      );
      expect(getByText('응원')).toBeTruthy();
    });
  });

  describe('모달 열기', () => {
    it('버튼을 누르면 바텀시트가 열린다', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <SendEncouragement {...defaultProps} />
      );

      fireEvent.press(getByTestId('send-encouragement-button'));

      expect(getByText('이영희님에게 응원 보내기')).toBeTruthy();
    });

    it('안내 문구가 표시된다', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <SendEncouragement {...defaultProps} />
      );

      fireEvent.press(getByTestId('send-encouragement-button'));

      expect(getByText('따뜻한 응원 메시지를 보내보세요')).toBeTruthy();
    });
  });

  describe('프리셋 메시지', () => {
    it('5종 프리셋 메시지가 모두 표시된다', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <SendEncouragement {...defaultProps} />
      );

      fireEvent.press(getByTestId('send-encouragement-button'));

      expect(getByText('오늘도 화이팅!')).toBeTruthy();
      expect(getByText('잘하고 있어요!')).toBeTruthy();
      expect(getByText('멋져요!')).toBeTruthy();
      expect(getByText('응원할게요!')).toBeTruthy();
      expect(getByText('함께 해요!')).toBeTruthy();
    });

    it('프리셋 메시지를 누르면 API가 올바른 payload로 호출된다', async () => {
      const { getByTestId, getByText } = renderWithTheme(
        <SendEncouragement {...defaultProps} />
      );

      fireEvent.press(getByTestId('send-encouragement-button'));
      fireEvent.press(getByText('멋져요!'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.test.com/api/encouragements',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toUserId: 'user_789',
              message: '멋져요!',
              messageType: 'preset',
              activityType: 'workout',
              activityId: 'activity_001',
            }),
          })
        );
      });
    });
  });

  describe('API 호출 성공', () => {
    it('성공 시 onSuccess 콜백이 호출된다', async () => {
      const { getByTestId, getByText } = renderWithTheme(
        <SendEncouragement {...defaultProps} />
      );

      fireEvent.press(getByTestId('send-encouragement-button'));
      fireEvent.press(getByText('오늘도 화이팅!'));

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalled();
      });
    });

    it('성공 시 "응원을 보냈어요!" 메시지가 표시된다', async () => {
      const { getByTestId, getByText } = renderWithTheme(
        <SendEncouragement {...defaultProps} />
      );

      fireEvent.press(getByTestId('send-encouragement-button'));
      fireEvent.press(getByText('잘하고 있어요!'));

      await waitFor(() => {
        expect(getByText('응원을 보냈어요!')).toBeTruthy();
      });
    });
  });

  describe('커스텀 메시지', () => {
    it('커스텀 메시지 입력란이 표시된다', () => {
      const { getByTestId, getByPlaceholderText } = renderWithTheme(
        <SendEncouragement {...defaultProps} />
      );

      fireEvent.press(getByTestId('send-encouragement-button'));

      expect(
        getByPlaceholderText('직접 응원 메시지를 작성해보세요')
      ).toBeTruthy();
    });

    it('빈 메시지로는 전송할 수 없다', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <SendEncouragement {...defaultProps} />
      );

      fireEvent.press(getByTestId('send-encouragement-button'));
      fireEvent.press(getByText('응원 보내기'));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('커스텀 메시지 입력 후 전송 버튼을 누르면 API가 호출된다', async () => {
      const { getByTestId, getByText, getByPlaceholderText } = renderWithTheme(
        <SendEncouragement {...defaultProps} />
      );

      fireEvent.press(getByTestId('send-encouragement-button'));

      const input = getByPlaceholderText('직접 응원 메시지를 작성해보세요');
      fireEvent.changeText(input, '정말 대단해요!');
      fireEvent.press(getByText('응원 보내기'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.test.com/api/encouragements',
          expect.objectContaining({
            body: JSON.stringify({
              toUserId: 'user_789',
              message: '정말 대단해요!',
              messageType: 'custom',
              activityType: 'workout',
              activityId: 'activity_001',
            }),
          })
        );
      });
    });
  });
});
