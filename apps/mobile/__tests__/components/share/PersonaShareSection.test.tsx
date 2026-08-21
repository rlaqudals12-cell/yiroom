/**
 * PersonaShareSection 테스트 — 캡처→공유 시트, 텍스트 폴백, 포맷 토글
 */
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';

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
import { PersonaShareSection } from '../../../components/share/PersonaShareSection';
import type { PersonaCardData } from '../../../lib/share/card-data';

const mockTrackAnalysisShare = jest.fn();
jest.mock('@/lib/analytics/tracker', () => ({
  trackAnalysisShare: (...args: unknown[]) => mockTrackAnalysisShare(...args),
}));

// useTheme 소비 컴포넌트는 ThemeContext.Provider 래핑 필수 (프로젝트 테스트 관례)
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

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeContext.Provider value={createThemeValue()}>{ui}</ThemeContext.Provider>);
}

const mockCaptureRef = jest.fn();
jest.mock('react-native-view-shot', () => ({
  captureRef: (...args: unknown[]) => mockCaptureRef(...args),
}));

const mockIsAvailable = jest.fn();
const mockShareAsync = jest.fn();
jest.mock('expo-sharing', () => ({
  isAvailableAsync: () => mockIsAvailable(),
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

const DATA: PersonaCardData = {
  oneLine: '여름 아침의 서늘한 빛을 닮은 사람',
  toneName: '뮤티드 서머',
  badges: [{ label: '피부', value: '복합성' }],
  palette: [
    { hex: '#C79AA0', name: '더스티 로즈' },
    { hex: '#9A86A6', name: '소프트 라일락' },
  ],
  worstPalette: [{ hex: '#E04A40' }],
};

describe('PersonaShareSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('카드가 인라인으로 렌더되고 포맷 토글이 동작한다', () => {
    const { getByTestId } = renderWithTheme(<PersonaShareSection data={DATA} serialNo={42} />);
    expect(getByTestId('persona-share-card')).toBeTruthy();
    expect(getByTestId('persona-share-serial')).toHaveTextContent('No.000042');

    fireEvent.press(getByTestId('persona-share-format-story'));
    expect(getByTestId('persona-share-card')).toBeTruthy();
  });

  it('이미지 공유: 캡처 → 공유 시트 순서로 호출된다', async () => {
    mockCaptureRef.mockResolvedValue('file://card.png');
    mockIsAvailable.mockResolvedValue(true);
    mockShareAsync.mockResolvedValue(undefined);

    const { getByTestId } = renderWithTheme(<PersonaShareSection data={DATA} />);
    fireEvent.press(getByTestId('persona-share-image'));

    await waitFor(() => {
      expect(mockShareAsync).toHaveBeenCalledWith(
        'file://card.png',
        expect.objectContaining({ mimeType: 'image/png' })
      );
      expect(mockTrackAnalysisShare).toHaveBeenCalledWith('integrated', 'image', 'mock_jwt_token');
    });
  });

  it('단일 축 카드의 제목·공유 계측 축을 소비처가 지정할 수 있다', async () => {
    mockCaptureRef.mockResolvedValue('file://skin-card.png');
    mockIsAvailable.mockResolvedValue(true);
    mockShareAsync.mockResolvedValue(undefined);

    const { getByTestId, getByText } = renderWithTheme(
      <PersonaShareSection
        analysisType="skin"
        data={DATA}
        dialogTitle="내 피부 카드 공유"
        heading="내 피부 카드"
        inviteText="나도 진단하기"
      />
    );

    expect(getByText('내 피부 카드')).toBeTruthy();
    expect(getByText('나도 진단하기')).toBeTruthy();
    fireEvent.press(getByTestId('persona-share-image'));

    await waitFor(() => {
      expect(mockShareAsync).toHaveBeenCalledWith(
        'file://skin-card.png',
        expect.objectContaining({ dialogTitle: '내 피부 카드 공유' })
      );
      expect(mockTrackAnalysisShare).toHaveBeenCalledWith('skin', 'image', 'mock_jwt_token');
    });
  });

  it('캡처 실패 시 정직하게 알린다 (조용한 무반응 금지)', async () => {
    mockCaptureRef.mockRejectedValue(new Error('capture failed'));

    const { getByTestId } = renderWithTheme(<PersonaShareSection data={DATA} />);
    fireEvent.press(getByTestId('persona-share-image'));

    await waitFor(() => {
      expect(getByTestId('persona-share-message')).toHaveTextContent(
        /카드 이미지를 만들지 못했어요/
      );
    });
    expect(mockShareAsync).not.toHaveBeenCalled();
    expect(mockTrackAnalysisShare).not.toHaveBeenCalled();
  });

  it('링크 공유는 톤·은유·랜딩 URL을 싣는다 (유입 귀속)', async () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });

    const { getByTestId } = renderWithTheme(<PersonaShareSection data={DATA} />);
    fireEvent.press(getByTestId('persona-share-text'));

    await waitFor(() => {
      expect(shareSpy).toHaveBeenCalledWith({
        message: '뮤티드 서머 — 여름 아침의 서늘한 빛을 닮은 사람\nhttps://yiroom.app/?ref=card',
      });
      expect(mockTrackAnalysisShare).toHaveBeenCalledWith('integrated', 'link', 'mock_jwt_token');
    });
    shareSpy.mockRestore();
  });

  it('링크 공유 시트를 닫으면 성공 이벤트를 기록하지 않는다', async () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'dismissedAction' });

    const { getByTestId } = renderWithTheme(<PersonaShareSection data={DATA} />);
    fireEvent.press(getByTestId('persona-share-text'));

    await waitFor(() => expect(shareSpy).toHaveBeenCalled());
    expect(mockTrackAnalysisShare).not.toHaveBeenCalled();
    shareSpy.mockRestore();
  });
});
