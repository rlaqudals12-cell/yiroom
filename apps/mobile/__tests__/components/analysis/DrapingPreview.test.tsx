/**
 * DrapingPreview 테스트
 *
 * 퍼스널 컬러 드레이핑 시뮬레이터 컴포넌트.
 * 색상 팔레트 터치 시 오버레이 표시/제거(토글) 검증.
 * expo-image, expo-haptics 모킹 필수.
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

import { DrapingPreview } from '../../../components/analysis/DrapingPreview';

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

const IMAGE_URI = 'file:///user-photo.jpg';

const SPRING_PALETTE = [
  '#FF9A8B', // 코랄
  '#FFDAA3', // 피치
  '#FFE0B2', // 복숭아
  '#FFF9C4', // 레몬
];

// ============================================================
// 테스트
// ============================================================

describe('DrapingPreview', () => {
  describe('기본 렌더링', () => {
    it('기본 testID로 컨테이너를 렌더링해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} />
      );
      expect(getByTestId('draping-preview')).toBeTruthy();
    });

    it('커스텀 testID로 렌더링해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} testID="my-draping" />
      );
      expect(getByTestId('my-draping')).toBeTruthy();
    });

    it('사용자 이미지가 렌더링되어야 한다', () => {
      const { getAllByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} />
      );
      const images = getAllByTestId('expo-image');
      expect(images.length).toBeGreaterThanOrEqual(1);
    });

    it('안내 텍스트가 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} />
      );
      expect(getByText('색상을 터치하여 드레이핑 효과를 확인하세요')).toBeTruthy();
    });
  });

  describe('시즌 정보 표시', () => {
    it('seasonName이 있을 때 시즌명을 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <DrapingPreview
          imageUri={IMAGE_URI}
          palette={SPRING_PALETTE}
          seasonName="봄 웜톤"
        />
      );
      expect(getByText('봄 웜톤')).toBeTruthy();
    });

    it('seasonDescription이 있을 때 설명을 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <DrapingPreview
          imageUri={IMAGE_URI}
          palette={SPRING_PALETTE}
          seasonName="봄 웜톤"
          seasonDescription="밝고 따뜻한 톤이 잘 어울려요"
        />
      );
      expect(getByText('밝고 따뜻한 톤이 잘 어울려요')).toBeTruthy();
    });

    it('seasonName이 없을 때 시즌명이 표시되지 않아야 한다', () => {
      const { queryByText } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} />
      );
      expect(queryByText('봄 웜톤')).toBeNull();
    });

    it('seasonDescription만 없을 때 시즌명만 표시되어야 한다', () => {
      const { getByText, queryByText } = renderWithTheme(
        <DrapingPreview
          imageUri={IMAGE_URI}
          palette={SPRING_PALETTE}
          seasonName="여름 쿨톤"
        />
      );
      expect(getByText('여름 쿨톤')).toBeTruthy();
      expect(queryByText('밝고 따뜻한')).toBeNull();
    });
  });

  describe('팔레트 색상 버튼', () => {
    it('팔레트 색상 수만큼 버튼이 렌더링되어야 한다', () => {
      const { getAllByRole } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} />
      );
      const buttons = getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(SPRING_PALETTE.length);
    });

    it('팔레트가 비어 있을 때도 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={[]} />
      );
      expect(getByTestId('draping-preview')).toBeTruthy();
    });

    it('팔레트 색상 버튼의 접근성 라벨이 색상 값을 포함해야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#FF9A8B']} />
      );
      expect(getByLabelText('#FF9A8B 색상 선택')).toBeTruthy();
    });

    it('단일 색상 팔레트로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#FF9A8B']} />
      );
      expect(getByTestId('draping-preview')).toBeTruthy();
    });
  });

  describe('색상 터치 — 오버레이 표시', () => {
    it('초기에는 오버레이 색상 라벨이 표시되지 않아야 한다', () => {
      const { queryByText } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#FF9A8B']} />
      );
      expect(queryByText('#FF9A8B')).toBeNull();
    });

    it('색상 버튼 터치 시 오버레이 색상 라벨이 표시되어야 한다', () => {
      const { getByLabelText, getByText } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#FF9A8B']} />
      );

      fireEvent.press(getByLabelText('#FF9A8B 색상 선택'));

      expect(getByText('#FF9A8B')).toBeTruthy();
    });

    it('색상 버튼 터치 시 선택 상태(accessibilityState.selected)가 true가 되어야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#FFDAA3']} />
      );

      const button = getByLabelText('#FFDAA3 색상 선택');
      expect(button.props.accessibilityState?.selected).toBeFalsy();

      fireEvent.press(button);

      expect(button.props.accessibilityState?.selected).toBe(true);
    });

    it('색상 버튼 터치 시 haptic 피드백이 호출되어야 한다', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { selectionAsync } = require('expo-haptics');
      selectionAsync.mockClear();

      const { getByLabelText } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#FFE0B2']} />
      );

      fireEvent.press(getByLabelText('#FFE0B2 색상 선택'));
      expect(selectionAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('색상 터치 — 오버레이 제거(토글)', () => {
    it('같은 색상 다시 터치 시 오버레이 색상 라벨이 제거되어야 한다', () => {
      const { getByLabelText, queryByText } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#FF9A8B']} />
      );

      const button = getByLabelText('#FF9A8B 색상 선택');

      // 첫 번째 터치: 오버레이 표시
      fireEvent.press(button);

      // 두 번째 터치: 토글로 제거
      fireEvent.press(button);

      expect(queryByText('#FF9A8B')).toBeNull();
    });

    it('같은 색상 다시 터치 시 선택 상태가 false로 돌아와야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#FFDAA3']} />
      );

      const button = getByLabelText('#FFDAA3 색상 선택');

      fireEvent.press(button);
      expect(button.props.accessibilityState?.selected).toBe(true);

      fireEvent.press(button);
      expect(button.props.accessibilityState?.selected).toBeFalsy();
    });

    it('다른 색상 터치 시 이전 선택 색상이 해제되어야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#FF9A8B', '#FFDAA3']} />
      );

      const firstButton = getByLabelText('#FF9A8B 색상 선택');
      const secondButton = getByLabelText('#FFDAA3 색상 선택');

      // 첫 번째 색상 선택
      fireEvent.press(firstButton);
      expect(firstButton.props.accessibilityState?.selected).toBe(true);

      // 두 번째 색상 선택 (첫 번째 해제)
      fireEvent.press(secondButton);
      expect(firstButton.props.accessibilityState?.selected).toBeFalsy();
      expect(secondButton.props.accessibilityState?.selected).toBe(true);
    });

    it('다른 색상 터치 시 이전 오버레이 색상 라벨이 사라져야 한다', () => {
      const { getByLabelText, queryByText } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#FF9A8B', '#FFDAA3']} />
      );

      fireEvent.press(getByLabelText('#FF9A8B 색상 선택'));
      fireEvent.press(getByLabelText('#FFDAA3 색상 선택'));

      expect(queryByText('#FF9A8B')).toBeNull();
    });
  });

  describe('엣지 케이스', () => {
    it('imageUri가 빈 문자열이어도 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri="" palette={SPRING_PALETTE} />
      );
      expect(getByTestId('draping-preview')).toBeTruthy();
    });

    it('커스텀 imageHeight prop으로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} imageHeight={400} />
      );
      expect(getByTestId('draping-preview')).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서도 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} />,
        true
      );
      expect(getByTestId('draping-preview')).toBeTruthy();
    });

    it('다크 모드에서 시즌 정보가 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <DrapingPreview
          imageUri={IMAGE_URI}
          palette={SPRING_PALETTE}
          seasonName="가을 웜톤"
          seasonDescription="깊고 풍성한 색감이 잘 어울려요"
        />,
        true
      );
      expect(getByText('가을 웜톤')).toBeTruthy();
      expect(getByText('깊고 풍성한 색감이 잘 어울려요')).toBeTruthy();
    });

    it('다크 모드에서 색상 토글이 동작해야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#FF9A8B']} />,
        true
      );

      const button = getByLabelText('#FF9A8B 색상 선택');
      fireEvent.press(button);
      expect(button.props.accessibilityState?.selected).toBe(true);

      fireEvent.press(button);
      expect(button.props.accessibilityState?.selected).toBeFalsy();
    });
  });
});
