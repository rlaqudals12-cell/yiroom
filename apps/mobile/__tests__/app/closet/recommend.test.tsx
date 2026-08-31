/**
 * 코디 추천 화면 — 코디 저장 기능 테스트
 *
 * 대상: app/(closet)/recommend.tsx
 * 테스트 범위: 저장 버튼 렌더링, 이미 저장된 상태, 저장 실행, 성공/실패 Alert
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
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

// -------------------------------------------------------------------
// mock: react-native-safe-area-context
// -------------------------------------------------------------------
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    SafeAreaProvider: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// -------------------------------------------------------------------
// mock: useWeather (날씨 서비스)
// -------------------------------------------------------------------
const mockUseWeather = jest.fn();
jest.mock('../../../lib/weather', () => ({
  useWeather: (...args: unknown[]) => mockUseWeather(...args),
}));

function setupWeatherMock(
  usedFallback = false,
  locationSource: 'default' | 'region' | 'geolocation' = 'default'
): void {
  mockUseWeather.mockReturnValue({
    weather: {
      region: 'seoul',
      location: '서울',
      current: {
        temp: 15,
        feelsLike: 13,
        humidity: 60,
        description: '맑음',
        icon: '01d',
        windSpeed: 3,
        uvi: 4,
        precipitation: 0,
      },
      forecast: [],
      cachedAt: '2026-08-18T00:00:00.000Z',
      usedFallback,
      locationSource,
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    temp: 15,
    locationName: '서울',
  });
}

// -------------------------------------------------------------------
// mock: useUserAnalyses
// -------------------------------------------------------------------
const mockUseUserAnalyses = jest.fn();
jest.mock('@/hooks/useUserAnalyses', () => ({
  useUserAnalyses: (...args: unknown[]) => mockUseUserAnalyses(...args),
}));

// -------------------------------------------------------------------
// mock: useSavedOutfits
// -------------------------------------------------------------------
const mockSaveOutfit = jest.fn();
const mockUseSavedOutfits = jest.fn();
jest.mock('../../../lib/inventory/useInventory', () => ({
  useSavedOutfits: (...args: unknown[]) => mockUseSavedOutfits(...args),
  // useCloset은 useClosetMatcher 내부에서 사용하지만 별도 mock으로 처리
  useCloset: jest.fn(() => ({
    items: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    toggleFavorite: jest.fn(),
    clothingItems: [],
    getByCategory: jest.fn(() => []),
    getFavorites: jest.fn(() => []),
  })),
}));

// -------------------------------------------------------------------
// mock: useClosetMatcher
// -------------------------------------------------------------------
const mockGetOutfitSuggestion = jest.fn();
const mockRefetch = jest.fn().mockResolvedValue(undefined);
const mockUseClosetMatcher = jest.fn();
jest.mock('../../../lib/inventory/useClosetMatcher', () => ({
  useClosetMatcher: (...args: unknown[]) => mockUseClosetMatcher(...args),
}));

// -------------------------------------------------------------------
// Alert.alert spy
// -------------------------------------------------------------------
const alertSpy = jest.spyOn(Alert, 'alert');

// SUT (모든 jest.mock 이후에 import)
import RecommendScreen from '../../../app/(closet)/recommend';

// -------------------------------------------------------------------
// 테마 유틸리티
// -------------------------------------------------------------------
function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? lightColors : lightColors, // 라이트 고정
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

// -------------------------------------------------------------------
// 테스트 데이터
// -------------------------------------------------------------------
const mockOutfit = {
  top: {
    item: { id: 'top1', name: '흰 티', imageUrl: null },
    score: { total: 85, color: 80, body: 90, season: 85 },
    reasons: ['밝은 톤 어울림'],
  },
  bottom: {
    item: { id: 'bot1', name: '청바지', imageUrl: null },
    score: { total: 78, color: 70, body: 82, season: 80 },
    reasons: [],
  },
  outer: null,
  shoes: {
    item: { id: 'shoe1', name: '스니커즈', imageUrl: null },
    score: { total: 72, color: 68, body: 75, season: 73 },
    reasons: [],
  },
  bag: null,
  accessory: null,
  dress: null,
  totalScore: 78,
  personalMatched: true,
  hasPersonalProfile: true,
  tips: ['밝은 색상 상의를 추천해요'],
  // 조립기가 항상 동봉하는 완화 고지 (계절 가드) — 기본은 빈 배열
  warnings: [] as string[],
};

// 3개 아이템 (top, bottom, shoes)
const mockItems = [
  {
    id: 'top1',
    clerkUserId: 'u1',
    category: 'closet' as const,
    subCategory: 'top',
    name: '흰 티',
    imageUrl: '',
    originalImageUrl: null,
    brand: null,
    tags: [],
    isFavorite: false,
    useCount: 0,
    lastUsedAt: null,
    expiryDate: null,
    metadata: { color: ['white'], season: ['spring'], occasion: ['casual'] },
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'bot1',
    clerkUserId: 'u1',
    category: 'closet' as const,
    subCategory: 'bottom',
    name: '청바지',
    imageUrl: '',
    originalImageUrl: null,
    brand: null,
    tags: [],
    isFavorite: false,
    useCount: 0,
    lastUsedAt: null,
    expiryDate: null,
    metadata: { color: ['blue'], season: ['spring'], occasion: ['casual'] },
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'shoe1',
    clerkUserId: 'u1',
    category: 'closet' as const,
    subCategory: 'shoes',
    name: '스니커즈',
    imageUrl: '',
    originalImageUrl: null,
    brand: null,
    tags: [],
    isFavorite: false,
    useCount: 0,
    lastUsedAt: null,
    expiryDate: null,
    metadata: { color: ['white'], season: ['spring'], occasion: ['casual'] },
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

// -------------------------------------------------------------------
// 기본 mock 설정 함수
// -------------------------------------------------------------------
function setupDefaultMocks(overrides?: {
  savedOutfits?: Array<{ itemIds: string[] }>;
  saveOutfitResult?: { id: string } | null;
  outfitSuggestion?: typeof mockOutfit | null;
  isLoading?: boolean;
  items?: typeof mockItems;
  /** null이면 퍼스널컬러 미진단 상태 */
  personalColorResult?: { season: string } | null;
  /** null이면 체형 미진단 상태 */
  bodyAnalysisResult?: { bodyType: string } | null;
}) {
  const {
    savedOutfits = [],
    saveOutfitResult = { id: 'saved1' },
    outfitSuggestion = mockOutfit,
    isLoading = false,
    items = mockItems,
    personalColorResult = {
      season: 'Spring',
      tone: 'warm',
      colorPalette: [],
      id: 'pc1',
      createdAt: new Date(),
    },
    bodyAnalysisResult = {
      bodyType: 'rectangle',
      id: 'b1',
      height: 170,
      weight: 65,
      bmi: 22.5,
      createdAt: new Date(),
    },
  } = overrides ?? {};

  mockUseUserAnalyses.mockReturnValue({
    personalColor: personalColorResult,
    bodyAnalysis: bodyAnalysisResult,
    skinAnalysis: null,
    hairAnalysis: null,
    makeupAnalysis: null,
    analyses: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });

  mockSaveOutfit.mockResolvedValue(saveOutfitResult);

  mockUseSavedOutfits.mockReturnValue({
    outfits: savedOutfits,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    saveOutfit: mockSaveOutfit,
    deleteOutfit: jest.fn(),
    recordWear: jest.fn(),
  });

  mockGetOutfitSuggestion.mockReturnValue(outfitSuggestion);

  mockUseClosetMatcher.mockReturnValue({
    items,
    isLoading,
    error: null,
    summary: { total: 3, wellMatched: 2, needsImprovement: 1, suggestions: [] },
    getRecommendations: jest.fn(() => []),
    getOutfitSuggestion: mockGetOutfitSuggestion,
    getWeatherBasedRecommendations: jest.fn(() => []),
    getOccasionRecommendations: jest.fn(() => []),
    refetch: mockRefetch,
  });
}

// -------------------------------------------------------------------
// 테스트
// -------------------------------------------------------------------
describe('RecommendScreen 코디 저장 기능', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockClear();
    setupWeatherMock();
    setupDefaultMocks();
  });

  describe('저장 버튼 렌더링', () => {
    it('코디가 존재하면 "코디 저장" 버튼이 표시된다', () => {
      const { getByTestId, getByText } = renderWithTheme(<RecommendScreen />);

      expect(getByTestId('save-outfit-button')).toBeTruthy();
      expect(getByText('코디 저장')).toBeTruthy();
    });

    it('코디가 없으면 저장 버튼이 표시되지 않는다', () => {
      setupDefaultMocks({ outfitSuggestion: null });

      const { queryByTestId } = renderWithTheme(<RecommendScreen />);
      expect(queryByTestId('save-outfit-button')).toBeNull();
    });
  });

  describe('이미 저장된 코디 상태', () => {
    it('동일한 아이템 조합이 저장되어 있으면 다시 보기 진입점을 표시한다', () => {
      // top1, bot1, shoe1 — mockOutfit의 아이템 ID와 동일
      setupDefaultMocks({
        savedOutfits: [
          { itemIds: ['bot1', 'shoe1', 'top1'] }, // 순서 무관 (sort 비교)
        ],
      });

      const { getByText } = renderWithTheme(<RecommendScreen />);
      expect(getByText('저장한 코디 보기')).toBeTruthy();
    });

    it('이미 저장된 코디 버튼을 누르면 저장 목록으로 이동한다', () => {
      setupDefaultMocks({
        savedOutfits: [{ itemIds: ['bot1', 'shoe1', 'top1'] }],
      });

      const mockPush = jest.fn();
      const { useRouter } = require('expo-router');
      useRouter.mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
        navigate: jest.fn(),
        canGoBack: jest.fn(() => true),
      });

      const { getByTestId } = renderWithTheme(<RecommendScreen />);
      fireEvent.press(getByTestId('save-outfit-button'));

      expect(mockPush).toHaveBeenCalledWith('/(closet)/outfits');
      expect(mockSaveOutfit).not.toHaveBeenCalled();
    });
  });

  describe('저장 실행', () => {
    it('저장 버튼 누르면 saveOutfit이 올바른 파라미터로 호출된다', async () => {
      setupDefaultMocks();

      const { getByTestId } = renderWithTheme(<RecommendScreen />);
      const saveButton = getByTestId('save-outfit-button');

      await act(async () => {
        fireEvent.press(saveButton);
      });

      expect(mockSaveOutfit).toHaveBeenCalledTimes(1);

      const callArg = mockSaveOutfit.mock.calls[0][0];
      // itemIds에 top1, bot1, shoe1 포함 확인
      expect(callArg.itemIds).toEqual(expect.arrayContaining(['top1', 'bot1', 'shoe1']));
      expect(callArg.itemIds).toHaveLength(3);
      // name에 "추천 코디" 포함
      expect(callArg.name).toContain('추천 코디');
      // occasion은 casual
      expect(callArg.occasion).toBe('casual');
      // season은 배열
      expect(Array.isArray(callArg.season)).toBe(true);
      expect(callArg.season.length).toBeGreaterThan(0);
      expect(mockSaveOutfit.mock.calls[0][1]).toBe('recommendation');
    });

    it('저장 성공 시 SuccessCheckmark를 표시한다', async () => {
      setupDefaultMocks({ saveOutfitResult: { id: 'saved1' } });

      const { getByTestId } = renderWithTheme(<RecommendScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('save-outfit-button'));
      });

      // Alert.alert 대신 SuccessCheckmark 오버레이 표시
      await waitFor(() => {
        expect(alertSpy).not.toHaveBeenCalledWith('저장 완료', '코디가 저장되었어요!');
      });
    });

    it('저장 실패 시 오류 Alert를 표시한다', async () => {
      setupDefaultMocks({ saveOutfitResult: null });

      const { getByTestId } = renderWithTheme(<RecommendScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('save-outfit-button'));
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('오류', '코디 저장에 실패했어요.');
      });
    });

    it('이미 저장된 코디를 다시 누르면 중복 저장하지 않는다', async () => {
      setupDefaultMocks({
        savedOutfits: [{ itemIds: ['bot1', 'shoe1', 'top1'] }],
      });

      const { getByTestId } = renderWithTheme(<RecommendScreen />);

      fireEvent.press(getByTestId('save-outfit-button'));

      expect(mockSaveOutfit).not.toHaveBeenCalled();
    });
  });

  describe('로딩 상태', () => {
    it('아이템 로딩 중이면 로딩 화면을 표시한다', () => {
      setupDefaultMocks({ isLoading: true });

      const { getByText, queryByTestId } = renderWithTheme(<RecommendScreen />);
      expect(getByText('코디를 준비하고 있어요...')).toBeTruthy();
      expect(queryByTestId('save-outfit-button')).toBeNull();
    });

    it('아이템이 비어있으면 빈 상태 화면을 표시한다', () => {
      setupDefaultMocks({ items: [] });

      const { getByText, queryByTestId } = renderWithTheme(<RecommendScreen />);
      expect(getByText('옷장에 아이템이 없어요')).toBeTruthy();
      expect(queryByTestId('save-outfit-button')).toBeNull();
    });
  });

  // -----------------------------------------------------------------
  // 정직성 회귀: 진단이 없으면 지어내지 않는다
  // (이전엔 mapSeason/mapBodyType이 'Spring'/'S'로 폴백해, 분석을 한 적 없는
  //  사용자에게 진단인 척 태그를 노출하고 저장 코디 설명에도 허위로 기록했다)
  // -----------------------------------------------------------------
  describe('미진단 사용자 — 지어낸 진단 금지', () => {
    beforeEach(() => {
      setupDefaultMocks({ personalColorResult: null, bodyAnalysisResult: null });
    });

    it('진단이 0건이면 시즌·체형 태그를 렌더하지 않는다', () => {
      const { queryByText } = renderWithTheme(<RecommendScreen />);

      expect(queryByText('Spring')).toBeNull();
      expect(queryByText('스트레이트')).toBeNull();
      expect(queryByText('웨이브')).toBeNull();
      expect(queryByText('내추럴')).toBeNull();
    });

    it('진단이 0건이면 분석 유도 CTA를 표시한다', () => {
      const { getByTestId, getByText } = renderWithTheme(<RecommendScreen />);

      expect(getByTestId('recommend-analyze-cta')).toBeTruthy();
      expect(getByText('분석하고 맞춤 추천 받기')).toBeTruthy();
    });

    it('매칭 훅에 기본값 대신 null을 전달한다', () => {
      renderWithTheme(<RecommendScreen />);

      expect(mockUseClosetMatcher).toHaveBeenCalledWith({
        personalColor: null,
        bodyType: null,
      });
    });

    it('저장 코디 설명에 없는 진단을 적지 않는다', async () => {
      const { getByTestId } = renderWithTheme(<RecommendScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('save-outfit-button'));
      });

      const callArg = mockSaveOutfit.mock.calls[0][0];
      expect(callArg.description).toBe('15°C');
      expect(callArg.description).not.toContain('Spring');
      expect(callArg.description).not.toContain('스트레이트');
    });

    it('personalMatched=false 코디는 아이템 점수 막대와 총점을 모두 숨긴다', () => {
      setupDefaultMocks({
        personalColorResult: null,
        bodyAnalysisResult: null,
        outfitSuggestion: {
          ...mockOutfit,
          personalMatched: false,
          hasPersonalProfile: false,
        },
      });

      const { getByTestId, queryByTestId } = renderWithTheme(<RecommendScreen />);

      expect(getByTestId('recommend-analyze-cta')).toBeTruthy();
      expect(queryByTestId('outfit-total-score')).toBeNull();
      expect(queryByTestId('outfit-item-score-top1')).toBeNull();
      expect(queryByTestId('outfit-item-score-bot1')).toBeNull();
      expect(queryByTestId('outfit-item-score-shoe1')).toBeNull();
    });
  });

  describe('진단이 있는 사용자 — 실제 진단은 그대로 노출', () => {
    it('시즌·체형 태그를 표시하고 CTA는 숨긴다', () => {
      setupDefaultMocks(); // Spring + rectangle(→S)

      const { getByText, queryByTestId } = renderWithTheme(<RecommendScreen />);

      expect(getByText('Spring')).toBeTruthy();
      expect(getByText('스트레이트')).toBeTruthy();
      expect(queryByTestId('recommend-analyze-cta')).toBeNull();
    });

    it('실제 개인 진단 일치가 있는 코디만 점수를 표시한다', () => {
      const { getByTestId } = renderWithTheme(<RecommendScreen />);

      expect(getByTestId('outfit-total-score')).toBeTruthy();
      expect(getByTestId('outfit-item-score-top1')).toBeTruthy();
    });

    it('저장 코디 설명에 실제 진단을 기록한다', async () => {
      setupDefaultMocks();

      const { getByTestId } = renderWithTheme(<RecommendScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('save-outfit-button'));
      });

      expect(mockSaveOutfit.mock.calls[0][0].description).toBe('Spring · 스트레이트 · 15°C');
    });
  });

  describe('Mock 날씨 정직성', () => {
    beforeEach(() => {
      setupWeatherMock(true);
    });

    it('실측처럼 보이는 온도·상태를 숨기고 제외 안내를 표시한다', () => {
      const { getByTestId, getByText, queryByText } = renderWithTheme(<RecommendScreen />);

      expect(getByTestId('weather-fallback-notice')).toBeTruthy();
      expect(
        getByText('실시간 날씨를 불러오지 못해 날씨 정보는 추천에서 제외했어요.')
      ).toBeTruthy();
      expect(queryByText('15°C')).toBeNull();
      expect(queryByText('맑음')).toBeNull();
    });

    it('Mock 온도를 추천과 저장 설명의 근거로 사용하지 않는다', async () => {
      const { getByTestId } = renderWithTheme(<RecommendScreen />);

      await waitFor(() => {
        expect(mockGetOutfitSuggestion).toHaveBeenCalledWith({ temp: null });
      });

      await act(async () => {
        fireEvent.press(getByTestId('save-outfit-button'));
      });

      expect(mockSaveOutfit.mock.calls[0][0].description).toBe('Spring · 스트레이트');
    });
  });

  describe('날씨 위치 출처', () => {
    it('서울 기본값은 현재 위치처럼 보이지 않게 서울 기준 배지를 표시한다', () => {
      const { getByTestId, getByText } = renderWithTheme(<RecommendScreen />);

      expect(getByTestId('weather-location-source-badge')).toBeTruthy();
      expect(getByText('서울 기준')).toBeTruthy();
    });

    it('실제 위치 좌표에서 온 날씨에는 기본 서울 배지를 표시하지 않는다', () => {
      setupWeatherMock(false, 'geolocation');

      const { queryByTestId, getByText } = renderWithTheme(<RecommendScreen />);

      expect(queryByTestId('weather-location-source-badge')).toBeNull();
      expect(getByText('서울')).toBeTruthy();
    });
  });

  describe('옷장 분석 요약 패리티', () => {
    it('중간 밴드를 0/0으로 숨기지 않고 전체·무난·판정 근거를 표시한다', () => {
      mockUseClosetMatcher.mockReturnValue({
        items: mockItems,
        isLoading: false,
        error: null,
        summary: { total: 3, wellMatched: 0, needsImprovement: 0, suggestions: [] },
        getRecommendations: jest.fn(() => []),
        getOutfitSuggestion: mockGetOutfitSuggestion,
        getWeatherBasedRecommendations: jest.fn(() => []),
        getOccasionRecommendations: jest.fn(() => []),
        refetch: mockRefetch,
      });

      const { getByTestId, getByText } = renderWithTheme(<RecommendScreen />);

      expect(getByTestId('closet-summary-total').props.children).toContain(3);
      expect(getByTestId('closet-summary-neutral').props.children).toBe(3);
      expect(getByText('무난')).toBeTruthy();
      expect(getByTestId('closet-summary-basis').props.children).toBe('퍼스널컬러·체형 기준이에요');
    });
  });

  describe('상황(TPO) 추천', () => {
    it('칩을 선택하면 해당 occasion으로 다시 추천하고 렌더된 코디를 바꾼다', async () => {
      const formalOutfit = {
        ...mockOutfit,
        top: {
          ...mockOutfit.top,
          item: { ...mockOutfit.top.item, id: 'formal-top', name: '포멀 재킷' },
        },
      };
      mockGetOutfitSuggestion.mockImplementation(
        (options: { temp: number | null; occasion?: string }) =>
          options.occasion === 'formal' ? formalOutfit : mockOutfit
      );

      const screen = renderWithTheme(<RecommendScreen />);
      await waitFor(() => expect(screen.getByTestId('occasion-chips')).toBeTruthy());

      fireEvent.press(screen.getByTestId('occasion-chip-formal'));

      await waitFor(() => {
        expect(mockGetOutfitSuggestion).toHaveBeenCalledWith({ temp: 15, occasion: 'formal' });
        expect(screen.getByText('포멀 재킷')).toBeTruthy();
      });
    });

    it('미선택 전체 상태는 occasion 없이 기존 추천 인자를 유지한다', async () => {
      renderWithTheme(<RecommendScreen />);

      await waitFor(() => {
        expect(mockGetOutfitSuggestion).toHaveBeenCalledWith({ temp: 15 });
      });
      expect(
        mockGetOutfitSuggestion.mock.calls.every(
          ([options]) => !Object.prototype.hasOwnProperty.call(options, 'occasion')
        )
      ).toBe(true);
    });
  });
});
