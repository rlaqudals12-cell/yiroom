/**
 * DrapingPreview 테스트 (2026-08 정직성 패리티 개편)
 *
 * 검증 축:
 *  - 전면 틴트 부재: 사진 전체를 덮는 색 오버레이가 없어야 한다(비교 왜곡 방지)
 *  - 하단 색천 밴드 존재: 사진 하단 13%에만 색천이 올라간다
 *  - 베스트/회피 병치 렌더 + 스와치 교체
 *  - 정직 고지·관찰 지시 노출
 *  - 색 라벨은 #hex 원문이 아닌 한국어 색명
 *
 * expo-image / expo-haptics 모킹 필수.
 * react-native-reanimated는 jest.config.js moduleNameMapper의 mock을 사용한다.
 */

import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
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
import { REPORT_COLORS } from '../../../components/analysis/report/tokens';

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
    themeMode: 'system' as const,
    setThemeMode: jest.fn(),
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>
  );
}

/** 스타일 배열/객체를 평탄화해 하나의 객체로 (RN style prop 대응) */
function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>((acc, s) => ({ ...acc, ...flattenStyle(s) }), {});
  }
  if (style && typeof style === 'object') return style as Record<string, unknown>;
  return {};
}

/** 렌더 트리 전체의 style을 수집 (전면 틴트 회귀 감시용) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectStyles(node: any): Record<string, unknown>[] {
  if (!node) return [];
  const nodes = Array.isArray(node) ? node : [node];
  return nodes.flatMap((n) => {
    if (!n || typeof n !== 'object') return [];
    const own = n.props?.style ? [flattenStyle(n.props.style)] : [];
    return [...own, ...collectStyles(n.children)];
  });
}

// ============================================================
// 테스트 데이터
// ============================================================

const IMAGE_URI = 'file:///user-photo.jpg';

const SPRING_PALETTE = [
  '#FF9A8B', // 라이트 레드 (hue 7.8°)
  '#FFDAA3', // 라이트 골드
  '#FFE0B2', // 라이트 골드
  '#FFF9C4', // 라이트 옐로
];

const AVOID_PALETTE = ['#000000', '#808080']; // 차콜 · 그레이

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
      expect(getAllByTestId('expo-image').length).toBeGreaterThanOrEqual(1);
    });

    it('관찰 지시 문구가 표시되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} />
      );
      expect(getByTestId('draping-observe-hint').props.children).toContain('눈밑 그늘');
    });
  });

  describe('정직 고지', () => {
    it('정직 고지가 항상 표시되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} />
      );
      expect(getByTestId('draping-note')).toBeTruthy();
    });

    it('고지에 가상 합성·기기 내 처리가 명시되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} />
      );
      const note = getByTestId('draping-note').props.children as string;
      expect(note).toContain('가상 드레이프 합성');
      expect(note).toContain('이 기기에서만');
    });
  });

  describe('색천 밴드 (전면 틴트 폐지)', () => {
    it('선택된 색의 밴드가 사진 하단에만 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#FF9A8B']} />
      );
      const band = getByTestId('draping-band-best');
      expect(band).toBeTruthy();
      // 밴드는 선택된 hex의 솔리드 rgba 색면이어야 한다
      expect(flattenStyle(band.props.style).backgroundColor).toBe('rgba(255, 154, 139, 0.92)');
      expect(band.props.colors).toBeUndefined();
    });

    it('밴드 래퍼는 하단 13% 높이로 절대배치되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#FF9A8B']} />
      );
      const style = flattenStyle(getByTestId('draping-band-wrap-best').props.style);
      expect(style.position).toBe('absolute');
      expect(style.bottom).toBe(0);
      expect(style.height).toBe('13%');
    });

    it('사진 전체를 덮는 색 오버레이(전면 틴트)가 없어야 한다', () => {
      const { toJSON } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#FF9A8B']} avoidPalette={['#000000']} />
      );

      // 회귀 감시: absoluteFill(top·bottom 0) + 팔레트 색 backgroundColor = 구현 v1 전면 틴트
      const fullTint = collectStyles(toJSON()).filter(
        (s) =>
          (s.backgroundColor === '#FF9A8B' ||
            s.backgroundColor === '#000000' ||
            s.backgroundColor === 'rgba(255, 154, 139, 0.92)' ||
            s.backgroundColor === 'rgba(0, 0, 0, 0.92)') &&
          s.position === 'absolute' &&
          s.top === 0 &&
          s.bottom === 0
      );
      expect(fullTint).toHaveLength(0);
    });

    it('다른 색 스와치를 누르면 밴드 색이 바뀌어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#FF9A8B', '#FFDAA3']} />
      );

      fireEvent.press(getByTestId('draping-swatch-best-1'));

      expect(flattenStyle(getByTestId('draping-band-best').props.style).backgroundColor).toBe(
        'rgba(255, 218, 163, 0.92)'
      );
    });
  });

  describe('베스트/회피 병치 비교', () => {
    it('avoidPalette가 있으면 두 열이 함께 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview
          imageUri={IMAGE_URI}
          palette={SPRING_PALETTE}
          avoidPalette={AVOID_PALETTE}
        />
      );
      expect(getByTestId('draping-figure-best')).toBeTruthy();
      expect(getByTestId('draping-figure-avoid')).toBeTruthy();
      expect(getByTestId('draping-band-avoid')).toBeTruthy();
    });

    it('병치 시 같은 사진이 양쪽에 쓰여야 한다', () => {
      const { getAllByTestId } = renderWithTheme(
        <DrapingPreview
          imageUri={IMAGE_URI}
          palette={SPRING_PALETTE}
          avoidPalette={AVOID_PALETTE}
        />
      );
      const images = getAllByTestId('expo-image');
      expect(images).toHaveLength(2);
      images.forEach((img) => {
        expect((img.props.source as { uri: string }).uri).toBe(IMAGE_URI);
      });
    });

    it('avoidPalette가 없으면 회피 열이 렌더링되지 않아야 한다', () => {
      const { queryByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} />
      );
      expect(queryByTestId('draping-figure-avoid')).toBeNull();
      expect(queryByTestId('draping-band-avoid')).toBeNull();
    });

    it('회피 열의 스와치도 독립적으로 교체되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview
          imageUri={IMAGE_URI}
          palette={SPRING_PALETTE}
          avoidPalette={AVOID_PALETTE}
        />
      );

      fireEvent.press(getByTestId('draping-swatch-avoid-1'));

      expect(flattenStyle(getByTestId('draping-band-avoid').props.style).backgroundColor).toBe(
        'rgba(128, 128, 128, 0.92)'
      );
      // 베스트 열은 영향받지 않는다
      expect(flattenStyle(getByTestId('draping-band-best').props.style).backgroundColor).toBe(
        'rgba(255, 154, 139, 0.92)'
      );
    });
  });

  describe('색 라벨 — 색명 표기', () => {
    it('캡션이 #hex 원문이 아닌 한국어 색명이어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#FF9A8B']} />
      );
      const caption = getByTestId('draping-caption-best').props.children as string;
      expect(caption).toContain('베스트');
      expect(caption).toContain('레드'); // #FF9A8B = hue 7.8° → 라이트 레드 (웹 getKoreanColorName과 동일)
      expect(caption).not.toContain('#FF9A8B');
    });

    it('회피 열 캡션에 회피 라벨이 붙어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} avoidPalette={['#000000']} />
      );
      const caption = getByTestId('draping-caption-avoid').props.children as string;
      expect(caption).toContain('피해야 할 색');
      expect(caption).toContain('차콜');
    });

    it('스와치 접근성 라벨이 hex가 아닌 색명을 써야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#FF9A8B']} />
      );
      const label = getByTestId('draping-swatch-best-0').props.accessibilityLabel as string;
      expect(label).toBe('베스트 라이트 레드 선택');
    });
  });

  describe('스와치 선택 상태', () => {
    it('첫 색이 기본 선택 상태여야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} />
      );
      expect(getByTestId('draping-swatch-best-0').props.accessibilityState?.selected).toBe(true);
      expect(getByTestId('draping-swatch-best-1').props.accessibilityState?.selected).toBe(false);
    });

    it('스와치를 누르면 선택 상태가 이동해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} />
      );

      fireEvent.press(getByTestId('draping-swatch-best-2'));

      expect(getByTestId('draping-swatch-best-2').props.accessibilityState?.selected).toBe(true);
      expect(getByTestId('draping-swatch-best-0').props.accessibilityState?.selected).toBe(false);
    });

    it('스와치 터치 시 haptic 피드백이 호출되어야 한다', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { selectionAsync } = require('expo-haptics');
      selectionAsync.mockClear();

      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} />
      );

      fireEvent.press(getByTestId('draping-swatch-best-1'));
      expect(selectionAsync).toHaveBeenCalledTimes(1);
    });

    it('팔레트 색상 수만큼 스와치가 렌더링되어야 한다', () => {
      const { getAllByRole } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} />
      );
      expect(getAllByRole('button').length).toBe(SPRING_PALETTE.length);
    });
  });

  describe('시즌 정보 표시', () => {
    it('seasonName이 있을 때 시즌명을 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} seasonName="봄 웜톤" />
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
  });

  describe('엣지 케이스', () => {
    it('팔레트가 비어 있으면 사유를 표기해야 한다 (조용한 숨김 금지)', () => {
      const { getByTestId, queryByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={[]} />
      );
      expect(getByTestId('draping-preview')).toBeTruthy();
      expect(getByTestId('draping-empty')).toBeTruthy();
      expect(queryByTestId('draping-band-best')).toBeNull();
    });

    it('imageUri가 빈 문자열이어도 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri="" palette={SPRING_PALETTE} />
      );
      expect(getByTestId('draping-preview')).toBeTruthy();
    });

    it('커스텀 imageHeight가 사진 최대 높이로 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={SPRING_PALETTE} imageHeight={400} />
      );
      const container = getByTestId('draping-photo-best');
      expect(flattenStyle(container.props.style).maxHeight).toBe(400);
    });

    it('3자리 hex도 색명·밴드 색으로 변환되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview imageUri={IMAGE_URI} palette={['#F00']} />
      );
      expect(flattenStyle(getByTestId('draping-band-best').props.style).backgroundColor).toBe(
        'rgba(255, 0, 0, 0.92)'
      );
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서도 병치 비교가 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <DrapingPreview
          imageUri={IMAGE_URI}
          palette={SPRING_PALETTE}
          avoidPalette={AVOID_PALETTE}
        />,
        true
      );
      expect(getByTestId('draping-figure-best')).toBeTruthy();
      expect(getByTestId('draping-figure-avoid')).toBeTruthy();
    });

    it('다크 모드에서도 시즌 정보는 진단지 잉크 색으로 고정되어야 한다', () => {
      const { getByText, getByTestId } = renderWithTheme(
        <DrapingPreview
          imageUri={IMAGE_URI}
          palette={SPRING_PALETTE}
          seasonName="가을 웜톤"
          seasonDescription="깊고 풍성한 색감이 잘 어울려요"
        />,
        true
      );
      expect(getByText('가을 웜톤')).toBeTruthy();
      expect(flattenStyle(getByText('가을 웜톤').props.style).color).toBe(REPORT_COLORS.ink);
      expect(getByText('깊고 풍성한 색감이 잘 어울려요')).toBeTruthy();
      expect(getByTestId('draping-note')).toBeTruthy();
    });
  });
});
