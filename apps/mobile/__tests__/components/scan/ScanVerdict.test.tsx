/**
 * ScanVerdict 컴포넌트 테스트 — ADR-112 "나와의 적합도"
 * - 피부 프로필 유 → 적합도 히어로(점수) / 무 → 분석 CTA (정직성 게이팅)
 * - L4 타임라인 출처 렌더 / 금지 표현(치료·재생·보장·사라져) 미노출
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ScanVerdict } from '../../../components/scan/ScanVerdict';
import { matchTimelines } from '../../../lib/scan/ingredient-timeline';
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
import type { ScanVerdictData } from '../../../lib/scan/verdict';
import type { ProductIngredient } from '../../../types/scan';

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
  } as unknown as ThemeContextValue;
}

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeContext.Provider value={createThemeValue()}>{ui}</ThemeContext.Provider>);
}

const INGREDIENTS: ProductIngredient[] = [
  { order: 1, inciName: 'RETINOL', nameKo: '레티놀', ewgGrade: 2 },
  { order: 2, inciName: 'FRAGRANCE', nameKo: '향료', ewgGrade: 6 },
];

const BASE: ScanVerdictData = {
  overallScore: 82,
  skinCompatibility: { score: 85, goodPoints: [], warnings: [] },
  ingredientAnalysis: { beneficial: [], caution: [], avoid: [], interactions: [] },
  hasUserAnalysis: { skinAnalysis: true, personalColor: false },
  regulatory: [
    { ingredient: '향료', kind: 'allergen25', label: '식약처 지정 알레르기 유발 착향제' },
  ],
  timelines: matchTimelines(['RETINOL']),
};

const BANNED_WORDS = ['치료', '재생', '보장', '사라져', '없어져'];

describe('ScanVerdict', () => {
  it('피부 프로필 있으면 적합도 히어로(점수)를 보여준다', () => {
    const { getByTestId, queryByTestId } = renderWithTheme(
      <ScanVerdict verdict={BASE} ingredients={INGREDIENTS} />
    );
    expect(getByTestId('scan-verdict-hero')).toBeTruthy();
    expect(queryByTestId('scan-verdict-cta')).toBeNull();
  });

  it('피부 프로필 없으면 히어로 대신 분석 CTA를 보여준다 (지어내지 않음)', () => {
    const noProfile: ScanVerdictData = {
      ...BASE,
      hasUserAnalysis: { skinAnalysis: false, personalColor: false },
    };
    const { getByTestId, queryByTestId } = renderWithTheme(
      <ScanVerdict verdict={noProfile} ingredients={INGREDIENTS} />
    );
    expect(getByTestId('scan-verdict-cta')).toBeTruthy();
    expect(getByTestId('scan-verdict-cta-button')).toBeTruthy();
    expect(queryByTestId('scan-verdict-hero')).toBeNull();
  });

  it('L1 규제 정보와 L4 타임라인 출처를 렌더한다', () => {
    const { getByTestId } = renderWithTheme(
      <ScanVerdict verdict={BASE} ingredients={INGREDIENTS} />
    );
    expect(getByTestId('scan-verdict-regulatory')).toBeTruthy();
    expect(getByTestId('scan-verdict-timeline')).toBeTruthy();
    // 타임라인 출처 링크(첫 항목)
    expect(getByTestId('scan-verdict-timeline-source-0')).toBeTruthy();
  });

  it('면책 문구를 항상 노출한다', () => {
    const { getByTestId } = renderWithTheme(
      <ScanVerdict verdict={BASE} ingredients={INGREDIENTS} />
    );
    expect(getByTestId('scan-verdict-disclaimer')).toBeTruthy();
  });

  it('금지 표현(치료·재생·보장·사라져)이 렌더 트리에 없다', () => {
    const { toJSON } = renderWithTheme(<ScanVerdict verdict={BASE} ingredients={INGREDIENTS} />);
    const tree = JSON.stringify(toJSON());
    for (const word of BANNED_WORDS) {
      expect(tree).not.toContain(word);
    }
  });
});
