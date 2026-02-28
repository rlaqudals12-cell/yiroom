/**
 * GradeDisplay 컴포넌트 테스트
 *
 * 대상: components/analysis/GradeDisplay.tsx
 * 신뢰도 점수 기반 등급 표시 컴포넌트 검증
 * - getGrade 헬퍼 함수 (순수 로직)
 * - 컴포넌트 렌더링 (등급, 프로그레스 바, 마일스톤)
 * - 접근성
 * - 다크 모드
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import {
  GradeDisplay,
  getGrade,
} from '../../../components/analysis/GradeDisplay';
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
// getGrade 헬퍼 함수 테스트 (순수 로직)
// ============================================================

describe('getGrade 헬퍼 함수', () => {
  describe('등급 분류', () => {
    it('신뢰도 95 이상은 Diamond 등급을 반환해야 한다', () => {
      expect(getGrade(95).name).toBe('Diamond');
      expect(getGrade(97).name).toBe('Diamond');
      expect(getGrade(100).name).toBe('Diamond');
    });

    it('신뢰도 85-94는 Gold 등급을 반환해야 한다', () => {
      expect(getGrade(85).name).toBe('Gold');
      expect(getGrade(90).name).toBe('Gold');
      expect(getGrade(94).name).toBe('Gold');
    });

    it('신뢰도 70-84는 Silver 등급을 반환해야 한다', () => {
      expect(getGrade(70).name).toBe('Silver');
      expect(getGrade(77).name).toBe('Silver');
      expect(getGrade(84).name).toBe('Silver');
    });

    it('신뢰도 70 미만은 Bronze 등급을 반환해야 한다', () => {
      expect(getGrade(0).name).toBe('Bronze');
      expect(getGrade(35).name).toBe('Bronze');
      expect(getGrade(69).name).toBe('Bronze');
    });
  });

  describe('경계값 처리', () => {
    it('정확한 경계값에서 올바른 등급을 반환해야 한다', () => {
      // 69 -> Bronze, 70 -> Silver
      expect(getGrade(69).name).toBe('Bronze');
      expect(getGrade(70).name).toBe('Silver');

      // 84 -> Silver, 85 -> Gold
      expect(getGrade(84).name).toBe('Silver');
      expect(getGrade(85).name).toBe('Gold');

      // 94 -> Gold, 95 -> Diamond
      expect(getGrade(94).name).toBe('Gold');
      expect(getGrade(95).name).toBe('Diamond');
    });
  });

  describe('클램핑', () => {
    it('음수 값은 0으로 클램핑하여 Bronze를 반환해야 한다', () => {
      expect(getGrade(-10).name).toBe('Bronze');
      expect(getGrade(-100).name).toBe('Bronze');
    });

    it('100 초과 값은 100으로 클램핑하여 Diamond를 반환해야 한다', () => {
      expect(getGrade(101).name).toBe('Diamond');
      expect(getGrade(200).name).toBe('Diamond');
    });
  });

  describe('등급별 색상', () => {
    it('Diamond 등급은 파란 계열 색상이어야 한다', () => {
      expect(getGrade(95).color).toBe('#67E8F9');
    });

    it('Gold 등급은 금색 계열 색상이어야 한다', () => {
      expect(getGrade(90).color).toBe('#F59E0B');
    });

    it('Silver 등급은 회색 계열 색상이어야 한다', () => {
      expect(getGrade(75).color).toBe('#9CA3AF');
    });

    it('Bronze 등급은 동색 계열 색상이어야 한다', () => {
      expect(getGrade(50).color).toBe('#CD7F32');
    });

    it('모든 등급 색상이 유효한 hex 값이어야 한다', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      [0, 50, 75, 90, 100].forEach((score) => {
        expect(getGrade(score).color).toMatch(hexRegex);
      });
    });
  });

  describe('등급별 아이콘', () => {
    it('각 등급이 고유한 아이콘 문자를 가져야 한다', () => {
      const icons = new Set([
        getGrade(95).icon, // Diamond
        getGrade(90).icon, // Gold
        getGrade(75).icon, // Silver
        getGrade(50).icon, // Bronze
      ]);
      expect(icons.size).toBe(4);
    });

    it('Diamond 아이콘은 다이아몬드 문자여야 한다', () => {
      expect(getGrade(95).icon).toBe('\u25C6');
    });

    it('Gold 아이콘은 별 문자여야 한다', () => {
      expect(getGrade(90).icon).toBe('\u2605');
    });
  });
});

// ============================================================
// GradeDisplay 컴포넌트 렌더링 테스트
// ============================================================

describe('GradeDisplay 컴포넌트', () => {
  describe('기본 렌더링', () => {
    it('기본 testID "grade-display"가 존재해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradeDisplay confidence={90} />
      );
      expect(getByTestId('grade-display')).toBeTruthy();
    });

    it('커스텀 testID를 사용할 수 있어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradeDisplay confidence={90} testID="custom-grade" />
      );
      expect(getByTestId('custom-grade')).toBeTruthy();
    });
  });

  describe('등급 표시', () => {
    it('Diamond 등급 (confidence >= 95)이 올바르게 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradeDisplay confidence={97} />
      );
      expect(getByText('Diamond')).toBeTruthy();
      expect(getByText('97%')).toBeTruthy();
    });

    it('Gold 등급 (confidence 85-94)이 올바르게 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradeDisplay confidence={90} />
      );
      expect(getByText('Gold')).toBeTruthy();
      expect(getByText('90%')).toBeTruthy();
    });

    it('Silver 등급 (confidence 70-84)이 올바르게 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradeDisplay confidence={75} />
      );
      expect(getByText('Silver')).toBeTruthy();
      expect(getByText('75%')).toBeTruthy();
    });

    it('Bronze 등급 (confidence < 70)이 올바르게 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradeDisplay confidence={45} />
      );
      expect(getByText('Bronze')).toBeTruthy();
      expect(getByText('45%')).toBeTruthy();
    });
  });

  describe('퍼센티지 텍스트', () => {
    it('클램핑된 신뢰도 퍼센티지를 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradeDisplay confidence={82} />
      );
      expect(getByText('82%')).toBeTruthy();
    });

    it('0% 경계를 올바르게 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradeDisplay confidence={0} />
      );
      expect(getByText('0%')).toBeTruthy();
    });

    it('100% 경계를 올바르게 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradeDisplay confidence={100} />
      );
      expect(getByText('100%')).toBeTruthy();
    });

    it('음수 값을 0%로 클램핑하여 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradeDisplay confidence={-15} />
      );
      expect(getByText('0%')).toBeTruthy();
    });

    it('100 초과 값을 100%로 클램핑하여 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradeDisplay confidence={120} />
      );
      expect(getByText('100%')).toBeTruthy();
    });
  });

  describe('프로그레스 바 표시', () => {
    it('기본값으로 프로그레스 바가 표시되어야 한다 (showProgress=true)', () => {
      // accessibilityRole="progressbar"는 summary 컨테이너 내부에 있어
      // getByRole로 탐색이 안 되므로 UNSAFE_getByProps 사용
      const { UNSAFE_getByProps } = renderWithTheme(
        <GradeDisplay confidence={80} />
      );
      expect(
        UNSAFE_getByProps({ accessibilityRole: 'progressbar' })
      ).toBeTruthy();
    });

    it('showProgress=false일 때 프로그레스 바가 숨겨져야 한다', () => {
      const { UNSAFE_queryAllByProps } = renderWithTheme(
        <GradeDisplay confidence={80} showProgress={false} />
      );
      expect(
        UNSAFE_queryAllByProps({ accessibilityRole: 'progressbar' })
      ).toHaveLength(0);
    });

    it('showProgress=true일 때 마일스톤 라벨(70, 85, 95)이 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradeDisplay confidence={80} />
      );
      expect(getByText('70')).toBeTruthy();
      expect(getByText('85')).toBeTruthy();
      expect(getByText('95')).toBeTruthy();
    });

    it('showProgress=false일 때 마일스톤 라벨이 숨겨져야 한다', () => {
      const { queryByText } = renderWithTheme(
        <GradeDisplay confidence={80} showProgress={false} />
      );
      // 마일스톤 라벨은 프로그레스 섹션 내부에 있으므로 숨겨진다
      expect(queryByText('70')).toBeNull();
      expect(queryByText('85')).toBeNull();
      expect(queryByText('95')).toBeNull();
    });

    it('progressbar의 accessibilityValue가 올바르게 설정되어야 한다', () => {
      const { UNSAFE_getByProps } = renderWithTheme(
        <GradeDisplay confidence={73} />
      );
      const progressbar = UNSAFE_getByProps({
        accessibilityRole: 'progressbar',
      });
      expect(progressbar.props.accessibilityValue).toEqual({
        min: 0,
        max: 100,
        now: 73,
      });
    });

    it('클램핑된 값이 accessibilityValue에 반영되어야 한다', () => {
      const { UNSAFE_getByProps } = renderWithTheme(
        <GradeDisplay confidence={150} />
      );
      const progressbar = UNSAFE_getByProps({
        accessibilityRole: 'progressbar',
      });
      expect(progressbar.props.accessibilityValue.now).toBe(100);
    });
  });

  describe('라벨 표시', () => {
    it('기본값으로 등급 라벨이 표시되어야 한다 (showLabel=true)', () => {
      const { getByText } = renderWithTheme(
        <GradeDisplay confidence={90} />
      );
      expect(getByText('Gold')).toBeTruthy();
      expect(getByText('90%')).toBeTruthy();
    });

    it('showLabel=false일 때 등급명과 퍼센티지가 숨겨져야 한다', () => {
      const { queryByText } = renderWithTheme(
        <GradeDisplay confidence={90} showLabel={false} />
      );
      expect(queryByText('Gold')).toBeNull();
      expect(queryByText('90%')).toBeNull();
    });

    it('showLabel=false이고 showProgress=true이면 프로그레스 바만 표시되어야 한다', () => {
      const { queryByText, UNSAFE_getByProps } = renderWithTheme(
        <GradeDisplay confidence={90} showLabel={false} showProgress={true} />
      );
      // 라벨은 없어야 한다
      expect(queryByText('Gold')).toBeNull();
      expect(queryByText('90%')).toBeNull();
      // 프로그레스 바는 있어야 한다
      expect(
        UNSAFE_getByProps({ accessibilityRole: 'progressbar' })
      ).toBeTruthy();
    });

    it('showLabel=true이면 등급 아이콘 문자도 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradeDisplay confidence={95} />
      );
      // Diamond 아이콘 문자
      expect(getByText('\u25C6')).toBeTruthy();
    });
  });

  describe('접근성', () => {
    it('accessibilityRole이 "summary"여야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradeDisplay confidence={90} />
      );
      expect(getByTestId('grade-display').props.accessibilityRole).toBe(
        'summary'
      );
    });

    it('accessibilityLabel에 등급명과 신뢰도가 포함되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradeDisplay confidence={90} />
      );
      expect(getByTestId('grade-display').props.accessibilityLabel).toBe(
        '분석 등급 Gold, 신뢰도 90%'
      );
    });

    it('Diamond 등급의 접근성 라벨이 올바르게 설정되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradeDisplay confidence={98} />
      );
      expect(getByTestId('grade-display').props.accessibilityLabel).toBe(
        '분석 등급 Diamond, 신뢰도 98%'
      );
    });

    it('클램핑된 값이 접근성 라벨에 반영되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <GradeDisplay confidence={-20} />
      );
      expect(getByTestId('grade-display').props.accessibilityLabel).toBe(
        '분석 등급 Bronze, 신뢰도 0%'
      );
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링되어야 한다', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <GradeDisplay confidence={90} />,
        true
      );
      expect(getByTestId('grade-display')).toBeTruthy();
      expect(getByText('Gold')).toBeTruthy();
      expect(getByText('90%')).toBeTruthy();
    });

    it('다크 모드에서 프로그레스 바가 정상 표시되어야 한다', () => {
      const { UNSAFE_getByProps } = renderWithTheme(
        <GradeDisplay confidence={80} />,
        true
      );
      expect(
        UNSAFE_getByProps({ accessibilityRole: 'progressbar' })
      ).toBeTruthy();
    });

    it('다크 모드에서 마일스톤 라벨이 정상 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <GradeDisplay confidence={80} />,
        true
      );
      expect(getByText('70')).toBeTruthy();
      expect(getByText('85')).toBeTruthy();
      expect(getByText('95')).toBeTruthy();
    });
  });

  describe('스타일 오버라이드', () => {
    it('커스텀 style prop이 컨테이너에 적용되어야 한다', () => {
      const customStyle = { marginTop: 20, backgroundColor: '#FF0000' };
      const { getByTestId } = renderWithTheme(
        <GradeDisplay confidence={90} style={customStyle} />
      );
      const container = getByTestId('grade-display');
      // style 배열에서 커스텀 스타일이 포함되어 있는지 확인
      const flatStyle = Array.isArray(container.props.style)
        ? container.props.style
        : [container.props.style];
      const hasCustomStyle = flatStyle.some(
        (s: Record<string, unknown>) =>
          s && s.marginTop === 20 && s.backgroundColor === '#FF0000'
      );
      expect(hasCustomStyle).toBe(true);
    });
  });

  describe('모든 props 조합', () => {
    it('showLabel=false + showProgress=false이면 최소한 컨테이너만 렌더링되어야 한다', () => {
      const { getByTestId, queryByText, UNSAFE_queryAllByProps } =
        renderWithTheme(
          <GradeDisplay
            confidence={90}
            showLabel={false}
            showProgress={false}
          />
        );
      // 컨테이너는 존재
      expect(getByTestId('grade-display')).toBeTruthy();
      // 라벨과 프로그레스 바 모두 없음
      expect(queryByText('Gold')).toBeNull();
      expect(queryByText('90%')).toBeNull();
      expect(
        UNSAFE_queryAllByProps({ accessibilityRole: 'progressbar' })
      ).toHaveLength(0);
    });

    it('showLabel=true + showProgress=true이면 모든 요소가 표시되어야 한다', () => {
      const { getByText, UNSAFE_getByProps } = renderWithTheme(
        <GradeDisplay confidence={85} showLabel={true} showProgress={true} />
      );
      expect(getByText('Gold')).toBeTruthy();
      expect(getByText('85%')).toBeTruthy();
      expect(
        UNSAFE_getByProps({ accessibilityRole: 'progressbar' })
      ).toBeTruthy();
      expect(getByText('70')).toBeTruthy();
      expect(getByText('85')).toBeTruthy();
      expect(getByText('95')).toBeTruthy();
    });
  });
});
