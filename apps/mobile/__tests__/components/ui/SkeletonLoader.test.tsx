/**
 * SkeletonLoader UI 컴포넌트 테스트
 *
 * 시머(shimmer) 로딩 플레이스홀더 4종의 렌더링, 크기, 스타일, 접근성, 다크 모드 검증.
 * - SkeletonLoader: 기본 (width/height/borderRadius 설정 가능)
 * - SkeletonText: 텍스트 플레이스홀더 (height 14)
 * - SkeletonCircle: 원형 플레이스홀더 (기본 size 48)
 * - SkeletonCard: 카드형 플레이스홀더 (height 120, radii.lg)
 *
 * react-native-reanimated는 __mocks__에서 자동 모킹됨.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

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
import {
  SkeletonLoader,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
} from '../../../components/ui/SkeletonLoader';

// ---------------------------------------------------------------------------
// 테마 헬퍼
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SkeletonLoader 기본 컴포넌트
// ---------------------------------------------------------------------------

describe('SkeletonLoader', () => {
  describe('기본 렌더링', () => {
    it('기본 props로 정상 렌더링되어야 한다', () => {
      const { getByLabelText } = renderWithTheme(<SkeletonLoader />);

      const skeleton = getByLabelText('로딩 중');
      expect(skeleton).toBeTruthy();
    });

    it('기본 width가 100%여야 한다', () => {
      const { getByLabelText } = renderWithTheme(<SkeletonLoader />);

      const skeleton = getByLabelText('로딩 중');
      const flatStyle = flattenStyle(skeleton.props.style);
      expect(flatStyle.width).toBe('100%');
    });

    it('기본 height가 16이어야 한다', () => {
      const { getByLabelText } = renderWithTheme(<SkeletonLoader />);

      const skeleton = getByLabelText('로딩 중');
      const flatStyle = flattenStyle(skeleton.props.style);
      expect(flatStyle.height).toBe(16);
    });

    it('기본 borderRadius가 4여야 한다', () => {
      const { getByLabelText } = renderWithTheme(<SkeletonLoader />);

      const skeleton = getByLabelText('로딩 중');
      const flatStyle = flattenStyle(skeleton.props.style);
      expect(flatStyle.borderRadius).toBe(4);
    });

    it('라이트 모드에서 muted 배경색을 사용해야 한다', () => {
      const { getByLabelText } = renderWithTheme(<SkeletonLoader />);

      const skeleton = getByLabelText('로딩 중');
      const flatStyle = flattenStyle(skeleton.props.style);
      expect(flatStyle.backgroundColor).toBe(lightColors.muted);
    });
  });

  describe('커스텀 props', () => {
    it('커스텀 width/height/borderRadius가 적용되어야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <SkeletonLoader width={200} height={40} borderRadius={12} />
      );

      const skeleton = getByLabelText('로딩 중');
      const flatStyle = flattenStyle(skeleton.props.style);
      expect(flatStyle.width).toBe(200);
      expect(flatStyle.height).toBe(40);
      expect(flatStyle.borderRadius).toBe(12);
    });

    it('퍼센트 문자열 width가 적용되어야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <SkeletonLoader width="50%" />
      );

      const skeleton = getByLabelText('로딩 중');
      const flatStyle = flattenStyle(skeleton.props.style);
      expect(flatStyle.width).toBe('50%');
    });

    it('testID가 정상 전달되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <SkeletonLoader testID="custom-skeleton" />
      );

      expect(getByTestId('custom-skeleton')).toBeTruthy();
    });

    it('추가 style이 병합되어야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <SkeletonLoader style={{ marginTop: 10 }} />
      );

      const skeleton = getByLabelText('로딩 중');
      const flatStyle = flattenStyle(skeleton.props.style);
      expect(flatStyle.marginTop).toBe(10);
    });
  });

  describe('접근성', () => {
    it('accessibilityRole이 none이어야 한다', () => {
      const { getByLabelText } = renderWithTheme(<SkeletonLoader />);

      const skeleton = getByLabelText('로딩 중');
      expect(skeleton.props.accessibilityRole).toBe('none');
    });

    it('accessibilityLabel이 "로딩 중"이어야 한다', () => {
      const { getByLabelText } = renderWithTheme(<SkeletonLoader />);

      // getByLabelText 성공 자체가 검증
      expect(getByLabelText('로딩 중')).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 다크 muted 배경색을 사용해야 한다', () => {
      const { getByLabelText } = renderWithTheme(<SkeletonLoader />, true);

      const skeleton = getByLabelText('로딩 중');
      const flatStyle = flattenStyle(skeleton.props.style);
      expect(flatStyle.backgroundColor).toBe(darkColors.muted);
    });

    it('다크 모드에서 커스텀 크기가 정상 적용되어야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <SkeletonLoader width={150} height={30} />,
        true
      );

      const skeleton = getByLabelText('로딩 중');
      const flatStyle = flattenStyle(skeleton.props.style);
      expect(flatStyle.width).toBe(150);
      expect(flatStyle.height).toBe(30);
    });
  });
});

// ---------------------------------------------------------------------------
// SkeletonText
// ---------------------------------------------------------------------------

describe('SkeletonText', () => {
  it('height가 14여야 한다', () => {
    const { getByLabelText } = renderWithTheme(<SkeletonText />);

    const skeleton = getByLabelText('로딩 중');
    const flatStyle = flattenStyle(skeleton.props.style);
    expect(flatStyle.height).toBe(14);
  });

  it('borderRadius가 4여야 한다', () => {
    const { getByLabelText } = renderWithTheme(<SkeletonText />);

    const skeleton = getByLabelText('로딩 중');
    const flatStyle = flattenStyle(skeleton.props.style);
    expect(flatStyle.borderRadius).toBe(4);
  });

  it('기본 testID가 skeleton-text여야 한다', () => {
    const { getByTestId } = renderWithTheme(<SkeletonText />);

    expect(getByTestId('skeleton-text')).toBeTruthy();
  });

  it('커스텀 testID가 적용되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <SkeletonText testID="custom-text" />
    );

    expect(getByTestId('custom-text')).toBeTruthy();
  });

  it('추가 style이 적용되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <SkeletonText style={{ width: '60%' }} />
    );

    const skeleton = getByLabelText('로딩 중');
    const flatStyle = flattenStyle(skeleton.props.style);
    expect(flatStyle.width).toBe('60%');
  });

  it('다크 모드에서 정상 렌더링되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(<SkeletonText />, true);

    const skeleton = getByLabelText('로딩 중');
    const flatStyle = flattenStyle(skeleton.props.style);
    expect(flatStyle.backgroundColor).toBe(darkColors.muted);
  });
});

// ---------------------------------------------------------------------------
// SkeletonCircle
// ---------------------------------------------------------------------------

describe('SkeletonCircle', () => {
  it('기본 size가 48이어야 한다', () => {
    const { getByLabelText } = renderWithTheme(<SkeletonCircle />);

    const skeleton = getByLabelText('로딩 중');
    const flatStyle = flattenStyle(skeleton.props.style);
    expect(flatStyle.width).toBe(48);
    expect(flatStyle.height).toBe(48);
  });

  it('기본 borderRadius가 size/2 (24)여야 한다', () => {
    const { getByLabelText } = renderWithTheme(<SkeletonCircle />);

    const skeleton = getByLabelText('로딩 중');
    const flatStyle = flattenStyle(skeleton.props.style);
    expect(flatStyle.borderRadius).toBe(24);
  });

  it('커스텀 size가 적용되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(<SkeletonCircle size={80} />);

    const skeleton = getByLabelText('로딩 중');
    const flatStyle = flattenStyle(skeleton.props.style);
    expect(flatStyle.width).toBe(80);
    expect(flatStyle.height).toBe(80);
    expect(flatStyle.borderRadius).toBe(40);
  });

  it('기본 testID가 skeleton-circle이어야 한다', () => {
    const { getByTestId } = renderWithTheme(<SkeletonCircle />);

    expect(getByTestId('skeleton-circle')).toBeTruthy();
  });

  it('커스텀 testID가 적용되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <SkeletonCircle testID="avatar-skeleton" />
    );

    expect(getByTestId('avatar-skeleton')).toBeTruthy();
  });

  it('추가 style이 적용되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <SkeletonCircle style={{ marginRight: 12 }} />
    );

    const skeleton = getByLabelText('로딩 중');
    const flatStyle = flattenStyle(skeleton.props.style);
    expect(flatStyle.marginRight).toBe(12);
  });

  it('다크 모드에서 정상 렌더링되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(<SkeletonCircle />, true);

    const skeleton = getByLabelText('로딩 중');
    const flatStyle = flattenStyle(skeleton.props.style);
    expect(flatStyle.backgroundColor).toBe(darkColors.muted);
  });
});

// ---------------------------------------------------------------------------
// SkeletonCard
// ---------------------------------------------------------------------------

describe('SkeletonCard', () => {
  it('height가 120이어야 한다', () => {
    const { getByLabelText } = renderWithTheme(<SkeletonCard />);

    const skeleton = getByLabelText('로딩 중');
    const flatStyle = flattenStyle(skeleton.props.style);
    expect(flatStyle.height).toBe(120);
  });

  it('borderRadius가 radii.xl (16)여야 한다', () => {
    const { getByLabelText } = renderWithTheme(<SkeletonCard />);

    const skeleton = getByLabelText('로딩 중');
    const flatStyle = flattenStyle(skeleton.props.style);
    expect(flatStyle.borderRadius).toBe(radii.xl);
  });

  it('기본 testID가 skeleton-card여야 한다', () => {
    const { getByTestId } = renderWithTheme(<SkeletonCard />);

    expect(getByTestId('skeleton-card')).toBeTruthy();
  });

  it('커스텀 testID가 적용되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <SkeletonCard testID="product-skeleton" />
    );

    expect(getByTestId('product-skeleton')).toBeTruthy();
  });

  it('추가 style이 적용되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <SkeletonCard style={{ marginBottom: 16 }} />
    );

    const skeleton = getByLabelText('로딩 중');
    const flatStyle = flattenStyle(skeleton.props.style);
    expect(flatStyle.marginBottom).toBe(16);
  });

  it('다크 모드에서 다크 muted 배경색을 사용해야 한다', () => {
    const { getByLabelText } = renderWithTheme(<SkeletonCard />, true);

    const skeleton = getByLabelText('로딩 중');
    const flatStyle = flattenStyle(skeleton.props.style);
    expect(flatStyle.backgroundColor).toBe(darkColors.muted);
  });
});

// ---------------------------------------------------------------------------
// 유틸리티: style 배열을 단일 객체로 평탄화
// ---------------------------------------------------------------------------

function flattenStyle(
  style: unknown
): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>((acc, s) => {
      if (s && typeof s === 'object') {
        return { ...acc, ...flattenStyle(s) };
      }
      return acc;
    }, {});
  }
  if (typeof style === 'object') {
    return style as Record<string, unknown>;
  }
  return {};
}
