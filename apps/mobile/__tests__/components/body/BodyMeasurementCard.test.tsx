/**
 * BodyMeasurementCard 컴포넌트 테스트
 *
 * 대상: components/body/BodyMeasurementCard.tsx
 * 신체 측정값(현재/이전/이상 범위) 시각화 카드 검증
 * - 기본 렌더링 (라벨, 값, 단위)
 * - 이전 값 대비 변화 표시 (증가/감소/유지)
 * - 이상 범위 바 (정상/범위 밖)
 * - 접근성
 * - 다크 모드
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { BodyMeasurementCard } from '../../../components/body/BodyMeasurementCard';
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
    },
  };
});

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_target: Record<string, unknown>, prop: string) => {
        if (typeof prop !== 'string' || prop === '__esModule') return undefined;
        return function MockIcon(props: Record<string, unknown>) {
          return <View testID={`icon-${prop}`} {...props} />;
        };
      },
    }
  );
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
// 테스트
// ============================================================

describe('BodyMeasurementCard', () => {
  describe('기본 렌더링', () => {
    it('렌더링된다', () => {
      const { getByTestId } = renderWithTheme(
        <BodyMeasurementCard label="허리둘레" value={72} unit="cm" />
      );
      expect(getByTestId('body-measurement-card')).toBeTruthy();
    });

    it('라벨과 값을 표시한다', () => {
      const { getByText } = renderWithTheme(
        <BodyMeasurementCard label="어깨너비" value={45} unit="cm" />
      );
      expect(getByText('어깨너비')).toBeTruthy();
      expect(getByText(/45/)).toBeTruthy();
    });

    it('단위를 표시한다', () => {
      const { getByText } = renderWithTheme(
        <BodyMeasurementCard label="체중" value={65} unit="kg" />
      );
      expect(getByText('kg')).toBeTruthy();
    });

    it('커스텀 testID를 사용할 수 있다', () => {
      const { getByTestId } = renderWithTheme(
        <BodyMeasurementCard
          label="허리둘레"
          value={72}
          unit="cm"
          testID="custom-card"
        />
      );
      expect(getByTestId('custom-card')).toBeTruthy();
    });
  });

  describe('이전 값 대비 변화 표시', () => {
    it('이전 값과 차이를 표시한다 (증가)', () => {
      const { getByText, getByTestId } = renderWithTheme(
        <BodyMeasurementCard
          label="허리둘레"
          value={75}
          unit="cm"
          previousValue={72}
        />
      );
      // 차이: 75 - 72 = 3.0
      expect(getByText('3.0cm')).toBeTruthy();
      // 증가 시 ArrowUp 아이콘 표시
      expect(getByTestId('icon-ArrowUp')).toBeTruthy();
    });

    it('이전 값과 차이를 표시한다 (감소)', () => {
      const { getByText, getByTestId } = renderWithTheme(
        <BodyMeasurementCard
          label="체중"
          value={63}
          unit="kg"
          previousValue={65}
        />
      );
      // 차이: |63 - 65| = 2.0
      expect(getByText('2.0kg')).toBeTruthy();
      // 감소 시 ArrowDown 아이콘 표시
      expect(getByTestId('icon-ArrowDown')).toBeTruthy();
    });

    it('이전 값과 동일하면 변화 뱃지를 표시하지 않는다', () => {
      const { queryByTestId } = renderWithTheme(
        <BodyMeasurementCard
          label="허리둘레"
          value={72}
          unit="cm"
          previousValue={72}
        />
      );
      expect(queryByTestId('icon-ArrowUp')).toBeNull();
      expect(queryByTestId('icon-ArrowDown')).toBeNull();
    });

    it('previousValue가 없으면 변화 뱃지를 표시하지 않는다', () => {
      const { queryByTestId } = renderWithTheme(
        <BodyMeasurementCard label="허리둘레" value={72} unit="cm" />
      );
      expect(queryByTestId('icon-ArrowUp')).toBeNull();
      expect(queryByTestId('icon-ArrowDown')).toBeNull();
    });
  });

  describe('이상 범위 표시', () => {
    it('이상 범위를 표시한다 (정상 범위 내)', () => {
      const { getByText } = renderWithTheme(
        <BodyMeasurementCard
          label="허리둘레"
          value={72}
          unit="cm"
          idealRange={{ min: 65, max: 80 }}
        />
      );
      expect(getByText('정상 범위')).toBeTruthy();
      // 범위 라벨도 표시
      expect(getByText('65cm')).toBeTruthy();
      expect(getByText('80cm')).toBeTruthy();
    });

    it('범위 밖 상태를 표시한다 (값이 최소보다 작음)', () => {
      const { getByText } = renderWithTheme(
        <BodyMeasurementCard
          label="허리둘레"
          value={60}
          unit="cm"
          idealRange={{ min: 65, max: 80 }}
        />
      );
      expect(getByText('범위 밖')).toBeTruthy();
    });

    it('범위 밖 상태를 표시한다 (값이 최대보다 큼)', () => {
      const { getByText } = renderWithTheme(
        <BodyMeasurementCard
          label="허리둘레"
          value={85}
          unit="cm"
          idealRange={{ min: 65, max: 80 }}
        />
      );
      expect(getByText('범위 밖')).toBeTruthy();
    });

    it('idealRange가 없으면 범위 바를 표시하지 않는다', () => {
      const { queryByText } = renderWithTheme(
        <BodyMeasurementCard label="허리둘레" value={72} unit="cm" />
      );
      expect(queryByText('정상 범위')).toBeNull();
      expect(queryByText('범위 밖')).toBeNull();
    });

    it('경계값에서 정상 범위로 판정한다 (min 경계)', () => {
      const { getByText } = renderWithTheme(
        <BodyMeasurementCard
          label="허리둘레"
          value={65}
          unit="cm"
          idealRange={{ min: 65, max: 80 }}
        />
      );
      expect(getByText('정상 범위')).toBeTruthy();
    });

    it('경계값에서 정상 범위로 판정한다 (max 경계)', () => {
      const { getByText } = renderWithTheme(
        <BodyMeasurementCard
          label="허리둘레"
          value={80}
          unit="cm"
          idealRange={{ min: 65, max: 80 }}
        />
      );
      expect(getByText('정상 범위')).toBeTruthy();
    });
  });

  describe('접근성', () => {
    it('접근성 레이블이 있다 (기본: 라벨, 값, 단위)', () => {
      const { getByTestId } = renderWithTheme(
        <BodyMeasurementCard label="허리둘레" value={72} unit="cm" />
      );
      const card = getByTestId('body-measurement-card');
      expect(card.props.accessibilityLabel).toBe('허리둘레: 72cm');
    });

    it('접근성 레이블에 증가 정보가 포함된다', () => {
      const { getByTestId } = renderWithTheme(
        <BodyMeasurementCard
          label="체중"
          value={67}
          unit="kg"
          previousValue={65}
        />
      );
      const card = getByTestId('body-measurement-card');
      expect(card.props.accessibilityLabel).toContain('증가');
    });

    it('접근성 레이블에 감소 정보가 포함된다', () => {
      const { getByTestId } = renderWithTheme(
        <BodyMeasurementCard
          label="체중"
          value={63}
          unit="kg"
          previousValue={65}
        />
      );
      const card = getByTestId('body-measurement-card');
      expect(card.props.accessibilityLabel).toContain('감소');
    });

    it('접근성 레이블에 유지 정보가 포함된다', () => {
      const { getByTestId } = renderWithTheme(
        <BodyMeasurementCard
          label="체중"
          value={65}
          unit="kg"
          previousValue={65}
        />
      );
      const card = getByTestId('body-measurement-card');
      expect(card.props.accessibilityLabel).toContain('유지');
    });
  });

  describe('다크 모드', () => {
    it('다크모드에서 렌더링된다', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <BodyMeasurementCard
          label="허리둘레"
          value={72}
          unit="cm"
          previousValue={70}
          idealRange={{ min: 65, max: 80 }}
        />,
        true
      );
      expect(getByTestId('body-measurement-card')).toBeTruthy();
      expect(getByText('허리둘레')).toBeTruthy();
      expect(getByText('정상 범위')).toBeTruthy();
    });
  });
});
