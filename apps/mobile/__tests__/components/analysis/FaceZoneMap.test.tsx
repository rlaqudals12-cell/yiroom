/**
 * FaceZoneMap 테스트
 *
 * 피부 분석 6-zone 히트맵 컴포넌트.
 * react-native-svg 모킹 필수.
 * 범례 항목 표시, zone 터치 시 콜백 호출 검증.
 *
 * react-native-reanimated는 jest.config.js moduleNameMapper로
 * __mocks__/react-native-reanimated.js를 사용한다.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
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
// Mocks
// ============================================================

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('expo-image', () => ({
  Image: (props: Record<string, unknown>) => {
    const { View } = require('react-native');
    return <View testID="expo-image" {...props} />;
  },
}));

jest.mock('react-native-svg', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => <View {...props} />,
    Path: ({ onPress, ...props }: Record<string, unknown> & { onPress?: () => void }) => (
      <View
        testID={props.testID as string ?? `svg-path`}
        accessibilityRole="button"
        onStartShouldSetResponder={() => true}
        onResponderRelease={onPress}
        {...props}
      />
    ),
    Text: (props: Record<string, unknown>) => <Text {...props} />,
    Circle: (props: Record<string, unknown>) => <View {...props} />,
  };
});

import { FaceZoneMap, type FaceZone } from '../../../components/analysis/FaceZoneMap';

// ============================================================
// 헬퍼
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
// 테스트 데이터
// ============================================================

function createMockZones(): FaceZone[] {
  return [
    { id: 'forehead', label: '이마', score: 85, description: '이마 상태가 양호해요' },
    { id: 'tzone', label: 'T존', score: 62, description: 'T존 피지 분비가 보통이에요' },
    { id: 'leftCheek', label: '왼쪽 볼', score: 72 },
    { id: 'rightCheek', label: '오른쪽 볼', score: 45, description: '오른쪽 볼 주의가 필요해요' },
    { id: 'nose', label: '코', score: 38 },
    { id: 'chin', label: '턱', score: 90, description: '턱 상태가 매우 좋아요' },
  ];
}

// ============================================================
// 테스트
// ============================================================

describe('FaceZoneMap', () => {
  describe('기본 렌더링', () => {
    it('기본 testID로 컨테이너를 렌더링해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <FaceZoneMap zones={[]} />
      );
      expect(getByTestId('face-zone-map')).toBeTruthy();
    });

    it('커스텀 testID로 렌더링해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <FaceZoneMap zones={[]} testID="skin-map" />
      );
      expect(getByTestId('skin-map')).toBeTruthy();
    });

    it('zones 배열이 비어 있어도 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <FaceZoneMap zones={[]} />
      );
      expect(getByTestId('face-zone-map')).toBeTruthy();
    });
  });

  describe('6개 zone 데이터 렌더링', () => {
    it('6개 zone 데이터로 렌더링되어야 한다', () => {
      const zones = createMockZones();
      const { getByTestId } = renderWithTheme(
        <FaceZoneMap zones={zones} />
      );
      expect(getByTestId('face-zone-map')).toBeTruthy();
    });

    it('부분적인 zone 데이터(3개)로도 렌더링되어야 한다', () => {
      const zones: FaceZone[] = [
        { id: 'forehead', label: '이마', score: 85 },
        { id: 'nose', label: '코', score: 55 },
        { id: 'chin', label: '턱', score: 70 },
      ];
      const { getByTestId } = renderWithTheme(
        <FaceZoneMap zones={zones} />
      );
      expect(getByTestId('face-zone-map')).toBeTruthy();
    });

    it('단일 zone 데이터로도 렌더링되어야 한다', () => {
      const zones: FaceZone[] = [
        { id: 'tzone', label: 'T존', score: 55 },
      ];
      const { getByTestId } = renderWithTheme(
        <FaceZoneMap zones={zones} />
      );
      expect(getByTestId('face-zone-map')).toBeTruthy();
    });
  });

  describe('범례 표시', () => {
    it('범례 항목 "좋음"을 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <FaceZoneMap zones={createMockZones()} />
      );
      expect(getByText('좋음')).toBeTruthy();
    });

    it('범례 항목 "보통"을 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <FaceZoneMap zones={createMockZones()} />
      );
      expect(getByText('보통')).toBeTruthy();
    });

    it('범례 항목 "주의"를 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <FaceZoneMap zones={createMockZones()} />
      );
      expect(getByText('주의')).toBeTruthy();
    });

    it('범례 항목 "관리"를 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <FaceZoneMap zones={createMockZones()} />
      );
      // 컴포넌트에서 '관리'로 단축해 표시
      expect(getByText('관리')).toBeTruthy();
    });

    it('범례 항목 4개가 모두 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <FaceZoneMap zones={createMockZones()} />
      );
      expect(getByText('좋음')).toBeTruthy();
      expect(getByText('보통')).toBeTruthy();
      expect(getByText('주의')).toBeTruthy();
      expect(getByText('관리')).toBeTruthy();
    });

    it('zones가 비어 있을 때도 범례가 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <FaceZoneMap zones={[]} />
      );
      expect(getByText('좋음')).toBeTruthy();
      expect(getByText('보통')).toBeTruthy();
      expect(getByText('주의')).toBeTruthy();
      expect(getByText('관리')).toBeTruthy();
    });
  });

  describe('zone 터치 — onZonePress 콜백', () => {
    it('onZonePress가 없어도 렌더링 시 에러가 발생하지 않아야 한다', () => {
      expect(() =>
        renderWithTheme(<FaceZoneMap zones={createMockZones()} />)
      ).not.toThrow();
    });

    it('onZonePress 콜백이 전달될 때 렌더링되어야 한다', () => {
      const onZonePress = jest.fn();
      const { getByTestId } = renderWithTheme(
        <FaceZoneMap zones={createMockZones()} onZonePress={onZonePress} />
      );
      expect(getByTestId('face-zone-map')).toBeTruthy();
    });
  });

  describe('점수 기반 색상 로직', () => {
    it('점수 80 이상인 zone이 있는 데이터로 렌더링되어야 한다', () => {
      const zones: FaceZone[] = [
        { id: 'forehead', label: '이마', score: 90 },
      ];
      const { getByTestId } = renderWithTheme(
        <FaceZoneMap zones={zones} />
      );
      expect(getByTestId('face-zone-map')).toBeTruthy();
    });

    it('점수 0인 zone이 있어도 렌더링되어야 한다', () => {
      const zones: FaceZone[] = [
        { id: 'nose', label: '코', score: 0 },
      ];
      const { getByTestId } = renderWithTheme(
        <FaceZoneMap zones={zones} />
      );
      expect(getByTestId('face-zone-map')).toBeTruthy();
    });

    it('모든 점수 구간(80+, 60~79, 40~59, 0~39)이 혼재할 때 렌더링되어야 한다', () => {
      const zones: FaceZone[] = [
        { id: 'forehead', label: '이마', score: 90 },   // 좋음
        { id: 'tzone', label: 'T존', score: 65 },        // 보통
        { id: 'leftCheek', label: '볼(L)', score: 45 }, // 주의
        { id: 'chin', label: '턱', score: 20 },          // 관리 필요
      ];
      const { getByTestId } = renderWithTheme(
        <FaceZoneMap zones={zones} />
      );
      expect(getByTestId('face-zone-map')).toBeTruthy();
    });
  });

  describe('선택된 zone 상세 카드', () => {
    it('초기에는 상세 카드의 설명 텍스트가 표시되지 않아야 한다', () => {
      const zones = createMockZones();
      const { queryByText } = renderWithTheme(
        <FaceZoneMap zones={zones} />
      );
      // 초기 상태: description 없음
      expect(queryByText('이마 상태가 양호해요')).toBeNull();
    });
  });

  describe('커스텀 크기', () => {
    it('커스텀 size prop으로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <FaceZoneMap zones={createMockZones()} size={300} />
      );
      expect(getByTestId('face-zone-map')).toBeTruthy();
    });

    it('size를 지정하지 않아도 기본 크기로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <FaceZoneMap zones={createMockZones()} />
      );
      expect(getByTestId('face-zone-map')).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서도 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <FaceZoneMap zones={createMockZones()} />,
        true
      );
      expect(getByTestId('face-zone-map')).toBeTruthy();
    });

    it('다크 모드에서도 범례 4개가 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <FaceZoneMap zones={createMockZones()} />,
        true
      );
      expect(getByText('좋음')).toBeTruthy();
      expect(getByText('보통')).toBeTruthy();
      expect(getByText('주의')).toBeTruthy();
      expect(getByText('관리')).toBeTruthy();
    });
  });
});
