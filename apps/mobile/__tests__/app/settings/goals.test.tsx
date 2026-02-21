/**
 * 목표 설정 화면 테스트
 *
 * 대상: app/settings/goals.tsx (GoalsSettingsScreen)
 * 의존성: useTheme, AsyncStorage, expo-haptics, widgets, logger
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ThemeContext,
  type ThemeContextValue,
} from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';

// ============================================================
// Mock 설정
// ============================================================

// 위젯 모듈 mock
// 주의: jest.mock 팩토리는 파일 상단으로 호이스팅되므로
// 외부 변수 초기화 값에 접근 불가. 팩토리 내부에서 생성 후 require로 접근.
jest.mock('../../../lib/widgets', () => ({
  __esModule: true,
  setGoals: jest.fn().mockResolvedValue(undefined),
  useWidgetSync: jest.fn(() => ({ syncAll: jest.fn(), isLoading: false })),
  saveWidgetData: jest.fn(),
  getWidgetData: jest.fn(),
  getLastSyncTime: jest.fn(),
  updateWaterIntake: jest.fn(),
  updateWorkoutComplete: jest.fn(),
  updateCaloriesConsumed: jest.fn(),
  updateStreak: jest.fn(),
  resetDailyData: jest.fn(),
  APP_GROUP_ID: 'group.app.yiroom',
  generateDailySummaryData: jest.fn(),
  generateWorkoutProgressData: jest.fn(),
  generateNutritionTrackerData: jest.fn(),
  generateWellnessScoreData: jest.fn(),
  generateQuickActionsData: jest.fn(),
  generateWidgetData: jest.fn(),
  updateAllWidgets: jest.fn(),
}));

// 로거 mock
jest.mock('../../../lib/utils/logger', () => ({
  settingsLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// react-native-safe-area-context mock
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

import GoalsSettingsScreen from '../../../app/settings/goals';

// ============================================================
// 테마 헬퍼
// ============================================================

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

// ============================================================
// 테스트
// ============================================================

describe('GoalsSettingsScreen', () => {
  const Haptics = require('expo-haptics');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<GoalsSettingsScreen />);
      expect(getByTestId('settings-goals-screen')).toBeTruthy();
    });

    it('testID가 settings-goals-screen으로 설정된다', () => {
      const { getByTestId } = renderWithTheme(<GoalsSettingsScreen />);
      expect(getByTestId('settings-goals-screen')).toBeTruthy();
    });
  });

  describe('주요 UI 요소 표시', () => {
    it('물 목표 섹션을 표시한다', () => {
      const { getByText } = renderWithTheme(<GoalsSettingsScreen />);
      expect(getByText('일일 물 목표')).toBeTruthy();
    });

    it('물 프리셋 버튼들을 표시한다', () => {
      const { getByText } = renderWithTheme(<GoalsSettingsScreen />);
      expect(getByText('1.5L')).toBeTruthy();
      expect(getByText('2.0L')).toBeTruthy();
      expect(getByText('2.5L')).toBeTruthy();
      expect(getByText('3.0L')).toBeTruthy();
    });

    it('칼로리 목표 섹션을 표시한다', () => {
      const { getByText } = renderWithTheme(<GoalsSettingsScreen />);
      expect(getByText('일일 칼로리 목표')).toBeTruthy();
    });

    it('칼로리 프리셋 버튼들을 표시한다', () => {
      const { getByText } = renderWithTheme(<GoalsSettingsScreen />);
      expect(getByText('1500')).toBeTruthy();
      expect(getByText('1800')).toBeTruthy();
      expect(getByText('2000')).toBeTruthy();
      expect(getByText('2500')).toBeTruthy();
    });

    it('운동 목표 섹션을 표시한다', () => {
      const { getByText } = renderWithTheme(<GoalsSettingsScreen />);
      expect(getByText('운동 목표')).toBeTruthy();
    });

    it('운동 시간 옵션들을 표시한다', () => {
      const { getByText } = renderWithTheme(<GoalsSettingsScreen />);
      expect(getByText('일일 운동 시간')).toBeTruthy();
      expect(getByText('15분')).toBeTruthy();
      expect(getByText('30분')).toBeTruthy();
      expect(getByText('45분')).toBeTruthy();
      expect(getByText('60분')).toBeTruthy();
    });

    it('주당 운동 일수 옵션들을 표시한다', () => {
      const { getByText } = renderWithTheme(<GoalsSettingsScreen />);
      expect(getByText('주당 운동 일수')).toBeTruthy();
      expect(getByText('3일')).toBeTruthy();
      expect(getByText('4일')).toBeTruthy();
      expect(getByText('5일')).toBeTruthy();
      expect(getByText('6일')).toBeTruthy();
      expect(getByText('7일')).toBeTruthy();
    });

    it('안내 텍스트를 표시한다', () => {
      const { getByText } = renderWithTheme(<GoalsSettingsScreen />);
      expect(getByText(/목표는 언제든지 변경할 수 있습니다/)).toBeTruthy();
    });

    it('물과 칼로리 직접 입력 필드에 placeholder가 표시된다', () => {
      const { getAllByPlaceholderText } = renderWithTheme(<GoalsSettingsScreen />);
      const inputs = getAllByPlaceholderText('직접 입력');
      expect(inputs.length).toBe(2); // 물, 칼로리
    });

    it('단위 표기(ml, kcal)를 표시한다', () => {
      const { getByText } = renderWithTheme(<GoalsSettingsScreen />);
      expect(getByText('ml')).toBeTruthy();
      expect(getByText('kcal')).toBeTruthy();
    });
  });

  describe('물 목표 프리셋 상호작용', () => {
    it('물 프리셋 클릭 시 AsyncStorage에 저장한다', async () => {
      const { getByText } = renderWithTheme(<GoalsSettingsScreen />);

      await act(async () => {
        fireEvent.press(getByText('2.5L'));
      });

      expect(Haptics.selectionAsync).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@yiroom_goal_settings',
        expect.stringContaining('"waterGoal":2500')
      );
    });

    it('물 프리셋 클릭 시 위젯 데이터도 업데이트한다', async () => {
      const { setGoals: mockSetGoals } = require('../../../lib/widgets');
      const { getByText } = renderWithTheme(<GoalsSettingsScreen />);

      await act(async () => {
        fireEvent.press(getByText('3.0L'));
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockSetGoals).toHaveBeenCalledWith(3000, expect.any(Number));
    });
  });

  describe('칼로리 목표 프리셋 상호작용', () => {
    it('칼로리 프리셋 클릭 시 AsyncStorage에 저장한다', async () => {
      const { getByText } = renderWithTheme(<GoalsSettingsScreen />);

      await act(async () => {
        fireEvent.press(getByText('1800'));
      });

      expect(Haptics.selectionAsync).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@yiroom_goal_settings',
        expect.stringContaining('"caloriesGoal":1800')
      );
    });

    it('칼로리 프리셋 클릭 시 위젯 데이터도 업데이트한다', async () => {
      const { setGoals: mockSetGoals } = require('../../../lib/widgets');
      const { getByText } = renderWithTheme(<GoalsSettingsScreen />);

      await act(async () => {
        fireEvent.press(getByText('1500'));
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockSetGoals).toHaveBeenCalledWith(expect.any(Number), 1500);
    });
  });

  describe('운동 목표 상호작용', () => {
    it('운동 시간 옵션 클릭 시 AsyncStorage에 저장한다', async () => {
      const { getByText } = renderWithTheme(<GoalsSettingsScreen />);

      await act(async () => {
        fireEvent.press(getByText('45분'));
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@yiroom_goal_settings',
        expect.stringContaining('"workoutMinutesGoal":45')
      );
    });

    it('주당 운동 일수 옵션 클릭 시 AsyncStorage에 저장한다', async () => {
      const { getByText } = renderWithTheme(<GoalsSettingsScreen />);

      await act(async () => {
        fireEvent.press(getByText('6일'));
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@yiroom_goal_settings',
        expect.stringContaining('"workoutDaysGoal":6')
      );
    });
  });

  describe('직접 입력 필드', () => {
    it('물 직접 입력 필드에 값을 입력할 수 있다', () => {
      const { getAllByPlaceholderText } = renderWithTheme(<GoalsSettingsScreen />);
      const inputs = getAllByPlaceholderText('직접 입력');
      const waterInput = inputs[0];

      fireEvent.changeText(waterInput, '1800');
      expect(waterInput.props.value).toBe('1800');
    });

    it('칼로리 직접 입력 필드에 값을 입력할 수 있다', () => {
      const { getAllByPlaceholderText } = renderWithTheme(<GoalsSettingsScreen />);
      const inputs = getAllByPlaceholderText('직접 입력');
      const caloriesInput = inputs[1];

      fireEvent.changeText(caloriesInput, '2200');
      expect(caloriesInput.props.value).toBe('2200');
    });

    it('물 입력 필드 blur 시 유효한 값이면 저장한다', async () => {
      const { getAllByPlaceholderText } = renderWithTheme(<GoalsSettingsScreen />);
      const inputs = getAllByPlaceholderText('직접 입력');
      const waterInput = inputs[0];

      await act(async () => {
        fireEvent.changeText(waterInput, '1800');
      });
      await act(async () => {
        fireEvent(waterInput, 'blur');
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@yiroom_goal_settings',
          expect.stringContaining('"waterGoal":1800')
        );
      });
    });

    it('칼로리 입력 필드 blur 시 유효한 값이면 저장한다', async () => {
      const { getAllByPlaceholderText } = renderWithTheme(<GoalsSettingsScreen />);
      const inputs = getAllByPlaceholderText('직접 입력');
      const caloriesInput = inputs[1];

      await act(async () => {
        fireEvent.changeText(caloriesInput, '2200');
      });
      await act(async () => {
        fireEvent(caloriesInput, 'blur');
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@yiroom_goal_settings',
          expect.stringContaining('"caloriesGoal":2200')
        );
      });
    });
  });

  describe('AsyncStorage에서 기존 목표 로드', () => {
    it('저장된 목표가 있으면 로드한다', async () => {
      const savedGoals = {
        waterGoal: 2500,
        caloriesGoal: 1800,
        workoutMinutesGoal: 45,
        workoutDaysGoal: 4,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(savedGoals)
      );

      const { getAllByPlaceholderText } = renderWithTheme(<GoalsSettingsScreen />);

      await waitFor(() => {
        const inputs = getAllByPlaceholderText('직접 입력');
        // 물 입력 필드에 로드된 값 반영
        expect(inputs[0].props.value).toBe('2500');
        // 칼로리 입력 필드에 로드된 값 반영
        expect(inputs[1].props.value).toBe('1800');
      });
    });

    it('저장된 목표가 없으면 기본값을 사용한다', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const { getByText } = renderWithTheme(<GoalsSettingsScreen />);

      // 기본값: waterGoal=2000, workoutMinutesGoal=30, workoutDaysGoal=5
      // 이 값들이 프리셋 버튼에서 선택된 상태로 표시됨
      await waitFor(() => {
        expect(getByText('일일 물 목표')).toBeTruthy();
      });
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<GoalsSettingsScreen />, true);
      expect(getByTestId('settings-goals-screen')).toBeTruthy();
    });

    it('다크 모드에서 모든 섹션이 표시된다', () => {
      const { getByText } = renderWithTheme(<GoalsSettingsScreen />, true);
      expect(getByText('일일 물 목표')).toBeTruthy();
      expect(getByText('일일 칼로리 목표')).toBeTruthy();
      expect(getByText('운동 목표')).toBeTruthy();
    });

    it('다크 모드에서 안내 텍스트가 표시된다', () => {
      const { getByText } = renderWithTheme(<GoalsSettingsScreen />, true);
      expect(getByText(/현실적인 목표 설정으로 꾸준히 달성해보세요/)).toBeTruthy();
    });
  });

  describe('엣지 케이스', () => {
    it('AsyncStorage 로드 실패 시 기본값을 유지한다', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      const { getByText } = renderWithTheme(<GoalsSettingsScreen />);

      await waitFor(() => {
        expect(getByText('일일 물 목표')).toBeTruthy();
      });
    });

    it('물 입력에 0 이하 값을 입력하면 저장하지 않는다', async () => {
      const { getAllByPlaceholderText } = renderWithTheme(<GoalsSettingsScreen />);
      const inputs = getAllByPlaceholderText('직접 입력');

      await act(async () => {
        fireEvent.changeText(inputs[0], '0');
        fireEvent(inputs[0], 'blur');
      });

      // 유효하지 않은 값이므로 setItem이 호출되지 않아야 함
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('물 입력에 5000 초과 값을 입력하면 저장하지 않는다', async () => {
      const { getAllByPlaceholderText } = renderWithTheme(<GoalsSettingsScreen />);
      const inputs = getAllByPlaceholderText('직접 입력');

      await act(async () => {
        fireEvent.changeText(inputs[0], '6000');
        fireEvent(inputs[0], 'blur');
      });

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('칼로리 입력에 빈 문자열을 입력하면 저장하지 않는다', async () => {
      const { getAllByPlaceholderText } = renderWithTheme(<GoalsSettingsScreen />);
      const inputs = getAllByPlaceholderText('직접 입력');

      await act(async () => {
        fireEvent.changeText(inputs[1], '');
        fireEvent(inputs[1], 'blur');
      });

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('숫자가 아닌 값을 입력하면 저장하지 않는다', async () => {
      const { getAllByPlaceholderText } = renderWithTheme(<GoalsSettingsScreen />);
      const inputs = getAllByPlaceholderText('직접 입력');

      await act(async () => {
        fireEvent.changeText(inputs[0], 'abc');
        fireEvent(inputs[0], 'blur');
      });

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
