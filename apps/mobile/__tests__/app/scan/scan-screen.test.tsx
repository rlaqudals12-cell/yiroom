/**
 * 성분 스캔 화면 테스트 (ADR-112) — app/(scan)/index.tsx
 *
 * 다루는 것 (화면 레벨):
 * - 시작 화면: 촬영/갤러리 진입 버튼 존재
 * - 갤러리 선택 → OCR 성공 → 판정(ScanVerdict) 렌더
 * - OCR 실패 → 정직 안내 + 재시도 (성분 지어내지 않음)
 * - 프로필 없음 → 화면 파이프라인 결과가 CTA로 게이팅 (화면 레벨 1건)
 *
 * ScanVerdict 단위 동작(히어로/규제/면책/금지표현)은 ScanVerdict.test.tsx가 담당 — 중복 없음.
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

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

// ── 아이콘 mock ──────────────────────────────────────────
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_t: Record<string, unknown>, prop: string) => {
        if (typeof prop !== 'string' || prop === '__esModule') return undefined;
        return function MockIcon(props: Record<string, unknown>) {
          return <View testID={`icon-${prop}`} {...props} />;
        };
      },
    }
  );
});

// ── expo-camera / image-picker ───────────────────────────
jest.mock('expo-camera', () => {
  const { View } = require('react-native');
  return {
    CameraView: (props: Record<string, unknown>) => <View testID="camera-view" {...props} />,
    useCameraPermissions: () => [{ granted: true }, jest.fn(async () => ({ granted: true }))],
  };
});

const mockLaunchLibrary = jest.fn();
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchLibrary(...args),
}));

// ── clerk / supabase ─────────────────────────────────────
jest.mock('@clerk/clerk-expo', () => ({
  useUser: () => ({ user: { id: 'user_1' } }),
}));
jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: () => ({}),
}));

// ── OCR / verdict 라이브러리 ─────────────────────────────
const mockAnalyzeIngredientImage = jest.fn();
jest.mock('../../../lib/scan/ingredient-ocr', () => ({
  analyzeIngredientImage: (...args: unknown[]) => mockAnalyzeIngredientImage(...args),
}));

const mockBuildScanVerdict = jest.fn();
jest.mock('../../../lib/scan/verdict', () => ({
  buildScanVerdict: (...args: unknown[]) => mockBuildScanVerdict(...args),
  fetchScanUserAnalysis: jest.fn(async () => ({})),
}));

import ScanScreen from '../../../app/(scan)/index';

function createThemeValue(): ThemeContextValue {
  return {
    colors: lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark: false,
    colorScheme: 'light',
    themeMode: 'system' as const,
    setThemeMode: jest.fn(),
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
  } as unknown as ThemeContextValue;
}

function renderScreen() {
  return render(
    <ThemeContext.Provider value={createThemeValue()}>
      <ScanScreen />
    </ThemeContext.Provider>
  );
}

const OCR_SUCCESS = {
  success: true,
  ingredients: [{ order: 1, inciName: 'NIACINAMIDE', nameKo: '나이아신아마이드' }],
  confidence: 'high' as const,
  language: 'ko' as const,
};

function verdictData(hasSkin: boolean): ScanVerdictData {
  return {
    overallScore: 82,
    skinCompatibility: { score: 85, goodPoints: [], warnings: [] },
    ingredientAnalysis: { beneficial: [], caution: [], avoid: [], interactions: [] },
    hasUserAnalysis: { skinAnalysis: hasSkin, personalColor: false },
    regulatory: [],
    timelines: [],
  };
}

// 예외 로그로 인한 테스트 노이즈 억제
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('ScanScreen (성분 스캔)', () => {
  beforeEach(() => {
    mockLaunchLibrary.mockReset();
    mockAnalyzeIngredientImage.mockReset();
    mockBuildScanVerdict.mockReset();
  });

  afterAll(() => {
    errorSpy.mockRestore();
  });

  it('시작 화면에 촬영·갤러리 진입 버튼을 보여준다', () => {
    const { getByTestId } = renderScreen();
    expect(getByTestId('scan-screen')).toBeTruthy();
    expect(getByTestId('scan-open-camera')).toBeTruthy();
    expect(getByTestId('scan-pick-gallery')).toBeTruthy();
  });

  it('갤러리 선택 → OCR 성공 → 판정(ScanVerdict)을 렌더한다', async () => {
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://x.jpg', base64: 'AAAA' }],
    });
    mockAnalyzeIngredientImage.mockResolvedValue(OCR_SUCCESS);
    mockBuildScanVerdict.mockResolvedValue(verdictData(true));

    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId('scan-pick-gallery'));

    await waitFor(() => expect(getByTestId('scan-verdict')).toBeTruthy());
    // 프로필 있으면 적합도 히어로가 나온다
    expect(getByTestId('scan-verdict-hero')).toBeTruthy();
    expect(mockAnalyzeIngredientImage).toHaveBeenCalledWith('AAAA');
  });

  it('OCR가 성분을 못 읽으면 정직 안내 + 재시도를 보여준다 (지어내지 않음)', async () => {
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://x.jpg', base64: 'AAAA' }],
    });
    mockAnalyzeIngredientImage.mockResolvedValue({
      success: false,
      ingredients: [],
      confidence: 'low',
      language: 'other',
      error: 'OCR 결과 파싱 실패',
    });

    const { getByTestId, queryByTestId } = renderScreen();
    fireEvent.press(getByTestId('scan-pick-gallery'));

    await waitFor(() => expect(getByTestId('scan-error')).toBeTruthy());
    expect(getByTestId('scan-error-retry')).toBeTruthy();
    // 판정을 조립하지 않는다
    expect(queryByTestId('scan-verdict')).toBeNull();
    expect(mockBuildScanVerdict).not.toHaveBeenCalled();
  });

  it('피부 프로필이 없으면 판정이 CTA로 게이팅된다 (점수 지어내지 않음)', async () => {
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://x.jpg', base64: 'AAAA' }],
    });
    mockAnalyzeIngredientImage.mockResolvedValue(OCR_SUCCESS);
    mockBuildScanVerdict.mockResolvedValue(verdictData(false));

    const { getByTestId, queryByTestId } = renderScreen();
    fireEvent.press(getByTestId('scan-pick-gallery'));

    await waitFor(() => expect(getByTestId('scan-verdict-cta')).toBeTruthy());
    expect(queryByTestId('scan-verdict-hero')).toBeNull();
  });
});
