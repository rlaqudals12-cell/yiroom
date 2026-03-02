/**
 * BodyProportionChart 컴포넌트 테스트
 *
 * 대상: components/body/BodyProportionChart.tsx
 * 수평 막대 차트로 신체 비율 시각화 검증
 * - 기본 렌더링 (제목, 라벨, 퍼센티지)
 * - 커스텀 제목
 * - 빈 배열 처리
 * - 접근성
 * - 다크 모드
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { BodyProportionChart } from '../../../components/body/BodyProportionChart';
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
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';

// ============================================================
// Mocks
// ============================================================

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (comp: unknown) => comp,
    },
    FadeInDown: {
      duration: () => ({
        springify: () => ({}),
      }),
      delay: () => ({
        duration: () => ({}),
      }),
    },
  };
});

// ============================================================
// 테마 헬퍼
// ============================================================

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
    themeMode: 'system',
    setThemeMode: jest.fn(),
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
// 테스트 데이터
// ============================================================

const mockMeasurements = [
  { label: '어깨', value: 45, maxValue: 60 },
  { label: '허리', value: 72, maxValue: 100 },
  { label: '힙', value: 95, maxValue: 120 },
];

// ============================================================
// 테스트
// ============================================================

describe('BodyProportionChart', () => {
  describe('기본 렌더링', () => {
    it('렌더링된다', () => {
      const { getByTestId } = renderWithTheme(
        <BodyProportionChart measurements={mockMeasurements} />
      );
      expect(getByTestId('body-proportion-chart')).toBeTruthy();
    });

    it('커스텀 testID를 사용할 수 있다', () => {
      const { getByTestId } = renderWithTheme(
        <BodyProportionChart
          measurements={mockMeasurements}
          testID="custom-chart"
        />
      );
      expect(getByTestId('custom-chart')).toBeTruthy();
    });
  });

  describe('제목 표시', () => {
    it('기본 제목 "신체 비율"을 표시한다', () => {
      const { getByText } = renderWithTheme(
        <BodyProportionChart measurements={mockMeasurements} />
      );
      expect(getByText('신체 비율')).toBeTruthy();
    });

    it('커스텀 제목을 표시한다', () => {
      const { getByText } = renderWithTheme(
        <BodyProportionChart
          measurements={mockMeasurements}
          title="상체 비율"
        />
      );
      expect(getByText('상체 비율')).toBeTruthy();
    });
  });

  describe('측정값 표시', () => {
    it('측정값 라벨을 표시한다', () => {
      const { getByText } = renderWithTheme(
        <BodyProportionChart measurements={mockMeasurements} />
      );
      expect(getByText('어깨')).toBeTruthy();
      expect(getByText('허리')).toBeTruthy();
      expect(getByText('힙')).toBeTruthy();
    });

    it('퍼센티지를 표시한다', () => {
      const { getByText } = renderWithTheme(
        <BodyProportionChart measurements={mockMeasurements} />
      );
      // 어깨: Math.min(100, Math.round((45/60)*100)) = 75%
      expect(getByText('75%')).toBeTruthy();
      // 허리: Math.min(100, Math.round((72/100)*100)) = 72%
      expect(getByText('72%')).toBeTruthy();
      // 힙: Math.min(100, Math.round((95/120)*100)) = 79%
      expect(getByText('79%')).toBeTruthy();
    });

    it('100%를 초과하지 않는다', () => {
      const overflowData = [
        { label: '테스트', value: 150, maxValue: 100 },
      ];
      const { getByText } = renderWithTheme(
        <BodyProportionChart measurements={overflowData} />
      );
      // Math.min(100, Math.round((150/100)*100)) = 100%
      expect(getByText('100%')).toBeTruthy();
    });
  });

  describe('접근성', () => {
    it('접근성 레이블이 있다', () => {
      const { getByTestId } = renderWithTheme(
        <BodyProportionChart measurements={mockMeasurements} />
      );
      const chart = getByTestId('body-proportion-chart');
      expect(chart.props.accessibilityLabel).toBe('신체 비율: 3개 항목');
    });

    it('커스텀 제목이 접근성 레이블에 반영된다', () => {
      const { getByTestId } = renderWithTheme(
        <BodyProportionChart
          measurements={mockMeasurements}
          title="상체 비율"
        />
      );
      const chart = getByTestId('body-proportion-chart');
      expect(chart.props.accessibilityLabel).toBe('상체 비율: 3개 항목');
    });

    it('커스텀 제목과 항목 수가 접근성 레이블에 포함된다', () => {
      const { getByTestId } = renderWithTheme(
        <BodyProportionChart
          measurements={mockMeasurements}
          title="하체 비율"
          testID="lower-chart"
        />
      );
      const chart = getByTestId('lower-chart');
      expect(chart.props.accessibilityLabel).toBe('하체 비율: 3개 항목');
    });

    it('각 측정 행에 접근성 레이블이 있다', () => {
      const { getByLabelText } = renderWithTheme(
        <BodyProportionChart measurements={mockMeasurements} />
      );
      // 어깨: value=45, percentage=75%
      expect(getByLabelText('어깨: 45, 75%')).toBeTruthy();
      // 허리: value=72, percentage=72%
      expect(getByLabelText('허리: 72, 72%')).toBeTruthy();
      // 힙: value=95, percentage=79%
      expect(getByLabelText('힙: 95, 79%')).toBeTruthy();
    });
  });

  describe('엣지 케이스', () => {
    it('빈 배열도 처리한다', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <BodyProportionChart measurements={[]} />
      );
      // 컨테이너와 제목은 표시됨
      expect(getByTestId('body-proportion-chart')).toBeTruthy();
      expect(getByText('신체 비율')).toBeTruthy();
    });

    it('빈 배열일 때 접근성 레이블에 0개 항목이 표시된다', () => {
      const { getByTestId } = renderWithTheme(
        <BodyProportionChart measurements={[]} />
      );
      const chart = getByTestId('body-proportion-chart');
      expect(chart.props.accessibilityLabel).toBe('신체 비율: 0개 항목');
    });

    it('단일 항목도 정상 렌더링된다', () => {
      const single = [{ label: '키', value: 175, maxValue: 200 }];
      const { getByText } = renderWithTheme(
        <BodyProportionChart measurements={single} />
      );
      expect(getByText('키')).toBeTruthy();
      // Math.min(100, Math.round((175/200)*100)) = 88%
      expect(getByText('88%')).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크모드에서 렌더링된다', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <BodyProportionChart measurements={mockMeasurements} />,
        true
      );
      expect(getByTestId('body-proportion-chart')).toBeTruthy();
      expect(getByText('신체 비율')).toBeTruthy();
      expect(getByText('어깨')).toBeTruthy();
      expect(getByText('75%')).toBeTruthy();
    });
  });
});
